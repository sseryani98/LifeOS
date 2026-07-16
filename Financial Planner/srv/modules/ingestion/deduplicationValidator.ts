import { SOURCES } from "./constants.js";
import type { DedupValidationError, IncomingTransaction } from "./types.js";

/**
 * Validates that an incoming transaction carries the fields required for
 * deduplication and persistence.
 */
export class DeduplicationValidator {
  /**
   * Returns the validation errors; an empty array means the input is valid.
   * @param incoming Transaction whose dedup-required fields are checked.
   * @returns One error per missing or invalid field; empty when valid.
   */
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
    if (!SOURCES.includes(incoming.source)) {
      errors.push({ field: "source", messageKey: "dedup.sourceInvalid" });
    }
    return errors;
  }
}
