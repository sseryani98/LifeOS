/** Fully-qualified names of the service entities the handler layer touches. */
export const ENTITIES = {
  ACTIVITY: "TrackerService.Activities",
  ACTOR: "TrackerService.Actor",
  DEFECT: "TrackerService.Defects",
  DECISION: "TrackerService.Decisions",
  INITIATIVE: "TrackerService.Initiatives",
  MILESTONE: "TrackerService.Milestones",
  METHODOLOGY_STEP: "TrackerService.MethodologySteps",
  PROJECT_VIEW: "TrackerService.ProjectView",
  SUBTASK: "TrackerService.Subtasks",
  TASK: "TrackerService.Tasks",
  TASK_QUEUE_ITEM: "TrackerService.TaskQueueItems",
  TEST_RUN: "TrackerService.TestRuns",
  WORKSPACE: "TrackerService.Workspaces",
} as const;

/** Code-list values the handler and verb layers branch on. */
export const CODES = {
  ACTOR_KIND: { HUMAN: "human" },
  DEFECT_STATUS: { OPEN: "Open", CLOSED: "Closed" },
  INITIATIVE_STATUS: { ACTIVE: "Active", COMPLETE: "Complete" },
  MILESTONE_STATUS: {
    BACKLOG: "backlog",
    IN_PROGRESS: "inProgress",
    DONE: "done",
  },
  STEP_KIND: {
    REQUIRED: "Required",
    CONDITIONAL: "Conditional",
    RECOMMENDED: "Recommended",
  },
  SUBTASK_STATUS: { NOT_STARTED: "notStarted", COMPLETE: "complete" },
  TASK_STATUS: {
    NOT_STARTED: "notStarted",
    IN_PROGRESS: "inProgress",
    COMPLETE: "complete",
  },
} as const;

/**
 * The predicates a Conditional library step may name, keyed by the name the
 * seed carries. A step naming anything else holds no predicate and is not
 * materialised, rather than guessed at.
 */
export const CHAIN_PREDICATES = {
  SHIPS_UI: "shipsUi",
} as const;

/** The TestRun columns the count rule judges; a patch touching none skips it. */
export const TEST_RUN_COUNT_FIELDS = [
  "total",
  "passed",
  "failed",
  "pending",
] as const;

/**
 * The read projection's derived elements — a hand-kept mirror of the `virtual`
 * elements ProjectView declares in srv/tracker-service.cds, the authority: a
 * virtual added or renamed there must change this list in the same commit, or
 * the field silently vanishes from the payload. They are still set to null so
 * a caller can tell "not computed yet" from "not part of the shape".
 */
export const DERIVED_SCALARS = [
  "health",
  "nextActionStoryId",
  "nextActionStepCode",
  "nextActionLabel",
  "nextActionDriver",
  "gateTotal",
  "gatePassed",
  "gateFailed",
  "gateLinesPct",
  "gateBranchesPct",
  "gateExecutedAt",
] as const;

/** Runtime message keys the handler layer rejects with. */
export const HANDLER_KEYS = {
  INITIATIVE_COMPLETION_FIELDS: "tracker.initiative.completionFieldsRequired",
  INITIATIVE_DUPLICATE: "verb.initiative.duplicate",
  DEFECT_SCOPE: "tracker.defect.scopeRequired",
  STORY_DUPLICATE: "verb.story.duplicate",
  TEST_RUN_COUNTS_EXCEED_TOTAL: "verb.testrun.countsExceedTotal",
  TEST_RUN_SCOPE: "tracker.testrun.scopeRequired",
} as const;
