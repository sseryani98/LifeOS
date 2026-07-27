// Integration test for the transaction actions (cds.test + SQLite): the engines
// run against the real in-memory DB, and the OData actions + before-SAVE hook
// run through the real facade, proving the split round-trips the schema, the
// action signatures bind, and learning dedupes by description. Custom logic only.

import cds from "@sap/cds";

import {
  BULK_CATEGORIZE_PAYLOAD,
  BULK_MISSING_VENDOR_PAYLOAD,
  BULK_TXN_1_ID,
  BULK_TXN_2_ID,
  BULK_TXN_3_ID,
  BULK_WITH_MISSING_PAYLOAD,
  DOLLAR_SPLIT_ACTION_PAYLOAD,
  INLINE_EDIT_DESCRIPTION,
  INLINE_EDIT_TXN_ID,
  MISSING_SPLIT_TXN_ID,
  OUT_OF_RANGE_SPLIT_PAYLOAD,
  RECAT_CORRECTED_1_ID,
  RECAT_UNCAT_1_ID,
  RECATEGORIZE_PAYLOAD,
  RESPLIT_TXN_ID,
  SPLIT_ACTION_PAYLOAD,
  SPLIT_TXN_ID,
  STARBUCKS_VENDOR_ID,
  UBER_EATS_VENDOR_ID,
} from "../data/transaction.js";
import {
  actionRequest,
  buildInlineEditFlow,
  buildTransactionActions,
  buildTransactionService,
  countLearnedPatternsForVendor,
  countSplitsForTransaction,
  readLearnedPatternTextsForVendor,
  readSplitByTransaction,
  readTransactionProjection,
  readTransactionState,
  registerTransactionHandlers,
  seedReCategorizeScenario,
  seedTransactionProcessing,
} from "../support/transaction.js";

const { PATCH, POST, expect } = cds.test("serve", "--with-mocks", "--in-memory");
const { postBulkCategorize, postSplitTransaction } =
  buildTransactionActions(POST);
const assignVendorViaDraft = buildInlineEditFlow(POST, PATCH);

beforeAll(registerTransactionHandlers);
beforeAll(seedTransactionProcessing);

