// Domain types for the transaction-processing module (splits, bulk categorize).
// Class files in this module hold no named types — they all live here.

/** A split request: exactly one of mySharePct / myShareAmount is supplied. */
export interface SplitCommand {
  transactionId: string;
  /** Share as a fraction 0–1, or null when a dollar amount is entered. */
  mySharePct: number | null;
  /** Share in dollars, or null when a percentage is entered. */
  myShareAmount: number | null;
  splitDescription: string | null;
  isRecurring: boolean;
}

/** The persisted split, echoed back to the caller. myShareAmount is always set. */
export interface SplitResult {
  transactionId: string;
  mySharePct: number | null;
  myShareAmount: number;
  isRecurring: boolean;
}

/** A bulk categorization request over a multi-selection of transactions. */
export interface BulkCategorizeCommand {
  transactionIds: string[];
  vendor_ID: string | null;
  purchaseType_ID: string | null;
  earningCategory_ID: string | null;
}

/** Outcome of a bulk categorization — how many transactions were updated. */
export interface BulkCategorizeResult {
  updatedCount: number;
}

/** A single-transaction categorization correction (learning trigger). */
export interface CorrectionCommand {
  transactionId: string;
  vendor_ID: string | null;
  purchaseType_ID: string | null;
  earningCategory_ID: string | null;
}

/** The transaction fields the split flow reads before computing the share. */
export interface TransactionAmountRow {
  ID: string;
  amount: number;
}

/** The existing split id for a transaction, used to update rather than insert. */
export interface ExistingSplitRow {
  ID: string;
}

/** Computed split values handed to the data layer for persistence. */
export interface SplitPersistValues {
  mySharePct: number | null;
  myShareAmount: number;
  splitDescription: string | null;
  isRecurring: boolean;
}

/** A single validation failure produced by TransactionValidator. */
export interface TransactionValidationError {
  field: string;
  messageKey: string;
}
