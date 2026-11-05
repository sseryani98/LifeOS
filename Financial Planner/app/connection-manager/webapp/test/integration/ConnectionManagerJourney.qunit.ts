/// <reference types="qunit" />
import Opa5 from "sap/ui/test/Opa5";
import opaTest from "sap/ui/test/opaQunit";

import {
  CONNECTIONS_ACTION,
  CONNECTIONS_COLUMNS,
  JOURNEY_PAGE,
} from "../data/constants";
import type { JourneyThen, JourneyWhen } from "../support/types";
import "./pages/ConnectionManager";

Opa5.extendConfig({ autoWait: true, timeout: 60 });

QUnit.module("Connection Manager — page contract");

/** The connections table must render every LineItem field and custom column the page declares, reached through the real shell. */
opaTest(
  "shows the connections table with its declared columns",
  (given: Opa5, _when: JourneyWhen, then: JourneyThen) => {
    given.iStartMyAppInAFrame({
      source: JOURNEY_PAGE.SHELL_ROUTE,
      autoWait: true,
      timeout: 120,
    });

    then.onTheConnectionManagerPage.checkConnectionsTableColumns(
      CONNECTIONS_COLUMNS,
    );
  },
);

/** Each custom action the view declares must reach the table toolbar, or its handler is unreachable. */
opaTest(
  "offers the Add Connection, Sync Now and Re-authenticate actions",
  (_given: Opa5, _when: JourneyWhen, then: JourneyThen) => {
    then.onTheConnectionManagerPage.checkConnectionsTableAction(
      CONNECTIONS_ACTION.ADD_CONNECTION,
    );
    then.onTheConnectionManagerPage.checkConnectionsTableAction(
      CONNECTIONS_ACTION.SYNC_NOW,
    );
    then.onTheConnectionManagerPage.checkConnectionsTableAction(
      CONNECTIONS_ACTION.REAUTHENTICATE,
    );
  },
);

/** Add Connection must be wired to its handler and the dialog fragment must load under its declared name. */
opaTest(
  "opens the Add Connection dialog",
  (_given: Opa5, when: JourneyWhen, then: JourneyThen) => {
    when.onTheConnectionManagerPage.runConnectionsTableAction(
      CONNECTIONS_ACTION.ADD_CONNECTION,
    );

    then.onTheConnectionManagerPage.checkAddConnectionDialogOpen(
      JOURNEY_PAGE.ADD_DIALOG_TITLE,
    );

    then.iTeardownMyAppFrame();
  },
);
