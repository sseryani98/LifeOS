/** A Task row as the status derivation reads it, with its own stored kind. */
export interface ChainTaskRow {
  ID: string;
  milestone_ID: string;
  status_code: string;
  stepKind: string;
}

/** The payload a Defect create or update carries. */
export interface DefectPayload {
  ID?: string;
  milestone_ID?: string | null;
  initiative_ID?: string | null;
}

/** The payload an Initiative create or update carries. */
export interface InitiativePayload {
  ID?: string;
  name?: string;
  status_code?: string;
  mergeCommit?: string | null;
  tag?: string | null;
  workspace_ID?: string;
}

/** The payload a Milestone create or update carries. */
export interface MilestonePayload {
  ID?: string;
  storyId?: string;
  initiative_ID?: string;
  shipsUi?: boolean;
  /** Create-only and never stored: true means the story was created Done. */
  createdDone?: boolean;
}

/** A methodology library step, as chain instantiation reads it. */
export interface LibraryStepRow {
  code: string;
  kind_code: string;
  conditional: string | null;
  parent_code: string | null;
  position: number;
  requiresHuman: boolean;
}

/** A materialised stage, as instantiation writes it. */
export interface TaskInsertRow {
  ID: string;
  step_code: string;
  kind_code: string;
  position: number;
  requiresHuman: boolean;
  status_code: string;
  milestone_ID: string;
}

/** A materialised workflow step, as instantiation writes it. */
export interface SubtaskInsertRow {
  step_code: string;
  kind_code: string;
  position: number;
  requiresHuman: boolean;
  status_code: string;
  task_ID: string;
}

/** A Milestone row carrying the derived status filled on read. */
export interface MilestoneRow {
  ID: string;
  status?: string | null;
}

/** The payload a TestRun create or update carries. */
export interface TestRunPayload {
  ID?: string;
  task_ID?: string | null;
  initiative_ID?: string | null;
  total?: number | null;
  passed?: number | null;
  failed?: number | null;
  pending?: number | null;
}

/** A stage as the next-action engine reads it: its code, state, kind and place in the chain. */
export interface StageFacts {
  step_code: string;
  status_code: string;
  stepKind: string;
  stepPosition: number;
}

/** A story as the candidate selector reads it: where it sits, and its stages. */
export interface CandidateStory<T extends StageFacts = StageFacts> {
  initiativePosition: number;
  milestonePosition: number;
  tasks: T[];
}

/** The engine's answer: the winning story, the stage within it, and the story's tier. */
export interface CandidateResolution<S extends CandidateStory> {
  story: S;
  task: S["tasks"][number];
  tier: number;
}

/** One stage of a workspace with everything the project-view sections render or order by. */
export interface StageFactRow extends StageFacts {
  ID: string;
  milestone_ID: string;
  requiresHuman: boolean;
  completedAt: string | null;
  stepName: string;
  stepDescription: string;
  driver: string;
  storyId: string;
  milestonePosition: number;
  initiativePosition: number;
  workspaceId: string;
  workspaceSlug: string;
}

/** One story's chain as the project-view sections rank it. */
export interface StoryStages extends CandidateStory<StageFactRow> {
  milestoneId: string;
}

/** The project view's flat next-action elements. */
export interface NextActionFields {
  nextActionStory: string;
  nextActionStepCode: string;
  nextActionLabel: string;
  nextActionDescription: string;
  nextActionKind: string;
  nextActionDriver: string;
  nextActionRequiresHuman: boolean;
  nextActionStatus: string;
  nextActionTier: number;
}

/** A project-view row as its after-READ handler sees it, the two sections present only when expanded. */
export interface ProjectViewRow {
  ID?: string;
  taskQueue?: QueueItemRow[];
  recentCompletions?: CompletedItemList;
  [element: string]: unknown;
}

/** An open task queue row; the tier and blocker are filled on read. */
export interface QueueItemRow {
  ID: string;
  tier?: number | null;
  blockerStepCode?: string | null;
  [element: string]: unknown;
}

/** A recently completed row; the completer is filled on read. */
export interface CompletedItemRow {
  ID: string;
  completedBy?: string | null;
  [element: string]: unknown;
}

/** A read's recently completed rows, with the total a counted read carries. */
export type CompletedItemList = CompletedItemRow[] & { $count?: number };

/** A stage completion event as the completer lookup reads it. */
export interface CompletionEventRow {
  target: string;
  actor_code: string;
}

/** The page a section read asked for, lifted off the query so the rows can be ranked whole first. */
export interface SectionPage {
  top?: number;
  skip: number;
}

/** The slice of a section read's query that carries its page and its columns. */
export interface SectionQuery {
  SELECT?: {
    limit?: { rows?: { val?: number }; offset?: { val?: number } };
    columns?: { func?: string; as?: string }[];
  };
}

/** The one row a bare `$count` read returns in place of the section's rows. */
export interface SectionCountRow {
  $count: number;
}

/** Where one open stage lands in the queue, and what it carries there. */
export interface QueuePlacement {
  rank: number;
  position: number;
  tier: number | null;
  blockerStepCode: string | null;
}
