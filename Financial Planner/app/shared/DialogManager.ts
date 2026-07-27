import type Dialog from "sap/m/Dialog";
import type { DialogHost } from "com/financialplanner/shared/types";

/**
 * DialogManager — shared lazy-fragment dialog helper for all host types. Works
 * with a freestyle Controller or a Fiori Elements ExtensionAPI (see DialogHost).
 * Fragments load once and are cached; open/close address them by fragment name
 * and dialog control id, so callers never touch Fragment or view scoping.
 */
export default class DialogManager {
  private readonly _host: DialogHost;
  private readonly _loads = new Map<string, Promise<Dialog>>();
  private readonly _opened = new Map<string, Dialog>();

  /**
   * @param host the dialog host (a Controller or an FE ExtensionAPI)
   */
  public constructor(host: DialogHost) {
    this._host = host;
  }

  /**
   * Closes an open dialog by its control id, if present. Matches the id the
   * caller knows (e.g. `idSplitDialog`) against the framework-prefixed instance
   * id, so hosts that scope ids by a namespace still resolve.
   * @param dialogId the fragment's dialog control id
   */
  public close(dialogId: string): void {
    for (const [instanceId, dialog] of this._opened) {
      if (instanceId === dialogId || instanceId.endsWith(`--${dialogId}`)) {
        dialog.close();
        return;
      }
    }
  }

  /**
   * Lazily loads (once) and opens the named fragment dialog. When the fragment's
   * event handlers live outside the host (e.g. an FE custom-action handler class),
   * pass that object as the controller so its `.method` references resolve there.
   * @param fragmentName fully-qualified fragment module name
   * @param controller event-handler home for the fragment (defaults to the host)
   * @returns the opened dialog
   */
  public async open(fragmentName: string, controller?: object): Promise<Dialog> {
    const dialog = await this._loadOnce(fragmentName, controller);
    dialog.open();
    return dialog;
  }

  /**
   * Returns the cached load-promise for a fragment, creating it on first use.
   * @param fragmentName fully-qualified fragment module name
   * @param controller event-handler home for the fragment, if not the host
   * @returns the (cached) dialog load-promise
   */
  private _loadOnce(fragmentName: string, controller?: object): Promise<Dialog> {
    let load = this._loads.get(fragmentName);
    if (!load) {
      load = this._loadFragment(fragmentName, controller);
      this._loads.set(fragmentName, load);
    }
    return load;
  }

  /**
   * Loads a fragment through the host. A Controller scopes the id from its view;
   * an ExtensionAPI (no view) is given an explicit id namespace. The resolved
   * dialog is tracked by instance id so close() can find it.
   * @param fragmentName fully-qualified fragment module name
   * @param controller event-handler home for the fragment, if not the host
   * @returns the loaded dialog
   */
  private async _loadFragment(fragmentName: string, controller?: object): Promise<Dialog> {
    const base = controller ? { name: fragmentName, controller } : { name: fragmentName };
    const settings = this._host.getView
      ? base
      : { id: this._deriveNamespace(fragmentName), ...base };
    const dialog = (await this._host.loadFragment(settings)) as Dialog;
    this._opened.set(dialog.getId(), dialog);
    return dialog;
  }

  /**
   * Derives a stable id namespace for an ExtensionAPI-hosted fragment, which has
   * no view to scope the id. The fragment's last name segment is unique per app
   * and the fragment is never re-loaded (dialogs are cached), so it cannot clash.
   * @param fragmentName fully-qualified fragment module name
   * @returns the id namespace for the fragment instance
   */
  private _deriveNamespace(fragmentName: string): string {
    return fragmentName.split(".").pop() as string;
  }
}
