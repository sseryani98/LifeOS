/**
 * The functional unit identifiers this tier executes, in spec order. They live
 * here because a design-tracking identifier is data everywhere in this module
 * and banned everywhere else, and because a spec that names its own identifier
 * is what makes a run of this tier answer the traceability question directly.
 */
export const FUT = {
  TOOL_LIST: "FUT-001",
  STAGE_ADVANCES: "FUT-002",
  REJECTION_WRITES_NOTHING: "FUT-003",
  SECOND_COMPLETION: "FUT-004",
  OPEN_STEPS_WARN: "FUT-005",
  REOPEN_PRESERVES_LATER: "FUT-006",
  REOPEN_NEEDS_REASON: "FUT-007",
  BARE_STORY_REFUSED: "FUT-008",
  IDENTITY_REACHES_ROW: "FUT-009",
  STDOUT_IS_FRAMES_ONLY: "FUT-010",
  REJECTION_CARRIES_REMEDIATION: "FUT-011",
  CLOSE_NEEDS_RESOLUTION: "FUT-012",
  PLAN_IN_ONE_CALL: "FUT-013",
  BAD_TYPE_REFUSED: "FUT-014",
  VIEW_IN_ONE_CALL: "FUT-015",
  CONCURRENT_WRITES: "FUT-016",
} as const;

/** The tools these scenarios call, by their advertised names. */
export const TOOL = {
  START_STAGE: "start_stage",
  COMPLETE_STAGE: "complete_stage",
  REOPEN_STAGE: "reopen_stage",
  LOG_DEFECT: "log_defect",
  RESOLVE_DEFECT: "resolve_defect",
  RECORD_DECISION: "record_decision",
  PLAN_SPRINT: "plan_sprint",
  PROJECT_VIEW: "project_view",
} as const;

/** A resolution carrying no information, which closing a defect must refuse. */
export const EMPTY_RESOLUTION = "   ";

/** The keys the composed view answers with, exhaustive. */
export const VIEW_KEYS = [
  "header",
  "nextAction",
  "taskQueue",
  "initiatives",
  "defects",
  "decisions",
  "activities",
] as const;
