import MessageToast from "sap/m/MessageToast";
import MessageBox from "sap/m/MessageBox";
import I18n from "com/lifeos/shared/I18n";
import type { I18nModelSource, MessagingHost } from "com/lifeos/shared/types";

/**
 * Messaging — the Life OS user-messaging helper. Takes its host as-is: a
 * Controller resolves i18n through its view, an FE ExtensionAPI directly.
 */
export default class Messaging {
  private readonly _host: MessagingHost;

  /**
   * @param host the owning Controller or FE ExtensionAPI
   */
  public constructor(host: MessagingHost) {
    this._host = host;
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
        onClose: (action: string | null) =>
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
   * @param args values for the text's placeholders, such as a backend's reason
   */
  public showWarning(key: string, args?: string[]): void {
    MessageBox.warning(this._resolveText(key, args));
  }

  /**
   * Resolves an i18n key against the host's "i18n" model.
   * @param key the i18n message key
   * @param args values for the text's placeholders
   * @returns the resolved text, or "" when the key is missing or the view is gone
   */
  private _resolveText(key: string, args?: string[]): string {
    const source = this._readI18nSource();
    return source ? I18n.getText(source, key, args) : "";
  }

  /**
   * Picks what carries the "i18n" model: a Controller's view, else the host itself.
   * @returns the i18n source, or null when a Controller's view is gone
   */
  private _readI18nSource(): I18nModelSource | null | undefined {
    return "getView" in this._host ? this._host.getView() : this._host;
  }
}
