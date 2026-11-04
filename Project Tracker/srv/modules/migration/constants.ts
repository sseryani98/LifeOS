import { CODES, ENTITIES } from "../shared/constants.js";

/** Who the migration writes as, and the hierarchy it loads the planner under. */
export const MIGRATION = {
  // A system actor in the seeded Actor list: neither the human nor an agent.
  ACTOR: "migration",
  AREA_NAME: "Personal Software",
  ENGAGEMENT_NAME: "Life OS",
  WORKSPACE: { SLUG: "financial-planner", NAME: "Financial Planner" },
  ACTIVITY_KIND: { MIGRATION: "migration", CHECKPOINT: "checkpoint" },
  // The board's own status for a finished story; anything else is created in Backlog.
  BOARD_DONE: "Done",
  // The log's placeholder for an empty Resolution cell.
  RESOLUTION_PLACEHOLDER: "—",
  // Sprints and stories are positioned in board order, gapped so a later insert fits between.
  POSITION_STEP: 10,
  // Source dates carry no time of day; they are stored as that day's midnight UTC.
  MIDNIGHT_UTC: "T00:00:00Z",
  TARGET_SEPARATOR: "/",
  EVENT: {
    LOAD_HIERARCHY: "loadHierarchy",
    SEED_REGISTERS: "seedRegisters",
    RECONCILE: "reconcile",
  },
} as const;

/** The one story-type remap the board needs onto the six FRICEW codes. */
export const FRICEW = {
  REMAP: { Integration: "Interface" } as Record<string, string>,
} as const;

/** The one chain the load may leave: the backend chain of the one Backlog story. */
export const EXPECTED_CHAIN = {
  TASKS: 8,
  SUBTASKS: 6,
  TASK_STATUS: CODES.TASK_STATUS.NOT_STARTED,
  SUBTASK_STATUS: CODES.SUBTASK_STATUS.NOT_STARTED,
  ABSENT_STEPS: ["ux-test", "smoke"],
} as const;

/**
 * The entities the tie-out counts, by the name it reports them under. The two
 * chain levels are checked by the chain assertion instead of counted.
 */
export const RECONCILED_ENTITIES = {
  Area: ENTITIES.AREA,
  Engagement: ENTITIES.ENGAGEMENT,
  Workspace: ENTITIES.WORKSPACE,
  Initiative: ENTITIES.INITIATIVE,
  Milestone: ENTITIES.MILESTONE,
  Defect: ENTITIES.DEFECT,
  Decision: ENTITIES.DECISION,
  TestRun: ENTITIES.TEST_RUN,
  Activity: ENTITIES.ACTIVITY,
} as const;

/** Every entity the load writes, chain levels included, for the provenance check. */
export const WRITTEN_ENTITIES = {
  ...RECONCILED_ENTITIES,
  Task: ENTITIES.TASK,
  Subtask: ENTITIES.SUBTASK,
} as const;

/** Runtime message keys the migration refuses or fails under. */
export const MIGRATION_KEYS = {
  ALREADY_LOADED: "cnv.migration.alreadyLoaded",
  LIBRARY_MISSING: "cnv.migration.libraryMissing",
  HIERARCHY_MISSING: "cnv.migration.hierarchyMissing",
  VALUE_NOT_IN_CODE_LIST: "verb.value.notInCodeList",
  DEFECT_TARGET_MISSING: "cnv.defect.targetMissing",
  TEST_RUN_TARGET_MISSING: "cnv.testrun.targetMissing",
  DEFECT_RESOLUTION_ON_OPEN: "cnv.defect.resolutionOnOpen",
  DEFECT_RESOLUTION_MISSING: "cnv.defect.resolutionMissing",
  COUNT_MISMATCH: "cnv.reconcile.countMismatch",
  CHAIN_MISMATCH: "cnv.reconcile.chainMismatch",
  TYPE_MISMATCH: "cnv.reconcile.typeMismatch",
  PROVENANCE_MISMATCH: "cnv.reconcile.provenanceMismatch",
  ORDERING_MISMATCH: "cnv.reconcile.orderingMismatch",
} as const;

/** The statuses a refusal carries. A failed tie-out is a conflict with the expected state. */
export const MIGRATION_STATUS = {
  BAD_INPUT: 400,
  CONFLICT: 409,
} as const;

/** How a defect title is cut from its description. */
export const DEFECT_TITLE = {
  // The column's length; a longer leading clause is cut at a word and marked.
  MAX_LENGTH: 200,
  ELLIPSIS: "…",
  CODE_MARK: "`",
  // Clause ends, matched only outside a code span so "TS2688: Cannot" stays whole.
  CLAUSE_ENDS: [": ", "; ", ". ", " — "],
  MARKUP: /[`*]/g,
  TRAILING_STOP: /\.$/,
} as const;
