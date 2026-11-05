// Type contracts for the Life OS shared UI5 library.

import type UI5Element from "sap/ui/core/Element";

/** The minimal surface i18n resolution needs: anything carrying the "i18n" model. */
export interface I18nModelSource {
  getModel(name?: string): unknown;
}

/** A freestyle Controller: it reaches the "i18n" model through its view, which may be gone. */
export interface ViewHost {
  getView(): I18nModelSource | null | undefined;
}

/**
 * The host Messaging binds to: a Controller (through its view) or an FE
 * ExtensionAPI, which carries the "i18n" model itself.
 */
export type MessagingHost = ViewHost | I18nModelSource;

/**
 * A dialog host: a freestyle Controller or a Fiori Elements ExtensionAPI. Both
 * load a fragment as a page-scoped dependent via loadFragment. A Controller
 * scopes the fragment id from its view (getView present, id omitted); an
 * ExtensionAPI has no view, so DialogManager passes an explicit id namespace.
 */
export interface DialogHost {
  loadFragment(settings: {
    id?: string;
    name: string;
    controller?: object;
  }): Promise<UI5Element | UI5Element[]>;
  getView?(): unknown;
}
