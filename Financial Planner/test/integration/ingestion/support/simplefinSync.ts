// Harness for the SimpleFIN integration test: wires the real sync engine to the
// in-memory DB with only the network call stubbed, and seeds the fixture world.
// Kept out of the test file so the test body reads as arrange-act-assert.

import { DeduplicationDataService } from "../../../../srv/modules/ingestion/deduplicationDataService.js";
import { DeduplicationService } from "../../../../srv/modules/ingestion/deduplicationService.js";
import { SimpleFINDataService } from "../../../../srv/modules/ingestion/simpleFinDataService.js";
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

import type { HttpClient } from "../../../../srv/modules/shared/types.js";
import type { SimpleFINResponse } from "../../../../srv/modules/ingestion/types.js";

// A valid 32-byte key (64 hex chars) for the encryption utility. Set here so it
// is in place before the test file's cds.test() and the first encrypt() call.
process.env["ENCRYPTION_KEY"] = "a".repeat(64);

export const CONNECTION = "com.financialplanner.ProviderConnection";
export const ACCOUNT = "com.financialplanner.ProviderAccount";
export const TRANSACTION = "com.financialplanner.Transaction";
export const ALERT = "com.financialplanner.Alert";

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

interface AlertRow {
  ID: string;
}

/** A one-shot HTTP client returning a fixed sync response (and the plaintext URL on claim). */
export function httpReturning(
  response: SimpleFINResponse,
): HttpClient {
  return {
    get: async () => ({ status: 200, data: response as never }),
    post: async () => ({ status: 200, data: ACCESS_URL_PLAINTEXT as never }),
  };
}

/** The real sync engine wired to the in-memory DB + a stub HTTP client. */
export function buildSimpleFinService(
  http: HttpClient,
): SimpleFINService {
  return new SimpleFINService(
    new SimpleFINDataService(),
    new DeduplicationService(new DeduplicationDataService()),
    {
      http,
      encryptionFactory: () => new EncryptionUtility(),
      sleep: async () => undefined,
    },
  );
}

/** Reads one provider connection by primary key (undefined when none matches). */
export async function readConnection(id: string): Promise<ConnectionRow> {
  return (await SELECT.one.from(CONNECTION).where({ ID: id })) as ConnectionRow;
}

/** Reads every transaction that was ingested from SimpleFIN. */
export async function readSimpleFinTransactions(): Promise<TransactionRow[]> {
  return (await SELECT.from(TRANSACTION).where({
    source: "simplefin",
  })) as TransactionRow[];
}

/** Reads one provider account by its external (bank-side) account id. */
export async function readAccountByExternalId(
  externalAccountId: string,
): Promise<AccountRow> {
  return (await SELECT.one
    .from(ACCOUNT)
    .where({ externalAccountId })) as AccountRow;
}

/** Reads one transaction by its external (provider-side) id. */
export async function readTransactionByExternalId(
  externalId: string,
): Promise<TransactionRow> {
  return (await SELECT.one
    .from(TRANSACTION)
    .where({ externalId })) as TransactionRow;
}

/** Reads every alert raised against a given provider connection. */
export async function readAlertsForConnection(
  connectionId: string,
): Promise<AlertRow[]> {
  return (await SELECT.from(ALERT).where({
    providerConnection_ID: connectionId,
  })) as AlertRow[];
}

/** Links a provider account to a card instance, as the user would when mapping it. */
export async function mapAccountToCard(
  accountId: string,
  cardInstanceId: string,
): Promise<void> {
  await UPDATE(ACCOUNT)
    .set({ cardInstance_ID: cardInstanceId })
    .where({ ID: accountId });
}

/** Seeds the card world plus one mapped SimpleFIN connection/account into SQLite. */
export async function seedSimpleFin(): Promise<void> {
  const encryption = new EncryptionUtility();
  await INSERT.into("com.financialplanner.MarketCard").entries([AMEX_COBALT]);
  await INSERT.into("com.financialplanner.Offer").entries([
    AMEX_COBALT_DEC2025_OFFER,
  ]);
  await INSERT.into("com.financialplanner.CardInstance").entries([
    AMEX_COBALT_INSTANCE,
  ]);
  await INSERT.into(CONNECTION).entries([
    { ...CONNECTION_SEED, accessUrlEnc: encryption.encrypt(ACCESS_URL_PLAINTEXT) },
  ]);
  await INSERT.into(ACCOUNT).entries([{ ...ACCOUNT_MAPPED_SEED }]);
}
