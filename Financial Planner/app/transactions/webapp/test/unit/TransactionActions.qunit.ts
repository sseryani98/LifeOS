/// <reference types="qunit" />
import TransactionActions from "com/financialplanner/transactions/ext/TransactionActions";

import {
  APPLY_INPUT,
  FRAGMENT_NAME,
  SERVICE_FAILURE,
  SPLIT_EXPECTED,
  SPLIT_INPUT,
  TRANSACTION_ID,
  TAXONOMY_ID,
} from "../data/constants";
import {
  buildFakePage,
  buildPressInside,
  enterDialogInput,
  stubCollaborators,
} from "../support/transactionActionsFakes";
import type {
  CollaboratorStubs,
  FakeDialog,
  FakePage,
} from "../support/types";

const state: {
  actions: TransactionActions;
  page: FakePage;
  stubs: CollaboratorStubs;
} = {
  actions: undefined as unknown as TransactionActions,
  page: undefined as unknown as FakePage,
  stubs: undefined as unknown as CollaboratorStubs,
};

const useFreshActions = (hooks: NestedHooks): void => {
  hooks.beforeEach(() => {
    state.stubs = stubCollaborators();
    state.page = buildFakePage();
    state.actions = new TransactionActions();
  });
  hooks.afterEach(() => {
    state.stubs.restore();
  });
};

const openApplyDialogFor = async (
  ids: readonly string[],
): Promise<FakeDialog> => {
  state.page.select(ids);
  await state.actions.openApplyDialog(state.page.api);
  return state.page.dialogs.get(FRAGMENT_NAME.APPLY_CATEGORIES) as FakeDialog;
};

const openSplitDialogFor = async (rowId: string): Promise<FakeDialog> => {
  state.page.select([rowId]);
  await state.actions.openSplitDialog(state.page.api);
  return state.page.dialogs.get(FRAGMENT_NAME.SPLIT) as FakeDialog;
};

QUnit.module("TransactionActions", hooks => {
  useFreshActions(hooks);

  /** The handler module calls resolveInstance per press; a fresh instance would reload the fragment and collide on its id. */
  QUnit.test(
    "resolveInstance returns one shared instance across toolbar presses",
    assert => {
      assert.strictEqual(
        TransactionActions.resolveInstance(),
        TransactionActions.resolveInstance(),
      );
    },
  );
});

QUnit.module("TransactionActions — Re-categorize", hooks => {
  useFreshActions(hooks);

  /** Re-categorize runs on the rows the user selected — every one, so the backend decides which to skip. */
  QUnit.test(
    "sends every selected row id to the re-categorize action",
    async assert => {
      state.page.select([TRANSACTION_ID.COFFEE, TRANSACTION_ID.GROCERIES]);

      await state.actions.runReCategorization(state.page.api);

      assert.deepEqual(state.stubs.calls.reCategorized, [
        [TRANSACTION_ID.COFFEE, TRANSACTION_ID.GROCERIES],
      ]);
    },
  );

  /** With nothing selected the action must warn rather than fire an empty re-run. */
  QUnit.test(
    "warns and calls nothing when no row is selected",
    async assert => {
      state.page.select([]);

      await state.actions.runReCategorization(state.page.api);

      assert.deepEqual(state.stubs.calls.warnings, ["msgNoSelection"]);
      assert.deepEqual(state.stubs.calls.reCategorized, []);
    },
  );

  /** The user is told the re-run happened only once the backend has finished it. */
  QUnit.test(
    "confirms with a toast after the re-run completes",
    async assert => {
      state.page.select([TRANSACTION_ID.COFFEE]);

      await state.actions.runReCategorization(state.page.api);

      assert.deepEqual(state.stubs.calls.toasts, ["msgRecategorized"]);
    },
  );

  /** A rejected re-run must surface as a failure, never as a success toast. */
  QUnit.test(
    "shows no success toast when the re-run is rejected",
    async assert => {
      state.page.select([TRANSACTION_ID.COFFEE]);
      state.stubs.rejectNextServiceCall(SERVICE_FAILURE.MESSAGE);

      const outcome = await state.actions
        .runReCategorization(state.page.api)
        .then(() => "resolved", () => "rejected");

      assert.strictEqual(outcome, "rejected");

      assert.deepEqual(state.stubs.calls.toasts, []);
    },
  );
});

