import {
  DOLLAR_RECURRING_TEMPLATE,
  DOLLAR_SPLIT,
  DRIFTING_PCT_RECURRING_TEMPLATE,
  DRIFTING_PCT_SPLIT,
  NEITHER_INPUT_SPLIT,
  NO_VENDOR_SUGGESTION_ROW,
  PADEL_DRIFTING_SUGGESTION_ROW,
  PADEL_NEW_SUGGESTION_ROW,
  PADEL_NEW_TXN_ID,
  PADEL_PCT_SHARE,
  PADEL_TRANSACTION_ROW,
  PADEL_TXN_ID,
  PADEL_VENDOR_ID,
  PCT_RECURRING_TEMPLATE,
  PERCENTAGE_SPLIT,
  REIMBURSED_RECURRING_TEMPLATE,
  REIMBURSED_SPLIT,
  RESTAURANT_DOLLAR_SHARE,
  RESTAURANT_TXN_ID,
  SHARE_AMOUNT_CLEAR_PATCH,
  SHARE_AMOUNT_PATCH,
  SHARE_BOTH_PATCH,
  SHARE_DESCRIPTION_PATCH,
  DRAFT_SPLIT_PCT,
  SHARE_PCT_PATCH,
} from "../data/splits.js";
import {
  buildTransactionMocks,
  requestOf,
} from "../support/transactionMocks.js";

