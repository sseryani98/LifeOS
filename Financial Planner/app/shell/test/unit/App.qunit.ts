/// <reference types="qunit" />
import type { SideNavigation$ItemSelectEvent } from "sap/tnt/SideNavigation";

import {
  COMPONENT_NAME,
  HASH,
  NAV_KEY,
  PAGE_NAME,
  ROUTE,
} from "../data/constants";
import { buildShellHarness } from "../support/appControllerFakes";
import type { ShellHarness } from "../support/types";

const state: { shell: ShellHarness } = {
  shell: undefined as unknown as ShellHarness,
};

const startShellAt = (hooks: NestedHooks, initialHash: string): void => {
  hooks.beforeEach(() => {
    state.shell = buildShellHarness(initialHash);
  });
  hooks.afterEach(() => {
    state.shell.restore();
  });
};

const buildItemSelect = (
  key: string | undefined,
): SideNavigation$ItemSelectEvent =>
  ({
    getParameter: () => (key === undefined ? undefined : { getKey: () => key }),
  }) as unknown as SideNavigation$ItemSelectEvent;

const selectNavItem = (key: string | undefined): void => {
  state.shell.controller.onSideNavigationItemSelect(buildItemSelect(key));
};

const createLoadedComponent = (): void => {
  state.shell.createComponent(state.shell.page.contents[0]);
};

const readShellState = (): object => {
  const model = state.shell.getShellModel();
  return {
    selectedKey: model.getProperty("/selectedKey"),
    pageName: model.getProperty("/pageName"),
    backVisible: model.getProperty("/backVisible"),
    welcomeVisible: model.getProperty("/welcomeVisible"),
  };
};

QUnit.module("App — opening with no hash", hooks => {
  startShellAt(hooks, HASH.EMPTY);

  /** A plain launch shows the welcome page with no app loaded and no back button. */
  QUnit.test("shows the welcome page and loads no app", assert => {
    assert.deepEqual(readShellState(), {
      selectedKey: "",
      pageName: "",
      backVisible: false,
      welcomeVisible: true,
    });
    assert.strictEqual(state.shell.page.loaded.length, 0);
  });
});

QUnit.module("App — deep link on load", hooks => {
  startShellAt(hooks, HASH.ISSUERS);

  /** Deep-link restore: a deep link or reload must reopen the page the hash names, selected in the side nav and named in the header. */
  QUnit.test(
    "opens the page the hash names and names it in the header",
    assert => {
      assert.deepEqual(readShellState(), {
        selectedKey: NAV_KEY.ISSUERS,
        pageName: PAGE_NAME.ISSUERS,
        backVisible: true,
        welcomeVisible: false,
      });
      assert.deepEqual(
        state.shell.page.contents.map(container => container.getName()),
        [COMPONENT_NAME.ADMIN_MASTER_DATA],
      );
    },
  );

  /** Deep-link restore: the hosted app loads asynchronously; once it exists it must be routed to the deep-linked list, replacing history. */
  QUnit.test(
    "routes the app to the deep-linked list once it is created",
    assert => {
      createLoadedComponent();

      assert.deepEqual(state.shell.navigations, [
        {
          component: COMPONENT_NAME.ADMIN_MASTER_DATA,
          route: ROUTE.ISSUERS_LIST,
          replace: true,
        },
      ]);
    },
  );
});

QUnit.module("App — deep link with a leading slash", hooks => {
  startShellAt(hooks, HASH.ISSUERS_WITH_SLASH);

  /** Deep-link restore: `#/IssuersList` is the form a router writes and users paste; it must open the same page as `#IssuersList`. */
  QUnit.test("treats #/IssuersList as #IssuersList", assert => {
    assert.strictEqual(
      state.shell.getShellModel().getProperty("/selectedKey"),
      NAV_KEY.ISSUERS,
    );
  });
});

QUnit.module("App — list link from before the list-hash rename", hooks => {
  startShellAt(hooks, HASH.TRANSACTIONS_OLD_LIST);

  /** Every list hash was renamed off its entity set; a bookmark of the old `#/Transactions` list must still open the list, not the welcome page. */
  QUnit.test("opens the list and routes the app to it", assert => {
    createLoadedComponent();

    assert.strictEqual(
      state.shell.getShellModel().getProperty("/selectedKey"),
      NAV_KEY.TRANSACTION_LIST,
    );
    assert.deepEqual(state.shell.navigations, [
      {
        component: COMPONENT_NAME.TRANSACTIONS,
        route: ROUTE.TRANSACTIONS_LIST,
        replace: true,
      },
    ]);
  });
});

QUnit.module("App — deep link into an object page", hooks => {
  startShellAt(hooks, HASH.ISSUERS_OBJECT_PAGE_SUB_PATH);

  /** Deep-link restore: an object-page or sub-page hash belongs to its list's app; the shell must select that app, not fall to welcome. */
  QUnit.test("selects the app that owns the entity in the hash", assert => {
    assert.strictEqual(
      state.shell.getShellModel().getProperty("/selectedKey"),
      NAV_KEY.ISSUERS,
    );
  });
});

