// Runs the engines against the real in-memory DB and the OData actions + before-SAVE
// hook through the real facade: the split round-trips the schema, the action
// signatures bind, and learning dedupes by description. Custom logic only.

import cds from "@sap/cds";

import {
  DINING_EARNING_CATEGORY,
  FAST_FOOD_PURCHASE_TYPE,
  RESTAURANTS_PURCHASE_TYPE,
} from "../../../shared/data/reference.js";

import {
  AUTO_EDIT_TXN_ID,
  BULK_CATEGORIZE_PAYLOAD,
  BULK_KEEP_TXN_ID,
  BULK_VENDOR_ONLY_PAYLOAD,
  BULK_MISSING_VENDOR_PAYLOAD,
  BULK_TXN_1_ID,
  CHARGE_TXN_ID,
  METADATA_TARGET,
  REFUND_TXN_ID,
  BULK_TXN_2_ID,
  BULK_TXN_3_ID,
  BULK_UNKNOWN_VENDOR_PAYLOAD,
  BULK_WITH_MISSING_PAYLOAD,
  CORRECT_ACTION_PAYLOAD,
  CORRECTION_DESCRIPTION,
  CORRECTION_TXN_ID,
  COURT_SHARE_NEW_TXN_ID,
  DOLLAR_SPLIT_ACTION_PAYLOAD,
  FACET_LABELS,
  HIDDEN_WHEN_EMPTY,
  LINE_ITEM_LABEL,
  INLINE_EDIT_DESCRIPTION,
  INLINE_EDIT_TXN_ID,
  MATCH_COLUMNS,
  MATCH_DRAFT_TXN_ID,
  MISSING_CORRECTION_PAYLOAD,
  MISSING_SPLIT_TXN_ID,
  MISSING_SUGGESTION_TXN_ID,
  NERO_FAST_FOOD_TXN_ID,
  NEVER_SEEDED_TXN_ID,
  NERO_RESTAURANT_1_TXN_ID,
  ONE_OFF_PRIOR_TXN_ID,
  ONE_OFF_NEW_TXN_ID,
  ONE_OFF_VENDOR_ID,
  OUT_OF_RANGE_SPLIT_PAYLOAD,
  PADEL_LATEST_TXN_ID,
  PADEL_NEW_TXN_ID,
  PICK_CAFE_NERO,
  PICK_CORNER_BISTRO,
  PURCHASE_TYPE_ONLY_EDIT,
  RECAT_CORRECTED_1_ID,
  RECAT_UNCAT_1_ID,
  RAW_FACET_KEYS,
  RECATEGORIZE_PAYLOAD,
  RESPLIT_TXN_ID,
  SHARE_AMOUNT_CLEAR_EDIT,
  SHARE_AMOUNT_EDIT,
  SHARE_AMOUNT_EDIT_TXN_ID,
  SHARE_BOTH_EDIT,
  SHARE_BOTH_EDIT_TXN_ID,
  SHARE_OVER_TOTAL_EDIT,
  SHARE_OVER_TOTAL_TXN_ID,
  SHARE_PCT_EDIT,
  SHARE_PCT_EDIT_TXN_ID,
  SHARE_PCT_SAVE_TXN_ID,
  SHARE_PCT_CLEAR_TXN_ID,
  SHARE_DOLLAR_CLEAR_TXN_ID,
  SPLIT_ACTION_PAYLOAD,
  SPLIT_TXN_ID,
  STARBUCKS_VENDOR_ID,
  UBER_EATS_MATCH,
  UBER_EATS_VENDOR_ID,
  UNASSIGNED_TXN_ID,
  UNKNOWN_VENDOR_EDIT,
  VENDOR_FILL_EMPTY_TXN_ID,
  VENDOR_FILL_NO_COMBO_TXN_ID,
  VENDOR_FILL_PRESET_TXN_ID,
} from "../data/transaction.js";
import {
  actionRequest,
  buildDraftSaveFlow,
  buildInlineEditFlow,
  buildObjectPageDraft,
  buildRefusedDraftSaveFlow,
  buildSplitShareEdit,
  buildSuggestionQueries,
  buildTransactionActions,
  buildTransactionService,
  countLearnedPatternsForVendor,
  keyedRequest,
  countSplitsForTransaction,
  readCategoryAlternatives,
  readCategorizationStatusLabel,
  readLearnedPatternTextsForVendor,
  readAnnotationBlock,
  readServiceMetadata,
  readSourceLabel,
  readSplitByTransaction,
  readTransactionProjection,
  readTransactionState,
  registerTransactionHandlers,
  seedReCategorizeScenario,
  seedObjectPageHeaderScenario,
  seedRecurringSuggestionScenario,
  seedSplitShareEditScenario,
  selectingRequest,
  seedTransactionProcessing,
  seedVendorFillScenario,
} from "../support/transaction.js";

