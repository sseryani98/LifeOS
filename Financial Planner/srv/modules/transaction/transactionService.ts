import cds from "@sap/cds";

import { BaseService } from "../shared/baseService.js";
import { MessagingUtility } from "../shared/messagingUtility.js";
import { CATEGORIZATION_STATUS } from "../categorization/constants.js";
import type { CategorizationService } from "../categorization/categorizationService.js";

import {
  CATEGORIZE_MESSAGE,
  CORRECT_MESSAGE,
  MATCH_SUGGESTION,
} from "./constants.js";
import { TransactionMapper } from "./transactionMapper.js";
import { TransactionValidator } from "./transactionValidator.js";
import type { TransactionDataService } from "./transactionDataService.js";
import type {
  BulkCategorizeResult,
  CategoryReferences,
  ReCategorizeResult,
  TransactionValidationError,
} from "./types.js";

/**
 * Transaction categorization engine: single and bulk corrections, re-runs, and
 * the object-page hooks that fill, explain and learn from a vendor pick. Split
 * handling lives in TransactionSplitService.
 */
export class TransactionService extends BaseService {
  private readonly categorizationService: CategorizationService;
  private readonly dataService: TransactionDataService;

  /**
   * Creates the engine bound to its data layer and the categorization engine.
   * @param dataService Data-access layer for transaction categorization reads.
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
    if (!(await this._checkReferencesExist(req, command))) {
      return undefined;
    }
    // validateBulkCategorize guarantees a vendor above. A field left empty in the
    // dialog keeps each row's own value, so null becomes "absent".
    const vendorId = command.vendor_ID as string;
    const purchaseTypeId = command.purchaseType_ID ?? undefined;
    const earningCategoryId = command.earningCategory_ID ?? undefined;
    let updatedCount = 0;
    for (const transactionId of new Set(command.transactionIds)) {
      const written = await this.categorizationService.correctCategorization({
        transactionId,
        vendor_ID: vendorId,
        purchaseType_ID: purchaseTypeId,
        earningCategory_ID: earningCategoryId,
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
   * @returns Resolves once the correction completes, undefined on validation or not-found error.
   */
  async correctCategorization(req: cds.Request): Promise<void> {
    const command = TransactionMapper.toCorrectionCommand(req.data);
    const errors = TransactionValidator.validateCorrection(command);
    if (errors.length > 0) {
      this._raiseErrors(req, errors);
      return;
    }
    if (!(await this._checkReferencesExist(req, command))) {
      return;
    }
    // validateCorrection guarantees a transaction and vendor above.
    const written = await this.categorizationService.correctCategorization({
      transactionId: command.transactionId,
      vendor_ID: command.vendor_ID as string,
      purchaseType_ID: command.purchaseType_ID,
      earningCategory_ID: command.earningCategory_ID,
    });
    if (!written) {
      req.error({
        code: CORRECT_MESSAGE.TRANSACTION_NOT_FOUND,
        message: MessagingUtility.getText(CORRECT_MESSAGE.TRANSACTION_NOT_FOUND),
        target: "transactionId",
        status: 404,
      });
    }
  }

