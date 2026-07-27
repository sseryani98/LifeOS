// Named test data for the transaction-processing module (splits, bulk
// categorize, corrections). UPPER_SNAKE_CASE constants — no inline payloads.

import type {
  BulkCategorizeCommand,
  CorrectionCommand,
  ReCategorizeCommand,
  SplitCommand,
  TransactionAmountRow,
} from "../../../../srv/modules/transaction/types.js";

// ─── Transaction ids + amounts (amount negative = charge) ─────────────────────
export const PADEL_TXN_ID = "ca5e0001-0000-0000-0000-000000000001";
export const RESTAURANT_TXN_ID = "ca5e0001-0000-0000-0000-000000000002";
export const FRIEND_TXN_ID = "ca5e0001-0000-0000-0000-000000000003";

export const PADEL_ABS_AMOUNT = 110;
export const RESTAURANT_ABS_AMOUNT = 85;
export const FRIEND_ABS_AMOUNT = 200;

// ─── Pre-computed shares (validateSplit takes the share, not the command) ─────
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

// ─── Split commands ───────────────────────────────────────────────────────────
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

// ─── Raw action payloads (pre-mapper — untyped, as CAP delivers them) ─────────
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

// ─── Bulk categorize + correction ids ────────────────────────────────────────
export const TXN_A_ID = "ca5e0002-0000-0000-0000-000000000001";
export const TXN_B_ID = "ca5e0002-0000-0000-0000-000000000002";
export const VENDOR_ID = "ca5e0003-0000-0000-0000-000000000001";
export const PURCHASE_TYPE_ID = "ca5e0004-0000-0000-0000-000000000001";
export const EARNING_CATEGORY_ID = "ca5e0005-0000-0000-0000-000000000001";

/** A deliberately-set status on an inline patch — the stamp must not overwrite it. */
export const AUTO_STATUS = "auto";

/** Apply one vendor + taxonomy across two selected rows. */
export const BULK_APPLY: BulkCategorizeCommand = {
  transactionIds: [TXN_A_ID, TXN_B_ID],
  vendor_ID: VENDOR_ID,
  purchaseType_ID: PURCHASE_TYPE_ID,
  earningCategory_ID: EARNING_CATEGORY_ID,
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
