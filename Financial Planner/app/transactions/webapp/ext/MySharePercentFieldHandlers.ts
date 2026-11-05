import TransactionsService from "com/financialplanner/transactions/model/TransactionsService";
import type { InputBase$ChangeEvent } from "sap/m/InputBase";
import type Context from "sap/ui/model/odata/v4/Context";
import type ODataModel from "sap/ui/model/odata/v4/ODataModel";

/**
 * Event handlers for the object page's My Share % custom field.
 */
export default {
  /**
   * Re-reads the dollar share the backend recomputed from the edited percentage.
   * @param event the Input's change event
   * @returns resolves once the share is re-read
   */
  onInputMySharePercentChange(event: InputBase$ChangeEvent): Promise<void> {
    const context = event.getSource().getBindingContext() as Context;
    return new TransactionsService(context.getModel() as ODataModel).refreshSplitShare(context);
  },
};
