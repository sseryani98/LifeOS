/// <reference types="qunit" />
import { NAV_CONFIG } from "com/financialplanner/shell/constants";
import ShellComponent from "com/financialplanner/shell/Component";
import type NavigationListItem from "sap/tnt/NavigationListItem";
import Component from "sap/ui/core/Component";
import type Control from "sap/ui/core/Control";

import { HASH, SHELL } from "../data/constants";

const findStylesheets = (href: string): HTMLLinkElement[] =>
  Array.from(
    document.head.querySelectorAll<HTMLLinkElement>(`link[href*="${href}"]`),
  );

const appendStylesheet = (href: string): HTMLLinkElement => {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
  return link;
};

const removeTestStylesheets = (): void => {
  [
    ...findStylesheets("theme-overrides"),
    ...findStylesheets(SHELL.LATE_LIBRARY_HREF),
  ].forEach(link => link.remove());
};

QUnit.module("Component — boot", hooks => {
  const booted: { component: Component | null } = { component: null };
  hooks.beforeEach(() => {
    window.location.hash = HASH.EMPTY;
  });
  hooks.afterEach(() => {
    booted.component?.destroy();
    booted.component = null;
    removeTestStylesheets();
  });

  /** THEME.md: the brand overrides are injected by the shell itself, so every hosted app gets them. */
  QUnit.test("injects the brand override stylesheet on init", async assert => {
    booted.component = await Component.create({
      name: SHELL.COMPONENT_NAME,
      manifest: true,
    });

    assert.strictEqual(findStylesheets("theme-overrides").length, 1);
  });

  /** constants.ts: every side-nav key needs a nav entry and every entry a side-nav item, or a click or a page goes nowhere. */
  QUnit.test(
    "declares a side-nav item for exactly the registered nav keys",
    async assert => {
      booted.component = await Component.create({
        name: SHELL.COMPONENT_NAME,
        manifest: true,
      });
      const rootView = (
        booted.component as ShellComponent
      ).getRootControl() as Control;
      const viewKeys = rootView
        .findAggregatedObjects(true, control =>
          control.isA("sap.tnt.NavigationListItem"),
        )
        .map(item => (item as NavigationListItem).getKey())
        .filter(key => !!key)
        .sort();

      assert.deepEqual(viewKeys, Object.keys(NAV_CONFIG).sort());
    },
  );
});

QUnit.module("Component — stylesheet order", hooks => {
  hooks.afterEach(() => {
    removeTestStylesheets();
  });

  /** THEME.md: library CSS loaded after boot would win the cascade; the overrides must be moved back to last in head. */
  QUnit.test(
    "moves the override stylesheet after late-loaded library CSS",
    assert => {
      const overrides = appendStylesheet(SHELL.THEME_OVERRIDES_HREF);
      appendStylesheet(SHELL.LATE_LIBRARY_HREF);

      ShellComponent.prototype.onAfterRendering();

      assert.strictEqual(document.head.lastElementChild, overrides);
    },
  );

  /** A page rendered before the overrides link exists must not fail its render. */
  QUnit.test(
    "leaves head untouched when no override stylesheet is present",
    assert => {
      const late = appendStylesheet(SHELL.LATE_LIBRARY_HREF);

      ShellComponent.prototype.onAfterRendering();

      assert.strictEqual(document.head.lastElementChild, late);
    },
  );
});
