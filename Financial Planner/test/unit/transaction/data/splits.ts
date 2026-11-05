// Named test data for the transaction-processing module (splits, bulk
// categorize, corrections). UPPER_SNAKE_CASE constants — no inline payloads.

import type { MerchantPatternRecord } from "../../../../srv/modules/categorization/types.js";
import type {
  BulkCategorizeCommand,
  CategoryPair,
  CategoryReferences,
  CorrectionCommand,
  ReCategorizeCommand,
  SplitCommand,
  TransactionAmountRow,
  TransactionMatchSource,
} from "../../../../srv/modules/transaction/types.js";

export const PADEL_TXN_ID = "ca5e0001-0000-0000-0000-000000000001";
export const RESTAURANT_TXN_ID = "ca5e0001-0000-0000-0000-000000000002";
export const FRIEND_TXN_ID = "ca5e0001-0000-0000-0000-000000000003";

export const PADEL_ABS_AMOUNT = 110;
export const RESTAURANT_ABS_AMOUNT = 85;
export const FRIEND_ABS_AMOUNT = 200;

/** 20% of $110 = $22.00 — the share PERCENTAGE_SPLIT resolves to. */
export const PADEL_PCT_SHARE = 22;
/** $42.50 flat — DOLLAR_SPLIT's own share, within the $85 total. */
export const RESTAURANT_DOLLAR_SHARE = 42.5;
/** $0 — a fully reimbursed (or input-less) share. */
export const ZERO_SHARE = 0;
/** -$5 — a below-zero share the ceiling check must reject. */
export const NEGATIVE_SHARE = -5;
/** $999 — a share past the $85 total the ceiling check must reject. */
export const EXCEEDS_SHARE = 999;
/** $110 — a 100% share equal to the $110 total (the upper boundary). */
export const FULL_PADEL_SHARE = 110;
/** $85 — a share equal to the whole $85 charge (the upper boundary). */
export const FULL_RESTAURANT_SHARE = 85;

/** A $110 charge — the percentage-split fixture (20% → $22.00). */
export const PADEL_TRANSACTION_ROW: TransactionAmountRow = {
  ID: PADEL_TXN_ID,
  amount: -110,
};

/** 20% of a $110 charge — expects myShareAmount $22.00, recurring. */
export const PERCENTAGE_SPLIT: SplitCommand = {
  transactionId: PADEL_TXN_ID,
  mySharePct: 0.2,
  myShareAmount: null,
  splitDescription: "Padel with friends",
  isRecurring: true,
};

/** A flat $42.50 dollar share of an $85 charge — pct stays null. */
export const DOLLAR_SPLIT: SplitCommand = {
  transactionId: RESTAURANT_TXN_ID,
  mySharePct: null,
  myShareAmount: 42.5,
  splitDescription: null,
  isRecurring: false,
};

/** A fully reimbursed $200 purchase — 0% share, myShareAmount $0. */
export const REIMBURSED_SPLIT: SplitCommand = {
  transactionId: FRIEND_TXN_ID,
  mySharePct: 0,
  myShareAmount: null,
  splitDescription: null,
  isRecurring: false,
};

/** Both inputs supplied — the either/or rule must reject it. */
export const BOTH_INPUTS_SPLIT: SplitCommand = {
  transactionId: PADEL_TXN_ID,
  mySharePct: 0.2,
  myShareAmount: 22,
  splitDescription: null,
  isRecurring: false,
};

/** Neither input supplied — nothing to split. */
export const NEITHER_INPUT_SPLIT: SplitCommand = {
  transactionId: PADEL_TXN_ID,
  mySharePct: null,
  myShareAmount: null,
  splitDescription: null,
  isRecurring: false,
};

/** A dollar share larger than the transaction total — exceeds the ceiling. */
export const EXCEEDS_DOLLAR_SPLIT: SplitCommand = {
  transactionId: RESTAURANT_TXN_ID,
  mySharePct: null,
  myShareAmount: 999,
  splitDescription: null,
  isRecurring: false,
};

