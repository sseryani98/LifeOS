import type ManagedObject from "sap/ui/base/ManagedObject";
import type ResourceBundle from "sap/base/i18n/ResourceBundle";
import type ResourceModel from "sap/ui/model/resource/ResourceModel";

/**
 * Resolves an i18n text against the "i18n" model that propagates from the
 * owning view/component. `source` is any ManagedObject (controller view or a
 * bound control), so formatters and controllers share one resolution path —
 * the single place getResourceBundle() is called.
 * @param source the view or control carrying the propagated "i18n" model
 * @param key the i18n message key
 * @returns the resolved text, or "" when the key is missing
 */
export function getText(source: ManagedObject, key: string): string {
  const model = source.getModel("i18n") as ResourceModel;
  const bundle = model.getResourceBundle() as ResourceBundle;
  return bundle.getText(key) ?? "";
}
