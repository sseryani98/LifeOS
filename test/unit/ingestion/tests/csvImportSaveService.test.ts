import {
  SAVE_ACTION_DATA,
  SAVE_ACTION_DATA_EMPTY,
  SAVE_REQUEST_ALL_UNCATEGORIZED,
  SAVE_REQUEST_TOP_AMAZON,
  VENDOR_AMAZON_ID,
} from "../../../shared/data/ingestion/csv.js";
import {
  buildCsvImportSaveMocks,
  saveRequestOf,
} from "../support/csvImportSaveMocks.js";

describe("CsvImportSaveService", () => {
  /** Every reviewed row must be persisted in one insert so a batch save is atomic, not row-by-row. */
  it("persists all reviewed rows as transactions", async () => {
    const mocks = buildCsvImportSaveMocks();

    await mocks.service.save(saveRequestOf(SAVE_ACTION_DATA) as never);

    const inserted = mocks.data.insertTransactions.mock.calls[0][0];
    expect(inserted).toHaveLength(3);
    expect(inserted.every(row => row.source === "csv")).toBe(true);
  });

  /** One import-log row must record the run so the history shows count, total, and skipped. */
  it("writes a single import-log row with the run totals", async () => {
    const mocks = buildCsvImportSaveMocks();

    await mocks.service.save(saveRequestOf(SAVE_ACTION_DATA) as never);

    expect(mocks.data.insertImportLog).toHaveBeenCalledTimes(1);
    const log = mocks.data.insertImportLog.mock.calls[0][0];
    expect(log.transactionCount).toBe(3);
    expect(log.skippedCount).toBe(1);
  });

  /** The summary total must equal the sum of imported amounts so the post-import screen reconciles with the rows. */
  it("returns a summary with the transaction count and summed total", async () => {
    const mocks = buildCsvImportSaveMocks();

    const summary = await mocks.service.save(
      saveRequestOf(SAVE_ACTION_DATA) as never,
    );

    expect(summary?.transactionCount).toBe(3);
    expect(summary?.totalAmount).toBeCloseTo(-76.46, 2);
  });

  /** The post-import summary names the most-frequent vendor, so the winning vendor id must drive the name lookup. */
  it("resolves the most-frequent vendor as the top vendor", async () => {
    const mocks = buildCsvImportSaveMocks("Amazon");

    const summary = await mocks.service.save(
      saveRequestOf(SAVE_REQUEST_TOP_AMAZON) as never,
    );

    expect(mocks.data.getVendorName).toHaveBeenCalledWith(VENDOR_AMAZON_ID);
    expect(summary?.topVendorName).toBe("Amazon");
  });

  /** An all-uncategorized batch has no vendor to name, so the top vendor must be null, not a crash. */
  it("returns a null top vendor when no row is categorized", async () => {
    const mocks = buildCsvImportSaveMocks();

    const summary = await mocks.service.save(
      saveRequestOf(SAVE_REQUEST_ALL_UNCATEGORIZED) as never,
    );

    expect(summary?.topVendorName).toBeNull();
    expect(mocks.data.getVendorName).not.toHaveBeenCalled();
  });

  /** An empty batch must be rejected up front with a field error and never touch the database. */
  it("reports validation errors and persists nothing", async () => {
    const mocks = buildCsvImportSaveMocks();
    const request = saveRequestOf(SAVE_ACTION_DATA_EMPTY) as never as {
      data: unknown;
      error: jest.Mock;
    };

    const summary = await mocks.service.save(request as never);

    expect(summary).toBeUndefined();
    expect(request.error).toHaveBeenCalled();
    expect(mocks.data.insertTransactions).not.toHaveBeenCalled();
  });
});
