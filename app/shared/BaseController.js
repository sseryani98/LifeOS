sap.ui.define(
  ["sap/ui/core/mvc/Controller", "sap/ui/core/routing/History"],
  (Controller, History) => {
    "use strict";

    /**
     * BaseController — shared base for all freestyle app controllers.
     * Provides common helpers for routing, model access, and navigation.
     * All controllers extend this instead of sap.ui.core.mvc.Controller directly.
     */
    return Controller.extend("com.financialplanner.shared.BaseController", {
      /**
       * Returns the router for this component.
       * @returns {sap.ui.core.routing.Router} the router instance
       */
      getRouter() {
        return this.getOwnerComponent().getRouter();
      },

      /**
       * Returns a model by name from the view.
       * @param {string} sName - the model name (undefined for default model)
       * @returns {sap.ui.model.Model} the model instance
       */
      getModel(sName) {
        return this.getView().getModel(sName);
      },

      /**
       * Sets a model on the view.
       * @param {sap.ui.model.Model} oModel - the model instance
       * @param {string} sName - the model name (undefined for default model)
       */
      setModel(oModel, sName) {
        this.getView().setModel(oModel, sName);
      },

      /**
       * Navigates back in history, or to a fallback route if no history exists.
       * @param {string} sFallbackRoute - route name to navigate to if no history
       */
      onNavBack(sFallbackRoute) {
        const oHistory = History.getInstance();
        const sPreviousHash = oHistory.getPreviousHash();

        if (sPreviousHash !== undefined) {
          window.history.go(-1);
        } else if (sFallbackRoute) {
          this.getRouter().navTo(sFallbackRoute, {}, true);
        }
      },
    });
  },
);
