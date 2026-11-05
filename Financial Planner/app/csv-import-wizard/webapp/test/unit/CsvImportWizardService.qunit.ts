/// <reference types="qunit" />
import CsvImportWizardService from "com/financialplanner/csvimportwizard/model/CsvImportWizardService";
import type { ParseResult, SaveRow } from "com/financialplanner/csvimportwizard/model/types";

import {
  CARD_INSTANCE_ID,
  CONFIG_NAME,
  CREATED_VENDOR,
  CSV_FILE,
  IMPORT_SUMMARY,
  MATCHED_ID,
  ODATA_PATH,
  REFERENCE_NAME,
} from "../data/constants";
import {
  buildClassifiedRow,
  buildExcludedRow,
  buildMatchedTransaction,
  buildNewRow,
  buildParseResult,
  buildJanuaryParseResult,
  buildFebruaryParseResult,
} from "../data/rows";
import { buildFakeODataModel } from "../support/odataModelFakes";

const UNRESOLVED_RESULT = buildParseResult({ configResolved: false, configName: null });

QUnit.module("CsvImportWizardService — parseFiles", () => {
  /** Each file is parsed against the selected card, because the card resolves the issuer's format config. */
  QUnit.test("invokes the parse action once per file with the card and the file's text", async assert => {
    const fake = buildFakeODataModel();
    fake.stubAnswer(ODATA_PATH.PARSE, buildJanuaryParseResult(), buildFebruaryParseResult());
    await new CsvImportWizardService(fake.model).parseFiles(CARD_INSTANCE_ID.SCOTIA_GOLD, [
      CSV_FILE.JANUARY,
      CSV_FILE.FEBRUARY,
    ]);
    assert.deepEqual(
      fake.operations.map(operation => [operation.path, operation.invokeCount, operation.parameters]),
      [
        [
          ODATA_PATH.PARSE,
          1,
          {
            cardInstance_ID: CARD_INSTANCE_ID.SCOTIA_GOLD,
            fileName: CSV_FILE.JANUARY.name,
            fileContent: CSV_FILE.JANUARY.content,
          },
        ],
        [
          ODATA_PATH.PARSE,
          1,
          {
            cardInstance_ID: CARD_INSTANCE_ID.SCOTIA_GOLD,
            fileName: CSV_FILE.FEBRUARY.name,
            fileContent: CSV_FILE.FEBRUARY.content,
          },
        ],
      ],
    );
  });

  /** Row numbers key the review rows; two files both start at 1, so the second must be offset by the first's row count. */
  QUnit.test("renumbers every bucket so rows stay unique across files", async assert => {
    const fake = buildFakeODataModel();
    fake.stubAnswer(ODATA_PATH.PARSE, buildJanuaryParseResult(), buildFebruaryParseResult());
    const merged = await new CsvImportWizardService(fake.model).parseFiles(
      CARD_INSTANCE_ID.SCOTIA_GOLD,
      [CSV_FILE.JANUARY, CSV_FILE.FEBRUARY],
    );
    assert.deepEqual(merged.newRows.map(row => row.rowNumber), [1, 2, 5]);
    assert.deepEqual(merged.potentialDuplicates.map(row => row.rowNumber), [3, 6]);
    assert.deepEqual(merged.excludedRows.map(row => row.rowNumber), [4, 7]);
  });

  /** A corrected Excluded row is re-decoded from its own file, so the merge must remember which file and row it was. */
  QUnit.test("stamps each excluded row with its file and its row number within that file", async assert => {
    const fake = buildFakeODataModel();
    fake.stubAnswer(ODATA_PATH.PARSE, buildJanuaryParseResult(), buildFebruaryParseResult());
    const merged = await new CsvImportWizardService(fake.model).parseFiles(
      CARD_INSTANCE_ID.SCOTIA_GOLD,
      [CSV_FILE.JANUARY, CSV_FILE.FEBRUARY],
    );
    assert.deepEqual(
      merged.excludedRows.map(row => [row.fileName, row.sourceRowNumber]),
      [
        [CSV_FILE.JANUARY.name, 4],
        [CSV_FILE.FEBRUARY.name, 3],
      ],
    );
  });

  /** Rows filtered out by status are counted across every file for the import log. */
  QUnit.test("sums the skipped count and keeps the resolved config name", async assert => {
    const fake = buildFakeODataModel();
    fake.stubAnswer(ODATA_PATH.PARSE, buildJanuaryParseResult(), buildFebruaryParseResult());
    const merged = await new CsvImportWizardService(fake.model).parseFiles(
      CARD_INSTANCE_ID.SCOTIA_GOLD,
      [CSV_FILE.JANUARY, CSV_FILE.FEBRUARY],
    );
    assert.strictEqual(merged.skippedCount, 3);
    assert.strictEqual(merged.configName, CONFIG_NAME.SCOTIA);
    assert.strictEqual(merged.configResolved, true);
  });

  /** No format config for the issuer blocks the import — later files are not parsed. */
  QUnit.test("stops and reports unresolved when a file's config does not resolve", async assert => {
    const fake = buildFakeODataModel();
    fake.stubAnswer(ODATA_PATH.PARSE, UNRESOLVED_RESULT, buildFebruaryParseResult());
    const merged: ParseResult = await new CsvImportWizardService(fake.model).parseFiles(
      CARD_INSTANCE_ID.SCOTIA_GOLD,
      [CSV_FILE.JANUARY, CSV_FILE.FEBRUARY],
    );
    assert.strictEqual(merged.configResolved, false);
    assert.strictEqual(fake.operations.length, 1);
  });
});

