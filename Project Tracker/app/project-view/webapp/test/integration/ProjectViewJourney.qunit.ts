/// <reference types="qunit" />
import Opa5 from "sap/ui/test/Opa5";
import opaTest from "sap/ui/test/opaQunit";

import {
  COMPLETIONS_COLUMNS,
  JOURNEY_PAGE,
  JOURNEY_SEED,
  NEXT_ACTION_ATTRIBUTES,
  NEXT_ACTION_LABELS,
  QUEUE_COLUMNS,
} from "../data/constants";
import type { JourneyThen } from "../support/types";
import "./pages/ProjectView";

Opa5.extendConfig({ autoWait: true, timeout: 60 });

QUnit.module("Project View — page contract");

/** The page is launched as its own component, never through another module's shell, and must bind to the store's one workspace. */
opaTest(
  "binds the page to the workspace the store holds",
  (given: Opa5, _when: unknown, then: JourneyThen) => {
    given.iStartMyUIComponent({
      componentConfig: { name: JOURNEY_PAGE.COMPONENT, manifest: true },
      timeout: 120,
    });

    then.onTheProjectViewPage.checkWorkspaceTitle(JOURNEY_SEED.WORKSPACE_NAME);
    then.onTheProjectViewPage.checkReadSucceeded();
  },
);

/** The card's status, kind and tier lines are formatter output; a formatter that cannot reach the i18n bundle leaves them blank. */
opaTest(
  "labels the next action's status, kind and tier",
  (_given: Opa5, _when: unknown, then: JourneyThen) => {
    then.onTheProjectViewPage.checkNextActionLabels(
      NEXT_ACTION_LABELS.STATUS,
      NEXT_ACTION_LABELS.KIND,
      NEXT_ACTION_LABELS.TIER,
    );
  },
);

/** The card's Stage and Driver lines must read as the queue's columns do, or one stage carries two names on one page. */
opaTest(
  "titles the next action's stage and driver as the queue does",
  (_given: Opa5, _when: unknown, then: JourneyThen) => {
    then.onTheProjectViewPage.checkNextActionAttributes(
      NEXT_ACTION_ATTRIBUTES.STAGE_TITLE,
      NEXT_ACTION_ATTRIBUTES.STAGE_TEXT,
      NEXT_ACTION_ATTRIBUTES.DRIVER_TITLE,
    );
  },
);

/** The queue's LineItem and the view's status, kind and blocker columns are the page's declaration; a dropped one is a silent contract break. */
opaTest(
  "shows the open task queue with its declared columns",
  (_given: Opa5, _when: unknown, then: JourneyThen) => {
    then.onTheProjectViewPage.checkTableColumns(
      JOURNEY_PAGE.QUEUE_TABLE_HEADER,
      QUEUE_COLUMNS,
    );
    then.onTheProjectViewPage.checkTableRowCount(
      JOURNEY_PAGE.QUEUE_TABLE_ID,
      JOURNEY_SEED.QUEUE_ROWS,
    );
  },
);

/** The status and kind cells are the view's own column templates; a formatter that throws inside the table renders them blank. */
opaTest(
  "labels every queue row's status, kind and blocker",
  (_given: Opa5, _when: unknown, then: JourneyThen) => {
    then.onTheProjectViewPage.checkTableCellTexts(
      JOURNEY_PAGE.QUEUE_TABLE_HEADER,
      JOURNEY_SEED.QUEUE_CELL_TEXTS,
    );
  },
);

/** Recommended and Required differ in hue alone unless the kind cell carries the hint icon, which fails the never-by-colour-alone rule. */
opaTest(
  "marks every queue row's status and a Recommended kind with an icon",
  (_given: Opa5, _when: unknown, then: JourneyThen) => {
    then.onTheProjectViewPage.checkTableCellIcons(
      JOURNEY_PAGE.QUEUE_TABLE_HEADER,
      JOURNEY_SEED.QUEUE_CELL_ICONS,
    );
  },
);

/** The recently completed table renders its LineItem off the workspace binding; a broken navigation path shows headers over no rows. */
opaTest(
  "shows the recently completed table with its declared columns and rows",
  (_given: Opa5, _when: unknown, then: JourneyThen) => {
    then.onTheProjectViewPage.checkTableColumns(
      JOURNEY_PAGE.COMPLETIONS_TABLE_HEADER,
      COMPLETIONS_COLUMNS,
    );
    then.onTheProjectViewPage.checkTableRowCount(
      JOURNEY_PAGE.COMPLETIONS_TABLE_ID,
      JOURNEY_SEED.COMPLETED_ROWS,
    );

    then.iTeardownMyUIComponent();
  },
);
