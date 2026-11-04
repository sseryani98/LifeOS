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
