import Library from "sap/ui/core/Lib";
import ParseException from "sap/ui/model/ParseException";
import SimpleType from "sap/ui/model/SimpleType";
import { PERCENT } from "com/financialplanner/shared/constants";
import type ResourceBundle from "sap/base/i18n/ResourceBundle";

/**
 * Shows a stored 0–1 share fraction as the 0–100 percentage people type, and
 * stores what they type back as the fraction. OData V4 carries Edm.Decimal as
 * text, so the model side of both directions is a string.
 * @namespace com.financialplanner.shared.util
 */
export default class PercentFractionType extends SimpleType {
  /**
   * Renders the stored fraction as a percentage.
   * @param value the stored fraction, as text or a number
   * @returns the percentage, or "" when there is none
   */
  public formatValue(value: unknown): string {
    if (this._isBlank(value)) {
      return "";
    }
    return String(Number((Number(value) * PERCENT.DIVISOR).toFixed(PERCENT.SHOWN_DECIMALS)));
  }

  /**
   * Converts an entered percentage to the fraction the backend stores.
   * @param value the entered percentage
   * @returns the fraction as text, or null for a cleared field
   */
  public parseValue(value: unknown): string | null {
    if (this._isBlank(value)) {
      return null;
    }
    const percentage = Number(value);
    if (Number.isNaN(percentage)) {
      const bundle = Library.getResourceBundleFor("sap.ui.core") as ResourceBundle;
      throw new ParseException(bundle.getText("EnterNumber") as string);
    }
    return String(Number((percentage / PERCENT.DIVISOR).toFixed(PERCENT.STORED_DECIMALS)));
  }

  /**
   * Range is the backend's @assert.range, which refuses the save with its own
   * message; checking it here too would word the rule twice.
   * @param value the fraction about to be stored
   */
  public validateValue(value: unknown): void {
    void value;
  }

  /**
   * Treats an absent value and an emptied field alike.
   * @param value the value to test
   * @returns true when there is no number to convert
   */
  private _isBlank(value: unknown): boolean {
    return value === null || value === undefined || value === "";
  }
}
