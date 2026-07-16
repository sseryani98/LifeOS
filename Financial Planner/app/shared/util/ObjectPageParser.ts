import type Form from "sap/ui/layout/form/Form";
import type ColumnLayout from "sap/ui/layout/form/ColumnLayout";
import type ObjectPageLayout from "sap/uxap/ObjectPageLayout";
import type ObjectPageSubSection from "sap/uxap/ObjectPageSubSection";

/**
 * Helpers for reshaping a Fiori Elements ObjectPage layout at runtime.
 */
const objectPageParser = {
  /**
   * Sets the number of columns for all forms within an ObjectPage layout.
   * Adjusts column count for medium (M), large (L), and extra-large (XL) sizes.
   * @param objectPage the ObjectPage to modify
   * @param numberOfColumns the desired number of columns for L and XL sizes
   */
  setObjectPageFormLayoutColumns(
    objectPage: ObjectPageLayout,
    numberOfColumns: number,
  ): void {
    const forms = objectPageParser.getAllForms(objectPage);
    const numberOfColumnsForM = numberOfColumns === 1 ? 1 : numberOfColumns - 1;
    forms.forEach(form => {
      const layout = form.getLayout() as ColumnLayout;
      layout.setColumnsM(numberOfColumnsForM);
      layout.setColumnsL(numberOfColumns);
      layout.setColumnsXL(numberOfColumns);
    });
  },

  /**
   * Retrieves all forms from an ObjectPage.
   * @param objectPage the ObjectPage to extract forms from
   * @returns array of all forms in the ObjectPage
   */
  getAllForms(objectPage: ObjectPageLayout): Form[] {
    return objectPage
      .findElements(true)
      .filter(
        element =>
          element.getMetadata().getName() === "sap.ui.layout.form.Form",
      ) as Form[];
  },

  /**
   * Retrieves all subsections from an ObjectPage.
   * @param objectPage the ObjectPage to extract subsections from
   * @returns array of all subsections in the ObjectPage
   */
  getAllSubsections(objectPage: ObjectPageLayout): ObjectPageSubSection[] {
    return objectPage
      .findElements(true)
      .filter(
        element =>
          element.getMetadata().getName() === "sap.uxap.ObjectPageSubSection",
      ) as ObjectPageSubSection[];
  },
};

export default objectPageParser;
