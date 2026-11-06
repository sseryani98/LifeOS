// Plain OPA5 page object for the Project View FPM page, launched as its own
// component. FE generates the tables' inner ids, so a table is found by view,
// type and the header the page declares, never by an FE-internal id.

import type ObjectStatus from "sap/m/ObjectStatus";
import type MacroTable from "sap/fe/macros/Table";
import type Control from "sap/ui/core/Control";
import type UI5Element from "sap/ui/core/Element";
import type MdcTable from "sap/ui/mdc/Table";
import Opa5 from "sap/ui/test/Opa5";
import Ancestor from "sap/ui/test/matchers/Ancestor";
import type Matcher from "sap/ui/test/matchers/Matcher";
import PropertyStrictEquals from "sap/ui/test/matchers/PropertyStrictEquals";

import { JOURNEY_PAGE } from "../../data/constants";
import { buildControlWait, buildControlsWait } from "../../support/opaWaitFor";

/**
 * Waits for the page's table with the given header, then runs next on it.
 * @param opa the running page object
 * @param header the header the view declares for the table
 * @param next what to do with the table
 */
const findTable = (
  opa: Opa5,
  header: string,
  next: (table: MdcTable) => void,
): void => {
  opa.waitFor(
    buildControlsWait(
      {
        controlType: "sap.ui.mdc.Table",
        viewName: JOURNEY_PAGE.VIEW_NAME,
        matchers: new PropertyStrictEquals({ name: "header", value: header }),
        errorMessage: `The "${header}" table did not render`,
      },
      tables => next(tables[0] as MdcTable),
    ),
  );
};

/**
 * Waits for the status cells of the page's table with the given header, then
 * runs next on them.
 * @param opa the running page object
 * @param header the header the view declares for the table
 * @param next what to do with the cells
 */
const findStatusCells = (
  opa: Opa5,
  header: string,
  next: (cells: ObjectStatus[]) => void,
): void => {
  findTable(opa, header, table => {
    opa.waitFor(
      buildControlsWait(
        {
          controlType: "sap.m.ObjectStatus",
          // Ancestor builds a matcher function at runtime; its typing omits that.
          matchers: new Ancestor(table) as unknown as Matcher,
          errorMessage: `The "${header}" table rendered no status cells`,
        },
        cells => next(cells as ObjectStatus[]),
      ),
    );
  });
};

/**
 * Waits for a control of the view until a property reads the given value.
 * @param opa the running page object
 * @param id the control's id in the view
 * @param name the property to read
 * @param value the value the property must reach
 */
const checkProperty = (
  opa: Opa5,
  id: string,
  name: string,
  value: string,
): void => {
  opa.waitFor(
    buildControlWait(
      {
        id,
        viewName: JOURNEY_PAGE.VIEW_NAME,
        matchers: new PropertyStrictEquals({ name, value }),
        errorMessage: `"${id}" never read "${value}" in its ${name}`,
      },
      () => {
        Opa5.assert.ok(true, `"${id}" reads "${value}" in its ${name}`);
      },
    ),
  );
};

/**
 * Waits for a control of the view that the page hides, then asserts it stays hidden.
 * @param opa the running page object
 * @param id the control's id in the view
 * @param label what the control is, for the assertion message
 */
const checkHidden = (opa: Opa5, id: string, label: string): void => {
  opa.waitFor(
    buildControlWait(
      {
        id,
        viewName: JOURNEY_PAGE.VIEW_NAME,
        visible: false,
        errorMessage: `${label} is not in the view`,
      },
      (control: UI5Element) => {
        Opa5.assert.strictEqual(
          (control as Control).getVisible(),
          false,
          `${label} is hidden`,
        );
      },
    ),
  );
};

Opa5.createPageObjects({
  onTheProjectViewPage: {
    assertions: {
      checkWorkspaceTitle(this: Opa5, name: string): void {
        this.waitFor(
          buildControlWait(
            {
              id: JOURNEY_PAGE.TITLE_ID,
              viewName: JOURNEY_PAGE.VIEW_NAME,
              matchers: new PropertyStrictEquals({ name: "text", value: name }),
              errorMessage: `The page never bound to the "${name}" workspace`,
            },
            () => {
              Opa5.assert.ok(true, `The page is bound to "${name}"`);
            },
          ),
        );
      },
      checkNextActionLabels(
        this: Opa5,
        status: string,
        kind: string,
        tier: string,
      ): void {
        checkProperty(this, JOURNEY_PAGE.NEXT_ACTION_STATUS_ID, "text", status);
        checkProperty(this, JOURNEY_PAGE.NEXT_ACTION_KIND_ID, "text", kind);
        checkProperty(
          this,
          JOURNEY_PAGE.NEXT_ACTION_HEADER_ID,
          "statusText",
          tier,
        );
        checkHidden(
          this,
          JOURNEY_PAGE.EMPTY_STATE_ID,
          "The no-next-action text",
        );
      },
      checkNextActionAttributes(
        this: Opa5,
        stageTitle: string,
        stageText: string,
        driverTitle: string,
      ): void {
        checkProperty(
          this,
          JOURNEY_PAGE.NEXT_ACTION_STAGE_ID,
          "title",
          stageTitle,
        );
        checkProperty(
          this,
          JOURNEY_PAGE.NEXT_ACTION_STAGE_ID,
          "text",
          stageText,
        );
        checkProperty(
          this,
          JOURNEY_PAGE.NEXT_ACTION_DRIVER_ID,
          "title",
          driverTitle,
        );
      },
      checkReadSucceeded(this: Opa5): void {
        checkHidden(
          this,
          JOURNEY_PAGE.READ_FAILED_STRIP_ID,
          "The read failure strip",
        );
      },
      checkTableColumns(
        this: Opa5,
        header: string,
        columns: readonly string[],
      ): void {
        findTable(this, header, table => {
          Opa5.assert.deepEqual(
            table.getColumns().map(column => column.getHeader()),
            columns,
            `The "${header}" table shows its declared columns in order`,
          );
        });
      },
      checkTableCellIcons(
        this: Opa5,
        header: string,
        icons: readonly string[],
      ): void {
        findStatusCells(this, header, cells => {
          Opa5.assert.deepEqual(
            cells
              .map(cell => cell.getIcon())
              .filter(icon => icon !== "")
              .sort(),
            icons,
            `The "${header}" table marks its status cells with icons`,
          );
        });
      },
      checkTableCellTexts(
        this: Opa5,
        header: string,
        texts: readonly string[],
      ): void {
        findStatusCells(this, header, cells => {
          Opa5.assert.deepEqual(
            cells
              .map(cell => cell.getText())
              .filter(text => text !== "")
              .sort(),
            texts,
            `The "${header}" table labels its status cells`,
          );
        });
      },
      checkTableRowCount(this: Opa5, id: string, count: number): void {
        const holdsCount = (control: UI5Element): boolean =>
          (control as MacroTable).getCount() === count;
        this.waitFor(
          buildControlWait(
            {
              id,
              viewName: JOURNEY_PAGE.VIEW_NAME,
              matchers: [holdsCount],
              errorMessage: `The "${id}" table never held ${count} row(s)`,
            },
            () => {
              Opa5.assert.ok(true, `The "${id}" table holds ${count} row(s)`);
            },
          ),
        );
      },
    },
  },
});
