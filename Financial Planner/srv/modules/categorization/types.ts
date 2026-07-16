// Domain types for the categorization engine. Class files in this module hold
// no named types — they all live here.

/** An active Merchant Pattern in the shape the matcher needs. */
export interface MerchantPatternRecord {
  ID: string;
  vendor_ID: string;
  vendorName: string;
  pattern: string;
  /** One of enums.cds MatchType: exact | starts_with | contains. */
  matchType: string;
  /** ConfidenceLevel name (high | medium | low) — a matching tie-breaker. */
  confidenceName: string;
  /** Discriminator amount (absolute value); null when the pattern ignores amount. */
  amount: number | null;
}

/** One (purchaseType, earningCategory) combination ranked by usage count. */
export interface CategoryCombo {
  purchaseType_ID: string | null;
  earningCategory_ID: string | null;
  usageCount: number;
}

/** Inputs to a single categorization request. */
export interface CategorizationInput {
  rawDescription: string;
  /** Signed amount — negative = charge; used for amount-discriminated patterns. */
  amount: number | null;
  cardInstance_ID?: string | null;
}

/**
 * Categorization outcome. `status` is `auto` when a vendor matched, otherwise
 * `uncategorized`; callers decide whether to apply or merely suggest.
 */
export interface CategorizationResult {
  vendor_ID: string | null;
  vendorName: string | null;
  purchaseType_ID: string | null;
  earningCategory_ID: string | null;
  /** Confidence of the matched pattern (high | medium | low), null on no match. */
  confidence: string | null;
  /** Runner-up (PT, EC) combos for the matched vendor, ranked by count. */
  alternatives: CategoryCombo[];
  status: string;
}

/** Inputs to a user categorization correction (learning trigger). */
export interface CorrectionRequest {
  transactionId?: string | null;
  vendor_ID?: string | null;
  purchaseType_ID?: string | null;
  earningCategory_ID?: string | null;
}

/** A single validation failure produced by CategorizationValidator. */
export interface CategorizationValidationError {
  field: string;
  messageKey: string;
}

/** The transaction fields the correction flow reads before learning. */
export interface TransactionCategorizationRow {
  ID: string;
  rawDescription: string;
  amount: number;
}

/** Inputs for assembling a learned MerchantPattern from a correction. */
export interface LearnedPatternParams {
  id: string;
  vendorId: string;
  pattern: string;
  /** The transaction's signed amount, used when discriminating by amount. */
  amount: number;
  /** Whether the description already matched a different vendor. */
  isDiscriminator: boolean;
  patternSourceId: string;
  confidenceLevelId: string;
}

/** A MerchantPattern insert row assembled during learning. */
export interface MerchantPatternInsert {
  ID: string;
  vendor_ID: string;
  pattern: string;
  matchType: string;
  patternSource_ID: string;
  confidenceLevel_ID: string;
  amount: number | null;
  isActive: boolean;
}

/** The categorization fields written to a transaction on correction. */
export interface TransactionCategorizationPatch {
  vendor_ID: string;
  purchaseType_ID: string | null;
  earningCategory_ID: string | null;
  categorizationStatus: string;
}
