/// <reference types="qunit" />
import ConnectionService from "com/financialplanner/connectionmanager/model/ConnectionService";

import {
  CLAIM_INPUT,
  CONNECTION_PATH,
  OPERATION_FAILURE,
  OPERATION_PATH,
} from "../data/constants";
import {
  buildFakeContext,
  buildFakeODataModel,
} from "../support/connectionFakes";
import type { FakeODataModel } from "../support/types";

const state: { odata: FakeODataModel; service: ConnectionService } = {
  odata: undefined as unknown as FakeODataModel,
  service: undefined as unknown as ConnectionService,
};

QUnit.module("ConnectionService", hooks => {
  hooks.beforeEach(() => {
    state.odata = buildFakeODataModel();
    state.service = new ConnectionService(state.odata.model);
  });

  QUnit.module("claimSetupToken", () => {
    /** The pasted token and the user's name must reach the unbound claim action, or no connection is created. */
    QUnit.test(
      "invokes the unbound claimSetupToken action with the token and display name",
      async assert => {
        await state.service.claimSetupToken(
          CLAIM_INPUT.TOKEN,
          CLAIM_INPUT.DISPLAY_NAME,
        );

        assert.strictEqual(state.odata.bindings.length, 1);
        assert.strictEqual(
          state.odata.bindings[0].path,
          OPERATION_PATH.CLAIM_SETUP_TOKEN,
        );
        assert.strictEqual(state.odata.bindings[0].context, undefined);
        assert.deepEqual(state.odata.bindings[0].parameters, {
          setupToken: CLAIM_INPUT.TOKEN,
          displayName: CLAIM_INPUT.DISPLAY_NAME,
        });
      },
    );

    /** The new connection must appear in the table, so the model refreshes once the claim lands. */
    QUnit.test(
      "refreshes the model after the claim completes",
      async assert => {
        await state.service.claimSetupToken(
          CLAIM_INPUT.TOKEN,
          CLAIM_INPUT.DISPLAY_NAME,
        );

        assert.deepEqual(state.odata.events, [
          `invoke ${OPERATION_PATH.CLAIM_SETUP_TOKEN}`,
          "refresh",
        ]);
      },
    );

    /** A rejected token must reach the controller as a failure, not be swallowed into a refresh. */
    QUnit.test(
      "rejects and does not refresh when the claim is rejected",
      async assert => {
        state.odata.rejectNextInvoke(OPERATION_FAILURE.MESSAGE);

        const outcome = await state.service
          .claimSetupToken(CLAIM_INPUT.TOKEN, CLAIM_INPUT.DISPLAY_NAME)
          .then(
            () => "resolved",
            () => "rejected",
          );

        assert.strictEqual(outcome, "rejected");
        assert.deepEqual(state.odata.events, [
          `invoke ${OPERATION_PATH.CLAIM_SETUP_TOKEN}`,
        ]);
      },
    );
  });

  QUnit.module("syncNow", () => {
    /** Sync Now syncs exactly the selected connection, so the bound action must hang off its context. */
    QUnit.test(
      "invokes the bound syncNow action on the given connection",
      async assert => {
        const connection = buildFakeContext(CONNECTION_PATH.MAIN);

        await state.service.syncNow(connection);

        assert.strictEqual(state.odata.bindings.length, 1);
        assert.strictEqual(
          state.odata.bindings[0].path,
          OPERATION_PATH.SYNC_NOW,
        );
        assert.strictEqual(state.odata.bindings[0].context, connection);
      },
    );

    /** Last sync time and status must update on screen, so the model refreshes after the sync. */
    QUnit.test("refreshes the model after the sync completes", async assert => {
      await state.service.syncNow(buildFakeContext(CONNECTION_PATH.MAIN));

      assert.deepEqual(state.odata.events, [
        `invoke ${OPERATION_PATH.SYNC_NOW}`,
        "refresh",
      ]);
    });

    /** A failed sync must surface to the caller so the user sees it failed. */
    QUnit.test(
      "rejects and does not refresh when the sync is rejected",
      async assert => {
        state.odata.rejectNextInvoke(OPERATION_FAILURE.MESSAGE);

        const outcome = await state.service
          .syncNow(buildFakeContext(CONNECTION_PATH.MAIN))
          .then(
            () => "resolved",
            () => "rejected",
          );

        assert.strictEqual(outcome, "rejected");
        assert.deepEqual(state.odata.events, [
          `invoke ${OPERATION_PATH.SYNC_NOW}`,
        ]);
      },
    );
  });
});
