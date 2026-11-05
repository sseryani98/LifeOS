/// <reference types="qunit" />
import CategorizationActions from "com/financialplanner/transactions/ext/CategorizationActions";
import { copyControllerAsFe } from "com/lifeos/shared/test/support/sharedFakes";

import {
  APPLY_INPUT,
  EXISTING_SPLIT,
  EXISTING_SPLIT_SEED,
  FIELD_STATE,
  FRAGMENT_NAME,
  PERCENT_SWEEP,
  REFUSAL_TEXT,
  SERVICE_FAILURE,
  SPLIT_EXPECTED,
  SPLIT_INPUT,
  SUGGESTED_SEED,
  SUGGESTED_SPLIT_EXPECTED,
  SUGGESTION,
  TRANSACTION_ID,
  TAXONOMY_ID,
} from "../data/constants";
import {
  buildFakePage,
  buildPressInside,
  buildTwoDecimalPercents,
  enterDialogInput,
  stubCollaborators,
} from "../support/transactionActionsFakes";
import type { CollaboratorStubs, FakeDialog, FakePage } from "../support/types";

const state: {
  actions: CategorizationActions;
  page: FakePage;
  stubs: CollaboratorStubs;
} = {
  actions: undefined as unknown as CategorizationActions,
  page: undefined as unknown as FakePage,
  stubs: undefined as unknown as CollaboratorStubs,
};

const useFreshActions = (hooks: NestedHooks): void => {
  hooks.beforeEach(() => {
    state.stubs = stubCollaborators();
    state.page = buildFakePage();
    state.actions = new CategorizationActions(state.page.api);
  });
  hooks.afterEach(() => {
    state.stubs.restore();
  });
};

const openApplyDialogFor = async (
  ids: readonly string[],
): Promise<FakeDialog> => {
  state.page.select(ids);
  await state.actions.openApplyDialog();
  return state.page.dialogs.get(FRAGMENT_NAME.APPLY_CATEGORIES) as FakeDialog;
};

const readFieldState = (
  dialog: FakeDialog,
  modelName: string,
  field: string,
): { state: unknown; text: unknown } => {
  const model = dialog.getModel(modelName);
  return {
    state: model?.getProperty(`/${field}State`),
    text: model?.getProperty(`/${field}StateText`),
  };
};

QUnit.module("CategorizationActions", hooks => {
  useFreshActions(hooks);

  /** The handler module looks the instance up per press; a fresh one would reload the fragment and collide on its id. */
  QUnit.test(
    "resolveForPage returns one instance per page across toolbar presses",
    assert => {
      assert.strictEqual(
        CategorizationActions.resolveForPage(state.page.api),
        CategorizationActions.resolveForPage(state.page.api),
      );
    },
  );

  /** Two pages must not share an instance, or one page's dialog would act on the other's selection. */
  QUnit.test("resolveForPage gives another page its own instance", assert => {
    assert.notStrictEqual(
      CategorizationActions.resolveForPage(state.page.api),
      CategorizationActions.resolveForPage(buildFakePage().api),
    );
  });
});

QUnit.module("CategorizationActions — Re-categorize", hooks => {
  useFreshActions(hooks);

  /** Re-categorize runs on the rows the user selected — every one, so the backend decides which to skip. */
  QUnit.test(
    "sends every selected row id to the re-categorize action",
    async assert => {
      state.page.select([TRANSACTION_ID.COFFEE, TRANSACTION_ID.GROCERIES]);

      await state.actions.runReCategorization();

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

      await state.actions.runReCategorization();

      assert.deepEqual(state.stubs.calls.warnings, ["msgNoSelection"]);
      assert.deepEqual(state.stubs.calls.reCategorized, []);
    },
  );

  /** The user is told the re-run happened only once the backend has finished it. */
  QUnit.test(
    "confirms with a toast after the re-run completes",
    async assert => {
      state.page.select([TRANSACTION_ID.COFFEE]);

      await state.actions.runReCategorization();

      assert.deepEqual(state.stubs.calls.toasts, ["msgRecategorized"]);
    },
  );

  /** A rejected re-run must surface as a failure, never as a success toast. */
  QUnit.test(
    "shows no success toast when the re-run is rejected",
    async assert => {
      state.page.select([TRANSACTION_ID.COFFEE]);
      state.stubs.rejectNextServiceCall(SERVICE_FAILURE.MESSAGE);

      const outcome = await state.actions.runReCategorization().then(
        () => "resolved",
        () => "rejected",
      );

      assert.strictEqual(outcome, "rejected");

      assert.deepEqual(state.stubs.calls.toasts, []);
    },
  );
});