describe("Transaction actions against SQLite", () => {
  /** A percentage split must round-trip the schema — myShareAmount is amount × pct, computed and persisted for the budget engine. */
  it("splits a transaction by percentage and stores the computed share", async () => {
    const service = buildTransactionService();

    const result = await service.splitTransaction(
      actionRequest({
        transactionId: SPLIT_TXN_ID,
        mySharePct: 0.2,
        splitDescription: "Padel with friends",
        isRecurring: true,
      }) as never,
    );

    expect(result?.myShareAmount).to.equal(22);
    const split = await readSplitByTransaction(SPLIT_TXN_ID);
    expect(split?.myShareAmount).to.equal(22);
    expect(split?.mySharePct).to.equal(0.2);
    expect(split?.isRecurring).to.equal(true);
  });

  /** Re-splitting a transaction that already has a split must replace that one row, not add a second — the schema has no unique key on transaction, so a regressed insert would silently duplicate. */
  it("replaces the existing split rather than adding a second row", async () => {
    const service = buildTransactionService();

    await service.splitTransaction(
      actionRequest({
        transactionId: RESPLIT_TXN_ID,
        myShareAmount: 40,
        isRecurring: false,
      }) as never,
    );

    const split = await readSplitByTransaction(RESPLIT_TXN_ID);
    expect(split?.myShareAmount).to.equal(40);
    expect(split?.mySharePct).to.equal(null);
    const splitCount = await countSplitsForTransaction(RESPLIT_TXN_ID);
    expect(splitCount).to.equal(1);
  });

  /** Splitting a non-existent transaction must report an error and write nothing — the data layer's not-found path must degrade safely, not throw. */
  it("reports an error when the transaction does not exist", async () => {
    const service = buildTransactionService();
    const request = actionRequest({
      transactionId: MISSING_SPLIT_TXN_ID,
      mySharePct: 0.5,
      isRecurring: false,
    });

    const result = await service.splitTransaction(request as never);

    expect(result).to.equal(undefined);
    const split = await readSplitByTransaction(MISSING_SPLIT_TXN_ID);
    expect(split).to.equal(null);
  });

  /** Bulk categorize must classify every selected row — one action stamps the whole selection user_corrected against the assigned vendor. */
  it("categorizes every row in the selection", async () => {
    const service = buildTransactionService();

    const result = await service.applyCategories(
      actionRequest(BULK_CATEGORIZE_PAYLOAD) as never,
    );

    expect(result?.updatedCount).to.equal(3);
    const first = await readTransactionState(BULK_TXN_1_ID);
    const second = await readTransactionState(BULK_TXN_2_ID);
    const third = await readTransactionState(BULK_TXN_3_ID);
    expect(first?.vendor_ID).to.equal(STARBUCKS_VENDOR_ID);
    expect(first?.categorizationStatus).to.equal("user_corrected");
    expect(second?.vendor_ID).to.equal(STARBUCKS_VENDOR_ID);
    expect(third?.vendor_ID).to.equal(STARBUCKS_VENDOR_ID);
    expect(third?.categorizationStatus).to.equal("user_corrected");
  });

  /** Learning dedupes by raw description, not by vendor: three rows over two descriptions must learn exactly two patterns — a vendor-level gate would learn 1 and leave every later variant of the second description uncategorized forever. */
  it("learns one pattern per unique description across the selection", async () => {
    const service = buildTransactionService();

    await service.applyCategories(
      actionRequest(BULK_CATEGORIZE_PAYLOAD) as never,
    );

    const learned = await countLearnedPatternsForVendor(STARBUCKS_VENDOR_ID);
    expect(learned).to.equal(2);
  });

  /** updatedCount drives the toolbar's "n transactions updated" toast, so it must count rows actually written — an id that no longer resolves is silently skipped by the engine and must not be counted. */
  it("counts only the rows it actually updated", async () => {
    const service = buildTransactionService();

    const result = await service.applyCategories(
      actionRequest(BULK_WITH_MISSING_PAYLOAD) as never,
    );

    expect(result?.updatedCount).to.equal(3);
  });

  /** Re-categorize must apply a newly-added pattern to the uncategorized rows while leaving user-corrected rows untouched — proving the re-run against the real matcher. */
  it("re-runs matching on the selection and skips user-corrected rows", async () => {
    await seedReCategorizeScenario();
    const service = buildTransactionService();

    const result = await service.runReCategorization(
      actionRequest(RECATEGORIZE_PAYLOAD) as never,
    );

    expect(result?.recategorizedCount).to.equal(3);
    expect(result?.skippedCount).to.equal(2);
    const recategorized = await readTransactionState(RECAT_UNCAT_1_ID);
    expect(recategorized?.vendor_ID).to.equal(UBER_EATS_VENDOR_ID);
    expect(recategorized?.categorizationStatus).to.equal("auto");
    const corrected = await readTransactionState(RECAT_CORRECTED_1_ID);
    expect(corrected?.vendor_ID).to.equal(STARBUCKS_VENDOR_ID);
    expect(corrected?.categorizationStatus).to.equal("user_corrected");
  });

  /** The facade's srv.on binding and the declared action signature are only proven over OData — rename the action in the CDS or typo the binding and every direct-call test stays green while CAP 404s the UI. */
  it("splits a transaction through the OData action", async () => {
    const response = await postSplitTransaction(SPLIT_ACTION_PAYLOAD);

    expect(response.status).to.equal(200);
    expect(response.data.myShareAmount).to.equal(22);
    expect(response.data.mySharePct).to.equal(0.2);
    expect(response.data.isRecurring).to.equal(true);
  });

  /** Same for bulkCategorize: proves its binding, its `many UUID` param coercion, and that the result type reaches the client. */
  it("categorizes a selection through the OData action", async () => {
    const response = await postBulkCategorize(BULK_CATEGORIZE_PAYLOAD);

    expect(response.status).to.equal(200);
    expect(response.data.updatedCount).to.equal(3);
  });

  /** Pattern learning's only production entry is the before-SAVE hook on draft activation — if the vendor-change comparison or the key resolution misses, the save still works, nothing errors, and the system silently never learns again. */
  it("learns a pattern from a vendor assigned through a draft save", async () => {
    await assignVendorViaDraft(INLINE_EDIT_TXN_ID, STARBUCKS_VENDOR_ID);

    const state = await readTransactionState(INLINE_EDIT_TXN_ID);
    expect(state?.vendor_ID).to.equal(STARBUCKS_VENDOR_ID);
    expect(state?.categorizationStatus).to.equal("user_corrected");
    const learned = await readLearnedPatternTextsForVendor(STARBUCKS_VENDOR_ID);
    expect(learned).to.include(INLINE_EDIT_DESCRIPTION);
  });

  /** @assert.range on the mySharePct action param is the declarative guard for the 0–1 fraction — a percentage above 1 must be rejected at the OData boundary. */
  it("rejects an out-of-range percentage on the split action", async () => {
    const response = await postSplitTransaction(
      OUT_OF_RANGE_SPLIT_PAYLOAD,
    ).catch((error: { status: number }) => error);

    expect(response.status).to.equal(400);
  });

  /** @mandatory on the bulkCategorize vendor_ID param is the declarative guard the client's pre-flight warning backstops — a selection missing its vendor must be rejected at the OData boundary. */
  it("rejects a bulk categorize with no vendor on the action", async () => {
    const response = await postBulkCategorize(
      BULK_MISSING_VENDOR_PAYLOAD,
    ).catch((error: { status: number }) => error);

    expect(response.status).to.equal(400);
  });

  /** A dollar-only split sends a null mySharePct; @assert.range must let null through (absent, not out of range) or every dollar split breaks. */
  it("accepts a dollar-only split with a null percentage on the action", async () => {
    const response = await postSplitTransaction(DOLLAR_SPLIT_ACTION_PAYLOAD);

    expect(response.status).to.equal(200);
    expect(response.data.mySharePct).to.equal(null);
    expect(response.data.myShareAmount).to.equal(40);
  });

  /** hasSplit is a hand-written case over split.myShareAmount driving the list's split indicator — invert it and every row shows the wrong flag with no test failing. */
  it("flags hasSplit on the projection once a split exists", async () => {
    const service = buildTransactionService();
    await service.splitTransaction(
      actionRequest(SPLIT_ACTION_PAYLOAD) as never,
    );

    const row = await readTransactionProjection(SPLIT_TXN_ID);
    const unsplit = await readTransactionProjection(BULK_TXN_3_ID);

    expect(row?.hasSplit).to.equal(true);
    expect(unsplit?.hasSplit).to.equal(false);
    expect(row?.statusCriticality).to.equal(2);
  });

  /** statusCriticality is a hand-written case driving the ObjectStatus colour — swap the 3 and the 5 and every row renders the wrong colour, silently. */
  it("derives statusCriticality from the categorization status", async () => {
    const service = buildTransactionService();
    await service.applyCategories(
      actionRequest(BULK_CATEGORIZE_PAYLOAD) as never,
    );

    const corrected = await readTransactionProjection(BULK_TXN_1_ID);

    expect(corrected?.statusCriticality).to.equal(5);
  });
});
