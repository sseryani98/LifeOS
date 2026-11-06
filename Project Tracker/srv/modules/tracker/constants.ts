/**
 * The next-action engine's fixed values. A tier names why one story outranks
 * another: resuming started work, starting fresh, mopping up an optional step.
 * The stage columns are every fact the project-view sections read, the story's
 * and sprint's positions and the workspace flattened on.
 */
export const NEXT_ACTION = {
  TIER: { RESUMING: 1, FRESH: 2, OPTIONAL_ONLY: 3 },
  RECENT_COMPLETIONS_CAP: 5,
  STAGE_FACT_COLUMNS: [
    "ID",
    "milestone_ID",
    "step_code",
    "status_code",
    "kind_code as stepKind",
    "position as stepPosition",
    "requiresHuman",
    "completedAt",
    "step.name as stepName",
    "step.description as stepDescription",
    "step.driver as driver",
    "milestone.storyId as storyId",
    "milestone.position as milestonePosition",
    "milestone.initiative.position as initiativePosition",
    "milestone.initiative.workspace.ID as workspaceId",
    "milestone.initiative.workspace.slug as workspaceSlug",
  ],
} as const;

/** How a bare `$count` read names its one column. */
export const SECTION_COUNT = {
  ALIAS: "$count",
} as const;
