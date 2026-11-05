// Plain OPA5 page object for the Connection Manager FPM page, reached through the
// shell. FE generates the table's inner ids, so controls are found by view, type
// and the label the page declares, never by an FE-internal id.

import type Dialog from "sap/m/Dialog";
import type UI5Element from "sap/ui/core/Element";
import type MdcTable from "sap/ui/mdc/Table";
import Opa5 from "sap/ui/test/Opa5";
import type { Matcher } from "sap/ui/test/Opa5";
import Press from "sap/ui/test/actions/Press";
import Ancestor from "sap/ui/test/matchers/Ancestor";
import PropertyStrictEquals from "sap/ui/test/matchers/PropertyStrictEquals";
import {
  buildControlWait,
  buildControlsWait,
} from "com/financialplanner/shared/test/support/opaWaitFor";

import { ADD_DIALOG, JOURNEY_PAGE } from "../../data/constants";

/**
 * Waits for the connections table, then runs next on it.
 * @param opa the running page object
 * @param next what to do with the table
 */
const findConnectionsTable = (
  opa: Opa5,
  next: (table: MdcTable) => void,
): void => {
  opa.waitFor(
    buildControlsWait(
      {
        controlType: "sap.ui.mdc.Table",
        viewName: JOURNEY_PAGE.VIEW_NAME,
        matchers: new PropertyStrictEquals({
          name: "header",
          value: JOURNEY_PAGE.CONNECTIONS_TABLE_HEADER,
        }),
        errorMessage: "The connections table did not render",
      },
      tables => next(tables[0] as MdcTable),
    ),
  );
};

/**
 * Waits for the connections-table action button with the given text.
 * @param opa the running page object
 * @param text the action's label
 * @param press whether to press it once found
 */
const findConnectionsTableAction = (
  opa: Opa5,
  text: string,
  press: boolean,
): void => {
  findConnectionsTable(opa, table => {
    opa.waitFor(
      buildControlsWait(
        {
          controlType: "sap.m.Button",
          viewName: JOURNEY_PAGE.VIEW_NAME,
          enabled: press,
          matchers: [
            new PropertyStrictEquals({ name: "text", value: text }),
            new Ancestor(table) as unknown as Matcher,
          ],
          actions: press ? new Press() : undefined,
          errorMessage: `The connections table has no "${text}" action`,
        },
        buttons => {
          Opa5.assert.strictEqual(buttons.length, 1, `"${text}" action found`);
        },
      ),
    );
  });
};

Opa5.createPageObjects({
  onTheConnectionManagerPage: {
    actions: {
      runConnectionsTableAction(this: Opa5, text: string): void {
        findConnectionsTableAction(this, text, true);
      },
    },
    assertions: {
      checkConnectionsTableColumns(
        this: Opa5,
        headers: readonly string[],
      ): void {
        findConnectionsTable(this, table => {
          Opa5.assert.deepEqual(
            table.getColumns().map(column => column.getHeader()),
            headers,
            "The connections table shows its declared columns in order",
          );
        });
      },
      checkConnectionsTableAction(this: Opa5, text: string): void {
        findConnectionsTableAction(this, text, false);
      },
      checkAddConnectionDialogOpen(this: Opa5, title: string): void {
        this.waitFor(
          buildControlWait(
            {
              id: ADD_DIALOG.ID,
              viewName: JOURNEY_PAGE.VIEW_NAME,
              controlType: "sap.m.Dialog",
              searchOpenDialogs: true,
              errorMessage: "The Add Connection dialog did not open",
            },
            (control: UI5Element) => {
              const dialog = control as Dialog;
              Opa5.assert.strictEqual(dialog.isOpen(), true, "Dialog is open");
              Opa5.assert.strictEqual(dialog.getTitle(), title, "Dialog title");
            },
          ),
        );
      },
    },
  },
});
