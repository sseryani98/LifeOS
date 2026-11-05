// Builders for the Life OS shared-library unit tests: i18n sources, dialog hosts,
// FE's controller copy and recording message boxes.

import type UI5Event from "sap/ui/base/Event";
import type JSONModel from "sap/ui/model/json/JSONModel";

import type {
  ClassHandlerHome,
  ConfirmOptions,
  DialogHostFake,
  FakeDialog,
  FragmentLoad,
  I18nFake,
  MessageBoxModule,
  MessageCalls,
  MessageStubs,
  MessageToastModule,
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
      texts[key]?.replace(
        /\{(\d+)\}/g,
        (placeholder, index: string) => args?.[Number(index)] ?? placeholder,
      ),
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
 * Builds a dialog that counts open and close calls and holds named models.
 * @param instanceId the dialog's (possibly prefixed) control id
 * @returns the fake dialog
 */
export const buildFakeDialog = (instanceId: string): FakeDialog => {
  const models = new Map<string, JSONModel>();
  const dialog: FakeDialog = {
    closeCount: 0,
    openCount: 0,
    close: () => {
      dialog.closeCount += 1;
    },
    getId: () => instanceId,
    getModel: name => models.get(name ?? ""),
    getParent: () => null,
    isA: type => type === "sap.m.Dialog",
    open: () => {
      dialog.openCount += 1;
    },
    setModel: (model, name) => {
      models.set(name ?? "", model);
    },
  };
  return dialog;
};

/**
 * Builds an event whose source is a control nested two levels inside the dialog.
 * @param dialog the dialog the firing control sits in
 * @returns the event
 */
export const buildEventInside = (dialog: FakeDialog): UI5Event => {
  const form = { isA: () => false, getParent: () => dialog };
  const input = { isA: () => false, getParent: () => form };
  return { getSource: () => input } as unknown as UI5Event;
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
 * prototype, where for…in cannot see it — the shape an FE action logic class has.
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
