import {
  createMilestoneThroughService,
  seedHierarchy,
  seedInitiative,
} from "../../../shared/support/seedWorld.js";
import { MIGRATION_SPRINTS, MIGRATION_STORIES } from "../data/migrationStories.js";

/**
 * Seeds the migrated workspace's hierarchy and its three sprints, with no story
 * in any of them — the state the migration load starts from.
 * @returns Each sprint's identifier, keyed by sprint name.
 */
export const seedMigrationSprints = async (): Promise<Record<string, string>> => {
  const workspaceId = await seedHierarchy();
  const sprintIds: Record<string, string> = {};
  for (const sprint of MIGRATION_SPRINTS) {
    sprintIds[sprint.name] = await seedInitiative(workspaceId, { ...sprint });
  }
  return sprintIds;
};

/**
 * Creates the twelve migrated stories through the service's create path, each
 * into its own sprint, exactly as the load will.
 * @param sprintIds Each sprint's identifier, keyed by sprint name.
 * @returns Each new story's identifier, keyed by story identifier.
 */
export const createMigrationStories = async (
  sprintIds: Record<string, string>,
): Promise<Record<string, string>> => {
  const storyIds: Record<string, string> = {};
  for (const story of MIGRATION_STORIES) {
    storyIds[story.row.storyId] = await createMilestoneThroughService({
      ...story.row,
      initiative_ID: sprintIds[story.sprint],
    });
  }
  return storyIds;
};
