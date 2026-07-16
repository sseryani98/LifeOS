import UIComponent from "sap/ui/core/UIComponent";
import includeStylesheet from "sap/ui/dom/includeStylesheet";

/**
 * Root shell component for Financial Planner.
 * Provides the ToolPage shell with side navigation.
 *
 * @namespace com.financialplanner.shell
 */
export default class Component extends UIComponent {
  public static metadata = {
    manifest: "json",
  };

  /**
   * Initialises the component and injects the brand theme overrides.
   */
  public init(): void {
    super.init();
    void includeStylesheet("shared/css/theme-overrides.css");
  }

  /**
   * Re-appends the override stylesheet to the end of <head> so it wins the
   * cascade over late-loaded SAPUI5 library CSS (e.g. sap.ui.unified).
   */
  public onAfterRendering(): void {
    const link = document.querySelector('link[href*="theme-overrides"]');
    if (link) {
      document.head.appendChild(link);
    }
  }
}
