import ControllerExtension from "sap/ui/core/mvc/ControllerExtension";
import type DynamicPage from "sap/f/DynamicPage";

/**
 * ListReport controller extension — opens the Transaction List with its filter
 * bar collapsed, as the page standard requires; FE's manifest offers no setting for it.
 *
 * @namespace com.financialplanner.transactions.ext.controller
 */
export default class ListReportExt extends ControllerExtension {
  static overrides = {
    /**
     * Collapses the filter bar once, at init, so a later expand by the user sticks.
     */
    onInit(this: ListReportExt): void {
      (this.getView().getContent()[0] as DynamicPage).setHeaderExpanded(false);
    },
  };
}
