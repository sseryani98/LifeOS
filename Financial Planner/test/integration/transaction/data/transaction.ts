// Named seed data for the transaction-processing integration test (cds.test +
// SQLite). Reference ids come from the seeded db/data CSVs; vendors and
// transactions are seeded per-test.

import {
  DINING_EARNING_CATEGORY,
  FAST_FOOD_PURCHASE_TYPE,
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
export const CORRECTION_TXN_ID = "ab1e0003-0000-0000-0000-000000000007";
export const MISSING_CORRECTION_TXN_ID = "ab1e0003-0000-0000-0000-0000000000fe";
export const AUTO_EDIT_TXN_ID = "ab1e0003-0000-0000-0000-000000000008";
export const BULK_KEEP_TXN_ID = "ab1e0003-0000-0000-0000-000000000009";

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

/** A vendor id no Vendor row carries — a stale selection must fail validation, not the foreign key. */
export const UNKNOWN_VENDOR_ID = "ab1e0001-0000-0000-0000-0000000000ff";

/** An object-page edit picking a vendor id that names no row. */
export const UNKNOWN_VENDOR_EDIT = { vendor_ID: UNKNOWN_VENDOR_ID };

/** A valid selection naming a vendor that does not exist. */
export const BULK_UNKNOWN_VENDOR_PAYLOAD = {
  transactionIds: [BULK_TXN_1_ID, BULK_TXN_2_ID, BULK_TXN_3_ID],
  vendor_ID: UNKNOWN_VENDOR_ID,
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

/** The raw description the correctCategorization action must learn a pattern for. */
export const CORRECTION_DESCRIPTION = "SBUX MOBILE ORDER #3310";

/** An uncategorized row owned by the correction action — no other test reads its state. */
export const CORRECTION_TRANSACTION = {
  ID: CORRECTION_TXN_ID,
  source: "csv",
  amount: -5.95,
  postedAt: "2026-03-07",
  rawDescription: CORRECTION_DESCRIPTION,
  categorizationStatus: "uncategorized",
  isExcluded: false,
};

/** An auto-categorized row whose object-page save changes only the purchase type. */
export const AUTO_EDIT_TRANSACTION = {
  ID: AUTO_EDIT_TXN_ID,
  source: "simplefin",
  amount: -11.4,
  postedAt: "2026-03-08",
  rawDescription: "STARBUCKS #5150",
  vendor_ID: STARBUCKS_VENDOR_ID,
  purchaseType_ID: RESTAURANTS_PURCHASE_TYPE.ID,
  earningCategory_ID: DINING_EARNING_CATEGORY.ID,
  categorizationStatus: "auto",
  isExcluded: false,
};

/** A row already holding its PT and EC — a vendor-only bulk apply must leave both in place. */
export const BULK_KEEP_TRANSACTION = {
  ID: BULK_KEEP_TXN_ID,
  source: "simplefin",
  amount: -48.2,
  postedAt: "2026-03-09",
  rawDescription: "SHELL STATION 101",
  purchaseType_ID: FAST_FOOD_PURCHASE_TYPE.ID,
  earningCategory_ID: DINING_EARNING_CATEGORY.ID,
  categorizationStatus: "auto",
  isExcluded: false,
};

/** A bulk apply naming only the vendor — the dialog's PT and EC were left empty. */
export const BULK_VENDOR_ONLY_PAYLOAD = {
  transactionIds: [BULK_KEEP_TXN_ID],
  vendor_ID: STARBUCKS_VENDOR_ID,
  purchaseType_ID: null,
  earningCategory_ID: null,
};

/** The object-page edit that swaps only the purchase type on the auto row. */
export const PURCHASE_TYPE_ONLY_EDIT = {
  purchaseType_ID: FAST_FOOD_PURCHASE_TYPE.ID,
};

/** The correctCategorization action payload posted over OData for the seeded row. */
export const CORRECT_ACTION_PAYLOAD = {
  transactionId: CORRECTION_TXN_ID,
  vendor_ID: STARBUCKS_VENDOR_ID,
  purchaseType_ID: BULK_PURCHASE_TYPE_ID,
  earningCategory_ID: BULK_EARNING_CATEGORY_ID,
};

/** A correction aimed at a transaction that does not exist — must be a 404, as split is. */
export const MISSING_CORRECTION_PAYLOAD = {
  transactionId: MISSING_CORRECTION_TXN_ID,
  vendor_ID: STARBUCKS_VENDOR_ID,
  purchaseType_ID: BULK_PURCHASE_TYPE_ID,
  earningCategory_ID: BULK_EARNING_CATEGORY_ID,
};

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

export const PADEL_HAUS_VENDOR_ID = "ab1e0001-0000-0000-0000-0000000000a1";
export const COURT_SHARE_VENDOR_ID = "ab1e0001-0000-0000-0000-0000000000a2";
export const ONE_OFF_VENDOR_ID = "ab1e0001-0000-0000-0000-0000000000a3";
export const PADEL_OLDER_TXN_ID = "ab1e0003-0000-0000-0000-0000000000a1";
export const PADEL_LATEST_TXN_ID = "ab1e0003-0000-0000-0000-0000000000a2";
export const PADEL_ONE_OFF_TXN_ID = "ab1e0003-0000-0000-0000-0000000000a3";
export const PADEL_NEW_TXN_ID = "ab1e0003-0000-0000-0000-0000000000a4";
export const UNASSIGNED_TXN_ID = "ab1e0003-0000-0000-0000-0000000000a5";
export const COURT_SHARE_PRIOR_TXN_ID = "ab1e0003-0000-0000-0000-0000000000a6";
export const COURT_SHARE_NEW_TXN_ID = "ab1e0003-0000-0000-0000-0000000000a7";
export const ONE_OFF_PRIOR_TXN_ID = "ab1e0003-0000-0000-0000-0000000000a8";
export const ONE_OFF_NEW_TXN_ID = "ab1e0003-0000-0000-0000-0000000000a9";
export const MISSING_SUGGESTION_TXN_ID = "ab1e0003-0000-0000-0000-0000000000fd";

/** Three vendors: percentage-recurring, dollar-recurring, and one-off-only. */
export const SUGGESTION_VENDORS = [
  { ID: PADEL_HAUS_VENDOR_ID, name: "Padel Haus" },
  { ID: COURT_SHARE_VENDOR_ID, name: "Court Share Club" },
  { ID: ONE_OFF_VENDOR_ID, name: "Corner Bistro" },
];

/** The suggestion scenario's charges — the new rows carry no split yet. */
export const SUGGESTION_TRANSACTIONS = [
  { ID: PADEL_OLDER_TXN_ID, vendor_ID: PADEL_HAUS_VENDOR_ID, amount: -100, rawDescription: "PADEL HAUS JAN" },
  { ID: PADEL_LATEST_TXN_ID, vendor_ID: PADEL_HAUS_VENDOR_ID, amount: -110, rawDescription: "PADEL HAUS FEB" },
  { ID: PADEL_ONE_OFF_TXN_ID, vendor_ID: PADEL_HAUS_VENDOR_ID, amount: -90, rawDescription: "PADEL HAUS CLINIC" },
  { ID: PADEL_NEW_TXN_ID, vendor_ID: PADEL_HAUS_VENDOR_ID, amount: -120, rawDescription: "PADEL HAUS MAR" },
  { ID: UNASSIGNED_TXN_ID, vendor_ID: null, amount: -120, rawDescription: "UNKNOWN MERCHANT" },
  { ID: COURT_SHARE_PRIOR_TXN_ID, vendor_ID: COURT_SHARE_VENDOR_ID, amount: -60, rawDescription: "COURT SHARE FEB" },
  { ID: COURT_SHARE_NEW_TXN_ID, vendor_ID: COURT_SHARE_VENDOR_ID, amount: -75, rawDescription: "COURT SHARE MAR" },
  { ID: ONE_OFF_PRIOR_TXN_ID, vendor_ID: ONE_OFF_VENDOR_ID, amount: -40, rawDescription: "CORNER BISTRO FEB" },
  { ID: ONE_OFF_NEW_TXN_ID, vendor_ID: ONE_OFF_VENDOR_ID, amount: -40, rawDescription: "CORNER BISTRO MAR" },
].map(row => ({
  ...row,
  source: "csv",
  postedAt: "2026-03-10",
  categorizationStatus: "user_corrected",
  isExcluded: false,
}));

/** The latest recurring Padel split — the template a new Padel charge must copy. */
export const PADEL_LATEST_RECURRING_SPLIT = {
  ID: "ab1e0006-0000-0000-0000-0000000000a2",
  transaction_ID: PADEL_LATEST_TXN_ID,
  mySharePct: 0.2,
  myShareAmount: 22,
  splitDescription: "Padel with friends",
  isRecurring: true,
  modifiedAt: "2026-02-10T12:00:00.000Z",
};

/**
 * Existing splits: an older recurring Padel split (superseded), a newer one-off
 * Padel split (never a template), a recurring flat-dollar court share, and a
 * one-off-only vendor. modifiedAt is pinned so "most recent" is deterministic.
 */
export const SUGGESTION_SPLITS = [
  {
    ID: "ab1e0006-0000-0000-0000-0000000000a1",
    transaction_ID: PADEL_OLDER_TXN_ID,
    mySharePct: 0.5,
    myShareAmount: 50,
    splitDescription: "Old padel terms",
    isRecurring: true,
    modifiedAt: "2026-01-10T12:00:00.000Z",
  },
  PADEL_LATEST_RECURRING_SPLIT,
  {
    ID: "ab1e0006-0000-0000-0000-0000000000a3",
    transaction_ID: PADEL_ONE_OFF_TXN_ID,
    mySharePct: 0.9,
    myShareAmount: 81,
    splitDescription: "Clinic I mostly paid",
    isRecurring: false,
    modifiedAt: "2026-02-20T12:00:00.000Z",
  },
  {
    ID: "ab1e0006-0000-0000-0000-0000000000a6",
    transaction_ID: COURT_SHARE_PRIOR_TXN_ID,
    mySharePct: null,
    myShareAmount: 15,
    splitDescription: "Monthly court share",
    isRecurring: true,
    modifiedAt: "2026-02-01T12:00:00.000Z",
  },
  {
    ID: "ab1e0006-0000-0000-0000-0000000000a8",
    transaction_ID: ONE_OFF_PRIOR_TXN_ID,
    mySharePct: 0.5,
    myShareAmount: 20,
    splitDescription: "Dinner with Sam",
    isRecurring: false,
    modifiedAt: "2026-02-15T12:00:00.000Z",
  },
];

export const CAFE_NERO_VENDOR_ID = "ab1e0001-0000-0000-0000-0000000000c1";
export const NERO_RESTAURANT_1_TXN_ID = "ab1e0003-0000-0000-0000-0000000000c1";
export const NERO_RESTAURANT_2_TXN_ID = "ab1e0003-0000-0000-0000-0000000000c2";
export const NERO_FAST_FOOD_TXN_ID = "ab1e0003-0000-0000-0000-0000000000c3";
export const VENDOR_FILL_EMPTY_TXN_ID = "ab1e0003-0000-0000-0000-0000000000c4";
export const VENDOR_FILL_PRESET_TXN_ID = "ab1e0003-0000-0000-0000-0000000000c5";
export const MATCH_DRAFT_TXN_ID = "ab1e0003-0000-0000-0000-0000000000c6";
export const VENDOR_FILL_NO_COMBO_TXN_ID = "ab1e0003-0000-0000-0000-0000000000c7";
export const NEVER_SEEDED_TXN_ID = "ab1e0003-0000-0000-0000-0000000000cf";

/** The vendor picked on the object page; its history ranks Restaurants/Dining first. */
export const CAFE_NERO_VENDOR = { ID: CAFE_NERO_VENDOR_ID, name: "Cafe Nero" };

/** The facet headings the object page shows, as srv/_i18n resolves them. */
export const FACET_LABELS = [
  "Transaction Details",
  "Split",
  "Categorization Suggestions",
];

/** A LineItem DataField record carrying the given path and, later in the same record, the given label. */
export const LINE_ITEM_LABEL = {
  POSTED_AT_DATE: /<Record Type="UI.DataField">(?:(?!<\/Record>)[^])*?Path="postedAt"(?:(?!<\/Record>)[^])*?Property="Label" String="Date"/,
} as const;

/** A FieldGroup DataField on transactedAt hidden by a path expression testing it for null. */
export const HIDDEN_WHEN_EMPTY = {
  TRANSACTED_AT: /<Record Type="UI.DataField">(?:(?!<\/Record>)[^])*?Path="transactedAt"(?:(?!<\/Record>)[^])*?Term="UI.Hidden">\s*<Eq>\s*<Path>transactedAt<\/Path>\s*<Null\/>/,
} as const;

/** The raw keys a facet heading shows when srv/_i18n lacks them. */
export const RAW_FACET_KEYS = ["FacetDetails", "FacetSplit", "FacetSuggestions"];

/** The expected object-page match for the seeded Uber Eats contains pattern. */
export const UBER_EATS_MATCH = { pattern: "UBER EATS", confidence: "High" };

const categorizedNero = (
  id: string,
  purchaseTypeId: string,
  postedAt: string,
): Record<string, unknown> => ({
  ID: id,
  source: "csv",
  amount: -4.85,
  postedAt,
  rawDescription: "CAFE NERO KING ST",
  vendor_ID: CAFE_NERO_VENDOR_ID,
  purchaseType_ID: purchaseTypeId,
  earningCategory_ID: DINING_EARNING_CATEGORY.ID,
  categorizationStatus: "user_corrected",
  isExcluded: false,
});

/**
 * Cafe Nero's history (Restaurants/Dining twice, Fast Food/Dining once), then two
 * vendorless rows the object page assigns it to, one with its PT already chosen,
 * and an Uber Eats row whose draft must still explain its match.
 */
export const VENDOR_FILL_TRANSACTIONS = [
  categorizedNero(NERO_RESTAURANT_1_TXN_ID, RESTAURANTS_PURCHASE_TYPE.ID, "2026-03-10"),
  categorizedNero(NERO_RESTAURANT_2_TXN_ID, RESTAURANTS_PURCHASE_TYPE.ID, "2026-03-11"),
  categorizedNero(NERO_FAST_FOOD_TXN_ID, FAST_FOOD_PURCHASE_TYPE.ID, "2026-03-12"),
  {
    ID: VENDOR_FILL_EMPTY_TXN_ID,
    source: "simplefin",
    amount: -5.1,
    postedAt: "2026-03-13",
    rawDescription: "NERO EXPRESS 0042",
    categorizationStatus: "uncategorized",
    isExcluded: false,
  },
  {
    ID: VENDOR_FILL_PRESET_TXN_ID,
    source: "simplefin",
    amount: -6.2,
    postedAt: "2026-03-14",
    rawDescription: "NERO EXPRESS 0043",
    purchaseType_ID: FAST_FOOD_PURCHASE_TYPE.ID,
    categorizationStatus: "uncategorized",
    isExcluded: false,
  },
  {
    ID: VENDOR_FILL_NO_COMBO_TXN_ID,
    source: "simplefin",
    amount: -32,
    postedAt: "2026-03-16",
    rawDescription: "CORNER BISTRO MAR",
    categorizationStatus: "uncategorized",
    isExcluded: false,
  },
  {
    ID: MATCH_DRAFT_TXN_ID,
    source: "simplefin",
    amount: -21.4,
    postedAt: "2026-03-15",
    rawDescription: "UBER EATS CA #9",
    categorizationStatus: "uncategorized",
    isExcluded: false,
  },
];

/** The draft patch for a vendor whose history carries no PT or EC. */
export const PICK_CORNER_BISTRO = { vendor_ID: ONE_OFF_VENDOR_ID };

/** The draft patch the object page sends when the user picks Cafe Nero. */
export const PICK_CAFE_NERO = { vendor_ID: CAFE_NERO_VENDOR_ID };

/** The columns the object page selects for its match explanation. */
export const MATCH_COLUMNS = [{ ref: ["matchedPattern"] }, { ref: ["ID"] }];

export const REFUND_TXN_ID = "ab1e0003-0000-0000-0000-0000000000d1";
export const CHARGE_TXN_ID = "ab1e0003-0000-0000-0000-0000000000d2";

/** A refund and a charge, the two signs the object-page amount colours apart. */
export const OBJECT_PAGE_HEADER_TRANSACTIONS = [
  {
    ID: REFUND_TXN_ID,
    source: "csv",
    amount: 45,
    postedAt: "2026-03-20",
    rawDescription: "AMAZON.CA REFUND",
    categorizationStatus: "uncategorized",
    isExcluded: false,
  },
  {
    ID: CHARGE_TXN_ID,
    source: "simplefin",
    amount: -120.4,
    postedAt: "2026-03-21",
    rawDescription: "COSTCO WHOLESALE #551",
    categorizationStatus: "uncategorized",
    isExcluded: false,
  },
];

/** The $metadata targets whose annotations the object page and list render from. */
export const METADATA_TARGET = {
  TRANSACTIONS: "TransactionService.Transactions",
  AMOUNT: "TransactionService.Transactions/amount",
  SOURCE: "TransactionService.Transactions/source",
  IS_EXCLUDED: "TransactionService.Transactions/isExcluded",
  IS_RECURRING: "TransactionService.TransactionSplits/isRecurring",
  MY_SHARE_AMOUNT: "TransactionService.TransactionSplits/myShareAmount",
  SPLITS: "TransactionService.TransactionSplits",
  STATUS_CODE: "TransactionService.CategorizationStatusTypes/code",
  SOURCE_CODE: "TransactionService.TransactionSourceTypes/code",
} as const;

export const SHARE_PCT_EDIT_TXN_ID = "ab1e0003-0000-0000-0000-0000000000e1";
export const SHARE_AMOUNT_EDIT_TXN_ID = "ab1e0003-0000-0000-0000-0000000000e2";
export const SHARE_BOTH_EDIT_TXN_ID = "ab1e0003-0000-0000-0000-0000000000e3";
export const SHARE_OVER_TOTAL_TXN_ID = "ab1e0003-0000-0000-0000-0000000000e4";
export const SHARE_PCT_SAVE_TXN_ID = "ab1e0003-0000-0000-0000-0000000000e5";
export const SHARE_PCT_CLEAR_TXN_ID = "ab1e0003-0000-0000-0000-0000000000e6";
export const SHARE_DOLLAR_CLEAR_TXN_ID = "ab1e0003-0000-0000-0000-0000000000e7";

const shareEditCharge = (id: string): Record<string, unknown> => ({
  ID: id,
  source: "csv",
  amount: -200,
  postedAt: "2026-03-25",
  rawDescription: "COTTAGE RENTAL WEEKEND",
  categorizationStatus: "uncategorized",
  isExcluded: false,
});

const halfSplit = (splitId: string, transactionId: string): Record<string, unknown> => ({
  ID: splitId,
  transaction_ID: transactionId,
  mySharePct: 0.5,
  myShareAmount: 100,
  splitDescription: "Half the cottage",
  isRecurring: false,
});

/** Seven $200 charges, each with a $100 split the object page re-edits: 50%-based, but the last dollar-based. */
export const SHARE_EDIT_TRANSACTIONS = [
  shareEditCharge(SHARE_PCT_EDIT_TXN_ID),
  shareEditCharge(SHARE_AMOUNT_EDIT_TXN_ID),
  shareEditCharge(SHARE_BOTH_EDIT_TXN_ID),
  shareEditCharge(SHARE_OVER_TOTAL_TXN_ID),
  shareEditCharge(SHARE_PCT_SAVE_TXN_ID),
  shareEditCharge(SHARE_PCT_CLEAR_TXN_ID),
  shareEditCharge(SHARE_DOLLAR_CLEAR_TXN_ID),
];

/** The splits on SHARE_EDIT_TRANSACTIONS, one per charge. */
export const SHARE_EDIT_SPLITS = [
  halfSplit("ab1e0006-0000-0000-0000-0000000000e1", SHARE_PCT_EDIT_TXN_ID),
  halfSplit("ab1e0006-0000-0000-0000-0000000000e2", SHARE_AMOUNT_EDIT_TXN_ID),
  halfSplit("ab1e0006-0000-0000-0000-0000000000e3", SHARE_BOTH_EDIT_TXN_ID),
  halfSplit("ab1e0006-0000-0000-0000-0000000000e4", SHARE_OVER_TOTAL_TXN_ID),
  halfSplit("ab1e0006-0000-0000-0000-0000000000e5", SHARE_PCT_SAVE_TXN_ID),
  halfSplit("ab1e0006-0000-0000-0000-0000000000e6", SHARE_PCT_CLEAR_TXN_ID),
  { ...halfSplit("ab1e0006-0000-0000-0000-0000000000e7", SHARE_DOLLAR_CLEAR_TXN_ID), mySharePct: null },
];

/** The object page's My Share % edit: 25% of the $200 charge. */
export const SHARE_PCT_EDIT = { mySharePct: 0.25 };

/** The object page's My Share Amount edit: a fixed $80. */
export const SHARE_AMOUNT_EDIT = { myShareAmount: 80 };

/** Both share inputs in one patch — BR-12 allows one. */
export const SHARE_BOTH_EDIT = { mySharePct: 0.25, myShareAmount: 80 };

/** A 150% share, which would book more than the charge to the user. */
export const SHARE_OVER_TOTAL_EDIT = { mySharePct: 1.5 };

/** My Share Amount cleared on the object page — optional there, as in the Split dialog (BR-12). */
export const SHARE_AMOUNT_CLEAR_EDIT = { myShareAmount: null };