QUnit.module("CsvImportWizardService — loadMatchedTransactions", () => {
  /** The side-by-side view needs each matched transaction once, keyed by id. */
  QUnit.test("reads each distinct matched id once and keys the results by id", async assert => {
    const fake = buildFakeODataModel();
    fake.stubAnswer(ODATA_PATH.AMAZON_TRANSACTION, buildMatchedTransaction());
    fake.stubAnswer(
      ODATA_PATH.COFFEE_TRANSACTION,
      buildMatchedTransaction({ ID: MATCHED_ID.COFFEE }),
    );
    const matches = await new CsvImportWizardService(fake.model).loadMatchedTransactions([
      MATCHED_ID.AMAZON,
      "",
      MATCHED_ID.COFFEE,
      MATCHED_ID.AMAZON,
    ]);
    assert.deepEqual(
      fake.operations.map(operation => operation.path),
      [ODATA_PATH.AMAZON_TRANSACTION, ODATA_PATH.COFFEE_TRANSACTION],
    );
    assert.deepEqual(Object.keys(matches), [MATCHED_ID.AMAZON, MATCHED_ID.COFFEE]);
  });

  /** A match that cannot be read must not break the review — it is simply absent from the map. */
  QUnit.test("drops a matched id whose transaction cannot be read", async assert => {
    const fake = buildFakeODataModel();
    const matches = await new CsvImportWizardService(fake.model).loadMatchedTransactions([
      MATCHED_ID.UNREADABLE,
    ]);
    assert.deepEqual(matches, {});
  });
});

QUnit.module("CsvImportWizardService — createReference", () => {
  /** On-the-fly creation posts the typed name into the chosen entity set. */
  QUnit.test("creates the named entity in the given set and returns it", async assert => {
    const fake = buildFakeODataModel();
    fake.stubAnswer(ODATA_PATH.VENDORS, CREATED_VENDOR);
    const created = await new CsvImportWizardService(fake.model).createReference(
      ODATA_PATH.VENDORS,
      REFERENCE_NAME.TRIMMED,
    );
    assert.deepEqual(fake.creates, [
      { entitySet: ODATA_PATH.VENDORS, data: { name: REFERENCE_NAME.TRIMMED } },
    ]);
    assert.deepEqual(created, CREATED_VENDOR);
  });
});

QUnit.module("CsvImportWizardService — reclassifyRow", () => {
  /** Only the server knows the file's columns, so the correction travels with the file and its row number. */
  QUnit.test("invokes the reclassify action with the file, row and correction", async assert => {
    const fake = buildFakeODataModel();
    const classified = buildClassifiedRow();
    fake.stubAnswer(ODATA_PATH.RECLASSIFY, classified);
    const row = await new CsvImportWizardService(fake.model).reclassifyRow(
      CARD_INSTANCE_ID.SCOTIA_GOLD,
      CSV_FILE.JANUARY,
      3,
      "2026-01-15",
    );
    assert.deepEqual(fake.operations[0].parameters, {
      cardInstance_ID: CARD_INSTANCE_ID.SCOTIA_GOLD,
      fileName: CSV_FILE.JANUARY.name,
      fileContent: CSV_FILE.JANUARY.content,
      rowNumber: 3,
      correctedValue: "2026-01-15",
    });
    assert.strictEqual(fake.operations[0].invokeCount, 1);
    assert.deepEqual(row, classified);
  });
});

QUnit.module("CsvImportWizardService — saveImport", () => {
  /** The save carries the reviewed rows plus what the import log records. */
  QUnit.test("invokes the save action with the card, file label, skipped count and rows", async assert => {
    const fake = buildFakeODataModel();
    const rows: SaveRow[] = [buildNewRow()];
    fake.stubAnswer(ODATA_PATH.SAVE, IMPORT_SUMMARY);
    await new CsvImportWizardService(fake.model).saveImport(
      CARD_INSTANCE_ID.SCOTIA_GOLD,
      CSV_FILE.JANUARY.name,
      2,
      rows,
    );
    assert.deepEqual(fake.operations[0].parameters, {
      cardInstance_ID: CARD_INSTANCE_ID.SCOTIA_GOLD,
      fileName: CSV_FILE.JANUARY.name,
      skippedCount: 2,
      rows,
    });
    assert.strictEqual(fake.operations[0].invokeCount, 1);
  });

  /** The summary is the save's answer, and other bound lists must show the new transactions. */
  QUnit.test("refreshes the model and returns the import summary", async assert => {
    const fake = buildFakeODataModel();
    fake.stubAnswer(ODATA_PATH.SAVE, IMPORT_SUMMARY);
    const summary = await new CsvImportWizardService(fake.model).saveImport(
      CARD_INSTANCE_ID.SCOTIA_GOLD,
      CSV_FILE.JANUARY.name,
      0,
      [],
    );
    assert.strictEqual(fake.refreshes.count, 1);
    assert.deepEqual(summary, IMPORT_SUMMARY);
  });
});
