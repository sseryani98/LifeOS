import type { I18nModelSource } from "com/financialplanner/shared/types";
import type ResourceBundle from "sap/base/i18n/ResourceBundle";
import type ResourceModel from "sap/ui/model/resource/ResourceModel";

/**
 * Resolves an i18n text against the "i18n" model that propagates from the
 * owning view/component. `source` is anything exposing getModel (a view, a
 * bound control, an FE ExtensionAPI), so formatters, controllers, and the
 * Messaging helper share one resolution path — the single getResourceBundle().
 * @param source the view/control/API carrying the propagated "i18n" model
 * @param key the i18n message key
 * @returns the resolved text, or "" when the key is missing
 */
export function getText(source: I18nModelSource, key: string): string {
  const model = source.getModel("i18n") as ResourceModel;
  const bundle = model.getResourceBundle() as ResourceBundle;
  return bundle.getText(key) ?? "";
}
