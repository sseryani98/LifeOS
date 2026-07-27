// Shared type contracts for the app/shared UI5 library.

import type UI5Element from "sap/ui/core/Element";

/** The minimal surface i18n resolution needs: anything carrying the "i18n" model. */
export interface I18nModelSource {
  getModel(name?: string): unknown;
}

/** The host Messaging binds to: a controller or view provider exposing getView. */
export interface MessagingHost {
  getView(): I18nModelSource | null | undefined;
}

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
