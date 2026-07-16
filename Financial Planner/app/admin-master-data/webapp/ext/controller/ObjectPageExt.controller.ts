import ControllerExtension from "sap/ui/core/mvc/ControllerExtension";
import objectPageParser from "com/financialplanner/shared/util/ObjectPageParser";
import { OBJECT_PAGE } from "com/financialplanner/shared/constants";
import type ObjectPageLayout from "sap/uxap/ObjectPageLayout";

/**
 * ObjectPage controller extension — forces a 3-column form layout on the
 * Admin Master Data object pages once they have rendered.
 *
 * @namespace com.financialplanner.adminmasterdata.ext.controller
 */
export default class ObjectPageExt extends ControllerExtension {
  static overrides = {
    /**
     * Applies the 3-column form layout after the ObjectPage renders.
     */
    onAfterRendering(this: ObjectPageExt): void {
      const objectPage = this.getView().getContent()[0] as ObjectPageLayout;
      objectPageParser.setObjectPageFormLayoutColumns(
        objectPage,
        OBJECT_PAGE.FORM_COLUMNS,
      );
    },
  };
}
