import { CATEGORIZATION, CSV } from "./constants.js";
import type {
  CsvSaveRequest,
  CsvSaveRow,
  ImportLogInsert,
  TransactionInsert,
} from "./types.js";

/**
 * Translation of the save payload into the rows persisted on save: the action
 * request shape, each Transaction insert, and the Import Log insert.
 */
export class CsvImportSaveMapper {
  /**
   * Maps the raw action payload to a typed save request.
   * @param data The action request's data block.
   * @returns The typed save request.
   */
  static toSaveRequest(
    data: Record<string, unknown> | undefined,
  ): CsvSaveRequest {
    return {
      cardInstance_ID: (data?.cardInstance_ID ?? null) as string | null,
      fileName: (data?.fileName ?? null) as string | null,
      skippedCount: (data?.skippedCount ?? 0) as number,
      rows: (data?.rows ?? []) as CsvSaveRow[],
    };
  }

  /**
   * Maps a validated request plus the run's computed totals to an import-log row.
   * @param id Generated import-log id.
   * @param request Validated save request.
   * @param transactionCount Number of transactions persisted.
   * @param totalAmount Sum of the persisted amounts.
   * @param importDate ISO timestamp of the import run.
   * @returns The import-log insert row.
   */
  static toImportLogInsert(
    id: string,
    request: CsvSaveRequest,
    transactionCount: number,
    totalAmount: number,
    importDate: string,
  ): ImportLogInsert {
    return {
      ID: id,
      cardInstance_ID: request.cardInstance_ID as string,
      fileName: request.fileName as string,
      importDate,
      transactionCount,
      totalAmount,
      skippedCount: request.skippedCount ?? 0,
    };
  }

  /**
   * Maps a reviewed save row to a Transaction insert. Derives the
   * categorization status from whether the user assigned any vendor or category,
   * and tags the row as a CSV import.
   * @param id Generated Transaction id.
   * @param row Reviewed row from the wizard.
   * @returns The Transaction insert row.
   */
  static toTransactionInsert(id: string, row: CsvSaveRow): TransactionInsert {
    return {
      ID: id,
      cardInstance_ID: row.cardInstance_ID ?? null,
      source: CSV.SOURCE,
      amount: row.amount,
      postedAt: row.postedAt,
      rawDescription: row.rawDescription,
      vendor_ID: row.vendor_ID ?? null,
      purchaseType_ID: row.purchaseType_ID ?? null,
      earningCategory_ID: row.earningCategory_ID ?? null,
      categorizationStatus: this._deriveStatus(row),
      isExcluded: false,
    };
  }

  /**
   * Derives the categorization status: any assigned vendor or category means the
   * user classified the row, otherwise it imports uncategorized.
   * @param row Reviewed row from the wizard.
   * @returns The categorization status to persist.
   */
  private static _deriveStatus(row: CsvSaveRow): string {
    const categorized =
      !!row.vendor_ID || !!row.purchaseType_ID || !!row.earningCategory_ID;
    return categorized
      ? CATEGORIZATION.USER_CORRECTED
      : CATEGORIZATION.UNCATEGORIZED;
  }
}
