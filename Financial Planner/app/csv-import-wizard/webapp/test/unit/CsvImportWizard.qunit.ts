/// <reference types="qunit" />
import type {
  DuplicateRow,
  ExcludedEditRow,
  NewRow,
  ParsedFile,
} from "com/financialplanner/csvimportwizard/model/types";

import {
  CARD_INSTANCE_ID,
  CARDHOLDER,
  CONFIG_NAME,
  CORRECTION,
  CSV_FILE,
  DESCRIPTION,
  FILE_NAMES_LABEL,
  IMPORT_SUMMARY,
  MATCHED_ID,
  ODATA_PATH,
  REFERENCE_NAME,
  TAXONOMY_ID,
  WIZARD_CONTROL,
} from "../data/constants";
import {
  buildAmazonRow,
  buildClassifiedRow,
  buildDuplicateRow,
  buildExcludedEditRow,
  buildExcludedRow,
  buildMatchedTransaction,
  buildNewRow,
  buildParseResult,
  buildSuggestedRow,
  buildJanuaryParseResult,
} from "../data/rows";
import {
  buildCsvFile,
  buildUploaderChange,
  buildWizardHarness,
  dropOnZone,
  failFileReads,
  settleAsyncWork,
  waitUntil,
} from "../support/wizardFakes";
import type { WizardHarness } from "../support/types";

const ctx: { harness: WizardHarness } = {
  harness: undefined as unknown as WizardHarness,
};

const useFreshWizard = (hooks: NestedHooks): void => {
  hooks.beforeEach(() => {
    ctx.harness = buildWizardHarness();
  });
  hooks.afterEach(() => {
    ctx.harness.restore();
  });
};

const readState = <T>(path: string): T => ctx.harness.state.getProperty(path) as T;

const selectCardAndFiles = (files: ParsedFile[]): void => {
  ctx.harness.state.setProperty("/selectedCard", CARD_INSTANCE_ID.SCOTIA_GOLD);
  ctx.harness.state.setProperty("/files", files);
};

const parseInto = async (rows: Partial<ReturnType<typeof buildParseResult>>): Promise<void> => {
  ctx.harness.answers.parseResult = buildParseResult(rows);
  selectCardAndFiles([CSV_FILE.JANUARY]);
  ctx.harness.controller.onButtonParseFilesPress();
  await settleAsyncWork();
};

const seedReview = (newRows: NewRow[], duplicateRows: DuplicateRow[] = []): void => {
  ctx.harness.state.setProperty("/newRows", newRows);
  ctx.harness.state.setProperty("/duplicateRows", duplicateRows);
};

QUnit.module("CsvImportWizard — step 1 upload", hooks => {
  useFreshWizard(hooks);

  /** The review opens with empty buckets and zero badge counts until a parse fills them. */
  QUnit.test("starts with empty review buckets and nothing to parse", assert => {
    assert.deepEqual(
      [readState("/files"), readState("/newRows"), readState("/canParse"), readState("/newCount")],
      [[], [], false, 0],
    );
  });

  /** Picked files join the pending set, which is what enables Parse. */
  QUnit.test("adds picked files to the pending set and enables Parse", async assert => {
    ctx.harness.controller.onFileUploaderChange(
      buildUploaderChange([buildCsvFile(CSV_FILE.JANUARY), buildCsvFile(CSV_FILE.FEBRUARY)]),
    );
    await waitUntil(() => readState<ParsedFile[]>("/files").length === 2);
    assert.deepEqual(readState("/files"), [CSV_FILE.JANUARY, CSV_FILE.FEBRUARY]);
    assert.strictEqual(readState("/fileNames"), FILE_NAMES_LABEL.BOTH);
    assert.strictEqual(readState("/canParse"), true);
  });

  /** A second pick adds to the first — multi-file import must not drop earlier files. */
  QUnit.test("appends a later pick to files already chosen", async assert => {
    ctx.harness.state.setProperty("/files", [CSV_FILE.JANUARY]);
    ctx.harness.controller.onFileUploaderChange(buildUploaderChange([buildCsvFile(CSV_FILE.FEBRUARY)]));
    await waitUntil(() => readState<ParsedFile[]>("/files").length === 2);
    assert.strictEqual(readState("/fileNames"), FILE_NAMES_LABEL.BOTH);
  });

  /** An unreadable file must show an error and abort; a silent failure leaves the user waiting on a pick that never lands. */
  QUnit.test("shows an error and adds nothing when a picked file cannot be read", async assert => {
    const restoreReader = failFileReads();
    ctx.harness.controller.onFileUploaderChange(buildUploaderChange([buildCsvFile(CSV_FILE.JANUARY)]));
    await waitUntil(() => ctx.harness.calls.errors.length > 0);
    restoreReader();
    assert.deepEqual(ctx.harness.calls.errors, ["msgFileUnreadable"]);
    assert.deepEqual(readState("/files"), []);
  });

  /** A cancelled picker reports no files and must leave the pending set alone. */
  QUnit.test("ignores a picker change that carries no files", async assert => {
    ctx.harness.controller.onFileUploaderChange(buildUploaderChange([]));
    ctx.harness.controller.onFileUploaderChange(buildUploaderChange(null));
    await settleAsyncWork();
    assert.deepEqual(readState("/files"), []);
    assert.strictEqual(readState("/canParse"), false);
  });
});

