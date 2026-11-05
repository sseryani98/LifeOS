/// <reference types="qunit" />
import type {
  DuplicateRow,
  ExcludedEditRow,
  NewRow,
} from "com/financialplanner/csvimportwizard/model/types";

import {
  CARD_INSTANCE_ID,
  CARDHOLDER,
  CONFIG_NAME,
  DESCRIPTION,
  MATCHED_ID,
  TAXONOMY_ID,
} from "../data/constants";
import {
  buildAmazonRow,
  buildClassifiedRow,
  buildDuplicateRow,
  buildExcludedEditRow,
  buildExcludedRow,
  buildJanuaryParseResult,
  buildMatchedTransaction,
  buildNewRow,
  buildParseResult,
  buildSuggestedRow,
} from "../data/rows";
import { buildReviewHarness } from "../support/reviewStateFakes";
import type { ReviewHarness } from "../support/types";

const ctx: { harness: ReviewHarness } = {
  harness: undefined as unknown as ReviewHarness,
};

const useFreshReview = (hooks: NestedHooks): void => {
  hooks.beforeEach(() => {
    ctx.harness = buildReviewHarness();
  });
};

const readState = <T>(path: string): T => ctx.harness.state.getProperty(path) as T;

const seedReview = (
  newRows: NewRow[],
  duplicateRows: DuplicateRow[] = [],
  excludedRows: ExcludedEditRow[] = [],
): void => {
  ctx.harness.state.setProperty("/newRows", newRows);
  ctx.harness.state.setProperty("/duplicateRows", duplicateRows);
  ctx.harness.state.setProperty("/excludedRows", excludedRows);
};

QUnit.module("ReviewState — initial model", () => {
  /** The review opens with empty buckets and zero badge counts until a parse fills them. */
  QUnit.test("seeds empty buckets, zero counts and no summary", assert => {
    const state = buildReviewHarness().state;
    assert.deepEqual(
      [state.getProperty("/newRows"), state.getProperty("/newCount"), state.getProperty("/summary")],
      [[], 0, null],
    );
  });
});

QUnit.module("ReviewState — applying a parse result", hooks => {
  useFreshReview(hooks);

  /** New rows arrive pre-filled from the engine's suggestions, uncleared. */
  QUnit.test("pre-fills each New row's categorization from its suggestion", async assert => {
    await ctx.harness.review.applyParseResult(buildParseResult({ newRows: [buildSuggestedRow()] }));
    const row = readState<NewRow[]>("/newRows")[0];
    assert.deepEqual(
      [row.vendor_ID, row.purchaseType_ID, row.earningCategory_ID, row.cleared],
      [TAXONOMY_ID.VENDOR_AMAZON, TAXONOMY_ID.PURCHASE_TYPE_SHOPPING, TAXONOMY_ID.EARNING_CATEGORY_ONLINE, false],
    );
  });

  /** Each tab's badge count reflects its bucket; skipped rows are kept for the import log. */
  QUnit.test("fills the three buckets, their badge counts and the format name", async assert => {
    await ctx.harness.review.applyParseResult(buildJanuaryParseResult());
    assert.deepEqual(
      [readState("/newCount"), readState("/duplicateCount"), readState("/excludedCount"), readState("/skippedCount")],
      [2, 1, 1, 2],
    );
    assert.strictEqual(readState("/configName"), CONFIG_NAME.SCOTIA);
  });

  /** Each potential duplicate is paired with the existing transaction it matched, side by side. */
  QUnit.test("pairs each potential duplicate with its matched transaction", async assert => {
    ctx.harness.matches = { [MATCHED_ID.AMAZON]: buildMatchedTransaction() };
    await ctx.harness.review.applyParseResult(
      buildParseResult({ potentialDuplicates: [buildClassifiedRow({ matchedTransactionId: MATCHED_ID.AMAZON })] }),
    );
    const duplicate = readState<DuplicateRow[]>("/duplicateRows")[0];
    assert.deepEqual(ctx.harness.matchedLookups, [[MATCHED_ID.AMAZON]]);
    assert.deepEqual(
      [duplicate.existingPostedAt, duplicate.existingAmount, duplicate.existingDescription, duplicate.decision],
      ["2026-01-03", -42.1, DESCRIPTION.AMAZON, ""],
    );
  });

  /** A duplicate whose match cannot be loaded still shows, with blank existing columns. */
  QUnit.test("leaves the existing columns blank when a match is missing", async assert => {
    await ctx.harness.review.applyParseResult(
      buildParseResult({ potentialDuplicates: [buildClassifiedRow({ matchedTransactionId: null })] }),
    );
    const duplicate = readState<DuplicateRow[]>("/duplicateRows")[0];
    assert.deepEqual(ctx.harness.matchedLookups, [[""]]);
    assert.deepEqual(
      [duplicate.existingPostedAt, duplicate.existingAmount, duplicate.existingDescription],
      ["", 0, ""],
    );
  });

  /** An unnamed format config must show blank rather than "null", with no import progress yet. */
  QUnit.test("shows a blank format name and zero progress when the config is unnamed", async assert => {
    await ctx.harness.review.applyParseResult(buildParseResult({ configName: null }));
    assert.strictEqual(readState("/configName"), "");
    assert.strictEqual(readState("/progressPercent"), 0);
  });

  /** An Excluded row is editable, starting from the value that failed to parse. */
  QUnit.test("makes each excluded row editable from its failed value", async assert => {
    await ctx.harness.review.applyParseResult(buildParseResult({ excludedRows: [buildExcludedRow()] }));
    const excluded = readState<ExcludedEditRow[]>("/excludedRows")[0];
    assert.strictEqual(excluded.editedValue, "2026-13-45");
    assert.strictEqual(excluded.rawJoined, "2026-13-45, TIM HORTONS #1123, -4.25");
  });

  /** The Card column shows only when a row carries a supplementary cardholder. */
  QUnit.test("flags supplementary cards only when a row has a cardholder", async assert => {
    await ctx.harness.review.applyParseResult(buildParseResult({ newRows: [buildClassifiedRow()] }));
    assert.strictEqual(readState("/hasSuppCards"), false);
    await ctx.harness.review.applyParseResult(
      buildParseResult({ newRows: [buildClassifiedRow({ cardholderName: CARDHOLDER.SUPPLEMENTARY })] }),
    );
    assert.strictEqual(readState("/hasSuppCards"), true);
  });
});

