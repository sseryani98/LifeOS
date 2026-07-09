// Harness for the SimpleFINService unit test: builds the service wired to fully
// mocked collaborators. Kept out of the test file so each test reads as
// arrange-act-assert rather than mock plumbing.

import { SimpleFINService } from "../../../srv/modules/integration/simpleFinService.js";

import {
  ACCESS_URL_PLAINTEXT,
  ACCOUNT_MAPPED,
  ALERT_SEVERITY_ID,
  ALERT_TYPE_ID,
  CONNECTION_ACTIVE,
  CONNECTION_ID,
} from "../../data/integration/simplefin.js";

import type { SimpleFINDataService } from "../../../srv/modules/integration/simpleFinDataService.js";
import type { DeduplicationService } from "../../../srv/modules/integration/deduplicationService.js";
import type { EncryptionUtility } from "../../../srv/modules/shared/encryptionUtility.js";

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

/** Builds a fresh SimpleFINService with every collaborator mocked. */
export function buildSimpleFinMocks(): SimpleFinMocks {
  const data = {
    getConfig: jest.fn(async (key: string) => CONFIG[key] ?? null),
    getNumericConfig: jest.fn(async (key: string, fallback: number) => {
      const raw = CONFIG[key] ?? null;
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
    getAlertTypeId: jest.fn(async () => ALERT_TYPE_ID),
    getAlertSeverityId: jest.fn(async () => ALERT_SEVERITY_ID),
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
}
