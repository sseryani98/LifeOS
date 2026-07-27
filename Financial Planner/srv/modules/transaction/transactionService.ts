import cds from "@sap/cds";

import { BaseService } from "../shared/baseService.js";
import { CurrencyUtility } from "../shared/currencyUtility.js";
import { MessagingUtility } from "../shared/messagingUtility.js";
import { CATEGORIZATION_STATUS } from "../categorization/constants.js";
import type { CategorizationService } from "../categorization/categorizationService.js";

import { SPLIT_MESSAGE } from "./constants.js";
import { TransactionMapper } from "./transactionMapper.js";
import { TransactionValidator } from "./transactionValidator.js";
import type { TransactionDataService } from "./transactionDataService.js";
import type {
  BulkCategorizeResult,
  ReCategorizeResult,
  SplitCommand,
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
   * @returns The count of rows actually written, or undefined on validation error.
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
    // validateBulkCategorize guarantees a vendor above.
    const vendorId = command.vendor_ID as string;
    let updatedCount = 0;
    for (const transactionId of command.transactionIds) {
      const written = await this.categorizationService.correctCategorization({
        transactionId,
        vendor_ID: vendorId,
        purchaseType_ID: command.purchaseType_ID,
        earningCategory_ID: command.earningCategory_ID,
      });
      if (written) {
        updatedCount += 1;
      }
    }
    this.logger.info("STATE_CHANGE", "Bulk categorization applied", {
      count: updatedCount,
    });
    return { updatedCount };
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
    // validateCorrection guarantees a transaction and vendor above.
    await this.categorizationService.correctCategorization({
      transactionId: command.transactionId,
      vendor_ID: command.vendor_ID as string,
      purchaseType_ID: command.purchaseType_ID,
      earningCategory_ID: command.earningCategory_ID,
    });
  }

  /**
   * Learns a MerchantPattern when a draft save changes a transaction's vendor.
   * Runs as a before-SAVE hook: the activated draft carries the full row, so a
   * real change is detected by comparing the incoming vendor against the stored
   * one — then the row is stamped `user_corrected` and pattern learning fires. A
   * save that leaves the vendor unchanged is left untouched.
   * @param req The SAVE request carrying the activated row.
   * @returns Resolves once any pattern is learned.
   */
  async applyInlineEditLearning(req: cds.Request): Promise<void> {
    const data = req.data as Record<string, unknown>;
    const vendorId = data.vendor_ID as string | null | undefined;
    if (!vendorId) {
      return;
    }
    const transactionId = this._resolveTransactionKey(req);
    if (!transactionId) {
      return;
    }
    const storedVendorId =
      await this.dataService.loadStoredVendor(transactionId);
    if (storedVendorId === vendorId) {
      return;
    }
    data.categorizationStatus = CATEGORIZATION_STATUS.USER_CORRECTED;
    await this.categorizationService.applyAssignmentLearning(
      transactionId,
      vendorId,
    );
  }

  /**
   * Re-runs categorization over a selection, applying fresh matches as `auto` and
   * leaving user-corrected rows untouched. Delegates the batch to the
   * categorization engine, which reuses one loaded snapshot across the rows.
   * @param req Request carrying the selected transaction ids.
   * @returns The re-categorized and skipped counts, or undefined on validation error.
   */
  async runReCategorization(
    req: cds.Request,
  ): Promise<ReCategorizeResult | undefined> {
    const command = TransactionMapper.toReCategorizeCommand(req.data);
    const errors = TransactionValidator.validateReCategorize(command);
    if (errors.length > 0) {
      this._raiseErrors(req, errors);
      return undefined;
    }
    const outcome = await this.categorizationService.applyReCategorization(
      command.transactionIds,
    );
    this.logger.info("STATE_CHANGE", "Re-categorization requested", {
      selected: command.transactionIds.length,
      recategorizedCount: outcome.recategorizedCount,
    });
    return outcome;
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
    const share = this._computeMyShareAmount(command, absAmount);
    const errors = TransactionValidator.validateSplit(command, absAmount, share);
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
   * Computes the dollar share the split persists: a percentage of the amount
   * (rounded to cents) or the entered dollar value — never null, so
   * myShareAmount always has a value for the budget engine.
   * @param command The split request.
   * @param absAmount The transaction amount's absolute value.
   * @returns The share in dollars.
   */
  private _computeMyShareAmount(
    command: SplitCommand,
    absAmount: number,
  ): number {
    if (command.mySharePct !== null) {
      return CurrencyUtility.roundToCents(absAmount * command.mySharePct);
    }
    return command.myShareAmount ?? 0;
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
   * Pulls the transaction id from an UPDATE request's key — CAP exposes the
   * keyed entity as the last entry of req.params, either as an id string or a
   * `{ ID }` object.
   * @param req The UPDATE request.
   * @returns The transaction id, or null when it cannot be resolved.
   */
  private _resolveTransactionKey(req: cds.Request): string | null {
    const params = req.params as unknown[] | undefined;
    const last = params?.[params.length - 1];
    if (typeof last === "string") {
      return last;
    }
    if (last && typeof last === "object" && "ID" in last) {
      return (last as { ID: string }).ID;
    }
    const dataId = (req.data as Record<string, unknown>).ID;
    return typeof dataId === "string" ? dataId : null;
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
