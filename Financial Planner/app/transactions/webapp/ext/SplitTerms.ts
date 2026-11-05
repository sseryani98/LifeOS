import {
  DIALOG_FIELD,
  MESSAGE_KEY,
  SPLIT_AMOUNT,
  SPLIT_PERCENT,
  SPLIT_SEED,
} from "com/financialplanner/transactions/constants";
import { PERCENT } from "com/financialplanner/shared/constants";
import type {
  SplitDialogData,
  SplitSuggestion,
} from "com/financialplanner/transactions/model/types";

/**
 * The Split dialog's arithmetic and refusals, free of any dialog or page: the
 * seed it opens with, the amount a percentage yields, and what a confirm may send.
 */
export default class SplitTerms {
  /**
   * Builds the Split dialog's opening values: the seed terms with their share as
   * 0–100 and their own recurring flag, or blank with recurring off when there are none.
   * @param suggestion the row's own split or the vendor's recurring split, or null
   * @returns the initial split model data
   */
  public static buildSeed(suggestion: SplitSuggestion | null): SplitDialogData {
    if (!suggestion) {
      return {
        mySharePct: null,
        myShareAmount: null,
        splitDescription: "",
        isRecurring: false,
      };
    }
    return {
      mySharePct:
        suggestion.mySharePct === null
          ? null
          : Number(
              (suggestion.mySharePct * PERCENT.DIVISOR).toFixed(
                SPLIT_SEED.PCT_DECIMALS,
              ),
            ),
      myShareAmount: suggestion.myShareAmount,
      splitDescription: suggestion.splitDescription,
      isRecurring: suggestion.isRecurring,
    };
  }

  /**
   * The amount a 0–100 percentage yields on a row, as the object page shows it.
   * @param rowAmount the row's signed amount, or null when it has not loaded
   * @param percentage the entered percentage
   * @returns the derived amount, or null with no row amount to compute from
   */
  public static deriveAmount(
    rowAmount: number | null,
    percentage: number,
  ): number | null {
    return rowAmount === null
      ? null
      : Number(
          ((Math.abs(rowAmount) * percentage) / PERCENT.DIVISOR).toFixed(
            SPLIT_AMOUNT.DECIMALS,
          ),
        );
  }

  /**
   * Finds the first entered share the backend would refuse for its shape, so the
   * dialog refuses it in the user's words instead.
   * @param enteredPct the entered percentage 0–100, or null
   * @param enteredAmount the entered amount, or null
   * @returns the field to flag and the reason's i18n key, or null when both are sound
   */
  public static findInputRefusal(
    enteredPct: number | null,
    enteredAmount: number | null,
  ): { field: string; key: string } | null {
    if (
      enteredAmount !== null &&
      SplitTerms._hasExtraDecimals(enteredAmount, SPLIT_AMOUNT.DECIMALS)
    ) {
      return {
        field: DIALOG_FIELD.SPLIT_AMOUNT,
        key: MESSAGE_KEY.SPLIT_AMOUNT_DECIMALS,
      };
    }
    if (enteredPct === null) {
      return null;
    }
    if (SplitTerms._hasExtraDecimals(enteredPct, SPLIT_PERCENT.DECIMALS)) {
      return {
        field: DIALOG_FIELD.SPLIT_PERCENT,
        key: MESSAGE_KEY.SPLIT_PERCENT_DECIMALS,
      };
    }
    return SplitTerms.isPercentOutOfRange(enteredPct)
      ? {
          field: DIALOG_FIELD.SPLIT_PERCENT,
          key: MESSAGE_KEY.SPLIT_PERCENT_RANGE,
        }
      : null;
  }

  /**
   * Tells whether a 0–100 percentage falls outside the range a share can take.
   * @param percentage the entered percentage
   * @returns true when it is below 0 or above 100
   */
  public static isPercentOutOfRange(percentage: number): boolean {
    return percentage < SPLIT_PERCENT.MIN || percentage > SPLIT_PERCENT.MAX;
  }

  /**
   * Names the Split dialog field a backend refusal targets: the action
   * parameter's last path segment, when it is one of the two share inputs.
   * @param error the rejected action's error, carrying the OData error body
   * @returns the field to flag, or null when the refusal names no share input
   */
  public static readRefusedField(error: unknown): string | null {
    const target =
      (error as { error?: { target?: string } }).error?.target ?? "";
    const field = target.split("/").pop();
    return field === DIALOG_FIELD.SPLIT_PERCENT ||
      field === DIALOG_FIELD.SPLIT_AMOUNT
      ? field
      : null;
  }

  /**
   * The backend refuses both share forms at once. An amount the dialog derived
   * from the percentage (seeded or recomputed) is not a second form, so the
   * percentage goes alone; any other pair goes through for the backend to refuse.
   * The fraction is rounded to its column's 4 decimals, as division leaves float noise.
   * @param enteredPct the entered percentage 0–100, or null
   * @param enteredAmount the entered amount, or null
   * @param derivedAmount the amount the dialog itself derived, or null
   * @returns the share pair to send, the percentage as a 0–1 fraction
   */
  public static resolveShares(
    enteredPct: number | null,
    enteredAmount: number | null,
    derivedAmount: number | null,
  ): { mySharePct: number | null; myShareAmount: number | null } {
    const mySharePct =
      enteredPct === null
        ? null
        : Number(
            (enteredPct / PERCENT.DIVISOR).toFixed(
              SPLIT_PERCENT.FRACTION_DECIMALS,
            ),
          );
    if (mySharePct === null || enteredAmount === null) {
      return { mySharePct, myShareAmount: enteredAmount };
    }
    return {
      mySharePct,
      myShareAmount: enteredAmount === derivedAmount ? null : enteredAmount,
    };
  }

  /**
   * Tells whether an entered share carries more decimals than its column holds:
   * the amount's Decimal(15,2), or the percentage whose fraction is Decimal(5,4).
   * @param value the entered amount or 0–100 percentage
   * @param decimals the decimals the entry may carry
   * @returns true when the backend would refuse it as an invalid decimal
   */
  private static _hasExtraDecimals(value: number, decimals: number): boolean {
    return Number(value.toFixed(decimals)) !== value;
  }
}
