// Named seed data for the transaction-processing integration test (cds.test +
// SQLite). Reference ids come from the seeded db/data CSVs; vendors and
// transactions are seeded per-test.

import {
  DINING_EARNING_CATEGORY,
  HIGH_CONFIDENCE,
  RESTAURANTS_PURCHASE_TYPE,
  SEED_PATTERN_SOURCE,
} from "../../../shared/data/reference.js";

export const SPLIT_TXN_ID = "ab1e0003-0000-0000-0000-000000000001";
export const BULK_TXN_1_ID = "ab1e0003-0000-0000-0000-000000000002";
export const BULK_TXN_2_ID = "ab1e0003-0000-0000-0000-000000000003";
export const BULK_TXN_3_ID = "ab1e0003-0000-0000-0000-000000000004";
export const RESPLIT_TXN_ID = "ab1e0003-0000-0000-0000-000000000005";
export const INLINE_EDIT_TXN_ID = "ab1e0003-0000-0000-0000-000000000006";
export const EXISTING_SPLIT_ID = "ab1e0006-0000-0000-0000-000000000001";
export const STARBUCKS_VENDOR_ID = "ab1e0001-0000-0000-0000-000000000001";
export const MISSING_SPLIT_TXN_ID = "ab1e0003-0000-0000-0000-0000000000ff";

/** The vendor the bulk-categorize action assigns to the selection. */
export const STARBUCKS_VENDOR = {
  ID: STARBUCKS_VENDOR_ID,
  name: "Starbucks",
};

/** A $110 charge the split action divides into the user's share. */
export const SPLIT_TRANSACTION = {
  ID: SPLIT_TXN_ID,
  source: "csv",
  amount: -110,
  postedAt: "2026-03-01",
  rawDescription: "PADEL HAUS TORONTO",
  categorizationStatus: "uncategorized",
  isExcluded: false,
};

/** A $220 charge with its own pre-existing split — the re-split fixture. */
export const RESPLIT_TRANSACTION = {
  ID: RESPLIT_TXN_ID,
  source: "csv",
  amount: -220,
  postedAt: "2026-03-01",
  rawDescription: "SKI TRIP LODGE",
  categorizationStatus: "uncategorized",
  isExcluded: false,
};

/** The split already on RESPLIT_TRANSACTION — a second split call must replace it. */
export const EXISTING_SPLIT = {
  ID: EXISTING_SPLIT_ID,
  transaction_ID: RESPLIT_TXN_ID,
  mySharePct: 0.5,
  myShareAmount: 110,
  splitDescription: "Half the lodge",
  isRecurring: false,
};

/** The raw description the inline-edit row must learn a pattern for. */
export const INLINE_EDIT_DESCRIPTION = "STARBUCKS RESERVE #9001";

/** An uncategorized row an inline vendor assignment (before-UPDATE) learns from. */
export const INLINE_EDIT_TRANSACTION = {
  ID: INLINE_EDIT_TXN_ID,
  source: "csv",
  amount: -9.75,
  postedAt: "2026-03-06",
  rawDescription: INLINE_EDIT_DESCRIPTION,
  categorizationStatus: "uncategorized",
  isExcluded: false,
};

/**
 * Three uncategorized rows over two distinct raw descriptions — bulk categorize
 * must classify all three yet learn one pattern per unique description (two),
 * not one per vendor and not one per row.
 */
export const BULK_TRANSACTIONS = [
  {
    ID: BULK_TXN_1_ID,
    source: "csv",
    amount: -6.5,
    postedAt: "2026-03-02",
    rawDescription: "STARBUCKS #4021",
    categorizationStatus: "uncategorized",
    isExcluded: false,
  },
  {
    ID: BULK_TXN_2_ID,
    source: "csv",
    amount: -6.5,
    postedAt: "2026-03-03",
    rawDescription: "STARBUCKS #4021",
    categorizationStatus: "uncategorized",
    isExcluded: false,
  },
  {
    ID: BULK_TXN_3_ID,
    source: "csv",
    amount: -7.25,
    postedAt: "2026-03-03",
    rawDescription: "STARBUCKS #7788",
    categorizationStatus: "uncategorized",
    isExcluded: false,
  },
];

/** The (PT, EC) pair applied by the bulk-categorize action. */
export const BULK_PURCHASE_TYPE_ID = RESTAURANTS_PURCHASE_TYPE.ID;
export const BULK_EARNING_CATEGORY_ID = DINING_EARNING_CATEGORY.ID;

/** The bulk-categorize action payload — all three rows, one vendor + taxonomy. */
export const BULK_CATEGORIZE_PAYLOAD = {
  transactionIds: [BULK_TXN_1_ID, BULK_TXN_2_ID, BULK_TXN_3_ID],
  vendor_ID: STARBUCKS_VENDOR_ID,
  purchaseType_ID: BULK_PURCHASE_TYPE_ID,
  earningCategory_ID: BULK_EARNING_CATEGORY_ID,
};

