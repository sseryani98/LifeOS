// Shapes of the Life OS shared-library unit-test fakes.

import type { DialogHost, I18nModelSource } from "com/lifeos/shared/types";
import type JSONModel from "sap/ui/model/json/JSONModel";

export interface I18nFake {
  requestedModels: (string | undefined)[];
  source: I18nModelSource;
}

export interface FakeDialog {
  closeCount: number;
  openCount: number;
  close(): void;
  getId(): string;
  getModel(name?: string): JSONModel | undefined;
  getParent(): unknown;
  isA(type: string): boolean;
  open(): void;
  setModel(model: JSONModel, name?: string): void;
}

export interface FragmentLoad {
  id?: string;
  name: string;
  controller?: object;
}

export interface ClassHandlerHome {
  presses: number;
  onButtonSavePress(): void;
}

export interface DialogHostFake {
  dialogs: FakeDialog[];
  host: DialogHost;
  loads: FragmentLoad[];
}

export interface MessageCalls {
  confirms: string[];
  errors: string[];
  successes: string[];
  toasts: string[];
  warnings: string[];
}

export interface MessageStubs {
  calls: MessageCalls;
  closeConfirmWith(action: string | null): void;
  restore(): void;
}

export interface ConfirmOptions {
  onClose(action: string | null): void;
}

export interface MessageToastModule {
  show(text: string): void;
}

export interface MessageBoxModule {
  confirm(text: string, options: ConfirmOptions): void;
  error(text: string): void;
  success(text: string): void;
  warning(text: string): void;
}