QUnit.module("App — deep link to a record on load", hooks => {
  startShellAt(hooks, HASH.TRANSACTIONS_OBJECT_PAGE);

  /** A bookmarked record link must open that record; routing the new app to its list would rewrite the hash and drop the record. */
  QUnit.test(
    "leaves the record hash to the app's own router once it is created",
    assert => {
      createLoadedComponent();

      assert.deepEqual(readShellState(), {
        selectedKey: NAV_KEY.TRANSACTION_LIST,
        pageName: PAGE_NAME.TRANSACTION_LIST,
        backVisible: true,
        welcomeVisible: false,
      });
      assert.deepEqual(state.shell.navigations, []);
    },
  );
});

QUnit.module("App — record hash change into a loaded app", hooks => {
  startShellAt(hooks, HASH.ISSUERS);

  /** Admin pages share one component; a pasted record hash for a sibling page must reach that record, not be overwritten by the sibling's list. */
  QUnit.test(
    "selects the record's page without routing the app to its list",
    assert => {
      createLoadedComponent();
      state.shell.setHash(HASH.REWARDS_PROGRAMS_OBJECT_PAGE);

      assert.strictEqual(
        state.shell.getShellModel().getProperty("/pageName"),
        PAGE_NAME.REWARDS_PROGRAMS,
      );
      assert.deepEqual(state.shell.navigations, [
        {
          component: COMPONENT_NAME.ADMIN_MASTER_DATA,
          route: ROUTE.ISSUERS_LIST,
          replace: true,
        },
      ]);
    },
  );
});

QUnit.module("App — unknown deep link", hooks => {
  startShellAt(hooks, HASH.UNKNOWN);

  /** A hash the shell does not map must leave the welcome page up rather than load an undefined app. */
  QUnit.test("stays on the welcome page", assert => {
    assert.strictEqual(
      state.shell.getShellModel().getProperty("/welcomeVisible"),
      true,
    );
    assert.strictEqual(state.shell.page.loaded.length, 0);
  });
});

QUnit.module("App — hash change while open", hooks => {
  startShellAt(hooks, HASH.ISSUERS);

  /** Deep-link restore: a hash typed or pasted while the shell is open must switch apps, not only the hash at load. */
  QUnit.test("switches to the app a changed hash names", assert => {
    state.shell.setHash(HASH.TRANSACTIONS);

    assert.strictEqual(
      state.shell.getShellModel().getProperty("/selectedKey"),
      NAV_KEY.TRANSACTION_LIST,
    );
    assert.deepEqual(
      state.shell.page.contents.map(container => container.getName()),
      [COMPONENT_NAME.TRANSACTIONS],
    );
  });

  /** A hash the open app writes through its own routing must not make the shell reload that app over itself. */
  QUnit.test(
    "leaves the open app alone when the hash stays within it",
    assert => {
      const removalsBefore = state.shell.page.removeCount;
      state.shell.setHash(HASH.ISSUERS_OBJECT_PAGE);

      assert.strictEqual(state.shell.page.removeCount, removalsBefore);
    },
  );
});

QUnit.module("App — hash change on the welcome page", hooks => {
  startShellAt(hooks, HASH.EMPTY);

  /** No router exists before the first app loads, so a listener on the router's hash changer never fired; a pasted link must still open its page. */
  QUnit.test(
    "opens the page a hash typed on the welcome page names",
    assert => {
      state.shell.setHash(HASH.TRANSACTIONS);

      assert.deepEqual(readShellState(), {
        selectedKey: NAV_KEY.TRANSACTION_LIST,
        pageName: PAGE_NAME.TRANSACTION_LIST,
        backVisible: true,
        welcomeVisible: false,
      });
      assert.deepEqual(
        state.shell.page.contents.map(container => container.getName()),
        [COMPONENT_NAME.TRANSACTIONS],
      );
    },
  );
});

