// Shapes of the CSV Import Wizard unit-test fakes.

import type CsvImportWizard from "com/financialplanner/csvimportwizard/controller/CsvImportWizard.controller";
import type ReviewState from "com/financialplanner/csvimportwizard/model/ReviewState";
import type {
  ClassifiedRow,
  CreatedEntity,
  ImportSummary,
  MatchedTransaction,
  ParseResult,
  ParsedFile,
  SaveRow,
} from "com/financialplanner/csvimportwizard/model/types";
import type { Button$PressEvent } from "sap/m/Button";
import type JSONModel from "sap/ui/model/json/JSONModel";
import type ODataModel from "sap/ui/model/odata/v4/ODataModel";

/** One operation or context the service bound on the fake OData model. */
export interface BoundOperation {
  path: string;
  parameters: Record<string, unknown>;
  invokeCount: number;
}

/** A recorded bindList(...).create(...) call. */
export interface CreatedReference {
  entitySet: string;
  data: object;
}

/** A V4 ODataModel stand-in answering each bound path from a queue. */
export interface FakeODataModel {
  model: ODataModel;
  operations: BoundOperation[];
  creates: CreatedReference[];
  refreshes: { count: number };
  stubAnswer(path: string, ...results: unknown[]): void;
}

/** What the stubbed collaborators recorded across one controller test. */
export interface WizardCalls {
  parsed: { card: string; files: ParsedFile[] }[];
  matchedLookups: string[][];
  createdReferences: { entitySet: string; name: string }[];
  reclassified: { card: string; file: ParsedFile; rowNumber: number; value: string }[];
  saved: { card: string; fileName: string; skippedCount: number; rows: SaveRow[] }[];
  dialogsOpened: string[];
  dialogsClosed: string[];
  toasts: string[];
  warnings: string[];
  errors: string[];
}

/** The answers the stubbed CsvImportWizardService gives. */
export interface ServiceAnswers {
  parseResult: ParseResult;
  matches: Record<string, MatchedTransaction>;
  created: CreatedEntity;
  reclassified: ClassifiedRow;
  summary: ImportSummary;
  failing: Set<string>;
}

/** A controller wired to a fake view, component and controls, with its collaborators stubbed. */
export interface WizardHarness {
  controller: CsvImportWizard;
  state: JSONModel;
  calls: WizardCalls;
  answers: ServiceAnswers;
  defaultModelRefreshes: { count: number };
  wizardSteps: { count: number };
  selectRows(paths: string[]): void;
  setDropZone(element: HTMLElement | null): void;
  renderView(): void;
  buildRowPress(path: string): Button$PressEvent;
  restore(): void;
}

/** A ReviewState on a fresh "ui" model, its service reduced to a matched-transaction lookup. */
export interface ReviewHarness {
  review: ReviewState;
  state: JSONModel;
  matchedLookups: string[][];
  matches: Record<string, MatchedTransaction>;
}
