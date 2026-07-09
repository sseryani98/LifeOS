import { BaseService } from "../shared/baseService.js";

import type { DeduplicationDataService } from "./deduplicationDataService.js";
import type { DedupResult, IncomingTransaction } from "./types.js";

/**
 * Transaction deduplication engine.
 *
 * Two tiers because only SimpleFIN rows carry a stable external id: those
 * dedupe exactly and silently, while CSV/manual rows have no such key — a
 * natural-key match there is only ever flagged `potential_duplicate` for
 * human review, never dropped.
 */
export class DeduplicationService extends BaseService {
  private readonly dataService: DeduplicationDataService;

  /**
   * Creates the engine with an injected data-access layer.
   * @param dataService Data-access layer used to look up existing transactions.
   */
  constructor(dataService: DeduplicationDataService) {
    super("integration.deduplication");
    this.dataService = dataService;
  }

  /**
   * Classifies an incoming transaction as new, duplicate, or potential duplicate.
   * @param incoming Transaction to classify against already-persisted rows.
   * @returns The dedup outcome, including the matched transaction id when applicable.
   */
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
