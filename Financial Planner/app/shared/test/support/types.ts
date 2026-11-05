// Shapes of the shared-library unit-test fakes.

import type { I18nModelSource } from "com/lifeos/shared/types";
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

export interface ControllerViewFake {
  models: Map<string, unknown>;
  view: I18nModelSource & { setModel(model: unknown, name?: string): void };
}
