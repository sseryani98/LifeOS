import cds from "@sap/cds";

import { BaseFacade } from "../shared/baseFacade.js";

import type { TransactionService } from "./transactionService.js";
import type {
  BulkCategorizeResult,
  ReCategorizeResult,
  SplitResult,
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
   * Learns a MerchantPattern when a draft save changes a transaction's vendor.
   * @param req The SAVE request carrying the activated row.
   * @returns Resolves once any pattern is learned.
   */
  private _handleLearnFromInlineEdit = (req: cds.Request): Promise<void> =>
    this.service.applyInlineEditLearning(req);
}
