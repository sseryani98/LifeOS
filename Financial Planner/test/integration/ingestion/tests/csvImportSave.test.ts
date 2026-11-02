// Runs CSV save against the real in-memory DB: Transaction FKs, derived status and
// the Import Log round-trip the schema, and the saveCsvImport action binds. Each
// spec reads back only its own file name / descriptions. Custom logic only.

import cds from "@sap/cds";

import { CsvImportDataService } from "../../../../srv/modules/ingestion/csvImportDataService.js";

import { MISSING_ID } from "../../../shared/data/ingestion/simplefin.js";
import {
  SAVE_ODATA_NO_ROWS,
  SAVE_ODATA_PAYLOAD,
  SAVE_REQUEST_INTEGRATION,
  SAVE_REQUEST_LOG,
  SAVE_REQUEST_PERSIST,
  SAVE_REQUEST_PERSIST_DESCRIPTIONS,
} from "../data/csvImportSave.js";
import {
  buildCsvImportActions,
  registerCsvImportHandlers,
} from "../support/csvImport.js";
import {
  buildCsvImportSaveService,
  readCsvTransactionsByDescriptions,
  readImportLogsByFileName,
  seedCsvImportSave,
} from "../support/csvImportSave.js";

const { POST, expect } = cds.test("serve", "--with-mocks", "--in-memory");
const { postSaveCsvImport } = buildCsvImportActions(POST);

beforeAll(registerCsvImportHandlers);
beforeAll(seedCsvImportSave);

describe("CSV save against SQLite", () => {
  /** The reviewed rows must round-trip through the real schema as csv transactions — the mocked unit can't prove the new vendor FK and derived status persist. */
  it("persists reviewed rows as csv transactions with derived status", async () => {
    const service = buildCsvImportSaveService();

    await service.writeImport(SAVE_REQUEST_PERSIST);

    const rows = await readCsvTransactionsByDescriptions(
      SAVE_REQUEST_PERSIST_DESCRIPTIONS,
    );
    expect(rows).to.have.length(2);
    expect(rows.every(row => row.source === "csv")).to.equal(true);
    const statuses = rows.map(row => row.categorizationStatus);
    expect(statuses).to.include("user_corrected");
    expect(statuses).to.include("uncategorized");
  });

  /** One import-log row must capture the file, count, total, and skipped count so the history reconciles with what was imported. */
  it("records one import-log row with the run totals", async () => {
    const service = buildCsvImportSaveService();

    await service.writeImport(SAVE_REQUEST_LOG);

    const logs = await readImportLogsByFileName(SAVE_REQUEST_LOG.fileName as string);
    expect(logs).to.have.length(1);
    expect(logs[0].transactionCount).to.equal(2);
    expect(Number(logs[0].totalAmount)).to.equal(-24.99);
    expect(logs[0].skippedCount).to.equal(2);
  });

  /** The post-import summary names the batch's vendor, proving the vendor-name lookup resolves against a real persisted vendor. */
  it("returns a summary naming the top vendor", async () => {
    const service = buildCsvImportSaveService();

    const summary = await service.writeImport({
      ...SAVE_REQUEST_INTEGRATION,
      fileName: "cibc-2.csv",
    });

    expect(summary.topVendorName).to.equal("Amazon");
    expect(summary.transactionCount).to.equal(2);
  });

  /** An unknown vendor id must resolve to null so the summary degrades to no top vendor rather than throwing. */
  it("resolves an unknown vendor name to null", async () => {
    const data = new CsvImportDataService();

    expect(await data.getVendorName(MISSING_ID)).to.equal(null);
  });

  describe("saveCsvImport over OData", () => {
    /** The wizard's Save posts this action; a renamed parameter or a broken `many CsvSaveRow` mapping would fail every real save while the engine tests stay green. */
    it("saves the reviewed rows through the action signature", async () => {
      const response = await postSaveCsvImport({ ...SAVE_ODATA_PAYLOAD });

      expect(response.status).to.equal(200);
      expect(response.data.transactionCount).to.equal(2);
      expect(response.data.topVendorName).to.equal("Amazon");
      const logs = await readImportLogsByFileName(SAVE_ODATA_PAYLOAD.fileName as string);
      expect(logs).to.have.length(1);
    });

    /** An empty batch must come back a 400 the wizard can show, and write no import log. */
    it("rejects a save with no rows with a 400", async () => {
      const response = await postSaveCsvImport({ ...SAVE_ODATA_NO_ROWS }).catch(
        (error: { status: number }) => error,
      );

      expect(response.status).to.equal(400);
      const logs = await readImportLogsByFileName(SAVE_ODATA_NO_ROWS.fileName);
      expect(logs).to.have.length(0);
    });
  });
});
