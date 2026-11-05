/// <reference types="qunit" />
import I18n from "com/financialplanner/shared/util/i18n";

import { I18N, I18N_TEXTS } from "../data/constants";
import { buildI18nSource } from "../support/sharedFakes";

QUnit.module("I18n", () => {
  /** User-facing text is never hardcoded: every helper resolves its key through the propagated "i18n" model. */
  QUnit.test("resolves a key against the source's i18n model", assert => {
    const fake = buildI18nSource(I18N_TEXTS);

    const text = I18n.getText(fake.source, I18N.KEY);

    assert.strictEqual(text, I18N.TEXT);
    assert.deepEqual(fake.requestedModels, [I18N.MODEL_NAME]);
  });

  /** A server refusal reaches the user inside an i18n frame, so the args must fill the text's placeholders. */
  QUnit.test("fills the text's placeholders from the args", assert => {
    const fake = buildI18nSource(I18N_TEXTS);

    assert.strictEqual(I18n.getText(fake.source, I18N.PARAM_KEY, [I18N.ARG]), I18N.FILLED_TEXT);
  });

  /** A key missing from the bundle yields "" so a toast or label shows nothing rather than "undefined". */
  QUnit.test("returns an empty string for a key the bundle lacks", assert => {
    const fake = buildI18nSource(I18N_TEXTS);

    assert.strictEqual(I18n.getText(fake.source, I18N.MISSING_KEY), "");
  });
});