QUnit.module("TransactionActions — Apply Categories", hooks => {
  useFreshActions(hooks);

  /** Bulk apply needs a multi-selection to apply to; with none it must warn, not open. */
  QUnit.test(
    "warns and opens no dialog when no row is selected",
    async assert => {
      state.page.select([]);

      await state.actions.openApplyDialog(state.page.api);

      assert.deepEqual(state.stubs.calls.warnings, ["msgNoSelection"]);
      assert.deepEqual(state.page.loads, []);
    },
  );

  /** The fragment's confirm/cancel presses resolve only if this instance is its controller. */
  QUnit.test(
    "loads the Apply Categories fragment with itself as controller",
    async assert => {
      const dialog = await openApplyDialogFor([TRANSACTION_ID.COFFEE]);

      assert.strictEqual(state.page.loads.length, 1);
      assert.strictEqual(
        state.page.loads[0].name,
        FRAGMENT_NAME.APPLY_CATEGORIES,
      );
      assert.strictEqual(state.page.loads[0].controller, state.actions);
      assert.strictEqual(dialog.openCount, 1);
    },
  );

  /** Vendor, PT and EC are set once per apply; the dialog must open empty, not with the last run's picks. */
  QUnit.test(
    "opens with empty vendor, purchase type and earning category",
    async assert => {
      const dialog = await openApplyDialogFor([TRANSACTION_ID.COFFEE]);
      enterDialogInput(dialog, "applyModel", APPLY_INPUT.FULL);

      await openApplyDialogFor([TRANSACTION_ID.GROCERIES]);

      assert.deepEqual(dialog.getModel("applyModel")?.getData(), {
        vendor_ID: "",
        purchaseType_ID: "",
        earningCategory_ID: "",
      });
    },
  );

  /** One vendor + PT + EC is applied to every selected row in a single call. */
  QUnit.test(
    "applies the chosen vendor and taxonomy to all selected rows",
    async assert => {
      const dialog = await openApplyDialogFor([
        TRANSACTION_ID.COFFEE,
        TRANSACTION_ID.GROCERIES,
      ]);
      enterDialogInput(dialog, "applyModel", APPLY_INPUT.FULL);

      await state.actions.onButtonApplyConfirmPress(buildPressInside(dialog));

      assert.deepEqual(state.stubs.calls.bulkApplied, [
        [
          [TRANSACTION_ID.COFFEE, TRANSACTION_ID.GROCERIES],
          TAXONOMY_ID.VENDOR_COFFEE_SHOP,
          TAXONOMY_ID.PURCHASE_TYPE_DINING,
          TAXONOMY_ID.EARNING_CATEGORY_DINING,
        ],
      ]);
    },
  );

  /** An unpicked PT or EC must reach the action as null; an empty string is not a valid key. */
  QUnit.test(
    "sends an unpicked purchase type and earning category as null",
    async assert => {
      const dialog = await openApplyDialogFor([TRANSACTION_ID.COFFEE]);
      enterDialogInput(dialog, "applyModel", APPLY_INPUT.VENDOR_ONLY);

      await state.actions.onButtonApplyConfirmPress(buildPressInside(dialog));

      assert.deepEqual(state.stubs.calls.bulkApplied, [
        [[TRANSACTION_ID.COFFEE], TAXONOMY_ID.VENDOR_COFFEE_SHOP, null, null],
      ]);
    },
  );

  /** Applying with no vendor would blank the vendor on every selected row; it must be refused. */
  QUnit.test(
    "refuses to apply without a vendor and keeps the dialog open",
    async assert => {
      const dialog = await openApplyDialogFor([TRANSACTION_ID.COFFEE]);
      enterDialogInput(dialog, "applyModel", APPLY_INPUT.NO_VENDOR);

      await state.actions.onButtonApplyConfirmPress(buildPressInside(dialog));

      assert.deepEqual(state.stubs.calls.warnings, ["msgVendorRequired"]);
      assert.deepEqual(state.stubs.calls.bulkApplied, []);
      assert.strictEqual(dialog.closeCount, 0);
    },
  );

  /** After a successful apply the dialog closes and the user is told it landed. */
  QUnit.test(
    "closes the dialog and confirms once the categories are applied",
    async assert => {
      const dialog = await openApplyDialogFor([TRANSACTION_ID.COFFEE]);
      enterDialogInput(dialog, "applyModel", APPLY_INPUT.FULL);

      await state.actions.onButtonApplyConfirmPress(buildPressInside(dialog));

      assert.strictEqual(dialog.closeCount, 1);
      assert.deepEqual(state.stubs.calls.toasts, ["msgCategoriesApplied"]);
    },
  );

  /** A rejected apply must leave the dialog open with the user's picks, and claim no success. */
  QUnit.test(
    "keeps the dialog open and shows no toast when the apply is rejected",
    async assert => {
      const dialog = await openApplyDialogFor([TRANSACTION_ID.COFFEE]);
      enterDialogInput(dialog, "applyModel", APPLY_INPUT.FULL);
      state.stubs.rejectNextServiceCall(SERVICE_FAILURE.MESSAGE);

      const outcome = await state.actions
        .onButtonApplyConfirmPress(buildPressInside(dialog))
        .then(() => "resolved", () => "rejected");

      assert.strictEqual(outcome, "rejected");

      assert.strictEqual(dialog.closeCount, 0);
      assert.deepEqual(state.stubs.calls.toasts, []);
    },
  );

  /** Cancel discards the picks: the dialog closes and nothing is applied. */
  QUnit.test("cancel closes the dialog without applying", async assert => {
    const dialog = await openApplyDialogFor([TRANSACTION_ID.COFFEE]);

    state.actions.onButtonApplyCancelPress();

    assert.strictEqual(dialog.closeCount, 1);
    assert.deepEqual(state.stubs.calls.bulkApplied, []);
  });

  /** A dialog cached from a previous page instance would apply against that page's stale selection. */
  QUnit.test(
    "loads the dialog afresh through a new page instance",
    async assert => {
      await openApplyDialogFor([TRANSACTION_ID.COFFEE]);
      const nextPage = buildFakePage();
      nextPage.select([TRANSACTION_ID.GROCERIES]);

      await state.actions.openApplyDialog(nextPage.api);

      assert.strictEqual(nextPage.loads.length, 1);
      assert.strictEqual(
        nextPage.loads[0].name,
        FRAGMENT_NAME.APPLY_CATEGORIES,
      );
    },
  );
});

