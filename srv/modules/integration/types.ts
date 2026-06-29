// Domain types for the transaction ingestion pipeline (W1-S2).

/** Deduplication outcomes per SPEC-01 §4.3 two-tier strategy (D-88). */
export type DedupOutcome = "new" | "duplicate" | "potential_duplicate";

/**
 * A transaction candidate handed to the deduplication engine before it is
 * persisted. Mirrors the ingestion-relevant fields of the Transaction entity.
 */
export interface IncomingTransaction {
  /** SimpleFIN stable id; null/undefined for CSV and manual sources. */
  externalId?: string | null;
  /** Mapped card instance id; null for unmapped provider accounts. */
  cardInstance_ID?: string | null;
  /** Signed amount — negative = charge, positive = credit/refund. */
  amount: number;
  /** Posting date (date only, ISO format). */
  postedAt: string;
  /** Original, unmodified bank description. */
  rawDescription: string;
  /** Ingestion source (simplefin | csv | manual). */
  source: string;
}

/** Result of evaluating an incoming transaction for duplication. */
export interface DedupResult {
  outcome: DedupOutcome;
  /** Id of the existing transaction matched, when the outcome is not "new". */
  matchedTransactionId?: string;
}

/** A single validation failure produced by DeduplicationValidator. */
export interface DedupValidationError {
  field: string;
  messageKey: string;
}
