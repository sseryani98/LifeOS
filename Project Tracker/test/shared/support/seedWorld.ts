import { randomUUID } from "node:crypto";

import cds from "@sap/cds";

import { SECOND_WORKSPACE, WORLD } from "../data/world.js";

/**
 * Database-level entity names, so seeding never passes through a write guard.
 * The code lists and the methodology library are absent on purpose: they are
 * the deployed db/data CSVs, and clearWorld never touches them; a suite that
 * edits them (libraryAccess.ts) must restore them itself.
 */
const TABLE = {
  ACTIVITY: "com.lifeos.projecttracker.Activity",
  AREA: "com.lifeos.projecttracker.Area",
  DECISION: "com.lifeos.projecttracker.Decision",
  DEFECT: "com.lifeos.projecttracker.Defect",
  ENGAGEMENT: "com.lifeos.projecttracker.Engagement",
  INITIATIVE: "com.lifeos.projecttracker.Initiative",
  MILESTONE: "com.lifeos.projecttracker.Milestone",
  SUBTASK: "com.lifeos.projecttracker.Subtask",
  TASK: "com.lifeos.projecttracker.Task",
  TEST_RUN: "com.lifeos.projecttracker.TestRun",
  WORKSPACE: "com.lifeos.projecttracker.Workspace",
} as const;

/** The service entity every story is created through, so its create-handler runs. */
const MILESTONES_ENTITY = "TrackerService.Milestones";

/** Identifiers a seeded world hands back to the suite that asked for it. */
export interface SeededWorld {
  workspaceId: string;
  initiativeId: string;
  milestoneId: string;
}

/** The sprint columns a seeded sprint carries. */
export interface SprintColumns {
  name: string;
  goal: string | null;
  branch: string;
  status_code: string;
  mergeCommit?: string | null;
  tag?: string | null;
  position: number;
}

/**
 * Creates one story through the service rather than the table, so the
 * create-handler that materialises its chain runs exactly as it does for every
 * real caller. A raw insert would bypass it and could never fail.
 * @param row The story columns, plus any create-only flag the caller sends.
 * @returns The new story's identifier.
 */
export const createMilestoneThroughService = async (
  row: Record<string, unknown>,
): Promise<string> => {
  const service = await cds.connect.to("TrackerService");
  const milestoneId = randomUUID();
  await service.run(
    INSERT.into(MILESTONES_ENTITY).entries({ ID: milestoneId, ...row }),
  );
  return milestoneId;
};

/**
 * Seeds the hierarchy above every sprint: one area, engagement and workspace.
 * @returns The workspace's identifier.
 */
export const seedHierarchy = async (): Promise<string> => {
  const areaId = randomUUID();
  const engagementId = randomUUID();
  const workspaceId = randomUUID();
  await INSERT.into(TABLE.AREA).entries({ ID: areaId, ...WORLD.AREA });
  await INSERT.into(TABLE.ENGAGEMENT).entries({
    ID: engagementId,
    ...WORLD.ENGAGEMENT,
    area_ID: areaId,
  });
  await INSERT.into(TABLE.WORKSPACE).entries({
    ID: workspaceId,
    ...WORLD.WORKSPACE,
    engagement_ID: engagementId,
  });
  return workspaceId;
};

/**
 * Seeds one sprint into a workspace. A sprint has no create-handler that
 * matters here, so it goes straight to the table.
 * @param workspaceId The workspace the sprint belongs to.
 * @param sprint The sprint columns to write.
 * @returns The new sprint's identifier.
 */
export const seedInitiative = async (
  workspaceId: string,
  sprint: SprintColumns,
): Promise<string> => {
  const initiativeId = randomUUID();
  await INSERT.into(TABLE.INITIATIVE).entries({
    ID: initiativeId,
    ...sprint,
    workspace_ID: workspaceId,
  });
  return initiativeId;
};

/**
 * Seeds a second workspace under the already-seeded engagement, for suites
 * about multi-workspace ambiguity.
 * @returns The new workspace's identifier.
 */
export const seedSecondWorkspace = async (): Promise<string> => {
  const engagements = (await SELECT.from(TABLE.ENGAGEMENT).columns(
    "ID",
  )) as Array<{ ID: string }>;
  const workspaceId = randomUUID();
  await INSERT.into(TABLE.WORKSPACE).entries({
    ID: workspaceId,
    ...SECOND_WORKSPACE,
    engagement_ID: engagements[0].ID,
  });
  return workspaceId;
};

