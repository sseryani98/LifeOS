import type cds from "@sap/cds";

/** Database-level entity names the read helpers select from. */
const TABLE = {
  ACTIVITY: "com.lifeos.projecttracker.Activity",
  DECISION: "com.lifeos.projecttracker.Decision",
  DEFECT: "com.lifeos.projecttracker.Defect",
  INITIATIVE: "com.lifeos.projecttracker.Initiative",
  MILESTONE: "com.lifeos.projecttracker.Milestone",
  SUBTASK: "com.lifeos.projecttracker.Subtask",
  TASK: "com.lifeos.projecttracker.Task",
  TEST_RUN: "com.lifeos.projecttracker.TestRun",
} as const;

/** One stage row, as an assertion reads it. */
export interface TaskState {
  ID: string;
  status_code: string;
  startedAt: string | null;
  completedAt: string | null;
  notes: string | null;
}

/** One activity row, as an assertion reads it. */
export interface ActivityState {
  kind_code: string;
  actor: string;
  target: string;
  occurredAt: string;
  createdBy: string;
}

/**
 * Reads one stage of a story by its step code.
 * @param milestoneId The story the stage belongs to.
 * @param stepCode The stage code.
 * @returns The stage row.
 */
export async function readTaskByCode(
  milestoneId: string,
  stepCode: string,
): Promise<TaskState> {
  const rows = (await SELECT.from(TABLE.TASK).where({
    milestone_ID: milestoneId,
    step_code: stepCode,
  })) as TaskState[];
  return rows[0];
}

/**
 * Reads one workflow step of a stage by its step code.
 * @param taskId The stage the step hangs off.
 * @param stepCode The step code.
 * @returns The step row.
 */
export async function readSubtaskByCode(
  taskId: string,
  stepCode: string,
): Promise<{ ID: string; status_code: string; completedAt: string | null }> {
  const rows = (await SELECT.from(TABLE.SUBTASK).where({
    task_ID: taskId,
    step_code: stepCode,
  })) as { ID: string; status_code: string; completedAt: string | null }[];
  return rows[0];
}

/**
 * Reads a workspace's activity register in the order it was written.
 * @param workspaceId The workspace to read.
 * @returns The activity rows, oldest first.
 */
export async function readActivityLog(
  workspaceId: string,
): Promise<ActivityState[]> {
  const rows = (await SELECT.from(TABLE.ACTIVITY)
    .columns("kind_code", "actor_code as actor", "target", "occurredAt", "createdBy")
    .where({ workspace_ID: workspaceId })) as ActivityState[];
  return rows.sort((left, right) =>
    left.occurredAt.localeCompare(right.occurredAt),
  );
}

/**
 * Reads one defect.
 * @param defectId The defect wanted.
 * @returns The defect row.
 */
export async function readDefectById(defectId: string): Promise<{
  status_code: string;
  resolution: string | null;
  milestone_ID: string | null;
  initiative_ID: string | null;
  createdBy: string;
}> {
  const rows = (await SELECT.from(TABLE.DEFECT).where({ ID: defectId })) as {
    status_code: string;
    resolution: string | null;
    milestone_ID: string | null;
    initiative_ID: string | null;
    createdBy: string;
  }[];
  return rows[0];
}

/**
 * Reads one decision.
 * @param decisionId The decision wanted.
 * @returns The decision row.
 */
export async function readDecisionById(decisionId: string): Promise<{
  decision: string;
  workspace_ID: string;
  initiative_ID: string | null;
  milestone_ID: string | null;
}> {
  const rows = (await SELECT.from(TABLE.DECISION).where({
    ID: decisionId,
  })) as {
    decision: string;
    workspace_ID: string;
    initiative_ID: string | null;
    milestone_ID: string | null;
  }[];
  return rows[0];
}

/**
 * Reads every story of a sprint.
 * @param initiativeId The sprint to read.
 * @returns The story rows.
 */
export async function readStoriesOf(
  initiativeId: string,
): Promise<{ storyId: string; fricewType_code: string; position: number }[]> {
  return (await SELECT.from(TABLE.MILESTONE).where({
    initiative_ID: initiativeId,
  })) as { storyId: string; fricewType_code: string; position: number }[];
}

/**
 * Counts the sprints of a workspace.
 * @param workspaceId The workspace to read.
 * @returns How many sprints it holds.
 */
export async function countInitiativesOf(workspaceId: string): Promise<number> {
  const rows = (await SELECT.from(TABLE.INITIATIVE).where({
    workspace_ID: workspaceId,
  })) as unknown[];
  return rows.length;
}

/**
 * Counts every story in the store.
 * @returns How many stories exist.
 */
export async function countAllMilestones(): Promise<number> {
  return ((await SELECT.from(TABLE.MILESTONE)) as unknown[]).length;
}

/**
 * Reads the test runs of a workspace.
 * @param workspaceId The workspace to read.
 * @returns The test-run rows.
 */
export async function readTestRunsOf(workspaceId: string): Promise<
  {
    total: number;
    task_ID: string | null;
    initiative_ID: string | null;
    executedAt: string;
  }[]
> {
  return (await SELECT.from(TABLE.TEST_RUN).where({
    workspace_ID: workspaceId,
  })) as {
    total: number;
    task_ID: string | null;
    initiative_ID: string | null;
    executedAt: string;
  }[];
}

/**
 * Reads a story's status through the service, so the derivation that fills it on
 * read is what answers rather than a column.
 * @param service The connected service.
 * @param milestoneId The story wanted.
 * @returns The derived status code.
 */
export async function readDerivedMilestoneStatus(
  service: cds.Service,
  milestoneId: string,
): Promise<string> {
  const rows = (await service.run(
    SELECT.from("TrackerService.Milestones").where({ ID: milestoneId }),
  )) as { status: string }[];
  return rows[0].status;
}
