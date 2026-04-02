sap.ui.define(
  [
    "com/financialplanner/shared/BaseController",
    "sap/ui/core/ComponentContainer",
    "com/financialplanner/shell/controller/NavConfig",
  ],
  (BaseController, ComponentContainer, NAV_CONFIG) => {
    "use strict";

    /**
     * Shell controller — handles top-level navigation via side nav.
     * Loads app components into the content area when nav items are selected.
     */
    return BaseController.extend("com.financialplanner.shell.controller.App", {
      /** @type {Object<string, sap.ui.core.ComponentContainer>} */
      _oComponentContainers: {},

      /** @type {Object<string, sap.ui.core.Component>} */
      _oComponents: {},

      /** @type {string|null} */
      _sPendingRoute: null,

      /**
       * Handles side navigation item selection.
       * @param {sap.ui.base.Event} oEvent - the itemSelect event
       */
      onNavItemSelect(oEvent) {
        const sKey = oEvent.getParameter("item").getKey();
        if (!sKey) {
          return;
        }

        const oConfig = NAV_CONFIG[sKey];
        if (!oConfig) {
          return;
        }

        this._loadAppComponent(oConfig.component, oConfig.route);
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
    });
  },
);
