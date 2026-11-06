import type cds from "@sap/cds";
import type { ZodRawShape } from "zod";

/** What a verb needs to run: a connected service, and who is calling. */
export interface VerbContext {
  service: cds.Service;
  actor: string;
}

/** Anything that can run a CQL statement — the service, or a transaction on it. */
export type QueryRunner = Pick<cds.Service, "run">;

/**
 * The resolved next incomplete stage of a story. Status and kind are codes;
 * status names the verb that moves it on, and requiresHuman says up front when
 * an agent cannot close it.
 */
export interface NextAction {
  story: string;
  stepCode: string;
  name: string;
  description: string;
  kind: string;
  driver: string;
  requiresHuman: boolean;
  status: string;
  tier: number;
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
  /** Present and true only when the store itself was unreachable. */
  retryable?: boolean;
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
  requiresHuman: boolean;
}

/** A chain row as the gateway reads it, carrying the step description a next action hands back. */
export interface DescribedChainRow extends ChainRow {
  stepDescription: string;
}

/** A story as the workspace-wide next action ranks it. */
export interface CandidateChain {
  storyId: string;
  initiativePosition: number;
  milestonePosition: number;
  tasks: DescribedChainRow[];
}

/** A Subtask with its methodology step flattened on. */
export interface SubtaskRow {
  ID: string;
  status_code: string;
  completedAt: string | null;
  step_code: string;
  stepName: string;
  stepPosition: number;
  stepKind: string;
  driver: string;
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

/** The optional fields a rejection carries beside its status, key and message. */
export interface VerbErrorDetail {
  target?: string;
  remediation?: string;
  rule?: string;
}

/** What a verb body hands back for the envelope to carry. */
export interface VerbOutcome {
  nextAction?: NextAction | null;
  warnings?: VerbWarning[];
  extra?: Record<string, unknown>;
}

/** A stage of the composed project-view tree, with its steps nested on. */
export interface ComposedStage extends DescribedChainRow {
  subtasks: SubtaskRow[];
}

/** A story of the composed tree, with its derived status and its chain. */
export interface ComposedStory extends MilestoneRow {
  status: string;
  chain: ComposedStage[];
}

/** A sprint of the composed tree, with its stories nested on. */
export interface ComposedInitiative extends InitiativeRow {
  milestones: ComposedStory[];
}

/** complete_stage's arguments. */
export interface CompleteStageInput {
  story: string;
  stage: string;
  notes?: string;
}

/** complete_subtask's arguments. */
export interface CompleteSubtaskInput {
  story: string;
  stage: string;
  subtask: string;
}

/** log_defect's arguments. */
export interface LogDefectInput {
  story?: string;
  workspace?: string;
  severity: string;
  title: string;
  description: string;
  references?: string;
}

/** next_action's arguments. */
export interface NextActionInput {
  story?: string;
}

/** plan_sprint's arguments. */
export interface PlanSprintInput {
  workspace: string;
  name: string;
  goal: string;
  branch: string;
  stories: PlannedStory[];
}

/** project_view's arguments. */
export interface ProjectViewInput {
  workspace?: string;
}

/** record_decision's arguments. */
export interface RecordDecisionInput {
  target: string;
  context: string;
  options?: string;
  decision: string;
  rationale: string;
}

/** record_test_run's arguments. */
export interface RecordTestRunInput {
  story?: string;
  stage?: string;
  workspace?: string;
  metrics: TestRunMetrics;
  executedAt: string;
}

/** reopen_stage's arguments. */
export interface ReopenStageInput {
  story: string;
  stage: string;
  reason: string;
}

/** resolve_defect's arguments. */
export interface ResolveDefectInput {
  defect: string;
  resolution: string;
}

/** start_stage's arguments. */
export interface StartStageInput {
  story: string;
  stage: string;
}
