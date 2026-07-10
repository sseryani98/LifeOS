import type ODataModel from "sap/ui/model/odata/v4/ODataModel";
import type {
  CreatedEntity,
  ImportSummary,
  MatchedTransaction,
  ParseResult,
  ParsedFile,
  SaveRow,
} from "com/financialplanner/csvimportwizard/model/types";

const PARSE_OPERATION = "/parseCsvImport(...)";
const SAVE_OPERATION = "/saveCsvImport(...)";
const TRANSACTIONS_PATH = "/Transactions";

/**
 * CsvImportWizardService — owns every OData V4 call for the CSV Import Wizard:
 * parsing uploaded files, loading matched transactions for the duplicate view,
 * on-the-fly reference creation, and persisting the reviewed batch.
 */
export default class CsvImportWizardService {
  private readonly _model: ODataModel;

  /**
   * @param model the app's default TransactionService OData V4 model
   */
  public constructor(model: ODataModel) {
    this._model = model;
  }

  /**
   * Parses every uploaded file against the selected card and merges the results
   * into one review set, renumbering rows so each stays unique across files.
   * @param cardInstanceId the selected card instance id
   * @param files the CSV files to parse
   * @returns the merged parse result
   */
  public async parseFiles(
    cardInstanceId: string,
    files: ParsedFile[],
  ): Promise<ParseResult> {
    const merged: ParseResult = {
      configResolved: true,
      configName: null,
      newRows: [],
      potentialDuplicates: [],
      excludedRows: [],
      skippedCount: 0,
    };
    let offset = 0;
    for (const file of files) {
      const result = await this._parseFile(cardInstanceId, file);
      if (!result.configResolved) {
        return { ...result, configResolved: false };
      }
      merged.configName = result.configName;
      this._mergeResult(merged, result, offset);
      offset += this._countRows(result);
    }
    return merged;
  }

  /**
   * Loads the existing transactions a set of potential duplicates matched, for
   * the side-by-side comparison.
   * @param ids the matched transaction ids
   * @returns the matched transactions keyed by id
   */
  public async loadMatchedTransactions(
    ids: string[],
  ): Promise<Record<string, MatchedTransaction>> {
    const unique = [...new Set(ids.filter(Boolean))];
    const rows = await Promise.all(
      unique.map(id => this._loadTransaction(id)),
    );
    const map: Record<string, MatchedTransaction> = {};
    rows.filter(Boolean).forEach(row => {
      map[(row as MatchedTransaction).ID] = row as MatchedTransaction;
    });
    return map;
  }

  /**
   * Creates a reference entity on the fly (vendor, earning category).
   * @param entitySet the OData entity-set path (e.g. "/Vendors")
   * @param name the display name for the new entity
   * @returns the created entity's id and name
   */
  public async createReference(
    entitySet: string,
    name: string,
  ): Promise<CreatedEntity> {
    const listBinding = this._model.bindList(entitySet);
    const context = listBinding.create({ name });
    await context.created();
    return context.getObject() as CreatedEntity;
  }

  /**
   * Persists the reviewed rows and records the import, returning the summary.
   * @param cardInstanceId the selected card instance id
   * @param fileName the combined file-name label for the import history
   * @param skippedCount rows discarded by status filtering
   * @param rows the cleared rows to persist
   * @returns the post-import summary
   */
  public async saveImport(
    cardInstanceId: string,
    fileName: string,
    skippedCount: number,
    rows: SaveRow[],
  ): Promise<ImportSummary> {
    const operation = this._model.bindContext(SAVE_OPERATION);
    operation.setParameter("cardInstance_ID", cardInstanceId);
    operation.setParameter("fileName", fileName);
    operation.setParameter("skippedCount", skippedCount);
    operation.setParameter("rows", rows);
    await operation.invoke();
    this._model.refresh();
    return operation.getBoundContext().getObject() as ImportSummary;
  }

  /**
   * Appends one file's rows to the merged result, offsetting row numbers so
   * they remain unique across files.
   * @param merged the accumulating merged result
   * @param result one file's parse result
   * @param offset the row-number offset for this file
   */
  private _mergeResult(
    merged: ParseResult,
    result: ParseResult,
    offset: number,
  ): void {
    merged.newRows.push(
      ...result.newRows.map(row => ({ ...row, rowNumber: row.rowNumber + offset })),
    );
    merged.potentialDuplicates.push(
      ...result.potentialDuplicates.map(row => ({
        ...row,
        rowNumber: row.rowNumber + offset,
      })),
    );
    merged.excludedRows.push(
      ...result.excludedRows.map(row => ({
        ...row,
        rowNumber: row.rowNumber + offset,
      })),
    );
    merged.skippedCount += result.skippedCount;
  }

  /**
   * Invokes the parse action for one file and returns its result.
   * @param cardInstanceId the selected card instance id
   * @param file the CSV file to parse
   * @returns the file's parse result
   */
  private async _parseFile(
    cardInstanceId: string,
    file: ParsedFile,
  ): Promise<ParseResult> {
    const operation = this._model.bindContext(PARSE_OPERATION);
    operation.setParameter("cardInstance_ID", cardInstanceId);
    operation.setParameter("fileName", file.name);
    operation.setParameter("fileContent", file.content);
    await operation.invoke();
    return operation.getBoundContext().getObject() as ParseResult;
  }

  /**
   * Requests one transaction by id for the duplicate comparison.
   * @param id the transaction id
   * @returns the transaction, or null when it cannot be read
   */
  private async _loadTransaction(
    id: string,
  ): Promise<MatchedTransaction | null> {
    const context = this._model.bindContext(`${TRANSACTIONS_PATH}(${id})`);
    const object = (await context.requestObject()) as MatchedTransaction | null;
    return object ?? null;
  }

  /**
   * Counts the rows a file contributed, so the next file's numbers do not clash.
   * @param result one file's parse result
   * @returns the number of rows across all buckets
   */
  private _countRows(result: ParseResult): number {
    return (
      result.newRows.length +
      result.potentialDuplicates.length +
      result.excludedRows.length
    );
  }
}
