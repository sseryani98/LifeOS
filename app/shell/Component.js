sap.ui.define([
  "sap/ui/core/UIComponent"
], (UIComponent) => {
  "use strict";

  /**
   * Root shell component for Financial Planner.
   * Provides the ToolPage shell with side navigation.
   * Individual app views are loaded into the content area via routing.
   */
  return UIComponent.extend("com.financialplanner.shell.Component", {
    metadata: {
      manifest: "json"
    },

    init() {
      UIComponent.prototype.init.apply(this, arguments);
    }
  });
});
