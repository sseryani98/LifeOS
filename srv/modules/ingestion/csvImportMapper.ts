import type { CategorizationResult } from "../categorization/types.js";

import { CSV } from "./constants.js";
import type {
  CsvClassifiedRow,
  CsvExcludedRow,
  DedupResult,
  IncomingTransaction,
  ParsedCsvFields,
} from "./types.js";

/**
 * Translation of parsed CSV rows into the shapes the pipeline consumes:
 * a dedup candidate, a classified review row, and an excluded (parse-error) row.
 */
export class CsvImportMapper {
  /**
   * Maps parsed row fields to a dedup candidate. CSV rows never carry an
   * external id, so dedup falls back to the natural key.
   * @param fields Scalar fields already parsed from the CSV row.
   * @returns The candidate handed to the deduplication engine.
   */
  static toCandidate(fields: ParsedCsvFields): IncomingTransaction {
    return {
      externalId: null,
      cardInstance_ID: fields.cardInstance_ID,
      amount: fields.amount,
      postedAt: fields.postedAt,
      rawDescription: fields.rawDescription,
      source: CSV.SOURCE,
    };
  }

  /**
   * Maps parsed fields plus a dedup verdict and the categorization suggestion to
   * a review row (New or Potential Duplicates tab).
   * @param rowNumber 1-based source line number, for user reference.
   * @param fields Scalar fields parsed from the CSV row.
   * @param dedup Deduplication outcome for this row.
   * @param suggestion Categorization pre-fill for this row.
   * @returns The classified row for the review tabs.
   */
  static toClassifiedRow(
    rowNumber: number,
    fields: ParsedCsvFields,
    dedup: DedupResult,
    suggestion: CategorizationResult,
  ): CsvClassifiedRow {
    return {
      rowNumber,
      postedAt: fields.postedAt,
      amount: fields.amount,
      rawDescription: fields.rawDescription,
      cardInstance_ID: fields.cardInstance_ID,
      cardholderName: fields.cardholderName,
      dedupOutcome: dedup.outcome,
      matchedTransactionId: dedup.matchedTransactionId ?? null,
      suggestedVendor_ID: suggestion.vendor_ID,
      suggestedVendorName: suggestion.vendorName,
      suggestedPurchaseType_ID: suggestion.purchaseType_ID,
      suggestedEarningCategory_ID: suggestion.earningCategory_ID,
      suggestionConfidence: suggestion.confidence,
    };
  }

  /**
   * Maps a failed row to an Excluded-tab entry with the offending field flagged
   * so the user can correct it in place.
   * @param rowNumber 1-based source line number.
   * @param rawCells The row's raw cells, preserved for editing.
   * @param field Logical field that failed to parse (e.g. "date", "amount").
   * @param messageKey i18n key describing the parse error.
   * @param value The raw value that failed, echoed into the message.
   * @returns The excluded row for the Excluded tab.
   */
  static toExcludedRow(
    rowNumber: number,
    rawCells: string[],
    field: string,
    messageKey: string,
    value: string,
  ): CsvExcludedRow {
    return { rowNumber, rawCells, errorField: field, errorMessageKey: messageKey, errorValue: value };
  }
}
