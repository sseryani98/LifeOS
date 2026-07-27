import {
  AUTO_STATUS,
  BULK_APPLY,
  DOLLAR_SPLIT,
  DRIFTING_PCT_SPLIT,
  EMPTY_RECATEGORIZE,
  EMPTY_SELECTION_BULK,
  NEITHER_INPUT_SPLIT,
  PADEL_TRANSACTION_ROW,
  PADEL_TXN_ID,
  PERCENTAGE_SPLIT,
  RECATEGORIZE_SELECTION,
  REIMBURSED_SPLIT,
  RESTAURANT_TXN_ID,
  TXN_A_ID,
  TXN_B_ID,
  VENDOR_ID,
} from "../data/splits.js";
import {
  buildTransactionMocks,
  requestOf,
  requestWithKey,
} from "../support/transactionMocks.js";

describe("TransactionService", () => {
  describe("splitTransaction", () => {
    /** A percentage split must store myShareAmount = amount × pct so the budget reads the computed share. */
    it("computes and stores the dollar share from a percentage", async () => {
      const mocks = buildTransactionMocks();
      mocks.data.loadTransactionAmount.mockResolvedValue(PADEL_TRANSACTION_ROW);

      const result = await mocks.service.splitTransaction(
        requestOf(PERCENTAGE_SPLIT) as never,
      );

      expect(result?.myShareAmount).toBe(22);
      expect(result?.mySharePct).toBe(0.2);
      const inserted = mocks.data.insertSplit.mock.calls[0][1];
      expect(inserted.myShareAmount).toBe(22);
    });

    /** A dollar split must store the entered amount with a null percentage — the either/or contract. */
    it("stores a dollar share with a null percentage", async () => {
      const mocks = buildTransactionMocks();
      mocks.data.loadTransactionAmount.mockResolvedValue({
        ID: RESTAURANT_TXN_ID,
        amount: -85,
      });

      const result = await mocks.service.splitTransaction(
        requestOf(DOLLAR_SPLIT) as never,
      );

      expect(result?.myShareAmount).toBe(42.5);
      expect(result?.mySharePct).toBeNull();
    });

    /** A reimbursed split must store a $0 share so the whole amount falls to Reimbursable in the budget. */
    it("stores a zero share for a reimbursed transaction", async () => {
      const mocks = buildTransactionMocks();
      mocks.data.loadTransactionAmount.mockResolvedValue({
        ID: REIMBURSED_SPLIT.transactionId,
        amount: -200,
      });

      const result = await mocks.service.splitTransaction(
        requestOf(REIMBURSED_SPLIT) as never,
      );

      expect(result?.myShareAmount).toBe(0);
    });

    /** 85 × 0.35 drifts to 29.749999999999996 — the share must round to cents or the budget stores a fractional-cent share that never reconciles against the parent amount. */
    it("rounds a percentage share that drifts in floating point", async () => {
      const mocks = buildTransactionMocks();
      mocks.data.loadTransactionAmount.mockResolvedValue({
        ID: RESTAURANT_TXN_ID,
        amount: -85,
      });

      const result = await mocks.service.splitTransaction(
        requestOf(DRIFTING_PCT_SPLIT) as never,
      );

      expect(result?.myShareAmount).toBe(29.75);
    });

    /** Neither input still runs the share computation before validation rejects it — the myShareAmount default must resolve to 0, never NaN. */
    it("defaults the share to zero before rejecting a split with neither input", async () => {
      const mocks = buildTransactionMocks();
      mocks.data.loadTransactionAmount.mockResolvedValue(PADEL_TRANSACTION_ROW);
      const request = requestOf(NEITHER_INPUT_SPLIT);

      const result = await mocks.service.splitTransaction(request as never);

      expect(result).toBeUndefined();
      expect(mocks.data.insertSplit).not.toHaveBeenCalled();
    });

    /** An existing split must be replaced, not duplicated — a transaction has at most one split. */
    it("updates the existing split instead of inserting a second", async () => {
      const mocks = buildTransactionMocks();
      mocks.data.loadTransactionAmount.mockResolvedValue(PADEL_TRANSACTION_ROW);
      mocks.data.findSplitByTransaction.mockResolvedValue({ ID: "split-1" });

      await mocks.service.splitTransaction(requestOf(PERCENTAGE_SPLIT) as never);

      expect(mocks.data.updateSplit).toHaveBeenCalledWith(
        "split-1",
        expect.objectContaining({ myShareAmount: 22 }),
      );
      expect(mocks.data.insertSplit).not.toHaveBeenCalled();
    });

    /** A missing transaction must be reported, not split — never write a split against a row that does not exist. */
    it("reports an error when the transaction does not exist", async () => {
      const mocks = buildTransactionMocks();
      mocks.data.loadTransactionAmount.mockResolvedValue(null);
      const request = requestOf(PERCENTAGE_SPLIT);

      const result = await mocks.service.splitTransaction(request as never);

      expect(result).toBeUndefined();
      expect(request.error).toHaveBeenCalledWith(
        expect.objectContaining({
          code: "transaction.split.transactionNotFound",
          target: "transactionId",
          status: 404,
        }),
      );
      expect(mocks.data.insertSplit).not.toHaveBeenCalled();
    });

    /** An invalid split must surface a field error and persist nothing. */
    it("reports validation errors and persists nothing", async () => {
      const mocks = buildTransactionMocks();
      mocks.data.loadTransactionAmount.mockResolvedValue(PADEL_TRANSACTION_ROW);
      const request = requestOf({
        transactionId: PADEL_TXN_ID,
        mySharePct: 0.2,
        myShareAmount: 22,
        isRecurring: false,
      });

      const result = await mocks.service.splitTransaction(request as never);

      expect(result).toBeUndefined();
      expect(request.error).toHaveBeenCalledWith(
        expect.objectContaining({
          code: "transaction.split.enterOneInput",
          target: "mySharePct",
          status: 400,
        }),
      );
      expect(mocks.data.insertSplit).not.toHaveBeenCalled();
    });
  });

  describe("applyCategories", () => {
    /** Bulk apply must correct every selected row so one action categorizes the whole selection. */
    it("applies the correction to each selected transaction", async () => {
      const mocks = buildTransactionMocks();

      const result = await mocks.service.applyCategories(
        requestOf(BULK_APPLY) as never,
      );

      expect(result?.updatedCount).toBe(2);
      expect(mocks.categorization.correctCategorization).toHaveBeenCalledTimes(
        2,
      );
      expect(mocks.categorization.correctCategorization).toHaveBeenCalledWith(
        expect.objectContaining({ transactionId: TXN_A_ID, vendor_ID: VENDOR_ID }),
      );
    });

    /** An empty selection must be rejected before any correction fires. */
    it("reports an error and categorizes nothing when selection is empty", async () => {
      const mocks = buildTransactionMocks();
      const request = requestOf(EMPTY_SELECTION_BULK);

      const result = await mocks.service.applyCategories(request as never);

      expect(result).toBeUndefined();
      expect(request.error).toHaveBeenCalled();
      expect(mocks.categorization.correctCategorization).not.toHaveBeenCalled();
    });
  });

  describe("correctCategorization", () => {
    /** A single correction must delegate to the categorization engine so the learning mechanism fires on inline edits. */
    it("delegates a valid correction to the categorization engine", async () => {
      const mocks = buildTransactionMocks();

      await mocks.service.correctCategorization(
        requestOf({
          transactionId: TXN_A_ID,
          vendor_ID: VENDOR_ID,
          purchaseType_ID: null,
          earningCategory_ID: null,
        }) as never,
      );

      expect(mocks.categorization.correctCategorization).toHaveBeenCalledWith(
        expect.objectContaining({ transactionId: TXN_A_ID, vendor_ID: VENDOR_ID }),
      );
    });

    /** A correction missing its vendor must be rejected and never reach the engine. */
    it("reports an error and does not delegate when vendor is missing", async () => {
      const mocks = buildTransactionMocks();
      const request = requestOf({
        transactionId: TXN_A_ID,
        vendor_ID: null,
      });

      await mocks.service.correctCategorization(request as never);

      expect(request.error).toHaveBeenCalled();
      expect(mocks.categorization.correctCategorization).not.toHaveBeenCalled();
    });
  });

  describe("reCategorize", () => {
    /** Re-categorize must delegate the whole selection to the engine's batch and echo its counts back to the toolbar. */
    it("delegates the selection to the engine and returns its counts", async () => {
      const mocks = buildTransactionMocks();
      mocks.categorization.applyReCategorization.mockResolvedValue({
        recategorizedCount: 2,
        skippedCount: 0,
      });

      const result = await mocks.service.runReCategorization(
        requestOf(RECATEGORIZE_SELECTION) as never,
      );

      expect(result?.recategorizedCount).toBe(2);
      expect(mocks.categorization.applyReCategorization).toHaveBeenCalledWith([
        TXN_A_ID,
        TXN_B_ID,
      ]);
    });

    /** An empty selection must be rejected before the engine runs — the toolbar guard. */
    it("reports an error and does not run the engine when selection is empty", async () => {
      const mocks = buildTransactionMocks();
      const request = requestOf(EMPTY_RECATEGORIZE);

      const result = await mocks.service.runReCategorization(request as never);

      expect(result).toBeUndefined();
      expect(request.error).toHaveBeenCalled();
      expect(mocks.categorization.applyReCategorization).not.toHaveBeenCalled();
    });
  });

  describe("applyInlineEditLearning", () => {
    /** A draft save that changes the vendor must learn a pattern and stamp user_corrected — the only production path pattern learning fires on. */
    it("learns and stamps user_corrected when the save changes the vendor", async () => {
      const mocks = buildTransactionMocks();
      mocks.data.loadStoredVendor.mockResolvedValue(null);
      const request = requestWithKey({ vendor_ID: VENDOR_ID }, TXN_A_ID);

      await mocks.service.applyInlineEditLearning(request as never);

      expect(mocks.categorization.applyAssignmentLearning).toHaveBeenCalledWith(
        TXN_A_ID,
        VENDOR_ID,
      );
      expect(request.data.categorizationStatus).toBe("user_corrected");
    });

    /** A save that re-writes the same vendor must not learn or re-stamp — the draft-activate delivers the full row every time, so an unchanged vendor is not a correction. */
    it("does nothing when the save leaves the vendor unchanged", async () => {
      const mocks = buildTransactionMocks();
      mocks.data.loadStoredVendor.mockResolvedValue(VENDOR_ID);
      const request = requestWithKey(
        { vendor_ID: VENDOR_ID, categorizationStatus: AUTO_STATUS },
        TXN_A_ID,
      );

      await mocks.service.applyInlineEditLearning(request as never);

      expect(mocks.categorization.applyAssignmentLearning).not.toHaveBeenCalled();
      expect(request.data.categorizationStatus).toBe(AUTO_STATUS);
    });

    /** A row saved without a vendor must not fire learning — only an assigned vendor is a correction. */
    it("does nothing when the row carries no vendor", async () => {
      const mocks = buildTransactionMocks();
      const request = requestWithKey({ notes: "morning coffee" }, TXN_A_ID);

      await mocks.service.applyInlineEditLearning(request as never);

      expect(mocks.categorization.applyAssignmentLearning).not.toHaveBeenCalled();
      expect(mocks.data.loadStoredVendor).not.toHaveBeenCalled();
    });

    /** A save whose key cannot be resolved must skip learning silently, never throw out of the before-SAVE hook and fail the user's save. */
    it("skips learning when the key cannot be resolved", async () => {
      const mocks = buildTransactionMocks();
      const request = requestOf({ vendor_ID: VENDOR_ID }) as {
        data: Record<string, unknown>;
        error: jest.Mock;
      };

      await mocks.service.applyInlineEditLearning(request as never);

      expect(mocks.categorization.applyAssignmentLearning).not.toHaveBeenCalled();
      expect(mocks.data.loadStoredVendor).not.toHaveBeenCalled();
    });
  });
});
