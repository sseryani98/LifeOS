/// <reference types="qunit" />
import Opa5 from "sap/ui/test/Opa5";
import opaTest from "sap/ui/test/opaQunit";

import {
  JOURNEY_DETAILS_GROUPS,
  JOURNEY_DIALOG,
  JOURNEY_DIALOG_WIDTH,
  JOURNEY_FRAME,
  JOURNEY_HEADER_STATUS,
  JOURNEY_LABEL,
  JOURNEY_LOG,
  JOURNEY_PAGE,
  JOURNEY_RECORD,
  JOURNEY_RECURRING,
  JOURNEY_SEED,
  JOURNEY_SHARE_INPUT,
  JOURNEY_SPLIT_EDIT,
  JOURNEY_SPLIT_INPUT_LOOK,
} from "../data/constants";
import type { JourneyThen, JourneyWhen } from "../support/types";
import "./pages/TransactionsList";

Opa5.extendConfig({ autoWait: true, timeout: 60 });

QUnit.module("Transaction List — split and categorize dialogs");

/** The list opens with its filter bar collapsed, and the status default must read as the column does, not as the raw code. */
opaTest(
  "opens with the filter bar collapsed on a labelled status default",
  (given: Opa5, _when: JourneyWhen, then: JourneyThen) => {
    given.iStartMyAppInAFrame({
      source: JOURNEY_PAGE.SHELL_ROUTE,
      autoWait: true,
      timeout: 120,
    });

    then.onTheTransactionsList.checkFilterBarCollapsed();
    then.onTheTransactionsList.checkFilterTokenText(
      JOURNEY_LABEL.DEFAULT_STATUS_TOKEN,
    );
  },
);

/** The suggestion only reaches the dialog across the OData wire; each tier stubbing the other's half ships a broken wire green. */
opaTest(
  "pre-fills the Split dialog with the vendor's recurring split",
  (_given: Opa5, when: JourneyWhen, then: JourneyThen) => {
    when.onTheTransactionsList.clearFilters();
    when.onTheTransactionsList.selectRowByDescription(
      JOURNEY_SEED.NEW_PADEL_DESCRIPTION,
    );
    when.onTheTransactionsList.runToolbarAction(JOURNEY_PAGE.SPLIT_ACTION_ID);

    then.onTheTransactionsList.checkSplitDialogValues({
      pct: JOURNEY_SEED.SUGGESTED_PCT,
      amount: JOURNEY_SEED.SUGGESTED_AMOUNT,
      description: JOURNEY_SEED.SUGGESTED_DESCRIPTION,
      recurring: true,
    });
    then.onTheTransactionsList.checkDialogText(
      JOURNEY_LABEL.LABEL_TYPE,
      JOURNEY_LABEL.SPLIT_DESCRIPTION,
    );
  },
);

/** The object page can only render Recurring as FE's CheckBox; a Switch here made one field read two ways. */
opaTest(
  "edits Recurring in the Split dialog with the object page's control",
  (_given: Opa5, _when: JourneyWhen, then: JourneyThen) => {
    then.onTheTransactionsList.checkRecurringControl(
      JOURNEY_RECURRING.CONTROL_TYPE,
      true,
    );
  },
);

/** The Recurring CheckBox drew its border apart from the inputs above it; one control family takes one field-border colour. */
opaTest(
  "borders the Split dialog's Recurring checkbox in the inputs' border colour",
  (_given: Opa5, _when: JourneyWhen, then: JourneyThen) => {
    then.onTheTransactionsList.checkCheckBoxBorderMatchesInput(
      JOURNEY_DIALOG.SPLIT_RECURRING,
      JOURNEY_DIALOG.SPLIT_DESCRIPTION,
    );
  },
);

/** Split and Apply Categories are both label-over-field forms; sized by content they opened 361px and 348px, two widths for one dialog shape. */
opaTest(
  "opens the Split dialog at the shared list-dialog width",
  (_given: Opa5, _when: JourneyWhen, then: JourneyThen) => {
    then.onTheTransactionsList.checkDialogWidth(
      JOURNEY_DIALOG.SPLIT,
      JOURNEY_DIALOG_WIDTH.PX,
    );
  },
);

