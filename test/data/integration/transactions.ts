// Named test data for the transaction ingestion pipeline (W1-S2).
// UPPER_SNAKE_CASE constants — no inline payloads in tests.

import type { IncomingTransaction } from "../../../srv/modules/integration/types.js";

/** Stable id used to assert dedup matches against an existing transaction. */
export const EXISTING_TXN_ID = "aaaaaaaa-0000-0000-0000-000000000001";

/** A mapped card instance id (Amex Cobalt) reused across incoming samples. */
export const CARD_INSTANCE_AMEX = "11111111-1111-1111-1111-111111111111";

/** Valid SimpleFIN transaction — carries a stable external id (tier-1 dedup). */
export const INCOMING_SIMPLEFIN_NEW: IncomingTransaction = {
  externalId: "sf-tx-1001",
  cardInstance_ID: CARD_INSTANCE_AMEX,
  amount: -42.5,
  postedAt: "2026-06-01",
  rawDescription: "AMZN MKTP CA",
  source: "simplefin",
};

/** Valid CSV transaction — no external id, padded description (tier-2 dedup). */
export const INCOMING_CSV_NEW: IncomingTransaction = {
  externalId: null,
  cardInstance_ID: CARD_INSTANCE_AMEX,
  amount: -19.99,
  postedAt: "2026-06-02",
  rawDescription: "  NETFLIX.COM  ",
  source: "csv",
};

/** Invalid — amount field omitted entirely. */
export const INCOMING_MISSING_AMOUNT = {
  externalId: null,
  cardInstance_ID: CARD_INSTANCE_AMEX,
  postedAt: "2026-06-02",
  rawDescription: "NETFLIX.COM",
  source: "csv",
} as unknown as IncomingTransaction;

/** Invalid — amount is NaN (e.g. failed parse). */
export const INCOMING_NAN_AMOUNT: IncomingTransaction = {
  externalId: null,
  cardInstance_ID: CARD_INSTANCE_AMEX,
  amount: Number.NaN,
  postedAt: "2026-06-02",
  rawDescription: "NETFLIX.COM",
  source: "csv",
};

/** Invalid — posted date omitted. */
export const INCOMING_MISSING_POSTED_AT = {
  externalId: null,
  cardInstance_ID: CARD_INSTANCE_AMEX,
  amount: -19.99,
  rawDescription: "NETFLIX.COM",
  source: "csv",
} as unknown as IncomingTransaction;

/** Invalid — description is an empty string. */
export const INCOMING_EMPTY_DESCRIPTION: IncomingTransaction = {
  externalId: null,
  cardInstance_ID: CARD_INSTANCE_AMEX,
  amount: -19.99,
  postedAt: "2026-06-02",
  rawDescription: "",
  source: "csv",
};

/** Invalid — description is whitespace only. */
export const INCOMING_BLANK_DESCRIPTION: IncomingTransaction = {
  externalId: null,
  cardInstance_ID: CARD_INSTANCE_AMEX,
  amount: -19.99,
  postedAt: "2026-06-02",
  rawDescription: "   ",
  source: "csv",
};

/** Invalid — source is not a recognised ingestion source. */
export const INCOMING_INVALID_SOURCE: IncomingTransaction = {
  externalId: null,
  cardInstance_ID: CARD_INSTANCE_AMEX,
  amount: -19.99,
  postedAt: "2026-06-02",
  rawDescription: "NETFLIX.COM",
  source: "bogus",
};
