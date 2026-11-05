// Shapes of the Connection Manager unit-test fakes.

import type JSONModel from "sap/ui/model/json/JSONModel";
import type Context from "sap/ui/model/odata/v4/Context";
import type ODataModel from "sap/ui/model/odata/v4/ODataModel";
import type Opa5 from "sap/ui/test/Opa5";

export interface OperationBinding {
  path: string;
  context: Context | undefined;
  parameters: Record<string, unknown>;
}

export interface FakeODataModel {
  model: ODataModel;
  bindings: OperationBinding[];
  events: string[];
  rejectNextInvoke(message: string): void;
}

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
  open(): void;
}

export interface FakeView {
  bindingContexts: (Context | null)[];
  getId(): string;
  getModel(name?: string): JSONModel | ODataModel | undefined;
  setBindingContext(context: Context | null): void;
  setModel(model: JSONModel | ODataModel, name?: string): void;
}

export interface ControllerCalls {
  claims: [string, string][];
  frameworkInits: number;
  opened: [string, string][];
  syncs: Context[];
  toasts: string[];
}

export interface ControllerStubs {
  calls: ControllerCalls;
  rejectNextServiceCall(message: string): void;
  restore(): void;
}

export interface ControllerHarness {
  dialogs: Map<string, FakeDialog>;
  loads: FragmentLoad[];
  view: FakeView;
}

export interface ConnectionManagerActions {
  runConnectionsTableAction(text: string): void;
}

export interface ConnectionManagerAssertions {
  checkConnectionsTableColumns(headers: readonly string[]): void;
  checkConnectionsTableAction(text: string): void;
  checkAddConnectionDialogOpen(title: string): void;
}

export interface JourneyWhen {
  onTheConnectionManagerPage: ConnectionManagerActions;
}

export interface JourneyThen extends Opa5 {
  onTheConnectionManagerPage: ConnectionManagerAssertions;
}
