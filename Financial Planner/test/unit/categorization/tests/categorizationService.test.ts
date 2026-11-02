import {
  APPLE_BILL_TRANSACTION,
  APPLE_TO_ICLOUD_CORRECTION,
  NETFLIX_SELF_CORRECTION,
  NETFLIX_TRANSACTION,
  PADEL_CORRECTION,
  PADEL_HAUS_VENDOR_ID,
  PADEL_TRANSACTION,
} from "../data/corrections.js";
import {
  APPLE_GENERIC_PATTERN,
  ICLOUD_VENDOR_ID,
  LEARNED_SOURCE_ID,
  MEDIUM_CONFIDENCE_ID,
  NETFLIX_EXACT_PATTERN,
  NETFLIX_VENDOR_ID,
  STATS_BY_VENDOR,
  STREAMING_EC,
  SUBSCRIPTIONS_PT,
} from "../data/patterns.js";
import {
  RECAT_AUTO_ID,
  RECAT_AUTO_ROW,
  RECAT_UNCATEGORIZED_ID,
  RECAT_UNCATEGORIZED_ROW,
  RECAT_UNMATCHED_ROW,
  RECAT_USER_CORRECTED_ID,
  RECAT_USER_CORRECTED_ROW,
} from "../data/recategorization.js";
import { buildCategorizationMocks } from "../support/categorizationMocks.js";

