import { SPRINT_PLAN, WORLD } from "../../../shared/data/world.js";

/**
 * The three tiers a candidate story resolves at. Named for what each one means
 * to the caller, because the number alone says nothing about why one outranks
 * another: resuming started work, starting fresh, mopping up an optional step.
 */
export const TIER = {
  RESUMING: 1,
  FRESH: 2,
  OPTIONAL_ONLY: 3,
} as const;

/** The stage status codes a next action and a queue row carry. */
export const TASK_STATUS = {
  NOT_STARTED: "notStarted",
  IN_PROGRESS: "inProgress",
  COMPLETE: "complete",
} as const;

/** The step kind codes a next action and a queue row carry. */
export const STEP_KIND = {
  REQUIRED: "Required",
  CONDITIONAL: "Conditional",
  RECOMMENDED: "Recommended",
} as const;

/** The migrated workspace's stories, addressed as the verbs and every report row address them. */
export const MIGRATED_REFERENCE = {
  /** The one story still in Backlog after the load, and the only one with a chain. */
  BACKLOG: `${WORLD.WORKSPACE.slug}/CNV-001`,
  /** Done before the register existed, so it holds no stage at all. */
  CHAINLESS_DONE: `${WORLD.WORKSPACE.slug}/ENH-001`,
} as const;

/** The sprint names the migrated workspace and the plan on top of it carry. */
export const SPRINT_NAME = {
  ACTIVE_MIGRATED: "W1-S3",
  PLANNED: SPRINT_PLAN.name,
} as const;

/** The planned sprint's three stories, qualified, in the order the plan supplied them. */
export const PLANNED_REFERENCES = SPRINT_PLAN.stories.map(
  story => `${WORLD.WORKSPACE.slug}/${story.id}`,
);

/** The one read of the view that carries all three of the report's sections. */
export const PROJECT_VIEW_SECTIONS_EXPAND = "?$expand=taskQueue,recentCompletions";

/** The navigations a page table reads one section through, each on its own request. */
export const SECTION_NAV = {
  QUEUE: "taskQueue",
  COMPLETIONS: "recentCompletions",
} as const;

/** The query options a page table sends on a section's own read. */
export const SECTION_QUERY = {
  COUNTED: "?$count=true",
  FIRST_PAGE: "?$top=5",
} as const;

/** The path segment a table appends to read a section's row count alone. */
export const SECTION_COUNT_SEGMENT = "/$count";
