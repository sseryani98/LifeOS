import type { I18nModelSource } from "com/lifeos/shared/types";
import type ResourceBundle from "sap/base/i18n/ResourceBundle";
import type ResourceModel from "sap/ui/model/resource/ResourceModel";

/**
 * The single i18n resolution path — the only getResourceBundle() call — shared
 * by formatters, controllers and the Messaging helper.
 */
export default class I18n {
  /**
   * Resolves an i18n text against the "i18n" model that propagates from the
   * owning view/component. `source` is anything exposing getModel (a view, a
   * bound control, an FE ExtensionAPI).
   * @param source the view/control/API carrying the propagated "i18n" model
   * @param key the i18n message key
   * @param args values for the text's {0}, {1}… placeholders
   * @returns the resolved text, or "" when the key is missing
   */
  public static getText(
    source: I18nModelSource,
    key: string,
    args?: string[],
  ): string {
    const model = source.getModel("i18n") as ResourceModel;
    const bundle = model.getResourceBundle() as ResourceBundle;
    return bundle.getText(key, args) ?? "";
  }
}
