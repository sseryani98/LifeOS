import type {
  BulkCategorizeCommand,
  CorrectionCommand,
  SplitCommand,
} from "./types.js";

/**
 * Translation of the transaction action payloads into typed domain commands.
 */
export class TransactionMapper {
  /**
   * Maps the raw splitTransaction payload to a typed split command.
   * @param data The action request's data block.
   * @returns The typed split command.
   */
  static toSplitCommand(data: Record<string, unknown> | undefined): SplitCommand {
    return {
      transactionId: (data?.transactionId ?? "") as string,
      mySharePct: this._toNullableNumber(data?.mySharePct),
      myShareAmount: this._toNullableNumber(data?.myShareAmount),
      splitDescription: (data?.splitDescription ?? null) as string | null,
      isRecurring: (data?.isRecurring ?? false) as boolean,
    };
  }

  /**
   * Maps the raw bulkCategorize payload to a typed bulk command.
   * @param data The action request's data block.
   * @returns The typed bulk categorization command.
   */
  static toBulkCommand(
    data: Record<string, unknown> | undefined,
  ): BulkCategorizeCommand {
    return {
      transactionIds: (data?.transactionIds ?? []) as string[],
      vendor_ID: (data?.vendor_ID ?? null) as string | null,
      purchaseType_ID: (data?.purchaseType_ID ?? null) as string | null,
      earningCategory_ID: (data?.earningCategory_ID ?? null) as string | null,
    };
  }

  /**
   * Maps the raw correctCategorization payload to a typed correction command.
   * @param data The action request's data block.
   * @returns The typed correction command.
   */
  static toCorrectionCommand(
    data: Record<string, unknown> | undefined,
  ): CorrectionCommand {
    return {
      transactionId: (data?.transactionId ?? "") as string,
      vendor_ID: (data?.vendor_ID ?? null) as string | null,
      purchaseType_ID: (data?.purchaseType_ID ?? null) as string | null,
      earningCategory_ID: (data?.earningCategory_ID ?? null) as string | null,
    };
  }

  /**
   * Coerces an action param to a number or null — CAP omits absent optional
   * params, and a null share must stay null (not become 0) for the either/or rule.
   * @param value The raw param value.
   * @returns The numeric value, or null when absent.
   */
  private static _toNullableNumber(value: unknown): number | null {
    if (value === null || value === undefined || value === "") {
      return null;
    }
    return Number(value);
  }
}
