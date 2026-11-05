// Drives the Transactions action classes with no FE or backend: a ListReport ExtensionAPI stand-in
// and prototype stubs on the collaborators it news up per call. The real DialogManager
// runs, so dialog ids and fragment names are exercised.

import Messaging from "com/lifeos/shared/Messaging";
import TransactionsService from "com/financialplanner/transactions/model/TransactionsService";
import type { SplitSuggestion } from "com/financialplanner/transactions/model/types";
import type ExtensionAPI from "sap/fe/templates/ListReport/ExtensionAPI";
import type UI5Event from "sap/ui/base/Event";
import type JSONModel from "sap/ui/model/json/JSONModel";
import ResourceModel from "sap/ui/model/resource/ResourceModel";

import { I18N_BUNDLE, PERCENT_SWEEP, ROW_AMOUNT } from "../data/constants";

import type {
  CollaboratorCalls,
  CollaboratorStubs,
  FakeDialog,
  FakePage,
  FragmentLoad,
  SuggestionSwitch,
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
  const i18nModel = new ResourceModel({ bundleName: I18N_BUNDLE.NAME });
  const api = {
    getSelectedContexts: () =>
      selectedIds.map(rowId => ({
        getProperty: (path: string) =>
          path === "ID" ? rowId : ROW_AMOUNT[rowId],
      })),
    getModel: (name?: string) => (name === "i18n" ? i18nModel : {}),
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
 * Lists every two-decimal percentage from 0.01 to 100.00 as the text a user types.
 * @returns the typed percentages, in order
 */
export const buildTwoDecimalPercents = (): string[] => {
  const percents: string[] = [];
  for (
    let hundredths = PERCENT_SWEEP.FIRST_HUNDREDTHS;
    hundredths <= PERCENT_SWEEP.LAST_HUNDREDTHS;
    hundredths++
  ) {
    percents.push(
      (hundredths / PERCENT_SWEEP.HUNDREDTHS_PER_PERCENT).toFixed(2),
    );
  }
  return percents;
};

/**
 * Replaces the Messaging and TransactionsService prototypes with recorders, so the
 * instances an action class builds are observable. Call restore() in afterEach.
 * The recurring split suggestion and the row's own split default to none.
 * @returns the recorded calls, failure and suggestion switches, and restore()
 */
export const stubCollaborators = (): CollaboratorStubs => {
  const calls: CollaboratorCalls = {
    bulkApplied: [],
    existingSplits: [],
    reCategorized: [],
    splits: [],
    suggestions: [],
    toasts: [],
    warningArgs: [],
    warnings: [],
  };
  const failure: { message: string | null; target?: string } = {
    message: null,
  };
  const settle = (): Promise<void> => {
    const { message, target } = failure;
    failure.message = null;
    failure.target = undefined;
    // A V4 action failure carries the OData error body, and its target, on `error`.
    return message === null
      ? Promise.resolve()
      : Promise.reject(
          Object.assign(new Error(message), { error: { target } }),
        );
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
  const suggestion: SuggestionSwitch = { result: null, failure: null };
  service.findRecurringSplitSuggestion = (transactionId: string) => {
    calls.suggestions.push(transactionId);
    return suggestion.failure === null
      ? Promise.resolve(suggestion.result)
      : Promise.reject(new Error(suggestion.failure));
  };
  const existing: { split: SplitSuggestion | null } = { split: null };
  service.findExistingSplit = (transactionId: string) => {
    calls.existingSplits.push(transactionId);
    return Promise.resolve(existing.split);
  };
  return {
    calls,
    rejectNextServiceCall: (message, target) => {
      failure.message = message;
      failure.target = target;
    },
    rejectSuggestion: message => {
      suggestion.failure = message;
    },
    restore: () => {
      restoreMessaging();
      Object.assign(service, originals);
    },
    setExistingSplit: split => {
      existing.split = split;
    },
    setSuggestion: result => {
      suggestion.result = result;
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
  messaging.showWarning = (key: string, args?: string[]) => {
    calls.warnings.push(key);
    calls.warningArgs.push(args ?? []);
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
  | "applyBulkCategories"
  | "findExistingSplit"
  | "findRecurringSplitSuggestion"
  | "runReCategorization"
  | "splitTransaction"
> => ({
  applyBulkCategories: service.applyBulkCategories,
  findExistingSplit: service.findExistingSplit,
  findRecurringSplitSuggestion: service.findRecurringSplitSuggestion,
  runReCategorization: service.runReCategorization,
  splitTransaction: service.splitTransaction,
});
