import cds from "@sap/cds";

import { BaseService } from "../shared/baseService.js";
import { HTTP } from "../shared/constants.js";
import { DateTimeUtility } from "../shared/dateTimeUtility.js";
import { defaultEncryptionFactory } from "../shared/encryptionFactory.js";
import { MessagingUtility } from "../shared/messagingUtility.js";
import { defaultHttpClient } from "../shared/httpClient.js";
import { defaultSleep } from "../shared/sleep.js";
import type { EncryptionUtility } from "../shared/encryptionUtility.js";
import type { EncryptionFactory, HttpClient, SleepFn } from "../shared/types.js";

import { ALERTS, SCHEDULE, SYNC_DEFAULTS } from "./constants.js";
import { SimpleFINMapper } from "./simpleFinMapper.js";
import { SimpleFINValidator } from "./simpleFinValidator.js";
import type { DeduplicationService } from "./deduplicationService.js";
import type { SimpleFINDataService } from "./simpleFinDataService.js";
import type {
  AccountRecord,
  ConnectionRecord,
  SimpleFINAccount,
  SimpleFINResponse,
  SimpleFINServiceOptions,
  SimpleFINSyncResult,
  SimpleFINTransaction,
} from "./types.js";

/**
 * SimpleFIN Bridge transaction sync engine.
 *
 * Pulls posted transactions for each active Provider Connection, maps accounts
 * to card instances, runs every row through the deduplication engine,
 * and raises connection_error / stale_data / unmapped_account alerts. The
 * encrypted Access URL is decrypted only in-memory and never logged.
 */
export class SimpleFINService extends BaseService {
  private readonly dataService: SimpleFINDataService;
  private readonly dedupService: DeduplicationService;
  private readonly http: HttpClient;
  private readonly sleep: SleepFn;
  private readonly now: () => number;
  private readonly encryptionFactory: EncryptionFactory;
  private encryption?: EncryptionUtility;

  /**
   * Creates the sync engine with injected data + dedup collaborators.
   * @param dataService Data-access layer for connections, accounts, and transactions.
   * @param dedupService Engine that classifies incoming transactions as new or duplicate.
   * @param options Optional test seams (HTTP client, sleep, encryption, clock).
   */
  constructor(
    dataService: SimpleFINDataService,
    dedupService: DeduplicationService,
    options: SimpleFINServiceOptions = {},
  ) {
    super("integration.simplefin");
    this.dataService = dataService;
    this.dedupService = dedupService;
    this.http = options.http ?? defaultHttpClient;
    this.sleep = options.sleep ?? defaultSleep;
    this.now = options.now ?? (() => Date.now());
    this.encryptionFactory = options.encryptionFactory ?? defaultEncryptionFactory;
  }

  /**
   * Claims a SimpleFIN setup token and stores the encrypted Access URL.
   * @param setupToken Base64 setup token pasted from the SimpleFIN bridge.
   * @param displayName User-facing name for the new connection.
   * @returns The id of the created provider connection.
   */
  async claimConnection(setupToken: string, displayName: string): Promise<string> {
    const claimUrl = Buffer.from(setupToken, "base64").toString("utf-8");
    const response = await this.http.post<string>(claimUrl);
    const accessUrl = String(response.data);
    const accessUrlEnc = this._getEncryption().encrypt(accessUrl);
    this.logger.info("STATE_CHANGE", "SimpleFIN connection claimed");
    return this.dataService.createConnection({ displayName, accessUrlEnc });
  }

  /** Syncs every active connection (scheduled daily run). */
  async syncAllActive(): Promise<void> {
    const connections = await this.dataService.getActiveConnections();
    for (const connection of connections) {
      await this._syncOne(connection);
    }
  }

  /**
   * Manually syncs a single connection ("Sync Now").
   * @param connectionId Connection to sync.
   * @returns Ingestion counters and the resulting sync status.
   */
  async syncConnection(connectionId: string): Promise<SimpleFINSyncResult> {
    const connection = await this.dataService.getConnection(connectionId);
    if (!connection) {
      return {
        created: 0,
        duplicates: 0,
        accountsProcessed: 0,
        unmapped: 0,
        status: "error",
      };
    }
    return this._syncOne(connection);
  }