QUnit.module("CsvImportWizard — step 1 drag and drop", hooks => {
  useFreshWizard(hooks);

  /** Files dropped on the zone join the pending set, alongside the picker. */
  QUnit.test("adds dropped files to the pending set", async assert => {
    const zone = document.createElement("div");
    ctx.harness.setDropZone(zone);
    ctx.harness.renderView();
    const drop = dropOnZone(zone, [buildCsvFile(CSV_FILE.JANUARY)]);
    await waitUntil(() => readState<ParsedFile[]>("/files").length === 1);
    assert.strictEqual(drop.defaultPrevented, true);
    assert.deepEqual(readState("/files"), [CSV_FILE.JANUARY]);
  });

  /** The browser opens a dragged file unless dragover is cancelled — the drop would never fire. */
  QUnit.test("cancels dragover so the zone accepts the drop", assert => {
    const zone = document.createElement("div");
    ctx.harness.setDropZone(zone);
    ctx.harness.renderView();
    const dragover = new DragEvent("dragover", { cancelable: true });
    zone.dispatchEvent(dragover);
    assert.strictEqual(dragover.defaultPrevented, true);
  });

  /** The view re-renders on every model refresh; wiring the listeners twice would add each dropped file twice. */
  QUnit.test("wires the drop zone once across re-renders", async assert => {
    const zone = document.createElement("div");
    ctx.harness.setDropZone(zone);
    ctx.harness.renderView();
    ctx.harness.renderView();
    dropOnZone(zone, [buildCsvFile(CSV_FILE.JANUARY)]);
    await waitUntil(() => readState<ParsedFile[]>("/files").length > 0);
    await settleAsyncWork();
    assert.strictEqual(readState<ParsedFile[]>("/files").length, 1);
  });

  /** A render before the zone exists (step hidden) must not throw — the next render wires it. */
  QUnit.test("skips wiring while the drop zone has no DOM", assert => {
    ctx.harness.setDropZone(null);
    ctx.harness.renderView();
    assert.deepEqual(readState("/files"), []);
  });

  /** A drop of text or an empty selection carries no files and must not touch the pending set. */
  QUnit.test("ignores a drop that carries no files", async assert => {
    const zone = document.createElement("div");
    ctx.harness.setDropZone(zone);
    ctx.harness.renderView();
    const emptyDrop = dropOnZone(zone, []);
    dropOnZone(zone, null);
    await settleAsyncWork();
    assert.strictEqual(emptyDrop.defaultPrevented, true);
    assert.deepEqual(readState("/files"), []);
  });
});

