/// <reference types="qunit" />
import SplitActions from "com/financialplanner/transactions/ext/SplitActions";
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
  buildFakeDialog,
  buildFakePage,
  buildPressInside,
  buildTwoDecimalPercents,
  enterDialogInput,
  stubCollaborators,
} from "../support/transactionActionsFakes";
import type { CollaboratorStubs, FakeDialog, FakePage } from "../support/types";

const state: {
  actions: SplitActions;
  page: FakePage;
  stubs: CollaboratorStubs;
} = {
  actions: undefined as unknown as SplitActions,
  page: undefined as unknown as FakePage,
  stubs: undefined as unknown as CollaboratorStubs,
};

const useFreshActions = (hooks: NestedHooks): void => {
  hooks.beforeEach(() => {
    state.stubs = stubCollaborators();
    state.page = buildFakePage();
    state.actions = new SplitActions(state.page.api);
  });
  hooks.afterEach(() => {
    state.stubs.restore();
  });
};

const openSplitDialogFor = async (rowId: string): Promise<FakeDialog> => {
  state.page.select([rowId]);
  await state.actions.openSplitDialog();
  return state.page.dialogs.get(FRAGMENT_NAME.SPLIT) as FakeDialog;
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

QUnit.module("SplitActions", hooks => {
  useFreshActions(hooks);

  /** The handler module looks the instance up per press; a fresh one would reload the fragment and collide on its id. */
  QUnit.test(
    "resolveForPage returns one instance per page across toolbar presses",
    assert => {
      assert.strictEqual(
        SplitActions.resolveForPage(state.page.api),
        SplitActions.resolveForPage(state.page.api),
      );
    },
  );

  /** Two pages must not share the split in progress, or one page's dialog would act on the other's selection. */
  QUnit.test("resolveForPage gives another page its own instance", assert => {
    assert.notStrictEqual(
      SplitActions.resolveForPage(state.page.api),
      SplitActions.resolveForPage(buildFakePage().api),
    );
  });
});

QUnit.module("SplitActions — Split", hooks => {
  useFreshActions(hooks);

  /** A split is one transaction's share; with no row there is nothing to split. */
  QUnit.test(
    "warns and opens no dialog when no row is selected",
    async assert => {
      state.page.select([]);

      await state.actions.openSplitDialog();

      assert.deepEqual(state.stubs.calls.warnings, ["msgSplitOneRow"]);
      assert.deepEqual(state.page.loads, []);
    },
  );

  /** Split terms belong to one transaction; a multi-selection must not open the dialog. */
  QUnit.test(
    "warns and opens no dialog when several rows are selected",
    async assert => {
      state.page.select([TRANSACTION_ID.COFFEE, TRANSACTION_ID.PADEL]);

      await state.actions.openSplitDialog();

      assert.deepEqual(state.stubs.calls.warnings, ["msgSplitOneRow"]);
      assert.deepEqual(state.page.loads, []);
    },
  );

  /** FE copies the fragment controller with for…in; a Save that misses the instance silently saves nothing. */
  QUnit.test(
    "loads the Split fragment with handlers that reach this instance",
    async assert => {
      const dialog = await openSplitDialogFor(TRANSACTION_ID.PADEL);
      enterDialogInput(dialog, "splitModel", SPLIT_INPUT.PERCENT_SHARE);
      const handlers = copyControllerAsFe(state.page.loads[0].controller);

      await (
        handlers.onButtonSplitConfirmPress as (event: unknown) => Promise<void>
      )(buildPressInside(dialog));

      assert.strictEqual(state.page.loads[0].name, FRAGMENT_NAME.SPLIT);
      assert.strictEqual(state.stubs.calls.splits.length, 1);
    },
  );

  /** With no recurring template for the row's vendor there is nothing to suggest, so the four fields open blank, recurring off. */
  QUnit.test(
    "opens blank with recurring off when the row has no suggestion",
    async assert => {
      const dialog = await openSplitDialogFor(TRANSACTION_ID.PADEL);

      assert.deepEqual(state.stubs.calls.suggestions, [TRANSACTION_ID.PADEL]);
      assert.deepEqual(dialog.getModel("splitModel")?.getData(), {
        mySharePct: null,
        myShareAmount: null,
        splitDescription: "",
        isRecurring: false,
      });
    },
  );

  /** A percentage template is offered as its 0–100 share beside the amount recomputed on this row, recurring kept on. */
  QUnit.test(
    "opens pre-populated with a percentage-based recurring suggestion",
    async assert => {
      state.stubs.setSuggestion({ ...SUGGESTION.PERCENT_BASED });

      const dialog = await openSplitDialogFor(TRANSACTION_ID.PADEL);

      assert.deepEqual(dialog.getModel("splitModel")?.getData(), {
        ...SUGGESTED_SEED.PERCENT_BASED,
      });
    },
  );

  /** A Decimal(5,4) share such as 0.07 times 100 is 7.000000000000001 in floating point; unrounded, that noise shows in the field and is saved back. */
  QUnit.test(
    "rounds a suggested percentage to two decimals when seeding the dialog",
    async assert => {
      state.stubs.setSuggestion({ ...SUGGESTION.PERCENT_FLOAT_NOISE });

      const dialog = await openSplitDialogFor(TRANSACTION_ID.PADEL);

      assert.deepEqual(dialog.getModel("splitModel")?.getData(), {
        ...SUGGESTED_SEED.PERCENT_FLOAT_NOISE,
      });
    },
  );

  /** A dollar template keeps its fixed amount and leaves the percentage empty, so confirming sends one share form. */
  QUnit.test(
    "opens pre-populated with a dollar-based recurring suggestion and no percentage",
    async assert => {
      state.stubs.setSuggestion({ ...SUGGESTION.DOLLAR_BASED });

      const dialog = await openSplitDialogFor(TRANSACTION_ID.PADEL);

      assert.deepEqual(dialog.getModel("splitModel")?.getData(), {
        ...SUGGESTED_SEED.DOLLAR_BASED,
      });
    },
  );

  /** The suggestion is optional; a failed lookup must never stop the user splitting by hand. */
  QUnit.test(
    "still opens blank when the suggestion lookup fails",
    async assert => {
      state.stubs.rejectSuggestion(SERVICE_FAILURE.MESSAGE);

      const dialog = await openSplitDialogFor(TRANSACTION_ID.PADEL);

      assert.deepEqual(state.stubs.calls.suggestions, [TRANSACTION_ID.PADEL]);
      assert.strictEqual(dialog.openCount, 1);
      assert.deepEqual(dialog.getModel("splitModel")?.getData(), {
        mySharePct: null,
        myShareAmount: null,
        splitDescription: "",
        isRecurring: false,
      });
    },
  );

  /** A re-split opened blank and its save replaced the row, silently dropping the description and the recurring flag; the row's own terms come first. */
  QUnit.test(
    "opens a re-split pre-populated with the row's existing split, ahead of any suggestion",
    async assert => {
      state.stubs.setExistingSplit({ ...EXISTING_SPLIT.PERCENT_BASED });
      state.stubs.setSuggestion({ ...SUGGESTION.DOLLAR_BASED });

      const dialog = await openSplitDialogFor(TRANSACTION_ID.PADEL);

      assert.deepEqual(state.stubs.calls.existingSplits, [
        TRANSACTION_ID.PADEL,
      ]);
      assert.deepEqual(dialog.getModel("splitModel")?.getData(), {
        ...EXISTING_SPLIT_SEED.PERCENT_BASED,
      });
    },
  );

  /** Saving a re-split without changes must lose nothing: the same share form, description and recurring flag go back. */
  QUnit.test(
    "confirming an untouched re-split saves the existing terms",
    async assert => {
      state.stubs.setExistingSplit({ ...EXISTING_SPLIT.PERCENT_BASED });
      const dialog = await openSplitDialogFor(TRANSACTION_ID.PADEL);

      await state.actions.onButtonSplitConfirmPress(buildPressInside(dialog));

      assert.deepEqual(state.stubs.calls.splits, [
        [TRANSACTION_ID.PADEL, 0.2, null, "Padel with friends", false],
      ]);
    },
  );

  /** A recurring split is suggested, never auto-applied: opening the dialog must save nothing until the user confirms. */
  QUnit.test(
    "saves nothing when the dialog opens with a suggestion",
    async assert => {
      state.stubs.setSuggestion({ ...SUGGESTION.PERCENT_BASED });

      await openSplitDialogFor(TRANSACTION_ID.PADEL);

      assert.deepEqual(state.stubs.calls.suggestions, [TRANSACTION_ID.PADEL]);
      assert.deepEqual(state.stubs.calls.splits, []);
      assert.deepEqual(state.stubs.calls.toasts, []);
    },
  );

  /** The backend accepts exactly one share form; an untouched percentage suggestion must save as its percentage, or the template's terms are lost or rejected. */
  QUnit.test(
    "confirming an untouched percentage suggestion saves the percentage alone",
    async assert => {
      state.stubs.setSuggestion({ ...SUGGESTION.PERCENT_BASED });
      const dialog = await openSplitDialogFor(TRANSACTION_ID.PADEL);

      await state.actions.onButtonSplitConfirmPress(buildPressInside(dialog));

      assert.deepEqual(state.stubs.calls.splits, [
        [
          TRANSACTION_ID.PADEL,
          SUGGESTED_SPLIT_EXPECTED.PERCENT_FRACTION,
          null,
          "Padel with friends",
          true,
        ],
      ]);
    },
  );

  /** An untouched dollar suggestion saves its fixed amount, with no percentage, still recurring. */
  QUnit.test(
    "confirming an untouched dollar suggestion saves the amount alone",
    async assert => {
      state.stubs.setSuggestion({ ...SUGGESTION.DOLLAR_BASED });
      const dialog = await openSplitDialogFor(TRANSACTION_ID.PADEL);

      await state.actions.onButtonSplitConfirmPress(buildPressInside(dialog));

      assert.deepEqual(state.stubs.calls.splits, [
        [
          TRANSACTION_ID.PADEL,
          null,
          SUGGESTED_SPLIT_EXPECTED.AMOUNT,
          "Court booking share",
          true,
        ],
      ]);
    },
  );

  /** A suggestion seeds both shares; an edited amount kept the stale percentage on screen and the save dropped it unseen, so the edit must clear it visibly. */
  QUnit.test(
    "clears the percentage when the amount is edited on a percentage suggestion",
    async assert => {
      state.stubs.setSuggestion({ ...SUGGESTION.PERCENT_BASED });
      const dialog = await openSplitDialogFor(TRANSACTION_ID.PADEL);
      enterDialogInput(
        dialog,
        "splitModel",
        SPLIT_INPUT.AMOUNT_EDITED_ON_PERCENT_SUGGESTION,
      );

      state.actions.onInputSplitAmountChange(buildPressInside(dialog));

      assert.strictEqual(
        dialog.getModel("splitModel")?.getProperty("/mySharePct"),
        null,
      );
      assert.strictEqual(
        dialog.getModel("splitModel")?.getProperty("/myShareAmount"),
        "30",
      );
    },
  );

  /** The fresh dialog must behave as the suggestion one does: an amount typed after a percentage replaces it on screen, as the object page does. */
  QUnit.test(
    "clears the percentage when the amount is edited on a fresh dialog",
    async assert => {
      const dialog = await openSplitDialogFor(TRANSACTION_ID.PADEL);
      enterDialogInput(dialog, "splitModel", SPLIT_INPUT.BOTH_SHARES);

      state.actions.onInputSplitAmountChange(buildPressInside(dialog));

      assert.strictEqual(
        dialog.getModel("splitModel")?.getProperty("/mySharePct"),
        null,
      );
    },
  );

  /** Once the edit has cleared the percentage, what the user sees is what is saved: the amount alone. */
  QUnit.test(
    "confirming an edited amount on a percentage suggestion saves the amount alone",
    async assert => {
      state.stubs.setSuggestion({ ...SUGGESTION.PERCENT_BASED });
      const dialog = await openSplitDialogFor(TRANSACTION_ID.PADEL);
      enterDialogInput(
        dialog,
        "splitModel",
        SPLIT_INPUT.AMOUNT_EDITED_ON_PERCENT_SUGGESTION,
      );
      state.actions.onInputSplitAmountChange(buildPressInside(dialog));

      await state.actions.onButtonSplitConfirmPress(buildPressInside(dialog));

      assert.deepEqual(state.stubs.calls.splits, [
        [
          TRANSACTION_ID.PADEL,
          null,
          SPLIT_EXPECTED.EDITED_AMOUNT,
          "Padel with friends",
          true,
        ],
      ]);
    },
  );

  /** A percentage edit left the seeded amount stale on screen; the amount must show what the percentage yields on this row, as the object page does. */
  QUnit.test(
    "recomputes the amount from an edited percentage on a percentage suggestion",
    async assert => {
      state.stubs.setSuggestion({ ...SUGGESTION.PERCENT_BASED });
      const dialog = await openSplitDialogFor(TRANSACTION_ID.PADEL);
      enterDialogInput(
        dialog,
        "splitModel",
        SPLIT_INPUT.PERCENT_EDITED_ON_PERCENT_SUGGESTION,
      );

      state.actions.onInputSplitPercentChange(buildPressInside(dialog));

      assert.strictEqual(
        dialog.getModel("splitModel")?.getProperty("/myShareAmount"),
        SPLIT_EXPECTED.AMOUNT_AT_EDITED_PERCENT,
      );
    },
  );

  /** The fresh dialog recomputes too, so both paths show the amount a percentage will save. */
  QUnit.test(
    "recomputes the amount from an entered percentage on a fresh dialog",
    async assert => {
      const dialog = await openSplitDialogFor(TRANSACTION_ID.PADEL);
      enterDialogInput(dialog, "splitModel", SPLIT_INPUT.PERCENT_SHARE);

      state.actions.onInputSplitPercentChange(buildPressInside(dialog));

      assert.strictEqual(
        dialog.getModel("splitModel")?.getProperty("/myShareAmount"),
        SPLIT_EXPECTED.AMOUNT_AT_PERCENT_SHARE,
      );
    },
  );

  /** The recomputed amount is derived, not a second share form; sending it beside the percentage would be refused as both. */
  QUnit.test(
    "confirming an edited percentage on a percentage suggestion saves the new percentage alone",
    async assert => {
      state.stubs.setSuggestion({ ...SUGGESTION.PERCENT_BASED });
      const dialog = await openSplitDialogFor(TRANSACTION_ID.PADEL);
      enterDialogInput(
        dialog,
        "splitModel",
        SPLIT_INPUT.PERCENT_EDITED_ON_PERCENT_SUGGESTION,
      );
      state.actions.onInputSplitPercentChange(buildPressInside(dialog));

      await state.actions.onButtonSplitConfirmPress(buildPressInside(dialog));

      assert.deepEqual(state.stubs.calls.splits, [
        [
          TRANSACTION_ID.PADEL,
          SPLIT_EXPECTED.EDITED_PERCENT_FRACTION,
          null,
          "Padel with friends",
          true,
        ],
      ]);
    },
  );

  /** A fresh dialog's percentage recomputes the amount, and the save still sends the percentage alone. */
  QUnit.test(
    "confirming a fresh percentage after it recomputed the amount saves the percentage alone",
    async assert => {
      const dialog = await openSplitDialogFor(TRANSACTION_ID.PADEL);
      enterDialogInput(dialog, "splitModel", SPLIT_INPUT.PERCENT_SHARE);
      state.actions.onInputSplitPercentChange(buildPressInside(dialog));

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

  /** The suggestion path silently dropped a percentage that disagreed with the amount; the pair goes through so the backend refuses it visibly, as on a fresh dialog. */
  QUnit.test(
    "forwards both share forms on a suggestion when they disagree, as a fresh dialog does",
    async assert => {
      state.stubs.setSuggestion({ ...SUGGESTION.PERCENT_BASED });
      const dialog = await openSplitDialogFor(TRANSACTION_ID.PADEL);
      enterDialogInput(
        dialog,
        "splitModel",
        SPLIT_INPUT.AMOUNT_EDITED_ON_PERCENT_SUGGESTION,
      );

      await state.actions.onButtonSplitConfirmPress(buildPressInside(dialog));

      assert.deepEqual(state.stubs.calls.splits, [
        [
          TRANSACTION_ID.PADEL,
          SPLIT_EXPECTED.SUGGESTED_PERCENT_FRACTION,
          SPLIT_EXPECTED.EDITED_AMOUNT,
          "Padel with friends",
          true,
        ],
      ]);
    },
  );

  /** The amount column is Decimal(15,2); a third decimal reached CAP and came back as its raw type error, so the dialog refuses it in the user's words. */
  QUnit.test(
    "refuses an amount with more than two decimals with a warning, saving nothing",
    async assert => {
      const dialog = await openSplitDialogFor(TRANSACTION_ID.PADEL);
      enterDialogInput(dialog, "splitModel", SPLIT_INPUT.THREE_DECIMAL_AMOUNT);

      await state.actions.onButtonSplitConfirmPress(buildPressInside(dialog));

      assert.deepEqual(state.stubs.calls.splits, []);
      assert.deepEqual(state.stubs.calls.warnings, ["msgSplitRefused"]);
      assert.deepEqual(state.stubs.calls.warningArgs, [
        [REFUSAL_TEXT.AMOUNT_DECIMALS],
      ]);
      assert.deepEqual(readFieldState(dialog, "splitModel", "myShareAmount"), {
        state: FIELD_STATE.ERROR,
        text: REFUSAL_TEXT.AMOUNT_DECIMALS,
      });
      assert.strictEqual(dialog.closeCount, 0);
    },
  );

  /** The share column is Decimal(5,4), so a % past two decimals reached CAP and came back as its raw type error; the dialog refuses it in the user's words. */
  QUnit.test(
    "refuses a percentage with more than two decimals with a warning, saving nothing",
    async assert => {
      const dialog = await openSplitDialogFor(TRANSACTION_ID.PADEL);
      enterDialogInput(dialog, "splitModel", SPLIT_INPUT.THREE_DECIMAL_PERCENT);

      await state.actions.onButtonSplitConfirmPress(buildPressInside(dialog));

      assert.deepEqual(state.stubs.calls.splits, []);
      assert.deepEqual(state.stubs.calls.warnings, ["msgSplitRefused"]);
      assert.deepEqual(state.stubs.calls.warningArgs, [
        [REFUSAL_TEXT.PERCENT_DECIMALS],
      ]);
      assert.deepEqual(readFieldState(dialog, "splitModel", "mySharePct"), {
        state: FIELD_STATE.ERROR,
        text: REFUSAL_TEXT.PERCENT_DECIMALS,
      });
      assert.strictEqual(dialog.closeCount, 0);
    },
  );

  /** 150% recomputed a 180.00 share of a 120.00 charge and stayed unflagged; an out-of-range % must be flagged on its field and yield no amount. */
  QUnit.test(
    "flags an out-of-range percentage on its field and computes no amount from it",
    async assert => {
      const dialog = await openSplitDialogFor(TRANSACTION_ID.PADEL);
      enterDialogInput(dialog, "splitModel", SPLIT_INPUT.OVER_HUNDRED_PERCENT);

      state.actions.onInputSplitPercentChange(buildPressInside(dialog));

      assert.deepEqual(readFieldState(dialog, "splitModel", "mySharePct"), {
        state: FIELD_STATE.ERROR,
        text: REFUSAL_TEXT.PERCENT_RANGE,
      });
      assert.strictEqual(
        dialog.getModel("splitModel")?.getProperty("/myShareAmount"),
        null,
      );
    },
  );

  /** A negative share is outside 0–100 too; it must not yield a negative amount. */
  QUnit.test("flags a negative percentage on its field", async assert => {
    const dialog = await openSplitDialogFor(TRANSACTION_ID.PADEL);
    enterDialogInput(dialog, "splitModel", SPLIT_INPUT.NEGATIVE_PERCENT);

    state.actions.onInputSplitPercentChange(buildPressInside(dialog));

    assert.strictEqual(
      readFieldState(dialog, "splitModel", "mySharePct").state,
      FIELD_STATE.ERROR,
    );
    assert.strictEqual(
      dialog.getModel("splitModel")?.getProperty("/myShareAmount"),
      null,
    );
  });

  /** The range is checked in the dialog, so the refusal reads like the others and the backend is never asked. */
  QUnit.test(
    "refuses an out-of-range percentage on save in the shared wording, saving nothing",
    async assert => {
      const dialog = await openSplitDialogFor(TRANSACTION_ID.PADEL);
      enterDialogInput(dialog, "splitModel", SPLIT_INPUT.OVER_HUNDRED_PERCENT);

      await state.actions.onButtonSplitConfirmPress(buildPressInside(dialog));

      assert.deepEqual(state.stubs.calls.splits, []);
      assert.deepEqual(state.stubs.calls.warnings, ["msgSplitRefused"]);
      assert.deepEqual(state.stubs.calls.warningArgs, [
        [REFUSAL_TEXT.PERCENT_RANGE],
      ]);
      assert.strictEqual(
        readFieldState(dialog, "splitModel", "mySharePct").state,
        FIELD_STATE.ERROR,
      );
    },
  );

  /** Once the user corrects the percentage, the old flag must go and the amount must follow the valid value. */
  QUnit.test(
    "clears the percentage flag and recomputes once the percentage is valid",
    async assert => {
      const dialog = await openSplitDialogFor(TRANSACTION_ID.PADEL);
      enterDialogInput(dialog, "splitModel", SPLIT_INPUT.OVER_HUNDRED_PERCENT);
      state.actions.onInputSplitPercentChange(buildPressInside(dialog));
      enterDialogInput(dialog, "splitModel", SPLIT_INPUT.PERCENT_SHARE);

      state.actions.onInputSplitPercentChange(buildPressInside(dialog));

      assert.deepEqual(readFieldState(dialog, "splitModel", "mySharePct"), {
        state: FIELD_STATE.NONE,
        text: "",
      });
      assert.strictEqual(
        dialog.getModel("splitModel")?.getProperty("/myShareAmount"),
        SPLIT_EXPECTED.AMOUNT_AT_PERCENT_SHARE,
      );
    },
  );

  /** A server refusal that names a field must flag that field, as the dialog's own checks do. */
  QUnit.test("flags the field a server refusal targets", async assert => {
    const dialog = await openSplitDialogFor(TRANSACTION_ID.PADEL);
    enterDialogInput(dialog, "splitModel", SPLIT_INPUT.AMOUNT_SHARE);
    state.stubs.rejectNextServiceCall(
      SERVICE_FAILURE.AMOUNT_TOO_HIGH,
      SERVICE_FAILURE.AMOUNT_TARGET,
    );

    await state.actions.onButtonSplitConfirmPress(buildPressInside(dialog));

    assert.deepEqual(readFieldState(dialog, "splitModel", "myShareAmount"), {
      state: FIELD_STATE.ERROR,
      text: SERVICE_FAILURE.AMOUNT_TOO_HIGH,
    });
    assert.deepEqual(state.stubs.calls.warningArgs, [
      [SERVICE_FAILURE.AMOUNT_TOO_HIGH],
    ]);
  });

  /** With no suggestion to arbitrate, both typed shares go through so the backend refuses the pair rather than the UI silently dropping one. */
  QUnit.test(
    "forwards both share forms when the user enters both, so the backend can refuse them",
    async assert => {
      const dialog = await openSplitDialogFor(TRANSACTION_ID.PADEL);
      enterDialogInput(dialog, "splitModel", SPLIT_INPUT.BOTH_SHARES);

      await state.actions.onButtonSplitConfirmPress(buildPressInside(dialog));

      assert.deepEqual(state.stubs.calls.splits, [
        [
          TRANSACTION_ID.PADEL,
          SPLIT_EXPECTED.PERCENT_FRACTION,
          SPLIT_EXPECTED.AMOUNT,
          null,
          false,
        ],
      ]);
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

  /** 66.67 / 100 is 0.6667000000000001 in floating point, which Decimal(5,4) refuses with CAP's raw text; every two-decimal % must save. */
  QUnit.test(
    "sends every two-decimal percentage as a fraction of at most four decimals",
    async assert => {
      const dialog = await openSplitDialogFor(TRANSACTION_ID.PADEL);

      for (const percent of buildTwoDecimalPercents()) {
        enterDialogInput(dialog, "splitModel", {
          ...SPLIT_INPUT.ZERO_PERCENT_SHARE,
          mySharePct: percent,
        });
        await state.actions.onButtonSplitConfirmPress(buildPressInside(dialog));
      }

      const malformed = state.stubs.calls.splits
        .map(split => String(split[1]))
        .filter(fraction => !PERCENT_SWEEP.FRACTION_SHAPE.test(fraction));
      assert.strictEqual(
        state.stubs.calls.splits.length,
        PERCENT_SWEEP.LAST_HUNDREDTHS,
      );
      assert.deepEqual(malformed, []);
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

  /** A refused save must leave the dialog open with the user's terms and tell them why — a silent refusal reads as a hung button. */
  QUnit.test(
    "keeps the dialog open and warns with the server's reason when the save is refused",
    async assert => {
      const dialog = await openSplitDialogFor(TRANSACTION_ID.PADEL);
      enterDialogInput(dialog, "splitModel", SPLIT_INPUT.PERCENT_SHARE);
      state.stubs.rejectNextServiceCall(SERVICE_FAILURE.MESSAGE);

      await state.actions.onButtonSplitConfirmPress(buildPressInside(dialog));

      assert.strictEqual(dialog.closeCount, 0);
      assert.deepEqual(state.stubs.calls.toasts, []);
      assert.deepEqual(state.stubs.calls.warnings, ["msgSplitRefused"]);
      assert.deepEqual(state.stubs.calls.warningArgs, [
        [SERVICE_FAILURE.MESSAGE],
      ]);
    },
  );

  /** With no transaction chosen through the Split action, a save has no target and must do nothing. */
  QUnit.test(
    "saves nothing when no transaction was chosen for the split",
    async assert => {
      const dialog = buildFakeDialog(FRAGMENT_NAME.SPLIT);

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
