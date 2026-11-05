/// <reference types="qunit" />
import ObjectPageParser from "com/financialplanner/shared/util/ObjectPageParser";

import { ELEMENT_TREE, ELEMENT_TYPE, FORM_LAYOUT } from "../data/constants";
import { buildObjectPage } from "../support/sharedFakes";

QUnit.module("ObjectPageParser — form layout columns", () => {
  /** Every form gets the count at L/XL and one fewer at M, so the medium breakpoint never shows wider than large. */
  QUnit.test(
    "sets L/XL to the count and M to one fewer on every form",
    assert => {
      const fake = buildObjectPage(ELEMENT_TREE.MIXED);

      ObjectPageParser.setObjectPageFormLayoutColumns(
        fake.page,
        FORM_LAYOUT.COLUMNS,
      );

      assert.deepEqual(fake.layouts, [
        {
          columnsM: FORM_LAYOUT.COLUMNS_M,
          columnsL: FORM_LAYOUT.COLUMNS,
          columnsXL: FORM_LAYOUT.COLUMNS,
        },
        {
          columnsM: FORM_LAYOUT.COLUMNS_M,
          columnsL: FORM_LAYOUT.COLUMNS,
          columnsXL: FORM_LAYOUT.COLUMNS,
        },
      ]);
    },
  );

  /** A single-column layout must not derive 0 columns at M, which ColumnLayout rejects. */
  QUnit.test("keeps M at one column for a single-column layout", assert => {
    const fake = buildObjectPage(ELEMENT_TREE.MIXED);

    ObjectPageParser.setObjectPageFormLayoutColumns(
      fake.page,
      FORM_LAYOUT.SINGLE,
    );

    assert.deepEqual(fake.layouts[0], {
      columnsM: FORM_LAYOUT.SINGLE,
      columnsL: FORM_LAYOUT.SINGLE,
      columnsXL: FORM_LAYOUT.SINGLE,
    });
  });
});

QUnit.module("ObjectPageParser — element lookup", () => {
  /** Only forms carry a ColumnLayout; handing back any other element would crash on getLayout(). */
  QUnit.test("getAllForms returns only the forms in the tree", assert => {
    const fake = buildObjectPage(ELEMENT_TREE.MIXED);

    const names = ObjectPageParser.getAllForms(fake.page).map(form =>
      form.getMetadata().getName(),
    );

    assert.deepEqual(names, [ELEMENT_TYPE.FORM, ELEMENT_TYPE.FORM]);
  });

  /** Subsection reshaping must touch subsections only, never the forms inside them. */
  QUnit.test(
    "getAllSubsections returns only the subsections in the tree",
    assert => {
      const fake = buildObjectPage(ELEMENT_TREE.MIXED);

      const names = ObjectPageParser.getAllSubsections(fake.page).map(section =>
        section.getMetadata().getName(),
      );

      assert.deepEqual(names, [ELEMENT_TYPE.SUBSECTION]);
    },
  );
});
