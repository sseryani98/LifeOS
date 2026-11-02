// Harness for the SimpleFIN integration test: the real sync engine on the
// in-memory DB with only the network call stubbed, seed + read helpers, and the
// production facade bound so OData requests reach the real handlers.

import cds from "@sap/cds";

import { DeduplicationDataService } from "../../../../srv/modules/ingestion/deduplicationDataService.js";
import { DeduplicationService } from "../../../../srv/modules/ingestion/deduplicationService.js";
import { SimpleFINDataService } from "../../../../srv/modules/ingestion/simpleFinDataService.js";
import { SimpleFINFacade } from "../../../../srv/modules/ingestion/simpleFinFacade.js";
import { SimpleFINService } from "../../../../srv/modules/ingestion/simpleFinService.js";
import { EncryptionUtility } from "../../../../srv/modules/shared/encryptionUtility.js";

import {
  AMEX_COBALT,
  AMEX_COBALT_DEC2025_OFFER,
  AMEX_COBALT_INSTANCE,
} from "../../../shared/data/cards.js";
import {
  ACCESS_URL_PLAINTEXT,
  ACCOUNT_MAPPED_SEED,
  CONNECTION_SEED,
} from "../../../shared/data/ingestion/simplefin.js";
import {
  REMAP_TARGET_CARD_INSTANCE,
  RESPONSE_FACADE_SYNC,
} from "../data/simplefinSync.js";

import type { HttpClient } from "../../../../srv/modules/shared/types.js";
import type { SimpleFINResponse } from "../../../../srv/modules/ingestion/types.js";

// A valid 32-byte key (64 hex chars) for the encryption utility. Set here so it
// is in place before the test file's cds.test() and the first encrypt() call.
process.env["ENCRYPTION_KEY"] = "a".repeat(64);

export const CONNECTION = "com.financialplanner.ProviderConnection";
export const ACCOUNT = "com.financialplanner.ProviderAccount";
export const TRANSACTION = "com.financialplanner.Transaction";
export const ALERT = "com.financialplanner.Alert";

const SERVICE_PATH = "/service/adminSvcs";
const SERVICE_NAME = "AdminService";

interface ConnectionRow {
  ID: string;
  accessUrlEnc: string;
  lastSyncStatus: string;
  lastSyncAt: string | null;
}

interface AccountRow {
  ID: string;
  cardInstance_ID: string | null;
  externalAccountId: string;
}

interface TransactionRow {
  ID: string;
  externalId: string;
  cardInstance_ID: string | null;
  rawDescription: string;
  postedAt: string;
  amount: number;
}

/** An alert with its reference names resolved, in the shape the spec asserts on. */
export interface AlertWithTypeRow {
  ID: string;
  status: string;
  alertTypeName: string;
  alertSeverityName: string;
}

type PostFn = <TResponse>(
  url: string,
  data: Record<string, unknown>,
) => Promise<TResponse>;

type PatchFn = <TResponse>(
  url: string,
  data: Record<string, unknown>,
) => Promise<TResponse>;

/** The syncNow / claimSetupToken actions' OData response — a bare String. */
export interface StringActionResponse {
  status: number;
  data: { value: string };
}

/** A PATCH response; only the status is asserted. */
export interface PatchResponse {
  status: number;
}

/** The OData callers the spec drives the AdminService surface through. */
export interface SimpleFinActions {
  postSyncNow: (connectionId: string) => Promise<StringActionResponse>;
  postClaimSetupToken: (
    payload: Record<string, unknown>,
  ) => Promise<StringActionResponse>;
  patchProviderAccount: (
    accountId: string,
    payload: Record<string, unknown>,
  ) => Promise<PatchResponse>;
}

/** A one-shot HTTP client returning a fixed sync response (and the plaintext URL on claim). */
export const httpReturning = (
  response: SimpleFINResponse,
): HttpClient => {
  return {
    get: async () => ({ status: 200, data: response as never }),
    post: async () => ({ status: 200, data: ACCESS_URL_PLAINTEXT as never }),
  };
};

/** The real sync engine wired to the in-memory DB + a stub HTTP client (and, optionally, a fixed clock). */
export const buildSimpleFinService = (
  http: HttpClient,
  now?: () => number,
): SimpleFINService => {
  return new SimpleFINService(
    new SimpleFINDataService(),
    new DeduplicationService(new DeduplicationDataService()),
    {
      http,
      encryptionFactory: () => new EncryptionUtility(),
      sleep: async () => undefined,
      ...(now ? { now } : {}),
    },
  );
};

/** The engine as AdminService wires it — default encryption, clock and sleep — with only the network stubbed. */
export const buildDefaultWiredSimpleFinService = (
  http: HttpClient,
): SimpleFINService => {
  return new SimpleFINService(
    new SimpleFINDataService(),
    new DeduplicationService(new DeduplicationDataService()),
    { http },
  );
};

/**
 * Registers the production SimpleFIN facade on the served AdminService.
 * cds.test cannot load the TypeScript service impl, so the facade is bound here
 * to put the real srv.on/srv.after wiring and the req.params seam under test.
 */