QUnit.module("CategorizationActions — Apply Categories", hooks => {
  useFreshActions(hooks);

  /** Bulk apply needs a multi-selection to apply to; with none it must warn, not open. */
  QUnit.test(
    "warns and opens no dialog when no row is selected",
    async assert => {
      state.page.select([]);

      await state.actions.openApplyDialog();

      assert.deepEqual(state.stubs.calls.warnings, ["msgNoSelection"]);
      assert.deepEqual(state.page.loads, []);
    },
  );

  /** FE copies the fragment controller with for…in; a Cancel that misses the instance leaves the dialog stuck open. */
  QUnit.test(
    "loads the Apply Categories fragment with handlers that reach this instance",
    async assert => {
      const dialog = await openApplyDialogFor([TRANSACTION_ID.COFFEE]);
      const handlers = copyControllerAsFe(state.page.loads[0].controller);

      (handlers.onButtonApplyCancelPress as () => void)();

      assert.strictEqual(
        state.page.loads[0].name,
        FRAGMENT_NAME.APPLY_CATEGORIES,
      );
      assert.strictEqual(dialog.closeCount, 1);
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

      assert.deepEqual(state.stubs.calls.bulkApplied, []);
      assert.strictEqual(dialog.closeCount, 0);
    },
  );

  /** Split and Apply worded refusals two ways and only in a modal; both say "not {done}: {reason}" and flag the field the reason names. */
  QUnit.test(
    "refuses a missing vendor in the shared refusal wording and flags the Vendor field",
    async assert => {
      const dialog = await openApplyDialogFor([TRANSACTION_ID.COFFEE]);
      enterDialogInput(dialog, "applyModel", APPLY_INPUT.NO_VENDOR);

      await state.actions.onButtonApplyConfirmPress(buildPressInside(dialog));

      assert.deepEqual(state.stubs.calls.warnings, ["msgApplyRefused"]);
      assert.deepEqual(state.stubs.calls.warningArgs, [
        [REFUSAL_TEXT.VENDOR_REQUIRED],
      ]);
      assert.deepEqual(readFieldState(dialog, "applyModel", "vendor"), {
        state: FIELD_STATE.ERROR,
        text: REFUSAL_TEXT.VENDOR_REQUIRED,
      });
    },
  );

  /** A flag left red after the user picked a vendor would contradict the field it sits on. */
  QUnit.test("clears the Vendor flag once a vendor is chosen", async assert => {
    const dialog = await openApplyDialogFor([TRANSACTION_ID.COFFEE]);
    enterDialogInput(dialog, "applyModel", APPLY_INPUT.NO_VENDOR);
    await state.actions.onButtonApplyConfirmPress(buildPressInside(dialog));
    enterDialogInput(dialog, "applyModel", APPLY_INPUT.VENDOR_ONLY);

    state.actions.onComboBoxVendorSelectionChange(buildPressInside(dialog));

    assert.deepEqual(readFieldState(dialog, "applyModel", "vendor"), {
      state: FIELD_STATE.NONE,
      text: "",
    });
  });

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
        .then(
          () => "resolved",
          () => "rejected",
        );

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

      await CategorizationActions.resolveForPage(
        nextPage.api,
      ).openApplyDialog();

      assert.strictEqual(nextPage.loads.length, 1);
      assert.strictEqual(
        nextPage.loads[0].name,
        FRAGMENT_NAME.APPLY_CATEGORIES,
      );
    },
  );
});
