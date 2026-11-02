import type { NewRow, PropagatedFill } from "./types.js";

/**
 * Clear and Undo for New-tab rows. A Clear copies its categorization to the
 * uncategorized rows sharing its description; this class remembers which rows
 * it filled, because Undo must revert them too and a filled row looks no
 * different from one the user categorized by hand.
 *
 * @namespace com.financialplanner.csvimportwizard.model
 */
export default class ClearPropagation {
  private readonly _fills = new Map<NewRow, PropagatedFill[]>();

  /**
   * Clears a row, copying its categorization to uncleared, uncategorized rows
   * with the same description.
   * @param source the row being cleared
   * @param rows every New-tab row
   */
  public clearRow(source: NewRow, rows: NewRow[]): void {
    this._fills.set(source, this._applyCategorization(source, rows));
    source.cleared = true;
  }

  /**
   * Whether a row carries any categorization yet.
   * @param row the row to inspect
   * @returns true when a vendor, purchase type or earning category is set
   */
  public isCategorized(row: NewRow): boolean {
    return Boolean(row.vendor_ID || row.purchaseType_ID || row.earningCategory_ID);
  }

  /**
   * Forgets every recorded fill — the rows they point at belong to a previous parse.
   */
  public reset(): void {
    this._fills.clear();
  }

  /**
   * Reverts a cleared row to editable and restores every row its Clear filled.
   * @param source the row being un-cleared
   */
  public restoreRow(source: NewRow): void {
    source.cleared = false;
    for (const fill of this._fills.get(source) ?? []) {
      // A row the user has since cleared or re-categorized is theirs now — leave it.
      if (!fill.row.cleared && this._hasPropagatedValues(fill.row, source)) {
        fill.row.vendor_ID = fill.vendor_ID;
        fill.row.purchaseType_ID = fill.purchaseType_ID;
        fill.row.earningCategory_ID = fill.earningCategory_ID;
      }
    }
    this._fills.delete(source);
  }

  /**
   * Copies the source's categorization onto its uncategorized siblings.
   * @param source the row whose categorization is copied
   * @param rows every New-tab row
   * @returns the rows filled, with the values each held beforehand
   */
  private _applyCategorization(source: NewRow, rows: NewRow[]): PropagatedFill[] {
    if (!this.isCategorized(source)) {
      return [];
    }
    return rows
      .filter(
        row =>
          !row.cleared &&
          row !== source &&
          row.rawDescription === source.rawDescription &&
          !this.isCategorized(row),
      )
      .map(row => {
        const fill = {
          row,
          vendor_ID: row.vendor_ID,
          purchaseType_ID: row.purchaseType_ID,
          earningCategory_ID: row.earningCategory_ID,
        };
        row.vendor_ID = source.vendor_ID;
        row.purchaseType_ID = source.purchaseType_ID;
        row.earningCategory_ID = source.earningCategory_ID;
        return fill;
      });
  }

  /**
   * Whether a filled row still carries exactly the categorization it was given.
   * @param row the filled row
   * @param source the row it was filled from
   * @returns true when no field has been edited since the fill
   */
  private _hasPropagatedValues(row: NewRow, source: NewRow): boolean {
    return (
      row.vendor_ID === source.vendor_ID &&
      row.purchaseType_ID === source.purchaseType_ID &&
      row.earningCategory_ID === source.earningCategory_ID
    );
  }
}
