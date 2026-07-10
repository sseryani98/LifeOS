import type {
  ClaimRequest,
  SimpleFINValidationError,
} from "./types.js";

/**
 * Validates SimpleFIN connection management inputs.
 */
export class SimpleFINValidator {
  /**
   * Validates an Add-Connection claim request (setup token + display name).
   *
   * @param request Claim payload with setup token and display name.
   * @returns Validation errors, empty when the request is valid.
   */
  static validateClaimRequest(request: ClaimRequest): SimpleFINValidationError[] {
    const errors: SimpleFINValidationError[] = [];
    if (!request.setupToken || request.setupToken.trim() === "") {
      errors.push({
        field: "setupToken",
        messageKey: "simplefin.setupTokenRequired",
      });
    }
    if (!request.displayName || request.displayName.trim() === "") {
      errors.push({
        field: "displayName",
        messageKey: "simplefin.displayNameRequired",
      });
    }
    return errors;
  }

  /**
   * Validates that a connection id is present before a manual sync.
   *
   * @param connectionId Connection id supplied to the manual sync action.
   * @returns Validation errors, empty when the id is present.
   */
  static validateConnectionId(
    connectionId: string | null | undefined,
  ): SimpleFINValidationError[] {
    if (!connectionId) {
      return [
        {
          field: "connectionId",
          messageKey: "simplefin.connectionIdRequired",
        },
      ];
    }
    return [];
  }
}
