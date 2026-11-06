import type cds from "@sap/cds";

import { PlanSprintVerb } from "../../../../mcp/verbs/planSprint.js";
import { ACTORS } from "../../../shared/data/world.js";
import {
  createMilestoneThroughService,
  seedHierarchy,
  seedInitiative,
} from "../../../shared/support/seedWorld.js";
import { buildSprintPlanInput } from "../../../shared/support/verbInputs.js";
import { MIGRATION_SPRINTS, MIGRATION_STORIES } from "../data/migrationStories.js";

import { buildVerbContext, expectSuccess } from "./verbHarness.js";

/** Database-level entity names the candidate readers select from. */
const TABLE = {
  INITIATIVE: "com.lifeos.projecttracker.Initiative",
} as const;

/** The workspace as the migration load leaves it, addressed by name. */
export interface MigratedWorkspace {
  workspaceId: string;
  /** Each sprint's identifier, keyed by sprint name. */
  sprintIds: Record<string, string>;
  /** Each story's identifier, keyed by bare story identifier. */
  storyIds: Record<string, string>;
}

/** The migrated workspace with a second open sprint planned on top of it. */
export interface CandidateWorld extends MigratedWorkspace {
  plannedSprintId: string;
}

/** One sprint's ordering facts, as an assertion reads them. */
export interface SprintPosition {
  ID: string;
  name: string;
  position: number;
}

/**
 * Seeds the workspace exactly as the cutover load leaves it: three sprints at
 * their board positions, eleven stories created Done with no stage, and the one
 * Backlog story with its whole chain Not Started. No verb has been called, so
 * no stage carries a completion and the register holds no stage event.
 * @returns The identifiers the suite addresses the workspace by.
 */
export const seedMigratedWorkspace = async (): Promise<MigratedWorkspace> => {
  const workspaceId = await seedHierarchy();
  const sprintIds: Record<string, string> = {};
  for (const sprint of MIGRATION_SPRINTS) {
    sprintIds[sprint.name] = await seedInitiative(workspaceId, { ...sprint });
  }
  const storyIds: Record<string, string> = {};
  for (const story of MIGRATION_STORIES) {
    storyIds[story.row.storyId] = await createMilestoneThroughService({
      ...story.row,
      initiative_ID: sprintIds[story.sprint],
    });
  }
  return { workspaceId, sprintIds, storyIds };
};

/**
 * Seeds the migrated workspace and plans the standard three-story sprint on top
 * of it through the real verb, so the new sprint and stories take whatever
 * positions plan_sprint assigns. Four candidate stories result, every one with
 * its chain untouched. The plan is an arrangement: a rejection fails loudly.
 * @param service The connected service.
 * @returns The migrated identifiers plus the planned sprint's.
 */
export const seedCandidateWorld = async (
  service: cds.Service,
): Promise<CandidateWorld> => {
  const migrated = await seedMigratedWorkspace();
  const planned = expectSuccess(
    await new PlanSprintVerb().run(
      buildVerbContext(service, ACTORS.IMPLEMENTER),
      buildSprintPlanInput() as never,
    ),
  );
  return { ...migrated, plannedSprintId: String(planned.initiativeId) };
};

/**
 * Reads every sprint of a workspace with its position, lowest first.
 * @param workspaceId The workspace to read.
 * @returns The sprints in position order.
 */
export const readSprintPositions = async (
  workspaceId: string,
): Promise<SprintPosition[]> => {
  const rows = (await SELECT.from(TABLE.INITIATIVE)
    .columns("ID", "name", "position")
    .where({ workspace_ID: workspaceId })) as SprintPosition[];
  return rows.sort((left, right) => left.position - right.position);
};
