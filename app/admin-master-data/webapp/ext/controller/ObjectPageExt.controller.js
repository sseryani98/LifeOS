sap.ui.define(
  [
    "sap/ui/core/mvc/ControllerExtension",
    "com/financialplanner/shared/util/ObjectPageParser",
  ],
  (ControllerExtension, ObjectPageParser) => {
    "use strict";

    const I_FORM_COLUMNS = 3;

    return ControllerExtension.extend(
      "com.financialplanner.adminmasterdata.ext.controller.ObjectPageExt",
      {
        override: {
          onAfterRendering() {
            ObjectPageParser.setObjectPageFormLayoutColumns(
              this.base.getView().getContent()[0],
              I_FORM_COLUMNS,
            );
          },
        },
      },
    );
  },
);
