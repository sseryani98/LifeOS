import type { DedupValidationError, IncomingTransaction } from "./types.js";

/** Recognised ingestion sources — mirrors enums.cds TransactionSource. */
const VALID_SOURCES: readonly string[] = ["simplefin", "csv", "manual"];

/**
 * Validates that an incoming transaction carries the fields required for
 * deduplication and persistence. Pure and side-effect free; callers translate
 * the returned errors into req.error() entries at the request boundary.
 */
export class DeduplicationValidator {
  /** Returns the validation errors; an empty array means the input is valid. */
  static validate(incoming: IncomingTransaction): DedupValidationError[] {
    const errors: DedupValidationError[] = [];
    if (typeof incoming.amount !== "number" || Number.isNaN(incoming.amount)) {
      errors.push({ field: "amount", messageKey: "dedup.amountRequired" });
    }
    if (!incoming.postedAt) {
      errors.push({ field: "postedAt", messageKey: "dedup.postedAtRequired" });
    }
    if (!incoming.rawDescription || incoming.rawDescription.trim() === "") {
      errors.push({
        field: "rawDescription",
        messageKey: "dedup.rawDescriptionRequired",
      });
    }
    if (!VALID_SOURCES.includes(incoming.source)) {
      errors.push({ field: "source", messageKey: "dedup.sourceInvalid" });
    }
    return errors;
  }
}
