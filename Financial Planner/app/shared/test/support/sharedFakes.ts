// Builders for the shared-library unit tests: i18n sources, routers, a stubbed
// browser history and ObjectPage element trees.

import History from "sap/ui/core/routing/History";
import type Router from "sap/ui/core/routing/Router";
import type ObjectPageLayout from "sap/uxap/ObjectPageLayout";

import type {
  ControllerViewFake,
  FakeLayout,
  HistoryStub,
  I18nFake,
  ObjectPageFake,
  RouterFake,
} from "./types";

/**
 * Builds a getModel source whose "i18n" bundle resolves only the given texts.
 * @param texts the bundle's key → text map
 * @returns the source and the model names it was asked for
 */
export const buildI18nSource = (texts: Record<string, string>): I18nFake => {
  const requestedModels: (string | undefined)[] = [];
  const bundle = {
    getText: (key: string, args?: string[]) =>
      texts[key]?.replace(/\{(\d+)\}/g, (placeholder, index: string) => args?.[Number(index)] ?? placeholder),
  };
  return {
    requestedModels,
    source: {
      getModel: (name?: string) => {
        requestedModels.push(name);
        return { getResourceBundle: () => bundle };
      },
    },
  };
};

/**
 * Builds a view stand-in carrying an i18n model and recording setModel calls.
 * @param texts the i18n bundle's key → text map
 * @returns the view and the models set on it, by name ("" for the default)
 */
export const buildControllerView = (
  texts: Record<string, string>,
): ControllerViewFake => {
  const models = new Map<string, unknown>();
  const i18n = buildI18nSource(texts).source.getModel("i18n");
  models.set("i18n", i18n);
  return {
    models,
    view: {
      getModel: (name?: string) => models.get(name ?? ""),
      setModel: (model: unknown, name?: string) => {
        models.set(name ?? "", model);
      },
    },
  };
};

/**
 * Builds a router that records every navTo call.
 * @returns the router and its recorded navigations
 */
export const buildRouter = (): RouterFake => {
  const navigations: unknown[][] = [];
  const router = {
    navTo: (...args: unknown[]) => {
      navigations.push(args);
    },
  } as unknown as Router;
  return { navigations, router };
};

/**
 * Pins the UI5 History's previous hash and records browser back steps instead
 * of leaving the test page. Call restore() in afterEach.
 * @param previousHash the hash History reports, undefined for a deep link
 * @returns the recorded back steps and restore()
 */
export const stubHistory = (previousHash: string | undefined): HistoryStub => {
  const backSteps: number[] = [];
  const history = History.getInstance();
  history.getPreviousHash = () => previousHash;
  window.history.go = (delta?: number) => {
    backSteps.push(delta ?? 0);
  };
  return {
    backSteps,
    restore: () => {
      Reflect.deleteProperty(history, "getPreviousHash");
      Reflect.deleteProperty(window.history, "go");
    },
  };
};

/**
 * Builds an ObjectPage whose element tree holds one element per given type; each
 * form carries a layout recording the column counts set on it.
 * @param elementTypes the UI5 class name of every element in the tree
 * @returns the page and the layouts of its forms, in tree order
 */
export const buildObjectPage = (
  elementTypes: readonly string[],
): ObjectPageFake => {
  const layouts: FakeLayout[] = [];
  const elements = elementTypes.map(typeName => {
    const layout: FakeLayout = {};
    if (typeName === "sap.ui.layout.form.Form") {
      layouts.push(layout);
    }
    return {
      typeName,
      getMetadata: () => ({ getName: () => typeName }),
      getLayout: () => ({
        setColumnsM: (count: number) => {
          layout.columnsM = count;
        },
        setColumnsL: (count: number) => {
          layout.columnsL = count;
        },
        setColumnsXL: (count: number) => {
          layout.columnsXL = count;
        },
      }),
    };
  });
  // Real forms sit inside sections, never as direct children: a shallow lookup finds none.
  const page = {
    findElements: (deep?: boolean) => (deep ? elements : []),
  } as unknown as ObjectPageLayout;
  return { layouts, page };
};
