import type cds from "@sap/cds";
import type { ZodRawShape } from "zod";

/** What a verb needs to run: a connected service, and who is calling. */
export interface VerbContext {
  service: cds.Service;
  actor: string;
}

/** Anything that can run a CQL statement — the service, or a transaction on it. */
export type QueryRunner = Pick<cds.Service, "run">;

/** The resolved next incomplete stage of a story. */
export interface NextAction {
  storyId: string;
  stepCode: string;
  label: string;
  driver: string;
}

/** A non-blocking condition reported alongside a success. */
export interface VerbWarning {
  code: string;
  message: string;
  target?: string;
}

/** The success envelope every verb returns. */
export interface VerbSuccess {
  ok: true;
  timestamp: string;
  nextAction: NextAction | null;
  warnings: VerbWarning[];
  [extra: string]: unknown;
}

/** The failure envelope every rejected verb returns. */
export interface VerbFailure {
  ok: false;
  timestamp: string;
  status: number;
  code: string;
  message: string;
  target?: string;
  remediation?: string;
  rule?: string;
}

/** Either envelope. */
export type VerbResult = VerbSuccess | VerbFailure;

/** One registered tool: its schema, and the function behind it. */
export interface VerbDefinition {
  name: string;
  title: string;
  description: string;
  inputShape: ZodRawShape;
  readOnly: boolean;
  run(ctx: VerbContext, input: unknown): Promise<VerbResult>;
}

/** A Workspace as the verb layer reads it. */
export interface WorkspaceRow {
  ID: string;
  slug: string;
  name: string;
  currentFocus: string | null;
}

/** An Initiative as the verb layer reads it. */
export interface InitiativeRow {
  ID: string;
  name: string;
  goal: string | null;
  branch: string;
  status_code: string;
  mergeCommit: string | null;
  tag: string | null;
  position: number;
}

/** A Milestone as the verb layer reads it. */
export interface MilestoneRow {
  ID: string;
  storyId: string;
  fricewType_code: string;
  description: string;
  shipsUi: boolean;
  position: number;
  initiative_ID: string;
}

/** A Task with its methodology step flattened on. */
export interface ChainRow {
  ID: string;
  status_code: string;
  startedAt: string | null;
  completedAt: string | null;
  notes: string | null;
  step_code: string;
  stepName: string;
  stepPosition: number;
  stepKind: string;
  driver: string;
}

/** A Subtask with its methodology step flattened on. */
export interface SubtaskRow {
  ID: string;
  status_code: string;
  completedAt: string | null;
  step_code: string;
  stepName: string;
  stepPosition: number;
}

/** A Defect as the verb layer reads it. */
export interface DefectRow {
  ID: string;
  status_code: string;
  severity_code: string;
  title: string;
  description: string;
  references: string | null;
  resolution: string | null;
  milestone_ID: string | null;
  initiative_ID: string | null;
  workspace_ID: string;
  workspaceSlug: string;
}

/** The metrics a recorded test run carries. */
export interface TestRunMetrics {
  total: number;
  passed: number;
  failed: number;
  pending?: number;
  durationMs?: number;
  linesPct?: number;
  branchesPct?: number;
  failures?: { suite: string; title: string; message: string }[];
}

/** One story row of a sprint plan. */
export interface PlannedStory {
  id: string;
  type: string;
  description: string;
  shipsUi: boolean;
}

/** The Activity event a write verb emits inside its own transaction. */
export interface ActivityEvent {
  kind: string;
  target: string;
  workspaceId: string;
  payload?: Record<string, unknown>;
}