/** The same selection plus one id that no longer exists — only three rows can be written. */
export const BULK_WITH_MISSING_PAYLOAD = {
  transactionIds: [BULK_TXN_1_ID, BULK_TXN_2_ID, BULK_TXN_3_ID, MISSING_SPLIT_TXN_ID],
  vendor_ID: STARBUCKS_VENDOR_ID,
  purchaseType_ID: BULK_PURCHASE_TYPE_ID,
  earningCategory_ID: BULK_EARNING_CATEGORY_ID,
};

/** A valid selection with no vendor — @mandatory on the bulkCategorize vendor_ID param must reject it. */
export const BULK_MISSING_VENDOR_PAYLOAD = {
  transactionIds: [BULK_TXN_1_ID, BULK_TXN_2_ID, BULK_TXN_3_ID],
  purchaseType_ID: BULK_PURCHASE_TYPE_ID,
  earningCategory_ID: BULK_EARNING_CATEGORY_ID,
};

/** The splitTransaction action payload posted over OData — 20% of the $110 charge. */
export const SPLIT_ACTION_PAYLOAD = {
  transactionId: SPLIT_TXN_ID,
  mySharePct: 0.2,
  splitDescription: "Padel with friends",
  isRecurring: true,
};

/** A percentage above 1 — @assert.range on the mySharePct action param must reject it. */
export const OUT_OF_RANGE_SPLIT_PAYLOAD = {
  transactionId: SPLIT_TXN_ID,
  mySharePct: 1.5,
  isRecurring: false,
};

/** A dollar-only split over OData — a null mySharePct must pass @assert.range unrejected. */
export const DOLLAR_SPLIT_ACTION_PAYLOAD = {
  transactionId: SPLIT_TXN_ID,
  myShareAmount: 40,
  isRecurring: false,
};

// ─── Re-categorize scenario ────────────────────────────────────────
export const UBER_EATS_VENDOR_ID = "ab1e0001-0000-0000-0000-000000000002";
export const UBER_EATS_PATTERN_ID = "ab1e0004-0000-0000-0000-000000000001";
export const RECAT_UNCAT_1_ID = "ab1e0005-0000-0000-0000-000000000001";
export const RECAT_UNCAT_2_ID = "ab1e0005-0000-0000-0000-000000000002";
export const RECAT_UNCAT_3_ID = "ab1e0005-0000-0000-0000-000000000003";
export const RECAT_CORRECTED_1_ID = "ab1e0005-0000-0000-0000-000000000004";
export const RECAT_CORRECTED_2_ID = "ab1e0005-0000-0000-0000-000000000005";

/** The vendor the newly-added pattern re-matches the Uber Eats rows to. */
export const UBER_EATS_VENDOR = {
  ID: UBER_EATS_VENDOR_ID,
  name: "Uber Eats",
};

/** A contains pattern added after the rows were ingested — the re-run picks it up. */
export const UBER_EATS_PATTERN = {
  ID: UBER_EATS_PATTERN_ID,
  vendor_ID: UBER_EATS_VENDOR_ID,
  pattern: "UBER EATS",
  matchType: "contains",
  patternSource_ID: SEED_PATTERN_SOURCE.ID,
  confidenceLevel_ID: HIGH_CONFIDENCE.ID,
  isActive: true,
};

/** Three uncategorized Uber Eats rows the re-run should classify to `auto`. */
export const RECAT_UNCATEGORIZED_TRANSACTIONS = [
  RECAT_UNCAT_1_ID,
  RECAT_UNCAT_2_ID,
  RECAT_UNCAT_3_ID,
].map((id, index) => ({
  ID: id,
  source: "csv",
  amount: -18.5 - index,
  postedAt: "2026-03-04",
  rawDescription: `UBER EATS CA #${index + 1}`,
  categorizationStatus: "uncategorized",
  isExcluded: false,
}));

/** Two user-corrected Uber Eats rows the re-run must leave untouched. */
export const RECAT_CORRECTED_TRANSACTIONS = [
  RECAT_CORRECTED_1_ID,
  RECAT_CORRECTED_2_ID,
].map((id, index) => ({
  ID: id,
  source: "csv",
  amount: -25 - index,
  postedAt: "2026-03-05",
  rawDescription: `UBER EATS CA #${index + 4}`,
  vendor_ID: STARBUCKS_VENDOR_ID,
  categorizationStatus: "user_corrected",
  isExcluded: false,
}));

/** The full selection handed to reCategorize — 3 uncategorized + 2 user-corrected. */
export const RECATEGORIZE_PAYLOAD = {
  transactionIds: [
    RECAT_UNCAT_1_ID,
    RECAT_UNCAT_2_ID,
    RECAT_UNCAT_3_ID,
    RECAT_CORRECTED_1_ID,
    RECAT_CORRECTED_2_ID,
  ],
};
