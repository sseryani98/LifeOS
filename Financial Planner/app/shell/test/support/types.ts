// Shapes of the shell App controller unit-test fakes.

import type App from "com/financialplanner/shell/controller/App.controller";
import type ComponentContainer from "sap/ui/core/ComponentContainer";
import type JSONModel from "sap/ui/model/json/JSONModel";

export interface InnerNavigation {
  component: string;
  route: string;
  replace: boolean;
}

export interface FakeContentPage {
  contents: ComponentContainer[];
  loaded: ComponentContainer[];
  removeCount: number;
  addContent(container: ComponentContainer): void;
  removeAllContent(): void;
}

export interface ShellHarness {
  controller: App;
  setHash(hash: string): void;
  navigations: InnerNavigation[];
  page: FakeContentPage;
  createComponent(container: ComponentContainer): void;
  getShellModel(): JSONModel;
  restore(): void;
}