QUnit.module("CsvImportWizard — parse and review", hooks => {
  useFreshWizard(hooks);

  /** Step 1 requires a card — parsing without one is blocked with a warning. */
  QUnit.test("blocks parsing without a selected card", assert => {
    ctx.harness.state.setProperty("/files", [CSV_FILE.JANUARY]);
    ctx.harness.controller.onButtonParseFilesPress();
    assert.deepEqual(ctx.harness.calls.warnings, ["msgSelectFileAndCard"]);
    assert.strictEqual(ctx.harness.calls.parsed.length, 0);
  });

  /** Step 1 requires a file — parsing with none is blocked with a warning. */
  QUnit.test("blocks parsing without a file", assert => {
    selectCardAndFiles([]);
    ctx.harness.controller.onButtonParseFilesPress();
    assert.deepEqual(ctx.harness.calls.warnings, ["msgSelectFileAndCard"]);
    assert.strictEqual(ctx.harness.calls.parsed.length, 0);
  });

  /** No format config for the card's issuer warns and blocks — the wizard stays on step 1. */
  QUnit.test("warns and stays on step 1 when no format config resolves", async assert => {
    await parseInto({ configResolved: false });
    assert.deepEqual(ctx.harness.calls.warnings, ["msgNoFormatConfig"]);
    assert.strictEqual(readState("/parsed"), false);
    assert.strictEqual(ctx.harness.wizardSteps.count, 0);
  });

  /** A rejected parse must surface an error and keep the wizard on step 1. */
  QUnit.test("shows an error when the parse fails", async assert => {
    ctx.harness.answers.failing.add("parseFiles");
    await parseInto({});
    assert.deepEqual(ctx.harness.calls.errors, ["msgParseFailed"]);
    assert.strictEqual(ctx.harness.wizardSteps.count, 0);
  });

  /** The parse runs against the selected card and every pending file, then opens Review. */
  QUnit.test("parses the pending files for the selected card and advances to Review", async assert => {
    await parseInto({});
    assert.deepEqual(ctx.harness.calls.parsed, [
      { card: CARD_INSTANCE_ID.SCOTIA_GOLD, files: [CSV_FILE.JANUARY] },
    ]);
    assert.strictEqual(readState("/parsed"), true);
    assert.strictEqual(ctx.harness.wizardSteps.count, 1);
    assert.strictEqual(readState("/configName"), CONFIG_NAME.SCOTIA);
  });

  /** New rows arrive pre-filled from the engine's suggestions, uncleared. */
  QUnit.test("pre-fills each New row's categorization from its suggestion", async assert => {
    await parseInto({ newRows: [buildSuggestedRow()] });
    const row = readState<NewRow[]>("/newRows")[0];
    assert.deepEqual(
      [row.vendor_ID, row.purchaseType_ID, row.earningCategory_ID, row.cleared],
      [TAXONOMY_ID.VENDOR_AMAZON, TAXONOMY_ID.PURCHASE_TYPE_SHOPPING, TAXONOMY_ID.EARNING_CATEGORY_ONLINE, false],
    );
  });

  /** Each tab's badge count reflects its bucket; skipped rows are kept for the import log. */
  QUnit.test("fills the three buckets and their badge counts", async assert => {
    await parseInto(buildJanuaryParseResult());
    assert.deepEqual(
      [readState("/newCount"), readState("/duplicateCount"), readState("/excludedCount"), readState("/skippedCount")],
      [2, 1, 1, 2],
    );
  });

  /** Each potential duplicate is paired with the existing transaction it matched, side by side. */
  QUnit.test("pairs each potential duplicate with its matched transaction", async assert => {
    ctx.harness.answers.matches = { [MATCHED_ID.AMAZON]: buildMatchedTransaction() };
    await parseInto({
      potentialDuplicates: [buildClassifiedRow({ matchedTransactionId: MATCHED_ID.AMAZON })],
    });
    const duplicate = readState<DuplicateRow[]>("/duplicateRows")[0];
    assert.deepEqual(ctx.harness.calls.matchedLookups, [[MATCHED_ID.AMAZON]]);
    assert.deepEqual(
      [duplicate.existingPostedAt, duplicate.existingAmount, duplicate.existingDescription, duplicate.decision],
      ["2026-01-03", -42.1, DESCRIPTION.AMAZON, ""],
    );
  });

  /** A duplicate whose match cannot be loaded still shows, with blank existing columns. */
  QUnit.test("shows a duplicate with blank existing columns when its match is missing", async assert => {
    await parseInto({
      potentialDuplicates: [buildClassifiedRow({ matchedTransactionId: null })],
    });
    const duplicate = readState<DuplicateRow[]>("/duplicateRows")[0];
    assert.deepEqual(ctx.harness.calls.matchedLookups, [[""]]);
    assert.deepEqual(
      [duplicate.existingPostedAt, duplicate.existingAmount, duplicate.existingDescription],
      ["", 0, ""],
    );
  });

  /** An unnamed format config must show blank rather than "null", and Review opens with no import progress yet. */
  QUnit.test("shows a blank format name and zero progress when the config is unnamed", async assert => {
    await parseInto({ configName: null });
    assert.strictEqual(readState("/configName"), "");
    assert.strictEqual(readState("/progressPercent"), 0);
  });

  /** An Excluded row is editable, starting from the value that failed to parse. */
  QUnit.test("makes each excluded row editable from its failed value", async assert => {
    await parseInto({ excludedRows: [buildExcludedRow()] });
    const excluded = readState<ExcludedEditRow[]>("/excludedRows")[0];
    assert.strictEqual(excluded.editedValue, "2026-13-45");
    assert.strictEqual(excluded.rawJoined, "2026-13-45, TIM HORTONS #1123, -4.25");
  });

  /** The Card column shows only when a row carries a supplementary cardholder. */
  QUnit.test("shows the Card column only when a row has a cardholder", async assert => {
    await parseInto({ newRows: [buildClassifiedRow()] });
    assert.strictEqual(readState("/hasSuppCards"), false);
    await parseInto({ newRows: [buildClassifiedRow({ cardholderName: CARDHOLDER.SUPPLEMENTARY })] });
    assert.strictEqual(readState("/hasSuppCards"), true);
  });
});