  /**
   * An object-page save that changes the vendor, purchase type or earning
   * category is a human correction, so the row is stamped `user_corrected`.
   * Pattern learning keys on the vendor, so it fires only when the vendor moved.
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
    const stored =
      await this.dataService.loadStoredCategorization(transactionId);
    const vendorChanged = stored?.vendor_ID !== vendorId;
    if (!vendorChanged && !this._hasTaxonomyChanged(data, stored)) {
      return;
    }
    const references = TransactionMapper.toCategoryReferences(data);
    if (!(await this._checkReferencesExist(req, references))) {
      return;
    }
    data.categorizationStatus = CATEGORIZATION_STATUS.USER_CORRECTED;
    if (vendorChanged) {
      await this.categorizationService.applyAssignmentLearning(
        transactionId,
        vendorId,
      );
    }
  }

  /**
   * Picking a vendor on the object page fills the draft's empty purchase type
   * and earning category from the vendor's top combo. A field the draft
   * or this patch already sets is never overwritten.
   * @param req The draft PATCH request.
   * @returns Resolves once any field is filled.
   */
  async applyVendorCategories(req: cds.Request): Promise<void> {
    const data = req.data as Record<string, unknown>;
    const vendorId = data.vendor_ID;
    const transactionId = this._resolveTransactionKey(req);
    if (typeof vendorId !== "string" || !vendorId || !transactionId) {
      return;
    }
    const [draft, combo] = await Promise.all([
      this.dataService.loadDraftCategorization(transactionId),
      this.dataService.loadTopCategoryCombo(vendorId),
    ]);
    if (!combo) {
      return;
    }
    const fields = ["purchaseType_ID", "earningCategory_ID"] as const;
    for (const field of fields) {
      if (!(field in data) && !draft?.[field] && combo[field]) {
        data[field] = combo[field];
      }
    }
  }

  /**
   * Fills the matched pattern and its confidence on a read that asks for them,
   * which only the matcher can compute. The object page asks; the list does not,
   * so a list read never pays for the matcher.
   * @param result The READ result rows.
   * @param req The READ request, whose columns say what the client asked for.
   * @returns Resolves once the rows are filled.
   */
  async applyMatchSuggestion(result: unknown, req: cds.Request): Promise<void> {
    const rows = (Array.isArray(result) ? result : [result]).filter(
      (row): row is Record<string, unknown> =>
        !!row && typeof row === "object" && typeof (row as { ID?: unknown }).ID === "string",
    );
    if (rows.length === 0 || !this._isMatchRequested(req)) {
      return;
    }
    const context = await this.categorizationService.buildContext();
    for (const row of rows) {
      const source = await this.dataService.loadTransactionMatchSource(row.ID as string);
      const match = source
        ? context.findMatch(source.rawDescription, source.amount)
        : null;
      row.matchedPattern = match?.pattern ?? null;
      row.matchConfidence = match?.confidenceName ?? null;
    }
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
   * Refuses ids that name no vendor or taxonomy row with a 400 per field, so a
   * stale selection reads as a validation error instead of a database 500.
   * @param req Request to accumulate errors on.
   * @param references The vendor and taxonomy ids being assigned.
   * @returns True when every given id exists.
   */
  private async _checkReferencesExist(
    req: cds.Request,
    references: CategoryReferences,
  ): Promise<boolean> {
    const missing = await this.dataService.findMissingReferences(references);
    this._raiseErrors(
      req,
      missing.map(field => ({
        field,
        messageKey: CATEGORIZE_MESSAGE.UNKNOWN_REFERENCE,
      })),
    );
    return missing.length === 0;
  }

  /**
   * Tells whether a save moves the purchase type or earning category off the
   * stored row; a field the save does not carry is not a change.
   * @param data The saved row.
   * @param stored The row as stored before the save.
   * @returns True when either taxonomy id differs from the stored one.
   */
  private _hasTaxonomyChanged(
    data: Record<string, unknown>,
    stored: CategoryReferences | null,
  ): boolean {
    const fields = ["purchaseType_ID", "earningCategory_ID"] as const;
    return fields.some(
      field =>
        field in data && (data[field] ?? null) !== (stored?.[field] ?? null),
    );
  }

  /**
   * Tells whether a READ explicitly selects the matcher-filled columns.
   * @param req The READ request.
   * @returns True when matchedPattern or matchConfidence is selected.
   */
  private _isMatchRequested(req: cds.Request): boolean {
    const query = req.query as { SELECT?: { columns?: Array<{ ref?: string[] }> } };
    const columns = query.SELECT?.columns ?? [];
    return columns.some(column =>
      (MATCH_SUGGESTION.COLUMNS as readonly string[]).includes(column.ref?.[0] ?? ""),
    );
  }

  /**
   * Pulls the transaction id from an UPDATE request's key.
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