/** FE templates the fragment before core:require runs, so the amount's Float type was looked up as a global and its load failed on the first open. */
opaTest(
  "opens the Split dialog without an unresolved binding type",
  (_given: Opa5, _when: JourneyWhen, then: JourneyThen) => {
    then.onTheTransactionsList.checkNoLogEntry(JOURNEY_LOG.UNRESOLVED_TYPE);
  },
);

/** The object page right-aligns My Share Amount as FE does every number; the dialog left-aligned both shares, so the two surfaces disagreed. */
opaTest(
  "aligns both Split dialog share inputs at the end, as the object page does",
  (_given: Opa5, _when: JourneyWhen, then: JourneyThen) => {
    then.onTheTransactionsList.checkDialogInputAlign(
      JOURNEY_DIALOG.SPLIT_PCT,
      JOURNEY_SHARE_INPUT.TEXT_ALIGN,
    );
    then.onTheTransactionsList.checkDialogInputAlign(
      JOURNEY_DIALOG.SPLIT_AMOUNT,
      JOURNEY_SHARE_INPUT.TEXT_ALIGN,
    );
  },
);

/** The object page shows My Share Amount as "22.00 CAD"; the dialog showed a bare "22" at twice the %'s width, so one field read two ways. */
opaTest(
  "shows the Split dialog amount to two decimals in CAD, as wide as the percentage",
  (_given: Opa5, _when: JourneyWhen, then: JourneyThen) => {
    then.onTheTransactionsList.checkDialogInputLook(
      JOURNEY_DIALOG.SPLIT_AMOUNT,
      JOURNEY_SPLIT_INPUT_LOOK.AMOUNT,
    );
    then.onTheTransactionsList.checkDialogInputsSameWidth(
      JOURNEY_DIALOG.SPLIT_AMOUNT,
      JOURNEY_DIALOG.SPLIT_PCT,
    );
  },
);

/** The object page's empty My Share (%) reads "–" in display and Edit; the dialog's was blank, a third empty state. */
opaTest(
  "shows a dash in the Split dialog's empty percentage, as the object page does",
  (_given: Opa5, _when: JourneyWhen, then: JourneyThen) => {
    then.onTheTransactionsList.checkDialogInputLook(
      JOURNEY_DIALOG.SPLIT_PCT,
      JOURNEY_SPLIT_INPUT_LOOK.PCT,
    );
  },
);

/** On a suggestion an edited amount kept the stale percentage on screen and the save dropped it unseen; the dialog must show what will be saved, as the object page does. */
opaTest(
  "clears the Split dialog percentage on an amount edit and recomputes the amount from a percentage edit",
  (_given: Opa5, when: JourneyWhen, then: JourneyThen) => {
    when.onTheTransactionsList.writeDialogInputText(
      JOURNEY_DIALOG.SPLIT_AMOUNT,
      JOURNEY_SPLIT_EDIT.AMOUNT,
    );
    then.onTheTransactionsList.checkDialogInputValue(
      JOURNEY_DIALOG.SPLIT_PCT,
      JOURNEY_SPLIT_EDIT.CLEARED_PCT,
    );

    when.onTheTransactionsList.writeDialogInputText(
      JOURNEY_DIALOG.SPLIT_PCT,
      JOURNEY_SPLIT_EDIT.PCT,
    );
    then.onTheTransactionsList.checkDialogInputValue(
      JOURNEY_DIALOG.SPLIT_AMOUNT,
      JOURNEY_SPLIT_EDIT.RECOMPUTED_AMOUNT,
    );
  },
);

