import { CurrencyUtility } from "../shared/currencyUtility.js";

import {
  BULK_MESSAGE,
  CORRECT_MESSAGE,
  PERCENTAGE,
  SPLIT_MESSAGE,
} from "./constants.js";
import type {
  BulkCategorizeCommand,
  CorrectionCommand,
  SplitCommand,
  TransactionValidationError,
} from "./types.js";

/**
 * Validates transaction-processing inputs: split share rules (either/or,
 * percentage range, share ≤ transaction total) and bulk categorization
 * selection.
 */
export class TransactionValidator {
  /**
   * Validates a split request against the transaction's absolute amount. The
   * user supplies exactly one of percentage or dollar share; the resulting share
   * must fall within 0 and the full amount.
   * @param command The split request.
   * @param absAmount The transaction amount's absolute value (the ceiling).
   * @returns Validation errors, empty when the split is valid.
   */
  static validateSplit(
    command: SplitCommand,
    absAmount: number,
  ): TransactionValidationError[] {
    const errors: TransactionValidationError[] = [];
    const pctGiven = command.mySharePct !== null;
    const amountGiven = command.myShareAmount !== null;
    if (pctGiven === amountGiven) {
      errors.push({
        field: "mySharePct",
        messageKey: SPLIT_MESSAGE.ENTER_ONE_INPUT,
      });
      return errors;
    }
    if (
      pctGiven &&
      ((command.mySharePct as number) < PERCENTAGE.MIN ||
        (command.mySharePct as number) > PERCENTAGE.MAX)
    ) {
      errors.push({
        field: "mySharePct",
        messageKey: SPLIT_MESSAGE.INVALID_PERCENTAGE,
      });
      return errors;
    }
    // Only the dollar path reaches here out of range — a validated percentage
    // (0–1) can never yield a share above the total.
    const share = this.computeMyShareAmount(command, absAmount);
    if (share < 0 || share > absAmount) {
      errors.push({
        field: "myShareAmount",
        messageKey: SPLIT_MESSAGE.AMOUNT_EXCEEDS_TOTAL,
      });
    }
    return errors;
  }

  /**
   * Computes the dollar share the split persists: a percentage of the amount
   * (rounded to cents) or the entered dollar value. Always returns a number so
   * myShareAmount is never left null.
   * @param command The split request.
   * @param absAmount The transaction amount's absolute value.
   * @returns The share in dollars.
   */
  static computeMyShareAmount(
    command: SplitCommand,
    absAmount: number,
  ): number {
    if (command.mySharePct !== null) {
      return CurrencyUtility.roundToCents(absAmount * command.mySharePct);
    }
    return command.myShareAmount ?? 0;
  }

  /**
   * Validates a bulk categorization request: at least one row selected and a
   * vendor to anchor the assignment and its learned pattern.
   * @param command The bulk categorization request.
   * @returns Validation errors, empty when the request is valid.
   */
  static validateBulkCategorize(
    command: BulkCategorizeCommand,
  ): TransactionValidationError[] {
    const errors: TransactionValidationError[] = [];
    if (command.transactionIds.length === 0) {
      errors.push({
        field: "transactionIds",
        messageKey: BULK_MESSAGE.NO_SELECTION,
      });
    }
    if (!command.vendor_ID) {
      errors.push({
        field: "vendor_ID",
        messageKey: BULK_MESSAGE.VENDOR_REQUIRED,
      });
    }
    return errors;
  }

  /**
   * Validates a single-transaction correction: a target transaction and the
   * vendor being assigned (the anchor for the learned pattern).
   * @param command The correction request.
   * @returns Validation errors, empty when the correction is valid.
   */
  static validateCorrection(
    command: CorrectionCommand,
  ): TransactionValidationError[] {
    const errors: TransactionValidationError[] = [];
    if (!command.transactionId) {
      errors.push({
        field: "transactionId",
        messageKey: CORRECT_MESSAGE.TRANSACTION_REQUIRED,
      });
    }
    if (!command.vendor_ID) {
      errors.push({
        field: "vendor_ID",
        messageKey: CORRECT_MESSAGE.VENDOR_REQUIRED,
      });
    }
    return errors;
  }
}
