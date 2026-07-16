// Integration test for CSV save (cds.test + SQLite): the save engine + data
// layer persist against the real in-memory DB, proving the new Transaction FKs,
// derived categorization status, and Import Log entity round-trip through the
// schema. Custom logic only. Fixtures in data/, harness in support/.

import cds from "@sap/cds";

import { CsvImportDataService } from "../../../../srv/modules/ingestion/csvImportDataService.js";

import { TO_CANCEL_CARD_INSTANCE } from "../../../shared/data/cards.js";
import { MISSING_ID } from "../../../shared/data/ingestion/simplefin.js";
import { SAVE_REQUEST_INTEGRATION } from "../data/csvImportSave.js";
import {
  buildCsvImportSaveService,
  readCsvTransactionsByCard,
  readImportLogsByCard,
  seedCsvImportSave,
} from "../support/csvImportSave.js";

const { expect } = cds.test("serve", "--with-mocks", "--in-memory");

beforeAll(seedCsvImportSave);

describe("CSV save against SQLite", () => {
  /** The reviewed rows must round-trip through the real schema as csv transactions — the mocked unit can't prove the new vendor FK and derived status persist. */
  it("persists reviewed rows as csv transactions with derived status", async () => {
    const service = buildCsvImportSaveService();

    await service.writeImport(SAVE_REQUEST_INTEGRATION);

    const rows = await readCsvTransactionsByCard(TO_CANCEL_CARD_INSTANCE.ID);
    expect(rows).to.have.length(2);
    expect(rows.every(row => row.source === "csv")).to.equal(true);
    const statuses = rows.map(row => row.categorizationStatus);
    expect(statuses).to.include("user_corrected");
    expect(statuses).to.include("uncategorized");
  });

  /** One import-log row must capture the file, count, total, and skipped count so the history reconciles with what was imported. */
  it("records one import-log row with the run totals", async () => {
    const logs = await readImportLogsByCard(TO_CANCEL_CARD_INSTANCE.ID);

    expect(logs).to.have.length(1);
    expect(logs[0].fileName).to.equal("cibc.csv");
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
});
