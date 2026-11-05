import ClearPropagation from "com/financialplanner/csvimportwizard/model/ClearPropagation";
import type CsvImportWizardService from "com/financialplanner/csvimportwizard/model/CsvImportWizardService";
import JSONModel from "sap/ui/model/json/JSONModel";
import {
  DEDUP_OUTCOME,
  DUPLICATE_DECISION,
  PERCENT_MAX,
} from "com/financialplanner/csvimportwizard/model/constants";
import type {
  ClassifiedRow,
  DuplicateRow,
  ExcludedEditRow,
  ExcludedRow,
  NewRow,
  ParseResult,
  SaveRow,
} from "com/financialplanner/csvimportwizard/model/types";

/**
 * The review step's buckets on the "ui" model — New, Potential Duplicates and
 * Excluded — with the badge counts, cleared totals and save payload derived
 * from them. The controller routes events here; this class owns the rows.
 *
 * @namespace com.financialplanner.csvimportwizard.model
 */
export default class ReviewState {
  private readonly _clearing = new ClearPropagation();
  private readonly _service: CsvImportWizardService;
  private readonly _state: JSONModel;

  /**
   * @param state the "ui" JSON model the review tabs bind to
   * @param service the data-access service, for the duplicates' matched transactions
   */
  public constructor(state: JSONModel, service: CsvImportWizardService) {
    this._state = state;
    this._service = service;
  }

  /**
   * Builds the initial UI-state model with empty review buckets.
   * @returns the seeded "ui" JSON model
   */
  public static buildInitialModel(): JSONModel {
    return new JSONModel({
      selectedCard: "",
      hasSuppCards: false,
      files: [],
      fileNames: "",
      canParse: false,
      parsed: false,
      configName: "",
      newRows: [],
      duplicateRows: [],
      excludedRows: [],
      newCount: 0,
      duplicateCount: 0,
      excludedCount: 0,
      clearedCount: 0,
      skippedCount: 0,
      totalAmount: 0,
      progressPercent: 0,
      newRefName: "",
      saving: false,
      summary: null,
    });
  }

  /**
   * Maps a parse result into the New / Potential-Duplicates / Excluded buckets,
   * loading the matched existing transactions for the side-by-side view.
   * @param result the merged parse result
   */
  public async applyParseResult(result: ParseResult): Promise<void> {
    const state = this._state;
    const newRows = result.newRows.map(row => this._toNewRow(row));
    const duplicateRows = await this._buildDuplicateRows(
      result.potentialDuplicates,
    );
    const excludedRows = result.excludedRows.map(row => this._toExcludedRow(row));
    this._clearing.reset();
    state.setProperty("/newRows", newRows);
    state.setProperty("/duplicateRows", duplicateRows);
    state.setProperty("/excludedRows", excludedRows);
    state.setProperty("/configName", result.configName ?? "");
    state.setProperty("/skippedCount", result.skippedCount);
    state.setProperty(
      "/hasSuppCards",
      newRows.some(row => row.cardholderName !== null),
    );
    this._refreshCounts();
  }

  /**
   * Gathers every cleared New row and every duplicate marked for import into the
   * save payload.
   * @returns the rows to persist
   */
  public buildSaveRows(): SaveRow[] {
    const newRows = (this._state.getProperty("/newRows") as NewRow[])
      .filter(row => row.cleared)
      .map(row => this._toSaveRow(row));
    const overrides = (this._state.getProperty("/duplicateRows") as DuplicateRow[])
      .filter(row => row.decision === DUPLICATE_DECISION.IMPORT)
      .map(row => this._toSaveRow(this._toNewRow(row.csv)));
    return [...newRows, ...overrides];
  }

  /**
   * Clears every categorized row sharing the given row's description.
   * @param row the row whose description to match
   */
  public clearMatchingRows(row: NewRow): void {
    (this._state.getProperty("/newRows") as NewRow[])
      .filter(
        candidate =>
          candidate.rawDescription === row.rawDescription &&
          this._clearing.isCategorized(candidate),
      )
      .forEach(candidate => {
        candidate.cleared = true;
      });
    this._refreshCounts();
  }

  /**
   * Clears one New-tab row and propagates its categorization to still-uncleared
   * rows that share the same description.
   * @param row the row to clear
   */
  public clearRow(row: NewRow): void {
    this._clearing.clearRow(row, this._state.getProperty("/newRows") as NewRow[]);
    this._refreshCounts();
  }

  /**
   * Copies the source row's categorization onto every target row.
   * @param source the row whose vendor, purchase type and earning category to copy
   * @param targets the rows to receive them
   */
  public copyCategorization(source: NewRow, targets: NewRow[]): void {
    targets.forEach(target => {
      target.vendor_ID = source.vendor_ID;
      target.purchaseType_ID = source.purchaseType_ID;
      target.earningCategory_ID = source.earningCategory_ID;
    });
    this._refreshCounts();
  }

