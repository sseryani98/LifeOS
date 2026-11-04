import type cds from "@sap/cds";

import { STORE_TABLES } from "../data/storeTables.js";

/** The service entity whose read fills the derived story status. */
const MILESTONES_ENTITY = "TrackerService.Milestones";

/** The hierarchy above the sprints, every row of each level. */
export interface HierarchyRows {
  areas: { ID: string; name: string; createdBy: string }[];
  engagements: { name: string; area_ID: string; createdBy: string }[];
  workspaces: {
    ID: string;
    slug: string;
    name: string;
    currentFocus: string | null;
    engagement_ID: string;
    createdBy: string;
  }[];
}

/** One Initiative as the assertions read it. */
export interface InitiativeRow {
  ID: string;
  name: string;
  goal: string | null;
  branch: string;
  status_code: string;
  mergeCommit: string | null;
  tag: string | null;
  position: number | null;
  workspace_ID: string;
  createdBy: string;
}

/** One Milestone, with the name of the sprint it sits in. */
export interface MilestoneRow {
  ID: string;
  storyId: string;
  fricewType_code: string;
  description: string;
  shipsUi: boolean | null;
  position: number | null;
  initiativeName: string;
  createdBy: string;
}

/** One chain row, Task or Subtask, with the story it hangs off. */
export interface ChainRow {
  storyId: string;
  step_code: string;
  status_code: string;
  createdBy: string;
}

/** One Defect, with the name of the sprint it links to. */
export interface DefectRow {
  severity_code: string;
  status_code: string;
  title: string;
  description: string;
  references: string | null;
  resolution: string | null;
  milestone_ID: string | null;
  initiativeName: string | null;
  workspace_ID: string;
  createdBy: string;
}

/** One Decision, with the name of the sprint it targets. */
export interface DecisionRow {
  decision: string;
  rationale: string | null;
  context: string | null;
  options: string | null;
  decidedAt: string;
  milestone_ID: string | null;
  initiativeName: string | null;
  workspace_ID: string;
  createdBy: string;
}

/** One TestRun, with its percentages read as numbers. */
export interface TestRunRow {
  total: number;
  passed: number;
  failed: number;
  pending: number | null;
  durationMs: number | null;
  linesPct: number | null;
  branchesPct: number | null;
  failures: string | null;
  executedAt: string;
  task_ID: string | null;
  initiativeName: string | null;
  workspace_ID: string;
  createdBy: string;
}

/** One Activity row. */
export interface ActivityRow {
  kind_code: string;
  actor_code: string;
  target: string;
  payload: string | null;
  occurredAt: string;
  workspace_ID: string;
  createdBy: string;
}

/**
 * Reads every Area, Engagement and Workspace the store holds.
 * @returns The rows of each level.
 */
export const readMigratedHierarchy = async (): Promise<HierarchyRows> => {
  return {
    areas: (await SELECT.from(STORE_TABLES.ENTITY.Area).columns(
      "ID",
      "name",
      "createdBy",
    )) as HierarchyRows["areas"],
    engagements: (await SELECT.from(STORE_TABLES.ENTITY.Engagement).columns(
      "name",
      "area_ID",
      "createdBy",
    )) as HierarchyRows["engagements"],
    workspaces: (await SELECT.from(STORE_TABLES.ENTITY.Workspace).columns(
      "ID",
      "slug",
      "name",
      "currentFocus",
      "engagement_ID",
      "createdBy",
    )) as HierarchyRows["workspaces"],
  };
};

/**
 * Reads every Initiative, in position order.
 * @returns The Initiative rows.
 */
export const readMigratedInitiatives = async (): Promise<InitiativeRow[]> => {
  const rows = (await SELECT.from(STORE_TABLES.ENTITY.Initiative).columns(
    "ID",
    "name",
    "goal",
    "branch",
    "status_code",
    "mergeCommit",
    "tag",
    "position",
    "workspace_ID",
    "createdBy",
  )) as InitiativeRow[];
  return rows.sort(
    (left, right) => (left.position ?? 0) - (right.position ?? 0),
  );
};

/**
 * Reads every Milestone, ordered by its sprint's position and then its own.
 * @returns The Milestone rows.
 */
export const readMigratedMilestones = async (): Promise<MilestoneRow[]> => {
  const rows = (await SELECT.from(STORE_TABLES.ENTITY.Milestone).columns(
    "ID",
    "storyId",
    "fricewType_code",
    "description",
    "shipsUi",
    "position",
    "initiative.name as initiativeName",
    "initiative.position as initiativePosition",
    "createdBy",
  )) as (MilestoneRow & { initiativePosition: number | null })[];
  return rows
    .sort(
      (left, right) =>
        (left.initiativePosition ?? 0) - (right.initiativePosition ?? 0) ||
        (left.position ?? 0) - (right.position ?? 0),
    )
    .map(({ initiativePosition: _omitted, ...row }) => row);
};

