/// <reference types="qunit" />
import BasePageController from "com/financialplanner/shared/BasePageController";
import type UIComponent from "sap/ui/core/UIComponent";
import type View from "sap/ui/core/mvc/View";

import { I18N, I18N_TEXTS, ROUTE } from "../data/constants";
import {
  buildControllerView,
  buildRouter,
  stubHistory,
} from "../support/sharedFakes";
import type { HistoryStub, RouterFake } from "../support/types";

const state: {
  controller: BasePageController;
  history: HistoryStub;
  routing: RouterFake;
} = {
  controller: undefined as unknown as BasePageController,
  history: undefined as unknown as HistoryStub,
  routing: undefined as unknown as RouterFake,
};

QUnit.module("BasePageController", hooks => {
  hooks.beforeEach(() => {
    state.history = stubHistory(undefined);
    state.routing = buildRouter();
    const view = buildControllerView(I18N_TEXTS).view;
    const component = { getRouter: () => state.routing.router };
    state.controller = new BasePageController(undefined as unknown as string);
    state.controller.getView = () => view as unknown as View;
    state.controller.getOwnerComponent = () =>
      component as unknown as UIComponent;
  });
  hooks.afterEach(() => {
    state.history.restore();
    state.controller.destroy();
  });

  /** FPM page controllers call this.getRouter(); it must be the owning component's router, as on freestyle pages. */
  QUnit.test("getRouter returns the owning component's router", assert => {
    assert.strictEqual(state.controller.getRouter(), state.routing.router);
  });

  /** FPM pages resolve labels through the view's i18n model, never a hardcoded string. */
  QUnit.test("getText resolves a key against the view's i18n model", assert => {
    assert.strictEqual(state.controller.getText(I18N.KEY), I18N.TEXT);
  });

  /** A deep-linked FPM page goes back to its fallback route through the shared Navigation path. */
  QUnit.test(
    "navigateBack routes to the fallback when there is no history",
    assert => {
      state.controller.navigateBack(ROUTE.FALLBACK);

      assert.deepEqual(state.routing.navigations, [[ROUTE.FALLBACK, {}, true]]);
    },
  );
});
