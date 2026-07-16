import type Controller from "sap/ui/core/mvc/Controller";
import type Dialog from "sap/m/Dialog";

/**
 * DialogManager — shared lazy-fragment dialog helper for all controller types.
 * A plain (non-UI5) class so it works regardless of the owner's base class
 * (Controller, sap.fe PageController, ControllerExtension). Fragments are
 * loaded once and cached; open/close address them by fragment name / control id.
 */
export default class DialogManager {
  private readonly _controller: Controller;
  private readonly _dialogs = new Map<string, Promise<Dialog>>();

  /**
   * @param controller the owning controller (provides the view for loadFragment)
   */
  public constructor(controller: Controller) {
    this._controller = controller;
  }

  /**
   * Closes an open dialog by its control id, if present.
   * @param dialogId the fragment's dialog control id
   */
  public close(dialogId: string): void {
    const dialog = this._controller.byId(dialogId) as Dialog | undefined;
    if (dialog) {
      dialog.close();
    }
  }

  /**
   * Lazily loads (once) and opens the named fragment dialog.
   * @param fragmentName fully-qualified fragment module name
   * @returns the opened dialog
   */
  public async open(fragmentName: string): Promise<Dialog> {
    const dialog = await this._loadFragment(fragmentName);
    dialog.open();
    return dialog;
  }

  /**
   * Returns the cached load-promise for a fragment, creating it on first use.
   * @param fragmentName fully-qualified fragment module name
   * @returns the (cached) dialog load-promise
   */
  private _loadFragment(fragmentName: string): Promise<Dialog> {
    let promise = this._dialogs.get(fragmentName);
    if (!promise) {
      promise = this._controller.loadFragment({
        name: fragmentName,
      }) as Promise<Dialog>;
      this._dialogs.set(fragmentName, promise);
    }
    return promise;
  }
}
