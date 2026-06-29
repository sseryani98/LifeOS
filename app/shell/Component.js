sap.ui.define(
  ["sap/ui/core/UIComponent", "sap/ui/dom/includeStylesheet"],
  (UIComponent, includeStylesheet) => {
    "use strict";

    /**
     * Root shell component for Financial Planner.
     * Provides the ToolPage shell with side navigation.
     * Individual app views are loaded into the content area via routing.
     */
    return UIComponent.extend("com.financialplanner.shell.Component", {
      metadata: {
        manifest: "json",
      },

      init() {
        UIComponent.prototype.init.apply(this, arguments);
        includeStylesheet("shared/css/theme-overrides.css");
      },

      onAfterRendering() {
        // Re-append override stylesheet to end of <head> so it wins
        // the cascade over late-loaded SAPUI5 library CSS (e.g. sap.ui.unified).
        const oLink = document.querySelector('link[href*="theme-overrides"]');
        if (oLink) {
          document.head.appendChild(oLink);
        }
      },
    });
  },
);
