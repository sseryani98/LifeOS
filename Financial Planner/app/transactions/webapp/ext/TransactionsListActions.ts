import CategorizationActions from "com/financialplanner/transactions/ext/CategorizationActions";
import SplitActions from "com/financialplanner/transactions/ext/SplitActions";
import type ExtensionAPI from "sap/fe/templates/ListReport/ExtensionAPI";

/**
 * FE custom-action handler surface for the Transactions ListReport.
 */
export default {
  /**
   * Opens the Apply Categories dialog for the current selection.
   * @returns resolves once the dialog is open
   */
  onApplyCategories(this: ExtensionAPI): Promise<void> {
    return CategorizationActions.resolveForPage(this).openApplyDialog();
  },

  /**
   * Re-runs categorization over the selected transactions.
   * @returns resolves once the re-run completes
   */
  onReCategorize(this: ExtensionAPI): Promise<void> {
    return CategorizationActions.resolveForPage(this).runReCategorization();
  },

  /**
   * Opens the Split dialog for a single selected transaction.
   * @returns resolves once the dialog is open
   */
  onSplit(this: ExtensionAPI): Promise<void> {
    return SplitActions.resolveForPage(this).openSplitDialog();
  },
};
