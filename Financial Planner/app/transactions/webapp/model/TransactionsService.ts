import type Context from "sap/ui/model/odata/v4/Context";
import type ODataContextBinding from "sap/ui/model/odata/v4/ODataContextBinding";
import type { ODataContextBinding$PatchCompletedEvent } from "sap/ui/model/odata/v4/ODataContextBinding";
import type ODataModel from "sap/ui/model/odata/v4/ODataModel";
import {
  EXISTING_SPLIT,
  ODATA_OPERATION,
  REFUSED_EDIT,
  SPLIT_SHARE,
} from "com/financialplanner/transactions/constants";
import type {
  SplitSuggestion,
  SplitSuggestionPayload,
} from "com/financialplanner/transactions/model/types";

/**
 * Owns every OData V4 action call for the Transactions app.
 */
export default class TransactionsService {
  private static readonly _watchedBindings = new WeakSet<object>();

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
    const operation = this._model.bindContext(ODATA_OPERATION.BULK_CATEGORIZE);
    operation.setParameter("transactionIds", transactionIds);
    operation.setParameter("vendor_ID", vendorId);
    operation.setParameter("purchaseType_ID", purchaseTypeId);
    operation.setParameter("earningCategory_ID", earningCategoryId);
    await operation.invoke();
    this._model.refresh();
  }

  /**
   * Reads the row's own saved split, so a re-split opens on its terms.
   * @param transactionId the transaction the Split dialog opens for
   * @returns the split with numeric shares, or null when the row has none
   */
  public async findExistingSplit(transactionId: string): Promise<SplitSuggestion | null> {
    const binding = this._model.bindContext(
      `${EXISTING_SPLIT.ENTITY_SET}(ID=${transactionId},IsActiveEntity=true)/${EXISTING_SPLIT.NAVIGATION}`,
    );
    const payload = (await binding.requestObject()) as SplitSuggestionPayload | null | undefined;
    return payload ? this._toSplitTerms(payload) : null;
  }

  /**
   * Looks up the recurring split template of the row's vendor, as a suggestion
   * only — nothing is saved.
   * @param transactionId the transaction the Split dialog opens for
   * @returns the template with numeric shares, or null when the vendor has none
   */
  public async findRecurringSplitSuggestion(
    transactionId: string,
  ): Promise<SplitSuggestion | null> {
    const operation = this._model.bindContext(ODATA_OPERATION.SUGGEST_RECURRING_SPLIT);
    operation.setParameter("transactionId", transactionId);
    await operation.invoke();
    const payload = operation.getBoundContext().getObject() as
      | SplitSuggestionPayload
      | null
      | undefined;
    return payload ? this._toSplitTerms(payload) : null;
  }

  /**
   * Re-reads a split's dollar share after an object-page percentage edit, which
   * the backend recomputes; the custom field is not an FE field, so no
   * annotated side effect fires for it.
   * @param context the split row the edit was made on
   * @returns resolves once the share is re-read
   */
  public refreshSplitShare(context: Context): Promise<void> {
    return context.requestSideEffects([{ $PropertyPath: SPLIT_SHARE.AMOUNT_PATH }]);
  }

  /**
   * A refused object-page PATCH stays pending and is re-sent with the next edit,
   * so every later edit is refused too. Listens once per page binding and, on a
   * refusal, drops the pending change and re-reads the split shares. FE skips its
   * side effects on the first edit after a refusal, so that edit re-reads them too.
   * @param context the object page's bound context
   */
  public attachRefusedEditRecovery(context: Context): void {
    const binding = context.getBinding() as ODataContextBinding;
    if (TransactionsService._watchedBindings.has(binding)) {
      return;
    }
    TransactionsService._watchedBindings.add(binding);
    const state = { refused: false };
    binding.attachPatchCompleted((event: ODataContextBinding$PatchCompletedEvent) => {
      if (!event.getParameter("success")) {
        state.refused = true;
        return this._resetRefusedEdit(binding, context);
      }
      if (state.refused) {
        state.refused = false;
        return this._refreshSplitShares(context);
      }
      return undefined;
    });
  }

  /**
   * Re-runs categorization over the selected transactions.
   * @param transactionIds the selected transaction ids
   * @returns resolves once the re-run completes and the model is refreshed
   */
  public async runReCategorization(transactionIds: string[]): Promise<void> {
    const operation = this._model.bindContext(ODATA_OPERATION.RECATEGORIZE);
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
    const operation = this._model.bindContext(ODATA_OPERATION.SPLIT);
    operation.setParameter("transactionId", transactionId);
    operation.setParameter("mySharePct", mySharePct);
    operation.setParameter("myShareAmount", myShareAmount);
    operation.setParameter("splitDescription", splitDescription);
    operation.setParameter("isRecurring", isRecurring);
    await operation.invoke();
    this._model.refresh();
  }

  /**
   * Drops a refused edit's pending change, then re-reads what the draft holds.
   * @param binding the page binding the refused PATCH belongs to
   * @param context the object page's bound context
   * @returns resolves once the split shares are re-read
   */
  private async _resetRefusedEdit(binding: ODataContextBinding, context: Context): Promise<void> {
    // patchCompleted fires while the refused batch is still settling; a reset made
    // then is lost, so the retried PATCH fails again and loops. Wait it out.
    await new Promise<void>(resolve => {
      setTimeout(resolve, 0);
    });
    await binding.resetChanges();
    await this._refreshSplitShares(context);
  }

  /**
   * Re-reads both split shares, whichever one the backend changed.
   * @param context the object page's bound context
   * @returns resolves once the shares are re-read
   */
  private _refreshSplitShares(context: Context): Promise<void> {
    return context.requestSideEffects([...REFUSED_EDIT.REFRESH]);
  }

  /**
   * Turns split terms read off the wire (Decimals as strings) into numbers.
   * @param payload the split terms as read
   * @returns the terms with numeric shares; a null percentage stays null
   */
  private _toSplitTerms(payload: SplitSuggestionPayload): SplitSuggestion {
    return {
      mySharePct: payload.mySharePct === null ? null : Number(payload.mySharePct),
      myShareAmount: Number(payload.myShareAmount),
      splitDescription: payload.splitDescription,
      isRecurring: payload.isRecurring,
    };
  }
}
