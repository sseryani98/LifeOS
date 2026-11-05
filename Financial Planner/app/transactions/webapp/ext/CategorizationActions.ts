import DialogManager from "com/lifeos/shared/DialogManager";
import Messaging from "com/lifeos/shared/Messaging";
import I18n from "com/lifeos/shared/I18n";
import TransactionsService from "com/financialplanner/transactions/model/TransactionsService";
import DialogFieldState from "com/financialplanner/transactions/ext/DialogFieldState";
import {
  DIALOG,
  DIALOG_FIELD,
  MESSAGE_KEY,
} from "com/financialplanner/transactions/constants";
import type ExtensionAPI from "sap/fe/templates/ListReport/ExtensionAPI";
import type ODataModel from "sap/ui/model/odata/v4/ODataModel";
import type UI5Event from "sap/ui/base/Event";

/**
 * Logic behind the Transactions ListReport's Apply Categories and Re-categorize
 * actions, and the Apply Categories fragment's controller. One instance per page:
 * the cached fragment's handlers stay bound to the instance that loaded it.
 */
export default class CategorizationActions {
  private static readonly _pages = new WeakMap<
    ExtensionAPI,
    CategorizationActions
  >();

  private readonly _api: ExtensionAPI;
  private readonly _dialogs: DialogManager;
  private readonly _messages: Messaging;
  private readonly _service: TransactionsService;

  /**
   * @param api the page ExtensionAPI (selection, model, i18n, dialog loading)
   */
  public constructor(api: ExtensionAPI) {
    this._api = api;
    this._dialogs = new DialogManager(api);
    this._messages = new Messaging(api);
    this._service = new TransactionsService(api.getModel() as ODataModel);
  }

  /**
   * Returns the page's instance, creating it on the page's first action.
   * @param api the page ExtensionAPI
   * @returns the page's categorization actions
   */
  public static resolveForPage(api: ExtensionAPI): CategorizationActions {
    let actions = CategorizationActions._pages.get(api);
    if (!actions) {
      actions = new CategorizationActions(api);
      CategorizationActions._pages.set(api, actions);
    }
    return actions;
  }

  /**
   * Opens the Apply Categories dialog for the current selection.
   * @returns resolves once the dialog is open
   */
  public async openApplyDialog(): Promise<void> {
    if (this._api.getSelectedContexts().length === 0) {
      this._messages.showWarning(MESSAGE_KEY.NO_SELECTION);
      return;
    }
    await this._dialogs.openWithModel(
      DIALOG.APPLY_FRAGMENT,
      DIALOG.APPLY_MODEL,
      { vendor_ID: "", purchaseType_ID: "", earningCategory_ID: "" },
      this,
    );
  }

  /**
   * Re-runs categorization over the selected transactions.
   * @returns resolves once the re-run completes
   */
  public async runReCategorization(): Promise<void> {
    const ids = this._readSelectedIds();
    if (ids.length === 0) {
      this._messages.showWarning(MESSAGE_KEY.NO_SELECTION);
      return;
    }
    await this._service.runReCategorization(ids);
    this._messages.showToast(MESSAGE_KEY.RECATEGORIZED);
  }

  /**
   * Confirms the Apply Categories dialog: applies the chosen vendor + taxonomy
   * across the selection, then closes the dialog.
   * @param event the button press event
   * @returns resolves once the selection is categorized and the dialog closed
   */
  public async onButtonApplyConfirmPress(event: UI5Event): Promise<void> {
    const model = this._dialogs.readModel(event, DIALOG.APPLY_MODEL);
    const data = model.getData() as {
      vendor_ID: string;
      purchaseType_ID: string;
      earningCategory_ID: string;
    };
    if (!data.vendor_ID) {
      DialogFieldState.rejectConfirm(model, this._messages, {
        key: MESSAGE_KEY.APPLY_REFUSED,
        field: DIALOG_FIELD.APPLY_VENDOR,
        reason: I18n.getText(this._api, MESSAGE_KEY.VENDOR_REQUIRED),
      });
      return;
    }
    await this._service.applyBulkCategories(
      this._readSelectedIds(),
      data.vendor_ID,
      data.purchaseType_ID || null,
      data.earningCategory_ID || null,
    );
    this._dialogs.close(DIALOG.APPLY_DIALOG_ID);
    this._messages.showToast(MESSAGE_KEY.CATEGORIES_APPLIED);
  }

  /** Closes the Apply Categories dialog without applying. */
  public onButtonApplyCancelPress(): void {
    this._dialogs.close(DIALOG.APPLY_DIALOG_ID);
  }

  /**
   * A picked vendor answers the refusal, so its flag goes.
   * @param event the Vendor ComboBox's selectionChange event
   */
  public onComboBoxVendorSelectionChange(event: UI5Event): void {
    DialogFieldState.clear(
      this._dialogs.readModel(event, DIALOG.APPLY_MODEL),
      DIALOG_FIELD.APPLY_VENDOR,
    );
  }

  /**
   * Reads the ids of the currently selected transaction rows.
   * @returns the selected transaction ids
   */
  private _readSelectedIds(): string[] {
    return this._api
      .getSelectedContexts()
      .map(context => context.getProperty("ID") as string);
  }
}
