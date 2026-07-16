import cds from "@sap/cds";

import { BaseService } from "../shared/baseService.js";

import { CategorizationContext } from "./categorizationContextService.js";
import { CategorizationMapper } from "./categorizationMapper.js";
import { CONFIDENCE, PATTERN_SOURCE } from "./constants.js";
import type { CategorizationDataService } from "./categorizationDataService.js";
import type {
  CategorizationInput,
  CategorizationResult,
  CorrectionRequest,
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
   * @returns Resolves once the correction and any learning complete.
   */
  async correctCategorization(request: CorrectionRequest): Promise<void> {
    const transaction = await this.dataService.loadTransactionForCorrection(
      request.transactionId as string,
    );
    if (!transaction) {
      return;
    }
    const patch = CategorizationMapper.toCategorizationPatch(
      request.vendor_ID as string,
      request.purchaseType_ID ?? null,
      request.earningCategory_ID ?? null,
    );
    await this.dataService.updateTransactionCategorization(
      transaction.ID,
      patch,
    );
    await this._applyLearning(transaction, request.vendor_ID as string);
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
      id: cds.utils.uuid(),
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
