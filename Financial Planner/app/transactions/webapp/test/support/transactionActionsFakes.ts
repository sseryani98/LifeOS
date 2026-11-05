// Drives TransactionActions with no FE or backend: a ListReport ExtensionAPI stand-in
// and prototype stubs on the collaborators it news up per call. The real DialogManager
// runs, so dialog ids and fragment names are exercised.

import Messaging from "com/financialplanner/shared/Messaging";
import TransactionsService from "com/financialplanner/transactions/model/TransactionsService";
import type ExtensionAPI from "sap/fe/templates/ListReport/ExtensionAPI";
import type UI5Event from "sap/ui/base/Event";
import type JSONModel from "sap/ui/model/json/JSONModel";

import type {
  CollaboratorCalls,
  CollaboratorStubs,
  FakeDialog,
  FakePage,
  FragmentLoad,
} from "./types";

/**
 * Builds a dialog whose id carries the namespace prefix FE's loadFragment applies.
 * @param instanceId the framework-prefixed dialog id
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
 * Builds a ListReport page stand-in: a settable row selection and a recording loadFragment.
 * @returns the fake page
 */
export const buildFakePage = (): FakePage => {
  const loads: FragmentLoad[] = [];
  const dialogs = new Map<string, FakeDialog>();
  let selectedIds: readonly string[] = [];
  const api = {
    getSelectedContexts: () =>
      selectedIds.map(rowId => ({
        getProperty: (path: string) => (path === "ID" ? rowId : undefined),
      })),
    getModel: () => ({}),
    loadFragment: async (settings: FragmentLoad) => {
      loads.push(settings);
      const shortName = settings.name.split(".").pop() as string;
      const dialog = buildFakeDialog(
        `${settings.id ?? shortName}--id${shortName}`,
      );
      dialogs.set(settings.name, dialog);
      return dialog;
    },
  } as unknown as ExtensionAPI;
  return {
    api,
    dialogs,
    loads,
    select: ids => {
      selectedIds = ids;
    },
  };
};

/**
 * Builds a press event whose source is a button sitting inside the given dialog.
 * @param dialog the dialog the pressed button belongs to
 * @returns the press event
 */
export const buildPressInside = (dialog: FakeDialog): UI5Event => {
  const button = { isA: () => false, getParent: () => dialog };
  return { getSource: () => button } as unknown as UI5Event;
};

/**
 * Writes what the user typed into a dialog's JSON model, as two-way binding would.
 * @param dialog the open dialog
 * @param modelName the JSON model its inputs bind to
 * @param input the entered values
 */
export const enterDialogInput = (
  dialog: FakeDialog,
  modelName: string,
  input: object,
): void => {
  (dialog.getModel(modelName) as JSONModel).setData({ ...input });
};

/**
 * Replaces the Messaging and TransactionsService prototypes with recorders, so the
 * instances TransactionActions builds per call are observable. Call restore() in afterEach.
 * @returns the recorded calls, a one-shot failure switch, and restore()
 */
export const stubCollaborators = (): CollaboratorStubs => {
  const calls: CollaboratorCalls = {
    bulkApplied: [],
    reCategorized: [],
    splits: [],
    toasts: [],
    warnings: [],
  };
  const failure: { message: string | null } = { message: null };
  const settle = (): Promise<void> => {
    const message = failure.message;
    failure.message = null;
    return message === null
      ? Promise.resolve()
      : Promise.reject(new Error(message));
  };
  const restoreMessaging = stubMessaging(calls);
  const service = TransactionsService.prototype;
  const originals = { ...pickServiceMethods(service) };
  service.applyBulkCategories = (...args: unknown[]) => {
    calls.bulkApplied.push(args);
    return settle();
  };
  service.runReCategorization = (transactionIds: string[]) => {
    calls.reCategorized.push(transactionIds);
    return settle();
  };
  service.splitTransaction = (...args: unknown[]) => {
    calls.splits.push(args);
    return settle();
  };
  return {
    calls,
    rejectNextServiceCall: message => {
      failure.message = message;
    },
    restore: () => {
      restoreMessaging();
      Object.assign(service, originals);
    },
  };
};

/**
 * Replaces the Messaging toast and warning methods with recorders.
 * @param calls the shared call record
 * @returns a callback restoring the original methods
 */
const stubMessaging = (calls: CollaboratorCalls): (() => void) => {
  const messaging = Messaging.prototype;
  const originals = {
    showToast: messaging.showToast,
    showWarning: messaging.showWarning,
  };
  messaging.showToast = (key: string) => {
    calls.toasts.push(key);
  };
  messaging.showWarning = (key: string) => {
    calls.warnings.push(key);
  };
  return () => {
    Object.assign(messaging, originals);
  };
};

/**
 * Captures the TransactionsService intent methods the stubs replace.
 * @param service the TransactionsService prototype
 * @returns the original methods, for restore()
 */
const pickServiceMethods = (
  service: TransactionsService,
): Pick<
  TransactionsService,
  "applyBulkCategories" | "runReCategorization" | "splitTransaction"
> => ({
  applyBulkCategories: service.applyBulkCategories,
  runReCategorization: service.runReCategorization,
  splitTransaction: service.splitTransaction,
});
