// Drives ConnectionService and the page controller with no FE runtime or backend:
// a recording OData V4 model, a fake view, and prototype stubs on collaborators.
// The real DialogManager runs, so the dialog fragment name and id are exercised.

import ConnectionManager from "com/financialplanner/connectionmanager/controller/ConnectionManager.controller";
import ConnectionService from "com/financialplanner/connectionmanager/model/ConnectionService";
import formatter from "com/financialplanner/connectionmanager/model/formatter";
import Messaging from "com/lifeos/shared/Messaging";
import PageController from "sap/fe/core/PageController";
import type { Table$SelectionChangeEvent } from "sap/fe/macros/table/Table";
import type ManagedObject from "sap/ui/base/ManagedObject";
import type UI5Element from "sap/ui/core/Element";
import type JSONModel from "sap/ui/model/json/JSONModel";
import type Context from "sap/ui/model/odata/v4/Context";
import type ODataModel from "sap/ui/model/odata/v4/ODataModel";

import type {
  ControllerCalls,
  ControllerHarness,
  ControllerStubs,
  FakeDialog,
  FakeODataModel,
  FakeView,
  FragmentLoad,
  OperationBinding,
} from "./types";

/**
 * Builds an OData V4 model stand-in whose bindContext returns a recording
 * operation binding, and which logs invoke/refresh in the order they happen.
 * @returns the fake model and its records
 */
export const buildFakeODataModel = (): FakeODataModel => {
  const bindings: OperationBinding[] = [];
  const events: string[] = [];
  const failure: { message: string | null } = { message: null };
  const model = {
    bindContext: (path: string, context?: Context) => {
      const binding: OperationBinding = { path, context, parameters: {} };
      bindings.push(binding);
      const operation: Record<string, unknown> = {
        setParameter: (name: string, value: unknown) => {
          binding.parameters[name] = value;
        },
      };
      // Assigned, not a literal method: the name mirrors the V4 binding API.
      operation.invoke = () => {
        events.push(`invoke ${path}`);
        const message = failure.message;
        failure.message = null;
        return message === null
          ? Promise.resolve()
          : Promise.reject(new Error(message));
      };
      return operation;
    },
    refresh: () => {
      events.push("refresh");
    },
  } as unknown as ODataModel;
  return {
    model,
    bindings,
    events,
    rejectNextInvoke: message => {
      failure.message = message;
    },
  };
};

/**
 * Builds a Provider Connection row context as the connections table hands it out.
 * @param path the row's binding path
 * @returns the fake context
 */
export const buildFakeContext = (path: string): Context =>
  ({ getPath: () => path }) as unknown as Context;

/**
 * Builds a table selectionChange event carrying the given selection.
 * @param selectedContexts the selected rows, or undefined when the parameter is absent
 * @returns the event
 */
export const buildSelectionEvent = (
  selectedContexts?: Context[],
): Table$SelectionChangeEvent =>
  ({
    getParameters: () =>
      selectedContexts === undefined ? {} : { selectedContexts },
  }) as unknown as Table$SelectionChangeEvent;

/**
 * Runs formatStatusText as the view does — bound to the formatted control — on a
 * control whose i18n bundle echoes the key, so the chosen key is observable.
 * @param status the sync status code to format
 * @returns the i18n key the formatter resolved
 */
export const formatStatusTextKey = (status: string): string => {
  const control = {
    getModel: () => ({
      getResourceBundle: () => ({ getText: (key: string) => key }),
    }),
  } as unknown as ManagedObject;
  const boundControl = Object.assign(control, {
    formatStatusText: formatter.formatStatusText,
  });
  return boundControl.formatStatusText(status);
};

/**
 * Builds the page controller on a fake view and a recording loadFragment, then runs its init.
 * @param odataModel the view's default model
 * @returns the controller and the harness records
 */
