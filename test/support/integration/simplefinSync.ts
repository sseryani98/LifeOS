// Harness for the SimpleFIN integration test: wires the real sync engine to the
// in-memory DB with only the network call stubbed, and seeds the fixture world.
// Kept out of the test file so the test body reads as arrange-act-assert.

import { DeduplicationDataService } from "../../../srv/modules/integration/deduplicationDataService.js";
import { DeduplicationService } from "../../../srv/modules/integration/deduplicationService.js";
import { SimpleFINDataService } from "../../../srv/modules/integration/simpleFinDataService.js";
import { SimpleFINService } from "../../../srv/modules/integration/simpleFinService.js";
import { EncryptionUtility } from "../../../srv/modules/shared/encryptionUtility.js";

import {
  AMEX_COBALT,
  AMEX_COBALT_DEC2025_OFFER,
  AMEX_COBALT_INSTANCE,
} from "../../data/cards.js";
import {
  ACCESS_URL_PLAINTEXT,
  ACCOUNT_MAPPED_SEED,
  CONNECTION_SEED,
} from "../../data/integration/simplefin.js";

import type { HttpClient } from "../../../srv/modules/shared/types.js";
import type { SimpleFINResponse } from "../../../srv/modules/integration/types.js";

const CONNECTION = "com.financialplanner.ProviderConnection";
const ACCOUNT = "com.financialplanner.ProviderAccount";

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
