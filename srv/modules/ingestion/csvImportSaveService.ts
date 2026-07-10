import cds from "@sap/cds";

import { BaseService } from "../shared/baseService.js";
import { MessagingUtility } from "../shared/messagingUtility.js";

import { CsvImportSaveMapper } from "./csvImportSaveMapper.js";
import { CsvImportSaveValidator } from "./csvImportSaveValidator.js";
import type { CsvImportDataService } from "./csvImportDataService.js";
import type {
  CsvImportSummary,
  CsvSaveRequest,
  CsvSaveRow,
  TransactionInsert,
} from "./types.js";

/**
 * Persists a reviewed CSV import: writes the cleared new rows and user-overridden
 * duplicates as Transactions, records one Import Log row, and returns the
 * post-import summary the wizard shows.
 */
export class CsvImportSaveService extends BaseService {
  private readonly dataService: CsvImportDataService;

  /**
   * Creates the save engine bound to the CSV import data layer.
   * @param dataService Data-access layer for transaction and import-log inserts.
   */
  constructor(dataService: CsvImportDataService) {
    super("integration.csv");
    this.dataService = dataService;
  }

  /**
   * Action entry point — validates the request then persists the batch.
   * @param req Request carrying the card, file name, skipped count, and rows.
   * @returns The post-import summary, or undefined when validation fails.
   */
  async save(req: cds.Request): Promise<CsvImportSummary | undefined> {
    const request = CsvImportSaveMapper.toSaveRequest(req.data);
    const errors = CsvImportSaveValidator.validateSaveRequest(request);
    if (errors.length > 0) {
      this._raiseErrors(req, errors);
      return undefined;
    }
    return this.writeImport(request);
  }

  /**
   * Persists the reviewed rows and the import-log entry, then builds the summary.
   * @param request Validated save request.
   * @returns The post-import summary.
   */
  async writeImport(request: CsvSaveRequest): Promise<CsvImportSummary> {
    const rows = request.rows as CsvSaveRow[];
    const inserts = rows.map(row =>
      CsvImportSaveMapper.toTransactionInsert(cds.utils.uuid(), row),
    );
    await this.dataService.insertTransactions(inserts);
    const totalAmount = this._computeTotal(inserts);
    const importLog = CsvImportSaveMapper.toImportLogInsert(
      cds.utils.uuid(),
      request,
      inserts.length,
      totalAmount,
      new Date().toISOString(),
    );
    await this.dataService.insertImportLog(importLog);
    this.logger.info("STATE_CHANGE", "CSV import persisted", {
      importLogId: importLog.ID,
      transactionCount: inserts.length,
    });
    return {
      importLogId: importLog.ID,
      transactionCount: inserts.length,
      totalAmount,
      topVendorName: await this._resolveTopVendor(rows),
    };
  }

  /**
   * Reports each validation error against its field target.
   * @param req Request to accumulate errors on.
   * @param errors Validation errors to report.
   */
  private _raiseErrors(
    req: cds.Request,
    errors: { field: string; messageKey: string }[],
  ): void {
    for (const error of errors) {
      req.error({
        code: error.messageKey,
        message: MessagingUtility.getText(error.messageKey),
        target: error.field,
        status: 400,
      });
    }
  }

  /**
   * Resolves the display name of the most-frequently assigned vendor in the
   * batch, or null when no row carries a vendor.
   * @param rows Reviewed rows being saved.
   * @returns The top vendor's name, or null.
   */
  private async _resolveTopVendor(rows: CsvSaveRow[]): Promise<string | null> {
    const topVendorId = this._findTopVendorId(rows);
    if (!topVendorId) {
      return null;
    }
    return this.dataService.getVendorName(topVendorId);
  }

  /**
   * Finds the vendor id assigned to the most rows, ignoring uncategorized rows.
   * @param rows Reviewed rows being saved.
   * @returns The most-frequent vendor id, or null when none is set.
   */
  private _findTopVendorId(rows: CsvSaveRow[]): string | null {
    const counts = new Map<string, number>();
    for (const row of rows) {
      if (row.vendor_ID) {
        counts.set(row.vendor_ID, (counts.get(row.vendor_ID) ?? 0) + 1);
      }
    }
    let topId: string | null = null;
    let topCount = 0;
    for (const [id, count] of counts) {
      if (count > topCount) {
        topId = id;
        topCount = count;
      }
    }
    return topId;
  }

  /**
   * Sums the amounts of the persisted transactions for the summary total.
   * @param inserts Transaction inserts persisted this run.
   * @returns The summed amount, rounded to cents.
   */
  private _computeTotal(inserts: TransactionInsert[]): number {
    const total = inserts.reduce((sum, row) => sum + row.amount, 0);
    return Math.round(total * 100) / 100;
  }
}
