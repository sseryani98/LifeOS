/** A Task row as the status derivation reads it. */
export interface ChainTaskRow {
  ID: string;
  milestone_ID: string;
  status_code: string;
  stepKind: string;
}

/** The payload a Defect create or update carries. */
export interface DefectPayload {
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
}

/** A Milestone row carrying the derived status filled on read. */
export interface MilestoneRow {
  ID: string;
  status?: string | null;
}

/** The payload a TestRun create carries. */
export interface TestRunPayload {
  task_ID?: string | null;
  initiative_ID?: string | null;
}
