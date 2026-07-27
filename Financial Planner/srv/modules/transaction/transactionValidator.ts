import { BULK_MESSAGE, CORRECT_MESSAGE, SPLIT_MESSAGE } from "./constants.js";
import type {
  BulkCategorizeCommand,
  CorrectionCommand,
  ReCategorizeCommand,
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
   * user supplies exactly one of percentage or dollar share, and the resulting
   * share must fall within 0 and the full amount. The percentage's own 0–1
   * range is enforced by @assert.range on the action parameter.
   * @param command The split request.
   * @param absAmount The transaction amount's absolute value (the ceiling).
   * @param share The pre-computed dollar share the split will persist.
   * @returns Validation errors, empty when the split is valid.
   */
  static validateSplit(
    command: SplitCommand,
    absAmount: number,
    share: number,
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
    if (share < 0 || share > absAmount) {
      errors.push({
        field: "myShareAmount",
        messageKey: SPLIT_MESSAGE.AMOUNT_EXCEEDS_TOTAL,
      });
    }
    return errors;
  }

  /**
   * Validates a bulk categorization request: at least one row must be selected.
   * The vendor is enforced declaratively by @mandatory on the action param, so
   * only the empty-selection guard (which @mandatory cannot express) lives here.
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
    return errors;
  }

  /**
   * Validates a re-categorize request: at least one row must be selected before
   * categorization is re-run over the selection.
   * @param command The re-categorize request.
   * @returns Validation errors, empty when the request is valid.
   */
  static validateReCategorize(
    command: ReCategorizeCommand,
  ): TransactionValidationError[] {
    const errors: TransactionValidationError[] = [];
    if (command.transactionIds.length === 0) {
      errors.push({
        field: "transactionIds",
        messageKey: BULK_MESSAGE.NO_SELECTION,
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
