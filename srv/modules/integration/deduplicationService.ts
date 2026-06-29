import { BaseService } from "../shared/baseService.js";

import type { DeduplicationDataService } from "./deduplicationDataService.js";
import type { DedupResult, IncomingTransaction } from "./types.js";

/**
 * ENH-008 — Transaction deduplication engine.
 *
 * Implements the two-tier strategy from SPEC-01 §4.3 (D-88):
 *  - SimpleFIN transactions (external id present): exact match on
 *    (externalId, card) → silent `duplicate` (BR-09).
 *  - Other sources (CSV/manual, no external id): natural-key match on
 *    (rawDescription, postedAt, amount, card) → `potential_duplicate` for review.
 *  - No match → `new`.
 *
 * Consumed by INT-001 (SimpleFIN sync) and INT-002 (CSV import).
 */
export class DeduplicationService extends BaseService {
  private readonly dataService: DeduplicationDataService;

  /** Creates the engine with an injected data-access layer. */
  constructor(dataService: DeduplicationDataService) {
    super("integration.deduplication");
    this.dataService = dataService;
  }

  /** Classifies an incoming transaction as new, duplicate, or potential duplicate. */
  async evaluate(incoming: IncomingTransaction): Promise<DedupResult> {
    if (incoming.externalId) {
      const match = await this.dataService.findByExternalId(
        incoming.externalId,
        incoming.cardInstance_ID,
      );
      if (match) {
        return { outcome: "duplicate", matchedTransactionId: match.ID };
      }
      return { outcome: "new" };
    }

    const naturalMatch = await this.dataService.findByNaturalKey(
      incoming.rawDescription.trim(),
      incoming.postedAt,
      incoming.amount,
      incoming.cardInstance_ID,
    );
    if (naturalMatch) {
      return {
        outcome: "potential_duplicate",
        matchedTransactionId: naturalMatch.ID,
      };
    }
    return { outcome: "new" };
  }
}
