// What the deployed db/data CSVs must hold, as assertion oracles only. Nothing
// here is ever inserted: a suite that seeded from these would assert its own
// fixture, and a typo in the real seed would pass.

/** The one methodology the library is. */
export const EXPECTED_METHODOLOGY = {
  code: "sprint-build",
  name: "Sprint Build",
} as const;

/** The nine stage steps, in library position order. */
export const EXPECTED_STAGE_STEPS = [
  {
    code: "sprint-build",
    name: "Sprint Build",
    description: "Build the story end to end: brief, red tests, implementation, gate and coverage",
    position: 10,
    kind_code: "Required",
    conditional: null,
    requiresHuman: false,
    driver: "/build",
  },
  {
    code: "code-quality",
    name: "Code Quality",
    position: 20,
    kind_code: "Required",
    conditional: null,
    requiresHuman: false,
    driver: "/code-quality",
  },
  {
    code: "test-quality",
    name: "Test Quality",
    position: 30,
    kind_code: "Required",
    conditional: null,
    requiresHuman: false,
    driver: "/test-quality",
  },
  {
    code: "functional-test",
    name: "Functional Test",
    position: 40,
    kind_code: "Required",
    conditional: null,
    requiresHuman: false,
    driver: "/functional-test",
  },
  {
    code: "ux-test",
    name: "UX Test",
    position: 50,
    kind_code: "Conditional",
    conditional: "shipsUi",
    requiresHuman: false,
    driver: "/ux-test",
  },
  {
    code: "human-review",
    name: "Human Review",
    description: "Sandro reads the diff and every finding is fixed and prevented",
    position: 60,
    kind_code: "Required",
    conditional: null,
    requiresHuman: true,
    driver: "/human-review-loop",
  },
  {
    code: "documentation",
    name: "Documentation",
    position: 70,
    kind_code: "Recommended",
    conditional: null,
    requiresHuman: false,
    driver: "/refresh-docs",
  },
  {
    code: "pm-update",
    name: "PM Update",
    position: 80,
    kind_code: "Required",
    conditional: null,
    requiresHuman: false,
    driver: "/pm-update",
  },
  {
    code: "commit",
    name: "Commit",
    position: 90,
    kind_code: "Required",
    conditional: null,
    requiresHuman: false,
    driver: "/commit-diff",
  },
] as const;

/** The seven workflow steps under the first stage, in library position order. */
export const EXPECTED_SUBTASK_STEPS = [
  {
    code: "brief",
    name: "Brief",
    position: 10,
    kind_code: "Required",
    conditional: null,
    requiresHuman: false,
    driver: "/build",
  },
  {
    code: "red",
    name: "Red",
    position: 20,
    kind_code: "Required",
    conditional: null,
    requiresHuman: false,
    driver: "/build",
  },
  {
    code: "implement",
    name: "Implement",
    position: 30,
    kind_code: "Required",
    conditional: null,
    requiresHuman: false,
    driver: "/build",
  },
  {
    code: "gate",
    name: "Gate",
    position: 40,
    kind_code: "Required",
    conditional: null,
    requiresHuman: false,
    driver: "/build",
  },
  {
    code: "coverage",
    name: "Coverage",
    position: 50,
    kind_code: "Required",
    conditional: null,
    requiresHuman: false,
    driver: "/build",
  },
  {
    code: "smoke",
    name: "Smoke",
    position: 60,
    kind_code: "Conditional",
    conditional: "shipsUi",
    requiresHuman: false,
    driver: "/build",
  },
  {
    code: "handoff",
    name: "Handoff",
    position: 70,
    kind_code: "Required",
    conditional: null,
    requiresHuman: false,
    driver: "/build",
  },
] as const;

/** The facts the kind, human and predicate queries must single out. */
export const LIBRARY_FACTS = {
  STEP_KINDS: ["Required", "Conditional", "Recommended"],
  HUMAN_STEPS: ["human-review"],
  RECOMMENDED_STEPS: ["documentation"],
  CONDITIONAL_STEPS: ["ux-test", "smoke"],
  PREDICATE: "shipsUi",
  SUBTASK_DRIVER: "/build",
  STEP_TOTAL: 16,
} as const;

/** The chain each kind of story materialises, in library position order. */
export const MATERIALISED = {
  BACKEND_STAGES: [
    "sprint-build",
    "code-quality",
    "test-quality",
    "functional-test",
    "human-review",
    "documentation",
    "pm-update",
    "commit",
  ],
  BACKEND_SUBTASKS: ["brief", "red", "implement", "gate", "coverage", "handoff"],
  UI_STAGES: [
    "sprint-build",
    "code-quality",
    "test-quality",
    "functional-test",
    "ux-test",
    "human-review",
    "documentation",
    "pm-update",
    "commit",
  ],
  UI_SUBTASKS: [
    "brief",
    "red",
    "implement",
    "gate",
    "coverage",
    "smoke",
    "handoff",
  ],
} as const;

/** The step codes the verb layer's own functional units froze, which the seed must carry. */
export const CODES_FROZEN_EARLIER = [
  "sprint-build",
  "code-quality",
  "test-quality",
  "human-review",
  "commit",
  "smoke",
  "handoff",
] as const;

/**
 * A library edit after a chain exists: one new stage, and the Recommended
 * documentation stage made Required. A refresh would add a row for the one and
 * re-kind the other, and the re-kind would turn a Done story back to In Progress.
 */
