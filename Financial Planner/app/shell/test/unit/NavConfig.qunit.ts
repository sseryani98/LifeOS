/// <reference types="qunit" />
import { NAV_CONFIG } from "com/financialplanner/shell/constants";
import NavConfig from "com/financialplanner/shell/controller/NavConfig";
import type ResourceBundle from "sap/base/i18n/ResourceBundle";
import ResourceModel from "sap/ui/model/resource/ResourceModel";

import {
  COMPONENT_NAME,
  FE_LIST_COMPONENTS,
  HASH_FRAGMENT,
  NAV_KEY,
  ROUTE,
  SHELL,
} from "../data/constants";

QUnit.module("NavConfig — key lookup", () => {
  /** A side-nav click resolves its key to the component and route the shell loads; a wrong entry opens the wrong app. */
  QUnit.test(
    "resolves a registered side-nav key to its component and inner route",
    assert => {
      const entry = NavConfig.getEntry(NAV_KEY.ISSUERS);

      assert.deepEqual(entry, {
        component: COMPONENT_NAME.ADMIN_MASTER_DATA,
        route: ROUTE.ISSUERS_LIST,
        hash: HASH_FRAGMENT.ISSUERS,
        recordHash: HASH_FRAGMENT.ISSUERS_RECORD,
        label: "navIssuers",
      });
    },
  );

  /** An unregistered key must resolve to nothing so the shell ignores it instead of loading an undefined component. */
  QUnit.test("resolves an unregistered key to undefined", assert => {
    assert.strictEqual(NavConfig.getEntry(NAV_KEY.UNREGISTERED), undefined);
  });
});

QUnit.module("NavConfig — deep-link lookup", () => {
  /** Deep-link restore: a reload restores the open app; two entries sharing a hash would make one page unreachable by URL. */
  QUnit.test("maps every entry's hash back to its own nav key", assert => {
    const roundTrips = Object.entries(NAV_CONFIG).map(([key, entry]) => [
      NavConfig.getNavKeyForHash(entry.hash),
      key,
    ]);

    assert.deepEqual(
      roundTrips.filter(([resolved, key]) => resolved !== key),
      [],
    );
  });

  /** Deep-link restore: a record link starts with its entity set, not the list hash; unmapped, a bookmarked record opens nothing. */
  QUnit.test(
    "maps every entry's record entity set back to its own nav key",
    assert => {
      const roundTrips = Object.entries(NAV_CONFIG)
        .filter(([, entry]) => FE_LIST_COMPONENTS.includes(entry.component))
        .map(([key, entry]) => [
          NavConfig.getNavKeyForHash(entry.recordHash ?? ""),
          key,
        ]);

      assert.deepEqual(
        roundTrips.filter(([resolved, key]) => resolved !== key),
        [],
      );
    },
  );

  /** Browser Back: FE pushes a history entry for a record only when the list's hash key differs from the record's entity set; equal, Back skips the list. */
  QUnit.test(
    "gives every list a hash its records' entity set does not share",
    assert => {
      const sharedHashes = Object.values(NAV_CONFIG)
        .filter(entry => FE_LIST_COMPONENTS.includes(entry.component))
        .filter(entry => entry.hash === (entry.recordHash ?? entry.hash))
        .map(entry => entry.hash);

      assert.deepEqual(sharedHashes, []);
    },
  );

  /** The list routes' patterns are their route names, so a hash that drifts from its route opens nothing in the app. */
  QUnit.test("names every list hash after its list route", assert => {
    const drifted = Object.values(NAV_CONFIG)
      .filter(entry => FE_LIST_COMPONENTS.includes(entry.component))
      .filter(entry => entry.hash !== entry.route)
      .map(entry => entry.hash);

    assert.deepEqual(drifted, []);
  });

  /** A record hash for the Transactions list must resolve to its page, or a shared record link lands on the welcome page. */
  QUnit.test("resolves a record's entity set to its list's nav key", assert => {
    assert.strictEqual(
      NavConfig.getNavKeyForHash(HASH_FRAGMENT.TRANSACTIONS_RECORD),
      NAV_KEY.TRANSACTION_LIST,
    );
  });

  /** A hash the shell does not own (another app's or a typo) must not resolve, so the shell leaves the page alone. */
  QUnit.test("resolves an unknown hash fragment to undefined", assert => {
    assert.strictEqual(
      NavConfig.getNavKeyForHash(HASH_FRAGMENT.UNKNOWN),
      undefined,
    );
  });

  /** The lookup is keyed on the bare fragment the shell extracts; it must not need the leading `#`. */
  QUnit.test("resolves a bare hash fragment to its nav key", assert => {
    assert.strictEqual(
      NavConfig.getNavKeyForHash(HASH_FRAGMENT.ISSUERS),
      NAV_KEY.ISSUERS,
    );
  });
});

QUnit.module("NavConfig — page names", hooks => {
  const bundle: { model: ResourceModel } = {
    model: undefined as unknown as ResourceModel,
  };
  hooks.beforeEach(() => {
    bundle.model = new ResourceModel({ bundleName: SHELL.I18N_BUNDLE });
  });
  hooks.afterEach(() => {
    bundle.model.destroy();
  });

  /** Shell page header: the ToolHeader names every page from its entry's label; a missing key shows the raw key as the page name. */
  QUnit.test(
    "gives every entry a label the shell i18n bundle defines",
    assert => {
      const resourceBundle = bundle.model.getResourceBundle() as ResourceBundle;
      const undefinedLabels = Object.values(NAV_CONFIG)
        .map(entry => entry.label)
        .filter(label => !resourceBundle.hasText(label));

      assert.deepEqual(undefinedLabels, []);
    },
  );
});