QUnit.module("CsvImportWizard — batch categorization", hooks => {
  useFreshWizard(hooks);

  /** Clear propagates to same-description rows and moves the cleared totals and progress. */
  QUnit.test("Clear confirms the row, fills its siblings and updates the running totals", assert => {
    seedReview([buildAmazonRow({ amount: -42.1 }), buildNewRow({ amount: -10.05 })]);
    ctx.harness.controller.onButtonClearRowPress(ctx.harness.buildRowPress("/newRows/0"));
    const rows = readState<NewRow[]>("/newRows");
    assert.strictEqual(rows[0].cleared, true);
    assert.strictEqual(rows[1].vendor_ID, TAXONOMY_ID.VENDOR_AMAZON);
    assert.deepEqual(
      [readState("/clearedCount"), readState("/totalAmount"), readState("/progressPercent")],
      [1, -42.1, 50],
    );
  });

  /** The cleared total is rounded to cents, or float addition shows noise in the Review step. */
  QUnit.test("rounds the cleared running total to two decimals", assert => {
    seedReview([buildAmazonRow({ amount: -42.1 }), buildAmazonRow({ amount: -10.05 })]);
    ctx.harness.controller.onButtonClearMatchingPress(ctx.harness.buildRowPress("/newRows/0"));
    assert.strictEqual(readState("/totalAmount"), -52.15);
  });

  /** Undo reopens the row, reverts what it propagated, and the totals drop back. */
  QUnit.test("Undo reopens the row and reverts the rows its Clear filled", assert => {
    seedReview([buildAmazonRow(), buildNewRow()]);
    ctx.harness.controller.onButtonClearRowPress(ctx.harness.buildRowPress("/newRows/0"));
    ctx.harness.controller.onButtonUndoRowPress(ctx.harness.buildRowPress("/newRows/0"));
    const rows = readState<NewRow[]>("/newRows");
    assert.strictEqual(rows[0].cleared, false);
    assert.strictEqual(rows[1].vendor_ID, null);
    assert.deepEqual([readState("/clearedCount"), readState("/totalAmount")], [0, 0]);
  });

  /** Clear All Matching confirms only the pre-filled rows sharing the description. */
  QUnit.test("Clear All Matching confirms the categorized rows with the same description", assert => {
    seedReview([
      buildAmazonRow(),
      buildAmazonRow(),
      buildNewRow(),
      buildAmazonRow({ rawDescription: DESCRIPTION.COFFEE }),
    ]);
    ctx.harness.controller.onButtonClearMatchingPress(ctx.harness.buildRowPress("/newRows/0"));
    assert.deepEqual(
      readState<NewRow[]>("/newRows").map(row => row.cleared),
      [true, true, false, false],
    );
    assert.strictEqual(readState("/clearedCount"), 2);
  });

  /** Multi-select apply needs a source and at least one target. */
  QUnit.test("Apply to Selected warns when fewer than two rows are selected", assert => {
    seedReview([buildAmazonRow(), buildNewRow()]);
    ctx.harness.selectRows(["/newRows/0"]);
    ctx.harness.controller.onButtonApplySelectedPress();
    assert.deepEqual(ctx.harness.calls.warnings, ["msgSelectAtLeastTwo"]);
    assert.strictEqual(readState<NewRow[]>("/newRows")[1].vendor_ID, null);
  });

  /** The first selected row's vendor, PT and EC are applied to every other selected row. */
  QUnit.test("Apply to Selected copies the first selection's categorization to the rest", assert => {
    seedReview([
      buildAmazonRow(),
      buildNewRow({ vendor_ID: TAXONOMY_ID.VENDOR_COFFEE_SHOP }),
      buildNewRow(),
      buildNewRow(),
    ]);
    ctx.harness.selectRows(["/newRows/0", "/newRows/1", "/newRows/2"]);
    ctx.harness.controller.onButtonApplySelectedPress();
    const rows = readState<NewRow[]>("/newRows");
    assert.deepEqual(
      [rows[1].vendor_ID, rows[2].purchaseType_ID, rows[2].earningCategory_ID, rows[3].vendor_ID],
      [TAXONOMY_ID.VENDOR_AMAZON, TAXONOMY_ID.PURCHASE_TYPE_SHOPPING, TAXONOMY_ID.EARNING_CATEGORY_ONLINE, null],
    );
  });
});