  /**
   * Returns the configured daily sync time (HH:MM), defaulting to 20:00.
   * @returns The configured sync time, or "20:00" when unset.
   */
  async getSyncTime(): Promise<string> {
    const raw = await this.dataService.getConfig("SIMPLEFIN_SYNC_TIME");
    return raw ?? SCHEDULE.DEFAULT_TIME;
  }

  /** Raises stale_data alerts for connections past the threshold. */
  async checkStaleConnections(): Promise<void> {
    const staleDays = await this.dataService.getNumericConfig(
      "SIMPLEFIN_STALE_DAYS",
      SYNC_DEFAULTS.STALE_DAYS,
    );
    const threshold = DateTimeUtility.getMillisDaysBefore(this.now(), staleDays);
    const candidates = await this.dataService.getStaleCandidates();
    for (const connection of candidates) {
      if (!connection.lastSyncAt) {
        continue;
      }
      if (new Date(connection.lastSyncAt).getTime() < threshold) {
        await this._raiseAlert(
          ALERTS.TYPE.STALE_DATA,
          ALERTS.SEVERITY.WARNING,
          MessagingUtility.getText("ingestion.simplefin.staleDataTitle"),
          MessagingUtility.getText("ingestion.simplefin.staleData", [
            connection.displayName,
            String(staleDays),
          ]),
          connection.ID,
        );
      }
    }
  }

  /**
   * Backfills null-card transactions when an account is mapped.
   * @param providerAccountId Provider account whose transactions to backfill.
   * @returns The number of transactions updated.
   */
  async backfillCardMapping(providerAccountId: string): Promise<number> {
    const account = await this.dataService.getProviderAccountById(providerAccountId);
    if (!account || !account.cardInstance_ID) {
      return 0;
    }
    const count = await this.dataService.backfillTransactions(
      providerAccountId,
      account.cardInstance_ID,
    );
    this.logger.info("BATCH_RESULT", "Backfilled mapped transactions", {
      providerAccountId,
      count,
    });
    return count;
  }

  /**
   * "Sync Now" handler — syncs the bound connection and returns a summary.
   * @param req Bound request carrying the connection key in params.
   * @returns A localized summary of created and duplicate counts.
   */
  async runManualSync(req: cds.Request): Promise<string> {
    const params = req.params?.[0] as { ID?: string } | undefined;
    const result = await this.syncConnection(params?.ID ?? "");
    return MessagingUtility.getText("ingestion.simplefin.syncResult", [
      String(result.created),
      String(result.duplicates),
    ]);
  }

  /**
   * "Add Connection" handler — validates then claims a setup token.
   * @param req Request carrying setupToken and displayName in data.
   * @returns The new connection id, or undefined when validation fails.
   */
  async claim(req: cds.Request): Promise<string | undefined> {
    const setupToken = (req.data?.setupToken ?? null) as string | null;
    const displayName = (req.data?.displayName ?? null) as string | null;
    const errors = SimpleFINValidator.validateClaimRequest({
      setupToken,
      displayName,
    });
    if (errors.length > 0) {
      for (const error of errors) {
        req.error({
          code: error.messageKey,
          message: MessagingUtility.getText(error.messageKey),
          target: error.field,
          status: 400,
        });
      }
      return undefined;
    }
    return this.claimConnection(setupToken as string, displayName as string);
  }

  /**
   * Provider-account update handler — backfills on card mapping change.
   * @param req After-update request carrying the provider account key.
   */
  async handleAccountMapping(req: cds.Request): Promise<void> {
    const params = req.params?.[0] as { ID?: string } | undefined;
    if (params?.ID) {
      await this.backfillCardMapping(params.ID);
    }
  }

