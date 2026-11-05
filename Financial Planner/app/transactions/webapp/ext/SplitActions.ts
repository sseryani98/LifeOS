import DialogManager from "com/lifeos/shared/DialogManager";
import Messaging from "com/lifeos/shared/Messaging";
import I18n from "com/lifeos/shared/I18n";
import formatter from "com/financialplanner/shared/util/formatter";
import TransactionsService from "com/financialplanner/transactions/model/TransactionsService";
import DialogFieldState from "com/financialplanner/transactions/ext/DialogFieldState";
import SplitTerms from "com/financialplanner/transactions/ext/SplitTerms";
import {
  DIALOG,
  DIALOG_FIELD,
  MESSAGE_KEY,
  SPLIT_AMOUNT,
} from "com/financialplanner/transactions/constants";
import type ExtensionAPI from "sap/fe/templates/ListReport/ExtensionAPI";
import type JSONModel from "sap/ui/model/json/JSONModel";
import type ODataModel from "sap/ui/model/odata/v4/ODataModel";
import type UI5Event from "sap/ui/base/Event";
import type {
  SplitDialogData,
  SplitSuggestion,
} from "com/financialplanner/transactions/model/types";

/**
 * Logic behind the Transactions ListReport's Split action, and the Split
 * fragment's controller. One instance per page: the cached fragment's handlers
 * stay bound to the instance that loaded it, which holds the row being split.
 */
export default class SplitActions {
  private static readonly _pages = new WeakMap<ExtensionAPI, SplitActions>();

  private readonly _api: ExtensionAPI;
  private readonly _dialogs: DialogManager;
  private readonly _messages: Messaging;
  private readonly _service: TransactionsService;
  private _targetId: string | null = null;
  private _rowAmount: number | null = null;
  private _derivedAmount: number | null = null;

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
   * Returns the page's instance, creating it on the page's first split.
   * @param api the page ExtensionAPI
   * @returns the page's split actions
   */
  public static resolveForPage(api: ExtensionAPI): SplitActions {
    let actions = SplitActions._pages.get(api);
    if (!actions) {
      actions = new SplitActions(api);
      SplitActions._pages.set(api, actions);
    }
    return actions;
  }

  /**
   * Opens the Split dialog for a single selected transaction, pre-populated with
   * the row's own split on a re-split, else the vendor's recurring split when it
   * has one. Opening never saves.
   * @returns resolves once the dialog is open
   */
  public async openSplitDialog(): Promise<void> {
    const selected = this._api.getSelectedContexts();
    if (selected.length !== 1) {
      this._messages.showWarning(MESSAGE_KEY.SPLIT_ONE_ROW);
      return;
    }
    const targetId = selected[0].getProperty("ID") as string;
    this._targetId = targetId;
    const amount = selected[0].getProperty(SPLIT_AMOUNT.ROW_PATH) as
      string | number | null | undefined;
    this._rowAmount = formatter.toNumber(amount?.toString());
    const seedTerms =
      (await this._findExistingSplit(targetId)) ??
      (await this._findSplitSuggestion(targetId));
    this._derivedAmount =
      seedTerms && seedTerms.mySharePct !== null
        ? seedTerms.myShareAmount
        : null;
    await this._dialogs.openWithModel(
      DIALOG.SPLIT_FRAGMENT,
      DIALOG.SPLIT_MODEL,
      SplitTerms.buildSeed(seedTerms),
      this,
    );
  }

  /**
   * An edited amount makes the split dollar-based, as on the object page, so the
   * percentage is cleared on screen rather than dropped unseen at save.
   * @param event the amount Input's change event
   */
  public onInputSplitAmountChange(event: UI5Event): void {
    const model = this._dialogs.readModel(event, DIALOG.SPLIT_MODEL);
    this._derivedAmount = null;
    model.setProperty("/mySharePct", null);
    this._clearShareFlags(model);
  }