describe("CategorizationService", () => {
  /** categorize must build the matcher from the live snapshot and return the vendor — the pre-fill path for CSV/backfill. */
  it("categorizes a description against the loaded pattern snapshot", async () => {
    const mocks = buildCategorizationMocks();
    mocks.loadActivePatterns.mockResolvedValue([NETFLIX_EXACT_PATTERN]);

    const result = await mocks.service.categorize({
      rawDescription: "NETFLIX.COM",
      amount: -22.99,
    });

    expect(result.vendor_ID).toBe(NETFLIX_VENDOR_ID);
  });

  /** A correction must persist the vendor, both taxonomy ids in their own slots, and user_corrected — a dropped or swapped id discards half the dual-taxonomy decision. */
  it("writes the correction patch to the transaction", async () => {
    const mocks = buildCategorizationMocks();
    mocks.loadTransactionForCorrection.mockResolvedValue(PADEL_TRANSACTION);

    await mocks.service.correctCategorization(PADEL_CORRECTION);

    expect(mocks.updateTransactionCategorization).toHaveBeenCalledWith(
      PADEL_TRANSACTION.ID,
      expect.objectContaining({
        vendor_ID: PADEL_HAUS_VENDOR_ID,
        purchaseType_ID: SUBSCRIPTIONS_PT,
        earningCategory_ID: null,
        categorizationStatus: "user_corrected",
      }),
    );
  });

  /** A from-scratch correction must learn an exact, Learned-source, Medium-confidence pattern — a higher confidence would let one correction outrank seeded patterns. */
  it("learns an exact pattern when correcting an unmatched description", async () => {
    const mocks = buildCategorizationMocks();
    mocks.loadTransactionForCorrection.mockResolvedValue(PADEL_TRANSACTION);

    await mocks.service.correctCategorization(PADEL_CORRECTION);

    expect(mocks.insertMerchantPattern).toHaveBeenCalledWith(
      expect.objectContaining({
        vendor_ID: PADEL_HAUS_VENDOR_ID,
        pattern: "PADEL HAUS TORONTO",
        matchType: "exact",
        amount: null,
        patternSource_ID: LEARNED_SOURCE_ID,
        confidenceLevel_ID: MEDIUM_CONFIDENCE_ID,
      }),
    );
    expect(mocks.resolvePatternSourceId).toHaveBeenCalledWith("Learned");
    expect(mocks.resolveConfidenceLevelId).toHaveBeenCalledWith("Medium");
  });

  /** Correcting a description that matched a different vendor must learn an amount-discriminated contains pattern. */
  it("learns an amount-discriminated pattern when re-assigning a matched vendor", async () => {
    const mocks = buildCategorizationMocks();
    mocks.loadTransactionForCorrection.mockResolvedValue(APPLE_BILL_TRANSACTION);
    mocks.loadActivePatterns.mockResolvedValue([APPLE_GENERIC_PATTERN]);

    await mocks.service.correctCategorization(APPLE_TO_ICLOUD_CORRECTION);

    expect(mocks.insertMerchantPattern).toHaveBeenCalledWith(
      expect.objectContaining({
        vendor_ID: ICLOUD_VENDOR_ID,
        matchType: "contains",
        amount: 3.99,
      }),
    );
  });

  /** No duplicate pattern when the assigned vendor already matches — otherwise every re-save would pile up identical patterns. */
  it("does not learn a pattern when the assigned vendor already matches", async () => {
    const mocks = buildCategorizationMocks();
    mocks.loadTransactionForCorrection.mockResolvedValue(NETFLIX_TRANSACTION);
    mocks.loadActivePatterns.mockResolvedValue([NETFLIX_EXACT_PATTERN]);

    await mocks.service.correctCategorization(NETFLIX_SELF_CORRECTION);

    expect(mocks.insertMerchantPattern).not.toHaveBeenCalled();
  });

  /** A correction targeting a missing transaction must write nothing and report false — bulk-categorize counts written rows from that boolean. */
  it("is a no-op when the transaction does not exist", async () => {
    const mocks = buildCategorizationMocks();
    mocks.loadTransactionForCorrection.mockResolvedValue(null);

    const written = await mocks.service.correctCategorization(PADEL_CORRECTION);

    expect(written).toBe(false);
    expect(mocks.updateTransactionCategorization).not.toHaveBeenCalled();
    expect(mocks.insertMerchantPattern).not.toHaveBeenCalled();
  });

  describe("applyAssignmentLearning", () => {
    /** Runs inside the before-SAVE hook: it must learn but never write the row, or it would overwrite the taxonomy the user is saving. */
    it("learns a pattern from a direct vendor assignment", async () => {
      const mocks = buildCategorizationMocks();
      mocks.loadTransactionForCorrection.mockResolvedValue(PADEL_TRANSACTION);

      await mocks.service.applyAssignmentLearning(
        PADEL_TRANSACTION.ID,
        PADEL_HAUS_VENDOR_ID,
      );

      expect(mocks.insertMerchantPattern).toHaveBeenCalledWith(
        expect.objectContaining({ vendor_ID: PADEL_HAUS_VENDOR_ID }),
      );
      expect(mocks.updateTransactionCategorization).not.toHaveBeenCalled();
    });

    /** A missing transaction must be a no-op — never learn against a row that does not exist. */
    it("is a no-op when the transaction does not exist", async () => {
      const mocks = buildCategorizationMocks();
      mocks.loadTransactionForCorrection.mockResolvedValue(null);

      await mocks.service.applyAssignmentLearning(PADEL_TRANSACTION.ID, PADEL_HAUS_VENDOR_ID);

      expect(mocks.insertMerchantPattern).not.toHaveBeenCalled();
    });
  });

  describe("applyReCategorization", () => {
    /** Re-run must write the fresh vendor and its top (PT, EC) in their own slots as `auto` — a nulled or swapped id would silently mis-book the back-filled rows. */
    it("applies auto categorization to uncategorized and auto rows", async () => {
      const mocks = buildCategorizationMocks();
      mocks.loadTransactionsForRecategorization.mockResolvedValue([
        RECAT_UNCATEGORIZED_ROW,
        RECAT_AUTO_ROW,
      ]);
      mocks.loadActivePatterns.mockResolvedValue([NETFLIX_EXACT_PATTERN]);
      mocks.loadStatsByVendor.mockResolvedValue(STATS_BY_VENDOR);

      const outcome = await mocks.service.applyReCategorization([
        RECAT_UNCATEGORIZED_ID,
        RECAT_AUTO_ID,
      ]);

      expect(outcome.recategorizedCount).toBe(2);
      expect(mocks.updateTransactionCategorization).toHaveBeenCalledWith(
        RECAT_UNCATEGORIZED_ID,
        expect.objectContaining({
          vendor_ID: NETFLIX_VENDOR_ID,
          purchaseType_ID: SUBSCRIPTIONS_PT,
          earningCategory_ID: STREAMING_EC,
          categorizationStatus: "auto",
        }),
      );
    });

    /** A user-corrected row must be skipped — a re-run never overrides the user's own decision. */
    it("skips user_corrected rows without writing", async () => {
      const mocks = buildCategorizationMocks();
      mocks.loadTransactionsForRecategorization.mockResolvedValue([
        RECAT_USER_CORRECTED_ROW,
      ]);
      mocks.loadActivePatterns.mockResolvedValue([NETFLIX_EXACT_PATTERN]);

      const outcome = await mocks.service.applyReCategorization([
        RECAT_USER_CORRECTED_ID,
      ]);

      expect(outcome.recategorizedCount).toBe(0);
      expect(outcome.skippedCount).toBe(1);
      expect(mocks.updateTransactionCategorization).not.toHaveBeenCalled();
    });

    /** A row no pattern matches must be left uncategorized and counted as skipped, not written. */
    it("leaves unmatched rows uncategorized", async () => {
      const mocks = buildCategorizationMocks();
      mocks.loadTransactionsForRecategorization.mockResolvedValue([
        RECAT_UNMATCHED_ROW,
      ]);
      mocks.loadActivePatterns.mockResolvedValue([NETFLIX_EXACT_PATTERN]);

      const outcome = await mocks.service.applyReCategorization([
        RECAT_UNMATCHED_ROW.ID,
      ]);

      expect(outcome.recategorizedCount).toBe(0);
      expect(outcome.skippedCount).toBe(1);
      expect(mocks.updateTransactionCategorization).not.toHaveBeenCalled();
    });
  });
});
