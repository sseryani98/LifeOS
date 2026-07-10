import cds from "@sap/cds";

import { ENTITIES } from "./constants.js";
import type {
  AccountRecord,
  ConnectionRecord,
  ConnectionSyncPatch,
} from "./types.js";

/**
 * Data-access layer for the SimpleFIN sync engine.
 */
export class SimpleFINDataService {
  /**
   * Reads a System Config value by key, or null when absent.
   *
   * @param key System Config key to look up.
   * @returns Stored value, or null if no row matches.
   */
  async getConfig(key: string): Promise<string | null> {
    const row = (await SELECT.one
      .from(ENTITIES.SYSTEM_CONFIG)
      .columns("value")
      .where({ key })) as { value: string } | undefined;
    return row?.value ?? null;
  }

  /**
   * Reads a numeric System Config value, falling back to a default.
   *
   * @param key System Config key to read.
   * @param fallback Value used when the key is missing or non-numeric.
   * @returns The parsed config value, or the fallback.
   */
  async getNumericConfig(key: string, fallback: number): Promise<number> {
    const raw = await this.getConfig(key);
    const parsed = raw === null ? Number.NaN : Number.parseInt(raw, 10);
    return Number.isNaN(parsed) ? fallback : parsed;
  }

  /**
   * Loads one connection by id.
   *
   * @param id Provider connection id.
   * @returns Matching connection, or null if not found.
   */
  async getConnection(id: string): Promise<ConnectionRecord | null> {
    const row = (await SELECT.one
      .from(ENTITIES.CONNECTION)
      .where({ ID: id })) as ConnectionRecord | undefined;
    return row ?? null;
  }

  /**
   * Lists all active connections (daily sync).
   *
   * @returns Every active provider connection.
   */
  async getActiveConnections(): Promise<ConnectionRecord[]> {
    return (await SELECT.from(ENTITIES.CONNECTION).where({
      isActive: true,
    })) as ConnectionRecord[];
  }

  /**
   * Lists active connections that have synced at least once (stale check).
   *
   * @returns Active connections eligible for staleness evaluation.
   */
  async getStaleCandidates(): Promise<ConnectionRecord[]> {
    return (await SELECT.from(ENTITIES.CONNECTION).where({
      isActive: true,
      lastSyncAt: { "!=": null },
    })) as ConnectionRecord[];
  }

  /**
   * Updates connection sync status / timestamp / error after a sync run.
   *
   * @param id Provider connection id to update.
   * @param patch Sync outcome fields to write.
   */
  async updateConnectionSync(
    id: string,
    patch: ConnectionSyncPatch,
  ): Promise<void> {
    await UPDATE(ENTITIES.CONNECTION).set(patch).where({ ID: id });
  }

  /**
   * Inserts a new connection, returning its generated id.
   *
   * @param data Display name and encrypted access URL for the connection.
   * @param data.displayName Human-readable connection name.
   * @param data.accessUrlEnc Encrypted SimpleFIN access URL.
   * @returns Generated connection id.
   */
  async createConnection(data: {
    displayName: string;
    accessUrlEnc: string;
  }): Promise<string> {
    const id = cds.utils.uuid();
    await INSERT.into(ENTITIES.CONNECTION).entries({
      ID: id,
      providerType: "simplefin",
      displayName: data.displayName,
      accessUrlEnc: data.accessUrlEnc,
      lastSyncStatus: "never_synced",
      isActive: true,
    });
    return id;
  }

  /**
   * Finds a provider account by external id within a connection.
   *
   * @param connectionId Owning provider connection id.
   * @param externalAccountId Provider-side account identifier.
   * @returns Matching account, or null if none exists.
   */
  async getProviderAccount(
    connectionId: string,
    externalAccountId: string,
  ): Promise<AccountRecord | null> {
    const row = (await SELECT.one.from(ENTITIES.ACCOUNT).where({
      providerConnection_ID: connectionId,
      externalAccountId,
    })) as AccountRecord | undefined;
    return row ?? null;
  }

