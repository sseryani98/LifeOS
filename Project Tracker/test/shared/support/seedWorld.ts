import { randomUUID } from "node:crypto";

import { CODE_LISTS } from "../data/codeLists.js";
import {
  METHODOLOGY,
  STAGE_STEPS,
  SUBTASK_STEPS,
} from "../data/methodology.js";
import { WORLD } from "../data/world.js";

/** Database-level entity names, so seeding never passes through a write guard. */
const TABLE = {
  ACTIVITY: "com.lifeos.projecttracker.Activity",
  AREA: "com.lifeos.projecttracker.Area",
  DEFECT: "com.lifeos.projecttracker.Defect",
  ENGAGEMENT: "com.lifeos.projecttracker.Engagement",
  INITIATIVE: "com.lifeos.projecttracker.Initiative",
  METHODOLOGY: "com.lifeos.projecttracker.Methodology",
  METHODOLOGY_STEP: "com.lifeos.projecttracker.MethodologyStep",
  MILESTONE: "com.lifeos.projecttracker.Milestone",
  SUBTASK: "com.lifeos.projecttracker.Subtask",
  TASK: "com.lifeos.projecttracker.Task",
  WORKSPACE: "com.lifeos.projecttracker.Workspace",
} as const;

/** Identifiers a seeded world hands back to the suite that asked for it. */
export interface SeededWorld {
  workspaceId: string;
  initiativeId: string;
  milestoneId: string;
}

/**
 * Seeds every code list. Referential integrity is enforced at the database, so
 * this runs before anything else.
 * @returns Resolves once every list is populated.
 */
export async function seedCodeLists(): Promise<void> {
  for (const [list, rows] of Object.entries(CODE_LISTS)) {
    await INSERT.into(`com.lifeos.projecttracker.${list}`).entries(
      rows as unknown as Record<string, unknown>[],
    );
  }
}

/**
 * Seeds the methodology library the chains are instantiated from.
 * @returns Resolves once the library is in place.
 */
export async function seedMethodologyLibrary(): Promise<void> {
  await INSERT.into(TABLE.METHODOLOGY).entries({ ...METHODOLOGY });
  await INSERT.into(TABLE.METHODOLOGY_STEP).entries(
    STAGE_STEPS.map(step => ({
      code: step.code,
      name: step.name,
      description: `${step.name} stage`,
      kind_code: step.kind,
      position: step.position,
      conditional: step.conditional,
      requiresHuman: step.requiresHuman,
      driver: step.driver,
      parent_code: null,
      methodology_code: METHODOLOGY.code,
    })),
  );
  await INSERT.into(TABLE.METHODOLOGY_STEP).entries(
    SUBTASK_STEPS.map(step => ({
      code: step.code,
      name: step.name,
      description: `${step.name} step`,
      kind_code: step.kind,
      position: step.position,
      conditional: step.conditional,
      requiresHuman: false,
      driver: "/build",
      parent_code: STAGE_STEPS[0].code,
      methodology_code: METHODOLOGY.code,
    })),
  );
}

/**
 * Materialises a story's chain the way instantiation will once it exists: every
 * Required and Recommended step, plus a Conditional step only where its named
 * predicate holds.
 * @param milestoneId The story to instantiate.
 * @param shipsUi The predicate the Conditional steps name.
 * @returns Resolves once the chain is in place.
 */
export async function seedStoryChain(
  milestoneId: string,
  shipsUi: boolean,
): Promise<void> {
  for (const step of STAGE_STEPS) {
    if (step.conditional === "shipsUi" && !shipsUi) continue;
    const taskId = randomUUID();
    await INSERT.into(TABLE.TASK).entries({
      ID: taskId,
      step_code: step.code,
      status_code: "notStarted",
      milestone_ID: milestoneId,
    });
    if (step.code !== STAGE_STEPS[0].code) continue;
    for (const subtask of SUBTASK_STEPS) {
      if (subtask.conditional === "shipsUi" && !shipsUi) continue;
      await INSERT.into(TABLE.SUBTASK).entries({
        ID: randomUUID(),
        step_code: subtask.code,
        status_code: "notStarted",
        task_ID: taskId,
      });
    }
  }
}

