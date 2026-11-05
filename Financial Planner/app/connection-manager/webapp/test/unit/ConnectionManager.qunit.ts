/// <reference types="qunit" />
import type ConnectionManager from "com/financialplanner/connectionmanager/controller/ConnectionManager.controller";
import type JSONModel from "sap/ui/model/json/JSONModel";

import {
  ADD_DIALOG,
  CLAIM_INPUT,
  CONNECTION_PATH,
  OPERATION_FAILURE,
  SIMPLEFIN_PAGE,
} from "../data/constants";
import {
  buildController,
  buildFakeContext,
  buildFakeODataModel,
  buildSelectionEvent,
  enterClaimInput,
  flushPromises,
  stubControllerCollaborators,
} from "../support/connectionFakes";
import type {
  ControllerHarness,
  ControllerStubs,
  FakeDialog,
  FakeODataModel,
} from "../support/types";

const state: {
  controller: ConnectionManager;
  harness: ControllerHarness;
  odataModel: FakeODataModel;
  stubs: ControllerStubs;
} = {
  controller: undefined as unknown as ConnectionManager,
  harness: undefined as unknown as ControllerHarness,
  odataModel: undefined as unknown as FakeODataModel,
  stubs: undefined as unknown as ControllerStubs,
};

const useFreshController = (hooks: NestedHooks): void => {
  hooks.beforeEach(() => {
    state.stubs = stubControllerCollaborators();
    state.odataModel = buildFakeODataModel();
    ({ controller: state.controller, harness: state.harness } = buildController(
      state.odataModel.model,
    ));
  });
  hooks.afterEach(() => {
    state.stubs.restore();
  });
};

const readUiModel = (): JSONModel =>
  state.harness.view.getModel("ui") as JSONModel;

const openAddDialog = async (): Promise<FakeDialog> => {
  state.controller.onActionAddConnectionPress();
  await flushPromises();
  return state.harness.dialogs.get(ADD_DIALOG.FRAGMENT) as FakeDialog;
};

const selectConnection = (path: string): void => {
  state.controller.onTableConnectionSelectionChange(
    buildSelectionEvent([buildFakeContext(path)]),
  );
};

QUnit.module("ConnectionManager — page init", hooks => {
  useFreshController(hooks);

  /** The FPM page must still run FE's own init, or the macros tables lose their page models. */
  QUnit.test("runs the FE page controller init", assert => {
    assert.strictEqual(state.stubs.calls.frameworkInits, 1);
  });

  /** The accounts table and Sync Now hang off hasSelection; the page must open with nothing selected and an empty dialog. */
  QUnit.test("starts with no selection and empty claim inputs", assert => {
    assert.deepEqual(readUiModel().getData(), {
      hasSelection: false,
      setupToken: "",
      displayName: "",
    });
  });

  /** Every claim and sync binds an OData operation, so the service must hold the view's default OData model, not the ui JSON model. */
  QUnit.test("hands the view's default OData model to the service", assert => {
    assert.strictEqual(
      state.controller["_service"]["_model"],
      state.odataModel.model,
    );
  });
});

QUnit.module("ConnectionManager — Add Connection", hooks => {
  useFreshController(hooks);

  /** Add Connection opens the paste-token dialog by its fragment name. */
  QUnit.test("opens the Add Connection dialog", async assert => {
    const dialog = await openAddDialog();

    assert.deepEqual(
      state.harness.loads.map(load => load.name),
      [ADD_DIALOG.FRAGMENT],
    );
    assert.strictEqual(dialog.openCount, 1);
  });

  /** A token is single-use; reopening the dialog must not offer the last attempt's token and name again. */
  QUnit.test("clears the previous token and name on reopen", async assert => {
    await openAddDialog();
    enterClaimInput(
      state.harness.view,
      CLAIM_INPUT.TOKEN,
      CLAIM_INPUT.DISPLAY_NAME,
    );

    await openAddDialog();

    assert.strictEqual(readUiModel().getProperty("/setupToken"), "");
    assert.strictEqual(readUiModel().getProperty("/displayName"), "");
    assert.strictEqual(state.harness.loads.length, 1);
  });

  /** The user gets the token from SimpleFIN's setup page, opened in a new tab so the dialog survives. */
  QUnit.test("opens the SimpleFIN setup page in a new tab", assert => {
    state.controller.onButtonOpenSetupPagePress();

    assert.deepEqual(state.stubs.calls.opened, [
      [SIMPLEFIN_PAGE.SETUP, "_blank"],
    ]);
  });

  /** Cancel must close the dialog it opened without claiming anything. */
  QUnit.test("cancel closes the dialog and claims nothing", async assert => {
    const dialog = await openAddDialog();

    state.controller.onButtonCancelAddConnectionPress();

    assert.strictEqual(dialog.closeCount, 1);
    assert.deepEqual(state.stubs.calls.claims, []);
  });
});

