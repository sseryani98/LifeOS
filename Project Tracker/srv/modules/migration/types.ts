/** One sprint as the board and git record it. `sprint` is the code the ledgers key by. */
export interface SnapshotInitiative {
  sprint: string;
  name: string;
  goal: string | null;
  branch: string;
  status: string;
  mergeCommit: string | null;
  tag: string | null;
}

/** One board row. `shipsUi` is judged from the description, not from the story's prefix. */
export interface SnapshotStory {
  story: string;
  sprint: string;
  boardType: string;
  description: string;
  boardStatus: string;
  shipsUi: boolean;
}

/** One defect-log row, every cell as the log prints it. */
export interface SnapshotDefect {
  id: string;
  sprint: string;
  severity: string;
  description: string;
  status: string;
  resolution: string;
}

/** One checkpoint decision, split into what was decided and the reason it records. */
export interface SnapshotDecision {
  decision: string;
  rationale: string | null;
}

/** The checkpoint's one test run, as its coverage table states it. */
export interface SnapshotTestRun {
  total: number;
  passed: number;
  failed: number;
  linesPct: number;
  branchesPct: number;
  failures: unknown[];
}

/** The W1-S2 checkpoint: its own date, and what each register takes from it. */
export interface SnapshotCheckpoint {
  sprint: string;
  date: string;
  decisions: SnapshotDecision[];
  testRun: SnapshotTestRun;
  prose: string;
}

/** Financial Planner's ledgers at the snapshot commit, embedded rather than parsed. */
export interface FinancialPlannerSnapshot {
  sourceCommit: string;
  initiatives: SnapshotInitiative[];
  stories: SnapshotStory[];
  defects: SnapshotDefect[];
  checkpoint: SnapshotCheckpoint;
}

/** A row the load hands to TrackerService, keyed by column. */
export type InsertRow = Record<string, unknown>;

/** The Area → Engagement → Workspace rows, and the Workspace's identifier. */
export interface HierarchyRows {
  workspaceId: string;
  area: InsertRow;
  engagement: InsertRow;
  workspace: InsertRow;
}

/** One Initiative row, with the identifier its Milestones link to. */
export interface InitiativeInsertRow extends InsertRow {
  ID: string;
}

/** One Milestone row, as the type check reads it before the write. */
export interface MilestoneInsertRow extends InsertRow {
  storyId: string;
  fricewType_code: string;
}

/** One Defect row, as the register rules judge it before the write. */
export interface DefectInsertRow extends InsertRow {
  milestone_ID: string | null;
  initiative_ID: string | null;
  status_code: string;
  resolution: string | null;
}

/** One TestRun row, as the target rule judges it before the write. */
export interface TestRunInsertRow extends InsertRow {
  task_ID: string | null;
  initiative_ID: string | null;
}

/** A stored Workspace, as the load's guards read it. */
export interface WorkspaceRef {
  ID: string;
  slug: string;
}

/** A stored Initiative, as the register seed links to it and the tie-out orders it. */
export interface InitiativeRef {
  ID: string;
  name: string;
  position: number | null;
}

/** A stored Milestone, as the type and ordering assertions read it. */
export interface StoryFacts {
  ID: string;
  storyId: string;
  fricewType_code: string;
  position: number | null;
  initiative_ID: string;
}

/** A stored chain row, Task or Subtask, with its story's identifier. */
export interface ChainFacts {
  storyId: string;
  step_code: string;
  status_code: string;
}

/** Who created one stored row. */
export interface CreatorFacts {
  ID: string;
  createdBy: string;
}

/** One entity's line of the tie-out. */
export interface ReconciledCount {
  entity: string;
  expected: number;
  actual: number;
}

/** One reconciliation assertion: the key it fails under and what it found wrong. */
export interface ReconcileFinding {
  key: string;
  offenders: string[];
}

/** What a reconciliation found, before it is reported or failed. */
export interface ReconcileOutcome {
  counts: ReconciledCount[];
  findings: ReconcileFinding[];
}

/** What a passing reconciliation reports. */
export interface ReconciliationReport {
  counts: ReconciledCount[];
}

/** The slice of a request the published typings omit: its accumulated errors, thrown all at once. */
export interface AccumulatingRequest {
  errors?: unknown[];
  reject(): never;
}

/** The target rules' view of a register row's links: Defects use story/sprint, TestRuns task/sprint. */
export interface RegisterTargetLinks {
  milestone_ID?: string | null;
  initiative_ID?: string | null;
  task_ID?: string | null;
}

/** The resolution rule's view of a Defect. */
export interface DefectResolutionFacts {
  status_code: string;
  resolution: string | null;
}
