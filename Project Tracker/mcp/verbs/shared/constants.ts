/** Runtime message keys the verb layer rejects and warns with. */
export const VERB_KEYS = {
  CONNECTION_UNAVAILABLE: "verb.connection.unavailable",
  DEFECT_ALREADY_RESOLVED: "verb.defect.alreadyResolved",
  DEFECT_NOT_FOUND: "verb.defect.notFound",
  DEFECT_RESOLUTION_REQUIRED: "verb.defect.resolutionRequired",
  INTERNAL_FAILURE: "verb.internal.failure",
  DEFECT_SCOPE_REQUIRED: "verb.defect.scopeRequired",
  IDENTITY_MISSING: "verb.identity.missing",
  IDENTITY_UNKNOWN: "verb.identity.unknown",
  INITIATIVE_DUPLICATE: "verb.initiative.duplicate",
  REOPEN_REASON_REQUIRED: "verb.reopen.reasonRequired",
  STAGE_ALREADY_COMPLETE: "verb.stage.alreadyComplete",
  STAGE_BLOCKED: "verb.stage.blocked",
  STAGE_NOT_STARTED: "verb.stage.notStarted",
  STAGE_SUBTASKS_OPEN: "verb.stage.subtasksOpen",
  SPRINT_NONE_ACTIVE: "verb.sprint.noneActive",
  STORY_DUPLICATE: "verb.story.duplicate",
  STORY_UNQUALIFIED: "verb.story.unqualified",
  TARGET_NOT_FOUND: "verb.target.notFound",
  TESTRUN_SCOPE_REQUIRED: "verb.testrun.scopeRequired",
  TIMESTAMP_INVALID: "verb.timestamp.invalid",
  VALUE_NOT_IN_CODE_LIST: "verb.value.notInCodeList",
  WORKSPACE_AMBIGUOUS: "verb.workspace.ambiguous",
} as const;

/**
 * The methodology guards' own rejection keys, each carried as the envelope code —
 * except the stage predecessor key, which rides inside the older
 * `verb.stage.blocked` code. Both predecessor keys are also carried on `rule`.
 */
export const WFL_KEYS = {
  STAGE_ALREADY_STARTED: "wfl.stage.alreadyStarted",
  STAGE_HUMAN_ONLY: "wfl.stage.humanOnly",
  STAGE_NOT_COMPLETE: "wfl.stage.notComplete",
  STAGE_PREDECESSOR_OPEN: "wfl.stage.predecessorOpen",
  SUBTASK_ALREADY_COMPLETE: "wfl.subtask.alreadyComplete",
  SUBTASK_PREDECESSOR_OPEN: "wfl.subtask.predecessorOpen",
  SUBTASK_STAGE_NOT_STARTED: "wfl.subtask.stageNotStarted",
  TESTRUN_STAGE_NOT_STARTED: "wfl.testrun.stageNotStarted",
} as const;

/** Remediation templates a guard rejection resolves. */
export const GUARD = {
  REMEDIATION_COMPLETE_STAGE: "verb.remediation.completeStage",
  REMEDIATION_HUMAN_ONLY: "verb.remediation.humanOnly",
  REMEDIATION_LOG_DEFECT: "verb.remediation.logDefect",
  REMEDIATION_NEXT_STEP: "verb.remediation.nextStep",
  REMEDIATION_RUN_DRIVER: "verb.remediation.runDriver",
  REMEDIATION_START_STAGE: "verb.remediation.startStage",
  REMEDIATION_REOPEN_STAGE: "verb.remediation.reopenStage",
} as const;

/** Activity kinds the write verbs emit, one per verb. */
export const ACTIVITY_KINDS = {
  DECISION_RECORDED: "decisionRecorded",
  DEFECT_LOGGED: "defectLogged",
  DEFECT_RESOLVED: "defectResolved",
  SPRINT_PLANNED: "sprintPlanned",
  STAGE_COMPLETED: "stageCompleted",
  STAGE_REOPENED: "stageReopened",
  STAGE_STARTED: "stageStarted",
  SUBTASK_COMPLETED: "subtaskCompleted",
  TEST_RUN_RECORDED: "testRunRecorded",
} as const;

/** The six FRICEW type codes a planned story may carry. */
export const FRICEW_TYPES = [
  "Interface",
  "Conversion",
  "Enhancement",
  "Form",
  "Report",
  "Workflow",
] as const;

/** The four defect severities. */
export const DEFECT_SEVERITIES = ["Critical", "High", "Medium", "Low"] as const;

/** Spacing between planned positions, leaving room to insert between rows. */
export const PLANNING = {
  POSITION_GAP: 10,
} as const;

/**
 * Ceilings on the registers a read composes. Every write verb appends an
 * activity row and nothing ever removes one, so an unbounded feed inside a
 * result that is serialized whole only ever grows. The newest rows are the ones
 * worth reading, and a truncated read says so rather than pretending otherwise.
 */
export const READ_LIMITS = {
  ACTIVITIES: 50,
} as const;

/**
 * How a rejection's list of valid codes is rendered. A workspace's story list
 * only grows, so past the limit the rest is counted rather than listed.
 */
export const VALID_CODES = {
  LIMIT: 20,
  NONE_KEY: "verb.target.codesNone",
  TRUNCATED_KEY: "verb.target.codesTruncated",
} as const;

/**
 * HTTP statuses the failure envelope carries. `SERVER_ERROR_CEILING` bounds
 * what counts as a status when one is read off a thrown value.
 */
export const HTTP = {
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
  SERVER_ERROR_CEILING: 599,
} as const;

/**
 * What counts as a lost store: Node socket error codes plus the Postgres
 * connection-exception classes. Only these make a failure retryable — anything
 * else is an answer, not a transport fault.
 */
export const CONNECTION = {
  ERROR_CODES: [
    "ECONNREFUSED",
    "ECONNRESET",
    "EHOSTUNREACH",
    "ENETUNREACH",
    "ENOTFOUND",
    "EPIPE",
    "ETIMEDOUT",
    "08000",
    "08003",
    "08006",
    "57P01",
    "57P02",
    "57P03",
  ],
} as const;

/** Reference-string separators the addressing forms use. */
export const ADDRESSING = {
  STORY_SEPARATOR: "/",
  STAGE_SEPARATOR: "#",
} as const;

/** The length of an ISO timestamp up to and including its whole seconds. */
export const TIMESTAMP = {
  SECOND_PRECISION_LENGTH: 19,
} as const;

/** The columns the task queue is ordered by, outermost first. */
export const QUEUE = {
  ORDER: ["initiativePosition", "milestonePosition", "stepPosition"],
} as const;
