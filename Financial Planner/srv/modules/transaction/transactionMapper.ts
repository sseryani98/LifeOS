import type {
  BulkCategorizeCommand,
  CategoryReferences,
  CorrectionCommand,
  ReCategorizeCommand,
  RecurringSplitTemplate,
  RecurringSplitTemplateRow,
  SplitCommand,
  SplitSuggestion,
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
   * Maps a saved transaction row to the vendor and taxonomy ids it assigns.
   * @param data The saved row.
   * @returns The three category reference ids, null where unset.
   */
  static toCategoryReferences(data: Record<string, unknown>): CategoryReferences {
    return {
      vendor_ID: (data.vendor_ID ?? null) as string | null,
      purchaseType_ID: (data.purchaseType_ID ?? null) as string | null,
      earningCategory_ID: (data.earningCategory_ID ?? null) as string | null,
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
   * Maps the raw reCategorize payload to a typed re-categorize command.
   * @param data The action request's data block.
   * @returns The typed re-categorize command.
   */
  static toReCategorizeCommand(
    data: Record<string, unknown> | undefined,
  ): ReCategorizeCommand {
    return {
      transactionIds: (data?.transactionIds ?? []) as string[],
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
   * Normalises a recurring split row's decimals; a null percentage must stay
   * null so a dollar template is not read as 0%.
   * @param row The template row as read.
   * @returns The template with numeric shares.
   */
  static toRecurringSplitTemplate(
    row: RecurringSplitTemplateRow,
  ): RecurringSplitTemplate {
    return {
      mySharePct: this._toNullableNumber(row.mySharePct),
      myShareAmount: Number(row.myShareAmount),
      splitDescription: row.splitDescription,
    };
  }

  /**
   * Shapes a template and its share for the new charge into the suggestion DTO.
   * @param template The recurring split being copied.
   * @param myShareAmount The dollar share for the new charge.
   * @returns The suggestion the Split dialog pre-fills from.
   */
  static toSplitSuggestion(
    template: RecurringSplitTemplate,
    myShareAmount: number,
  ): SplitSuggestion {
    return {
      mySharePct: template.mySharePct,
      myShareAmount,
      splitDescription: template.splitDescription,
      isRecurring: true,
    };
  }

  /**
   * Coerces an action param to a number or null; a null share must stay null
   * (not become 0) for the either/or rule.
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