QUnit.module("ConnectionManager — claim setup token", hooks => {
  useFreshController(hooks);

  /** A pasted token and name are claimed trimmed — a copied token often carries a trailing newline. */
  QUnit.test("claims the trimmed token and display name", async assert => {
    await openAddDialog();
    enterClaimInput(
      state.harness.view,
      CLAIM_INPUT.PADDED_TOKEN,
      CLAIM_INPUT.PADDED_DISPLAY_NAME,
    );

    state.controller.onButtonClaimTokenPress();
    await flushPromises();

    assert.deepEqual(state.stubs.calls.claims, [
      [CLAIM_INPUT.TOKEN, CLAIM_INPUT.DISPLAY_NAME],
    ]);
  });

  /** On success the user is told and the dialog closes onto the refreshed table. */
  QUnit.test(
    "confirms and closes the dialog once the claim succeeds",
    async assert => {
      const dialog = await openAddDialog();
      enterClaimInput(
        state.harness.view,
        CLAIM_INPUT.TOKEN,
        CLAIM_INPUT.DISPLAY_NAME,
      );

      state.controller.onButtonClaimTokenPress();
      await flushPromises();

      assert.deepEqual(state.stubs.calls.toasts, ["msgConnectionAdded"]);
      assert.strictEqual(dialog.closeCount, 1);
    },
  );

  /** A rejected token keeps the dialog open so the user can fix it, and says why. */
  QUnit.test(
    "reports the failure and keeps the dialog open when the claim is rejected",
    async assert => {
      const dialog = await openAddDialog();
      enterClaimInput(
        state.harness.view,
        CLAIM_INPUT.TOKEN,
        CLAIM_INPUT.DISPLAY_NAME,
      );
      state.stubs.rejectNextServiceCall(OPERATION_FAILURE.MESSAGE);

      state.controller.onButtonClaimTokenPress();
      await flushPromises();

      assert.deepEqual(state.stubs.calls.toasts, ["msgClaimFailed"]);
      assert.strictEqual(dialog.closeCount, 0);
    },
  );

  /** A claim without a token cannot succeed, so it is refused before any backend call. */
  QUnit.test(
    "refuses a missing token without calling the backend",
    async assert => {
      await openAddDialog();
      enterClaimInput(
        state.harness.view,
        CLAIM_INPUT.EMPTY,
        CLAIM_INPUT.DISPLAY_NAME,
      );

      state.controller.onButtonClaimTokenPress();
      await flushPromises();

      assert.deepEqual(state.stubs.calls.claims, []);
      assert.deepEqual(state.stubs.calls.toasts, ["msgFillFields"]);
    },
  );

  /** Pressing Add on the untouched dialog must ask for both fields, not send an empty claim. */
  QUnit.test(
    "refuses an untouched dialog without calling the backend",
    async assert => {
      await openAddDialog();

      state.controller.onButtonClaimTokenPress();
      await flushPromises();

      assert.deepEqual(state.stubs.calls.claims, []);
      assert.deepEqual(state.stubs.calls.toasts, ["msgFillFields"]);
    },
  );

  /** Every connection needs a user-facing name, so a blank one is refused like an empty one. */
  QUnit.test(
    "refuses a whitespace-only display name without calling the backend",
    async assert => {
      await openAddDialog();
      enterClaimInput(state.harness.view, CLAIM_INPUT.TOKEN, CLAIM_INPUT.BLANK);

      state.controller.onButtonClaimTokenPress();
      await flushPromises();

      assert.deepEqual(state.stubs.calls.claims, []);
      assert.deepEqual(state.stubs.calls.toasts, ["msgFillFields"]);
    },
  );
});