/** A negative dollar share — a share can never be below zero. */
export const NEGATIVE_DOLLAR_SPLIT: SplitCommand = {
  transactionId: RESTAURANT_TXN_ID,
  mySharePct: null,
  myShareAmount: -5,
  splitDescription: null,
  isRecurring: false,
};

/** The upper percentage boundary — a 100% share of the charge is legal. */
export const FULL_PCT_SPLIT: SplitCommand = {
  transactionId: PADEL_TXN_ID,
  mySharePct: 1,
  myShareAmount: null,
  splitDescription: null,
  isRecurring: false,
};

/** The upper dollar boundary — a share equal to the whole $85 charge is legal. */
export const FULL_DOLLAR_SPLIT: SplitCommand = {
  transactionId: RESTAURANT_TXN_ID,
  mySharePct: null,
  myShareAmount: 85,
  splitDescription: null,
  isRecurring: false,
};

/** 35% of an $85 charge — 85 × 0.35 drifts to 29.749999999999996 in IEEE-754. */
export const DRIFTING_PCT_SPLIT: SplitCommand = {
  transactionId: RESTAURANT_TXN_ID,
  mySharePct: 0.35,
  myShareAmount: null,
  splitDescription: null,
  isRecurring: false,
};

/** A cleared percentage field: the UI sends "", which must map to null, not 0. */
export const EMPTY_STRING_PCT_PAYLOAD: Record<string, unknown> = {
  transactionId: PADEL_TXN_ID,
  mySharePct: "",
  myShareAmount: 22,
  isRecurring: false,
};

/** Only the transaction id — CAP omits every unfilled optional action param. */
export const MINIMAL_SPLIT_PAYLOAD: Record<string, unknown> = {
  transactionId: PADEL_TXN_ID,
};

/** A bulk payload with no selection at all — CAP omits an empty `many` param. */
export const EMPTY_BULK_PAYLOAD: Record<string, unknown> = {};

export const TXN_A_ID = "ca5e0002-0000-0000-0000-000000000001";
export const TXN_B_ID = "ca5e0002-0000-0000-0000-000000000002";
export const VENDOR_ID = "ca5e0003-0000-0000-0000-000000000001";
export const PURCHASE_TYPE_ID = "ca5e0004-0000-0000-0000-000000000001";
export const EARNING_CATEGORY_ID = "ca5e0005-0000-0000-0000-000000000001";
export const OTHER_PURCHASE_TYPE_ID = "ca5e0004-0000-0000-0000-000000000002";
export const OTHER_EARNING_CATEGORY_ID = "ca5e0005-0000-0000-0000-000000000002";

/** The stored vendor + taxonomy of an auto-categorized row the object page edits. */
export const STORED_AUTO_CATEGORIZATION: CategoryReferences = {
  vendor_ID: VENDOR_ID,
  purchaseType_ID: PURCHASE_TYPE_ID,
  earningCategory_ID: EARNING_CATEGORY_ID,
};

/** An object-page save of that row that swaps only the purchase type. */
export const PURCHASE_TYPE_ONLY_SAVE: Record<string, unknown> = {
  ...STORED_AUTO_CATEGORIZATION,
  purchaseType_ID: OTHER_PURCHASE_TYPE_ID,
  categorizationStatus: "auto",
};

/** An object-page save of that row that swaps only the earning category. */
export const EARNING_CATEGORY_ONLY_SAVE: Record<string, unknown> = {
  ...STORED_AUTO_CATEGORIZATION,
  earningCategory_ID: OTHER_EARNING_CATEGORY_ID,
  categorizationStatus: "auto",
};

/** An object-page save of that row that changes only the notes. */
export const NOTES_ONLY_SAVE: Record<string, unknown> = {
  ...STORED_AUTO_CATEGORIZATION,
  notes: "morning coffee",
  categorizationStatus: "auto",
};

/** A deliberately-set status on an inline patch — the stamp must not overwrite it. */
export const AUTO_STATUS = "auto";