QUnit.module("ReviewState — batch categorization", hooks => {
  useFreshReview(hooks);

  /** Clear propagates to same-description rows and moves the cleared totals and progress. */
  QUnit.test("clearRow confirms the row, fills its siblings and updates the totals", assert => {
    const rows = [buildAmazonRow({ amount: -42.1 }), buildNewRow({ amount: -10.05 })];
    seedReview(rows);
    ctx.harness.review.clearRow(rows[0]);
    assert.deepEqual([rows[0].cleared, rows[1].vendor_ID], [true, TAXONOMY_ID.VENDOR_AMAZON]);
    assert.deepEqual(
      [readState("/clearedCount"), readState("/totalAmount"), readState("/progressPercent")],
      [1, -42.1, 50],
    );
  });

  /** Undo reopens the row, reverts what it propagated, and the totals drop back. */
  QUnit.test("restoreRow reopens the row and reverts the rows its Clear filled", assert => {
    const rows = [buildAmazonRow(), buildNewRow()];
    seedReview(rows);
    ctx.harness.review.clearRow(rows[0]);
    ctx.harness.review.restoreRow(rows[0]);
    assert.deepEqual([rows[0].cleared, rows[1].vendor_ID], [false, null]);
    assert.deepEqual([readState("/clearedCount"), readState("/totalAmount")], [0, 0]);
  });

  /** Clear All Matching confirms only categorized rows sharing the description, and rounds the total to cents. */
  QUnit.test("clearMatchingRows confirms the categorized rows with the same description", assert => {
    const rows = [
      buildAmazonRow({ amount: -42.1 }),
      buildAmazonRow({ amount: -10.05 }),
      buildNewRow(),
      buildAmazonRow({ rawDescription: DESCRIPTION.COFFEE }),
    ];
    seedReview(rows);
    ctx.harness.review.clearMatchingRows(rows[0]);
    assert.deepEqual(rows.map(row => row.cleared), [true, true, false, false]);
    assert.deepEqual([readState("/clearedCount"), readState("/totalAmount")], [2, -52.15]);
  });

  /** Apply to Selected copies vendor, PT and EC from the source to every target, and only to them. */
  QUnit.test("copyCategorization copies the source's categorization to the targets", assert => {
    const rows = [buildAmazonRow(), buildNewRow({ vendor_ID: TAXONOMY_ID.VENDOR_COFFEE_SHOP }), buildNewRow()];
    seedReview(rows);
    ctx.harness.review.copyCategorization(rows[0], [rows[1]]);
    assert.deepEqual(
      [rows[1].vendor_ID, rows[1].purchaseType_ID, rows[1].earningCategory_ID, rows[2].vendor_ID],
      [TAXONOMY_ID.VENDOR_AMAZON, TAXONOMY_ID.PURCHASE_TYPE_SHOPPING, TAXONOMY_ID.EARNING_CATEGORY_ONLINE, null],
    );
  });
});

