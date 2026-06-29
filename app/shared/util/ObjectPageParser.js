sap.ui.define([], () => {
  "use strict";

  return {
    /**
     * Sets the number of columns for all forms within an ObjectPage layout.
     * Adjusts column count for medium (M), large (L), and extra-large (XL) screen sizes.
     * @param {sap.uxap.ObjectPageLayout} oObjectPage - The ObjectPage to modify
     * @param {number} iNumberOfColumns - The desired number of columns for L and XL sizes
     */
    setObjectPageFormLayoutColumns(oObjectPage, iNumberOfColumns) {
      const aObjectPageForms = this.getAllForms(oObjectPage);
      const iNewNumberOfColumnsForM =
        iNumberOfColumns === 1 ? 1 : iNumberOfColumns - 1;
      aObjectPageForms.forEach(oForm => {
        oForm.getLayout().setColumnsM(iNewNumberOfColumnsForM);
        oForm.getLayout().setColumnsL(iNumberOfColumns);
        oForm.getLayout().setColumnsXL(iNumberOfColumns);
      });
    },

    /**
     * Retrieves all forms from an ObjectPage.
     * @param {sap.uxap.ObjectPageLayout} oObjectPage - The ObjectPage to extract forms from
     * @returns {sap.ui.layout.form.Form[]} Array of all forms in the ObjectPage
     */
    getAllForms(oObjectPage) {
      return oObjectPage
        .findElements(true)
        .filter(
          oElement =>
            oElement.getMetadata().getName() === "sap.ui.layout.form.Form",
        );
    },

    /**
     * Retrieves all subsections from an ObjectPage.
     * @param {sap.uxap.ObjectPageLayout} oObjectPage - The ObjectPage to extract subsections from
     * @returns {sap.uxap.ObjectPageSubSection[]} Array of all subsections in the ObjectPage
     */
    getAllSubsections(oObjectPage) {
      return oObjectPage
        .findElements(true)
        .filter(
          oElement =>
            oElement.getMetadata().getName() ===
            "sap.uxap.ObjectPageSubSection",
        );
    },
  };
});
