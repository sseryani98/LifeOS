import DialogManager from "com/financialplanner/shared/DialogManager";
import JSONModel from "sap/ui/model/json/JSONModel";
import Messaging from "com/financialplanner/shared/Messaging";
import TransactionsService from "com/financialplanner/transactions/model/TransactionsService";
import formatter from "com/financialplanner/shared/util/formatter";
import { DIALOG, MESSAGE_KEY } from "com/financialplanner/transactions/constants";
import { PERCENT } from "com/financialplanner/shared/constants";
import type Dialog from "sap/m/Dialog";
import type ExtensionAPI from "sap/fe/templates/ListReport/ExtensionAPI";
import type ManagedObject from "sap/ui/base/ManagedObject";
import type ODataModel from "sap/ui/model/odata/v4/ODataModel";
import type UI5Event from "sap/ui/base/Event";

/**
 * Logic behind the Transactions ListReport custom actions; the FE handler
 * surface (TransactionsListActions) is a thin SAP object that delegates here.
 * The page ExtensionAPI, bound on each toolbar action, supplies the model, i18n,
 * and dialog loading, so no view lookup is needed. Also the dialog fragments'
 * controller, so their `.onButton…Press` references resolve to this class.
 */
export default class TransactionActions {
  private static _shared: TransactionActions | undefined;

  private _api: ExtensionAPI | undefined;
  private _dialogs: DialogManager | undefined;
  private _splitTargetId: string | null = null;

  /**
   * Returns the process-wide action handler for the transactions ListReport.
   * @returns the shared instance
   */
  public static resolveInstance(): TransactionActions {
    if (!TransactionActions._shared) {
      TransactionActions._shared = new TransactionActions();
    }
    return TransactionActions._shared;
  }

  /**
   * Opens the Apply Categories dialog for the current selection.
   * @param api the page ExtensionAPI (selection, model, i18n, dialog loading)
   * @returns resolves once the dialog is open
   */
  public async openApplyDialog(api: ExtensionAPI): Promise<void> {
    this._bindApi(api);
    if (api.getSelectedContexts().length === 0) {
      this._getMessaging().showWarning(MESSAGE_KEY.NO_SELECTION);
      return;
    }
    await this._openDialog(DIALOG.APPLY_FRAGMENT, DIALOG.APPLY_MODEL, {
      vendor_ID: "",
      purchaseType_ID: "",
      earningCategory_ID: "",
    });
  }

  /**
   * Re-runs categorization over the selected transactions.
   * @param api the page ExtensionAPI (selection, model, i18n)
   * @returns resolves once the re-run completes
   */
  public async runReCategorization(api: ExtensionAPI): Promise<void> {
    this._bindApi(api);
    const ids = this._readSelectedIds(api);
    if (ids.length === 0) {
      this._getMessaging().showWarning(MESSAGE_KEY.NO_SELECTION);
      return;
    }
    await this._getService().runReCategorization(ids);
    this._getMessaging().showToast(MESSAGE_KEY.RECATEGORIZED);
  }

  /**
   * Opens the Split dialog for a single selected transaction.
   * @param api the page ExtensionAPI (selection, model, i18n, dialog loading)
   * @returns resolves once the dialog is open
   */
  public async openSplitDialog(api: ExtensionAPI): Promise<void> {
    this._bindApi(api);
    const ids = this._readSelectedIds(api);
    if (ids.length !== 1) {
      this._getMessaging().showWarning(MESSAGE_KEY.SPLIT_ONE_ROW);
      return;
    }
    this._splitTargetId = ids[0];
    await this._openDialog(DIALOG.SPLIT_FRAGMENT, DIALOG.SPLIT_MODEL, {
      mySharePct: null,
      myShareAmount: null,
      splitDescription: "",
      isRecurring: false,
    });
  }

  /**
   * Confirms the Apply Categories dialog: applies the chosen vendor + taxonomy
   * across the selection, then closes the dialog.
   * @param event the button press event
   * @returns resolves once the selection is categorized and the dialog closed
   */
  public async onButtonApplyConfirmPress(event: UI5Event): Promise<void> {
    const dialog = this._findDialog(event);
    const data = (dialog.getModel(DIALOG.APPLY_MODEL) as JSONModel).getData() as {
      vendor_ID: string;
      purchaseType_ID: string;
      earningCategory_ID: string;
    };
    if (!data.vendor_ID) {
      this._getMessaging().showWarning(MESSAGE_KEY.VENDOR_REQUIRED);
      return;
    }
    await this._getService().applyBulkCategories(
      this._readSelectedIds(this._getApi()),
      data.vendor_ID,
      data.purchaseType_ID || null,
      data.earningCategory_ID || null,
    );
    this._getDialogManager().close(DIALOG.APPLY_DIALOG_ID);
    this._getMessaging().showToast(MESSAGE_KEY.CATEGORIES_APPLIED);
  }