  /**
   * An edited percentage shows the amount it yields on this row, as the
   * object page does; with no row amount to compute from, the stale amount is cleared.
   * One outside 0–100 is flagged on its field and yields no amount.
   * @param event the percentage Input's change event
   */
  public onInputSplitPercentChange(event: UI5Event): void {
    const model = this._dialogs.readModel(event, DIALOG.SPLIT_MODEL);
    const entered = model.getProperty("/mySharePct") as
      string | number | null | undefined;
    const percentage = formatter.toNumber(entered?.toString());
    DialogFieldState.clear(model, DIALOG_FIELD.SPLIT_PERCENT);
    this._derivedAmount = null;
    if (percentage === null) {
      return;
    }
    if (SplitTerms.isPercentOutOfRange(percentage)) {
      DialogFieldState.showError(
        model,
        DIALOG_FIELD.SPLIT_PERCENT,
        I18n.getText(this._api, MESSAGE_KEY.SPLIT_PERCENT_RANGE),
      );
      return;
    }
    this._derivedAmount = SplitTerms.deriveAmount(this._rowAmount, percentage);
    model.setProperty("/myShareAmount", this._derivedAmount);
  }

  /**
   * Confirms the Split dialog: sends one share form to the backend, which
   * computes the other, then closes the dialog. A refusal, the dialog's own or
   * the backend's, keeps the dialog open with the user's terms, flags the field
   * it names and warns with its reason.
   * @param event the button press event
   * @returns resolves once the split is saved and the dialog closed, or the refusal shown
   */
  public async onButtonSplitConfirmPress(event: UI5Event): Promise<void> {
    if (!this._targetId) {
      return;
    }
    const model = this._dialogs.readModel(event, DIALOG.SPLIT_MODEL);
    const data = model.getData() as SplitDialogData;
    this._clearShareFlags(model);
    const enteredAmount = formatter.toNumber(data.myShareAmount?.toString());
    const enteredPct = formatter.toNumber(data.mySharePct?.toString());
    const inputRefusal = SplitTerms.findInputRefusal(enteredPct, enteredAmount);
    if (inputRefusal) {
      this._rejectConfirm(
        model,
        inputRefusal.field,
        I18n.getText(this._api, inputRefusal.key),
      );
      return;
    }
    const shares = SplitTerms.resolveShares(
      enteredPct,
      enteredAmount,
      this._derivedAmount,
    );
    try {
      await this._service.splitTransaction(
        this._targetId,
        shares.mySharePct,
        shares.myShareAmount,
        data.splitDescription || null,
        data.isRecurring,
      );
    } catch (error) {
      this._rejectConfirm(
        model,
        SplitTerms.readRefusedField(error),
        (error as Error).message,
      );
      return;
    }
    this._dialogs.close(DIALOG.SPLIT_DIALOG_ID);
    this._messages.showToast(MESSAGE_KEY.SPLIT_SAVED);
  }

  /** Closes the Split dialog without saving. */
  public onButtonSplitCancelPress(): void {
    this._dialogs.close(DIALOG.SPLIT_DIALOG_ID);
  }

  /**
   * Resets both share inputs' flags.
   * @param model the Split dialog's JSON model
   */
  private _clearShareFlags(model: JSONModel): void {
    DialogFieldState.clear(model, DIALOG_FIELD.SPLIT_PERCENT);
    DialogFieldState.clear(model, DIALOG_FIELD.SPLIT_AMOUNT);
  }

  /**
   * Reads the row's own split. A failed read falls back to the suggestion, so a
   * lookup never blocks a manual split.
   * @param transactionId the transaction being split
   * @returns the existing split, or null when there is none or the read failed
   */
  private async _findExistingSplit(
    transactionId: string,
  ): Promise<SplitSuggestion | null> {
    try {
      return await this._service.findExistingSplit(transactionId);
    } catch {
      return null;
    }
  }

  /**
   * Looks up the row's recurring split. A failed lookup opens the dialog blank,
   * so a suggestion never blocks a manual split.
   * @param transactionId the transaction being split
   * @returns the suggestion, or null when there is none or the lookup failed
   */
  private async _findSplitSuggestion(
    transactionId: string,
  ): Promise<SplitSuggestion | null> {
    try {
      return await this._service.findRecurringSplitSuggestion(transactionId);
    } catch {
      return null;
    }
  }

  /**
   * Refuses the Split confirm, keeping the dialog open with the user's terms.
   * @param model the Split dialog's JSON model
   * @param field the field to flag, or null when the reason names none
   * @param reason the refusal's reason text
   */
  private _rejectConfirm(
    model: JSONModel,
    field: string | null,
    reason: string,
  ): void {
    DialogFieldState.rejectConfirm(model, this._messages, {
      key: MESSAGE_KEY.SPLIT_REFUSED,
      field,
      reason,
    });
  }
}
