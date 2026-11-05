import PageController from "sap/fe/core/PageController";
import I18n from "com/lifeos/shared/I18n";
import Navigation from "com/financialplanner/shared/util/Navigation";
import type View from "sap/ui/core/mvc/View";
import type UIComponent from "sap/ui/core/UIComponent";
import type Router from "sap/ui/core/routing/Router";

/**
 * BasePageController — shared base for Flexible Programming Model page
 * controllers. Mirrors BaseController's routing and i18n helpers for
 * controllers that must extend the Fiori Elements PageController rather than
 * the freestyle sap/ui/core/mvc/Controller. Model helpers come from
 * PageController itself.
 *
 * @namespace com.financialplanner.shared
 */
export default class BasePageController extends PageController {
  /**
   * Returns the router for the owning component.
   * @returns the router instance
   */
  public getRouter(): Router {
    return (this.getOwnerComponent() as UIComponent).getRouter();
  }

  /**
   * Resolves an i18n text by key from the view's "i18n" model.
   * @param key the i18n message key
   * @returns the resolved text, or "" when the key is missing
   */
  public getText(key: string): string {
    return I18n.getText(this.getView() as View, key);
  }

  /**
   * Navigates back in history, or to a fallback route when no history exists.
   * @param fallbackRoute route name to navigate to when there is no history
   */
  public navigateBack(fallbackRoute?: string): void {
    Navigation.navigateBack(this.getRouter(), fallbackRoute);
  }
}
