import type {
  CsvSaveRequest,
  CsvSaveRow,
  CsvValidationError,
} from "./types.js";

/**
 * Validates CSV save requests before persistence. Guards the request data
 * (card, file, non-empty row list) and every reviewed row's essential fields (
 * date, amount, description).
 */
export class CsvImportSaveValidator {
  /**
   * Validates a save request and every row within it, accumulating all errors.
   * @param request Save request carrying the card, file name, and reviewed rows.
   * @returns Validation errors, empty when the request is valid.
   */
  static validateSaveRequest(request: CsvSaveRequest): CsvValidationError[] {
    const errors: CsvValidationError[] = [];
    if (!request.cardInstance_ID || request.cardInstance_ID.trim() === "") {
      errors.push({ field: "cardInstance_ID", messageKey: "csv.cardRequired" });
    }
    if (!request.fileName || request.fileName.trim() === "") {
      errors.push({ field: "fileName", messageKey: "csv.fileRequired" });
    }
    if (!request.rows || request.rows.length === 0) {
      errors.push({ field: "rows", messageKey: "csv.noRowsToSave" });
      return errors;
    }
    request.rows.forEach((row, index) =>
      errors.push(...this._validateRow(row, index)),
    );
    return errors;
  }

  /**
   * Validates one reviewed row, targeting each error at its row index.
   * @param row One reviewed save row.
   * @param index Position of the row in the request, used for the error target.
   * @returns Validation errors for the row, empty when it is valid.
   */
  private static _validateRow(
    row: CsvSaveRow,
    index: number,
  ): CsvValidationError[] {
    const errors: CsvValidationError[] = [];
    if (!row.postedAt || row.postedAt.trim() === "") {
      errors.push({
        field: `rows/${index}/postedAt`,
        messageKey: "csv.rowDateRequired",
      });
    }
    if (typeof row.amount !== "number" || !Number.isFinite(row.amount)) {
      errors.push({
        field: `rows/${index}/amount`,
        messageKey: "csv.rowAmountInvalid",
      });
    }
    if (!row.rawDescription || row.rawDescription.trim() === "") {
      errors.push({
        field: `rows/${index}/rawDescription`,
        messageKey: "csv.rowDescriptionRequired",
      });
    }
    if (!row.cardInstance_ID || row.cardInstance_ID.trim() === "") {
      errors.push({
        field: `rows/${index}/cardInstance_ID`,
        messageKey: "csv.rowCardRequired",
      });
    }
    return errors;
  }
}
