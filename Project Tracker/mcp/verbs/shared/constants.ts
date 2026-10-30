/** Runtime message keys the verb layer rejects and warns with. */
export const VERB_KEYS = {
  CONNECTION_UNAVAILABLE: "verb.connection.unavailable",
  DEFECT_RESOLUTION_REQUIRED: "verb.defect.resolutionRequired",
  INTERNAL_FAILURE: "verb.internal.failure",
  DEFECT_SCOPE_REQUIRED: "verb.defect.scopeRequired",
  IDENTITY_MISSING: "verb.identity.missing",
  REOPEN_REASON_REQUIRED: "verb.reopen.reasonRequired",
  STAGE_ALREADY_COMPLETE: "verb.stage.alreadyComplete",
  STAGE_BLOCKED: "verb.stage.blocked",
  STAGE_NOT_COMPLETE: "verb.stage.notComplete",
  STAGE_NOT_STARTED: "verb.stage.notStarted",
  STAGE_SUBTASKS_OPEN: "verb.stage.subtasksOpen",
  STORY_DUPLICATE: "verb.story.duplicate",
  STORY_UNQUALIFIED: "verb.story.unqualified",
  TARGET_NOT_FOUND: "verb.target.notFound",
  TESTRUN_SCOPE_REQUIRED: "verb.testrun.scopeRequired",
  TIMESTAMP_INVALID: "verb.timestamp.invalid",
  VALUE_NOT_IN_CODE_LIST: "verb.value.notInCodeList",
  WORKSPACE_AMBIGUOUS: "verb.workspace.ambiguous",
} as const;

/** Remediation templates, and the rule name a guard rejection carries. */
export const GUARD = {
  PREDECESSOR_OPEN_RULE: "wfl.stage.predecessorOpen",
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
