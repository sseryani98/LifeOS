import MessageToast from "sap/m/MessageToast";
import MessageBox from "sap/m/MessageBox";
import { getText as resolveText } from "com/financialplanner/shared/util/i18n";
import type Controller from "sap/ui/core/mvc/Controller";
import type View from "sap/ui/core/mvc/View";

/**
 * Messaging — shared user-messaging helper for all controller types.
 */
export default class Messaging {
  private readonly _controller: Controller;

  /**
   * @param controller the owning controller (provides the view for i18n)
   */
  public constructor(controller: Controller) {
    this._controller = controller;
  }

  /**
   * Shows a transient toast for the given i18n key.
   * @param key the i18n message key
   */
  public showToast(key: string): void {
    MessageToast.show(this._resolveText(key));
  }

  /**
   * Opens a confirmation dialog and resolves to the user's choice.
   * @param key the i18n message key for the confirmation prompt
   * @returns true when the user confirms (OK), false otherwise
   */
  public showConfirm(key: string): Promise<boolean> {
    return new Promise(resolve => {
      MessageBox.confirm(this._resolveText(key), {
        onClose: (action: (typeof MessageBox.Action)[keyof typeof MessageBox.Action]) =>
          resolve(action === MessageBox.Action.OK),
      });
    });
  }

  /**
   * Opens an error dialog for the given i18n key.
   * @param key the i18n message key
   */
  public showError(key: string): void {
    MessageBox.error(this._resolveText(key));
  }

  /**
   * Opens a success dialog for the given i18n key.
   * @param key the i18n message key
   */
  public showSuccess(key: string): void {
    MessageBox.success(this._resolveText(key));
  }

  /**
   * Opens a warning dialog for the given i18n key.
   * @param key the i18n message key
   */
  public showWarning(key: string): void {
    MessageBox.warning(this._resolveText(key));
  }

  /**
   * Resolves an i18n key against the owning view's "i18n" model.
   * @param key the i18n message key
   * @returns the resolved text, or "" when the key is missing
   */
  private _resolveText(key: string): string {
    return resolveText(this._controller.getView() as View, key);
  }
}
