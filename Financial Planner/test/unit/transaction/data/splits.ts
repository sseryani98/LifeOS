// Named test data for the transaction-processing module (splits, bulk
// categorize, corrections). UPPER_SNAKE_CASE constants — no inline payloads.

import type {
  BulkCategorizeCommand,
  CorrectionCommand,
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

/** A percentage above 1 (100%) — out of range. */
export const INVALID_PCT_SPLIT: SplitCommand = {
  transactionId: PADEL_TXN_ID,
  mySharePct: 1.5,
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

/** A negative percentage — below the valid range. */
export const NEGATIVE_PCT_SPLIT: SplitCommand = {
  transactionId: PADEL_TXN_ID,
  mySharePct: -0.1,
  myShareAmount: null,
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

// ─── Bulk categorize + correction ids ────────────────────────────────────────
export const TXN_A_ID = "ca5e0002-0000-0000-0000-000000000001";
export const TXN_B_ID = "ca5e0002-0000-0000-0000-000000000002";
export const VENDOR_ID = "ca5e0003-0000-0000-0000-000000000001";
export const PURCHASE_TYPE_ID = "ca5e0004-0000-0000-0000-000000000001";
export const EARNING_CATEGORY_ID = "ca5e0005-0000-0000-0000-000000000001";

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