QUnit.module("ReviewState — duplicates and corrected rows", hooks => {
  useFreshReview(hooks);

  /** The decision is what buildSaveRows reads to include or drop the duplicate. */
  QUnit.test("setDuplicateDecision records the decision on the row", assert => {
    const duplicate = buildDuplicateRow("", -1);
    seedReview([], [duplicate]);
    ctx.harness.review.setDuplicateDecision(duplicate, "skip");
    assert.strictEqual(readState<DuplicateRow[]>("/duplicateRows")[0].decision, "skip");
  });

  /** A fixed row is appended to New and only it leaves Excluded — prior review work must survive. */
  QUnit.test("moves a corrected new row into the New tab", async assert => {
    seedReview(
      [buildAmazonRow({ cleared: true, rowNumber: 1 })],
      [],
      [buildExcludedEditRow({ rowNumber: 7 }), buildExcludedEditRow({ rowNumber: 8 })],
    );
    await ctx.harness.review.moveCorrectedRow(buildSuggestedRow({ rowNumber: 7 }));
    const rows = readState<NewRow[]>("/newRows");
    assert.deepEqual(rows.map(row => [row.rowNumber, row.cleared]), [[1, true], [7, false]]);
    assert.strictEqual(rows[1].vendor_ID, TAXONOMY_ID.VENDOR_AMAZON);
    assert.deepEqual(readState<ExcludedEditRow[]>("/excludedRows").map(row => row.rowNumber), [8]);
    assert.deepEqual([readState("/newCount"), readState("/excludedCount")], [2, 1]);
  });

  /** A corrected row that matches an existing transaction is a potential duplicate, not new. */
  QUnit.test("routes a corrected row that matches an existing one to Potential Duplicates", async assert => {
    ctx.harness.matches = { [MATCHED_ID.AMAZON]: buildMatchedTransaction() };
    seedReview([], [buildDuplicateRow("import", -5)], [buildExcludedEditRow()]);
    await ctx.harness.review.moveCorrectedRow(
      buildClassifiedRow({ rowNumber: 3, dedupOutcome: "potential_duplicate", matchedTransactionId: MATCHED_ID.AMAZON }),
    );
    const duplicates = readState<DuplicateRow[]>("/duplicateRows");
    assert.deepEqual([duplicates[0].decision, duplicates[1].existingDescription], ["import", DESCRIPTION.AMAZON]);
    assert.deepEqual(
      [readState("/newCount"), readState("/duplicateCount"), readState("/excludedCount")],
      [0, 2, 0],
    );
  });
});

QUnit.module("ReviewState — save payload", hooks => {
  useFreshReview(hooks);

  /** Only cleared New rows and duplicates marked Import Anyway are submitted, in the save shape. */
  QUnit.test("buildSaveRows keeps cleared rows and duplicates forced to import", assert => {
    seedReview(
      [buildAmazonRow({ cleared: true, amount: -42.1 }), buildNewRow({ amount: -9 })],
      [buildDuplicateRow("import", -5), buildDuplicateRow("skip", -6), buildDuplicateRow("", -7)],
    );
    const rows = ctx.harness.review.buildSaveRows();
    assert.deepEqual(rows.map(row => row.amount), [-42.1, -5]);
    assert.deepEqual(rows[0], {
      postedAt: "2026-01-03",
      amount: -42.1,
      rawDescription: DESCRIPTION.AMAZON,
      cardInstance_ID: CARD_INSTANCE_ID.SCOTIA_GOLD,
      vendor_ID: TAXONOMY_ID.VENDOR_AMAZON,
      purchaseType_ID: TAXONOMY_ID.PURCHASE_TYPE_SHOPPING,
      earningCategory_ID: TAXONOMY_ID.EARNING_CATEGORY_ONLINE,
    });
  });

  /** With no cleared row and no forced duplicate there is nothing to import. */
  QUnit.test("buildSaveRows is empty when nothing is cleared or forced", assert => {
    seedReview([buildAmazonRow()], [buildDuplicateRow("skip", -1)]);
    assert.deepEqual(ctx.harness.review.buildSaveRows(), []);
  });
});