describe("TransactionSplitService", () => {
  describe("splitTransaction", () => {
    /** A percentage split must store myShareAmount = amount × pct so the budget reads the computed share. */
    it("computes and stores the dollar share from a percentage", async () => {
      const mocks = buildTransactionMocks();
      mocks.data.loadTransactionAmount.mockResolvedValue(PADEL_TRANSACTION_ROW);

      const result = await mocks.splitService.splitTransaction(
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

      const result = await mocks.splitService.splitTransaction(
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

      const result = await mocks.splitService.splitTransaction(
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

      const result = await mocks.splitService.splitTransaction(
        requestOf(DRIFTING_PCT_SPLIT) as never,
      );

      expect(result?.myShareAmount).toBe(29.75);
    });

    /** Neither input still runs the share computation before validation rejects it — the myShareAmount default must resolve to 0, never NaN. */
    it("defaults the share to zero before rejecting a split with neither input", async () => {
      const mocks = buildTransactionMocks();
      mocks.data.loadTransactionAmount.mockResolvedValue(PADEL_TRANSACTION_ROW);
      const request = requestOf(NEITHER_INPUT_SPLIT);

      const result = await mocks.splitService.splitTransaction(request as never);

      expect(result).toBeUndefined();
      expect(mocks.data.insertSplit).not.toHaveBeenCalled();
    });

    /** An existing split must be replaced, not duplicated — a transaction has at most one split. */
    it("updates the existing split instead of inserting a second", async () => {
      const mocks = buildTransactionMocks();
      mocks.data.loadTransactionAmount.mockResolvedValue(PADEL_TRANSACTION_ROW);
      mocks.data.findSplitByTransaction.mockResolvedValue({ ID: "split-1" });

      await mocks.splitService.splitTransaction(requestOf(PERCENTAGE_SPLIT) as never);

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

      const result = await mocks.splitService.splitTransaction(request as never);

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

      const result = await mocks.splitService.splitTransaction(request as never);

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

  describe("applySplitShareEdit", () => {
    /** The budget reads myShareAmount, so a percentage edit must recompute it from the charge. */
    it("recomputes the dollar share from an edited percentage", async () => {
      const mocks = buildTransactionMocks();
      mocks.data.loadDraftSplitTransactionId.mockResolvedValue(PADEL_TXN_ID);
      mocks.data.loadTransactionAmount.mockResolvedValue(PADEL_TRANSACTION_ROW);
      const request = requestOf({ ...SHARE_PCT_PATCH });

      await mocks.splitService.applySplitShareEdit(request as never);

      expect(request.data).toEqual({ mySharePct: 0.2, myShareAmount: PADEL_PCT_SHARE });
    });

    /** A dollar entry makes the split dollar-based, as the Split action stores it; a kept percentage would contradict it. */
    it("clears the percentage when the dollar share is edited", async () => {
      const mocks = buildTransactionMocks();
      mocks.data.loadDraftSplitTransactionId.mockResolvedValue(PADEL_TXN_ID);
      mocks.data.loadTransactionAmount.mockResolvedValue(PADEL_TRANSACTION_ROW);
      const request = requestOf({ ...SHARE_AMOUNT_PATCH });

      await mocks.splitService.applySplitShareEdit(request as never);

      expect(request.data).toEqual({ mySharePct: null, myShareAmount: RESTAURANT_DOLLAR_SHARE });
    });

    /** One input, not both; the error must be untargeted or the draft keeps it as a soft message and saves anyway. */
    it("refuses a patch carrying both share inputs", async () => {
      const mocks = buildTransactionMocks();
      mocks.data.loadDraftSplitTransactionId.mockResolvedValue(PADEL_TXN_ID);
      mocks.data.loadTransactionAmount.mockResolvedValue(PADEL_TRANSACTION_ROW);
      const request = requestOf({ ...SHARE_BOTH_PATCH });

      await mocks.splitService.applySplitShareEdit(request as never);

      expect(request.error).toHaveBeenCalledWith(
        expect.not.objectContaining({ target: expect.anything() }),
      );
      expect(request.error).toHaveBeenCalledWith(
        expect.objectContaining({ code: "transaction.split.enterOneInput", status: 400 }),
      );
    });

    /** A description or recurring-toggle edit carries no share, so it must not cost a lookup on every keystroke. */
    it("skips a patch that touches neither share input", async () => {
      const mocks = buildTransactionMocks();
      const request = requestOf({ ...SHARE_DESCRIPTION_PATCH });

      await mocks.splitService.applySplitShareEdit(request as never);

      expect(mocks.data.loadDraftSplitTransactionId).not.toHaveBeenCalled();
    });

    /** A patch on a draft row that has vanished has no charge to compute from; CAP's own 404 must answer it, not a crash here. */
    it("leaves the patch alone when the draft split is gone", async () => {
      const mocks = buildTransactionMocks();
      const request = requestOf({ ...SHARE_PCT_PATCH });

      await mocks.splitService.applySplitShareEdit(request as never);

      expect(request.data).toEqual(SHARE_PCT_PATCH);
      expect(mocks.data.loadTransactionAmount).not.toHaveBeenCalled();
    });

    /** My Share Amount is optional on the page; cleared on a percentage split, it is the percentage's share again, never a null the budget reads. */
    it("recomputes a cleared dollar share from the draft's percentage", async () => {
      const mocks = buildTransactionMocks();
      mocks.data.loadDraftSplitTransactionId.mockResolvedValue(PADEL_TXN_ID);
      mocks.data.loadDraftSplitPct.mockResolvedValue(DRAFT_SPLIT_PCT.PERCENT_BASED);
      mocks.data.loadTransactionAmount.mockResolvedValue(PADEL_TRANSACTION_ROW);
      const request = requestOf({ ...SHARE_AMOUNT_CLEAR_PATCH });

      await mocks.splitService.applySplitShareEdit(request as never);

      expect(request.data).toEqual({ mySharePct: 0.2, myShareAmount: PADEL_PCT_SHARE });
    });

    /** With no percentage behind it, a cleared dollar share leaves the split with no input at all; the runtime check must still refuse it. */
    it("refuses clearing the dollar share of a dollar-based split", async () => {
      const mocks = buildTransactionMocks();
      mocks.data.loadDraftSplitTransactionId.mockResolvedValue(PADEL_TXN_ID);
      mocks.data.loadDraftSplitPct.mockResolvedValue(DRAFT_SPLIT_PCT.DOLLAR_BASED);
      mocks.data.loadTransactionAmount.mockResolvedValue(PADEL_TRANSACTION_ROW);
      const request = requestOf({ ...SHARE_AMOUNT_CLEAR_PATCH });

      await mocks.splitService.applySplitShareEdit(request as never);

      expect(request.error).toHaveBeenCalledWith(
        expect.objectContaining({ code: "transaction.split.noInput", status: 400 }),
      );
    });
  });

  describe("findRecurringSplitSuggestion", () => {
    /** A percentage template must recalculate on the new charge — copying the old dollar share would pre-fill the wrong amount for every differently-priced recurrence. */
    it("recalculates a percentage template on the new amount", async () => {
      const mocks = buildTransactionMocks();
      mocks.data.loadTransactionForSuggestion.mockResolvedValue(
        PADEL_NEW_SUGGESTION_ROW,
      );
      mocks.data.findLatestRecurringSplit.mockResolvedValue(PCT_RECURRING_TEMPLATE);

      const result = await mocks.splitService.findRecurringSplitSuggestion(
        requestOf({ transactionId: PADEL_NEW_TXN_ID }) as never,
      );

      expect(result).toEqual({
        mySharePct: 0.2,
        myShareAmount: 24,
        splitDescription: "Padel with friends",
        isRecurring: true,
      });
    });

    /** The recalculated share is a pre-filled dollar value — 85 × 0.35 must round to cents or the dialog shows 29.749999999999996. */
    it("rounds a recalculated percentage share to cents", async () => {
      const mocks = buildTransactionMocks();
      mocks.data.loadTransactionForSuggestion.mockResolvedValue(
        PADEL_DRIFTING_SUGGESTION_ROW,
      );
      mocks.data.findLatestRecurringSplit.mockResolvedValue(
        DRIFTING_PCT_RECURRING_TEMPLATE,
      );

      const result = await mocks.splitService.findRecurringSplitSuggestion(
        requestOf({ transactionId: PADEL_NEW_TXN_ID }) as never,
      );

      expect(result?.myShareAmount).toBe(29.75);
      expect(result?.mySharePct).toBe(0.35);
    });

    /** A dollar template keeps its fixed share whatever the new charge is, and its null percentage must stay null so the dialog opens in dollar mode. */
    it("keeps a dollar template's fixed share and null percentage", async () => {
      const mocks = buildTransactionMocks();
      mocks.data.loadTransactionForSuggestion.mockResolvedValue(
        PADEL_NEW_SUGGESTION_ROW,
      );
      mocks.data.findLatestRecurringSplit.mockResolvedValue(DOLLAR_RECURRING_TEMPLATE);

      const result = await mocks.splitService.findRecurringSplitSuggestion(
        requestOf({ transactionId: PADEL_NEW_TXN_ID }) as never,
      );

      expect(result).toEqual({
        mySharePct: null,
        myShareAmount: 42.5,
        splitDescription: "Monthly court share",
        isRecurring: true,
      });
    });

    /** A reimbursed split is pct 0, and 0 is not null: a falsy check would turn the template into a dollar one and save the next charge as pct null. */
    it("keeps a reimbursed template's 0% as a percentage, not a dollar share", async () => {
      const mocks = buildTransactionMocks();
      mocks.data.loadTransactionForSuggestion.mockResolvedValue(
        PADEL_NEW_SUGGESTION_ROW,
      );
      mocks.data.findLatestRecurringSplit.mockResolvedValue(
        REIMBURSED_RECURRING_TEMPLATE,
      );

      const result = await mocks.splitService.findRecurringSplitSuggestion(
        requestOf({ transactionId: PADEL_NEW_TXN_ID }) as never,
      );

      expect(result?.mySharePct).toBe(0);
      expect(result?.myShareAmount).toBe(0);
      expect(result?.isRecurring).toBe(true);
    });

    /** The template lookup is keyed on the transaction's vendor and must skip the transaction itself, or a re-opened dialog suggests its own split back. */
    it("looks up the template by vendor, excluding the transaction itself", async () => {
      const mocks = buildTransactionMocks();
      mocks.data.loadTransactionForSuggestion.mockResolvedValue(
        PADEL_NEW_SUGGESTION_ROW,
      );

      await mocks.splitService.findRecurringSplitSuggestion(
        requestOf({ transactionId: PADEL_NEW_TXN_ID }) as never,
      );

      expect(mocks.data.loadTransactionForSuggestion).toHaveBeenCalledWith(
        PADEL_NEW_TXN_ID,
      );
      expect(mocks.data.findLatestRecurringSplit).toHaveBeenCalledWith(
        PADEL_VENDOR_ID,
        PADEL_NEW_TXN_ID,
      );
    });

    /** No recurring split for the vendor means no suggestion — the dialog must open blank, not with invented terms. */
    it("returns null when the vendor has no recurring split", async () => {
      const mocks = buildTransactionMocks();
      mocks.data.loadTransactionForSuggestion.mockResolvedValue(
        PADEL_NEW_SUGGESTION_ROW,
      );
      mocks.data.findLatestRecurringSplit.mockResolvedValue(null);

      const result = await mocks.splitService.findRecurringSplitSuggestion(
        requestOf({ transactionId: PADEL_NEW_TXN_ID }) as never,
      );

      expect(result).toBeNull();
    });

    /** The vendor is the only matching key — an unassigned charge has nothing to match on, so no template is looked up at all. */
    it("returns null without a lookup when the transaction has no vendor", async () => {
      const mocks = buildTransactionMocks();
      mocks.data.loadTransactionForSuggestion.mockResolvedValue(
        NO_VENDOR_SUGGESTION_ROW,
      );

      const result = await mocks.splitService.findRecurringSplitSuggestion(
        requestOf({ transactionId: PADEL_NEW_TXN_ID }) as never,
      );

      expect(result).toBeNull();
      expect(mocks.data.findLatestRecurringSplit).not.toHaveBeenCalled();
    });

    /** A missing transaction must 404 with the split's not-found key, as splitTransaction does, rather than answer "no suggestion" for a row that is gone. */
    it("reports not-found when the transaction does not exist", async () => {
      const mocks = buildTransactionMocks();
      const request = requestOf({ transactionId: PADEL_NEW_TXN_ID });

      const result = await mocks.splitService.findRecurringSplitSuggestion(
        request as never,
      );

      expect(result).toBeFalsy();
      expect(request.error).toHaveBeenCalledWith(
        expect.objectContaining({
          code: "transaction.split.transactionNotFound",
          target: "transactionId",
          status: 404,
        }),
      );
      expect(mocks.data.findLatestRecurringSplit).not.toHaveBeenCalled();
    });

    /** Recurring splits are suggested only, never auto-applied — building a suggestion must write no split. */
    it("writes no split while building a suggestion", async () => {
      const mocks = buildTransactionMocks();
      mocks.data.loadTransactionForSuggestion.mockResolvedValue(
        PADEL_NEW_SUGGESTION_ROW,
      );
      mocks.data.findLatestRecurringSplit.mockResolvedValue(PCT_RECURRING_TEMPLATE);

      const result = await mocks.splitService.findRecurringSplitSuggestion(
        requestOf({ transactionId: PADEL_NEW_TXN_ID }) as never,
      );

      expect(result?.myShareAmount).toBe(24);
      expect(mocks.data.insertSplit).not.toHaveBeenCalled();
      expect(mocks.data.updateSplit).not.toHaveBeenCalled();
    });
  });
});
