/// <reference types="qunit" />
import type JSONModel from "sap/ui/model/json/JSONModel";

import {
  PAGE_STATE,
  READ_FAILURE,
  WORKSPACE_ROW_PATH,
} from "../data/constants";
import {
  buildController,
  buildFakeContext,
  buildFakeODataModel,
  flushPromises,
} from "../support/projectViewFakes";
import type { ControllerHarness } from "../support/types";

const state: { harness: ControllerHarness } = {
  harness: undefined as unknown as ControllerHarness,
};

const readPageState = (): JSONModel =>
  state.harness.view.getModel(PAGE_STATE.MODEL) as JSONModel;

QUnit.module("ProjectView controller", hooks => {
  hooks.afterEach(() => {
    state.harness.restore();
  });

  QUnit.module("with a workspace in the store", () => {
    /** The FPM page must still run FE's own init, or the macros tables lose their page models. */
    QUnit.test("runs the FE page controller init", async assert => {
      state.harness = buildController(
        buildFakeODataModel([buildFakeContext(WORKSPACE_ROW_PATH.FIRST)]).model,
      );
      await flushPromises();

      assert.strictEqual(state.harness.frameworkInits, 1);
    });

    /** Every section renders off the one page binding, so the view must take the workspace's context. */
    QUnit.test("binds the view to the workspace row", async assert => {
      state.harness = buildController(
        buildFakeODataModel([buildFakeContext(WORKSPACE_ROW_PATH.FIRST)]).model,
      );
      await flushPromises();

      assert.deepEqual(
        state.harness.view.bindingContexts.map(context => context.getPath()),
        [WORKSPACE_ROW_PATH.FIRST],
      );
    });

    /** The page stays busy until the read lands; a page left busy never shows its sections. */
    QUnit.test("clears busy and raises no failure once the read lands", async assert => {
      state.harness = buildController(
        buildFakeODataModel([buildFakeContext(WORKSPACE_ROW_PATH.FIRST)]).model,
      );
      await flushPromises();

      assert.strictEqual(readPageState().getProperty(PAGE_STATE.BUSY), false);
      assert.strictEqual(readPageState().getProperty(PAGE_STATE.READ_FAILED), false);
    });
  });

  QUnit.module("with an empty store", () => {
    /** An empty store is a state, not a failure: the view stays unbound so every section reads empty. */
    QUnit.test("leaves the view unbound and raises no failure", async assert => {
      state.harness = buildController(buildFakeODataModel([]).model);
      await flushPromises();

      assert.deepEqual(state.harness.view.bindingContexts, []);
      assert.strictEqual(readPageState().getProperty(PAGE_STATE.READ_FAILED), false);
      assert.strictEqual(readPageState().getProperty(PAGE_STATE.BUSY), false);
    });
  });

  QUnit.module("when the read fails", () => {
    /** A dead backend must surface as the page's one failure strip, never as a page that looks empty. */
    QUnit.test("raises the read failure and clears busy", async assert => {
      const odata = buildFakeODataModel([]);
      odata.rejectNextRead(READ_FAILURE.MESSAGE);
      state.harness = buildController(odata.model);
      await flushPromises();

      assert.strictEqual(readPageState().getProperty(PAGE_STATE.READ_FAILED), true);
      assert.strictEqual(readPageState().getProperty(PAGE_STATE.BUSY), false);
      assert.deepEqual(state.harness.view.bindingContexts, []);
    });
  });
});
