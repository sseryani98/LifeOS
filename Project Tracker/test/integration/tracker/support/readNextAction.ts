import type {
  NextAction,
  VerbSuccess,
} from "../../../../mcp/verbs/shared/types.js";
import { PROJECT_VIEW_SECTIONS_EXPAND } from "../data/nextActionWorld.js";
import { PATHS } from "../data/writePayloads.js";

import { readCollection, readEntity } from "./odataHarness.js";

/** One open task queue row, as the browser reads it. */
export interface QueueRow {
  ID: string;
  story: string;
  storyId: string;
  stepCode: string;
  stepName: string;
  stepPosition: number;
  kindCode: string;
  requiresHuman: boolean;
  statusCode: string;
  driver: string;
  tier: number | null;
  blockerStepCode: string | null;
}

/** One recently completed row, as the browser reads it. */
export interface CompletedRow {
  ID: string;
  story: string;
  stepCode: string;
  stepName: string;
  completedAt: string;
  completedBy: string | null;
}

/** The report's three sections, as one read of the view returns them. */
export interface ProjectViewSections {
  slug: string;
  nextActionStory: string | null;
  nextActionStepCode: string | null;
  nextActionLabel: string | null;
  nextActionDescription: string | null;
  nextActionKind: string | null;
  nextActionDriver: string | null;
  nextActionRequiresHuman: boolean | null;
  nextActionStatus: string | null;
  nextActionTier: number | null;
  taskQueue: QueueRow[];
  recentCompletions: CompletedRow[];
}

/**
 * Reads the next action a verb success carried, typed as the payload owes it.
 * @param result The success envelope of next_action or of any write verb.
 * @returns The next action, or null when the verb answered none.
 */
export const nextActionOf = (result: VerbSuccess): NextAction | null => {
  return result.nextAction;
};

/**
 * Reads the next-action section of a project_view success, which must come
 * from the same engine as the next_action verb's answer.
 * @param result The project_view success envelope.
 * @returns The section's next action, or null when the view answered none.
 */
export const viewNextActionOf = (
  result: VerbSuccess,
): NextAction | null => {
  const view = result.view as { nextAction?: NextAction | null };
  return view.nextAction ?? null;
};

/**
 * Reads the open task queue a project_view success carried, typed as the rows
 * the browser reads, so the verb's order can be compared with the page's.
 * @param result The project_view success envelope.
 * @returns The queue rows, in the order the verb returned them.
 */
export const viewQueueOf = (result: VerbSuccess): QueueRow[] => {
  const view = result.view as { taskQueue?: QueueRow[] };
  return view.taskQueue ?? [];
};

/**
 * Reads the report's three sections in one expanded request. The page's tables
 * read each section on its own request instead (readSectionPage). The store must
 * hold exactly one workspace; a suite seeding more uses readProjectViewSectionsOf.
 * @returns The view row with its queue and recently completed expanded.
 */
export const readProjectViewSections = async (): Promise<ProjectViewSections> => {
  const rows = await readCollection(
    `${PATHS.PROJECT_VIEW}${PROJECT_VIEW_SECTIONS_EXPAND}`,
  );
  if (rows.length !== 1) {
    throw new Error(`Expected one workspace in the view, read ${rows.length}`);
  }
  return rows[0] as unknown as ProjectViewSections;
};

/**
 * Reads one workspace's three sections in one request, by key.
 * @param workspaceId The workspace whose view is read.
 * @returns The view row with its queue and recently completed expanded.
 */
export const readProjectViewSectionsOf = async (
  workspaceId: string,
): Promise<ProjectViewSections> => {
  const view = await readEntity(
    `${PATHS.PROJECT_VIEW}(${workspaceId})${PROJECT_VIEW_SECTIONS_EXPAND}`,
  );
  return view as unknown as ProjectViewSections;
};
