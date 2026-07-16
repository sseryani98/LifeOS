import {
  BULK_APPLY,
  DOLLAR_SPLIT,
  EMPTY_SELECTION_BULK,
  PADEL_TRANSACTION_ROW,
  PADEL_TXN_ID,
  PERCENTAGE_SPLIT,
  REIMBURSED_SPLIT,
  RESTAURANT_TXN_ID,
  TXN_A_ID,
  VENDOR_ID,
} from "../data/splits.js";
import {
  buildTransactionMocks,
  requestOf,
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
      const inserted = mocks.data.insertSplit.mock.calls[0][2];
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
      expect(request.error).toHaveBeenCalled();
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
      expect(request.error).toHaveBeenCalled();
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
});