const { GET, PATCH, POST, expect } = cds.test(
  "serve",
  "--with-mocks",
  "--in-memory",
);
const { getSplitSuggestion, getSplitSuggestionRejection } =
  buildSuggestionQueries(GET);
const {
  postBulkCategorize,
  postCorrectCategorization,
  postReCategorize,
  postSplitTransaction,
} = buildTransactionActions(POST);
const assignVendorViaDraft = buildInlineEditFlow(POST, PATCH);
const saveDraft = buildDraftSaveFlow(POST, PATCH);
const saveDraftExpectingRefusal = buildRefusedDraftSaveFlow(POST, PATCH);
const objectPage = buildObjectPageDraft(GET, POST, PATCH);
const splitSection = buildSplitShareEdit(GET, POST, PATCH);

beforeAll(registerTransactionHandlers);
beforeAll(seedTransactionProcessing);
beforeAll(seedReCategorizeScenario);
beforeAll(seedRecurringSuggestionScenario);
beforeAll(seedVendorFillScenario);
beforeAll(seedObjectPageHeaderScenario);
beforeAll(seedSplitShareEditScenario);

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

  /** A dialog field left empty means "leave as is", never "clear": a vendor-only bulk apply that nulled PT/EC would wipe every row's taxonomy on a repeat apply. */
  it("keeps a row's purchase type and earning category when the bulk apply names only a vendor", async () => {
    const response = await postBulkCategorize(BULK_VENDOR_ONLY_PAYLOAD);

    expect(response.status).to.equal(200);
    const state = await readTransactionState(BULK_KEEP_TXN_ID);
    expect(state?.vendor_ID).to.equal(STARBUCKS_VENDOR_ID);
    expect(state?.purchaseType_ID).to.equal(FAST_FOOD_PURCHASE_TYPE.ID);
    expect(state?.earningCategory_ID).to.equal(DINING_EARNING_CATEGORY.ID);
    expect(state?.categorizationStatus).to.equal("user_corrected");
  });

  /** correctCategorization is a void action bound by string literal — only an OData call proves the binding and @mandatory params let a valid correction through, write the row, and learn its pattern. */
  it("corrects a transaction and learns its pattern through the OData action", async () => {
    const response = await postCorrectCategorization(CORRECT_ACTION_PAYLOAD);

    expect(response.status).to.equal(204);
    const state = await readTransactionState(CORRECTION_TXN_ID);
    expect(state?.vendor_ID).to.equal(STARBUCKS_VENDOR_ID);
    expect(state?.categorizationStatus).to.equal("user_corrected");
    const learned = await readLearnedPatternTextsForVendor(STARBUCKS_VENDOR_ID);
    expect(learned).to.include(CORRECTION_DESCRIPTION);
  });

  /** The engine reports a missing row by returning false; dropping that answer turns a correction that wrote nothing into a silent 2xx, where split 404s the same case. */
  it("returns 404 when correcting a transaction that does not exist", async () => {
    const response = await postCorrectCategorization(
      MISSING_CORRECTION_PAYLOAD,
    ).catch((error: { status: number }) => error);

    expect(response.status).to.equal(404);
  });

  /** reCategorize is the toolbar's action and only reaches a client over OData. It runs after the direct-call re-run above, so every row already holds its match — a repeat must report none re-categorized, or the toast claims work that never happened. */
  it("re-categorizes a selection through the OData action, counting a repeat as skipped", async () => {
    const response = await postReCategorize(RECATEGORIZE_PAYLOAD);

    expect(response.status).to.equal(200);
    expect(response.data.recategorizedCount).to.equal(0);
    expect(response.data.skippedCount).to.equal(5);
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

  /** An object-page save is a human correction: a PT-only change that left the row `auto` would let the next re-categorize overwrite it. */
  it("stamps user_corrected when a draft save changes only the purchase type", async () => {
    await saveDraft(AUTO_EDIT_TXN_ID, PURCHASE_TYPE_ONLY_EDIT);

    const state = await readTransactionState(AUTO_EDIT_TXN_ID);
    expect(state?.categorizationStatus).to.equal("user_corrected");
  });

  /** On Postgres a draft save naming an unknown vendor reached the pattern insert's FK and returned a raw 500; it must be a translated 400 before learning. */
  it("refuses a draft save naming an unknown vendor with a 400", async () => {
    const rejection = await saveDraftExpectingRefusal(
      UNASSIGNED_TXN_ID,
      UNKNOWN_VENDOR_EDIT,
    );

    expect(rejection.status).to.equal(400);
    expect(rejection.code).to.equal("transaction.categorize.unknownReference");
  });

  /** @assert.range on the mySharePct action param is the declarative guard for the 0–1 fraction — a percentage above 1 must be rejected at the OData boundary. */
  it("rejects an out-of-range percentage on the split action", async () => {
    const response = await postSplitTransaction(
      OUT_OF_RANGE_SPLIT_PAYLOAD,
    ).catch((error: { status: number }) => error);

    expect(response.status).to.equal(400);
  });

  /** The Split dialog takes a 0–100 percentage; a refusal worded "between 0 and 1" tells the user to type a fraction the dialog would divide again. */
  it("words an out-of-range percentage refusal in percent", async () => {
    const message = await postSplitTransaction(
      OUT_OF_RANGE_SPLIT_PAYLOAD,
    ).catch(
      (error: { response: { data: { error: { message: string } } } }) =>
        error.response.data.error.message,
    );

    expect(message).to.equal("Enter a percentage between 0 and 100");
  });

  /** @mandatory on the bulkCategorize vendor_ID param is the declarative guard the client's pre-flight warning backstops — a selection missing its vendor must be rejected at the OData boundary. */
  it("rejects a bulk categorize with no vendor on the action", async () => {
    const response = await postBulkCategorize(
      BULK_MISSING_VENDOR_PAYLOAD,
    ).catch((error: { status: number }) => error);

    expect(response.status).to.equal(400);
  });

  /** On Postgres an unknown vendor id hit the foreign key and returned a raw 500; the existence check must refuse it as a translated 400 first. */
  it("rejects a bulk categorize naming an unknown vendor with a 400", async () => {
    const response = await postBulkCategorize(
      BULK_UNKNOWN_VENDOR_PAYLOAD,
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

  /** The 'auto' branch is the only green in the ObjectStatus mapping — drop or renumber it and matcher-categorized rows render as uncategorized orange. */
  it("derives a positive statusCriticality for auto-categorized rows", async () => {
    const service = buildTransactionService();
    await service.runReCategorization(
      actionRequest(RECATEGORIZE_PAYLOAD) as never,
    );

    const auto = await readTransactionProjection(RECAT_UNCAT_1_ID);

    expect(auto?.statusCriticality).to.equal(3);
  });

  /** The status column shows the code's text, not the code; without the text association FE renders the raw "user_corrected". */
  it("labels a row's categorization status with its display name", async () => {
    const label = await readCategorizationStatusLabel(
      GET,
      ONE_OFF_PRIOR_TXN_ID,
    );

    expect(label).to.equal("User Corrected");
  });

  /** The Split dialog's pre-fill only reaches the UI over OData: the latest recurring split for the vendor templates a new $120 charge as 20% / $24.00, past an older recurring split and a newer one-off. */
  it("suggests the latest recurring split through the OData function", async () => {
    const response = await getSplitSuggestion(PADEL_NEW_TXN_ID);

    expect(response.status).to.equal(200);
    expect(response.data.mySharePct).to.equal(0.2);
    expect(response.data.myShareAmount).to.equal(24);
    expect(response.data.splitDescription).to.equal("Padel with friends");
    expect(response.data.isRecurring).to.equal(true);
  });

  /** A vanished row must 404 with the split's not-found key, not CAP's unknown-path 404 and not an empty suggestion the dialog reads as "no terms". */
  it("returns 404 with the split not-found key for an unknown transaction", async () => {
    const rejection = await getSplitSuggestionRejection(
      MISSING_SUGGESTION_TXN_ID,
    );

    expect(rejection.status).to.equal(404);
    expect(rejection.code).to.equal("transaction.split.transactionNotFound");
  });

  /** Recurring splits are suggested only, never auto-applied — asking for one must leave the new charge unsplit and the template untouched. */
  it("creates and changes no split when suggesting", async () => {
    await getSplitSuggestion(PADEL_NEW_TXN_ID);

    const newSplitCount = await countSplitsForTransaction(PADEL_NEW_TXN_ID);
    const template = await readSplitByTransaction(PADEL_LATEST_TXN_ID);
    expect(newSplitCount).to.equal(0);
    expect(template?.mySharePct).to.equal(0.2);
    expect(template?.myShareAmount).to.equal(22);
    expect(template?.isRecurring).to.equal(true);
  });

  /** The template comes from another transaction: re-opening the dialog on the latest Padel charge must fall back to the older recurring 50%, recomputed on its $110. */
  it("never templates a transaction from its own split", async () => {
    const response = await getSplitSuggestion(PADEL_LATEST_TXN_ID);

    expect(response.data.mySharePct).to.equal(0.5);
    expect(response.data.myShareAmount).to.equal(55);
    expect(response.data.splitDescription).to.equal("Old padel terms");
  });

  /** A dollar template keeps its fixed $15 on a $75 charge, and its null percentage must reach the dialog over the wire as null, not 0, or it opens in percentage mode. */
  it("keeps a dollar template's fixed share on a different amount", async () => {
    const response = await getSplitSuggestion(COURT_SHARE_NEW_TXN_ID);

    expect(response.status).to.equal(200);
    expect(response.data.mySharePct).to.equal(null);
    expect(response.data.myShareAmount).to.equal(15);
    expect(response.data.splitDescription).to.equal("Monthly court share");
    expect(response.data.isRecurring).to.equal(true);
  });

  /** A one-off split is not suggested again, and "no suggestion" must arrive as an empty response: a body with empty fields would pre-fill the dialog with NaN shares. */
  it("returns an empty response when the vendor's only split is one-off", async () => {
    const response = await getSplitSuggestion(ONE_OFF_NEW_TXN_ID);

    expect(response.status).to.equal(204);
    expect(response.data).to.equal("");
  });

  /** The vendor is the matching key — a charge with no vendor must answer with no suggestion, not a match against every vendor-less split. */
  it("returns an empty response for a transaction with no vendor", async () => {
    const response = await getSplitSuggestion(UNASSIGNED_TXN_ID);

    expect(response.status).to.equal(204);
    expect(response.data).to.equal("");
  });
});

describe("Transaction object page", () => {
  /** Facet labels resolve from srv/_i18n only; a key kept in the app bundle alone renders as the raw key heading. */
  it("labels the object-page sections from the service i18n bundle", async () => {
    const metadata = await readServiceMetadata(GET);

    for (const label of FACET_LABELS) {
      expect(metadata).to.include(`String="${label}"`);
    }
    for (const rawKey of RAW_FACET_KEYS) {
      expect(metadata).not.to.include(`String="${rawKey}"`);
    }
  });

  /** The page heads with the vendor; a raw bank string there hides what the row was categorized as. */
  it("titles a row with its vendor name once one is assigned", async () => {
    const row = await objectPage.readFields(
      NERO_RESTAURANT_1_TXN_ID,
      ["headerTitle"],
      true,
    );

    expect(row.headerTitle).to.equal("Cafe Nero");
  });

  /** A row with no vendor has no name to show, so the title falls back to the bank text rather than going blank. */
  it("titles a vendorless row with its raw description", async () => {
    const row = await objectPage.readFields(
      MATCH_DRAFT_TXN_ID,
      ["headerTitle"],
      true,
    );

    expect(row.headerTitle).to.equal("UBER EATS CA #9");
  });

  /** The suggestions section explains the match with the pattern and its confidence, which only the matcher computes. */
  it("shows the matched pattern and its confidence", async () => {
    const row = await objectPage.readFields(
      MATCH_DRAFT_TXN_ID,
      ["matchedPattern", "matchConfidence"],
      true,
    );

    expect(row.matchedPattern).to.equal(UBER_EATS_MATCH.pattern);
    expect(row.matchConfidence).to.equal(UBER_EATS_MATCH.confidence);
  });

  /** The object page reads the draft while editing; a fill wired only to active reads leaves the section blank in edit mode. */
  it("shows the matched pattern while the row is in draft", async () => {
    await objectPage.openDraft(MATCH_DRAFT_TXN_ID);

    const row = await objectPage.readFields(
      MATCH_DRAFT_TXN_ID,
      ["matchedPattern"],
      false,
    );

    expect(row.matchedPattern).to.equal(UBER_EATS_MATCH.pattern);
  });

  /** Alternatives are the vendor's (PT, EC) combos ranked by count, so the most-used combo leads. */
  it("lists the vendor's category combos ranked by usage", async () => {
    const alternatives = await readCategoryAlternatives(
      GET,
      NERO_FAST_FOOD_TXN_ID,
    );

    expect(alternatives).to.deep.equal([
      {
        purchaseTypeName: "Restaurants",
        earningCategoryName: "Dining",
        usageCount: 2,
      },
      {
        purchaseTypeName: "Fast Food",
        earningCategoryName: "Dining",
        usageCount: 1,
      },
    ]);
  });

  /** Picking a vendor fills empty PT and EC from its top combo, so the user is not left re-keying the usual categories. */
  it("fills empty categories from the picked vendor's top combo", async () => {
    await objectPage.openDraft(VENDOR_FILL_EMPTY_TXN_ID);
    await objectPage.patchDraft(VENDOR_FILL_EMPTY_TXN_ID, PICK_CAFE_NERO);

    const draft = await objectPage.readFields(
      VENDOR_FILL_EMPTY_TXN_ID,
      ["purchaseType_ID", "earningCategory_ID"],
      false,
    );

    expect(draft.purchaseType_ID).to.equal(RESTAURANTS_PURCHASE_TYPE.ID);
    expect(draft.earningCategory_ID).to.equal(DINING_EARNING_CATEGORY.ID);
  });

  /** The fill touches empty fields only; overwriting a purchase type the user already chose would silently undo their pick. */
  it("keeps a purchase type the draft already holds", async () => {
    await objectPage.openDraft(VENDOR_FILL_PRESET_TXN_ID);
    await objectPage.patchDraft(VENDOR_FILL_PRESET_TXN_ID, PICK_CAFE_NERO);

    const draft = await objectPage.readFields(
      VENDOR_FILL_PRESET_TXN_ID,
      ["purchaseType_ID", "earningCategory_ID"],
      false,
    );

    expect(draft.purchaseType_ID).to.equal(FAST_FOOD_PURCHASE_TYPE.ID);
    expect(draft.earningCategory_ID).to.equal(DINING_EARNING_CATEGORY.ID);
  });
  /** A vendor whose rows carry no PT or EC has no combo; the pick must still land with the taxonomy left empty. */
  it("leaves categories empty when the picked vendor has no categorized combo", async () => {
    await objectPage.openDraft(VENDOR_FILL_NO_COMBO_TXN_ID);
    await objectPage.patchDraft(
      VENDOR_FILL_NO_COMBO_TXN_ID,
      PICK_CORNER_BISTRO,
    );

    const draft = await objectPage.readFields(
      VENDOR_FILL_NO_COMBO_TXN_ID,
      ["vendor_ID", "purchaseType_ID", "earningCategory_ID"],
      false,
    );

    expect(draft.vendor_ID).to.equal(ONE_OFF_VENDOR_ID);
    expect(draft.purchaseType_ID).to.equal(null);
    expect(draft.earningCategory_ID).to.equal(null);
  });

  /** An active-row update carries no draft to read; the fill must treat the draft fields as empty rather than fail the write. */
  it("fills from the combo when the row has no open draft", async () => {
    const request = keyedRequest({ ...PICK_CAFE_NERO }, NEVER_SEEDED_TXN_ID);

    await buildTransactionService().applyVendorCategories(request as never);

    expect(request.data.purchaseType_ID).to.equal(RESTAURANTS_PURCHASE_TYPE.ID);
  });

  /** A read racing a delete finds no stored row; the explanation must come back empty, not throw out of the READ. */
  it("explains a vanished row with an empty match", async () => {
    const rows = [{ ID: NEVER_SEEDED_TXN_ID }];

    await buildTransactionService().applyMatchSuggestion(
      rows,
      selectingRequest(MATCH_COLUMNS) as never,
    );

    expect(rows[0]).to.deep.equal({
      ID: NEVER_SEEDED_TXN_ID,
      matchedPattern: null,
      matchConfidence: null,
    });
  });

  /** A save for a row with no stored baseline counts every field as changed, so the hook learns rather than skipping silently. */
  it("treats a save with no stored row as a vendor change", async () => {
    const request = keyedRequest({ ...PICK_CAFE_NERO }, NEVER_SEEDED_TXN_ID);

    await buildTransactionService().applyInlineEditLearning(request as never);

    expect(request.data.categorizationStatus).to.equal("user_corrected");
  });

  /** A filter token and a value-help row read their label from the code list's Text; without it FE shows the raw code and logs "Text Annotation for code is not defined". */
  it("gives the status code list's key its display text", async () => {
    const block = await readAnnotationBlock(GET, METADATA_TARGET.STATUS_CODE);

    expect(block).to.include('Term="Common.Text" Path="name"');
  });

  /** The spec lists "simplefin / csv" as values a person reads; the raw lowercase code is not a label. */
  it("labels a row's source with its display name", async () => {
    const label = await readSourceLabel(GET, CHARGE_TXN_ID);

    expect(label).to.equal("SimpleFIN");
  });

  /** The Source column and filter render the code's text only when the property and its code list both carry Common.Text. */
  it("shows the source code's text in place of the code", async () => {
    const source = await readAnnotationBlock(GET, METADATA_TARGET.SOURCE);
    const code = await readAnnotationBlock(GET, METADATA_TARGET.SOURCE_CODE);

    expect(source).to.include('Term="Common.Text" Path="sourceType/name"');
    expect(code).to.include('Term="Common.Text" Path="name"');
  });

  /** Amounts are Canadian dollars; without the currency FE renders a bare "-120.40" the spec calls formatted CAD. */
  it("declares the amount a CAD currency value", async () => {
    const block = await readAnnotationBlock(GET, METADATA_TARGET.AMOUNT);

    expect(block).to.include('Term="Measures.ISOCurrency" String="CAD"');
  });

  /** A split share is a dollar amount like every other on the page; without its currency it reads as a bare number beside "CAD" amounts. */
  it("declares the split share a CAD currency value", async () => {
    const block = await readAnnotationBlock(
      GET,
      METADATA_TARGET.MY_SHARE_AMOUNT,
    );

    expect(block).to.include('Term="Measures.ISOCurrency" String="CAD"');
  });

  /** The spec names the list column "Date"; the property's full "Posted Date" label truncates in a column sized for a date. */
  it("heads the list's posted-date column Date", async () => {
    const block = await readAnnotationBlock(GET, METADATA_TARGET.TRANSACTIONS);

    expect(block).to.match(LINE_ITEM_LABEL.POSTED_AT_DATE);
  });

  /** Transaction Date exists only when the source sends it; an empty one beside Posted Date reads as two conflicting dates. */
  it("hides an empty transaction date on the object page", async () => {
    const block = await readAnnotationBlock(GET, METADATA_TARGET.TRANSACTIONS);

    expect(block).to.match(HIDDEN_WHEN_EMPTY.TRANSACTED_AT);
  });

  /** The header's ObjectNumber and ObjectStatus come from header-facet DataPoints; with none the header shows only title and date. */
  it("heads the object page with the amount and the categorization status", async () => {
    const block = await readAnnotationBlock(GET, METADATA_TARGET.TRANSACTIONS);

    expect(block).to.include('Term="UI.HeaderFacets"');
    expect(block).to.include('AnnotationPath="@UI.DataPoint#Amount"');
    expect(block).to.include('AnnotationPath="@UI.FieldGroup#StatusHeader"');
    expect(block).to.match(
      /Term="UI.DataPoint" Qualifier="Amount">[^]*?Path="amountCriticality"/,
    );
  });

  /** FE draws a header DataPoint large and iconless; a FieldGroup field carries the criticality icon the list and Match card show. */
  it("heads the object page's status as a field with its criticality", async () => {
    const block = await readAnnotationBlock(GET, METADATA_TARGET.TRANSACTIONS);

    expect(block).not.to.include('AnnotationPath="@UI.DataPoint#Status"');
    expect(block).to.match(
      /Term="UI.FieldGroup" Qualifier="StatusHeader">(?=[^]*?Path="categorizationStatus")(?=[^]*?Path="statusCriticality")/,
    );
  });

  /** A refund is money back and renders green; a charge is the normal case and stays neutral, never red. */
  it("colours a refund positive and a charge neutral", async () => {
    const refund = await objectPage.readFields(
      REFUND_TXN_ID,
      ["amountCriticality"],
      true,
    );
    const charge = await objectPage.readFields(
      CHARGE_TXN_ID,
      ["amountCriticality"],
      true,
    );

    expect(refund.amountCriticality).to.equal(3);
    expect(charge.amountCriticality).to.equal(0);
  });

  /** Booleans always hold a value and a split is optional; a Mandatory field control paints required asterisks on fields nobody must fill. */
  it("marks neither boolean toggle as required in edit mode", async () => {
    const excluded = await readAnnotationBlock(
      GET,
      METADATA_TARGET.IS_EXCLUDED,
    );
    const recurring = await readAnnotationBlock(
      GET,
      METADATA_TARGET.IS_RECURRING,
    );

    expect(excluded).not.to.include("FieldControlType/Mandatory");
    expect(recurring).not.to.include("FieldControlType/Mandatory");
  });

  /** The share is either a percentage or an amount, so the Split dialog requires neither; the object page marking the amount required contradicts it. */
  it("marks My Share Amount as optional in edit mode, as the Split dialog does", async () => {
    const block = await readAnnotationBlock(
      GET,
      METADATA_TARGET.MY_SHARE_AMOUNT,
    );

    expect(block).not.to.include("FieldControlType/Mandatory");
  });
});

describe("Split section edits on the object page", () => {
  /** The budget reads myShareAmount, so a percentage edit that leaves the old amount books the wrong share. */
  it("recalculates the share amount when My Share % is edited", async () => {
    await objectPage.openDraft(SHARE_PCT_EDIT_TXN_ID);
    await splitSection.patchSplit(SHARE_PCT_EDIT_TXN_ID, SHARE_PCT_EDIT);

    const draft = await splitSection.readDraftSplit(SHARE_PCT_EDIT_TXN_ID);

    expect(draft.mySharePct).to.equal(0.25);
    expect(draft.myShareAmount).to.equal(50);
  });

  /** The recalculated share must survive activation; a draft-only fix would still persist the stale amount. */
  it("saves the recalculated share amount on activation", async () => {
    await objectPage.openDraft(SHARE_PCT_SAVE_TXN_ID);
    await splitSection.patchSplit(SHARE_PCT_SAVE_TXN_ID, SHARE_PCT_EDIT);
    await splitSection.activate(SHARE_PCT_SAVE_TXN_ID);

    const split = await readSplitByTransaction(SHARE_PCT_SAVE_TXN_ID);

    expect(split?.mySharePct).to.equal(0.25);
    expect(split?.myShareAmount).to.equal(50);
  });

  /** An amount entry makes the split dollar-based like the Split action's; a kept 50% would contradict $80 and re-scale on a recurring suggestion. */
  it("clears My Share % when My Share Amount is edited", async () => {
    await objectPage.openDraft(SHARE_AMOUNT_EDIT_TXN_ID);
    await splitSection.patchSplit(SHARE_AMOUNT_EDIT_TXN_ID, SHARE_AMOUNT_EDIT);
    await splitSection.activate(SHARE_AMOUNT_EDIT_TXN_ID);

    const split = await readSplitByTransaction(SHARE_AMOUNT_EDIT_TXN_ID);

    expect(split?.mySharePct).to.equal(null);
    expect(split?.myShareAmount).to.equal(80);
  });

  /** One input, not both — a patch carrying two disagreeing shares has no single truth to store. */
  it("refuses a patch that sets both My Share % and My Share Amount", async () => {
    await objectPage.openDraft(SHARE_BOTH_EDIT_TXN_ID);

    const rejection = await splitSection.patchSplitExpectingRefusal(
      SHARE_BOTH_EDIT_TXN_ID,
      SHARE_BOTH_EDIT,
    );

    expect(rejection).to.deep.equal({
      status: 400,
      code: "transaction.split.enterOneInput",
    });
  });

  /** The Split action caps a share at the charge; the object page must not be a way around that cap. */
  it("refuses a percentage that books more than the charge", async () => {
    await objectPage.openDraft(SHARE_OVER_TOTAL_TXN_ID);

    const rejection = await splitSection.patchSplitExpectingRefusal(
      SHARE_OVER_TOTAL_TXN_ID,
      SHARE_OVER_TOTAL_EDIT,
    );

    expect(rejection).to.deep.equal({
      status: 400,
      code: "transaction.split.amountExceedsTotal",
    });
  });

  /** My Share Amount is optional on the page as in the dialog; cleared on a percentage split it must fall back to the percentage's share, not a null the budget reads. */
  it("recomputes a cleared My Share Amount from the split's percentage", async () => {
    await objectPage.openDraft(SHARE_PCT_CLEAR_TXN_ID);
    await splitSection.patchSplit(
      SHARE_PCT_CLEAR_TXN_ID,
      SHARE_AMOUNT_CLEAR_EDIT,
    );

    const draft = await splitSection.readDraftSplit(SHARE_PCT_CLEAR_TXN_ID);

    expect(draft.mySharePct).to.equal(0.5);
    expect(draft.myShareAmount).to.equal(100);
  });

  /** Neither field is required on its own, but a split with neither has no share; the runtime check must refuse it at the patch, not fail activation. */
  it("refuses clearing My Share Amount on a dollar-based split", async () => {
    await objectPage.openDraft(SHARE_DOLLAR_CLEAR_TXN_ID);

    const rejection = await splitSection.patchSplitExpectingRefusal(
      SHARE_DOLLAR_CLEAR_TXN_ID,
      SHARE_AMOUNT_CLEAR_EDIT,
    );

    expect(rejection).to.deep.equal({
      status: 400,
      code: "transaction.split.noInput",
    });
  });
});
