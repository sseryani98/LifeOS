import TransactionActions from "com/financialplanner/transactions/ext/TransactionActions";
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
    return TransactionActions.resolveInstance().openApplyDialog(this);
  },

  /**
   * Re-runs categorization over the selected transactions.
   * @returns resolves once the re-run completes
   */
  onReCategorize(this: ExtensionAPI): Promise<void> {
    return TransactionActions.resolveInstance().runReCategorization(this);
  },

  /**
   * Opens the Split dialog for a single selected transaction.
   * @returns resolves once the dialog is open
   */
  onSplit(this: ExtensionAPI): Promise<void> {
    return TransactionActions.resolveInstance().openSplitDialog(this);
  },
};