/**
 * Seeds the canonical world: one hierarchy, one active sprint, and one story
 * created in Backlog, whose chain is whatever the create-handler materialises
 * from the deployed library.
 * @returns The identifiers the suite addresses the world by.
 */
export const seedCanonicalWorld = async (): Promise<SeededWorld> => {
  const workspaceId = await seedHierarchy();
  const initiativeId = await seedInitiative(workspaceId, {
    name: WORLD.INITIATIVE.name,
    goal: WORLD.INITIATIVE.goal,
    branch: WORLD.INITIATIVE.branch,
    status_code: "Active",
    position: WORLD.INITIATIVE.position,
  });
  const milestoneId = await createMilestoneThroughService({
    storyId: WORLD.STORY.storyId,
    fricewType_code: WORLD.STORY.fricewType,
    description: WORLD.STORY.description,
    shipsUi: WORLD.STORY.shipsUi,
    position: WORLD.STORY.position,
    initiative_ID: initiativeId,
  });
  return { workspaceId, initiativeId, milestoneId };
};

/**
 * Empties every table the suites write to, so one spec's world never leaks into
 * the next. The deployed library and code lists are left alone.
 * @returns Resolves once the tables are empty.
 */
export const clearWorld = async (): Promise<void> => {
  const ordered = [
    TABLE.ACTIVITY,
    TABLE.DEFECT,
    TABLE.DECISION,
    TABLE.TEST_RUN,
    TABLE.SUBTASK,
    TABLE.TASK,
    TABLE.MILESTONE,
    TABLE.INITIATIVE,
    TABLE.WORKSPACE,
    TABLE.ENGAGEMENT,
    TABLE.AREA,
  ];
  for (const table of ordered) await DELETE.from(table);
};

/**
 * Sets a story's stages to the states a fixture needs, addressed by step code.
 * @param milestoneId The story whose chain is being arranged.
 * @param states One entry per stage code that is not left Not Started.
 * @returns Resolves once every named stage carries its state.
 */
export const setChainStates = async (
  milestoneId: string,
  states: Record<string, { status: string; startedAt?: string; completedAt?: string }>,
): Promise<void> => {
  for (const [code, state] of Object.entries(states)) {
    await UPDATE(TABLE.TASK)
      .set({
        status_code: state.status,
        startedAt: state.startedAt ?? null,
        completedAt: state.completedAt ?? null,
      })
      .where({ milestone_ID: milestoneId, step_code: code });
  }
};

/**
 * Moves a sprint out of Active, for the fixtures about a workspace that has no
 * sprint to hang anything off.
 * @param initiativeId The sprint to move.
 * @param status The status code to set.
 * @returns Resolves once the sprint carries it.
 */
export const setInitiativeStatus = async (
  initiativeId: string,
  status: string,
): Promise<void> => {
  await UPDATE(TABLE.INITIATIVE)
    .set({ status_code: status })
    .where({ ID: initiativeId });
};

/**
 * Sets one workflow step's status directly, for fixtures about open steps.
 * @param taskId The stage the step hangs off.
 * @param stepCode The step to set.
 * @param status The status code to set.
 * @returns Resolves once the step carries it.
 */
export const setSubtaskStatus = async (
  taskId: string,
  stepCode: string,
  status: string,
): Promise<void> => {
  await UPDATE(TABLE.SUBTASK)
    .set({ status_code: status })
    .where({ task_ID: taskId, step_code: stepCode });
};

/**
 * Closes the named workflow steps of a stage at the times given, for fixtures
 * whose assertion is that a later call left those times alone.
 * @param taskId The stage the steps hang off.
 * @param completedAt When each named step closed, keyed by step code.
 * @returns Resolves once every named step is complete.
 */
export const setSubtasksComplete = async (
  taskId: string,
  completedAt: Record<string, string>,
): Promise<void> => {
  for (const [stepCode, time] of Object.entries(completedAt)) {
    await UPDATE(TABLE.SUBTASK)
      .set({ status_code: "complete", completedAt: time })
      .where({ task_ID: taskId, step_code: stepCode });
  }
};
