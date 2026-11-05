// Shapes of the shared-library unit-test fakes.

import type {
  DialogHost,
  I18nModelSource,
} from "com/financialplanner/shared/types";
import type Router from "sap/ui/core/routing/Router";
import type ObjectPageLayout from "sap/uxap/ObjectPageLayout";

export interface I18nFake {
  requestedModels: (string | undefined)[];
  source: I18nModelSource;
}

export interface RouterFake {
  navigations: unknown[][];
  router: Router;
}

export interface HistoryStub {
  backSteps: number[];
  restore(): void;
}

export interface FakeLayout {
  columnsM?: number;
  columnsL?: number;
  columnsXL?: number;
}

export interface ObjectPageFake {
  layouts: FakeLayout[];
  page: ObjectPageLayout;
}

export interface FakeDialog {
  closeCount: number;
  openCount: number;
  close(): void;
  getId(): string;
  open(): void;
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

export interface ControllerViewFake {
  models: Map<string, unknown>;
  view: I18nModelSource & { setModel(model: unknown, name?: string): void };
}
