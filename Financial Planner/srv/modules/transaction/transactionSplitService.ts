import cds from "@sap/cds";

import { BaseService } from "../shared/baseService.js";
import { CurrencyUtility } from "../shared/currencyUtility.js";
import { MessagingUtility } from "../shared/messagingUtility.js";

import { SPLIT_MESSAGE } from "./constants.js";
import { TransactionMapper } from "./transactionMapper.js";
import { TransactionValidator } from "./transactionValidator.js";
import type { TransactionDataService } from "./transactionDataService.js";
import type {
  SplitCommand,
  SplitPersistValues,
  SplitResult,
  SplitSuggestion,
  TransactionValidationError,
} from "./types.js";

/**
 * Split engine: stores the user's share of a transaction, holds object-page share
 * edits to the same rules, and suggests recurring split terms. Churning always
 * reads the parent amount; only the budget engine consumes myShareAmount, so
 * splitting stores the share without touching the transaction.
 */
export class TransactionSplitService extends BaseService {
  private readonly dataService: TransactionDataService;

  /**
   * Creates the split engine bound to its data layer.
   * @param dataService Data-access layer for transaction amounts and splits.
   */
  constructor(dataService: TransactionDataService) {
    super("transaction");
    this.dataService = dataService;
  }

  /**
   * Splits a transaction into the user's share, creating or replacing its single
   * split. Accepts a percentage or a dollar amount; myShareAmount is always
   * stored (percentage × amount when a percentage is given).
   * @param req Request carrying the transaction id and the share input.
   * @returns The stored split values, or undefined on validation error.
   */
  async splitTransaction(req: cds.Request): Promise<SplitResult | undefined> {
    const command = TransactionMapper.toSplitCommand(req.data);
    const transaction = await this.dataService.loadTransactionAmount(
      command.transactionId,
    );
    if (!transaction) {
      req.error({
        code: SPLIT_MESSAGE.TRANSACTION_NOT_FOUND,
        message: MessagingUtility.getText(SPLIT_MESSAGE.TRANSACTION_NOT_FOUND),
        target: "transactionId",
        status: 404,
      });
      return undefined;
    }
    const { share, errors } = this._computeValidShare(command, transaction.amount);
    if (errors.length > 0) {
      this._raiseErrors(req, errors);
      return undefined;
    }
    await this._saveSplit(command.transactionId, {
      mySharePct: command.mySharePct,
      myShareAmount: share,
      splitDescription: command.splitDescription,
      isRecurring: command.isRecurring,
    });
    this.logger.info("STATE_CHANGE", "Transaction split saved", {
      transactionId: command.transactionId,
      isRecurring: command.isRecurring,
    });
    return {
      transactionId: command.transactionId,
      mySharePct: command.mySharePct,
      myShareAmount: share,
      isRecurring: command.isRecurring,
    };
  }

  /**
   * Holds an object-page edit of a split's share to the Split action's rules: a
   * percentage recomputes the dollar share, a dollar share clears the percentage,
   * and a patch carrying both is refused. A cleared dollar share falls back to the
   * stored percentage. A patch touching neither passes through.
   * @param req The draft split PATCH request.
   * @returns Resolves once the patch is completed or refused.
   */
  async applySplitShareEdit(req: cds.Request): Promise<void> {
    const data = req.data as Record<string, unknown>;
    const clearsAmount = "myShareAmount" in data && data.myShareAmount === null;
    let command = TransactionMapper.toSplitCommand(data);
    if (command.mySharePct === null && command.myShareAmount === null && !clearsAmount) {
      return;
    }
    if (clearsAmount && !("mySharePct" in data)) {
      const storedPct = await this.dataService.loadDraftSplitPct(req.subject);
      command = TransactionMapper.toSplitCommand({ ...data, mySharePct: storedPct });
    }
    const transactionId = await this.dataService.loadDraftSplitTransactionId(
      req.subject,
    );
    const transaction = transactionId
      ? await this.dataService.loadTransactionAmount(transactionId)
      : null;
    if (!transaction) {
      return;
    }
    const outcome = this._computeValidShare(command, transaction.amount);
    const [error] = outcome.errors;
    if (error) {
      // A draft PATCH keeps a targeted error only as a draft message and still
      // activates, so the refusal carries no target to make it fail the PATCH.
      req.error({
        code: error.messageKey,
        message: MessagingUtility.getText(error.messageKey),
        status: 400,
      });
      return;
    }
    data.mySharePct = command.mySharePct;
    data.myShareAmount = outcome.share;
  }

