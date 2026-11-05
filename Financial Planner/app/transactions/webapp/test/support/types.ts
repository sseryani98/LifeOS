// Shapes of the TransactionActions unit-test fakes.

import type ExtensionAPI from "sap/fe/templates/ListReport/ExtensionAPI";
import type JSONModel from "sap/ui/model/json/JSONModel";

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
  reCategorized: string[][];
  splits: unknown[][];
  toasts: string[];
  warnings: string[];
}

export interface CollaboratorStubs {
  calls: CollaboratorCalls;
  rejectNextServiceCall(message: string): void;
  restore(): void;
}