  /**
   * Runs the full sync for one connection and updates its status.
   * @param connection Connection record to sync.
   * @returns Ingestion counters and the resulting sync status.
   */
  private async _syncOne(
    connection: ConnectionRecord,
  ): Promise<SimpleFINSyncResult> {
    const accessUrl = this._getEncryption().decrypt(connection.accessUrlEnc);
    const lookbackDays = await this.dataService.getNumericConfig(
      "SIMPLEFIN_LOOKBACK_DAYS",
      SYNC_DEFAULTS.LOOKBACK_DAYS,
    );
    const retryAttempts = await this.dataService.getNumericConfig(
      "SIMPLEFIN_RETRY_ATTEMPTS",
      SYNC_DEFAULTS.RETRY_ATTEMPTS,
    );
    const startEpoch = DateTimeUtility.getEpochSecondsDaysBefore(
      this.now(),
      lookbackDays,
    );
    const url = `${accessUrl}/accounts?start-date=${startEpoch}`;

    const body = await this._fetchAccounts(url, retryAttempts, connection);
    if (!body) {
      return {
        created: 0,
        duplicates: 0,
        accountsProcessed: 0,
        unmapped: 0,
        status: "error",
      };
    }

    const hadErrors = body.errors.length > 0;
    if (hadErrors) {
      await this._raiseAlert(
        ALERTS.TYPE.CONNECTION_ERROR,
        ALERTS.SEVERITY.CRITICAL,
        MessagingUtility.getText("ingestion.simplefin.connectionErrorTitle"),
        MessagingUtility.getText("ingestion.simplefin.bankError", [
          connection.displayName,
          body.errors.join("; "),
        ]),
        connection.ID,
      );
    }

    const result = await this._processAccounts(connection, body.accounts);
    const nowIso = new Date(this.now()).toISOString();
    await this.dataService.updateConnectionSync(connection.ID, {
      lastSyncAt: nowIso,
      lastSyncStatus: hadErrors ? "error" : "success",
      lastErrorMessage: hadErrors ? body.errors.join("; ") : null,
    });
    return { ...result, status: hadErrors ? "error" : "success" };
  }

  /**
   * Processes all accounts in a response, returning ingestion counters.
   * @param connection Owning connection, used for account resolution and alerts.
   * @param accounts Accounts from the SimpleFIN response.
   * @returns Created, duplicate, processed, and unmapped counts.
   */
  private async _processAccounts(
    connection: ConnectionRecord,
    accounts: SimpleFINAccount[],
  ): Promise<Omit<SimpleFINSyncResult, "status">> {
    let created = 0;
    let duplicates = 0;
    let unmapped = 0;
    for (const sfAccount of accounts) {
      const { account, isNew } = await this._resolveAccount(
        connection,
        sfAccount,
      );
      if (isNew) {
        unmapped++;
      }
      const counts = await this._processTransactions(account, sfAccount);
      created += counts.created;
      duplicates += counts.duplicates;
    }
    return {
      created,
      duplicates,
      accountsProcessed: accounts.length,
      unmapped,
    };
  }

  /**
   * Finds or auto-creates the provider account for a SimpleFIN account.
   * @param connection Owning connection.
   * @param sfAccount Account block from the SimpleFIN response.
   * @returns The resolved account and whether it was newly created.
   */
  private async _resolveAccount(
    connection: ConnectionRecord,
    sfAccount: SimpleFINAccount,
  ): Promise<{ account: AccountRecord; isNew: boolean }> {
    const existing = await this.dataService.getProviderAccount(
      connection.ID,
      sfAccount.id,
    );
    if (existing) {
      return { account: existing, isNew: false };
    }
    const id = await this.dataService.createProviderAccount({
      providerConnection_ID: connection.ID,
      externalAccountId: sfAccount.id,
      accountName: sfAccount.name,
      cardInstance_ID: null,
      isActive: true,
    });
    await this._raiseAlert(
      ALERTS.TYPE.UNMAPPED_ACCOUNT,
      ALERTS.SEVERITY.INFO,
      MessagingUtility.getText("ingestion.simplefin.unmappedAccountTitle"),
      MessagingUtility.getText("ingestion.simplefin.unmappedAccount", [
        sfAccount.name,
      ]),
      connection.ID,
    );
    return {
      account: {
        ID: id,
        cardInstance_ID: null,
        externalAccountId: sfAccount.id,
        isActive: true,
      },
      isNew: true,
    };
  }