  /**
   * Suggests the vendor's most recent recurring split terms for a transaction,
   * recalculating a percentage template on the new amount. Read-only — a
   * suggestion is never auto-applied; the user confirms it in the Split dialog.
   * @param req Request carrying the transaction id.
   * @returns The suggestion, null when none applies, or undefined when not found.
   */
  async findRecurringSplitSuggestion(
    req: cds.Request,
  ): Promise<SplitSuggestion | null | undefined> {
    const transactionId = req.data.transactionId as string;
    const transaction =
      await this.dataService.loadTransactionForSuggestion(transactionId);
    if (!transaction) {
      req.error({
        code: SPLIT_MESSAGE.TRANSACTION_NOT_FOUND,
        message: MessagingUtility.getText(SPLIT_MESSAGE.TRANSACTION_NOT_FOUND),
        target: "transactionId",
        status: 404,
      });
      return undefined;
    }
    if (!transaction.vendor_ID) {
      return null;
    }
    const row = await this.dataService.findLatestRecurringSplit(
      transaction.vendor_ID,
      transactionId,
    );
    if (!row) {
      return null;
    }
    const template = TransactionMapper.toRecurringSplitTemplate(row);
    const myShareAmount = this._computeMyShareAmount(
      template.mySharePct,
      template.myShareAmount,
      Math.abs(Number(transaction.amount)),
    );
    return TransactionMapper.toSplitSuggestion(template, myShareAmount);
  }

  /**
   * Computes the dollar share a split persists or a suggestion offers: a
   * percentage of the amount (rounded to cents) or the fixed dollar value —
   * never null, so myShareAmount always has a value for the budget engine.
   * @param mySharePct The share as a 0–1 fraction, or null when dollar-based.
   * @param fixedAmount The fixed dollar share, used when there is no percentage.
   * @param absAmount The transaction amount's absolute value.
   * @returns The share in dollars.
   */
  private _computeMyShareAmount(
    mySharePct: number | null,
    fixedAmount: number | null,
    absAmount: number,
  ): number {
    if (mySharePct !== null) {
      return CurrencyUtility.roundToCents(absAmount * mySharePct);
    }
    return fixedAmount ?? 0;
  }

  /**
   * Computes the dollar share a split input yields and checks it against the
   * transaction — one rule set for the Split action and the object-page edit.
   * @param command The share input: a percentage or a dollar amount.
   * @param amount The transaction's signed amount.
   * @returns The dollar share and the rules it breaks, empty when valid.
   */
  private _computeValidShare(
    command: SplitCommand,
    amount: number,
  ): { share: number; errors: TransactionValidationError[] } {
    const absAmount = Math.abs(amount);
    const share = this._computeMyShareAmount(
      command.mySharePct,
      command.myShareAmount,
      absAmount,
    );
    const errors = TransactionValidator.validateSplit(command, absAmount, share);
    return { share, errors };
  }

  /**
   * Creates the transaction's split, or replaces the existing one — a
   * transaction has at most one split.
   * @param transactionId The parent transaction.
   * @param values The computed split values.
   * @returns Resolves once the split is persisted.
   */
  private async _saveSplit(
    transactionId: string,
    values: SplitPersistValues,
  ): Promise<void> {
    const existing =
      await this.dataService.findSplitByTransaction(transactionId);
    if (existing) {
      await this.dataService.updateSplit(existing.ID, values);
      return;
    }
    await this.dataService.insertSplit(transactionId, values);
  }

  /**
   * Reports each validation error against its field target.
   * @param req Request to accumulate errors on.
   * @param errors Validation errors to report.
   */
  private _raiseErrors(
    req: cds.Request,
    errors: TransactionValidationError[],
  ): void {
    for (const error of errors) {
      req.error({
        code: error.messageKey,
        message: MessagingUtility.getText(error.messageKey),
        target: error.field,
        status: 400,
      });
    }
  }
}
