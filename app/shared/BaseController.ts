import Controller from "sap/ui/core/mvc/Controller";
import History from "sap/ui/core/routing/History";
import { getText as resolveText } from "com/financialplanner/shared/util/i18n";
import type View from "sap/ui/core/mvc/View";
import type UIComponent from "sap/ui/core/UIComponent";
import type Router from "sap/ui/core/routing/Router";
import type Model from "sap/ui/model/Model";

/**
 * BaseController — shared base for all freestyle app controllers.
 * Provides common helpers for routing, model access, and navigation.
 *
 * @namespace com.financialplanner.shared
 */
export default class BaseController extends Controller {
  /**
   * Returns the router for the owning component.
   * @returns the router instance
   */
  public getRouter(): Router {
    return (this.getOwnerComponent() as UIComponent).getRouter();
  }

  /**
   * Returns a model by name from the view.
   * @param name the model name (omit for the default model)
   * @returns the model instance
   */
  public getModel(name?: string): Model {
    return (this.getView() as View).getModel(name) as Model;
  }

  /**
   * Sets a model on the view.
   * @param model the model instance
   * @param name the model name (omit for the default model)
   * @returns this controller, for chaining
   */
  public setModel(model: Model, name?: string): this {
    (this.getView() as View).setModel(model, name);
    return this;
  }

  /**
   * Resolves an i18n text by key from the view's "i18n" model.
   * @param key the i18n message key
   * @returns the resolved text, or "" when the key is missing
   */
  public getText(key: string): string {
    return resolveText(this.getView() as View, key);
  }

  /**
   * Navigates back in history, or to a fallback route when no history exists.
   * @param fallbackRoute route name to navigate to when there is no history
   */
  public navigateBack(fallbackRoute?: string): void {
    const previousHash = History.getInstance().getPreviousHash();

    if (previousHash !== undefined) {
      window.history.go(-1);
    } else if (fallbackRoute) {
      this.getRouter().navTo(fallbackRoute, {}, true);
    }
  }
}
