sap.ui.define(
  [
    "com/financialplanner/shared/BaseController",
    "sap/ui/core/ComponentContainer",
    "com/financialplanner/shell/controller/NavConfig",
  ],
  // eslint-disable-next-line max-lines-per-function
  (BaseController, ComponentContainer, NAV_CONFIG) => {
    "use strict";

    /** Reverse map: hash pattern → nav key (e.g. "Issuers" → "MD_ISSUERS"). */
    const HASH_TO_NAV_KEY = Object.freeze(
      Object.entries(NAV_CONFIG).reduce((oMap, [sKey, oConf]) => {
        oMap[oConf.hash] = sKey;
        return oMap;
      }, {}),
    );

    /**
     * Shell controller — handles top-level navigation via side nav.
     * Loads app components into the content area when nav items are selected.
     * Supports deep-link restore from URL hash on page load.
     */
    return BaseController.extend("com.financialplanner.shell.controller.App", {
      /** @type {Object<string, sap.ui.core.ComponentContainer>} */
      _oComponentContainers: {},

      /** @type {Object<string, sap.ui.core.Component>} */
      _oComponents: {},

      /** @type {string|null} */
      _sPendingRoute: null,

      /**
       * Initialises shell view model and restores navigation from hash.
       */
      onInit() {
        const oShellModel = new (sap.ui.require("sap/ui/model/json/JSONModel"))(
          {
            selectedKey: "",
            backVisible: false,
            welcomeVisible: true,
          },
        );
        this.getView().setModel(oShellModel, "shellView");
        this._restoreFromHash();
      },

      /**
       * Navigates back one level. From an ObjectPage, returns to the
       * ListReport. From a ListReport, returns to the welcome page.
       */
      onNavBack() {
        const oShellModel = this.getView().getModel("shellView");
        const sSelectedKey = oShellModel.getProperty("/selectedKey");
        const oConfig = sSelectedKey ? NAV_CONFIG[sSelectedKey] : null;
        const oComponent = oConfig
          ? this._oComponents[oConfig.component]
          : null;

        if (oComponent && this._isOnObjectPage()) {
          oComponent.getRouter().navTo(oConfig.route, {}, true);
          return;
        }

        this._showWelcome();
      },

      /**
       * Handles side navigation item selection.
       * @param {sap.ui.base.Event} oEvent - the itemSelect event
       */
      onNavItemSelect(oEvent) {
        const sKey = oEvent.getParameter("item").getKey();
        if (!sKey) {
          return;
        }

        this._navigateToKey(sKey);
      },

      /**
       * Navigates to a nav key — loads its component, selects the
       * side nav item, and shows the back button.
       * @param {string} sKey - the NAV_CONFIG key
       */
      _navigateToKey(sKey) {
        const oConfig = NAV_CONFIG[sKey];
        if (!oConfig) {
          return;
        }

        this._loadAppComponent(oConfig.component, oConfig.route);
        const oShellModel = this.getView().getModel("shellView");
        oShellModel.setProperty("/selectedKey", sKey);
        oShellModel.setProperty("/backVisible", true);
        oShellModel.setProperty("/welcomeVisible", false);
      },

      /**
       * Loads an app component into the shell content area.
       * Caches ComponentContainers by component name and navigates inner router.
       * @param {string} sComponentName - the UI5 component name
       * @param {string} sRoute - the target route within the component
       */
      _loadAppComponent(sComponentName, sRoute) {
        const oPage = this.byId("appContent");
        oPage.removeAllContent();

        if (!this._oComponentContainers[sComponentName]) {
          this._sPendingRoute = sRoute;
          this._oComponentContainers[sComponentName] = new ComponentContainer({
            name: sComponentName,
            async: true,
            height: "100%",
            width: "100%",
            componentCreated: oEvent => {
              const oComponent = oEvent.getParameter("component");
              this._oComponents[sComponentName] = oComponent;
              if (this._sPendingRoute) {
                oComponent.getRouter().navTo(this._sPendingRoute, {}, true);
                this._sPendingRoute = null;
              }
            },
          });
        } else if (this._oComponents[sComponentName]) {
          this._oComponents[sComponentName].getRouter().navTo(sRoute, {}, true);
        }

        oPage.addContent(this._oComponentContainers[sComponentName]);
      },

      /**
       * Checks whether the current URL hash points to an ObjectPage
       * (contains an entity key with parentheses).
       * @returns {boolean} true if on an ObjectPage
       */
      _isOnObjectPage() {
        const sHash = window.location.hash;
        return sHash.includes("(") && sHash.includes(")");
      },

      /**
       * Restores navigation state from the URL hash on page load.
       * Matches the hash against known routes to auto-select the
       * correct side nav item and load its component.
       */
      _restoreFromHash() {
        const sHash = (window.location.hash || "").replace(/^#\/?/, "");
        if (!sHash) {
          return;
        }

        const sHashPart = sHash.split("(")[0].split("/")[0];
        const sNavKey = HASH_TO_NAV_KEY[sHashPart];
        if (sNavKey) {
          this._navigateToKey(sNavKey);
        }
      },

      /**
       * Restores the shell to the welcome page.
       */
      _showWelcome() {
        const oShellModel = this.getView().getModel("shellView");
        oShellModel.setProperty("/selectedKey", "");
        oShellModel.setProperty("/backVisible", false);
        oShellModel.setProperty("/welcomeVisible", true);
        window.location.hash = "";
      },
    });
  },
);
