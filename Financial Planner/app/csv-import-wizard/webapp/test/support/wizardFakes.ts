// Drives the CsvImportWizard controller with no view and no backend: a fake view, fake
// byId controls, and prototype stubs on Service, Messaging and DialogManager. The "ui"
// JSON model and ClearPropagation are real, so assertions read the bound state.

import CsvImportWizard from "com/financialplanner/csvimportwizard/controller/CsvImportWizard.controller";
import CsvImportWizardService from "com/financialplanner/csvimportwizard/model/CsvImportWizardService";
import type { ParsedFile } from "com/financialplanner/csvimportwizard/model/types";
import DialogManager from "com/financialplanner/shared/DialogManager";
import Messaging from "com/financialplanner/shared/Messaging";
import type Dialog from "sap/m/Dialog";
import type { Button$PressEvent } from "sap/m/Button";
import type { FileUploader$ChangeEvent } from "sap/ui/unified/FileUploader";
import type JSONModel from "sap/ui/model/json/JSONModel";

import { IMPORT_SUMMARY, CREATED_VENDOR, SERVICE_FAILURE, WIZARD_CONTROL } from "../data/constants";
import { buildClassifiedRow, buildParseResult } from "../data/rows";

import type { ServiceAnswers, WizardCalls, WizardHarness } from "./types";

/**
 * Builds a controller, runs its onInit against the fakes, and returns the harness.
 * Call restore() in afterEach — the collaborator prototypes are shared.
 * @returns the harness
 */
export const buildWizardHarness = (): WizardHarness => {
  const calls: WizardCalls = {
    parsed: [],
    matchedLookups: [],
    createdReferences: [],
    reclassified: [],
    saved: [],
    dialogsOpened: [],
    dialogsClosed: [],
    toasts: [],
    warnings: [],
    errors: [],
  };
  const answers: ServiceAnswers = {
    parseResult: buildParseResult(),
    matches: {},
    created: CREATED_VENDOR,
    reclassified: buildClassifiedRow(),
    summary: IMPORT_SUMMARY,
    failing: new Set(),
  };
  const restoreService = stubService(calls, answers);
  const restoreMessaging = stubMessaging(calls);
  const restoreDialogs = stubDialogs(calls);
  const defaultModelRefreshes = { count: 0 };
  const wizardSteps = { count: 0 };
  const models = new Map<string, unknown>([
    ["", { refresh: () => (defaultModelRefreshes.count += 1) }],
    ["i18n", { getResourceBundle: () => ({ getText: (key: string) => key }) }],
  ]);
  const delegates: { onAfterRendering?: () => void }[] = [];
  const selection: { paths: string[]; dropZone: HTMLElement | null } = { paths: [], dropZone: null };
  const readState = (): JSONModel => models.get("ui") as JSONModel;
  // nextStep and byId are assigned, not declared: the verb-first method-name rule rejects UI5's names.
  const wizard: Record<string, unknown> = {};
  wizard.nextStep = () => (wizardSteps.count += 1);
  const controls: Record<string, object> = {
    [WIZARD_CONTROL.NEW_TABLE]: {
      getSelectedContexts: () => selection.paths.map(path => readState().createBindingContext(path)),
    },
    [WIZARD_CONTROL.WIZARD]: wizard,
    [WIZARD_CONTROL.DROP_ZONE]: { getDomRef: () => selection.dropZone },
  };
  const view = {
    getModel: (name?: string) => models.get(name ?? ""),
    setModel: (model: unknown, name?: string) => models.set(name ?? "", model),
    addEventDelegate: (delegate: { onAfterRendering?: () => void }) => delegates.push(delegate),
  };
  const controller = new CsvImportWizard(undefined as unknown as string);
  const overrides: Record<string, unknown> = {
    getView: () => view,
    getOwnerComponent: () => ({ getModel: () => models.get("") }),
  };
  overrides.byId = (id: string) => controls[id];
  Object.assign(controller, overrides);
  controller.onInit();
  return {
    controller,
    state: readState(),
    calls,
    answers,
    defaultModelRefreshes,
    wizardSteps,
    selectRows: paths => {
      selection.paths = paths;
    },
    setDropZone: element => {
      selection.dropZone = element;
    },
    renderView: () => delegates.forEach(delegate => delegate.onAfterRendering?.()),
    buildRowPress: path =>
      ({
        getSource: () => ({ getBindingContext: () => readState().createBindingContext(path) }),
      }) as unknown as Button$PressEvent,
    restore: () => {
      restoreService();
      restoreMessaging();
      restoreDialogs();
    },
  };
};

/**
 * Builds a browser File from a named CSV fixture, as the picker or a drop yields it.
 * @param file the fixture's name and text
 * @returns the File
 */
export const buildCsvFile = (file: ParsedFile): File =>
  new File([file.content], file.name, { type: "text/csv" });

/**
 * Swaps in a FileReader whose every read fails, as a locked or vanished file does.
 * @returns restores the browser's FileReader
 */