export const registerSimpleFinHandlers = async (): Promise<void> => {
  const srv = (await cds.connect.to(SERVICE_NAME)) as cds.ApplicationService;
  new SimpleFINFacade(
    srv,
    buildSimpleFinService(httpReturning(RESPONSE_FACADE_SYNC)),
  ).registerHandlers();
};

/** Binds the AdminService OData callers to the cds.test POST/PATCH handles. */
export const buildSimpleFinActions = (
  post: PostFn,
  patch: PatchFn,
): SimpleFinActions => {
  /** Invokes the bound syncNow action on one connection. */
  const postSyncNow = async (
    connectionId: string,
  ): Promise<StringActionResponse> => {
    return post<StringActionResponse>(
      `${SERVICE_PATH}/ProviderConnections(${connectionId})/${SERVICE_NAME}.syncNow`,
      {},
    );
  };

  /** Invokes the unbound claimSetupToken action. */
  const postClaimSetupToken = async (
    payload: Record<string, unknown>,
  ): Promise<StringActionResponse> => {
    return post<StringActionResponse>(`${SERVICE_PATH}/claimSetupToken`, payload);
  };

  /** Updates one provider account, as the mapping UI does. */
  const patchProviderAccount = async (
    accountId: string,
    payload: Record<string, unknown>,
  ): Promise<PatchResponse> => {
    return patch<PatchResponse>(
      `${SERVICE_PATH}/ProviderAccounts(${accountId})`,
      payload,
    );
  };

  return { postSyncNow, postClaimSetupToken, patchProviderAccount };
};

/** Reads one provider connection by primary key (undefined when none matches). */
export const readConnection = async (id: string): Promise<ConnectionRow> => {
  return (await SELECT.one.from(CONNECTION).where({ ID: id })) as ConnectionRow;
};

/** Reads one provider account by its external (bank-side) account id. */
export const readAccountByExternalId = async (
  externalAccountId: string,
): Promise<AccountRow> => {
  return (await SELECT.one
    .from(ACCOUNT)
    .where({ externalAccountId })) as AccountRow;
};

/** Reads one transaction by its external (provider-side) id. */
export const readTransactionByExternalId = async (
  externalId: string,
): Promise<TransactionRow> => {
  return (await SELECT.one
    .from(TRANSACTION)
    .where({ externalId })) as TransactionRow;
};

/** Reads every transaction carrying the given external id (duplicates included). */
export const readTransactionsByExternalId = async (
  externalId: string,
): Promise<TransactionRow[]> => {
  return (await SELECT.from(TRANSACTION).where({ externalId })) as TransactionRow[];
};

/** Reads the alerts raised against a connection, with type and severity names resolved. */
export const readAlertsWithTypeForConnection = async (
  connectionId: string,
): Promise<AlertWithTypeRow[]> => {
  return (await SELECT.from(ALERT)
    .columns(
      "ID",
      "status",
      "alertType.name as alertTypeName",
      "alertSeverity.name as alertSeverityName",
    )
    .where({ providerConnection_ID: connectionId })) as AlertWithTypeRow[];
};

/** Links a provider account to a card instance directly in the DB (no handlers fire). */
export const mapAccountToCard = async (
  accountId: string,
  cardInstanceId: string,
): Promise<void> => {
  await UPDATE(ACCOUNT)
    .set({ cardInstance_ID: cardInstanceId })
    .where({ ID: accountId });
};

/** Seeds connections, each with a freshly encrypted access URL. */
export const seedConnections = async (
  connections: Record<string, unknown>[],
): Promise<void> => {
  const encryption = new EncryptionUtility();
  await INSERT.into(CONNECTION).entries(
    connections.map(connection => ({
      ...connection,
      accessUrlEnc: encryption.encrypt(ACCESS_URL_PLAINTEXT),
    })),
  );
};

/** Persists a transaction a previous sync stored. */
export const seedSyncedTransaction = async (
  transaction: Record<string, unknown>,
): Promise<void> => {
  await INSERT.into(TRANSACTION).entries([{ ...transaction }]);
};

/** Seeds a provider account together with one transaction already stored on it. */
export const seedAccountWithTransaction = async (
  account: Record<string, unknown>,
  transaction: Record<string, unknown>,
): Promise<void> => {
  await INSERT.into(ACCOUNT).entries([{ ...account }]);
  await INSERT.into(TRANSACTION).entries([{ ...transaction }]);
};

/** Seeds the card world plus one mapped SimpleFIN connection/account into SQLite. */
export const seedSimpleFin = async (): Promise<void> => {
  await INSERT.into("com.financialplanner.MarketCard").entries([AMEX_COBALT]);
  await INSERT.into("com.financialplanner.Offer").entries([
    AMEX_COBALT_DEC2025_OFFER,
  ]);
  await INSERT.into("com.financialplanner.CardInstance").entries([
    AMEX_COBALT_INSTANCE,
    REMAP_TARGET_CARD_INSTANCE,
  ]);
  await seedConnections([{ ...CONNECTION_SEED }]);
  await INSERT.into(ACCOUNT).entries([{ ...ACCOUNT_MAPPED_SEED }]);
};
