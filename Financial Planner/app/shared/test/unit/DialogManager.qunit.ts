/// <reference types="qunit" />
import DialogManager from "com/financialplanner/shared/DialogManager";

import { FRAGMENT, FRAGMENT_INSTANCE_IDS } from "../data/constants";
import {
  buildClassHandlerHome,
  buildDialogHost,
  copyControllerAsFe,
} from "../support/sharedFakes";

const handlerHome = { onButtonSavePress: () => undefined };
const PREFIXED_ID = `${FRAGMENT.VIEW_PREFIX}--${FRAGMENT.EDIT_DIALOG_ID}`;

QUnit.module("DialogManager — loading", () => {
  /** A Controller scopes fragment ids from its view; an explicit id would double-prefix the dialog's controls. */
  QUnit.test(
    "loads through a Controller host without an id namespace",
    async assert => {
      const fake = buildDialogHost(true, PREFIXED_ID);

      await new DialogManager(fake.host).open(FRAGMENT.EDIT);

      assert.deepEqual(fake.loads, [{ name: FRAGMENT.EDIT }]);
    },
  );

  /** An ExtensionAPI has no view, so without a namespace two fragments' control ids could collide on the page. */
  QUnit.test(
    "gives an ExtensionAPI host the fragment's short name as id namespace",
    async assert => {
      const fake = buildDialogHost(false, PREFIXED_ID);

      await new DialogManager(fake.host).open(FRAGMENT.EDIT);

      assert.deepEqual(fake.loads, [
        { id: FRAGMENT.EDIT_SHORT_NAME, name: FRAGMENT.EDIT },
      ]);
    },
  );

  /** FE copies the controller with for…in, so a plain object's own handlers must survive the copy. */
  QUnit.test(
    "passes a plain-object controller's handlers through to the fragment load",
    async assert => {
      const fake = buildDialogHost(false, PREFIXED_ID);

      await new DialogManager(fake.host).open(FRAGMENT.EDIT, handlerHome);

      assert.strictEqual(
        copyControllerAsFe(fake.loads[0].controller).onButtonSavePress !== undefined,
        true,
      );
    },
  );

  /** A class keeps its handlers on the prototype, which for…in skips; unbridged, the dialog's buttons do nothing. */
  QUnit.test(
    "exposes a class-instance controller's prototype handlers, bound to the instance",
    async assert => {
      const fake = buildDialogHost(false, PREFIXED_ID);
      const home = buildClassHandlerHome();
      await new DialogManager(fake.host).open(FRAGMENT.EDIT, home);

      const handlers = copyControllerAsFe(fake.loads[0].controller);
      (handlers.onButtonSavePress as () => void)();

      assert.strictEqual(home.presses, 1);
    },
  );

  /** Fragments load once: a second load would create duplicate control ids and throw. */
  QUnit.test("reuses the loaded dialog on every later open", async assert => {
    const fake = buildDialogHost(true, PREFIXED_ID);
    const manager = new DialogManager(fake.host);

    const first = await manager.open(FRAGMENT.EDIT);
    const second = await manager.open(FRAGMENT.EDIT);

    assert.strictEqual(fake.loads.length, 1);
    assert.strictEqual(first, second);
    assert.strictEqual(fake.dialogs[0].openCount, 2);
  });

  /** A double-press opens twice before the first load settles; only a cached load promise stops a second, duplicate-id load. */
  QUnit.test(
    "loads once when two opens race before the first settles",
    async assert => {
      const fake = buildDialogHost(true, PREFIXED_ID);
      const manager = new DialogManager(fake.host);

      const [first, second] = await Promise.all([
        manager.open(FRAGMENT.EDIT),
        manager.open(FRAGMENT.EDIT),
      ]);

      assert.strictEqual(fake.loads.length, 1);
      assert.strictEqual(first, second);
    },
  );
});

QUnit.module("DialogManager — closing", () => {
  /** Callers know only the fragment's own dialog id; the host prefixes it, so close must match on the suffix. */
  QUnit.test(
    "closes a dialog whose instance id carries a host prefix",
    async assert => {
      const fake = buildDialogHost(true, PREFIXED_ID);
      const manager = new DialogManager(fake.host);
      await manager.open(FRAGMENT.EDIT);

      manager.close(FRAGMENT.EDIT_DIALOG_ID);

      assert.strictEqual(fake.dialogs[0].closeCount, 1);
    },
  );

  /** A host that applies no prefix leaves the dialog id as declared; close must still find it. */
  QUnit.test(
    "closes a dialog whose instance id is unprefixed",
    async assert => {
      const fake = buildDialogHost(true, FRAGMENT.EDIT_DIALOG_ID);
      const manager = new DialogManager(fake.host);
      await manager.open(FRAGMENT.EDIT);

      manager.close(FRAGMENT.EDIT_DIALOG_ID);

      assert.strictEqual(fake.dialogs[0].closeCount, 1);
    },
  );

  /** Closing an id that was never opened is a no-op, so a stray Cancel press cannot close the wrong dialog. */
  QUnit.test(
    "leaves open dialogs alone when the id matches none",
    async assert => {
      const fake = buildDialogHost(true, PREFIXED_ID);
      const manager = new DialogManager(fake.host);
      await manager.open(FRAGMENT.EDIT);

      manager.close(FRAGMENT.OTHER_DIALOG_ID);

      assert.strictEqual(fake.dialogs[0].closeCount, 0);
    },
  );

  /** One manager serves several fragments (split and apply); each needs its own load, and close must hit only the named one. */
  QUnit.test(
    "keeps two fragments apart and closes only the one named",
    async assert => {
      const fake = buildDialogHost(false, FRAGMENT_INSTANCE_IDS);
      const manager = new DialogManager(fake.host);
      const editDialog = await manager.open(FRAGMENT.EDIT);
      const applyDialog = await manager.open(FRAGMENT.APPLY);

      manager.close(FRAGMENT.APPLY_DIALOG_ID);

      assert.strictEqual(fake.loads.length, 2);
      assert.notStrictEqual(editDialog, applyDialog);
      assert.strictEqual(fake.dialogs[1].closeCount, 1);
      assert.strictEqual(fake.dialogs[0].closeCount, 0);
    },
  );
});
