import type cds from "@sap/cds";

import {
  type ChainRow,
  type MilestoneRow,
  readChainRows,
  readDerivedStatuses,
  readMigratedHierarchy,
  readMigratedMilestones,
} from "./readMigration.js";

/** What joins a workspace slug to a story identifier in every story reference. */
const STORY_SEPARATOR = "/";

/** One migrated story, with the qualified reference a caller addresses it by. */
export interface MigratedStory extends MilestoneRow {
  reference: string;
}

/** One chain row, with the qualified reference of the story it hangs off. */
export interface MigratedChainRow extends ChainRow {
  reference: string;
}

/**
 * Reads every migrated story with its qualified reference, built the way the
 * verbs build one, so a story stored under an address they cannot split fails.
 * @returns The stories, ordered by sprint position and then their own.
 */
export const readMigratedStories = async (): Promise<MigratedStory[]> => {
  const slug = await _readWorkspaceSlug();
  return (await readMigratedMilestones()).map(row => ({
    ...row,
    reference: _qualify(slug, row.storyId),
  }));
};

/**
 * Reads every story's derived status, keyed by its qualified reference.
 * @param service The connected service whose read derives the status.
 * @returns Each story's status code, keyed by reference.
 */
export const readStatusesByReference = async (
  service: cds.Service,
): Promise<Record<string, string>> => {
  const slug = await _readWorkspaceSlug();
  const statuses = await readDerivedStatuses(service);
  return Object.fromEntries(
    Object.entries(statuses).map(([storyId, status]) => [
      _qualify(slug, storyId),
      status,
    ]),
  );
};

/**
 * Reads every Task and Subtask with the qualified reference of its story.
 * @returns The chain rows of both levels.
 */
export const readMigratedChain = async (): Promise<{
  tasks: MigratedChainRow[];
  subtasks: MigratedChainRow[];
}> => {
  const slug = await _readWorkspaceSlug();
  const { tasks, subtasks } = await readChainRows();
  return {
    tasks: tasks.map(row => ({
      ...row,
      reference: _qualify(slug, row.storyId),
    })),
    subtasks: subtasks.map(row => ({
      ...row,
      reference: _qualify(slug, row.storyId),
    })),
  };
};

/**
 * Joins a slug and a story identifier into a reference.
 * @param slug The workspace slug.
 * @param storyId The stored story identifier.
 * @returns The qualified reference.
 */
const _qualify = (slug: string, storyId: string): string => {
  return `${slug}${STORY_SEPARATOR}${storyId}`;
};

/**
 * Reads the slug of the one workspace the load creates.
 * @returns The slug, or an empty string when no workspace exists.
 */
const _readWorkspaceSlug = async (): Promise<string> => {
  const { workspaces } = await readMigratedHierarchy();
  return workspaces[0]?.slug ?? "";
};
