import type ODataModel from "sap/ui/model/odata/v4/ODataModel";

const RECATEGORIZE_OPERATION = "/TransactionService.reCategorize(...)";
const SPLIT_OPERATION = "/TransactionService.splitTransaction(...)";
const BULK_CATEGORIZE_OPERATION = "/TransactionService.bulkCategorize(...)";

/**
 * Owns every OData V4 action call for the Transactions app.
 */
export default class TransactionsService {
  private readonly _model: ODataModel;

  /**
   * @param model the app's default TransactionService OData V4 model
   */
  public constructor(model: ODataModel) {
    this._model = model;
  }

  /**
   * Applies one vendor + taxonomy across the selected transactions.
   * @param transactionIds the selected transaction ids
   * @param vendorId the vendor to assign
   * @param purchaseTypeId the purchase type to assign, or null
   * @param earningCategoryId the earning category to assign, or null
   * @returns resolves once the selection is categorized and the model refreshed
   */
  public async applyBulkCategories(
    transactionIds: string[],
    vendorId: string,
    purchaseTypeId: string | null,
    earningCategoryId: string | null,
  ): Promise<void> {
    const operation = this._model.bindContext(BULK_CATEGORIZE_OPERATION);
    operation.setParameter("transactionIds", transactionIds);
    operation.setParameter("vendor_ID", vendorId);
    operation.setParameter("purchaseType_ID", purchaseTypeId);
    operation.setParameter("earningCategory_ID", earningCategoryId);
    await operation.invoke();
    this._model.refresh();
  }

  /**
   * Re-runs categorization over the selected transactions.
   * @param transactionIds the selected transaction ids
   * @returns resolves once the re-run completes and the model is refreshed
   */
  public async runReCategorization(transactionIds: string[]): Promise<void> {
    const operation = this._model.bindContext(RECATEGORIZE_OPERATION);
    operation.setParameter("transactionIds", transactionIds);
    await operation.invoke();
    this._model.refresh();
  }

  /**
   * Splits a transaction into the user's share. Exactly one of
   * percentage or dollar amount is supplied; the backend computes the other.
   * @param transactionId the transaction to split
   * @param mySharePct the share as a fraction 0–1, or null
   * @param myShareAmount the share in dollars, or null
   * @param splitDescription an optional label for the split
   * @param isRecurring whether these terms seed future recurring suggestions
   * @returns resolves once the split is saved and the model refreshed
   */
  public async splitTransaction(
    transactionId: string,
    mySharePct: number | null,
    myShareAmount: number | null,
    splitDescription: string | null,
    isRecurring: boolean,
  ): Promise<void> {
    const operation = this._model.bindContext(SPLIT_OPERATION);
    operation.setParameter("transactionId", transactionId);
    operation.setParameter("mySharePct", mySharePct);
    operation.setParameter("myShareAmount", myShareAmount);
    operation.setParameter("splitDescription", splitDescription);
    operation.setParameter("isRecurring", isRecurring);
    await operation.invoke();
    this._model.refresh();
  }
}
