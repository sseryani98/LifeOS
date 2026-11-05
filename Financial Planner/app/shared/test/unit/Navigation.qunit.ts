/// <reference types="qunit" />
import Navigation from "com/financialplanner/shared/util/Navigation";

import { ROUTE } from "../data/constants";
import { buildRouter, stubHistory } from "../support/sharedFakes";
import type { HistoryStub } from "../support/types";

const state: { history: HistoryStub } = {
  history: undefined as unknown as HistoryStub,
};

QUnit.module("Navigation — with in-app history", hooks => {
  hooks.afterEach(() => {
    state.history.restore();
  });

  /** Back must return the user to the page they came from, not jump to a fixed route. */
  QUnit.test("steps the browser back one entry", assert => {
    state.history = stubHistory(ROUTE.PREVIOUS_HASH);
    const fake = buildRouter();

    Navigation.navigateBack(fake.router, ROUTE.FALLBACK);

    assert.deepEqual(state.history.backSteps, [ROUTE.BACK_ONE_STEP]);
    assert.deepEqual(fake.navigations, []);
  });

  /** An empty previous hash is the app's root page — still history, so back goes there, not to the fallback. */
  QUnit.test("treats an empty previous hash as history", assert => {
    state.history = stubHistory(ROUTE.ROOT_HASH);
    const fake = buildRouter();

    Navigation.navigateBack(fake.router, ROUTE.FALLBACK);

    assert.deepEqual(state.history.backSteps, [ROUTE.BACK_ONE_STEP]);
  });
});

QUnit.module("Navigation — deep link", hooks => {
  hooks.beforeEach(() => {
    state.history = stubHistory(undefined);
  });
  hooks.afterEach(() => {
    state.history.restore();
  });

  /** A deep-linked page has no in-app history; back would leave the app, so it routes to the fallback and replaces the entry. */
  QUnit.test(
    "navigates to the fallback route, replacing the history entry",
    assert => {
      const fake = buildRouter();

      Navigation.navigateBack(fake.router, ROUTE.FALLBACK);

      assert.deepEqual(fake.navigations, [[ROUTE.FALLBACK, {}, true]]);
      assert.deepEqual(state.history.backSteps, []);
    },
  );

  /** With no history and no fallback there is nowhere in the app to go, so nothing happens. */
  QUnit.test("does nothing without a fallback route", assert => {
    const fake = buildRouter();

    Navigation.navigateBack(fake.router);

    assert.deepEqual(fake.navigations, []);
    assert.deepEqual(state.history.backSteps, []);
  });
});
