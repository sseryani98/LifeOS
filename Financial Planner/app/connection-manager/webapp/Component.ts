import UIComponent from "sap/ui/core/UIComponent";

/**
 * SimpleFIN Connection Manager (freestyle component).
 * Manages SimpleFIN connections, health status, and account→card mapping.
 *
 * @namespace com.financialplanner.connectionmanager
 */
export default class Component extends UIComponent {
  public static metadata = {
    manifest: "json",
  };

  /**
   * Initialises the component and its router.
   */
  public init(): void {
    super.init();
    this.getRouter().initialize();
  }
}
