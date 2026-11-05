import JSONModel from "sap/ui/model/json/JSONModel";
import type Dialog from "sap/m/Dialog";
import type ManagedObject from "sap/ui/base/ManagedObject";
import type UI5Event from "sap/ui/base/Event";
import type { DialogHost } from "com/lifeos/shared/types";

/**
 * DialogManager — the Life OS lazy-fragment dialog helper, for a freestyle
 * Controller or a Fiori Elements ExtensionAPI (see DialogHost). Fragments load
 * once and are cached, so callers never touch Fragment, view scoping or the tree.
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
  public async open(
    fragmentName: string,
    controller?: object,
  ): Promise<Dialog> {
    const dialog = await this._loadOnce(fragmentName, controller);
    dialog.open();
    return dialog;
  }

  /**
   * Opens the named fragment dialog with a named JSON model set to fresh data,
   * so a reopened dialog never shows the last run's entries.
   * @param fragmentName fully-qualified fragment module name
   * @param modelName the JSON model the dialog's inputs bind to
   * @param data the data the dialog opens with
   * @param controller event-handler home for the fragment (defaults to the host)
   * @returns the opened dialog
   */
  public async openWithModel(
    fragmentName: string,
    modelName: string,
    data: object,
    controller?: object,
  ): Promise<Dialog> {
    const dialog = await this._loadOnce(fragmentName, controller);
    let model = dialog.getModel(modelName) as JSONModel | undefined;
    if (!model) {
      model = new JSONModel();
      dialog.setModel(model, modelName);
    }
    model.setData(data);
    dialog.open();
    return dialog;
  }

  /**
   * Reads a named JSON model off the dialog enclosing an event's source control,
   * so a fragment handler reaches its dialog's data without a byId.
   * @param event an event fired by a control inside the dialog
   * @param modelName the dialog's JSON model name
   * @returns the dialog's JSON model
   */
  public readModel(event: UI5Event, modelName: string): JSONModel {
    let control = event.getSource() as ManagedObject;
    while (!control.isA<Dialog>("sap.m.Dialog")) {
      control = control.getParent() as ManagedObject;
    }
    return control.getModel(modelName) as JSONModel;
  }

  /**
   * Returns the cached load-promise for a fragment, creating it on first use.
   * @param fragmentName fully-qualified fragment module name
   * @param controller event-handler home for the fragment, if not the host
   * @returns the (cached) dialog load-promise
   */
  private _loadOnce(
    fragmentName: string,
    controller?: object,
  ): Promise<Dialog> {
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
  private async _loadFragment(
    fragmentName: string,
    controller?: object,
  ): Promise<Dialog> {
    const base = controller
      ? { name: fragmentName, controller: this._buildHandlerMap(controller) }
      : { name: fragmentName };
    const settings = this._host.getView
      ? base
      : { id: this._deriveNamespace(fragmentName), ...base };
    const dialog = (await this._host.loadFragment(settings)) as Dialog;
    this._opened.set(dialog.getId(), dialog);
    return dialog;
  }

  /**
   * FE's ExtensionAPI.loadFragment copies the controller with for…in, which
   * skips a class's prototype methods, so a class-instance controller wires no
   * handlers. Flattening them into own properties, bound to it, survives the copy.
   * @param controller the fragment's event-handler home
   * @returns a plain object holding every method of the controller, bound to it
   */
  private _buildHandlerMap(controller: object): Record<string, unknown> {
    const handlers: Record<string, unknown> = {};
    const source = controller as Record<string, unknown>;
    let level: object | null = controller;
    while (level && level !== Object.prototype) {
      for (const name of Object.getOwnPropertyNames(level)) {
        const member = source[name];
        if (
          name !== "constructor" &&
          !(name in handlers) &&
          typeof member === "function"
        ) {
          handlers[name] = (...args: unknown[]) =>
            (source[name] as (...params: unknown[]) => unknown)(...args);
        }
      }
      level = Object.getPrototypeOf(level) as object | null;
    }
    return handlers;
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
