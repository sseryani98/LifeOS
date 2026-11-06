// Drives ProjectViewService and the page controller with no FE runtime or
// backend: a recording OData V4 model, a fake view, and a stubbed FE init.

import ProjectView from "com/lifeos/projecttracker/projectview/controller/ProjectView.controller";
import formatter from "com/lifeos/projecttracker/projectview/model/formatter";
import PageController from "sap/fe/core/PageController";
import type ManagedObject from "sap/ui/base/ManagedObject";
import type JSONModel from "sap/ui/model/json/JSONModel";
import type Context from "sap/ui/model/odata/v4/Context";
import type ODataModel from "sap/ui/model/odata/v4/ODataModel";

import type {
  ControllerHarness,
  FakeODataModel,
  FakeView,
  FormatterHost,
  ListRead,
} from "./types";

/**
 * Builds a workspace row context as a list binding hands it out.
 * @param path the row's binding path
 * @returns the fake context
 */
export const buildFakeContext = (path: string): Context =>
  ({ getPath: () => path }) as unknown as Context;

/**
 * Builds an OData V4 model stand-in whose list bindings record the window they
 * are asked for and resolve with that window of the given rows.
 * @param rows the contexts the store holds, first row first
 * @returns the fake model and its records
 */
export const buildFakeODataModel = (rows: Context[]): FakeODataModel => {
  const reads: ListRead[] = [];
  const failure: { message: string | null } = { message: null };
  const model = {
    bindList: (path: string) => {
      const read: ListRead = { path, start: undefined, length: undefined };
      reads.push(read);
      const binding: Record<string, unknown> = {};
      // Assigned, not a literal method: the name mirrors the V4 binding API.
      binding.requestContexts = (start: number, length: number) => {
        read.start = start;
        read.length = length;
        const message = failure.message;
        failure.message = null;
        return message === null
          ? Promise.resolve(rows.slice(start, start + length))
          : Promise.reject(new Error(message));
      };
      return binding;
    },
  } as unknown as ODataModel;
  return {
    model,
    reads,
    rejectNextRead: message => {
      failure.message = message;
    },
  };
};

/**
 * Builds a view stand-in holding named models and recording its binding context.
 * @returns the fake view
 */
const buildFakeView = (): FakeView => {
  const models = new Map<string, JSONModel>();
  const bindingContexts: Context[] = [];
  return {
    bindingContexts,
    getModel: name => models.get(name ?? ""),
    setBindingContext: context => {
      bindingContexts.push(context);
    },
    setModel: (model, name) => {
      models.set(name ?? "", model);
    },
  };
};

/**
 * Builds the page controller on a fake view and app component, with FE's own
 * page init stubbed, then runs the page's init. Call restore() in afterEach.
 * @param odataModel the app component's default model
 * @returns the harness: the fake view, the FE init count, and restore()
 */
export const buildController = (odataModel: ODataModel): ControllerHarness => {
  const page = PageController.prototype;
  const originalInit = page.onInit;
  const harness: ControllerHarness = {
    frameworkInits: 0,
    view: buildFakeView(),
    restore: () => {
      page.onInit = originalInit;
    },
  };
  page.onInit = () => {
    harness.frameworkInits += 1;
  };
  const controller = new ProjectView("ProjectView");
  // The instance's onInit is chained with FE's controller-extension hooks, which
  // need a live AppComponent; the prototype method is this page's own init.
  Object.assign(controller, {
    getView: () => harness.view,
    getAppComponent: () => ({ getModel: () => odataModel }),
    onInit: ProjectView.prototype.onInit,
  });
  controller.onInit();
  return harness;
};

/**
 * Lets the controller's fire-and-forget workspace read settle.
 * @returns resolves on the next macrotask
 */
export const flushPromises = (): Promise<void> =>
  new Promise(resolve => {
    setTimeout(resolve, 0);
  });

/**
 * Builds a bound-control stand-in carrying the text formatters, called as the
 * view calls them, with an i18n bundle that echoes the key, and any
 * placeholder values after it, so what a formatter resolved is observable.
 * @returns the fake control with the text formatters attached
 */
export const buildFormatterHost = (): FormatterHost => {
  const control = {
    getModel: () => ({
      getResourceBundle: () => ({
        getText: (key: string, args?: string[]) =>
          args ? `${key}:${args.join(",")}` : key,
      }),
    }),
  } as unknown as ManagedObject;
  return Object.assign(control, {
    formatKindText: formatter.formatKindText,
    formatStageText: formatter.formatStageText,
    formatStatusText: formatter.formatStatusText,
    formatTierText: formatter.formatTierText,
  });
};