QUnit.module("CsvImportWizard — on-the-fly reference creation", hooks => {
  useFreshWizard(hooks);

  /** New Vendor opens the create dialog titled for vendors, with an empty name. */
  QUnit.test("New Vendor opens the create dialog for vendors", assert => {
    ctx.harness.state.setProperty("/newRefName", REFERENCE_NAME.TYPED);
    ctx.harness.controller.onButtonNewVendorPress();
    assert.deepEqual(ctx.harness.calls.dialogsOpened, [WIZARD_CONTROL.CREATE_FRAGMENT]);
    assert.strictEqual(readState("/newRefName"), "");
    assert.strictEqual(readState("/createDialogTitle"), "newVendorTitle");
  });

  /** The dialog creates into the entity set of the button that opened it. */
  QUnit.test("creates a vendor or an earning category per the button pressed", async assert => {
    ctx.harness.controller.onButtonNewVendorPress();
    ctx.harness.state.setProperty("/newRefName", REFERENCE_NAME.TYPED);
    ctx.harness.controller.onButtonConfirmCreatePress();
    ctx.harness.controller.onButtonNewEarningCategoryPress();
    ctx.harness.state.setProperty("/newRefName", REFERENCE_NAME.TYPED);
    ctx.harness.controller.onButtonConfirmCreatePress();
    await settleAsyncWork();
    assert.strictEqual(readState("/createDialogTitle"), "newEarningCategoryTitle");
    assert.deepEqual(ctx.harness.calls.createdReferences, [
      { entitySet: ODATA_PATH.VENDORS, name: REFERENCE_NAME.TRIMMED },
      { entitySet: ODATA_PATH.EARNING_CATEGORIES, name: REFERENCE_NAME.TRIMMED },
    ]);
  });

  /** Once created, the value helps must list the new entity, and the dialog closes. */
  QUnit.test("refreshes the value helps, confirms and closes after a create", async assert => {
    ctx.harness.controller.onButtonNewVendorPress();
    ctx.harness.state.setProperty("/newRefName", REFERENCE_NAME.TYPED);
    ctx.harness.controller.onButtonConfirmCreatePress();
    await settleAsyncWork();
    assert.strictEqual(ctx.harness.defaultModelRefreshes.count, 1);
    assert.deepEqual(ctx.harness.calls.toasts, ["msgReferenceCreated"]);
    assert.deepEqual(ctx.harness.calls.dialogsClosed, [WIZARD_CONTROL.CREATE_DIALOG]);
  });

  /** Guard: an entity needs a name — blank or whitespace never reaches the backend. */
  QUnit.test("warns and creates nothing when the name is blank", async assert => {
    ctx.harness.controller.onButtonNewVendorPress();
    ctx.harness.state.setProperty("/newRefName", REFERENCE_NAME.BLANK);
    ctx.harness.controller.onButtonConfirmCreatePress();
    ctx.harness.state.setProperty("/newRefName", null);
    ctx.harness.controller.onButtonConfirmCreatePress();
    await settleAsyncWork();
    assert.deepEqual(ctx.harness.calls.warnings, ["msgNameRequired", "msgNameRequired"]);
    assert.strictEqual(ctx.harness.calls.createdReferences.length, 0);
  });

  /** A failed create keeps the dialog open so the user can retry, and says why. */
  QUnit.test("shows an error and keeps the dialog open when the create fails", async assert => {
    ctx.harness.answers.failing.add("createReference");
    ctx.harness.controller.onButtonNewVendorPress();
    ctx.harness.state.setProperty("/newRefName", REFERENCE_NAME.TYPED);
    ctx.harness.controller.onButtonConfirmCreatePress();
    await settleAsyncWork();
    assert.deepEqual(ctx.harness.calls.errors, ["msgReferenceCreateFailed"]);
    assert.deepEqual(ctx.harness.calls.dialogsClosed, []);
  });

  /** Cancel closes the dialog without creating anything. */
  QUnit.test("Cancel closes the create dialog without creating", assert => {
    ctx.harness.controller.onButtonNewVendorPress();
    ctx.harness.controller.onButtonCancelCreatePress();
    assert.deepEqual(ctx.harness.calls.dialogsClosed, [WIZARD_CONTROL.CREATE_DIALOG]);
    assert.strictEqual(ctx.harness.calls.createdReferences.length, 0);
  });
});

