import BasePageController from "com/financialplanner/shared/BasePageController";
import ConnectionService from "com/financialplanner/connectionmanager/model/ConnectionService";
import DialogManager from "com/financialplanner/shared/DialogManager";
import Messaging from "com/financialplanner/shared/Messaging";
import JSONModel from "sap/ui/model/json/JSONModel";
import type { Table$SelectionChangeEvent } from "sap/fe/macros/table/Table";
import type View from "sap/ui/core/mvc/View";
import type Context from "sap/ui/model/odata/v4/Context";
import type ODataModel from "sap/ui/model/odata/v4/ODataModel";
import {
  ADD_CONNECTION_DIALOG,
  SIMPLEFIN_URL,
} from "com/financialplanner/connectionmanager/model/constants";

/**
 * SimpleFIN Connection Manager controller.
 * Drives connection health display, manual sync, account→card mapping, and
 * the Add-Connection (claim setup token) flow.
 *
 * @namespace com.financialplanner.connectionmanager.controller
 */
export default class ConnectionManager extends BasePageController {
  private _selectedConnection: Context | null = null;
  private _service!: ConnectionService;
  private readonly _dialogs = new DialogManager(this);
  private readonly _messages = new Messaging(this);

  /**
   * Initialises the FPM page, the UI state model, and the data-access service.
   */
  public onInit(): void {
    super.onInit();
    const view = this.getView() as View;
    const uiModel = new JSONModel({
      hasSelection: false,
      setupToken: "",
      displayName: "",
    });
    view.setModel(uiModel, "ui");
    this._service = new ConnectionService(view.getModel() as ODataModel);
  }

  /**
   * Opens the Add-Connection dialog with cleared inputs.
   */
  public onActionAddConnectionPress(): void {
    const uiModel = (this.getView() as View).getModel("ui") as JSONModel;
    uiModel.setProperty("/setupToken", "");
    uiModel.setProperty("/displayName", "");
    void this._dialogs.open(ADD_CONNECTION_DIALOG.FRAGMENT);
  }

  /**
   * Opens the SimpleFIN dashboard for re-authentication in a new tab.
   */
  public onActionReauthenticatePress(): void {
    window.open(SIMPLEFIN_URL.DASHBOARD, "_blank");
  }

  /**
   * Triggers an immediate sync for the selected connection.
   */
  public onActionSyncNowPress(): void {
    const context = this._selectedConnection;
    if (!context) {
      return;
    }
    this._messages.showToast("msgSyncStarted");
    void this._service
      .syncNow(context)
      .then(() => this._messages.showToast("msgSyncDone"))
      .catch(() => this._messages.showToast("msgSyncFailed"));
  }

  /**
   * Closes the Add-Connection dialog without saving.
   */
  public onButtonCancelAddConnectionPress(): void {
    this._dialogs.close(ADD_CONNECTION_DIALOG.ID);
  }

  /**
   * Claims the pasted setup token and creates a connection.
   */
  public onButtonClaimTokenPress(): void {
    const uiModel = (this.getView() as View).getModel("ui") as JSONModel;
    const token = ((uiModel.getProperty("/setupToken") as string) || "").trim();
    const name = ((uiModel.getProperty("/displayName") as string) || "").trim();
    if (!token || !name) {
      this._messages.showToast("msgFillFields");
      return;
    }
    void this._service
      .claimSetupToken(token, name)
      .then(() => {
        this._messages.showToast("msgConnectionAdded");
        this._dialogs.close(ADD_CONNECTION_DIALOG.ID);
      })
      .catch(() => this._messages.showToast("msgClaimFailed"));
  }

  /**
   * Opens the SimpleFIN setup page in a new browser tab.
   */
  public onButtonOpenSetupPagePress(): void {
    window.open(SIMPLEFIN_URL.SETUP, "_blank");
  }

  /**
   * Notes that a card mapping changed (auto-saved; backfill server-side).
   */
  public onCardInstancesComboBoxMappingChange(): void {
    this._messages.showToast("msgMappingUpdated");
  }

  /**
   * Notes that an active toggle was changed (auto-saved via $auto).
   */
  public onSwitchActiveChange(): void {
    this._messages.showToast("msgActiveToggled");
  }

  /**
   * Binds the accounts table to the selected connection and remembers the
   * selection for the Sync Now action.
   * @param event selection-change event from the connections table
   */
  public onTableConnectionSelectionChange(
    event: Table$SelectionChangeEvent,
  ): void {
    const { selectedContexts = [] } = event.getParameters() as {
      selectedContexts?: Context[];
    };
    const context = selectedContexts.length ? selectedContexts[0] : null;
    this._selectedConnection = context;
    const view = this.getView() as View;
    view.setBindingContext(context as Context);
    (view.getModel("ui") as JSONModel).setProperty(
      "/hasSelection",
      Boolean(context),
    );
  }
}