/**
 * Reads every story's status through the service, so the derivation that fills
 * it on read answers rather than a column.
 * @param service The connected service.
 * @returns Each story's derived status code, keyed by story identifier.
 */
export const readDerivedStatuses = async (
  service: cds.Service,
): Promise<Record<string, string>> => {
  const rows = (await service.run(
    // The key is selected because the derivation finds a story's chain by it.
    SELECT.from(MILESTONES_ENTITY).columns("ID", "storyId", "status"),
  )) as { storyId: string; status: string }[];
  return Object.fromEntries(rows.map(row => [row.storyId, row.status]));
};

/**
 * Reads every Task and Subtask in the store, each with its story's identifier.
 * @returns The chain rows of both levels.
 */
export const readChainRows = async (): Promise<{
  tasks: ChainRow[];
  subtasks: ChainRow[];
}> => {
  const tasks = (await SELECT.from(STORE_TABLES.ENTITY.Task).columns(
    "milestone.storyId as storyId",
    "step_code",
    "status_code",
    "createdBy",
  )) as ChainRow[];
  const subtasks = (await SELECT.from(STORE_TABLES.ENTITY.Subtask).columns(
    "task.milestone.storyId as storyId",
    "step_code",
    "status_code",
    "createdBy",
  )) as ChainRow[];
  return { tasks, subtasks };
};

/**
 * Reads every Defect, with the sprint it links to by name.
 * @returns The Defect rows.
 */
export const readMigratedDefects = async (): Promise<DefectRow[]> => {
  return (await SELECT.from(STORE_TABLES.ENTITY.Defect).columns(
    "severity_code",
    "status_code",
    "title",
    "description",
    "references",
    "resolution",
    "milestone_ID",
    "initiative.name as initiativeName",
    "workspace_ID",
    "createdBy",
  )) as DefectRow[];
};

/**
 * Reads every Decision, with the sprint it targets by name.
 * @returns The Decision rows.
 */
export const readMigratedDecisions = async (): Promise<DecisionRow[]> => {
  return (await SELECT.from(STORE_TABLES.ENTITY.Decision).columns(
    "decision",
    "rationale",
    "context",
    "options",
    "decidedAt",
    "milestone_ID",
    "initiative.name as initiativeName",
    "workspace_ID",
    "createdBy",
  )) as DecisionRow[];
};

/**
 * Reads every TestRun. The percentages come back as numbers whichever form the
 * driver hands a decimal back in, so an assertion compares values, not types.
 * @returns The TestRun rows.
 */
export const readMigratedTestRuns = async (): Promise<TestRunRow[]> => {
  const rows = (await SELECT.from(STORE_TABLES.ENTITY.TestRun).columns(
    "total",
    "passed",
    "failed",
    "pending",
    "durationMs",
    "linesPct",
    "branchesPct",
    "failures",
    "executedAt",
    "task_ID",
    "initiative.name as initiativeName",
    "workspace_ID",
    "createdBy",
  )) as (Omit<TestRunRow, "linesPct" | "branchesPct"> & {
    linesPct: number | string | null;
    branchesPct: number | string | null;
  })[];
  return rows.map(row => ({
    ...row,
    linesPct: row.linesPct === null ? null : Number(row.linesPct),
    branchesPct: row.branchesPct === null ? null : Number(row.branchesPct),
  }));
};

/**
 * Reads every Activity row, oldest first.
 * @returns The Activity rows.
 */
export const readMigratedActivities = async (): Promise<ActivityRow[]> => {
  const rows = (await SELECT.from(STORE_TABLES.ENTITY.Activity).columns(
    "kind_code",
    "actor_code",
    "target",
    "payload",
    "occurredAt",
    "workspace_ID",
    "createdBy",
  )) as ActivityRow[];
  return rows.sort((left, right) =>
    left.occurredAt.localeCompare(right.occurredAt),
  );
};

/**
 * Counts the rows of every entity the load writes, Tasks and Subtasks included,
 * so a before-and-after comparison catches a write to any of them.
 * @returns Each entity's row count, keyed by entity name.
 */
export const countRowsByEntity = async (): Promise<Record<string, number>> => {
  const counts: Record<string, number> = {};
  for (const [entity, table] of Object.entries(STORE_TABLES.ENTITY)) {
    counts[entity] = (
      (await SELECT.from(table).columns("ID")) as unknown[]
    ).length;
  }
  return counts;
};

/**
 * Reads who created every row of every entity the load writes.
 * @returns Each entity's createdBy values, one per row, keyed by entity name.
 */
export const readCreatedByByEntity = async (): Promise<
  Record<string, string[]>
> => {
  const createdBy: Record<string, string[]> = {};
  for (const [entity, table] of Object.entries(STORE_TABLES.ENTITY)) {
    const rows = (await SELECT.from(table).columns("createdBy")) as {
      createdBy: string;
    }[];
    createdBy[entity] = rows.map(row => row.createdBy);
  }
  return createdBy;
};