QUnit.module("App — side navigation", hooks => {
  startShellAt(hooks, HASH.EMPTY);

  /** Side-nav contract: a side-nav item opens its page, hiding welcome, showing back and naming the page in the header. */
  QUnit.test("opens the selected page and names it in the header", assert => {
    selectNavItem(NAV_KEY.TRANSACTION_LIST);

    assert.deepEqual(readShellState(), {
      selectedKey: NAV_KEY.TRANSACTION_LIST,
      pageName: PAGE_NAME.TRANSACTION_LIST,
      backVisible: true,
      welcomeVisible: false,
    });
  });

  /** A group header has no key; selecting it expands the group and must not navigate. */
  QUnit.test("ignores a group header with no key", assert => {
    selectNavItem("");

    assert.strictEqual(state.shell.page.loaded.length, 0);
    assert.strictEqual(
      state.shell.getShellModel().getProperty("/welcomeVisible"),
      true,
    );
  });

  /** An itemSelect without an item must be a no-op rather than a crash. */
  QUnit.test("ignores a selection that carries no item", assert => {
    selectNavItem(undefined);

    assert.strictEqual(state.shell.page.loaded.length, 0);
  });

  /** constants.ts: a view key with no NAV_CONFIG entry does nothing rather than load an undefined component. */
  QUnit.test("ignores a key with no nav entry", assert => {
    selectNavItem(NAV_KEY.UNREGISTERED);

    assert.strictEqual(state.shell.page.loaded.length, 0);
    assert.strictEqual(
      state.shell.getShellModel().getProperty("/selectedKey"),
      "",
    );
  });

  /** Switching apps must show only the new app; a stale container left in the page would render two apps at once. */
  QUnit.test("replaces the open app in the content page", assert => {
    selectNavItem(NAV_KEY.TRANSACTION_LIST);
    selectNavItem(NAV_KEY.ISSUERS);

    assert.deepEqual(
      state.shell.page.contents.map(container => container.getName()),
      [COMPONENT_NAME.ADMIN_MASTER_DATA],
    );
  });

  /** Admin pages share one component; reopening it must reuse its container and route it, not boot a second copy. */
  QUnit.test(
    "reuses a loaded app and routes it to the newly selected list",
    assert => {
      selectNavItem(NAV_KEY.ISSUERS);
      createLoadedComponent();
      selectNavItem(NAV_KEY.REWARDS_PROGRAMS);

      assert.strictEqual(
        state.shell.page.loaded[0],
        state.shell.page.loaded[1],
      );
      assert.deepEqual(state.shell.navigations, [
        {
          component: COMPONENT_NAME.ADMIN_MASTER_DATA,
          route: ROUTE.ISSUERS_LIST,
          replace: true,
        },
        {
          component: COMPONENT_NAME.ADMIN_MASTER_DATA,
          route: ROUTE.REWARDS_PROGRAMS_LIST,
          replace: true,
        },
      ]);
      assert.strictEqual(
        state.shell.getShellModel().getProperty("/pageName"),
        PAGE_NAME.REWARDS_PROGRAMS,
      );
    },
  );

  /** Admin pages share one component; a second pick while it is still loading must route to that pick, not the first, or the header and the list disagree. */
  QUnit.test(
    "routes a still-loading app to the latest selected list",
    assert => {
      selectNavItem(NAV_KEY.ISSUERS);
      selectNavItem(NAV_KEY.REWARDS_PROGRAMS);
      state.shell.createComponent(state.shell.page.loaded[0]);

      assert.deepEqual(state.shell.navigations, [
        {
          component: COMPONENT_NAME.ADMIN_MASTER_DATA,
          route: ROUTE.REWARDS_PROGRAMS_LIST,
          replace: true,
        },
      ]);
    },
  );
});

QUnit.module("App — back from an object page", hooks => {
  startShellAt(hooks, HASH.ISSUERS_OBJECT_PAGE);

  /** Back from an object page returns to its list in the same app, replacing history, and keeps the app open. */
  QUnit.test("routes the open app back to its list", assert => {
    createLoadedComponent();
    state.shell.navigations.length = 0;

    state.shell.controller.onButtonNavBackPress();

    assert.deepEqual(state.shell.navigations, [
      {
        component: COMPONENT_NAME.ADMIN_MASTER_DATA,
        route: ROUTE.ISSUERS_LIST,
        replace: true,
      },
    ]);
    assert.strictEqual(
      state.shell.getShellModel().getProperty("/welcomeVisible"),
      false,
    );
  });

  /** Before the hosted app exists there is no router to send back; the shell falls back to welcome instead of throwing. */
  QUnit.test("falls back to welcome while the app is still loading", assert => {
    state.shell.controller.onButtonNavBackPress();

    assert.strictEqual(
      state.shell.getShellModel().getProperty("/welcomeVisible"),
      true,
    );
  });
});

QUnit.module("App — back from a list", hooks => {
  startShellAt(hooks, HASH.ISSUERS);

  /** Back from a list leaves the app: welcome shows, the selection and page name clear, and the hash empties. */
  QUnit.test("returns to the welcome page and clears the hash", assert => {
    createLoadedComponent();

    state.shell.controller.onButtonNavBackPress();

    assert.deepEqual(readShellState(), {
      selectedKey: "",
      pageName: "",
      backVisible: false,
      welcomeVisible: true,
    });
    assert.strictEqual(window.location.hash, HASH.EMPTY);
    assert.strictEqual(state.shell.navigations.length, 1);
  });
});

QUnit.module("App — back with nothing open", hooks => {
  startShellAt(hooks, HASH.EMPTY);

  /** Back with no app selected must leave the shell on welcome rather than look up an empty nav key. */
  QUnit.test("stays on the welcome page", assert => {
    state.shell.controller.onButtonNavBackPress();

    assert.strictEqual(
      state.shell.getShellModel().getProperty("/welcomeVisible"),
      true,
    );
  });
});