export const LIBRARY_CHANGE = {
  ADDED_STEP: {
    code: "security-review",
    name: "Security Review",
    description: "Review the change for security exposure",
    kind_code: "Required",
    position: 95,
    conditional: null,
    requiresHuman: false,
    driver: "/security-review",
    parent_code: null,
    methodology_code: "sprint-build",
  },
  KIND_CHANGE: {
    STEP: "documentation",
    SEEDED: "Recommended",
    CHANGED: "Required",
  },
} as const;

/** The blocking sets a remediation must name, codes and commands each in position order. */
export const BLOCKING_SETS = {
  BEFORE_REVIEW: ["code-quality", "test-quality", "functional-test"],
  BEFORE_REVIEW_DRIVERS: ["/code-quality", "/test-quality", "/functional-test"],
  BEFORE_COMMIT: ["human-review", "pm-update"],
  BEFORE_COMMIT_DRIVERS: ["/human-review-loop", "/pm-update"],
  BEFORE_HANDOFF: ["brief", "red", "implement", "gate", "coverage"],
} as const;

/** A seeded workflow step made Recommended, so a step past it is shown to close while it stays open. */
export const SUBTASK_KIND_CHANGE = {
  STEP: "implement",
  SEEDED: "Required",
  CHANGED: "Recommended",
} as const;

/** A stage moved past the end of the library after a chain exists; read live, it would stop blocking the stage after it. */
export const POSITION_CHANGE = {
  STEP: "code-quality",
  SEEDED: 20,
  CHANGED: 95,
} as const;

/** The human-only flag lifted after a chain exists; read live, an agent could then close review. */
export const HUMAN_FLAG_CHANGE = {
  STEP: "human-review",
  SEEDED: true,
  CHANGED: false,
} as const;

/** A seeded driver rewritten, so the remediation is shown to read the row. */
export const DRIVER_CHANGE = {
  STEP: "code-quality",
  SEEDED: "/code-quality",
  CHANGED: "/cq-renamed",
} as const;

/**
 * Every code each list must hold. `NAMES` is pinned only where the data model
 * gives the phrase outright. Lists whose names the model leaves open
 * (`NAMES: null`) are only checked for a non-empty name.
 */
export const EXPECTED_CODE_LISTS = {
  ActivityKind: {
    CODES: [
      "migration",
      "checkpoint",
      "statusUpdate",
      "focusChange",
      "initiativeStatus",
      "lesson",
      "sprintPlanned",
      "storyAdded",
      "stageStarted",
      "stageCompleted",
      "subtaskCompleted",
      "stageReopened",
      "defectLogged",
      "defectResolved",
      "decisionRecorded",
      "testRunRecorded",
    ],
    NAMES: null,
  },
  Actor: {
    CODES: [
      "sandro",
      "implementer",
      "test-author",
      "gate-runner",
      "build-briefer",
      "pm-update",
      "test-report",
      "migration",
    ],
    NAMES: null,
  },
  ActorKind: {
    CODES: ["human", "agent", "system"],
    NAMES: { human: "Human", agent: "Agent", system: "System" },
  },
  DefectSeverity: {
    CODES: ["Critical", "High", "Medium", "Low"],
    NAMES: { Critical: "Critical", High: "High", Medium: "Medium", Low: "Low" },
  },
  DefectStatus: {
    CODES: ["Open", "Closed"],
    NAMES: { Open: "Open", Closed: "Closed" },
  },
  FricewType: {
    CODES: [
      "Interface",
      "Conversion",
      "Enhancement",
      "Form",
      "Report",
      "Workflow",
    ],
    NAMES: {
      Interface: "Interface",
      Conversion: "Conversion",
      Enhancement: "Enhancement",
      Form: "Form",
      Report: "Report",
      Workflow: "Workflow",
    },
  },
  HealthState: {
    CODES: ["Healthy", "NeedsAttention", "Struggling"],
    NAMES: {
      Healthy: "Healthy",
      NeedsAttention: "Needs Attention",
      Struggling: "Struggling",
    },
  },
  InitiativeStatus: {
    CODES: ["Active", "Complete"],
    NAMES: { Active: "Active", Complete: "Complete" },
  },
  MilestoneStatus: {
    CODES: ["backlog", "inProgress", "done"],
    NAMES: { backlog: "Backlog", inProgress: "In Progress", done: "Done" },
  },
  StepKind: {
    CODES: ["Required", "Conditional", "Recommended"],
    NAMES: {
      Required: "Required",
      Conditional: "Conditional",
      Recommended: "Recommended",
    },
  },
  SubtaskStatus: {
    CODES: ["notStarted", "complete"],
    NAMES: { notStarted: "Not Started", complete: "Complete" },
  },
  TaskStatus: {
    CODES: ["notStarted", "inProgress", "complete"],
    NAMES: {
      notStarted: "Not Started",
      inProgress: "In Progress",
      complete: "Complete",
    },
  },
} as const;

/** How many code-list rows the seed holds across all twelve lists. */
export const CODE_LIST_ROW_TOTAL = 55;

/** The kind every agent and system identity must resolve to, keyed by actor. */
export const EXPECTED_ACTOR_KINDS = {
  sandro: "human",
  implementer: "agent",
  "test-author": "agent",
  "gate-runner": "agent",
  "build-briefer": "agent",
  "pm-update": "agent",
  "test-report": "system",
  migration: "system",
} as const;

/** A second human identity, so a human check keyed on one name is told apart from one keyed on kind. */
export const EXTRA_HUMAN_ACTOR = {
  code: "reviewer",
  name: "Reviewer",
  kind_code: "human",
} as const;

/** An identity no Actor row carries, so its kind resolves to nothing at all. */
export const UNSEEDED_ACTOR = "unseeded-identity";
