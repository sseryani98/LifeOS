// Shapes of the Project View test fakes and the journey's page object.

import type formatter from "com/lifeos/projecttracker/projectview/model/formatter";
import type ManagedObject from "sap/ui/base/ManagedObject";
import type JSONModel from "sap/ui/model/json/JSONModel";
import type Context from "sap/ui/model/odata/v4/Context";
import type ODataModel from "sap/ui/model/odata/v4/ODataModel";
import type Opa5 from "sap/ui/test/Opa5";

export interface ListRead {
  path: string;
  start: number | undefined;
  length: number | undefined;
}

export interface FakeODataModel {
  model: ODataModel;
  reads: ListRead[];
  rejectNextRead(message: string): void;
}

export interface FakeView {
  bindingContexts: Context[];
  getModel(name?: string): JSONModel | undefined;
  setBindingContext(context: Context): void;
  setModel(model: JSONModel, name?: string): void;
}

export interface ControllerHarness {
  frameworkInits: number;
  view: FakeView;
  restore(): void;
}

export type FormatterHost = ManagedObject &
  Pick<
    typeof formatter,
    "formatKindText" | "formatStageText" | "formatStatusText" | "formatTierText"
  >;

export interface ProjectViewAssertions {
  checkWorkspaceTitle(name: string): void;
  checkNextActionLabels(status: string, kind: string, tier: string): void;
  checkNextActionAttributes(
    stageTitle: string,
    stageText: string,
    driverTitle: string,
  ): void;
  checkReadSucceeded(): void;
  checkTableColumns(header: string, columns: readonly string[]): void;
  checkTableCellIcons(header: string, icons: readonly string[]): void;
  checkTableCellTexts(header: string, texts: readonly string[]): void;
  checkTableRowCount(id: string, count: number): void;
}

export interface JourneyThen extends Opa5 {
  onTheProjectViewPage: ProjectViewAssertions;
}