/** Apply one vendor + taxonomy across two selected rows. */
export const BULK_APPLY: BulkCategorizeCommand = {
  transactionIds: [TXN_A_ID, TXN_B_ID],
  vendor_ID: VENDOR_ID,
  purchaseType_ID: PURCHASE_TYPE_ID,
  earningCategory_ID: EARNING_CATEGORY_ID,
};

/** The same two rows, with row A selected twice. */
export const DUPLICATE_ID_BULK_APPLY: BulkCategorizeCommand = {
  ...BULK_APPLY,
  transactionIds: [TXN_A_ID, TXN_B_ID, TXN_A_ID],
};

/** No rows selected — must be rejected before any write. */
export const EMPTY_SELECTION_BULK: BulkCategorizeCommand = {
  transactionIds: [],
  vendor_ID: VENDOR_ID,
  purchaseType_ID: PURCHASE_TYPE_ID,
  earningCategory_ID: EARNING_CATEGORY_ID,
};

/** A selection with no vendor to anchor the assignment. */
export const NO_VENDOR_BULK: BulkCategorizeCommand = {
  transactionIds: [TXN_A_ID],
  vendor_ID: null,
  purchaseType_ID: PURCHASE_TYPE_ID,
  earningCategory_ID: EARNING_CATEGORY_ID,
};

/** A re-categorize request over two selected rows. */
export const RECATEGORIZE_SELECTION: ReCategorizeCommand = {
  transactionIds: [TXN_A_ID, TXN_B_ID],
};

/** A re-categorize request with no rows selected — must be rejected. */
export const EMPTY_RECATEGORIZE: ReCategorizeCommand = {
  transactionIds: [],
};

/** A valid single-transaction correction. */
export const VALID_CORRECTION: CorrectionCommand = {
  transactionId: TXN_A_ID,
  vendor_ID: VENDOR_ID,
  purchaseType_ID: PURCHASE_TYPE_ID,
  earningCategory_ID: EARNING_CATEGORY_ID,
};

/** A correction missing its vendor anchor. */
export const MISSING_VENDOR_CORRECTION: CorrectionCommand = {
  transactionId: TXN_A_ID,
  vendor_ID: null,
  purchaseType_ID: PURCHASE_TYPE_ID,
  earningCategory_ID: EARNING_CATEGORY_ID,
};

/** A correction with no target transaction. */
export const MISSING_TXN_CORRECTION: CorrectionCommand = {
  transactionId: "",
  vendor_ID: VENDOR_ID,
  purchaseType_ID: PURCHASE_TYPE_ID,
  earningCategory_ID: EARNING_CATEGORY_ID,
};

export const PADEL_VENDOR_ID = "ca5e0003-0000-0000-0000-000000000002";
export const PADEL_NEW_TXN_ID = "ca5e0001-0000-0000-0000-000000000004";

/** A new $120 Padel Haus charge the Split dialog opens on. */
export const PADEL_NEW_SUGGESTION_ROW = {
  ID: PADEL_NEW_TXN_ID,
  amount: -120,
  vendor_ID: PADEL_VENDOR_ID,
};

/** An $85 Padel Haus charge — 35% of it drifts to 29.749999999999996 in IEEE-754. */
export const PADEL_DRIFTING_SUGGESTION_ROW = {
  ID: PADEL_NEW_TXN_ID,
  amount: -85,
  vendor_ID: PADEL_VENDOR_ID,
};

/** A charge not yet assigned to any vendor — the matching key is absent. */
export const NO_VENDOR_SUGGESTION_ROW = {
  ID: PADEL_NEW_TXN_ID,
  amount: -120,
  vendor_ID: null,
};

/** The last recurring Padel split: 20%, so a $120 charge suggests $24.00. */
export const PCT_RECURRING_TEMPLATE = {
  mySharePct: 0.2,
  myShareAmount: 22,
  splitDescription: "Padel with friends",
};

/** A recurring 35% template — exercises the cents rounding on the new amount. */
export const DRIFTING_PCT_RECURRING_TEMPLATE = {
  mySharePct: 0.35,
  myShareAmount: 35,
  splitDescription: "Court rental",
};