QUnit.module("ConnectionManager — connection selection", hooks => {
  useFreshController(hooks);

  /** Selecting a connection shows its Provider Accounts, so the view binds to it and hasSelection turns on. */
  QUnit.test("binds the view to the selected connection", assert => {
    selectConnection(CONNECTION_PATH.MAIN);

    const bound = state.harness.view.bindingContexts;
    assert.strictEqual(bound.length, 1);
    assert.strictEqual(bound[0]?.getPath(), CONNECTION_PATH.MAIN);
    assert.strictEqual(readUiModel().getProperty("/hasSelection"), true);
  });

  /** Clearing the selection must hide the accounts of the connection no longer selected. */
  QUnit.test(
    "unbinds and hides the accounts when the selection is cleared",
    assert => {
      selectConnection(CONNECTION_PATH.MAIN);

      state.controller.onTableConnectionSelectionChange(
        buildSelectionEvent([]),
      );

      assert.strictEqual(state.harness.view.bindingContexts[1], null);
      assert.strictEqual(readUiModel().getProperty("/hasSelection"), false);
    },
  );

  /** A selectionChange that carries no contexts parameter is treated as no selection, not a crash. */
  QUnit.test(
    "treats an event without selected contexts as no selection",
    assert => {
      state.controller.onTableConnectionSelectionChange(buildSelectionEvent());

      assert.deepEqual(state.harness.view.bindingContexts, [null]);
      assert.strictEqual(readUiModel().getProperty("/hasSelection"), false);
    },
  );
});

QUnit.module("ConnectionManager — Sync Now", hooks => {
  useFreshController(hooks);

  /** Sync Now syncs the connection the user selected — the latest one, not the first. */
  QUnit.test("syncs the currently selected connection", async assert => {
    selectConnection(CONNECTION_PATH.MAIN);
    selectConnection(CONNECTION_PATH.SECOND);

    state.controller.onActionSyncNowPress();
    await flushPromises();

    assert.deepEqual(
      state.stubs.calls.syncs.map(context => context.getPath()),
      [CONNECTION_PATH.SECOND],
    );
  });

  /** The user sees the sync start and then complete. */
  QUnit.test(
    "toasts start and completion of a successful sync",
    async assert => {
      selectConnection(CONNECTION_PATH.MAIN);

      state.controller.onActionSyncNowPress();
      await flushPromises();

      assert.deepEqual(state.stubs.calls.toasts, [
        "msgSyncStarted",
        "msgSyncDone",
      ]);
    },
  );

  /** A failed sync must read as a failure, never as complete. */
  QUnit.test("toasts start and failure of a rejected sync", async assert => {
    selectConnection(CONNECTION_PATH.MAIN);
    state.stubs.rejectNextServiceCall(OPERATION_FAILURE.MESSAGE);

    state.controller.onActionSyncNowPress();
    await flushPromises();

    assert.deepEqual(state.stubs.calls.toasts, [
      "msgSyncStarted",
      "msgSyncFailed",
    ]);
  });

  /** A cleared selection must drop the remembered connection, or Sync Now would sync one the user deselected. */
  QUnit.test(
    "does nothing once the selection has been cleared",
    async assert => {
      selectConnection(CONNECTION_PATH.MAIN);
      state.controller.onTableConnectionSelectionChange(
        buildSelectionEvent([]),
      );

      state.controller.onActionSyncNowPress();
      await flushPromises();

      assert.deepEqual(state.stubs.calls.syncs, []);
      assert.deepEqual(state.stubs.calls.toasts, []);
    },
  );

  /** With no connection selected there is nothing to sync, so nothing is called or announced. */
  QUnit.test("does nothing without a selected connection", async assert => {
    state.controller.onActionSyncNowPress();
    await flushPromises();

    assert.deepEqual(state.stubs.calls.syncs, []);
    assert.deepEqual(state.stubs.calls.toasts, []);
  });
});

QUnit.module(
  "ConnectionManager — re-authenticate and auto-save notices",
  hooks => {
    useFreshController(hooks);

    /** Re-authenticate opens the SimpleFIN dashboard in a new tab. */
    QUnit.test("opens the SimpleFIN dashboard in a new tab", assert => {
      state.controller.onActionReauthenticatePress();

      assert.deepEqual(state.stubs.calls.opened, [
        [SIMPLEFIN_PAGE.DASHBOARD, "_blank"],
      ]);
    });

    /** A card mapping auto-saves, so the user is told it was updated. */
    QUnit.test("confirms a card mapping change", assert => {
      state.controller.onCardInstancesComboBoxMappingChange();

      assert.deepEqual(state.stubs.calls.toasts, ["msgMappingUpdated"]);
    });

    /** The active toggle auto-saves, so the user is told it changed. */
    QUnit.test("confirms an active toggle change", assert => {
      state.controller.onSwitchActiveChange();

      assert.deepEqual(state.stubs.calls.toasts, ["msgActiveToggled"]);
    });
  },
);