QUnit.module("TransactionActions — Split", hooks => {
  useFreshActions(hooks);

  /** A split is one transaction's share; with no row there is nothing to split. */
  QUnit.test(
    "warns and opens no dialog when no row is selected",
    async assert => {
      state.page.select([]);

      await state.actions.openSplitDialog(state.page.api);

      assert.deepEqual(state.stubs.calls.warnings, ["msgSplitOneRow"]);
      assert.deepEqual(state.page.loads, []);
    },
  );

  /** Split terms belong to one transaction; a multi-selection must not open the dialog. */
  QUnit.test(
    "warns and opens no dialog when several rows are selected",
    async assert => {
      state.page.select([TRANSACTION_ID.COFFEE, TRANSACTION_ID.PADEL]);

      await state.actions.openSplitDialog(state.page.api);

      assert.deepEqual(state.stubs.calls.warnings, ["msgSplitOneRow"]);
      assert.deepEqual(state.page.loads, []);
    },
  );

  /** The fragment's save/cancel presses resolve only if this instance is its controller. */
  QUnit.test(
    "loads the Split fragment with itself as controller",
    async assert => {
      const dialog = await openSplitDialogFor(TRANSACTION_ID.PADEL);

      assert.strictEqual(state.page.loads[0].name, FRAGMENT_NAME.SPLIT);
      assert.strictEqual(state.page.loads[0].controller, state.actions);
      assert.strictEqual(dialog.openCount, 1);
    },
  );

  /** The dialog offers share %, share amount, description and recurring — opening blank, recurring off. */
  QUnit.test(
    "opens with the four split fields blank and recurring off",
    async assert => {
      const dialog = await openSplitDialogFor(TRANSACTION_ID.PADEL);

      assert.deepEqual(dialog.getModel("splitModel")?.getData(), {
        mySharePct: null,
        myShareAmount: null,
        splitDescription: "",
        isRecurring: false,
      });
    },
  );

  /** The user types 0–100; the backend stores a 0–1 fraction, so 25 must arrive as 0.25. */
  QUnit.test(
    "saves an entered percentage share as a fraction of the selected row",
    async assert => {
      const dialog = await openSplitDialogFor(TRANSACTION_ID.PADEL);
      enterDialogInput(dialog, "splitModel", SPLIT_INPUT.PERCENT_SHARE);

      await state.actions.onButtonSplitConfirmPress(buildPressInside(dialog));

      assert.deepEqual(state.stubs.calls.splits, [
        [
          TRANSACTION_ID.PADEL,
          SPLIT_EXPECTED.PERCENT_FRACTION,
          null,
          "Padel with friends",
          true,
        ],
      ]);
    },
  );

  /** Amount and percentage are either/or; an amount-only split sends a null percentage and a number. */
  QUnit.test(
    "saves an entered amount share with no percentage or description",
    async assert => {
      const dialog = await openSplitDialogFor(TRANSACTION_ID.PADEL);
      enterDialogInput(dialog, "splitModel", SPLIT_INPUT.AMOUNT_SHARE);

      await state.actions.onButtonSplitConfirmPress(buildPressInside(dialog));

      assert.deepEqual(state.stubs.calls.splits, [
        [TRANSACTION_ID.PADEL, null, SPLIT_EXPECTED.AMOUNT, null, false],
      ]);
    },
  );

  /** A 0% share is a real entry; a truthiness check would drop it to null and lose the split. */
  QUnit.test(
    "saves a zero percentage share as 0, not as empty",
    async assert => {
      const dialog = await openSplitDialogFor(TRANSACTION_ID.PADEL);
      enterDialogInput(dialog, "splitModel", SPLIT_INPUT.ZERO_PERCENT_SHARE);

      await state.actions.onButtonSplitConfirmPress(buildPressInside(dialog));

      assert.strictEqual(state.stubs.calls.splits[0][1], 0);
    },
  );

  /** After a successful save the dialog closes and the user is told it landed. */
  QUnit.test(
    "closes the dialog and confirms once the split is saved",
    async assert => {
      const dialog = await openSplitDialogFor(TRANSACTION_ID.PADEL);
      enterDialogInput(dialog, "splitModel", SPLIT_INPUT.PERCENT_SHARE);

      await state.actions.onButtonSplitConfirmPress(buildPressInside(dialog));

      assert.strictEqual(dialog.closeCount, 1);
      assert.deepEqual(state.stubs.calls.toasts, ["msgSplitSaved"]);
    },
  );

  /** A rejected save must leave the dialog open with the user's terms, and claim no success. */
  QUnit.test(
    "keeps the dialog open and shows no toast when the save is rejected",
    async assert => {
      const dialog = await openSplitDialogFor(TRANSACTION_ID.PADEL);
      enterDialogInput(dialog, "splitModel", SPLIT_INPUT.PERCENT_SHARE);
      state.stubs.rejectNextServiceCall(SERVICE_FAILURE.MESSAGE);

      const outcome = await state.actions
        .onButtonSplitConfirmPress(buildPressInside(dialog))
        .then(() => "resolved", () => "rejected");

      assert.strictEqual(outcome, "rejected");

      assert.strictEqual(dialog.closeCount, 0);
      assert.deepEqual(state.stubs.calls.toasts, []);
    },
  );

  /** With no transaction chosen through the Split action, a save has no target and must do nothing. */
  QUnit.test(
    "saves nothing when no transaction was chosen for the split",
    async assert => {
      const dialog = await openApplyDialogFor([TRANSACTION_ID.COFFEE]);

      await state.actions.onButtonSplitConfirmPress(buildPressInside(dialog));

      assert.deepEqual(state.stubs.calls.splits, []);
    },
  );

  /** Cancel discards the terms: the dialog closes and nothing is saved. */
  QUnit.test("cancel closes the dialog without saving", async assert => {
    const dialog = await openSplitDialogFor(TRANSACTION_ID.PADEL);

    state.actions.onButtonSplitCancelPress();

    assert.strictEqual(dialog.closeCount, 1);
    assert.deepEqual(state.stubs.calls.splits, []);
  });
});
