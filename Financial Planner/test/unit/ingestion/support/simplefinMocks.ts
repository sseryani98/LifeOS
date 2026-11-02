// Harness for the SimpleFINService unit test: builds the service wired to fully
// mocked collaborators. Kept out of the test file so each test reads as
// arrange-act-assert rather than mock plumbing.

import { SimpleFINService } from "../../../../srv/modules/ingestion/simpleFinService.js";

import {
  ACCESS_URL_PLAINTEXT,
  ACCOUNT_MAPPED,
  CONNECTION_ACTIVE,
  CONNECTION_ID,
} from "../../../shared/data/ingestion/simplefin.js";
import { ALERT_SEVERITY_IDS, ALERT_TYPE_IDS } from "../data/simplefin.js";

import type { SimpleFINDataService } from "../../../../srv/modules/ingestion/simpleFinDataService.js";
import type { DeduplicationService } from "../../../../srv/modules/ingestion/deduplicationService.js";
import type { EncryptionUtility } from "../../../../srv/modules/shared/encryptionUtility.js";

const CONFIG: Record<string, string> = {
  SIMPLEFIN_LOOKBACK_DAYS: "7",
  SIMPLEFIN_RETRY_ATTEMPTS: "3",
  SIMPLEFIN_STALE_DAYS: "3",
};

/** Fixed "now" so lookback windows and stale checks are deterministic. */
export const FIXED_NOW = Date.parse("2026-06-29T12:00:00.000Z");

export interface SimpleFinMocks {
  data: jest.Mocked<SimpleFINDataService>;
  dedup: jest.Mocked<DeduplicationService>;
  httpGet: jest.Mock;
  httpPost: jest.Mock;
  sleep: jest.Mock;
  encryption: jest.Mocked<EncryptionUtility>;
  service: SimpleFINService;
}

/**
 * Builds a fresh SimpleFINService with every collaborator mocked.
 * @param configOverrides SystemConfig values layered over the defaults.
 * @returns The service plus every mock it was wired to.
 */
export const buildSimpleFinMocks = (
  configOverrides: Record<string, string> = {},
): SimpleFinMocks => {
  const config: Record<string, string> = { ...CONFIG, ...configOverrides };
  const getConfig = jest.fn(async (key: string): Promise<string | null> => config[key] ?? null);
  const data = {
    getConfig,
    // Reads through getConfig so a spec that nulls the config really feeds null.
    getNumericConfig: jest.fn(async (key: string, fallback: number) => {
      const raw = await getConfig(key);
      const parsed = raw === null ? Number.NaN : Number.parseInt(raw, 10);
      return Number.isNaN(parsed) ? fallback : parsed;
    }),
    getConnection: jest.fn(async () => ({ ...CONNECTION_ACTIVE })),
    getActiveConnections: jest.fn(async () => [{ ...CONNECTION_ACTIVE }]),
    getStaleCandidates: jest.fn(async () => []),
    updateConnectionSync: jest.fn(async () => undefined),
    getProviderAccount: jest.fn(async () => ({ ...ACCOUNT_MAPPED })),
    createProviderAccount: jest.fn(async () => "new-account-id"),
    getProviderAccountById: jest.fn(async () => ({ ...ACCOUNT_MAPPED })),
    insertTransaction: jest.fn(async () => undefined),
    backfillTransactions: jest.fn(async () => 0),
    getAlertTypeId: jest.fn(async (name: string) => ALERT_TYPE_IDS[name] ?? null),
    getAlertSeverityId: jest.fn(
      async (name: string) => ALERT_SEVERITY_IDS[name] ?? null,
    ),
    findActiveAlert: jest.fn(async () => null),
    createAlert: jest.fn(async () => undefined),
    createConnection: jest.fn(async () => CONNECTION_ID),
  } as unknown as jest.Mocked<SimpleFINDataService>;

  const dedup = {
    evaluate: jest.fn(async () => ({ outcome: "new" as const })),
  } as unknown as jest.Mocked<DeduplicationService>;

  const httpGet = jest.fn();
  const httpPost = jest.fn();
  const sleep = jest.fn(async () => undefined);
  const encryption = {
    encrypt: jest.fn((plain: string) => `enc(${plain})`),
    decrypt: jest.fn(() => ACCESS_URL_PLAINTEXT),
  } as unknown as jest.Mocked<EncryptionUtility>;

  const service = new SimpleFINService(data, dedup, {
    http: { get: httpGet, post: httpPost },
    sleep,
    encryptionFactory: () => encryption,
    now: () => FIXED_NOW,
  });

  return { data, dedup, httpGet, httpPost, sleep, encryption, service };
};