/** 150% showed no field state and recomputed a share larger than the charge; the field must read Error and the amount keep its last valid value. */
opaTest(
  "flags an out-of-range Split dialog percentage on its field without recomputing the amount",
  (_given: Opa5, when: JourneyWhen, then: JourneyThen) => {
    when.onTheTransactionsList.writeDialogInputText(
      JOURNEY_DIALOG.SPLIT_PCT,
      JOURNEY_SPLIT_EDIT.OUT_OF_RANGE_PCT,
    );

    then.onTheTransactionsList.checkDialogInputState(
      JOURNEY_DIALOG.SPLIT_PCT,
      JOURNEY_SPLIT_EDIT.ERROR_STATE,
    );
    then.onTheTransactionsList.checkDialogInputValue(
      JOURNEY_DIALOG.SPLIT_AMOUNT,
      JOURNEY_SPLIT_EDIT.RECOMPUTED_AMOUNT,
    );
  },
);

/** Apply Categories confirms with its verb and object; a bare "Save" left the Split confirm unnamed beside it. */
opaTest(
  "names the Split dialog confirm by its action",
  (_given: Opa5, _when: JourneyWhen, then: JourneyThen) => {
    then.onTheTransactionsList.checkDialogText(
      JOURNEY_LABEL.BUTTON_TYPE,
      JOURNEY_LABEL.SAVE_SPLIT,
    );
  },
);

/** FE copies a fragment controller with for…in; a class's prototype handlers were lost, so Cancel did nothing and the dialog trapped the page. */
opaTest(
  "closes the Split dialog on Cancel without saving",
  (_given: Opa5, when: JourneyWhen, then: JourneyThen) => {
    when.onTheTransactionsList.selectDialogButton(JOURNEY_DIALOG.SPLIT_CANCEL);

    then.onTheTransactionsList.checkDialogClosed(JOURNEY_DIALOG.SPLIT);
  },
);

/** Apply Categories loads through the same DialogManager path, so its Cancel must close it too; its vendor is required, so the label must say so before Apply refuses; it shares the Split dialog's width. */
opaTest(
  "closes the Apply Categories dialog on Cancel, opened at the Split dialog's width",
  (_given: Opa5, when: JourneyWhen, then: JourneyThen) => {
    when.onTheTransactionsList.runToolbarAction(JOURNEY_PAGE.APPLY_ACTION_ID);
    then.onTheTransactionsList.checkDialogOpen(JOURNEY_DIALOG.APPLY);
    then.onTheTransactionsList.checkDialogWidth(
      JOURNEY_DIALOG.APPLY,
      JOURNEY_DIALOG_WIDTH.PX,
    );
    then.onTheTransactionsList.checkDialogText(
      JOURNEY_LABEL.BUTTON_TYPE,
      JOURNEY_LABEL.APPLY_CATEGORIES,
    );
    then.onTheTransactionsList.checkLabelRequired(JOURNEY_LABEL.VENDOR);

    when.onTheTransactionsList.selectDialogButton(JOURNEY_DIALOG.APPLY_CANCEL);

    then.onTheTransactionsList.checkDialogClosed(JOURNEY_DIALOG.APPLY);
  },
);

/** The spec heads the column "Date" and marks a split with an icon; "Posted …" truncated and "Yes"/"No" was text. */
opaTest(
  "heads the date column Date and marks only the split row with an icon",
  (_given: Opa5, _when: JourneyWhen, then: JourneyThen) => {
    then.onTheTransactionsList.checkColumnHeader(JOURNEY_LABEL.DATE_COLUMN);
    then.onTheTransactionsList.checkSplitIcon(
      JOURNEY_SEED.SPLIT_PADEL_DESCRIPTION,
      true,
    );
    then.onTheTransactionsList.checkSplitIcon(
      JOURNEY_SEED.NEW_PADEL_DESCRIPTION,
      false,
    );
  },
);

/** A stored 0.2 share read "0.2000" beside a dialog that says 20; an empty Transaction Date read as a second, conflicting date. */
opaTest(
  "shows the split share as a percentage and hides an empty transaction date",
  (_given: Opa5, when: JourneyWhen, then: JourneyThen) => {
    when.onTheTransactionsList.openRowByDescription(
      JOURNEY_SEED.SPLIT_PADEL_DESCRIPTION,
    );

    then.onTheTransactionsList.checkSplitSharePercent(
      JOURNEY_SEED.SPLIT_PADEL_SHARE_PCT,
    );
    then.onTheTransactionsList.checkFieldHidden(JOURNEY_LABEL.TRANSACTION_DATE);
    then.iTeardownMyAppFrame();
  },
);

