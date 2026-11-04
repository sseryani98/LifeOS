import BaseController from "com/financialplanner/shared/BaseController";
import I18n from "com/financialplanner/shared/util/i18n";
import NavConfig from "com/financialplanner/shell/controller/NavConfig";
import ComponentContainer, {
  type ComponentContainer$ComponentCreatedEvent,
} from "sap/ui/core/ComponentContainer";
import HashChanger from "sap/ui/core/routing/HashChanger";
import JSONModel from "sap/ui/model/json/JSONModel";
import type Page from "sap/m/Page";
import type { SideNavigation$ItemSelectEvent } from "sap/tnt/SideNavigation";
import type View from "sap/ui/core/mvc/View";
import type UIComponent from "sap/ui/core/UIComponent";

/**
 * Shell controller — handles top-level navigation via the side nav.
 * Loads app components into the content area when nav items are selected.
 * Follows the URL hash, on load and when it changes, so deep links work.
 *
 * @namespace com.financialplanner.shell.controller
 */
export default class App extends BaseController {
  private _componentContainers: Record<string, ComponentContainer> = {};
  private _components: Record<string, UIComponent> = {};
  private _pendingRoute: string | null = null;

  /**
   * Initialises the shell view model and restores navigation from the hash.
   */
  public onInit(): void {
    const shellModel = new JSONModel({
      selectedKey: "",
      pageName: "",
      backVisible: false,
      welcomeVisible: true,
    });
    this.setModel(shellModel, "shellView");
    this._restoreFromHash();
    this._attachHashChangeHandler();
  }

  /**
   * Navigates back one level. From an ObjectPage, returns to the ListReport.
   * From a ListReport, returns to the welcome page.
   */
  public onButtonNavBackPress(): void {
    const shellModel = this._getShellModel();
    const selectedKey = shellModel.getProperty("/selectedKey") as string;
    const config = selectedKey ? NavConfig.getEntry(selectedKey) : null;
    const component = config ? this._components[config.component] : null;

    if (config && component && this._isOnObjectPage()) {
      component.getRouter().navTo(config.route, {}, true);
      return;
    }

    this._showWelcome();
  }

  /**
   * Handles side navigation item selection.
   * @param event the itemSelect event
   */
  public onSideNavigationItemSelect(event: SideNavigation$ItemSelectEvent): void {
    const key = event.getParameter("item")?.getKey();
    if (!key) {
      return;
    }
    this._navigateToKey(key);
  }

  /**
   * Re-runs hash restoration on every hash change — a hash typed or pasted
   * while the shell is open must switch apps too, not only the one at load.
   */
  private _attachHashChangeHandler(): void {
    HashChanger.getInstance().attachEvent("hashChanged", () =>
      this._restoreFromHash(),
    );
  }

  /**
   * Returns the shell's navigation-state JSON model.
   * @returns the "shellView" model
   */
  private _getShellModel(): JSONModel {
    return this.getModel("shellView") as JSONModel;
  }

  /**
   * Checks whether the current URL hash points to an ObjectPage
   * (contains an entity key in parentheses).
   * @returns true when on an ObjectPage
   */
  private _isOnObjectPage(): boolean {
    const hash = window.location.hash;
    return hash.includes("(") && hash.includes(")");
  }

  /**
   * Loads an app component into the shell content area. Caches
   * ComponentContainers by component name and navigates the inner router.
   * @param componentName the UI5 component name
   * @param route the target route within the component
   */
  private _loadAppComponent(componentName: string, route: string): void {
    const page = this.byId("idAppContentPage") as Page;
    page.removeAllContent();

    if (!this._componentContainers[componentName]) {
      this._pendingRoute = route;
      this._componentContainers[componentName] = new ComponentContainer({
        name: componentName,
        async: true,
        height: "100%",
        width: "100%",
        componentCreated: (event: ComponentContainer$ComponentCreatedEvent) => {
          const component = event.getParameter("component") as UIComponent;
          this._components[componentName] = component;
          if (this._pendingRoute) {
            component.getRouter().navTo(this._pendingRoute, {}, true);
            this._pendingRoute = null;
          }
        },
      });
    } else if (this._components[componentName]) {
      this._components[componentName].getRouter().navTo(route, {}, true);
    }

    page.addContent(this._componentContainers[componentName]);
  }

  /**
   * Navigates to a nav key — loads its component, selects the side nav item,
   * and shows the back button.
   * @param key the NavConfig key
   */
  private _navigateToKey(key: string): void {
    const config = NavConfig.getEntry(key);
    if (!config) {
      return;
    }

    this._loadAppComponent(config.component, config.route);
    const shellModel = this._getShellModel();
    shellModel.setProperty("/selectedKey", key);
    // The owner component, not the view: a deep link lands here from onInit,
    // before the view inherits the component's i18n model.
    shellModel.setProperty(
      "/pageName",
      I18n.getText(this.getOwnerComponent() as UIComponent, config.label),
    );
    shellModel.setProperty("/backVisible", true);
    shellModel.setProperty("/welcomeVisible", false);
  }

  /**
   * Restores navigation state from the URL hash, on load and on every hash
   * change. A hash still owned by the open app (its own routing) is a no-op.
   */
  private _restoreFromHash(): void {
    const hash = (window.location.hash || "").replace(/^#\/?/, "");
    if (!hash) {
      return;
    }

    const hashPart = hash.split("(")[0].split("/")[0];
    const navKey = NavConfig.getNavKeyForHash(hashPart);
    const shellModel = this._getShellModel();
    if (navKey && navKey !== shellModel.getProperty("/selectedKey")) {
      this._navigateToKey(navKey);
    }
  }

  /**
   * Restores the shell to the welcome page.
   */
  private _showWelcome(): void {
    const shellModel = this._getShellModel();
    shellModel.setProperty("/selectedKey", "");
    shellModel.setProperty("/pageName", "");
    shellModel.setProperty("/backVisible", false);
    shellModel.setProperty("/welcomeVisible", true);
    window.location.hash = "";
  }
}
