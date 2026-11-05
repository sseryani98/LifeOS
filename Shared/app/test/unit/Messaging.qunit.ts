/// <reference types="qunit" />
import Messaging from "com/lifeos/shared/Messaging";

import { CONFIRM_ACTION, I18N, I18N_TEXTS } from "../data/constants";
import { buildI18nSource, stubMessageBoxes } from "../support/sharedFakes";
import type { MessageStubs } from "../support/types";

const state: { messaging: Messaging; stubs: MessageStubs } = {
  messaging: undefined as unknown as Messaging,
  stubs: undefined as unknown as MessageStubs,
};

QUnit.module("Messaging — with a view", hooks => {
  hooks.beforeEach(() => {
    state.stubs = stubMessageBoxes();
    const view = buildI18nSource(I18N_TEXTS).source;
    state.messaging = new Messaging({ getView: () => view });
  });
  hooks.afterEach(() => {
    state.stubs.restore();
  });

  /** Messaging methods take i18n keys, so every toast reaches the user as resolved text, never as the key. */
  QUnit.test("showToast shows the resolved text", assert => {
    state.messaging.showToast(I18N.KEY);

    assert.deepEqual(state.stubs.calls.toasts, [I18N.TEXT]);
  });

  /** Error, success and warning each open their own MessageBox kind with the resolved text. */
  QUnit.test(
    "showError, showSuccess and showWarning open their own box kind",
    assert => {
      state.messaging.showError(I18N.KEY);
      state.messaging.showSuccess(I18N.KEY);
      state.messaging.showWarning(I18N.KEY);

      assert.deepEqual(state.stubs.calls.errors, [I18N.TEXT]);
      assert.deepEqual(state.stubs.calls.successes, [I18N.TEXT]);
      assert.deepEqual(state.stubs.calls.warnings, [I18N.TEXT]);
    },
  );

  /** A backend refusal is shown inside an i18n frame, so the warning must pass its args to the bundle. */
  QUnit.test(
    "showWarning fills the text's placeholders from the args",
    assert => {
      state.messaging.showWarning(I18N.PARAM_KEY, [I18N.ARG]);

      assert.deepEqual(state.stubs.calls.warnings, [I18N.FILLED_TEXT]);
    },
  );

  /** A destructive action proceeds only on an explicit OK. */
  QUnit.test(
    "showConfirm resolves true when the user confirms",
    async assert => {
      const confirmed = await state.messaging.showConfirm(I18N.KEY);

      assert.strictEqual(confirmed, true);
      assert.deepEqual(state.stubs.calls.confirms, [I18N.TEXT]);
    },
  );

  /** Cancel must never be read as consent. */
  QUnit.test(
    "showConfirm resolves false when the user cancels",
    async assert => {
      state.stubs.closeConfirmWith(CONFIRM_ACTION.CANCEL);

      assert.strictEqual(await state.messaging.showConfirm(I18N.KEY), false);
    },
  );

  /** Dismissing the box (Escape) closes with no action, which is not consent either. */
  QUnit.test(
    "showConfirm resolves false when the box is dismissed",
    async assert => {
      state.stubs.closeConfirmWith(null);

      assert.strictEqual(await state.messaging.showConfirm(I18N.KEY), false);
    },
  );
});

QUnit.module("Messaging — without a view", hooks => {
  hooks.beforeEach(() => {
    state.stubs = stubMessageBoxes();
  });
  hooks.afterEach(() => {
    state.stubs.restore();
  });

  /** A host whose view is gone (destroyed page) must not throw while showing a late message. */
  QUnit.test("shows an empty text instead of throwing", assert => {
    new Messaging({ getView: () => null }).showToast(I18N.KEY);

    assert.deepEqual(state.stubs.calls.toasts, [""]);
  });
});

QUnit.module("Messaging — with an ExtensionAPI host", hooks => {
  hooks.beforeEach(() => {
    state.stubs = stubMessageBoxes();
  });
  hooks.afterEach(() => {
    state.stubs.restore();
  });

  /** An FE ExtensionAPI carries the i18n model itself; it is passed as-is, never wrapped in a getView stand-in. */
  QUnit.test(
    "resolves text through a host that carries the i18n model",
    assert => {
      new Messaging(buildI18nSource(I18N_TEXTS).source).showToast(I18N.KEY);

      assert.deepEqual(state.stubs.calls.toasts, [I18N.TEXT]);
    },
  );
});
