import {
  AUTO_STATUS,
  BULK_APPLY,
  DUPLICATE_ID_BULK_APPLY,
  EARNING_CATEGORY_ID,
  EMPTY_DRAFT,
  EARNING_CATEGORY_ONLY_SAVE,
  EMPTY_RECATEGORIZE,
  EMPTY_SELECTION_BULK,
  LIST_COLUMNS,
  MATCH_COLUMNS,
  MATCH_SOURCE,
  NOTES_ONLY_SAVE,
  PRESET_PT_DRAFT,
  PURCHASE_TYPE_ID,
  PURCHASE_TYPE_ONLY_SAVE,
  RECATEGORIZE_SELECTION,
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
});
