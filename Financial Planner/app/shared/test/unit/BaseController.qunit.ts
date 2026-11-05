/// <reference types="qunit" />
import BaseController from "com/financialplanner/shared/BaseController";
import type UIComponent from "sap/ui/core/UIComponent";
import type View from "sap/ui/core/mvc/View";
import JSONModel from "sap/ui/model/json/JSONModel";

import { I18N, I18N_TEXTS, MODEL, ROUTE } from "../data/constants";
import {
  buildControllerView,
  buildRouter,
  stubHistory,
} from "../support/sharedFakes";
import type {
  ControllerViewFake,
  HistoryStub,
  RouterFake,
} from "../support/types";

const state: {
  controller: BaseController;
  history: HistoryStub;
  routing: RouterFake;
  view: ControllerViewFake;
} = {
  controller: undefined as unknown as BaseController,
  history: undefined as unknown as HistoryStub,
  routing: undefined as unknown as RouterFake,
  view: undefined as unknown as ControllerViewFake,
};

QUnit.module("BaseController", hooks => {
  hooks.beforeEach(() => {
    state.history = stubHistory(undefined);
    state.view = buildControllerView(I18N_TEXTS);
    state.routing = buildRouter();
    const component = { getRouter: () => state.routing.router };
    state.controller = new BaseController(undefined as unknown as string);
    state.controller.getView = () => state.view.view as unknown as View;
    state.controller.getOwnerComponent = () =>
      component as unknown as UIComponent;
  });
  hooks.afterEach(() => {
    state.history.restore();
    state.controller.destroy();
  });

  /** Controllers call this.getRouter(), never the getOwnerComponent() chain; the helper must hand back the component's router. */
  QUnit.test("getRouter returns the owning component's router", assert => {
    assert.strictEqual(state.controller.getRouter(), state.routing.router);
  });

  /** Controllers set UI-state models through the base, which must land on the view so bindings see them. */
  QUnit.test("setModel puts the model on the view and chains", assert => {
    const model = new JSONModel();

    const returned = state.controller.setModel(model, I18N.MODEL_NAME);

    assert.strictEqual(returned, state.controller);
    assert.strictEqual(state.view.models.get(I18N.MODEL_NAME), model);
  });

  /** Omitting the name addresses the view's default model, as the UI5 API does. */
  QUnit.test(
    "getModel without a name returns the view's default model",
    assert => {
      const model = new JSONModel();
      state.controller.setModel(model);

      assert.strictEqual(state.controller.getModel(), model);
    },
  );

  /** Freestyle controllers read UI state via getModel("ui"); dropping the name would hand them the default OData model. */
  QUnit.test(
    "getModel with a name returns that model, not the default",
    assert => {
      const defaultModel = new JSONModel();
      const uiModel = new JSONModel();
      state.controller.setModel(defaultModel);
      state.controller.setModel(uiModel, MODEL.UI_NAME);

      assert.strictEqual(state.controller.getModel(MODEL.UI_NAME), uiModel);
    },
  );

  /** Freestyle controllers resolve labels through the view's i18n model, never a hardcoded string. */
  QUnit.test("getText resolves a key against the view's i18n model", assert => {
    assert.strictEqual(state.controller.getText(I18N.KEY), I18N.TEXT);
  });

  /** A deep-linked freestyle page goes back to its fallback route through the shared Navigation path. */
  QUnit.test(
    "navigateBack routes to the fallback when there is no history",
    assert => {
      state.controller.navigateBack(ROUTE.FALLBACK);

      assert.deepEqual(state.routing.navigations, [[ROUTE.FALLBACK, {}, true]]);
    },
  );
});
