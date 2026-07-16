import type {
  CategorizationValidationError,
  CorrectionRequest,
} from "./types.js";

/**
 * Validates user categorization corrections. A correction must target a
 * transaction and assign a vendor; purchase type and earning category are
 * independent and optional.
 */
export class CategorizationValidator {
  /**
   * Validates a correction request, accumulating all errors.
   * @param request Correction request carrying the transaction and assignments.
   * @returns Validation errors, empty when the request is valid.
   */
  static validateCorrection(
    request: CorrectionRequest,
  ): CategorizationValidationError[] {
    const errors: CategorizationValidationError[] = [];
    if (!request.transactionId || request.transactionId.trim() === "") {
      errors.push({
        field: "transactionId",
        messageKey: "categorization.transactionRequired",
      });
    }
    if (!request.vendor_ID || request.vendor_ID.trim() === "") {
      errors.push({
        field: "vendor_ID",
        messageKey: "categorization.vendorRequired",
      });
    }
    return errors;
  }
}
