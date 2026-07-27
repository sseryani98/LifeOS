import { BaseService } from "../shared/baseService.js";

import { CategorizationContext } from "./categorizationContextService.js";
import { CategorizationMapper } from "./categorizationMapper.js";
import { CATEGORIZATION_STATUS, CONFIDENCE, PATTERN_SOURCE } from "./constants.js";
import type { CategorizationDataService } from "./categorizationDataService.js";
import type {
  CategorizationInput,
  CategorizationResult,
  CorrectionRequest,
  ReCategorizeOutcome,
  TransactionCategorizationRow,
} from "./types.js";

/**
 * Transaction categorization engine. Matches raw descriptions to a vendor and
 * dual taxonomy through a loaded pattern snapshot, and learns from user
 * corrections by creating MerchantPatterns.
 */
export class CategorizationService extends BaseService {
  private readonly dataService: CategorizationDataService;

  /**
   * Creates the engine bound to its data-access layer.
   * @param dataService Data-access layer for patterns, stats, and corrections.
   */
  constructor(dataService: CategorizationDataService) {
    super("categorization");
    this.dataService = dataService;
  }

  /**
   * Loads a reusable matching context — call once, categorize many rows without
   * re-querying (CSV pre-fill, backfill).
   * @returns A matching context over the current pattern/stats snapshot.
   */
  async buildContext(): Promise<CategorizationContext> {
    const [patterns, vendorCounts, statsByVendor] = await Promise.all([
      this.dataService.loadActivePatterns(),
      this.dataService.loadVendorCounts(),
      this.dataService.loadStatsByVendor(),
    ]);
    return new CategorizationContext(patterns, vendorCounts, statsByVendor);
  }

  /**
   * Categorizes a single transaction description + amount.
   * @param input The description, amount, and optional card.
   * @returns The categorization result.
   */
  async categorize(input: CategorizationInput): Promise<CategorizationResult> {
    const context = await this.buildContext();
    return context.categorize(input.rawDescription, input.amount);
  }

  /**
   * Applies a user correction and learns from it: updates the transaction's
   * vendor + taxonomy, then auto-creates a MerchantPattern so future identical
   * descriptions categorize automatically.
   * @param request Correction inputs (transaction + assignments).
   * @returns True when the correction wrote a row, false when the row was absent.
   */
  async correctCategorization(request: CorrectionRequest): Promise<boolean> {
    const transaction = await this.dataService.loadTransactionForCorrection(
      request.transactionId,
    );
    if (!transaction) {
      return false;
    }
    const patch = CategorizationMapper.toCategorizationPatch(
      request.vendor_ID,
      request.purchaseType_ID,
      request.earningCategory_ID,
    );
    await this.dataService.updateTransactionCategorization(
      transaction.ID,
      patch,
    );
    await this._applyLearning(transaction, request.vendor_ID);
    return true;
  }

  /**
   * Learns from a direct vendor assignment (an object-page/inline save) without
   * re-writing the transaction — the save itself persists the vendor. Mirrors a
   * correction's learning: creates a pattern unless the vendor already matches.
   * @param transactionId The transaction the vendor was assigned to.
   * @param vendorId The assigned vendor id.
   * @returns Resolves once any pattern is learned; a no-op for a missing row.
   */
  async applyAssignmentLearning(
    transactionId: string,
    vendorId: string,
  ): Promise<void> {
    const transaction =
      await this.dataService.loadTransactionForCorrection(transactionId);
    if (!transaction) {
      return;
    }
    await this._applyLearning(transaction, vendorId);
  }

  /**
   * Re-runs matching over a selection, applying the fresh match as an `auto`
   * categorization. user_corrected rows are left untouched (the user's decision
   * wins); rows that no longer match keep whatever categorization they already
   * had. No learning fires — a re-run is not a user correction.
   * @param transactionIds The selected transaction ids.
   * @returns Counts of rows re-categorized and rows skipped.
   */
  async applyReCategorization(
    transactionIds: string[],
  ): Promise<ReCategorizeOutcome> {
    const rows =
      await this.dataService.loadTransactionsForRecategorization(transactionIds);
    const context = await this.buildContext();
    let recategorizedCount = 0;
    let skippedCount = 0;
    for (const row of rows) {
      if (row.categorizationStatus === CATEGORIZATION_STATUS.USER_CORRECTED) {
        skippedCount += 1;
        continue;
      }
      const result = context.categorize(row.rawDescription, row.amount);
      if (result.vendor_ID === null) {
        skippedCount += 1;
        continue;
      }
      await this.dataService.updateTransactionCategorization(
        row.ID,
        CategorizationMapper.toAutoCategorizationPatch(result),
      );
      recategorizedCount += 1;
    }
    this.logger.info("STATE_CHANGE", "Re-categorization applied", {
      recategorizedCount,
      skippedCount,
    });
    return { recategorizedCount, skippedCount };
  }

  /**
   * Learns a MerchantPattern from a correction unless the assigned vendor
   * already matches the description. Uses an amount discriminator when the
   * description previously matched a different vendor.
   * @param transaction The corrected transaction (description + amount).
   * @param vendorId The assigned vendor id.
   * @returns Resolves once any pattern is created.
   */
  private async _applyLearning(
    transaction: TransactionCategorizationRow,
    vendorId: string,
  ): Promise<void> {
    const context = await this.buildContext();
    const description = transaction.rawDescription.trim();
    if (context.hasVendorMatch(vendorId, description, transaction.amount)) {
      return;
    }
    const priorMatch = context.findMatch(description, transaction.amount);
    const isDiscriminator = !!priorMatch && priorMatch.vendor_ID !== vendorId;
    const [patternSourceId, confidenceLevelId] = await Promise.all([
      this.dataService.resolvePatternSourceId(PATTERN_SOURCE.LEARNED),
      this.dataService.resolveConfidenceLevelId(CONFIDENCE.MEDIUM),
    ]);
    const insert = CategorizationMapper.toLearnedPatternInsert({
      vendorId,
      pattern: description,
      amount: transaction.amount,
      isDiscriminator,
      patternSourceId,
      confidenceLevelId,
    });
    await this.dataService.insertMerchantPattern(insert);
    this.logger.info("STATE_CHANGE", "Merchant pattern learned", {
      vendorId,
      matchType: insert.matchType,
    });
  }
}