  /**
   * Dedups and inserts posted transactions for one account.
   * @param account Resolved provider account (target of the inserts).
   * @param sfAccount Account block whose transactions to ingest.
   * @returns Created and duplicate counts for this account.
   */
  private async _processTransactions(
    account: AccountRecord,
    sfAccount: SimpleFINAccount,
  ): Promise<{ created: number; duplicates: number }> {
    let created = 0;
    let duplicates = 0;
    for (const sfTx of sfAccount.transactions) {
      if (this._isPending(sfTx)) {
        continue;
      }
      const incoming = SimpleFINMapper.toIncoming(sfTx, account.cardInstance_ID);
      const dedup = await this.dedupService.evaluate(incoming);
      if (dedup.outcome === "duplicate") {
        duplicates++;
        continue;
      }
      await this.dataService.insertTransaction(
        SimpleFINMapper.toTransactionRow(sfTx, account),
      );
      created++;
    }
    return { created, duplicates };
  }

  /**
   * Fetches the accounts endpoint with exponential-backoff retry.
   * @param url Fully-formed accounts URL including the start-date query.
   * @param retryAttempts Number of retries after the initial attempt.
   * @param connection Connection used for error logging and alerting.
   * @returns The parsed response, or null after all attempts fail.
   */
  private async _fetchAccounts(
    url: string,
    retryAttempts: number,
    connection: ConnectionRecord,
  ): Promise<SimpleFINResponse | null> {
    let lastError = "";
    for (let attempt = 0; attempt <= retryAttempts; attempt++) {
      try {
        const response = await this.http.get<SimpleFINResponse>(url);
        if (
          response.status >= HTTP.SUCCESS_MIN &&
          response.status < HTTP.SUCCESS_MAX
        ) {
          return response.data;
        }
        lastError = `HTTP ${response.status}`;
      } catch (error: unknown) {
        lastError = error instanceof Error ? error.message : String(error);
      }
      if (attempt < retryAttempts) {
        await this.sleep(SYNC_DEFAULTS.BACKOFF_BASE_MS * 2 ** attempt);
      }
    }
    this.logger.error("EXTERNAL_CALL", "SimpleFIN fetch failed after retries", {
      connectionId: connection.ID,
      error: lastError,
    });
    await this._raiseAlert(
      ALERTS.TYPE.CONNECTION_ERROR,
      ALERTS.SEVERITY.CRITICAL,
      MessagingUtility.getText("ingestion.simplefin.connectionErrorTitle"),
      MessagingUtility.getText("ingestion.simplefin.connectionError", [
        connection.displayName,
      ]),
      connection.ID,
    );
    await this.dataService.updateConnectionSync(connection.ID, {
      lastSyncAt: connection.lastSyncAt,
      lastSyncStatus: "error",
      lastErrorMessage: lastError,
    });
    return null;
  }

  /**
   * Creates an alert, suppressing duplicates already active for the connection.
   * @param typeName Alert type display name (seeded reference data).
   * @param severityName Alert severity display name (seeded reference data).
   * @param title Alert title.
   * @param message Alert body.
   * @param connectionId Connection the alert is raised against.
   */
  private async _raiseAlert(
    typeName: string,
    severityName: string,
    title: string,
    message: string,
    connectionId: string,
  ): Promise<void> {
    const alertTypeId = await this.dataService.getAlertTypeId(typeName);
    const alertSeverityId = await this.dataService.getAlertSeverityId(severityName);
    if (!alertTypeId || !alertSeverityId) {
      this.logger.warn("STATE_CHANGE", "Alert reference data missing", {
        typeName,
        severityName,
      });
      return;
    }
    const existing = await this.dataService.findActiveAlert(
      alertTypeId,
      connectionId,
    );
    if (existing) {
      return;
    }
    await this.dataService.createAlert({
      alertType_ID: alertTypeId,
      alertSeverity_ID: alertSeverityId,
      title,
      message,
      providerConnection_ID: connectionId,
      status: "active",
    });
  }

  /**
   * True when a transaction is pending and must be discarded.
   * @param sfTx Transaction to test.
   * @returns True when the row is pending (unposted).
   */
  private _isPending(sfTx: SimpleFINTransaction): boolean {
    return sfTx.pending === true || sfTx.posted === 0;
  }

  /**
   * Lazily builds (and memoizes) the encryption utility via the factory.
   * Deferred so ENCRYPTION_KEY is only required when a sensitive field is read.
   * @returns The encryption utility instance.
   */
  private _getEncryption(): EncryptionUtility {
    if (!this.encryption) {
      this.encryption = this.encryptionFactory();
    }
    return this.encryption;
  }
}
