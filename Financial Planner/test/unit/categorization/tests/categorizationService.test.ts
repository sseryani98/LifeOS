import {
  APPLE_BILL_TRANSACTION,
  APPLE_TO_ICLOUD_CORRECTION,
  PADEL_CORRECTION,
  PADEL_HAUS_VENDOR_ID,
  PADEL_TRANSACTION,
} from "../data/corrections.js";
import {
  APPLE_GENERIC_PATTERN,
  ICLOUD_VENDOR_ID,
  NETFLIX_EXACT_PATTERN,
  NETFLIX_VENDOR_ID,
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

  /** A correction must persist the vendor + user_corrected status so the review surface reflects the user's decision. */
  it("writes the correction patch to the transaction", async () => {
    const mocks = buildCategorizationMocks();
    mocks.loadTransactionForCorrection.mockResolvedValue(PADEL_TRANSACTION);

    await mocks.service.correctCategorization(PADEL_CORRECTION);

    expect(mocks.updateTransactionCategorization).toHaveBeenCalledWith(
      PADEL_TRANSACTION.ID,
      expect.objectContaining({
        vendor_ID: PADEL_HAUS_VENDOR_ID,
        categorizationStatus: "user_corrected",
      }),
    );
  });

  /** A from-scratch correction must learn an exact pattern so the next identical description auto-categorizes. */
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
      }),
    );
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
    mocks.loadTransactionForCorrection.mockResolvedValue({
      ID: "txn-netflix",
      rawDescription: "NETFLIX.COM",
      amount: -22.99,
    });
    mocks.loadActivePatterns.mockResolvedValue([NETFLIX_EXACT_PATTERN]);

    await mocks.service.correctCategorization({
      transactionId: "txn-netflix",
      vendor_ID: NETFLIX_VENDOR_ID,
      purchaseType_ID: null,
      earningCategory_ID: null,
    });

    expect(mocks.insertMerchantPattern).not.toHaveBeenCalled();
  });

  /** A correction targeting a missing transaction must be a no-op — never write against a row that does not exist. */
  it("is a no-op when the transaction does not exist", async () => {
    const mocks = buildCategorizationMocks();
    mocks.loadTransactionForCorrection.mockResolvedValue(null);

    await mocks.service.correctCategorization(PADEL_CORRECTION);

    expect(mocks.updateTransactionCategorization).not.toHaveBeenCalled();
    expect(mocks.insertMerchantPattern).not.toHaveBeenCalled();
  });

  describe("applyAssignmentLearning", () => {
    /** A direct object-page vendor assignment must learn a pattern without re-writing the row (the save already persisted it). */
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
    /** Re-run must apply the fresh match as `auto` to uncategorized and auto rows so a new pattern back-fills the selection. */
    it("applies auto categorization to uncategorized and auto rows", async () => {
      const mocks = buildCategorizationMocks();
      mocks.loadTransactionsForRecategorization.mockResolvedValue([
        RECAT_UNCATEGORIZED_ROW,
        RECAT_AUTO_ROW,
      ]);
      mocks.loadActivePatterns.mockResolvedValue([NETFLIX_EXACT_PATTERN]);

      const outcome = await mocks.service.applyReCategorization([
        RECAT_UNCATEGORIZED_ID,
        RECAT_AUTO_ID,
      ]);

      expect(outcome.recategorizedCount).toBe(2);
      expect(mocks.updateTransactionCategorization).toHaveBeenCalledWith(
        RECAT_UNCATEGORIZED_ID,
        expect.objectContaining({
          vendor_ID: NETFLIX_VENDOR_ID,
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
