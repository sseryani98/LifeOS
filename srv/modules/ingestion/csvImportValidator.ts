import type { CsvParseRequest, CsvValidationError } from "./types.js";

/**
 * Validates CSV import requests before parsing. 
 */
export class CsvImportValidator {
  /**
   * Validates a parse request: a card must be selected and a non-empty file
   * supplied — an empty or unreadable file aborts the import.
   * @param request Parse request carrying the card, file name, and file content.
   * @returns Validation errors, empty when the request is valid.
   */
  static validateParseRequest(request: CsvParseRequest): CsvValidationError[] {
    const errors: CsvValidationError[] = [];
    if (!request.cardInstance_ID || request.cardInstance_ID.trim() === "") {
      errors.push({ field: "cardInstance_ID", messageKey: "csv.cardRequired" });
    }
    if (!request.fileName || request.fileName.trim() === "") {
      errors.push({ field: "fileName", messageKey: "csv.fileRequired" });
    }
    if (!request.fileContent || request.fileContent.trim() === "") {
      errors.push({ field: "fileContent", messageKey: "csv.fileEmpty" });
    }
    return errors;
  }
}
