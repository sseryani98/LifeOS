import UIComponent from "sap/ui/core/UIComponent";

/**
 * CSV Import Wizard (freestyle component).
 * A three-step wizard that uploads bank CSV exports, reviews the parsed rows,
 * and persists the cleared transactions on TransactionService.
 *
 * @namespace com.financialplanner.csvimportwizard
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
