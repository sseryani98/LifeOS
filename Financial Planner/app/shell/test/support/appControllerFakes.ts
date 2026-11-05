// Drives the shell App controller with no rendered view, a recording content page and the
// real shell i18n bundle; hash changes dispatch a real window `hashchange`. The ComponentContainer
// is real but never rendered, so it never loads its app; the test fires `componentCreated`.

import App from "com/financialplanner/shell/controller/App.controller";
import type ComponentContainer from "sap/ui/core/ComponentContainer";
import type View from "sap/ui/core/mvc/View";
import type UIComponent from "sap/ui/core/UIComponent";
import type JSONModel from "sap/ui/model/json/JSONModel";
import type Model from "sap/ui/model/Model";
import ResourceModel from "sap/ui/model/resource/ResourceModel";

import { SHELL } from "../data/constants";

import type { FakeContentPage, InnerNavigation, ShellHarness } from "./types";

/**
 * Builds the content page stand-in that records what the shell loads into it.
 * @returns the fake page
 */
const buildContentPage = (): FakeContentPage => {
  const page: FakeContentPage = {
    contents: [],
    loaded: [],
    removeCount: 0,
    addContent: container => {
      page.contents.push(container);
      page.loaded.push(container);
    },
    removeAllContent: () => {
      page.removeCount += 1;
      page.contents = [];
    },
  };
  return page;
};

/**
 * Builds a view stand-in that only holds named models, as BaseController needs.
 * @returns the fake view
 */
const buildModelView = (): View => {
  const models = new Map<string, Model>();
  return {
    getModel: (name?: string) => models.get(name ?? ""),
    setModel: (model: Model, name?: string) => {
      models.set(name ?? "", model);
    },
  } as unknown as View;
};

/**
 * Starts a shell controller at a URL hash, exactly as the root view's onInit would.
 * @param initialHash the address hash the shell opens with ("" for none)
 * @returns the harness; call restore() in afterEach
 */
export const buildShellHarness = (initialHash: string): ShellHarness => {
  const originalHash = window.location.hash;
  const navigations: InnerNavigation[] = [];
  const created: ComponentContainer[] = [];
  const page = buildContentPage();
  const view = buildModelView();
  const i18nModel = new ResourceModel({ bundleName: SHELL.I18N_BUNDLE });
  const owner = {
    getModel: (name?: string) => (name === "i18n" ? i18nModel : undefined),
  } as unknown as UIComponent;

  const controller = new App(undefined as unknown as string);
  Object.assign(controller, {
    getOwnerComponent: () => owner,
    getView: () => view,
  });
  controller.byId = ((controlId: string) =>
    controlId === SHELL.CONTENT_PAGE_ID
      ? page
      : undefined) as unknown as App["byId"];

  window.location.hash = initialHash;
  controller.onInit();

  return {
    controller,
    setHash: hash => {
      window.location.hash = hash;
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    },
    navigations,
    page,
    createComponent: container => {
      created.push(container);
      const component = {
        getRouter: () => ({
          navTo: (route: string, _params: object, replace: boolean) => {
            navigations.push({
              component: container.getName(),
              route,
              replace,
            });
          },
        }),
      } as unknown as UIComponent;
      container.fireComponentCreated({ component });
    },
    getShellModel: () => view.getModel("shellView") as JSONModel,
    restore: () => {
      controller.onExit();
      window.location.hash = originalHash;
      new Set([...created, ...page.loaded]).forEach(container =>
        container.destroy(),
      );
      i18nModel.destroy();
      controller.destroy();
    },
  };
};
