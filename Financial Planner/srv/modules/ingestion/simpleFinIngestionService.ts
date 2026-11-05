import { MessagingUtility } from "../shared/messagingUtility.js";

import { ALERTS } from "./constants.js";
import { SimpleFINMapper } from "./simpleFinMapper.js";
import type { DeduplicationService } from "./deduplicationService.js";
import type { SimpleFINAlertService } from "./simpleFinAlertService.js";
import type { SimpleFINDataService } from "./simpleFinDataService.js";
import type {
  AccountRecord,
  ConnectionRecord,
  SimpleFINAccount,
  SimpleFINSyncResult,
  SimpleFINTransaction,
} from "./types.js";

/**
 * Ingests a fetched SimpleFIN payload: resolves each account to its provider
 * account (auto-creating unknown ones as unmapped), drops pending rows, and
 * inserts only what the deduplication engine classifies as new.
 */
export class SimpleFINIngestionService {
  private readonly dataService: SimpleFINDataService;
  private readonly dedupService: DeduplicationService;
  private readonly alertService: SimpleFINAlertService;

  /**
   * Creates the ingester over the data, dedup and alert collaborators.
   * @param dataService Data-access layer for provider accounts and transactions.
   * @param dedupService Engine that classifies incoming transactions as new or duplicate.
   * @param alertService Raises the unmapped_account alert for auto-created accounts.
   */
  constructor(
    dataService: SimpleFINDataService,
    dedupService: DeduplicationService,
    alertService: SimpleFINAlertService,
  ) {
    this.dataService = dataService;
    this.dedupService = dedupService;
    this.alertService = alertService;
  }

  /**
   * Processes all accounts in a response, returning ingestion counters.
   * @param connection Owning connection, used for account resolution and alerts.
   * @param accounts Accounts from the SimpleFIN response.
   * @returns Created, duplicate, processed, and unmapped counts.
   */
  async ingestAccounts(
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
      const counts = await this._ingestTransactions(account, sfAccount);
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
   * Dedups and inserts posted transactions for one account.
   * @param account Resolved provider account (target of the inserts).
   * @param sfAccount Account block whose transactions to ingest.
   * @returns Created and duplicate counts for this account.
   */
  private async _ingestTransactions(
    account: AccountRecord,
    sfAccount: SimpleFINAccount,
  ): Promise<{ created: number; duplicates: number }> {
    let created = 0;
    let duplicates = 0;
    for (const sfTx of sfAccount.transactions) {
      if (this._isPending(sfTx)) {
        continue;
      }
      const incoming = SimpleFINMapper.toIncoming(sfTx, account);
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
   * True when a transaction is pending and must be discarded.
   * @param sfTx Transaction to test.
   * @returns True when the row is pending (unposted).
   */
  private _isPending(sfTx: SimpleFINTransaction): boolean {
    return sfTx.pending === true || sfTx.posted === 0;
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
    await this.alertService.raiseAlert(
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
}
