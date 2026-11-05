// Shapes of the TransactionActions unit-test fakes.

import type ExtensionAPI from "sap/fe/templates/ListReport/ExtensionAPI";
import type FormElement from "sap/ui/layout/form/FormElement";
import type JSONModel from "sap/ui/model/json/JSONModel";
import type Opa5 from "sap/ui/test/Opa5";
import type { SplitSuggestion } from "com/financialplanner/transactions/model/types";

export interface FragmentLoad {
  id?: string;
  name: string;
  controller?: object;
}

export interface FakeDialog {
  closeCount: number;
  openCount: number;
  close(): void;
  getId(): string;
  getModel(name?: string): JSONModel | undefined;
  getParent(): null;
  isA(type: string): boolean;
  open(): void;
  setModel(model: JSONModel, name?: string): void;
}

export interface FakePage {
  api: ExtensionAPI;
  dialogs: Map<string, FakeDialog>;
  loads: FragmentLoad[];
  select(ids: readonly string[]): void;
}

export interface CollaboratorCalls {
  bulkApplied: unknown[][];
  existingSplits: string[];
  reCategorized: string[][];
  splits: unknown[][];
  suggestions: string[];
  toasts: string[];
  warnings: string[];
  warningArgs: string[][];
}

export interface CollaboratorStubs {
  calls: CollaboratorCalls;
  rejectNextServiceCall(message: string, target?: string): void;
  rejectSuggestion(message: string): void;
  restore(): void;
  setExistingSplit(split: SplitSuggestion): void;
  setSuggestion(suggestion: SplitSuggestion): void;
}

export interface FakeOperation {
  path: string;
  parameters: Map<string, unknown>;
  invokeCount: number;
  setParameter(name: string, value: unknown): FakeOperation;
  invoke(): Promise<void>;
  requestObject(): Promise<unknown>;
  getBoundContext(): { getObject(): unknown };
}

export interface FakeODataModel {
  operations: FakeOperation[];
  refreshCount: number;
  bindContext(path: string): FakeOperation;
  refresh(): void;
}

export interface ODataModelHarness {
  model: FakeODataModel;
  rejectInvoke(message: string): void;
  resolveInvoke(): void;
  resolveInvokeWith(payload: unknown): void;
}

export interface SuggestionSwitch {
  result: SplitSuggestion | null;
  failure: string | null;
}

export interface SplitDialogValues {
  pct: string;
  amount: string;
  description: string;
  recurring: boolean;
}

export interface ShareInputLook {
  textAlign: string;
  placeholder: string;
}

export interface DialogInputLook {
  description: string;
  placeholder: string;
}

export interface HeaderStatusLook {
  text: string;
  state: string;
  icon: string;
}

export interface DetailsGroup {
  heading: string;
  top: number;
  elements: FormElement[];
}

export interface DetailsGroupLayout {
  heading: string;
  rows: number;
  underHeading: boolean;
}

export interface TransactionsListActions {
  clearFilters(): void;
  selectRowByDescription(description: string): void;
  runToolbarAction(actionId: string): void;
  selectDialogButton(buttonId: string): void;
  writeDialogInputText(inputId: string, text: string): void;
  openRowByDescription(description: string): void;
  startObjectPageEdit(): void;
  navigateToHash(hash: string): void;
  writeAddressHash(hash: string): void;
  navigateBackInBrowser(): void;
}

export interface TransactionsListAssertions {
  checkSplitDialogValues(values: SplitDialogValues): void;
  checkDialogClosed(dialogId: string): void;
  checkDialogOpen(dialogId: string): void;
  checkNoLogEntry(text: string): void;
  checkDialogText(controlType: string, text: string): void;
  checkFilterBarCollapsed(): void;
  checkFilterTokenText(text: string): void;
  checkColumnHeader(header: string): void;
  checkSplitIcon(description: string, shown: boolean): void;
  checkSplitSharePercent(percent: string): void;
  checkSplitSharePercentEmpty(): void;
  checkLabelRequired(text: string): void;
  checkFieldHidden(label: string): void;
  checkDialogInputAlign(inputId: string, textAlign: string): void;
  checkSplitSharePercentInput(look: ShareInputLook): void;
  checkDialogInputLook(inputId: string, look: DialogInputLook): void;
  checkDialogInputsSameWidth(firstId: string, secondId: string): void;
  checkHeaderStatus(look: HeaderStatusLook): void;
  checkRecordHeaderStatus(transactionId: string, look: HeaderStatusLook): void;
  checkDialogInputValue(inputId: string, value: string): void;
  checkDialogInputState(inputId: string, state: string): void;
  checkSplitShareInputsSameWidth(): void;
  checkRecurringControl(controlType: string, inDialog: boolean): void;
  checkDetailsGroupTitles(anchorLabel: string, titles: readonly string[]): void;
  checkDetailsGroupsIntact(
    anchorLabel: string,
    titles: readonly string[],
  ): void;
  checkDialogWidth(dialogId: string, width: number): void;
  checkObjectPageEdgesAligned(): void;
  checkAnchorBarSquare(): void;
  checkCheckBoxBorderMatchesInput(checkBoxId: string, inputId: string): void;
  checkListShownAtHash(listHash: string): void;
}

export interface JourneyWhen {
  onTheTransactionsList: TransactionsListActions;
}

export interface JourneyThen extends Opa5 {
  onTheTransactionsList: TransactionsListAssertions;
}

export interface FakeSplitContext {
  requested: unknown[][];
  requestSideEffects(paths: unknown[]): Promise<void>;
}

export interface FakePageContext {
  attachCount: number;
  events: string[];
  requested: unknown[][];
  completePatch(success: boolean): Promise<void>;
  getBinding(): object;
  requestSideEffects(paths: unknown[]): Promise<void>;
}

export interface FakeStateContext {
  getPath(): string;
  getModel(): object;
}

export interface VirtualStateHarness {
  states: JSONModel;
  buildContext(path: string): FakeStateContext;
}
