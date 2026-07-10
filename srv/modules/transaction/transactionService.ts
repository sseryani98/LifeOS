import cds from "@sap/cds";

import { BaseService } from "../shared/baseService.js";
import { MessagingUtility } from "../shared/messagingUtility.js";
import type { CategorizationService } from "../categorization/categorizationService.js";

import { SPLIT_MESSAGE } from "./constants.js";
import { TransactionMapper } from "./transactionMapper.js";
import { TransactionValidator } from "./transactionValidator.js";
import type { TransactionDataService } from "./transactionDataService.js";
import type {
  BulkCategorizeResult,
  SplitPersistValues,
  SplitResult,
  TransactionValidationError,
} from "./types.js";

/**
 * Transaction-processing engine: splits a transaction into the user's share and
 * applies categorization across a selection. Churning always reads the parent
 * amount; only the budget engine consumes myShareAmount, so splitting stores the
 * share without touching the transaction.
 */
export class TransactionService extends BaseService {
  private readonly categorizationService: CategorizationService;
  private readonly dataService: TransactionDataService;

  /**
   * Creates the engine bound to its data layer and the categorization engine.
   * @param dataService Data-access layer for transaction amounts and splits.
   * @param categorizationService Categorization engine reused for learning.
   */
  constructor(
    dataService: TransactionDataService,
    categorizationService: CategorizationService,
  ) {
    super("transaction");
    this.dataService = dataService;
    this.categorizationService = categorizationService;
  }

  /**
   * Applies one vendor + taxonomy to every selected transaction, firing the
   * categorization learning per row. The learning gate dedupes patterns, so
   * repeated descriptions across the selection learn only once.
   * @param req Request carrying the transaction ids and the assignments.
   * @returns The count of transactions updated, or undefined on validation error.
   */
  async applyCategories(
    req: cds.Request,
  ): Promise<BulkCategorizeResult | undefined> {
    const command = TransactionMapper.toBulkCommand(req.data);
    const errors = TransactionValidator.validateBulkCategorize(command);
    if (errors.length > 0) {
      this._raiseErrors(req, errors);
      return undefined;
    }
    for (const transactionId of command.transactionIds) {
      await this.categorizationService.correctCategorization({
        transactionId,
        vendor_ID: command.vendor_ID,
        purchaseType_ID: command.purchaseType_ID,
        earningCategory_ID: command.earningCategory_ID,
      });
    }
    this.logger.info("STATE_CHANGE", "Bulk categorization applied", {
      count: command.transactionIds.length,
    });
    return { updatedCount: command.transactionIds.length };
  }

  /**
   * Applies a single categorization correction, delegating the write and the
   * pattern learning to the categorization engine.
   * @param req Request carrying the transaction and the assignments.
   * @returns Resolves once the correction completes, undefined on validation error.
   */
  async correctCategorization(req: cds.Request): Promise<void> {
    const command = TransactionMapper.toCorrectionCommand(req.data);
    const errors = TransactionValidator.validateCorrection(command);
    if (errors.length > 0) {
      this._raiseErrors(req, errors);
      return;
    }
    await this.categorizationService.correctCategorization(command);
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
    const absAmount = Math.abs(transaction.amount);
    const errors = TransactionValidator.validateSplit(command, absAmount);
    if (errors.length > 0) {
      this._raiseErrors(req, errors);
      return undefined;
    }
    const myShareAmount = TransactionValidator.computeMyShareAmount(
      command,
      absAmount,
    );
    await this._saveSplit(command.transactionId, {
      mySharePct: command.mySharePct,
      myShareAmount,
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
      myShareAmount,
      isRecurring: command.isRecurring,
    };
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
    await this.dataService.insertSplit(cds.utils.uuid(), transactionId, values);
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
