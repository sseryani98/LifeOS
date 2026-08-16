/** Fully-qualified names of the service entities the handler layer touches. */
export const ENTITIES = {
  ACTIVITY: "TrackerService.Activities",
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
 * The read projection's derived elements. They are filled with nothing here and
 * are still set, because a caller binding a field that is absent from the
 * payload has no way to tell "not computed yet" from "not part of the shape".
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
  TEST_RUN_SCOPE: "tracker.testrun.scopeRequired",
} as const;