/** An amount-only split has no percentage; the read view showed a bare "%" under My Share (%) where every other empty field shows a dash. */
opaTest(
  "shows a dash, not a bare percent sign, for an amount-only split's share",
  (given: Opa5, when: JourneyWhen, then: JourneyThen) => {
    given.iStartMyAppInAFrame({
      source: JOURNEY_PAGE.SHELL_ROUTE,
      autoWait: true,
      timeout: 120,
      ...JOURNEY_FRAME.DESKTOP,
    });
    when.onTheTransactionsList.clearFilters();
    when.onTheTransactionsList.openRowByDescription(
      JOURNEY_SEED.DOLLAR_SPLIT_PADEL_DESCRIPTION,
    );

    then.onTheTransactionsList.checkSplitSharePercentEmpty();
  },
);

/** A first load of an amount-only split was reported painting its User Corrected header neutral; the header must carry Information and the icon the list shows. */
opaTest(
  "colours a user-corrected amount-only split's header status as Information, with its icon",
  (_given: Opa5, _when: JourneyWhen, then: JourneyThen) => {
    then.onTheTransactionsList.checkHeaderStatus(
      JOURNEY_HEADER_STATUS.USER_CORRECTED,
    );
  },
);

/** In edit the custom % input left-aligned beside FE's right-aligned amount, and its empty state was blank where display shows a dash. */
opaTest(
  "edits an amount-only split's share end-aligned, with a dash for the empty percentage",
  (_given: Opa5, when: JourneyWhen, then: JourneyThen) => {
    when.onTheTransactionsList.startObjectPageEdit();

    then.onTheTransactionsList.checkSplitSharePercentInput(
      JOURNEY_SHARE_INPUT.EMPTY_LOOK,
    );
  },
);

/** The paired either/or shares rendered 113px beside FE's 159px amount in Edit; the Split dialog sizes them alike, so the object page must too. */
opaTest(
  "edits the split shares at one width, as the Split dialog does",
  (_given: Opa5, _when: JourneyWhen, then: JourneyThen) => {
    then.onTheTransactionsList.checkSplitShareInputsSameWidth();
  },
);

/** The Split dialog edits Recurring with a CheckBox; the object page must render the same control, not drift to another. */
opaTest(
  "edits Recurring on the object page with the Split dialog's control",
  (_given: Opa5, _when: JourneyWhen, then: JourneyThen) => {
    then.onTheTransactionsList.checkRecurringControl(
      JOURNEY_RECURRING.CONTROL_TYPE,
      false,
    );
  },
);

/** The Suggestions section titles its Match group; the three Details groups had none, so one page labelled its groups two ways. */
opaTest(
  "heads each Transaction Details group with a label",
  (_given: Opa5, _when: JourneyWhen, then: JourneyThen) => {
    then.onTheTransactionsList.checkDetailsGroupTitles(
      JOURNEY_DETAILS_GROUPS.ANCHOR_LABEL,
      JOURNEY_DETAILS_GROUPS.TITLES,
    );
  },
);

/** Horizon hardcodes a 4px expand icon and 12px overflow buttons in the anchor bar; THEME squares every tab header. */
opaTest(
  "squares the object page anchor bar's items, overflow buttons and expand icons",
  (_given: Opa5, _when: JourneyWhen, then: JourneyThen) => {
    then.onTheTransactionsList.checkAnchorBarSquare();
  },
);

/** The form reflows per width, so a group spanning two columns split its fields 2+1 and left one far from its heading. */
opaTest(
  "keeps each Transaction Details group on one row under its heading at 1440px",
  (_given: Opa5, _when: JourneyWhen, then: JourneyThen) => {
    then.onTheTransactionsList.checkDetailsGroupsIntact(
      JOURNEY_DETAILS_GROUPS.ANCHOR_LABEL,
      JOURNEY_DETAILS_GROUPS.TITLES,
    );
  },
);

