import cds from "@sap/cds";

import { BaseFacade } from "../shared/baseFacade.js";

import type { TransactionService } from "./transactionService.js";
import type {
  BulkCategorizeResult,
  ReCategorizeResult,
  SplitResult,
  SplitSuggestion,
} from "./types.js";

/**
 * Facade wiring for the transaction action handlers and the inline-edit
 * learning hook.
 */
export class TransactionFacade extends BaseFacade {
  private readonly service: TransactionService;

  /**
   * Creates the facade bound to a CDS service and the transaction engine.
   * @param srv CDS application service to register handlers on.
   * @param service Transaction engine the handlers delegate to.
   */
  constructor(srv: cds.ApplicationService, service: TransactionService) {
    super(srv, "transaction");
    this.service = service;
  }

  /** Registers the transaction action handlers and the inline-edit learning hook. */
  registerHandlers(): void {
    this._registerSplitHandlers();
    this._registerCategorizationHandlers();
    this._registerDraftHandlers();
  }

  /** Registers the Split action, its recurring-suggestion function and the object-page share edit. */
  private _registerSplitHandlers(): void {
    this.srv.on(
      "splitTransaction",
      this.wrapHandler(
        this._handleSplitTransaction,
        "action-splitTransaction",
        "Transactions",
        "transaction.split.failed",
      ),
    );
    this.srv.on(
      "suggestRecurringSplit",
      this.wrapHandler(
        this._handleSuggestRecurringSplit,
        "function-suggestRecurringSplit",
        "Transactions",
        "transaction.split.suggestFailed",
      ),
    );
    this.srv.before(
      "UPDATE",
      "TransactionSplits.drafts",
      this.wrapHandler(
        this._handleApplySplitShareEdit,
        "before-UPDATE",
        "TransactionSplits.drafts",
        "transaction.split.failed",
      ),
    );
  }

  /** Registers the categorization actions. */
  private _registerCategorizationHandlers(): void {
    this.srv.on(
      "bulkCategorize",
      this.wrapHandler(
        this._handleBulkCategorize,
        "action-bulkCategorize",
        "Transactions",
        "transaction.bulkCategorize.failed",
      ),
    );
    this.srv.on(
      "correctCategorization",
      this.wrapHandler(
        this._handleCorrectCategorization,
        "action-correctCategorization",
        "Transactions",
        "transaction.correct.failed",
      ),
    );
    this.srv.on(
      "reCategorize",
      this.wrapHandler(
        this._handleReCategorize,
        "action-reCategorize",
        "Transactions",
        "transaction.recategorize.failed",
      ),
    );
  }

  /** Registers the object-page draft hooks: vendor fill, match explanation, save learning. */
  private _registerDraftHandlers(): void {
    this.srv.before(
      "UPDATE",
      "Transactions.drafts",
      this.wrapHandler(
        this._handleApplyVendorCategories,
        "before-UPDATE",
        "Transactions.drafts",
        "transaction.vendorFill.failed",
      ),
    );
    this.srv.after(
      "READ",
      "Transactions.drafts",
      this.wrapHandler(
        this._handleApplyMatchSuggestion,
        "after-READ",
        "Transactions.drafts",
        "transaction.suggestion.failed",
      ),
    );
    this.srv.after(
      "READ",
      "Transactions",
      this.wrapHandler(
        this._handleApplyMatchSuggestion,
        "after-READ",
        "Transactions",
        "transaction.suggestion.failed",
      ),
    );
    this.srv.before(
      "SAVE",
      "Transactions",
      this.wrapHandler(
        this._handleLearnFromInlineEdit,
        "before-SAVE",
        "Transactions",
        "transaction.correct.failed",
      ),
    );
  }

  /**
   * Splits the selected transaction into the user's share.
   * @param req Request carrying the transaction id and share input.
   * @returns The stored split values, or undefined on validation failure.
   */
  private _handleSplitTransaction = (
    req: cds.Request,
  ): Promise<SplitResult | undefined> => this.service.splitTransaction(req);

  /**
   * Suggests the vendor's recurring split terms for the Split dialog.
   * @param req Request carrying the transaction id.
   * @returns The suggestion, null when none applies, or undefined when not found.
   */
  private _handleSuggestRecurringSplit = (
    req: cds.Request,
  ): Promise<SplitSuggestion | null | undefined> =>
    this.service.findRecurringSplitSuggestion(req);

  /**
   * Applies one vendor + taxonomy across the selected transactions.
   * @param req Request carrying the transaction ids and assignments.
   * @returns The updated count, or undefined on validation failure.
   */
  private _handleBulkCategorize = (
    req: cds.Request,
  ): Promise<BulkCategorizeResult | undefined> =>
    this.service.applyCategories(req);

  /**
   * Applies a single categorization correction and learns from it.
   * @param req Request carrying the transaction id and assignments.
   * @returns Resolves once the correction completes.
   */
  private _handleCorrectCategorization = (
    req: cds.Request,
  ): Promise<void> => this.service.correctCategorization(req);

  /**
   * Re-runs categorization across the selected transactions.
   * @param req Request carrying the selected transaction ids.
   * @returns The re-categorized and skipped counts, or undefined on validation failure.
   */
  private _handleReCategorize = (
    req: cds.Request,
  ): Promise<ReCategorizeResult | undefined> => this.service.runReCategorization(req);

  /**
   * Fills a draft's empty PT/EC from the vendor just picked.
   * @param req The draft PATCH request.
   * @returns Resolves once any field is filled.
   */
  private _handleApplyVendorCategories = (req: cds.Request): Promise<void> =>
    this.service.applyVendorCategories(req);

  /**
   * Recomputes or refuses an object-page edit of a split's share.
   * @param req The draft split PATCH request.
   * @returns Resolves once the patch is completed or refused.
   */
  private _handleApplySplitShareEdit = (req: cds.Request): Promise<void> =>
    this.service.applySplitShareEdit(req);

  /**
   * Fills the object page's matched pattern and confidence.
   * @param result The READ result.
   * @param req The READ request.
   * @returns Resolves once the rows are filled.
   */
  private _handleApplyMatchSuggestion = (
    result: unknown,
    req: cds.Request,
  ): Promise<void> => this.service.applyMatchSuggestion(result, req);

  /**
   * Learns a MerchantPattern when a draft save changes a transaction's vendor.
   * @param req The SAVE request carrying the activated row.
   * @returns Resolves once any pattern is learned.
   */
  private _handleLearnFromInlineEdit = (req: cds.Request): Promise<void> =>
    this.service.applyInlineEditLearning(req);
}
