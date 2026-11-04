/** Database-level entity names, so every count reads the stored chain, not a view. */
const TABLE = {
  MILESTONE: "com.lifeos.projecttracker.Milestone",
  SUBTASK: "com.lifeos.projecttracker.Subtask",
  TASK: "com.lifeos.projecttracker.Task",
} as const;

/** One materialised stage, as a chain assertion reads it. */
export interface ChainStage {
  ID: string;
  stepCode: string;
  stepKind: string;
  stepPosition: number;
  status_code: string;
  startedAt: string | null;
  completedAt: string | null;
}

/** One materialised workflow step, as a chain assertion reads it. */
export interface ChainStep {
  ID: string;
  stepCode: string;
  stepPosition: number;
  status_code: string;
  completedAt: string | null;
}

/**
 * Counts the stages a story's chain materialised, so a queue assertion can say
 * exactly how many of them should still be on it.
 * @param milestoneId The story whose chain is counted.
 * @returns How many stages the chain holds.
 */
export const countStagesOf = async (milestoneId: string): Promise<number> => {
  const rows = (await SELECT.from(TABLE.TASK)
    .columns("ID")
    .where({ milestone_ID: milestoneId })) as unknown[];
  return rows.length;
};

/**
 * Reads a story's stages in position order, each with the kind and position
 * stored on the stage itself, which no library edit may touch.
 * @param milestoneId The story whose chain is read.
 * @returns The stages, earliest first.
 */
export const readStagesOf = async (milestoneId: string): Promise<ChainStage[]> => {
  const rows = (await SELECT.from(TABLE.TASK)
    .columns(
      "ID",
      "step_code as stepCode",
      "kind_code as stepKind",
      "position as stepPosition",
      "status_code",
      "startedAt",
      "completedAt",
    )
    .where({ milestone_ID: milestoneId })) as ChainStage[];
  return rows.sort((left, right) => left.stepPosition - right.stepPosition);
};

/**
 * Reads every workflow step under every stage of a story, in library position
 * order.
 * @param milestoneId The story whose steps are read.
 * @returns The steps, earliest first.
 */
export const readStepsOfStory = async (milestoneId: string): Promise<ChainStep[]> => {
  const rows = (await SELECT.from(TABLE.SUBTASK)
    .columns(
      "ID",
      "step_code as stepCode",
      "position as stepPosition",
      "status_code",
      "completedAt",
    )
    .where({ "task.milestone_ID": milestoneId })) as ChainStep[];
  return rows.sort((left, right) => left.stepPosition - right.stepPosition);
};

/**
 * Reads the workflow steps of one stage, in library position order.
 * @param taskId The stage whose steps are read.
 * @returns The steps, earliest first.
 */
export const readStepsOfStage = async (taskId: string): Promise<ChainStep[]> => {
  const rows = (await SELECT.from(TABLE.SUBTASK)
    .columns(
      "ID",
      "step_code as stepCode",
      "position as stepPosition",
      "status_code",
      "completedAt",
    )
    .where({ task_ID: taskId })) as ChainStep[];
  return rows.sort((left, right) => left.stepPosition - right.stepPosition);
};

/**
 * Lists the story identifiers that own at least one stage.
 * @returns Each such identifier once, sorted.
 */
export const readStoryIdsWithStages = async (): Promise<string[]> => {
  const rows = (await SELECT.from(TABLE.TASK).columns(
    "milestone.storyId as storyId",
  )) as { storyId: string }[];
  return [...new Set(rows.map(row => row.storyId))].sort();
};

/**
 * Lists the story identifiers that own at least one workflow step.
 * @returns Each such identifier once, sorted.
 */
export const readStoryIdsWithSteps = async (): Promise<string[]> => {
  const rows = (await SELECT.from(TABLE.SUBTASK).columns(
    "task.milestone.storyId as storyId",
  )) as { storyId: string }[];
  return [...new Set(rows.map(row => row.storyId))].sort();
};

/**
 * Counts every stage and every workflow step in the store, for the assertion
 * that a call deleted nothing.
 * @returns Both totals.
 */
export const countChainRows = async (): Promise<{ tasks: number; subtasks: number }> => {
  const tasks = (await SELECT.from(TABLE.TASK).columns("ID")) as unknown[];
  const subtasks = (await SELECT.from(TABLE.SUBTASK).columns("ID")) as unknown[];
  return { tasks: tasks.length, subtasks: subtasks.length };
};

/**
 * Counts the stories in a workspace carrying one identifier, across every
 * sprint of it.
 * @param workspaceId The workspace to read.
 * @param storyId The identifier to count.
 * @returns How many stories carry it.
 */
export const countStoriesInWorkspace = async (
  workspaceId: string,
  storyId: string,
): Promise<number> => {
  const rows = (await SELECT.from(TABLE.MILESTONE)
    .columns("ID")
    .where({ storyId, "initiative.workspace_ID": workspaceId })) as unknown[];
  return rows.length;
};

/**
 * Resolves a story's row identifier from its workspace and story identifier.
 * @param workspaceId The workspace the story belongs to.
 * @param storyId The story identifier.
 * @returns The row identifier.
 */
export const readMilestoneIdOf = async (
  workspaceId: string,
  storyId: string,
): Promise<string> => {
  const rows = (await SELECT.from(TABLE.MILESTONE)
    .columns("ID")
    .where({ storyId, "initiative.workspace_ID": workspaceId })) as { ID: string }[];
  return rows[0].ID;
};

/**
 * Reads a story's row as the database stores it, bypassing the service's
 * derived and virtual elements.
 * @param milestoneId The story to read.
 * @returns Every stored column of the row.
 */
export const readStoredMilestone = async (
  milestoneId: string,
): Promise<Record<string, unknown>> => {
  const rows = (await SELECT.from(TABLE.MILESTONE).where({
    ID: milestoneId,
  })) as Record<string, unknown>[];
  return rows[0];
};
