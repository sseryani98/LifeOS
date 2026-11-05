import {
  AUTO_STATUS,
  BULK_APPLY,
  DOLLAR_RECURRING_TEMPLATE,
  DOLLAR_SPLIT,
  DRIFTING_PCT_RECURRING_TEMPLATE,
  DRIFTING_PCT_SPLIT,
  DUPLICATE_ID_BULK_APPLY,
  EARNING_CATEGORY_ID,
  EMPTY_DRAFT,
  EARNING_CATEGORY_ONLY_SAVE,
  EMPTY_RECATEGORIZE,
  EMPTY_SELECTION_BULK,
  LIST_COLUMNS,
  MATCH_COLUMNS,
  MATCH_SOURCE,
  NEITHER_INPUT_SPLIT,
  NO_VENDOR_SUGGESTION_ROW,
  NOTES_ONLY_SAVE,
  PADEL_DRIFTING_SUGGESTION_ROW,
  PADEL_NEW_SUGGESTION_ROW,
  PADEL_NEW_TXN_ID,
  PADEL_PCT_SHARE,
  PADEL_TRANSACTION_ROW,
  PADEL_TXN_ID,
  PADEL_VENDOR_ID,
  PCT_RECURRING_TEMPLATE,
  PERCENTAGE_SPLIT,
  PRESET_PT_DRAFT,
  PURCHASE_TYPE_ID,
  PURCHASE_TYPE_ONLY_SAVE,
  RECATEGORIZE_SELECTION,
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
  STORED_AUTO_CATEGORIZATION,
  TOP_COMBO,
  TXN_A_ID,
  TXN_B_ID,
  UBER_EATS_PATTERN_RECORD,
  VALID_CORRECTION,
  VENDOR_ID,
  VENDOR_PICK_PATCH,
  VENDOR_PICK_WITH_PT_PATCH,
} from "../data/splits.js";
import {
  buildMatchContext,
  buildTransactionMocks,
  requestOf,
  requestSelecting,
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

    /** The count is distinct rows written; a row selected twice must not be counted or corrected twice. */
    it("counts a row selected twice once", async () => {
      const mocks = buildTransactionMocks();

      const result = await mocks.service.applyCategories(
        requestOf(DUPLICATE_ID_BULK_APPLY) as never,
      );

      expect(result?.updatedCount).toBe(2);
      expect(mocks.categorization.correctCategorization).toHaveBeenCalledTimes(2);
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

    /** A vendor id with no row must be refused as a 400 before any write — otherwise the FK violation surfaces as a raw database 500. */
    it("rejects an unknown vendor before correcting any row", async () => {
      const mocks = buildTransactionMocks();
      mocks.data.findMissingReferences.mockResolvedValue(["vendor_ID"]);
      const request = requestOf(BULK_APPLY);

      const result = await mocks.service.applyCategories(request as never);

      expect(result).toBeUndefined();
      expect(request.error).toHaveBeenCalledWith(
        expect.objectContaining({
          code: "transaction.categorize.unknownReference",
          target: "vendor_ID",
          status: 400,
        }),
      );
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

    /** An unknown category id must be refused as a 400 — the single-row path hits the same FK as bulk apply. */
    it("rejects an unknown earning category before correcting", async () => {
      const mocks = buildTransactionMocks();
      mocks.data.findMissingReferences.mockResolvedValue(["earningCategory_ID"]);
      const request = requestOf(VALID_CORRECTION);

      await mocks.service.correctCategorization(request as never);

      expect(request.error).toHaveBeenCalledWith(
        expect.objectContaining({
          code: "transaction.categorize.unknownReference",
          target: "earningCategory_ID",
          status: 400,
        }),
      );
      expect(mocks.categorization.correctCategorization).not.toHaveBeenCalled();
    });

    /** A correction that writes nothing must surface a 404 like split does, not a silent success the UI reads as saved. */
    it("reports not-found when the engine finds no transaction to correct", async () => {
      const mocks = buildTransactionMocks();
      mocks.categorization.correctCategorization.mockResolvedValue(false);
      const request = requestOf(VALID_CORRECTION);

      await mocks.service.correctCategorization(request as never);

      expect(request.error).toHaveBeenCalledWith(
        expect.objectContaining({
          code: "transaction.correct.transactionNotFound",
          target: "transactionId",
          status: 404,
        }),
      );
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
      mocks.data.loadStoredCategorization.mockResolvedValue(null);
      const request = requestWithKey({ vendor_ID: VENDOR_ID }, TXN_A_ID);

      await mocks.service.applyInlineEditLearning(request as never);

      expect(mocks.categorization.applyAssignmentLearning).toHaveBeenCalledWith(
        TXN_A_ID,
        VENDOR_ID,
      );
      expect(request.data.categorizationStatus).toBe("user_corrected");
    });

    /** A save that re-writes the same categorization must not learn or re-stamp — the draft-activate delivers the full row every time, so an unchanged row is not a correction. */
    it("does nothing when the save leaves the categorization unchanged", async () => {
      const mocks = buildTransactionMocks();
      mocks.data.loadStoredCategorization.mockResolvedValue(STORED_AUTO_CATEGORIZATION);
      const request = requestWithKey(NOTES_ONLY_SAVE, TXN_A_ID);

      await mocks.service.applyInlineEditLearning(request as never);

      expect(mocks.categorization.applyAssignmentLearning).not.toHaveBeenCalled();
      expect(request.data.categorizationStatus).toBe(AUTO_STATUS);
    });

    /** A PT-only change is still a human correction; left `auto`, the next re-categorize would overwrite it. */
    it("stamps user_corrected without learning when only the purchase type changes", async () => {
      const mocks = buildTransactionMocks();
      mocks.data.loadStoredCategorization.mockResolvedValue(STORED_AUTO_CATEGORIZATION);
      const request = requestWithKey(PURCHASE_TYPE_ONLY_SAVE, TXN_A_ID);

      await mocks.service.applyInlineEditLearning(request as never);

      expect(request.data.categorizationStatus).toBe("user_corrected");
      expect(mocks.categorization.applyAssignmentLearning).not.toHaveBeenCalled();
    });

    /** The earning category is the churning taxonomy; correcting it alone must protect the row from re-categorize like a PT change does. */
    it("stamps user_corrected when only the earning category changes", async () => {
      const mocks = buildTransactionMocks();
      mocks.data.loadStoredCategorization.mockResolvedValue(STORED_AUTO_CATEGORIZATION);
      const request = requestWithKey(EARNING_CATEGORY_ONLY_SAVE, TXN_A_ID);

      await mocks.service.applyInlineEditLearning(request as never);

      expect(request.data.categorizationStatus).toBe("user_corrected");
    });

    /** A vendor id with no row must be a 400 before learning inserts a pattern — otherwise draftActivate fails with the raw database FK 500. */
    it("rejects an unknown vendor before learning anything", async () => {
      const mocks = buildTransactionMocks();
      mocks.data.loadStoredCategorization.mockResolvedValue(null);
      mocks.data.findMissingReferences.mockResolvedValue(["vendor_ID"]);
      const request = requestWithKey({ vendor_ID: VENDOR_ID }, TXN_A_ID);

      await mocks.service.applyInlineEditLearning(request as never);

      expect(request.error).toHaveBeenCalledWith(
        expect.objectContaining({
          code: "transaction.categorize.unknownReference",
          target: "vendor_ID",
          status: 400,
        }),
      );
      expect(mocks.categorization.applyAssignmentLearning).not.toHaveBeenCalled();
      expect(request.data.categorizationStatus).toBeUndefined();
    });

    /** A row saved without a vendor must not fire learning — only an assigned vendor is a correction. */
    it("does nothing when the row carries no vendor", async () => {
      const mocks = buildTransactionMocks();
      const request = requestWithKey({ notes: "morning coffee" }, TXN_A_ID);

      await mocks.service.applyInlineEditLearning(request as never);

      expect(mocks.categorization.applyAssignmentLearning).not.toHaveBeenCalled();
      expect(mocks.data.loadStoredCategorization).not.toHaveBeenCalled();
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
      expect(mocks.data.loadStoredCategorization).not.toHaveBeenCalled();
    });
  });

  describe("applyVendorCategories", () => {
    /** A vendor pick fills empty PT and EC from the top combo, sparing the user the usual categories. */
    it("fills both empty fields from the vendor's top combo", async () => {
      const mocks = buildTransactionMocks();
      mocks.data.loadDraftCategorization.mockResolvedValue(EMPTY_DRAFT);
      mocks.data.loadTopCategoryCombo.mockResolvedValue(TOP_COMBO);
      const request = requestWithKey({ ...VENDOR_PICK_PATCH }, TXN_A_ID);

      await mocks.service.applyVendorCategories(request as never);

      expect(request.data.purchaseType_ID).toBe(PURCHASE_TYPE_ID);
      expect(request.data.earningCategory_ID).toBe(EARNING_CATEGORY_ID);
    });

    /** The fill touches empty fields only; overwriting the user's chosen PT would silently undo their pick. */
    it("keeps a purchase type the draft already holds", async () => {
      const mocks = buildTransactionMocks();
      mocks.data.loadDraftCategorization.mockResolvedValue(PRESET_PT_DRAFT);
      mocks.data.loadTopCategoryCombo.mockResolvedValue(TOP_COMBO);
      const request = requestWithKey({ ...VENDOR_PICK_PATCH }, TXN_A_ID);

      await mocks.service.applyVendorCategories(request as never);

      expect(request.data.purchaseType_ID).toBeUndefined();
      expect(request.data.earningCategory_ID).toBe(EARNING_CATEGORY_ID);
    });

    /** A patch that sets PT itself is the user's explicit choice in that same edit, so the fill must not override it. */
    it("leaves a field the same patch sets", async () => {
      const mocks = buildTransactionMocks();
      mocks.data.loadTopCategoryCombo.mockResolvedValue(TOP_COMBO);
      const request = requestWithKey({ ...VENDOR_PICK_WITH_PT_PATCH }, TXN_A_ID);

      await mocks.service.applyVendorCategories(request as never);

      expect(request.data.purchaseType_ID).toBeNull();
      expect(request.data.earningCategory_ID).toBe(EARNING_CATEGORY_ID);
    });

    /** A vendor with no categorized history has no combo; the patch must pass through untouched rather than fail the edit. */
    it("changes nothing when the vendor has no combo", async () => {
      const mocks = buildTransactionMocks();
      const request = requestWithKey({ ...VENDOR_PICK_PATCH }, TXN_A_ID);

      await mocks.service.applyVendorCategories(request as never);

      expect(request.data).toEqual(VENDOR_PICK_PATCH);
    });

    /** A patch that does not pick a vendor (notes, excluded) must not query the stats view on every keystroke. */
    it("skips a patch that picks no vendor", async () => {
      const mocks = buildTransactionMocks();
      const request = requestWithKey({ notes: "morning coffee" }, TXN_A_ID);

      await mocks.service.applyVendorCategories(request as never);

      expect(mocks.data.loadTopCategoryCombo).not.toHaveBeenCalled();
    });
  });

  describe("applySplitShareEdit", () => {
    /** The budget reads myShareAmount, so a percentage edit must recompute it from the charge. */
    it("recomputes the dollar share from an edited percentage", async () => {
      const mocks = buildTransactionMocks();
      mocks.data.loadDraftSplitTransactionId.mockResolvedValue(PADEL_TXN_ID);
      mocks.data.loadTransactionAmount.mockResolvedValue(PADEL_TRANSACTION_ROW);
      const request = requestOf({ ...SHARE_PCT_PATCH });

      await mocks.service.applySplitShareEdit(request as never);

      expect(request.data).toEqual({ mySharePct: 0.2, myShareAmount: PADEL_PCT_SHARE });
    });

    /** A dollar entry makes the split dollar-based, as the Split action stores it; a kept percentage would contradict it. */
    it("clears the percentage when the dollar share is edited", async () => {
      const mocks = buildTransactionMocks();
      mocks.data.loadDraftSplitTransactionId.mockResolvedValue(PADEL_TXN_ID);
      mocks.data.loadTransactionAmount.mockResolvedValue(PADEL_TRANSACTION_ROW);
      const request = requestOf({ ...SHARE_AMOUNT_PATCH });

      await mocks.service.applySplitShareEdit(request as never);

      expect(request.data).toEqual({ mySharePct: null, myShareAmount: RESTAURANT_DOLLAR_SHARE });
    });

    /** One input, not both; the error must be untargeted or the draft keeps it as a soft message and saves anyway. */
    it("refuses a patch carrying both share inputs", async () => {
      const mocks = buildTransactionMocks();
      mocks.data.loadDraftSplitTransactionId.mockResolvedValue(PADEL_TXN_ID);
      mocks.data.loadTransactionAmount.mockResolvedValue(PADEL_TRANSACTION_ROW);
      const request = requestOf({ ...SHARE_BOTH_PATCH });

      await mocks.service.applySplitShareEdit(request as never);

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

      await mocks.service.applySplitShareEdit(request as never);

      expect(mocks.data.loadDraftSplitTransactionId).not.toHaveBeenCalled();
    });

    /** A patch on a draft row that has vanished has no charge to compute from; CAP's own 404 must answer it, not a crash here. */
    it("leaves the patch alone when the draft split is gone", async () => {
      const mocks = buildTransactionMocks();
      const request = requestOf({ ...SHARE_PCT_PATCH });

      await mocks.service.applySplitShareEdit(request as never);

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

      await mocks.service.applySplitShareEdit(request as never);

      expect(request.data).toEqual({ mySharePct: 0.2, myShareAmount: PADEL_PCT_SHARE });
    });

    /** With no percentage behind it, a cleared dollar share leaves the split with no input at all; the runtime check must still refuse it. */
    it("refuses clearing the dollar share of a dollar-based split", async () => {
      const mocks = buildTransactionMocks();
      mocks.data.loadDraftSplitTransactionId.mockResolvedValue(PADEL_TXN_ID);
      mocks.data.loadDraftSplitPct.mockResolvedValue(DRAFT_SPLIT_PCT.DOLLAR_BASED);
      mocks.data.loadTransactionAmount.mockResolvedValue(PADEL_TRANSACTION_ROW);
      const request = requestOf({ ...SHARE_AMOUNT_CLEAR_PATCH });

      await mocks.service.applySplitShareEdit(request as never);

      expect(request.error).toHaveBeenCalledWith(
        expect.objectContaining({ code: "transaction.split.noInput", status: 400 }),
      );
    });
  });

  describe("applyMatchSuggestion", () => {
    /** The suggestions section shows the matched pattern and confidence, which only the matcher can compute. */
    it("fills the matched pattern and confidence when the read asks for them", async () => {
      const mocks = buildTransactionMocks();
      mocks.data.loadTransactionMatchSource.mockResolvedValue(MATCH_SOURCE);
      mocks.categorization.buildContext.mockResolvedValue(
        buildMatchContext(UBER_EATS_PATTERN_RECORD) as never,
      );
      const rows = [{ ID: TXN_A_ID, matchedPattern: null }];

      await mocks.service.applyMatchSuggestion(rows, requestSelecting(MATCH_COLUMNS) as never);

      expect(rows[0]).toEqual({ ID: TXN_A_ID, matchedPattern: "UBER EATS", matchConfidence: "High" });
    });

    /** A list read never selects the columns; running the matcher per page of rows would slow every list load. */
    it("skips a read that does not select the match columns", async () => {
      const mocks = buildTransactionMocks();
      const rows = [{ ID: TXN_A_ID }];

      await mocks.service.applyMatchSuggestion(rows, requestSelecting(LIST_COLUMNS) as never);

      expect(mocks.categorization.buildContext).not.toHaveBeenCalled();
      expect(rows[0]).toEqual({ ID: TXN_A_ID });
    });

    /** No pattern matching is a real answer (the row is uncategorized), shown as empty rather than a stale value. */
    it("fills nulls when no pattern matches", async () => {
      const mocks = buildTransactionMocks();
      mocks.data.loadTransactionMatchSource.mockResolvedValue(MATCH_SOURCE);
      const rows = [{ ID: TXN_A_ID }];

      await mocks.service.applyMatchSuggestion(rows, requestSelecting(MATCH_COLUMNS) as never);

      expect(rows[0]).toEqual({ ID: TXN_A_ID, matchedPattern: null, matchConfidence: null });
    });

    /** A single-object result (srv.run SELECT.one) must be filled like a one-row array, or the hook silently misses it. */
    it("fills a single-object result", async () => {
      const mocks = buildTransactionMocks();
      const row = { ID: TXN_A_ID };

      await mocks.service.applyMatchSuggestion(row, requestSelecting(MATCH_COLUMNS) as never);

      expect(row).toEqual({ ID: TXN_A_ID, matchedPattern: null, matchConfidence: null });
    });

    /** An empty read (no row found) has nothing to explain and must not build the matching context. */
    it("does nothing for an empty result", async () => {
      const mocks = buildTransactionMocks();

      await mocks.service.applyMatchSuggestion([], requestSelecting(MATCH_COLUMNS) as never);

      expect(mocks.categorization.buildContext).not.toHaveBeenCalled();
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

      const result = await mocks.service.findRecurringSplitSuggestion(
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

      const result = await mocks.service.findRecurringSplitSuggestion(
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

      const result = await mocks.service.findRecurringSplitSuggestion(
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

      const result = await mocks.service.findRecurringSplitSuggestion(
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

      await mocks.service.findRecurringSplitSuggestion(
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

      const result = await mocks.service.findRecurringSplitSuggestion(
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

      const result = await mocks.service.findRecurringSplitSuggestion(
        requestOf({ transactionId: PADEL_NEW_TXN_ID }) as never,
      );

      expect(result).toBeNull();
      expect(mocks.data.findLatestRecurringSplit).not.toHaveBeenCalled();
    });

    /** A missing transaction must 404 with the split's not-found key, as splitTransaction does, rather than answer "no suggestion" for a row that is gone. */
    it("reports not-found when the transaction does not exist", async () => {
      const mocks = buildTransactionMocks();
      const request = requestOf({ transactionId: PADEL_NEW_TXN_ID });

      const result = await mocks.service.findRecurringSplitSuggestion(
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

      const result = await mocks.service.findRecurringSplitSuggestion(
        requestOf({ transactionId: PADEL_NEW_TXN_ID }) as never,
      );

      expect(result?.myShareAmount).toBe(24);
      expect(mocks.data.insertSplit).not.toHaveBeenCalled();
      expect(mocks.data.updateSplit).not.toHaveBeenCalled();
    });
  });
});