export const buildController = (
  odataModel: ODataModel,
): { controller: ConnectionManager; harness: ControllerHarness } => {
  const view = buildFakeView();
  view.setModel(odataModel);
  const loads: FragmentLoad[] = [];
  const dialogs = new Map<string, FakeDialog>();
  const controller = new ConnectionManager("ConnectionManager");
  Object.assign(controller, {
    getView: () => view,
    loadFragment: async (settings: FragmentLoad) => {
      loads.push(settings);
      const dialog = buildFakeDialog(`${view.getId()}--idAddConnectionDialog`);
      dialogs.set(settings.name, dialog);
      return dialog as unknown as UI5Element;
    },
  });
  // The instance's onInit is chained with FE's controller-extension hooks, which
  // need a live AppComponent; the prototype method is this page's own init.
  Object.assign(controller, { onInit: ConnectionManager.prototype.onInit });
  controller.onInit();
  return { controller, harness: { dialogs, loads, view } };
};

/**
 * Lets the controller's fire-and-forget service promises settle.
 * @returns resolves on the next macrotask
 */
export const flushPromises = (): Promise<void> =>
  new Promise(resolve => {
    setTimeout(resolve, 0);
  });

/**
 * Writes what the user typed into the Add Connection dialog, as two-way binding would.
 * @param view the controller's view
 * @param token the setup token text
 * @param displayName the display name text
 */
export const enterClaimInput = (
  view: FakeView,
  token: string,
  displayName: string,
): void => {
  const uiModel = view.getModel("ui") as JSONModel;
  uiModel.setProperty("/setupToken", token);
  uiModel.setProperty("/displayName", displayName);
};

/**
 * Replaces Messaging, ConnectionService, FE PageController.onInit and window.open
 * with recorders, so the controller's effects are observable. Call restore() in afterEach.
 * @returns the recorded calls, a one-shot failure switch, and restore()
 */
export const stubControllerCollaborators = (): ControllerStubs => {
  const calls: ControllerCalls = {
    claims: [],
    frameworkInits: 0,
    opened: [],
    syncs: [],
    toasts: [],
  };
  const failure: { message: string | null } = { message: null };
  const settle = (): Promise<void> => {
    const message = failure.message;
    failure.message = null;
    return message === null
      ? Promise.resolve()
      : Promise.reject(new Error(message));
  };
  const messaging = Messaging.prototype;
  const service = ConnectionService.prototype;
  const page = PageController.prototype;
  const originals = {
    showToast: messaging.showToast,
    claimSetupToken: service.claimSetupToken,
    syncNow: service.syncNow,
    onInit: page.onInit,
    open: window.open,
  };
  messaging.showToast = (key: string) => {
    calls.toasts.push(key);
  };
  service.claimSetupToken = (token: string, displayName: string) => {
    calls.claims.push([token, displayName]);
    return settle();
  };
  service.syncNow = (context: Context) => {
    calls.syncs.push(context);
    return settle();
  };
  page.onInit = () => {
    calls.frameworkInits += 1;
  };
  window.open = (url?: string | URL, target?: string) => {
    calls.opened.push([String(url), String(target)]);
    return null;
  };
  return {
    calls,
    rejectNextServiceCall: message => {
      failure.message = message;
    },
    restore: () => {
      messaging.showToast = originals.showToast;
      service.claimSetupToken = originals.claimSetupToken;
      service.syncNow = originals.syncNow;
      page.onInit = originals.onInit;
      window.open = originals.open;
    },
  };
};

/**
 * Builds a dialog stand-in carrying the view-prefixed id a Controller's loadFragment applies.
 * @param instanceId the prefixed dialog id
 * @returns the fake dialog
 */
const buildFakeDialog = (instanceId: string): FakeDialog => {
  const dialog: FakeDialog = {
    closeCount: 0,
    openCount: 0,
    close: () => {
      dialog.closeCount += 1;
    },
    getId: () => instanceId,
    open: () => {
      dialog.openCount += 1;
    },
  };
  return dialog;
};

/**
 * Builds a view stand-in holding named models and recording its binding context.
 * @returns the fake view
 */
const buildFakeView = (): FakeView => {
  const models = new Map<string, JSONModel | ODataModel>();
  const bindingContexts: (Context | null)[] = [];
  return {
    bindingContexts,
    getId: () => "idConnectionManagerView",
    getModel: name => models.get(name ?? ""),
    setBindingContext: context => {
      bindingContexts.push(context);
    },
    setModel: (model, name) => {
      models.set(name ?? "", model);
    },
  };
};