QUnit.module("CsvImportWizard — potential duplicates", hooks => {
  useFreshWizard(hooks);

  /** Skip and Import Anyway record the decision Save reads. */
  QUnit.test("records Skip and Import Anyway on the pressed duplicate", assert => {
    seedReview([], [buildDuplicateRow("", -1), buildDuplicateRow("", -2)]);
    ctx.harness.controller.onButtonSkipDuplicatePress(ctx.harness.buildRowPress("/duplicateRows/0"));
    ctx.harness.controller.onButtonImportDuplicatePress(ctx.harness.buildRowPress("/duplicateRows/1"));
    assert.deepEqual(
      readState<DuplicateRow[]>("/duplicateRows").map(row => row.decision),
      ["skip", "import"],
    );
  });
});

QUnit.module("CsvImportWizard — excluded rows", hooks => {
  useFreshWizard(hooks);

  const seedExcluded = (row: ExcludedEditRow): void => {
    ctx.harness.state.setProperty("/selectedCard", CARD_INSTANCE_ID.SCOTIA_GOLD);
    ctx.harness.state.setProperty("/files", [CSV_FILE.JANUARY]);
    ctx.harness.state.setProperty("/excludedRows", [row]);
  };

  /** A row moves only once the user has entered a correction. */
  QUnit.test("warns when the correction is blank", assert => {
    seedExcluded(buildExcludedEditRow({ editedValue: CORRECTION.BLANK }));
    ctx.harness.controller.onButtonMoveToNewPress(ctx.harness.buildRowPress("/excludedRows/0"));
    seedExcluded(buildExcludedEditRow({ editedValue: "" }));
    ctx.harness.controller.onButtonMoveToNewPress(ctx.harness.buildRowPress("/excludedRows/0"));
    assert.deepEqual(ctx.harness.calls.warnings, ["msgCorrectionRequired", "msgCorrectionRequired"]);
    assert.strictEqual(ctx.harness.calls.reclassified.length, 0);
  });

  /** The server re-decodes the corrected row from its own file at its own row number. */
  QUnit.test("re-decodes the correction against the row's source file", async assert => {
    seedExcluded(buildExcludedEditRow({ rowNumber: 7, sourceRowNumber: 3 }));
    ctx.harness.controller.onButtonMoveToNewPress(ctx.harness.buildRowPress("/excludedRows/0"));
    await settleAsyncWork();
    assert.deepEqual(ctx.harness.calls.reclassified, [
      { card: CARD_INSTANCE_ID.SCOTIA_GOLD, file: CSV_FILE.JANUARY, rowNumber: 3, value: CORRECTION.DATE },
    ]);
  });

  /** A fixed row is appended to New and only it leaves Excluded — prior review work must survive. */
  QUnit.test("moves a corrected new row into the New tab", async assert => {
    ctx.harness.answers.reclassified = buildSuggestedRow({ rowNumber: 3 });
    seedExcluded(buildExcludedEditRow({ rowNumber: 7 }));
    ctx.harness.state.setProperty("/newRows", [
      buildAmazonRow({ cleared: true, rowNumber: 1 }),
      buildNewRow({ rowNumber: 2 }),
    ]);
    ctx.harness.state.setProperty("/excludedRows", [
      buildExcludedEditRow({ rowNumber: 7 }),
      buildExcludedEditRow({ rowNumber: 8 }),
    ]);
    ctx.harness.controller.onButtonMoveToNewPress(ctx.harness.buildRowPress("/excludedRows/0"));
    await settleAsyncWork();
    const rows = readState<NewRow[]>("/newRows");
    assert.deepEqual(rows.map(row => [row.rowNumber, row.cleared]), [[1, true], [2, false], [7, false]]);
    assert.strictEqual(rows[2].vendor_ID, TAXONOMY_ID.VENDOR_AMAZON);
    assert.deepEqual(readState<ExcludedEditRow[]>("/excludedRows").map(row => row.rowNumber), [8]);
    assert.deepEqual([readState("/newCount"), readState("/excludedCount")], [3, 1]);
  });

  /** A corrected row that matches an existing transaction is a potential duplicate, not new. */
  QUnit.test("routes a corrected row that matches an existing one to Potential Duplicates", async assert => {
    ctx.harness.answers.reclassified = buildClassifiedRow({
      dedupOutcome: "potential_duplicate",
      matchedTransactionId: MATCHED_ID.AMAZON,
    });
    ctx.harness.answers.matches = { [MATCHED_ID.AMAZON]: buildMatchedTransaction() };
    seedExcluded(buildExcludedEditRow());
    ctx.harness.state.setProperty("/duplicateRows", [buildDuplicateRow("import", -5)]);
    ctx.harness.state.setProperty("/excludedRows", [
      buildExcludedEditRow(),
      buildExcludedEditRow({ rowNumber: 8 }),
    ]);
    ctx.harness.controller.onButtonMoveToNewPress(ctx.harness.buildRowPress("/excludedRows/0"));
    await settleAsyncWork();
    assert.deepEqual(
      [readState("/newCount"), readState("/duplicateCount"), readState("/excludedCount")],
      [0, 2, 1],
    );
    const duplicates = readState<DuplicateRow[]>("/duplicateRows");
    assert.deepEqual([duplicates[0].decision, duplicates[0].csv.amount], ["import", -5]);
    assert.strictEqual(duplicates[1].existingDescription, DESCRIPTION.AMAZON);
    assert.deepEqual(readState<ExcludedEditRow[]>("/excludedRows").map(row => row.rowNumber), [8]);
  });

  /** A correction that still fails to decode stays in Excluded, with an error. */
  QUnit.test("keeps the row in Excluded and shows an error when the re-decode fails", async assert => {
    ctx.harness.answers.failing.add("reclassifyRow");
    seedExcluded(buildExcludedEditRow());
    ctx.harness.controller.onButtonMoveToNewPress(ctx.harness.buildRowPress("/excludedRows/0"));
    await settleAsyncWork();
    assert.deepEqual(ctx.harness.calls.errors, ["msgCorrectionFailed"]);
    assert.strictEqual(readState<ExcludedEditRow[]>("/excludedRows").length, 1);
  });

  /** Guard: without its source file or row number the server cannot re-decode the row. */
  QUnit.test("shows an error when the row's source file or row number is unknown", async assert => {
    seedExcluded(buildExcludedEditRow({ fileName: CSV_FILE.FEBRUARY.name }));
    ctx.harness.controller.onButtonMoveToNewPress(ctx.harness.buildRowPress("/excludedRows/0"));
    seedExcluded(buildExcludedEditRow({ sourceRowNumber: undefined }));
    ctx.harness.controller.onButtonMoveToNewPress(ctx.harness.buildRowPress("/excludedRows/0"));
    await settleAsyncWork();
    assert.deepEqual(ctx.harness.calls.errors, ["msgCorrectionFailed", "msgCorrectionFailed"]);
    assert.strictEqual(ctx.harness.calls.reclassified.length, 0);
  });
});

