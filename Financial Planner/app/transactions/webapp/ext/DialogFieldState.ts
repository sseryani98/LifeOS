import { ValueState } from "sap/ui/core/library";
import { DIALOG_FIELD } from "com/financialplanner/transactions/constants";
import type JSONModel from "sap/ui/model/json/JSONModel";
import type Messaging from "com/lifeos/shared/Messaging";

/**
 * The field flags both Transactions dialogs share: a field's value state and its
 * text live beside it in the dialog's JSON model, as `{field}State`/`{field}StateText`.
 */
export default class DialogFieldState {
  /**
   * Resets a dialog field's flag to no state.
   * @param model the dialog's JSON model
   * @param field the field's name in DIALOG_FIELD
   */
  public static clear(model: JSONModel, field: string): void {
    model.setProperty(`/${field}${DIALOG_FIELD.STATE_SUFFIX}`, ValueState.None);
    model.setProperty(`/${field}${DIALOG_FIELD.TEXT_SUFFIX}`, "");
  }

  /**
   * Refuses a dialog's confirm in the one pattern both dialogs share: the field
   * is flagged with the reason, and the warning reads "not {done}: {reason}".
   * @param model the dialog's JSON model
   * @param messages the page's messaging helper
   * @param refusal the dialog's "was not {done}: {0}" i18n key, the field to flag (or null) and the reason
   * @param refusal.key the refusal's i18n key
   * @param refusal.field the field to flag, or null when the reason names none
   * @param refusal.reason the refusal's reason text
   */
  public static rejectConfirm(
    model: JSONModel,
    messages: Messaging,
    refusal: { key: string; field: string | null; reason: string },
  ): void {
    if (refusal.field) {
      DialogFieldState.showError(model, refusal.field, refusal.reason);
    }
    messages.showWarning(refusal.key, [refusal.reason]);
  }

  /**
   * Flags a dialog field Error with the reason it was refused.
   * @param model the dialog's JSON model
   * @param field the field's name in DIALOG_FIELD
   * @param reason the refusal's reason, shown as the field's state text
   */
  public static showError(
    model: JSONModel,
    field: string,
    reason: string,
  ): void {
    model.setProperty(
      `/${field}${DIALOG_FIELD.STATE_SUFFIX}`,
      ValueState.Error,
    );
    model.setProperty(`/${field}${DIALOG_FIELD.TEXT_SUFFIX}`, reason);
  }
}