export const failFileReads = (): (() => void) => {
  const original = window.FileReader;
  class FailingFileReader {
    public onload: (() => void) | null = null;
    public onerror: (() => void) | null = null;
    public readAsText(): void {
      setTimeout(() => this.onerror?.(), 0);
    }
  }
  window.FileReader = FailingFileReader as unknown as typeof FileReader;
  return () => {
    window.FileReader = original;
  };
};

/**
 * Builds the FileUploader change event carrying the chosen files.
 * @param files the chosen files, or null when the picker reports none
 * @returns the change event
 */
export const buildUploaderChange = (files: File[] | null): FileUploader$ChangeEvent =>
  ({ getParameter: () => files }) as unknown as FileUploader$ChangeEvent;

/**
 * Dispatches a native drop on an element, as the OS drag-and-drop would.
 * @param zone the drop target
 * @param files the dropped files, or null for a drop carrying no data transfer
 * @returns the dispatched event, to inspect defaultPrevented
 */
export const dropOnZone = (zone: HTMLElement, files: File[] | null): DragEvent => {
  const init: DragEventInit = { cancelable: true };
  if (files) {
    const transfer = new DataTransfer();
    files.forEach(file => transfer.items.add(file));
    init.dataTransfer = transfer;
  }
  const event = new DragEvent("drop", init);
  zone.dispatchEvent(event);
  return event;
};

/**
 * Lets every pending promise chain and queued task settle.
 * @returns a promise resolving on the next macrotask
 */
export const settleAsyncWork = (): Promise<void> =>
  new Promise(resolve => {
    setTimeout(resolve, 0);
  });

/**
 * Polls until a condition holds — FileReader loads land on a later task than one tick.
 * @param condition the condition to wait for
 * @returns a promise resolving once the condition holds, or after ~1 s
 */
export const waitUntil = async (condition: () => boolean): Promise<void> => {
  for (let attempt = 0; attempt < 100 && !condition(); attempt += 1) {
    await new Promise(resolve => {
      setTimeout(resolve, 10);
    });
  }
};

/**
 * Settles a stubbed service call: rejects when the test marked the method failing.
 * @param answers the stub answers
 * @param method the service method name
 * @param value the value to resolve with
 * @returns the settled promise
 */
const settleServiceCall = <T>(answers: ServiceAnswers, method: string, value: T): Promise<T> =>
  answers.failing.has(method) ? Promise.reject(new Error(SERVICE_FAILURE.MESSAGE)) : Promise.resolve(value);

/**
 * Replaces every CsvImportWizardService intent method with a recorder.
 * @param calls the shared call record
 * @param answers what each method answers
 * @returns a callback restoring the originals
 */
const stubService = (calls: WizardCalls, answers: ServiceAnswers): (() => void) => {
  const service = CsvImportWizardService.prototype;
  const originals = {
    createReference: service.createReference,
    loadMatchedTransactions: service.loadMatchedTransactions,
    parseFiles: service.parseFiles,
    reclassifyRow: service.reclassifyRow,
    saveImport: service.saveImport,
  };
  service.parseFiles = (card, files) => {
    calls.parsed.push({ card, files });
    return settleServiceCall(answers, "parseFiles", answers.parseResult);
  };
  service.loadMatchedTransactions = ids => {
    calls.matchedLookups.push(ids);
    return settleServiceCall(answers, "loadMatchedTransactions", answers.matches);
  };
  service.createReference = (entitySet, name) => {
    calls.createdReferences.push({ entitySet, name });
    return settleServiceCall(answers, "createReference", answers.created);
  };
  service.reclassifyRow = (card, file, rowNumber, value) => {
    calls.reclassified.push({ card, file, rowNumber, value });
    return settleServiceCall(answers, "reclassifyRow", answers.reclassified);
  };
  service.saveImport = (card, fileName, skippedCount, rows) => {
    calls.saved.push({ card, fileName, skippedCount, rows });
    return settleServiceCall(answers, "saveImport", answers.summary);
  };
  return () => {
    Object.assign(service, originals);
  };
};

/**
 * Replaces the Messaging methods the wizard uses with recorders.
 * @param calls the shared call record
 * @returns a callback restoring the originals
 */
const stubMessaging = (calls: WizardCalls): (() => void) => {
  const messaging = Messaging.prototype;
  const originals = {
    showError: messaging.showError,
    showToast: messaging.showToast,
    showWarning: messaging.showWarning,
  };
  messaging.showError = key => {
    calls.errors.push(key);
  };
  messaging.showToast = key => {
    calls.toasts.push(key);
  };
  messaging.showWarning = key => {
    calls.warnings.push(key);
  };
  return () => {
    Object.assign(messaging, originals);
  };
};

/**
 * Replaces DialogManager open/close with recorders — the fragment itself is view rendering.
 * @param calls the shared call record
 * @returns a callback restoring the originals
 */
const stubDialogs = (calls: WizardCalls): (() => void) => {
  const dialogs = DialogManager.prototype;
  const originals = { close: dialogs.close, open: dialogs.open };
  dialogs.open = fragmentName => {
    calls.dialogsOpened.push(fragmentName);
    return Promise.resolve({} as Dialog);
  };
  dialogs.close = dialogId => {
    calls.dialogsClosed.push(dialogId);
  };
  return () => {
    Object.assign(dialogs, originals);
  };
};
