import ControllerExtension from "sap/ui/core/mvc/ControllerExtension";
import TransactionsService from "com/financialplanner/transactions/model/TransactionsService";
import VirtualStateCarrier from "com/financialplanner/transactions/model/VirtualStateCarrier";
import type Context from "sap/ui/model/odata/v4/Context";
import type ODataModel from "sap/ui/model/odata/v4/ODataModel";

/**
 * ObjectPage controller extension — a refused split edit must not stay pending
 * and poison every later edit, so each bound page is watched for refusals; and a
 * record opened from another keeps its header states.
 *
 * @namespace com.financialplanner.transactions.ext.controller
 */
export default class ObjectPageExt extends ControllerExtension {
  static overrides = {
    routing: {
      /**
       * Hands the record being left's computed header states to the one opening.
       * @param context the context the object page is about to bind
       */
      onBeforeBinding(this: ObjectPageExt, context: Context): void {
        new VirtualStateCarrier().copyLastRecordStates(context);
      },
      /**
       * Watches the page FE has just bound for refused edits.
       * @param context the object page's bound context
       */
      onAfterBinding(this: ObjectPageExt, context: Context): void {
        new TransactionsService(
          context.getModel() as ODataModel,
        ).attachRefusedEditRecovery(context);
      },
    },
  };
}
