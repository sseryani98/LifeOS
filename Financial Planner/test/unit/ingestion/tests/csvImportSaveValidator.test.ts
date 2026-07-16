import { CsvImportSaveValidator } from "../../../../srv/modules/ingestion/csvImportSaveValidator.js";

import {
  SAVE_REQUEST_ALL_INVALID,
  SAVE_REQUEST_BAD_ROW,
  SAVE_REQUEST_MISSING_CARD,
  SAVE_REQUEST_MISSING_FILE,
  SAVE_REQUEST_NO_ROWS,
  VALID_SAVE_REQUEST,
} from "../../../shared/data/ingestion/csv.js";

describe("CsvImportSaveValidator", () => {
  /** A complete multi-row request must pass so the wizard can persist a reviewed batch. */
  it("accepts a complete save request", () => {
    expect(
      CsvImportSaveValidator.validateSaveRequest(VALID_SAVE_REQUEST),
    ).toEqual([]);
  });

  /** The import-log row is keyed to a card; without it the history entry has no owner. */
  it("flags a missing card", () => {
    expect(
      CsvImportSaveValidator.validateSaveRequest(SAVE_REQUEST_MISSING_CARD),
    ).toContainEqual({
      field: "cardInstance_ID",
      messageKey: "csv.cardRequired",
    });
  });

  /** The file name labels the import history; requiring it prevents an unlabelled run. */
  it("flags a missing file name", () => {
    expect(
      CsvImportSaveValidator.validateSaveRequest(SAVE_REQUEST_MISSING_FILE),
    ).toContainEqual({ field: "fileName", messageKey: "csv.fileRequired" });
  });

  /** Saving zero rows would write an empty import log and no transactions — reject it up front. */
  it("flags an empty row list", () => {
    expect(
      CsvImportSaveValidator.validateSaveRequest(SAVE_REQUEST_NO_ROWS),
    ).toContainEqual({ field: "rows", messageKey: "csv.noRowsToSave" });
  });

  /** A row missing date, amount, description, or card cannot become a valid Transaction — each gap must be reported against that row. */
  it("flags each malformed field of a bad row", () => {
    const errors =
      CsvImportSaveValidator.validateSaveRequest(SAVE_REQUEST_BAD_ROW);

    expect(errors).toContainEqual({
      field: "rows/0/postedAt",
      messageKey: "csv.rowDateRequired",
    });
    expect(errors).toContainEqual({
      field: "rows/0/amount",
      messageKey: "csv.rowAmountInvalid",
    });
    expect(errors).toContainEqual({
      field: "rows/0/rawDescription",
      messageKey: "csv.rowDescriptionRequired",
    });
    expect(errors).toContainEqual({
      field: "rows/0/cardInstance_ID",
      messageKey: "csv.rowCardRequired",
    });
  });

  /** Errors must accumulate across the request so the user fixes everything in one pass. */
  it("accumulates request- and row-level errors together", () => {
    const errors = CsvImportSaveValidator.validateSaveRequest(
      SAVE_REQUEST_ALL_INVALID,
    );

    expect(errors.length).toBeGreaterThanOrEqual(6);
  });
});