/** A recurring flat $42.50 template — the share must not scale with the amount. */
export const DOLLAR_RECURRING_TEMPLATE = {
  mySharePct: null,
  myShareAmount: 42.5,
  splitDescription: "Monthly court share",
};

/** A recurring 0% template — a reimbursed charge, distinct from a dollar template's null. */
export const REIMBURSED_RECURRING_TEMPLATE = {
  mySharePct: 0,
  myShareAmount: 0,
  splitDescription: "Paid for a friend",
};

/** A percentage template as Postgres returns it — Decimal(5,4) and Decimal(15,2) arrive as strings. */
export const PG_PCT_TEMPLATE_ROW = {
  mySharePct: "0.2000",
  myShareAmount: "22.00",
  splitDescription: "Padel with friends",
};

/** A dollar template as Postgres returns it — the null percentage must survive as null. */
export const PG_DOLLAR_TEMPLATE_ROW = {
  mySharePct: null,
  myShareAmount: "42.50",
  splitDescription: "Monthly court share",
};

/** The vendor's top (PT, EC) combo from the stats view. */
export const TOP_COMBO: CategoryPair = {
  purchaseType_ID: PURCHASE_TYPE_ID,
  earningCategory_ID: EARNING_CATEGORY_ID,
};

/** A draft with neither taxonomy field chosen yet. */
export const EMPTY_DRAFT: CategoryPair = {
  purchaseType_ID: null,
  earningCategory_ID: null,
};

/** A draft whose purchase type the user already chose. */
export const PRESET_PT_DRAFT: CategoryPair = {
  purchaseType_ID: OTHER_PURCHASE_TYPE_ID,
  earningCategory_ID: null,
};

/** The draft patch an object-page vendor pick sends. */
export const VENDOR_PICK_PATCH: Record<string, unknown> = { vendor_ID: VENDOR_ID };

/** A vendor pick whose patch also clears the purchase type explicitly. */
export const VENDOR_PICK_WITH_PT_PATCH: Record<string, unknown> = {
  vendor_ID: VENDOR_ID,
  purchaseType_ID: null,
};

/** The columns the object page's suggestions section selects. */
export const MATCH_COLUMNS = [{ ref: ["matchedPattern"] }, { ref: ["matchConfidence"] }, { ref: ["ID"] }];

/** The columns a list read selects: no matcher-filled column. */
export const LIST_COLUMNS = [{ ref: ["rawDescription"] }, { ref: ["ID"] }];

/** The description + amount the matcher explains a row from. */
export const MATCH_SOURCE: TransactionMatchSource = {
  rawDescription: "UBER EATS CA #1",
  amount: -18.5,
};

/** The active pattern that matches MATCH_SOURCE. */
export const UBER_EATS_PATTERN_RECORD: MerchantPatternRecord = {
  ID: "ca5e0006-0000-0000-0000-000000000001",
  vendor_ID: VENDOR_ID,
  vendorName: "Uber Eats",
  pattern: "UBER EATS",
  matchType: "contains",
  confidenceName: "High",
  amount: null,
};

/** The object page's My Share % edit on a split draft: 20%. */
export const SHARE_PCT_PATCH = { mySharePct: 0.2 };

/** The object page's My Share Amount edit on a split draft: $42.50. */
export const SHARE_AMOUNT_PATCH = { myShareAmount: 42.5 };

/** Both share inputs in one draft patch — BR-12 allows one. */
export const SHARE_BOTH_PATCH = { mySharePct: 0.2, myShareAmount: 42.5 };

/** A split-draft patch that touches neither share input. */
export const SHARE_DESCRIPTION_PATCH = { splitDescription: "Court fees" };

/** The object page's My Share Amount cleared on a split draft — the field is optional (BR-12). */
export const SHARE_AMOUNT_CLEAR_PATCH = { myShareAmount: null };

/** The draft split's stored percentage when it is 20%-based, and when it is dollar-based. */
export const DRAFT_SPLIT_PCT = {
  PERCENT_BASED: 0.2,
  DOLLAR_BASED: null,
} as const;