  /**
   * Routes a re-decoded Excluded row like any parsed row — New tab, or Potential
   * Duplicates when it matches an existing one — and drops it from Excluded.
   * @param classified the re-decoded row, carrying its Excluded row number
   */
  public async moveCorrectedRow(classified: ClassifiedRow): Promise<void> {
    const state = this._state;
    if (classified.dedupOutcome === DEDUP_OUTCOME.POTENTIAL_DUPLICATE) {
      state.setProperty("/duplicateRows", [
        ...(state.getProperty("/duplicateRows") as DuplicateRow[]),
        ...(await this._buildDuplicateRows([classified])),
      ]);
    } else {
      state.setProperty("/newRows", [
        ...(state.getProperty("/newRows") as NewRow[]),
        this._toNewRow(classified),
      ]);
    }
    state.setProperty(
      "/excludedRows",
      (state.getProperty("/excludedRows") as ExcludedEditRow[]).filter(
        row => row.rowNumber !== classified.rowNumber,
      ),
    );
    this._refreshCounts();
  }

  /**
   * Reverts a cleared New-tab row back to editable, restoring the rows its
   * Clear propagated to.
   * @param row the row to reopen
   */
  public restoreRow(row: NewRow): void {
    this._clearing.restoreRow(row);
    this._refreshCounts();
  }

  /**
   * Records the user's decision on a potential duplicate.
   * @param row the duplicate decided on
   * @param decision the decision to record ("skip" or "import")
   */
  public setDuplicateDecision(row: DuplicateRow, decision: string): void {
    row.decision = decision;
    this._state.refresh(true);
  }

  /**
   * Pairs each potential duplicate with the existing transaction it matched.
   * @param duplicates the potential-duplicate classified rows
   * @returns the paired duplicate rows for review
   */
  private async _buildDuplicateRows(
    duplicates: ClassifiedRow[],
  ): Promise<DuplicateRow[]> {
    const ids = duplicates.map(row => row.matchedTransactionId ?? "");
    const matches = await this._service.loadMatchedTransactions(ids);
    return duplicates.map(row => {
      const existing = matches[row.matchedTransactionId ?? ""] ?? null;
      return {
        csv: row,
        existingPostedAt: existing?.postedAt ?? "",
        existingAmount: existing?.amount ?? 0,
        existingDescription: existing?.rawDescription ?? "",
        decision: "",
      };
    });
  }

  /**
   * Recomputes counts, cleared totals, and the progress percentage after any
   * change to the review buckets, then refreshes the bound model.
   */
  private _refreshCounts(): void {
    const state = this._state;
    const newRows = state.getProperty("/newRows") as NewRow[];
    const cleared = newRows.filter(row => row.cleared);
    const total = cleared.reduce((sum, row) => sum + Number(row.amount), 0);
    state.setProperty("/newCount", newRows.length);
    state.setProperty("/clearedCount", cleared.length);
    state.setProperty("/totalAmount", Math.round(total * 100) / 100);
    state.setProperty(
      "/duplicateCount",
      (state.getProperty("/duplicateRows") as DuplicateRow[]).length,
    );
    state.setProperty(
      "/excludedCount",
      (state.getProperty("/excludedRows") as ExcludedEditRow[]).length,
    );
    state.setProperty(
      "/progressPercent",
      newRows.length ? (cleared.length / newRows.length) * PERCENT_MAX : 0,
    );
    state.refresh(true);
  }

  /**
   * Maps an excluded row to an editable Excluded-tab row.
   * @param row the excluded row from the parse result
   * @returns the editable excluded row
   */
  private _toExcludedRow(row: ExcludedRow): ExcludedEditRow {
    return {
      ...row,
      editedValue: row.errorValue,
      rawJoined: row.rawCells.join(", "),
    };
  }

  /**
   * Maps a classified row to a New-tab row, pre-filling the categorization value
   * helps from the engine's suggestion for the user to accept or change.
   * @param row the classified row from the parse result
   * @returns the New-tab row
   */
  private _toNewRow(row: ClassifiedRow): NewRow {
    return {
      ...row,
      vendor_ID: row.suggestedVendor_ID,
      purchaseType_ID: row.suggestedPurchaseType_ID,
      earningCategory_ID: row.suggestedEarningCategory_ID,
      cleared: false,
    };
  }

  /**
   * Maps a reviewed New row to the save payload shape.
   * @param row the reviewed New row
   * @returns the save-row payload
   */
  private _toSaveRow(row: NewRow): SaveRow {
    return {
      postedAt: row.postedAt,
      amount: Number(row.amount),
      rawDescription: row.rawDescription,
      cardInstance_ID: row.cardInstance_ID,
      vendor_ID: row.vendor_ID,
      purchaseType_ID: row.purchaseType_ID,
      earningCategory_ID: row.earningCategory_ID,
    };
  }
}