  /**
   * Loads one provider account by id.
   *
   * @param id Provider account id.
   * @returns Matching account, or null if not found.
   */
  async getProviderAccountById(id: string): Promise<AccountRecord | null> {
    const row = (await SELECT.one
      .from(ENTITIES.ACCOUNT)
      .where({ ID: id })) as AccountRecord | undefined;
    return row ?? null;
  }

  /**
   * Auto-creates a provider account (unmapped — null card), returning its id.
   *
   * @param data Account fields including owning connection and external id.
   * @param data.providerConnection_ID Owning provider connection id.
   * @param data.externalAccountId Provider-side account identifier.
   * @param data.accountName Human-readable account name.
   * @param data.cardInstance_ID Mapped card instance id, or null when unmapped.
   * @param data.isActive Whether the account is active.
   * @returns Generated provider account id.
   */
  async createProviderAccount(data: {
    providerConnection_ID: string;
    externalAccountId: string;
    accountName: string;
    cardInstance_ID: string | null;
    isActive: boolean;
  }): Promise<string> {
    const id = cds.utils.uuid();
    await INSERT.into(ENTITIES.ACCOUNT).entries({ ID: id, ...data });
    return id;
  }

  /**
   * Inserts an ingested transaction.
   *
   * @param data Transaction row to insert.
   */
  async insertTransaction(data: Record<string, unknown>): Promise<void> {
    await INSERT.into(ENTITIES.TRANSACTION).entries(data);
  }

  /**
   * Backfills null-card transactions on an account, returning the count.
   *
   * @param providerAccountId Account whose unmapped transactions are updated.
   * @param cardInstanceId Card instance to assign to those transactions.
   * @returns Number of transactions updated.
   */
  async backfillTransactions(
    providerAccountId: string,
    cardInstanceId: string,
  ): Promise<number> {
    const affected = await UPDATE(ENTITIES.TRANSACTION)
      .set({ cardInstance_ID: cardInstanceId })
      .where({ providerAccount_ID: providerAccountId, cardInstance_ID: null });
    return typeof affected === "number" ? affected : 0;
  }

  /**
   * Resolves an AlertType id by its display name.
   *
   * @param name Alert type display name.
   * @returns Alert type id, or null if unknown.
   */
  async getAlertTypeId(name: string): Promise<string | null> {
    const row = (await SELECT.one
      .from(ENTITIES.ALERT_TYPE)
      .columns("ID")
      .where({ name })) as { ID: string } | undefined;
    return row?.ID ?? null;
  }

  /**
   * Resolves an AlertSeverity id by its display name.
   *
   * @param name Alert severity display name.
   * @returns Alert severity id, or null if unknown.
   */
  async getAlertSeverityId(name: string): Promise<string | null> {
    const row = (await SELECT.one
      .from(ENTITIES.ALERT_SEVERITY)
      .columns("ID")
      .where({ name })) as { ID: string } | undefined;
    return row?.ID ?? null;
  }

  /**
   * Finds an active alert of a type for a connection (dedupe of alerts).
   *
   * @param alertTypeId Alert type to match.
   * @param providerConnectionId Connection the alert belongs to.
   * @returns The existing active alert id wrapper, or null if none.
   */
  async findActiveAlert(
    alertTypeId: string,
    providerConnectionId: string,
  ): Promise<{ ID: string } | null> {
    const row = (await SELECT.one
      .from(ENTITIES.ALERT)
      .columns("ID")
      .where({
        alertType_ID: alertTypeId,
        providerConnection_ID: providerConnectionId,
        status: "active",
      })) as { ID: string } | undefined;
    return row ?? null;
  }

  /**
   * Inserts an alert.
   *
   * @param data Alert row to insert.
   */
  async createAlert(data: Record<string, unknown>): Promise<void> {
    await INSERT.into(ENTITIES.ALERT).entries(data);
  }
}