QUnit.module("CsvImportWizard — save", hooks => {
  useFreshWizard(hooks);

  const seedSaveContext = (): void => {
    ctx.harness.state.setProperty("/selectedCard", CARD_INSTANCE_ID.SCOTIA_GOLD);
    ctx.harness.state.setProperty("/fileNames", FILE_NAMES_LABEL.BOTH);
    ctx.harness.state.setProperty("/skippedCount", 2);
  };

  /** With no cleared row and no forced duplicate there is nothing to import. */
  QUnit.test("warns and saves nothing when no row is cleared", assert => {
    seedReview([buildAmazonRow()], [buildDuplicateRow("skip", -1)]);
    ctx.harness.controller.onButtonSaveImportPress();
    assert.deepEqual(ctx.harness.calls.warnings, ["msgNothingToImport"]);
    assert.strictEqual(ctx.harness.calls.saved.length, 0);
  });

  /** Only cleared New rows and duplicates marked Import Anyway are submitted. */
  QUnit.test("submits only cleared rows and duplicates forced to import", async assert => {
    seedSaveContext();
    seedReview(
      [buildAmazonRow({ cleared: true, amount: -42.1 }), buildNewRow({ amount: -9 })],
      [buildDuplicateRow("import", -5), buildDuplicateRow("skip", -6), buildDuplicateRow("", -7)],
    );
    ctx.harness.controller.onButtonSaveImportPress();
    await settleAsyncWork();
    const save = ctx.harness.calls.saved[0];
    assert.deepEqual(
      [save.card, save.fileName, save.skippedCount],
      [CARD_INSTANCE_ID.SCOTIA_GOLD, FILE_NAMES_LABEL.BOTH, 2],
    );
    assert.deepEqual(save.rows.map(row => row.amount), [-42.1, -5]);
    assert.deepEqual(
      [save.rows[1].vendor_ID, save.rows[1].purchaseType_ID, save.rows[1].earningCategory_ID],
      [TAXONOMY_ID.VENDOR_AMAZON, TAXONOMY_ID.PURCHASE_TYPE_SHOPPING, TAXONOMY_ID.EARNING_CATEGORY_ONLINE],
    );
    assert.deepEqual(save.rows[0], {
      postedAt: "2026-01-03",
      amount: -42.1,
      rawDescription: DESCRIPTION.AMAZON,
      cardInstance_ID: CARD_INSTANCE_ID.SCOTIA_GOLD,
      vendor_ID: TAXONOMY_ID.VENDOR_AMAZON,
      purchaseType_ID: TAXONOMY_ID.PURCHASE_TYPE_SHOPPING,
      earningCategory_ID: TAXONOMY_ID.EARNING_CATEGORY_ONLINE,
    });
  });

  /** A successful save shows the post-import summary and releases the busy state. */
  QUnit.test("shows the import summary after a save", async assert => {
    seedSaveContext();
    seedReview([buildAmazonRow({ cleared: true })]);
    ctx.harness.controller.onButtonSaveImportPress();
    assert.strictEqual(readState("/saving"), true);
    await settleAsyncWork();
    assert.deepEqual(readState("/summary"), IMPORT_SUMMARY);
    assert.deepEqual(ctx.harness.calls.toasts, ["msgImportComplete"]);
    assert.strictEqual(readState("/saving"), false);
  });

  /** A failed save must say so and release the busy state, or the Save button stays locked. */
  QUnit.test("shows an error and releases the busy state when the save fails", async assert => {
    ctx.harness.answers.failing.add("saveImport");
    seedSaveContext();
    seedReview([buildAmazonRow({ cleared: true })]);
    ctx.harness.controller.onButtonSaveImportPress();
    await settleAsyncWork();
    assert.deepEqual(ctx.harness.calls.errors, ["msgSaveFailed"]);
    assert.strictEqual(readState("/summary"), null);
    assert.strictEqual(readState("/saving"), false);
  });
});