/** Headings and cards share one left edge at 1440px; this pins the width where they already agree. */
opaTest(
  "starts the object page's cards at its headings' left edge at 1440px",
  (_given: Opa5, _when: JourneyWhen, then: JourneyThen) => {
    then.onTheTransactionsList.checkObjectPageEdgesAligned();
    then.iTeardownMyAppFrame();
  },
);

/** Balanced for 1440px, the groups broke at 1920px: the layout must hold by construction, not be tuned to one width. */
opaTest(
  "keeps each Transaction Details group on one row under its heading at 1920px",
  (given: Opa5, when: JourneyWhen, then: JourneyThen) => {
    given.iStartMyAppInAFrame({
      source: JOURNEY_PAGE.SHELL_ROUTE,
      autoWait: true,
      timeout: 120,
      ...JOURNEY_FRAME.WIDE,
    });
    when.onTheTransactionsList.clearFilters();
    when.onTheTransactionsList.openRowByDescription(
      JOURNEY_SEED.SPLIT_PADEL_DESCRIPTION,
    );
    when.onTheTransactionsList.startObjectPageEdit();

    then.onTheTransactionsList.checkDetailsGroupsIntact(
      JOURNEY_DETAILS_GROUPS.ANCHOR_LABEL,
      JOURNEY_DETAILS_GROUPS.TITLES,
    );
  },
);

/** At 1920px Horizon widens the heading gutter to 3rem but keeps the cards at 2rem, so every card sat 16px left of its heading. */
opaTest(
  "starts the object page's cards at its headings' left edge at 1920px",
  (_given: Opa5, _when: JourneyWhen, then: JourneyThen) => {
    then.onTheTransactionsList.checkObjectPageEdgesAligned();
    then.iTeardownMyAppFrame();
  },
);

/** FE re-states a reused header only when the criticality value changes, so moving between two user-corrected rows lost the blue. */
opaTest(
  "keeps the header status Information when the hash moves between two user-corrected rows",
  (given: Opa5, when: JourneyWhen, then: JourneyThen) => {
    given.iStartMyAppInAFrame({
      source: JOURNEY_PAGE.SHELL_ROUTE,
      autoWait: true,
      timeout: 120,
      ...JOURNEY_FRAME.DESKTOP,
    });
    when.onTheTransactionsList.clearFilters();
    when.onTheTransactionsList.openRowByDescription(
      JOURNEY_SEED.DOLLAR_SPLIT_PADEL_DESCRIPTION,
    );
    then.onTheTransactionsList.checkRecordHeaderStatus(
      JOURNEY_RECORD.SEP_ID,
      JOURNEY_HEADER_STATUS.USER_CORRECTED,
    );
    when.onTheTransactionsList.navigateToHash(JOURNEY_RECORD.OCT_HASH);

    then.onTheTransactionsList.checkRecordHeaderStatus(
      JOURNEY_RECORD.OCT_ID,
      JOURNEY_HEADER_STATUS.USER_CORRECTED,
    );
    then.iTeardownMyAppFrame();
  },
);

/** Browser Back: FE swapped the list's history entry for the record when both hashes began with one entity set, so Back skipped the list. */
opaTest(
  "returns to the list when the browser goes back from a record",
  (given: Opa5, when: JourneyWhen, then: JourneyThen) => {
    given.iStartMyAppInAFrame({
      source: JOURNEY_PAGE.SHELL_HOME,
      autoWait: true,
      timeout: 120,
    });
    when.onTheTransactionsList.writeAddressHash(JOURNEY_PAGE.LIST_HASH);
    when.onTheTransactionsList.clearFilters();
    when.onTheTransactionsList.openRowByDescription(
      JOURNEY_SEED.DOLLAR_SPLIT_PADEL_DESCRIPTION,
    );
    then.onTheTransactionsList.checkRecordHeaderStatus(
      JOURNEY_RECORD.SEP_ID,
      JOURNEY_HEADER_STATUS.USER_CORRECTED,
    );

    when.onTheTransactionsList.navigateBackInBrowser();

    then.onTheTransactionsList.checkListShownAtHash(JOURNEY_PAGE.LIST_HASH);
    then.iTeardownMyAppFrame();
  },
);
