// Domain types for the transaction-processing module (splits, recurring-split suggestion, bulk categorize).
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

/** The transaction fields the recurring-split suggestion matches and recomputes on. */
export interface SuggestionTransactionRow {
  ID: string;
  amount: number | string;
  vendor_ID: string | null;
}

/** The latest recurring split for a vendor as read, decimals possibly as strings. */
export interface RecurringSplitTemplateRow {
  mySharePct: number | string | null;
  myShareAmount: number | string;
  splitDescription: string | null;
}

/** The recurring split template with its decimals normalised to numbers. */
export interface RecurringSplitTemplate {
  mySharePct: number | null;
  myShareAmount: number;
  splitDescription: string | null;
}

/** The recurring split terms the Split dialog pre-fills; never persisted. */
export interface SplitSuggestion {
  mySharePct: number | null;
  myShareAmount: number;
  splitDescription: string | null;
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

/** A re-categorize request over a multi-selection of transactions. */
export interface ReCategorizeCommand {
  transactionIds: string[];
}

/** Outcome of a re-categorize action — rows re-matched vs rows skipped. */
export interface ReCategorizeResult {
  recategorizedCount: number;
  skippedCount: number;
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

/** The vendor and taxonomy ids a categorization assigns — each must name a live row. */
export interface CategoryReferences {
  vendor_ID: string | null;
  purchaseType_ID: string | null;
  earningCategory_ID: string | null;
}

/** A CategoryReferences field whose id names no row. */
export type CategoryReferenceField = keyof CategoryReferences;

/** The fields the matcher reads to explain a transaction's suggestion. */
export interface TransactionMatchSource {
  rawDescription: string;
  amount: number | null;
}

/** A (PT, EC) id pair: a vendor's top combo, or what a draft currently holds. */
export interface CategoryPair {
  purchaseType_ID: string | null;
  earningCategory_ID: string | null;
}
