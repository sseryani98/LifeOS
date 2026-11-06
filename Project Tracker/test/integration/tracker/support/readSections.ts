import {
  seedInitiative,
  seedSecondWorkspace,
} from "../../../shared/support/seedWorld.js";
import { trackerServer } from "../../../shared/support/trackerHarness.js";
import {
  OTHER_WORKSPACE_SPRINT,
  OTHER_WORKSPACE_STORY,
} from "../data/projectViewSections.js";
import { SECTION_COUNT_SEGMENT } from "../data/nextActionWorld.js";
import { PATHS } from "../data/writePayloads.js";

import type { CompletedRow, ProjectViewSections, QueueRow } from "./readNextAction.js";
import { seedExtraStory } from "./seedExtraStory.js";

/** One recently completed row reduced to what the ordering assertions compare. */
export interface CompletionKey {
  story: string;
  stepCode: string;
  completedAt: string;
}

/** One section as a page table reads it: the rows of its own request, and the count it was told. */
export interface SectionPage<Row> {
  rows: Row[];
  count: number | undefined;
}

/**
 * Reads one section the way a page table does: a navigation from the view row,
 * on its own request, so the section entity's own read handler is what runs.
 * @param workspaceId The workspace whose view the section hangs off.
 * @param nav The section navigation.
 * @param query The query options, leading question mark included.
 * @returns The rows returned and the count the response carried.
 */
export const readSectionPage = async <Row>(
  workspaceId: string,
  nav: string,
  query: string,
): Promise<SectionPage<Row>> => {
  const response = await trackerServer.GET(
    `${PATHS.PROJECT_VIEW}(${workspaceId})/${nav}${query}`,
  );
  const data = response.data as { value: Row[]; "@odata.count"?: number };
  return { rows: data.value, count: data["@odata.count"] };
};

/**
 * Reads one section's row count alone, the way a table asks for it before it
 * pages: a bare `$count` on the navigation, answered as a number.
 * @param workspaceId The workspace whose view the section hangs off.
 * @param nav The section navigation.
 * @returns The count the service answered.
 */
export const readSectionCount = async (
  workspaceId: string,
  nav: string,
): Promise<number> => {
  const response = await trackerServer.GET(
    `${PATHS.PROJECT_VIEW}(${workspaceId})/${nav}${SECTION_COUNT_SEGMENT}`,
  );
  return Number(response.data);
};

/**
 * Names each row as story and stage, in the order the read returned them.
 * @param rows Queue or recently completed rows.
 * @returns One `story#stage` key per row.
 */
export const rowKeysOf = (rows: { story: string; stepCode: string }[]): string[] => {
  return rows.map(row => `${row.story}#${row.stepCode}`);
};

/**
 * Names each queue row as story and stage, in the order the view returned
 * them, so one assertion states both membership and order.
 * @param sections One read of the view.
 * @returns One `story#stage` key per queue row.
 */
export const queueKeysOf = (sections: ProjectViewSections): string[] => {
  return rowKeysOf(sections.taskQueue ?? []);
};

/**
 * Reads the blocker every queue row names, keyed by its stage. For a world
 * holding one story, where stage codes do not repeat.
 * @param rows The queue rows.
 * @returns Each stage's blocker, null when it names none.
 */
export const blockersOf = (rows: QueueRow[]): Record<string, string | null> => {
  return Object.fromEntries(rows.map(row => [row.stepCode, row.blockerStepCode]));
};

/**
 * Collects the distinct tiers each story's queue rows carry, so a story whose
 * rows disagree reads as more than one value.
 * @param rows The queue rows.
 * @returns The tiers found, keyed by qualified story.
 */
export const tiersByStoryOf = (rows: QueueRow[]): Record<string, (number | null)[]> => {
  const tiers: Record<string, (number | null)[]> = {};
  for (const row of rows) {
    const seen = tiers[row.story] ?? [];
    if (!seen.includes(row.tier)) seen.push(row.tier);
    tiers[row.story] = seen;
  }
  return tiers;
};

/**
 * Reduces recently completed rows to story, stage and time, in read order.
 * @param rows The completed rows, from an expand or a section read.
 * @returns The rows as keys.
 */
export const completionRowKeysOf = (rows: CompletedRow[]): CompletionKey[] => {
  return rows.map((row: CompletedRow) => ({
    story: row.story,
    stepCode: row.stepCode,
    completedAt: row.completedAt,
  }));
};

/**
 * Reduces the recently completed section to story, stage and time, in the
 * order the view returned it.
 * @param sections One read of the view.
 * @returns The rows as keys.
 */
export const completionKeysOf = (sections: ProjectViewSections): CompletionKey[] => {
  return completionRowKeysOf(sections.recentCompletions ?? []);
};

/**
 * Reads the actor each recently completed row names, keyed by `story#stage`.
 * @param sections One read of the view.
 * @returns Each row's completing actor.
 */
export const completedByOf = (
  sections: ProjectViewSections,
): Record<string, string | null> => {
  return Object.fromEntries(
    (sections.recentCompletions ?? []).map(row => [
      `${row.story}#${row.stepCode}`,
      row.completedBy,
    ]),
  );
};

/**
 * Seeds a second workspace holding one sprint and one backend story, whose
 * chain the create-handler materialises.
 * @returns The second workspace's identifier and its story's.
 */
export const seedOtherWorkspaceStory = async (): Promise<{
  workspaceId: string;
  milestoneId: string;
}> => {
  const workspaceId = await seedSecondWorkspace();
  const initiativeId = await seedInitiative(workspaceId, { ...OTHER_WORKSPACE_SPRINT });
  const milestoneId = await seedExtraStory(initiativeId, { ...OTHER_WORKSPACE_STORY });
  return { workspaceId, milestoneId };
};