  /** Closes the Apply Categories dialog without applying. */
  public onButtonApplyCancelPress(): void {
    this._getDialogManager().close(DIALOG.APPLY_DIALOG_ID);
  }

  /**
   * Confirms the Split dialog: sends the entered share to the backend, which
   * computes and stores myShareAmount, then closes the dialog. The percentage
   * input is captured as 0–100 and divided to the backend's 0–1 fraction.
   * @param event the button press event
   * @returns resolves once the split is saved and the dialog closed
   */
  public async onButtonSplitConfirmPress(event: UI5Event): Promise<void> {
    if (!this._splitTargetId) {
      return;
    }
    const dialog = this._findDialog(event);
    const data = (dialog.getModel(DIALOG.SPLIT_MODEL) as JSONModel).getData() as {
      mySharePct: string;
      myShareAmount: string;
      splitDescription: string;
      isRecurring: boolean;
    };
    const enteredPct = formatter.toNumber(data.mySharePct);
    await this._getService().splitTransaction(
      this._splitTargetId,
      enteredPct === null ? null : enteredPct / PERCENT.DIVISOR,
      formatter.toNumber(data.myShareAmount),
      data.splitDescription || null,
      data.isRecurring,
    );
    this._getDialogManager().close(DIALOG.SPLIT_DIALOG_ID);
    this._getMessaging().showToast(MESSAGE_KEY.SPLIT_SAVED);
  }

  /** Closes the Split dialog without saving. */
  public onButtonSplitCancelPress(): void {
    this._getDialogManager().close(DIALOG.SPLIT_DIALOG_ID);
  }

  /**
   * Binds the page ExtensionAPI captured from the current action. When it is a
   * new page instance, the cached dialog helper is dropped so dialogs rebind.
   * @param api the page ExtensionAPI
   */
  private _bindApi(api: ExtensionAPI): void {
    if (this._api !== api) {
      this._api = api;
      this._dialogs = undefined;
    }
  }

  /**
   * Returns the bound ExtensionAPI (always set once an action has run).
   * @returns the page ExtensionAPI
   */
  private _getApi(): ExtensionAPI {
    if (!this._api) {
      throw new Error("TransactionActions: no ExtensionAPI bound");
    }
    return this._api;
  }

  /**
   * Walks up from the pressed control to the dialog that contains it.
   * @param event the button press event
   * @returns the enclosing dialog
   */
  private _findDialog(event: UI5Event): Dialog {
    let control = event.getSource() as ManagedObject;
    while (!control.isA<Dialog>("sap.m.Dialog")) {
      control = control.getParent() as ManagedObject;
    }
    return control;
  }

  /**
   * Returns the shared dialog helper, bound to the page ExtensionAPI on first use.
   * @returns the dialog manager
   */
  private _getDialogManager(): DialogManager {
    if (!this._dialogs) {
      this._dialogs = new DialogManager(this._getApi());
    }
    return this._dialogs;
  }

  /**
   * Builds the shared messaging helper, resolving i18n from the ExtensionAPI.
   * @returns the messaging helper
   */
  private _getMessaging(): Messaging {
    const api = this._getApi();
    return new Messaging({ getView: () => api });
  }

  /**
   * Loads a dialog fragment through the shared DialogManager — passing this
   * instance as the fragment controller so its button handlers resolve here —
   * and (re)binds the named JSON model with the initial data.
   * @param fragmentName the dialog fragment module name
   * @param modelName the JSON model name the dialog's inputs bind to
   * @param initialData the initial model data the dialog opens with
   * @returns resolves once the dialog is open
   */
  private async _openDialog(
    fragmentName: string,
    modelName: string,
    initialData: object,
  ): Promise<void> {
    const dialog = await this._getDialogManager().open(fragmentName, this);
    let model = dialog.getModel(modelName) as JSONModel | undefined;
    if (!model) {
      model = new JSONModel();
      dialog.setModel(model, modelName);
    }
    model.setData(initialData);
  }

  /**
   * Reads the ids of the currently selected transaction rows.
   * @param api the page ExtensionAPI
   * @returns the selected transaction ids
   */
  private _readSelectedIds(api: ExtensionAPI): string[] {
    return api.getSelectedContexts().map(context => context.getProperty("ID") as string);
  }

  /**
   * Builds the OData action layer from the page's default model.
   * @returns the transactions model service
   */
  private _getService(): TransactionsService {
    return new TransactionsService(this._getApi().getModel() as ODataModel);
  }
}
