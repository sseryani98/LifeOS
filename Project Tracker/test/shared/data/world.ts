/**
 * The canonical world every suite seeds: the workspace this module exists to
 * hold, with the one story that is still in flight.
 */
export const WORLD = {
  AREA: { name: "Personal Systems" },
  ENGAGEMENT: { name: "Life OS" },
  WORKSPACE: {
    slug: "financial-planner",
    name: "Financial Planner",
    currentFocus: "Transaction processing",
  },
  INITIATIVE: {
    name: "W1-S3",
    goal: "Transactions categorized, splits supported, history backfilled",
    branch: "sprint/W1-S3",
    position: 10,
  },
  STORY: {
    storyId: "CNV-001",
    fricewType: "Conversion",
    description: "Historical backfill of transactions",
    shipsUi: false,
    position: 10,
  },
} as const;

/** A second workspace, for suites about multi-workspace ambiguity. */
export const SECOND_WORKSPACE = {
  slug: "project-tracker",
  name: "Project Tracker",
  currentFocus: null,
} as const;

/** The qualified reference the verbs address the canonical story by. */
export const STORY_REFERENCE = "financial-planner/CNV-001";

/** A reference with no workspace half, which must be refused rather than resolved. */
export const BARE_STORY_REFERENCE = "CNV-001";

/** References that resolve to nothing, one at each half. */
export const UNRESOLVABLE = {
  STORY: "financial-planner/NOPE-999",
  WORKSPACE: "not-a-workspace/CNV-001",
  STAGE: "not-a-stage",
  DECISION_TARGET: "not-a-thing",
  DEFECT: "00000000-0000-0000-0000-000000000000",
  MISSING_WORKSPACE_SLUG: "no-such-workspace",
} as const;

/** The identities the suites call under. */
export const ACTORS = {
  IMPLEMENTER: "implementer",
  SANDRO: "sandro",
} as const;

/** The defect a suite logs and then closes. */
export const DEFECT_INPUT = {
  severity: "High",
  title: "Split rows lose their category",
  description: "A split transaction writes children with a null category.",
  references: "srv/modules/transaction/transactionService.ts:212",
} as const;

/** The resolution that closes it. */
export const DEFECT_RESOLUTION = "Category copied onto every split child.";

/** The decision a suite records against the workspace. */
export const DECISION_INPUT = {
  context: "Two ways to carry the category onto split children",
  options: "Copy on write, or resolve on read",
  decision: "Copy on write",
  rationale: "The read path is on the dashboard's critical path",
} as const;

/** The sprint a suite plans, and its three stories. */
export const SPRINT_PLAN = {
  name: "W1-S4",
  goal: "Points valuation",
  branch: "sprint/W1-S4",
  stories: [
    {
      id: "ENH-020",
      type: "Enhancement",
      description: "Valuation engine",
      shipsUi: false,
    },
    {
      id: "RPT-020",
      type: "Report",
      description: "Valuation report",
      shipsUi: true,
    },
    {
      id: "FRM-020",
      type: "Form",
      description: "Valuation maintenance",
      shipsUi: true,
    },
  ],
} as const;

/** The same plan with a story identifier the workspace already holds. */
export const SPRINT_PLAN_WITH_DUPLICATE_STORY = [
  {
    id: "CNV-001",
    type: "Enhancement",
    description: "A story identifier that is already live",
    shipsUi: false,
  },
] as const;

/** A plan carrying the same new story identifier twice. */
export const SPRINT_PLAN_WITH_REPEATED_STORY = [
  {
    id: "ENH-021",
    type: "Enhancement",
    description: "First carrier of the identifier",
    shipsUi: false,
  },
  {
    id: "ENH-021",
    type: "Enhancement",
    description: "Second carrier of the same identifier",
    shipsUi: false,
  },
] as const;

/**
 * A plan whose second story carries no description, which `@mandatory` refuses.
 * The first story is written before it, so the failure lands mid-transaction
 * rather than before the first insert.
 */
export const SPRINT_PLAN_FAILING_MIDWAY = [
  {
    id: "ENH-030",
    type: "Enhancement",
    description: "Written before the plan dies",
    shipsUi: false,
  },
  {
    id: "ENH-031",
    type: "Enhancement",
    description: "",
    shipsUi: false,
  },
  {
    id: "ENH-032",
    type: "Enhancement",
    description: "Never reached",
    shipsUi: false,
  },
] as const;

/** A severity outside the four the code list holds. */
export const BAD_SEVERITY = "Catastrophic";

/** The same plan with one story typed outside the code list. */
export const SPRINT_PLAN_WITH_BAD_TYPE = {
  name: "W1-S5",
  goal: "Rejected before anything is written",
  branch: "sprint/W1-S5",
  stories: [
    {
      id: "INT-020",
      type: "Integration",
      description: "A type that is not one of the six",
      shipsUi: false,
    },
  ],
} as const;

/** Metrics a recorded test run carries. */
export const TEST_RUN_METRICS = {
  total: 289,
  passed: 289,
  failed: 0,
  pending: 0,
  durationMs: 41_000,
  linesPct: 91.4,
  branchesPct: 86.2,
} as const;

/** A run with only the counts a bare invocation produces, plus a failure list. */
export const MINIMAL_TEST_RUN_METRICS = {
  total: 3,
  passed: 2,
  failed: 1,
  failures: [
    { suite: "verbs", title: "refuses a bare story", message: "expected 400" },
  ],
} as const;

/** A decision that weighed no alternatives, which is legal. */
export const DECISION_WITHOUT_OPTIONS = {
  context: "One obvious way to do it",
  decision: "Do it that way",
  rationale: "Nothing else was on the table",
} as const;

/** A defect logged with no file references, which is also legal. */
export const DEFECT_WITHOUT_REFERENCES = {
  severity: "Low",
  title: "Wording on the empty state",
  description: "The empty state says nothing about what to do next.",
} as const;

/** What a completed stage concluded. */
export const STAGE_NOTES = "Two findings, both fixed in place.";

/** When that run executed. */
export const TEST_RUN_EXECUTED_AT = "2026-08-16T10:15:00.000Z";

/** The same instant written with a zone offset, and the UTC form it stores as. */
export const OFFSET_EXECUTED_AT = {
  SUPPLIED: "2026-08-16T12:15:00+02:00",
  STORED: "2026-08-16T10:15:00Z",
} as const;

/** A timestamp no calendar produced. */
export const INVALID_EXECUTED_AT = "not-a-timestamp";
