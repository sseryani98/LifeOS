// Builders for the shared-library unit tests: i18n sources, routers, a stubbed
// browser history, ObjectPage element trees, dialog hosts and recording message boxes.

import History from "sap/ui/core/routing/History";
import type Router from "sap/ui/core/routing/Router";
import type ObjectPageLayout from "sap/uxap/ObjectPageLayout";

import type {
  ClassHandlerHome,
  ConfirmOptions,
  ControllerViewFake,
  DialogHostFake,
  FakeDialog,
  FakeLayout,
  FragmentLoad,
  HistoryStub,
  I18nFake,
  MessageBoxModule,
  MessageCalls,
  MessageStubs,
  MessageToastModule,
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

/**
 * Builds a dialog that counts open and close calls.
 * @param instanceId the dialog's (possibly prefixed) control id
 * @returns the fake dialog
 */
export const buildFakeDialog = (instanceId: string): FakeDialog => {
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
 * Builds a dialog host: a Controller (has getView) or an FE ExtensionAPI (has none).
 * Each load returns a new dialog with the given instance id, or the one mapped to its fragment name.
 * @param withView whether the host is a Controller
 * @param instanceId the id each loaded dialog reports, or a fragment name → id map
 * @returns the host, its recorded loads and the dialogs it handed out
 */
export const buildDialogHost = (
  withView: boolean,
  instanceId: string | Readonly<Record<string, string>>,
): DialogHostFake => {
  const loads: FragmentLoad[] = [];
  const dialogs: FakeDialog[] = [];
  const loadFragment = async (settings: FragmentLoad) => {
    loads.push(settings);
    const dialog = buildFakeDialog(
      typeof instanceId === "string" ? instanceId : instanceId[settings.name],
    );
    dialogs.push(dialog);
    return dialog;
  };
  const host = withView
    ? { loadFragment, getView: () => ({}) }
    : { loadFragment };
  return { dialogs, host: host as unknown as DialogHostFake["host"], loads };
};

/**
 * Builds a class-instance handler home: its press handler lives on the class
 * prototype, where for…in cannot see it — the shape TransactionActions has.
 * @returns the instance and a counter of presses it received
 */
export const buildClassHandlerHome = (): ClassHandlerHome => {
  class SaveHandlers {
    public presses = 0;

    /** Records a save press on this instance. */
    public onButtonSavePress(): void {
      this.presses += 1;
    }
  }
  return new SaveHandlers();
};

/**
 * Copies a fragment controller the way FE's ExtensionAPI.loadFragment does —
 * for…in over its enumerable keys — so a test sees only what FE would bind.
 * @param controller the controller handed to loadFragment
 * @returns the handler object FE would wire the fragment's presses to
 */
export const copyControllerAsFe = (
  controller: object | undefined,
): Record<string, unknown> => {
  const copy: Record<string, unknown> = {};
  for (const key in controller) {
    copy[key] = (controller as Record<string, unknown>)[key];
  }
  return copy;
};

/**
 * Replaces MessageToast.show and the MessageBox dialogs with recorders. A
 * confirmation closes with the action set by closeConfirmWith (OK by default).
 * @returns the recorded texts, the confirm-action switch, and restore()
 */
export const stubMessageBoxes = (): MessageStubs => {
  const calls: MessageCalls = {
    confirms: [],
    errors: [],
    successes: [],
    toasts: [],
    warnings: [],
  };
  const confirmAction: { value: string | null } = { value: "OK" };
  const toast = sap.ui.require("sap/m/MessageToast") as MessageToastModule;
  const box = sap.ui.require("sap/m/MessageBox") as MessageBoxModule;
  const originalToast = { ...pickToast(toast) };
  const originalBox = { ...pickBox(box) };
  toast.show = text => {
    calls.toasts.push(text);
  };
  box.confirm = (text: string, options: ConfirmOptions) => {
    calls.confirms.push(text);
    options.onClose(confirmAction.value);
  };
  box.error = text => {
    calls.errors.push(text);
  };
  box.success = text => {
    calls.successes.push(text);
  };
  box.warning = text => {
    calls.warnings.push(text);
  };
  return {
    calls,
    closeConfirmWith: action => {
      confirmAction.value = action;
    },
    restore: () => {
      Object.assign(toast, originalToast);
      Object.assign(box, originalBox);
    },
  };
};

/**
 * Captures the MessageToast method the stub replaces.
 * @param toast the MessageToast module
 * @returns the original method, for restore()
 */
const pickToast = (toast: MessageToastModule): MessageToastModule => ({
  show: toast.show,
});

/**
 * Captures the MessageBox methods the stub replaces.
 * @param box the MessageBox module
 * @returns the original methods, for restore()
 */
const pickBox = (box: MessageBoxModule): MessageBoxModule => ({
  confirm: box.confirm,
  error: box.error,
  success: box.success,
  warning: box.warning,
});
