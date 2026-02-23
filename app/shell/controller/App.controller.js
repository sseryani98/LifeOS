sap.ui.define([
  "com/financialplanner/shared/BaseController",
  "sap/m/MessageToast"
], (BaseController, MessageToast) => {
  "use strict";

  /**
   * Shell controller — handles top-level navigation via side nav.
   * Routes to individual app views when nav items are selected.
   */
  return BaseController.extend("com.financialplanner.shell.controller.App", {

    /**
     * Handles side navigation item selection.
     * @param {sap.ui.base.Event} oEvent - the itemSelect event
     */
    onNavItemSelect(oEvent) {
      const sKey = oEvent.getParameter("item").getKey();
      if (sKey) {
        MessageToast.show("Navigate to: " + sKey);
        // Router navigation will be implemented when app pages are built
      }
    }
  });
});