/**
 * Seeds the canonical world: one hierarchy, one active sprint, one story with
 * its chain.
 * @returns The identifiers the suite addresses the world by.
 */
export async function seedCanonicalWorld(): Promise<SeededWorld> {
  await seedCodeLists();
  await seedMethodologyLibrary();
  const areaId = randomUUID();
  const engagementId = randomUUID();
  const workspaceId = randomUUID();
  const initiativeId = randomUUID();
  const milestoneId = randomUUID();
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
  await INSERT.into(TABLE.INITIATIVE).entries({
    ID: initiativeId,
    name: WORLD.INITIATIVE.name,
    goal: WORLD.INITIATIVE.goal,
    branch: WORLD.INITIATIVE.branch,
    position: WORLD.INITIATIVE.position,
    status_code: "Active",
    workspace_ID: workspaceId,
  });
  await INSERT.into(TABLE.MILESTONE).entries({
    ID: milestoneId,
    storyId: WORLD.STORY.storyId,
    fricewType_code: WORLD.STORY.fricewType,
    description: WORLD.STORY.description,
    shipsUi: WORLD.STORY.shipsUi,
    position: WORLD.STORY.position,
    initiative_ID: initiativeId,
  });
  await seedStoryChain(milestoneId, WORLD.STORY.shipsUi);
  return { workspaceId, initiativeId, milestoneId };
}

/**
 * Empties every table the suites write to, so one spec's world never leaks into
 * the next.
 * @returns Resolves once the tables are empty.
 */
export async function clearWorld(): Promise<void> {
  const ordered = [
    TABLE.ACTIVITY,
    TABLE.DEFECT,
    "com.lifeos.projecttracker.Decision",
    "com.lifeos.projecttracker.TestRun",
    TABLE.SUBTASK,
    TABLE.TASK,
    TABLE.MILESTONE,
    TABLE.INITIATIVE,
    TABLE.WORKSPACE,
    TABLE.ENGAGEMENT,
    TABLE.AREA,
    TABLE.METHODOLOGY_STEP,
    TABLE.METHODOLOGY,
  ];
  for (const table of ordered) await DELETE.from(table);
  for (const list of Object.keys(CODE_LISTS).reverse()) {
    await DELETE.from(`com.lifeos.projecttracker.${list}`);
  }
}

/**
 * Sets a story's stages to the states a fixture needs, addressed by step code.
 * @param milestoneId The story whose chain is being arranged.
 * @param states One entry per stage code that is not left Not Started.
 * @returns Resolves once every named stage carries its state.
 */
export async function setChainStates(
  milestoneId: string,
  states: Record<string, { status: string; startedAt?: string; completedAt?: string }>,
): Promise<void> {
  for (const [code, state] of Object.entries(states)) {
    await UPDATE(TABLE.TASK)
      .set({
        status_code: state.status,
        startedAt: state.startedAt ?? null,
        completedAt: state.completedAt ?? null,
      })
      .where({ milestone_ID: milestoneId, step_code: code });
  }
}

/**
 * Moves a sprint out of Active, for the fixtures about a workspace that has no
 * sprint to hang anything off.
 * @param initiativeId The sprint to move.
 * @param status The status code to set.
 * @returns Resolves once the sprint carries it.
 */
export async function setInitiativeStatus(
  initiativeId: string,
  status: string,
): Promise<void> {
  await UPDATE(TABLE.INITIATIVE)
    .set({ status_code: status })
    .where({ ID: initiativeId });
}

/**
 * Sets one workflow step's status directly, for fixtures about open steps.
 * @param taskId The stage the step hangs off.
 * @param stepCode The step to set.
 * @param status The status code to set.
 * @returns Resolves once the step carries it.
 */
export async function setSubtaskStatus(
  taskId: string,
  stepCode: string,
  status: string,
): Promise<void> {
  await UPDATE(TABLE.SUBTASK)
    .set({ status_code: status })
    .where({ task_ID: taskId, step_code: stepCode });
}
