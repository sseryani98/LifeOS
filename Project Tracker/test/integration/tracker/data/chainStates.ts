/** Fixed completion times, so an assertion about "unchanged" has something to name. */
export const CHAIN_TIMES = {
  BUILD_DONE: "2026-08-10T09:00:00Z",
  CODE_QUALITY_STARTED: "2026-08-10T10:00:00Z",
  TEST_QUALITY_STARTED: "2026-08-10T10:30:00Z",
  CODE_QUALITY_DONE: "2026-08-10T11:00:00Z",
  TEST_QUALITY_DONE: "2026-08-10T12:00:00Z",
  FUNCTIONAL_TEST_DONE: "2026-08-10T13:00:00Z",
  HUMAN_REVIEW_DONE: "2026-08-10T14:00:00Z",
} as const;

/** The first stage closed, the second in progress — the ordinary mid-story shape. */
export const CODE_QUALITY_IN_PROGRESS = {
  "sprint-build": { status: "complete", completedAt: CHAIN_TIMES.BUILD_DONE },
  "code-quality": {
    status: "inProgress",
    startedAt: CHAIN_TIMES.CODE_QUALITY_STARTED,
  },
} as const;

/** The third stage running while the second still is, so its blocker is In Progress rather than Not Started. */
export const CODE_QUALITY_AND_TEST_QUALITY_IN_PROGRESS = {
  ...CODE_QUALITY_IN_PROGRESS,
  "test-quality": {
    status: "inProgress",
    startedAt: CHAIN_TIMES.TEST_QUALITY_STARTED,
  },
} as const;

/** The second stage already closed, at a time an assertion can name. */
export const CODE_QUALITY_COMPLETE = {
  "sprint-build": { status: "complete", completedAt: CHAIN_TIMES.BUILD_DONE },
  "code-quality": {
    status: "complete",
    completedAt: CHAIN_TIMES.CODE_QUALITY_DONE,
  },
} as const;

/** The first stage still open, with its steps arranged around one of them. */
export const BUILD_IN_PROGRESS = {
  "sprint-build": {
    status: "inProgress",
    startedAt: CHAIN_TIMES.CODE_QUALITY_STARTED,
  },
} as const;

/** Everything blocking closed, so the story derives Done. */
export const WHOLE_CHAIN_COMPLETE = {
  "sprint-build": { status: "complete", completedAt: CHAIN_TIMES.BUILD_DONE },
  "code-quality": {
    status: "complete",
    completedAt: CHAIN_TIMES.CODE_QUALITY_DONE,
  },
  "test-quality": {
    status: "complete",
    completedAt: CHAIN_TIMES.TEST_QUALITY_DONE,
  },
  "functional-test": {
    status: "complete",
    completedAt: CHAIN_TIMES.FUNCTIONAL_TEST_DONE,
  },
  "human-review": {
    status: "complete",
    completedAt: CHAIN_TIMES.HUMAN_REVIEW_DONE,
  },
  documentation: {
    status: "complete",
    completedAt: CHAIN_TIMES.HUMAN_REVIEW_DONE,
  },
  "pm-update": {
    status: "complete",
    completedAt: CHAIN_TIMES.HUMAN_REVIEW_DONE,
  },
  commit: { status: "complete", completedAt: CHAIN_TIMES.HUMAN_REVIEW_DONE },
} as const;

/** Human review still open, with the last stage reachable but blocked behind it. */
export const HUMAN_REVIEW_OPEN = {
  "sprint-build": { status: "complete", completedAt: CHAIN_TIMES.BUILD_DONE },
  "code-quality": {
    status: "complete",
    completedAt: CHAIN_TIMES.CODE_QUALITY_DONE,
  },
  "test-quality": {
    status: "complete",
    completedAt: CHAIN_TIMES.TEST_QUALITY_DONE,
  },
  "functional-test": {
    status: "complete",
    completedAt: CHAIN_TIMES.FUNCTIONAL_TEST_DONE,
  },
  commit: { status: "inProgress", startedAt: CHAIN_TIMES.HUMAN_REVIEW_DONE },
} as const;

/** Everything through human review closed, leaving two stages startable at once. */
export const TWO_STAGES_STARTABLE = {
  "sprint-build": { status: "complete", completedAt: CHAIN_TIMES.BUILD_DONE },
  "code-quality": {
    status: "complete",
    completedAt: CHAIN_TIMES.CODE_QUALITY_DONE,
  },
  "test-quality": {
    status: "complete",
    completedAt: CHAIN_TIMES.TEST_QUALITY_DONE,
  },
  "functional-test": {
    status: "complete",
    completedAt: CHAIN_TIMES.FUNCTIONAL_TEST_DONE,
  },
  "human-review": {
    status: "complete",
    completedAt: CHAIN_TIMES.HUMAN_REVIEW_DONE,
  },
} as const;

/** Every blocking stage closed and the Recommended documentation stage never started: Done. */
export const BLOCKING_CHAIN_COMPLETE = {
  ...TWO_STAGES_STARTABLE,
  "pm-update": {
    status: "complete",
    completedAt: CHAIN_TIMES.HUMAN_REVIEW_DONE,
  },
  commit: { status: "complete", completedAt: CHAIN_TIMES.HUMAN_REVIEW_DONE },
} as const;

/**
 * Every stage this fixture names closed, with the last one left open. On a
 * backend story that leaves commit as the only open stage; on a UI story the
 * Conditional ux-test stage, which this names nowhere, stays open as well.
 */
export const COMMIT_LAST_OPEN = {
  ...WHOLE_CHAIN_COMPLETE,
  commit: { status: "inProgress", startedAt: CHAIN_TIMES.HUMAN_REVIEW_DONE },
} as const;

/**
 * Blocked and already complete at once: human review never ran, yet commit
 * carries a completion time. Which of the two the caller is told is the guard
 * order, not the guard set.
 */
export const BLOCKED_AND_COMPLETE = {
  ...HUMAN_REVIEW_OPEN,
  commit: { status: "complete", completedAt: CHAIN_TIMES.HUMAN_REVIEW_DONE },
} as const;

/** The stage and step codes the lifecycle assertions address. */
export const STAGE = {
  BUILD: "sprint-build",
  CODE_QUALITY: "code-quality",
  TEST_QUALITY: "test-quality",
  FUNCTIONAL_TEST: "functional-test",
  UX_TEST: "ux-test",
  HUMAN_REVIEW: "human-review",
  DOCUMENTATION: "documentation",
  PM_UPDATE: "pm-update",
  COMMIT: "commit",
} as const;

/** The workflow step codes under the first stage. */
export const STEP = {
  BRIEF: "brief",
  RED: "red",
  IMPLEMENT: "implement",
  GATE: "gate",
  COVERAGE: "coverage",
  SMOKE: "smoke",
  HANDOFF: "handoff",
} as const;

/** The first workflow step, the only one with no predecessor to wait on. */
export const FIRST_STEP = STEP.BRIEF;

/** The first stage closed and nothing else touched. */
export const BUILD_COMPLETE = {
  "sprint-build": { status: "complete", completedAt: CHAIN_TIMES.BUILD_DONE },
} as const;

/** The first three stages closed in order, the fourth not yet started. */
export const THROUGH_TEST_QUALITY_COMPLETE = {
  ...CODE_QUALITY_COMPLETE,
  "test-quality": {
    status: "complete",
    completedAt: CHAIN_TIMES.TEST_QUALITY_DONE,
  },
} as const;

/** Every blocking stage before human review closed, and human review untouched. */
export const THROUGH_FUNCTIONAL_TEST_COMPLETE = {
  ...THROUGH_TEST_QUALITY_COMPLETE,
  "functional-test": {
    status: "complete",
    completedAt: CHAIN_TIMES.FUNCTIONAL_TEST_DONE,
  },
} as const;

/** Human review under way with everything before it closed. */
export const HUMAN_REVIEW_IN_PROGRESS = {
  ...THROUGH_FUNCTIONAL_TEST_COMPLETE,
  "human-review": {
    status: "inProgress",
    startedAt: CHAIN_TIMES.FUNCTIONAL_TEST_DONE,
  },
} as const;

/** When each workflow step of a closed first stage closed, so "unchanged" has values to name. */
export const STEP_TIMES = {
  brief: "2026-08-10T08:10:00Z",
  red: "2026-08-10T08:20:00Z",
  implement: "2026-08-10T08:30:00Z",
  gate: "2026-08-10T08:40:00Z",
  coverage: "2026-08-10T08:50:00Z",
  handoff: "2026-08-10T08:55:00Z",
} as const;

/** Every step before handoff closed in order, the handoff step itself still open. */
export const STEPS_BEFORE_HANDOFF_DONE = {
  brief: STEP_TIMES.brief,
  red: STEP_TIMES.red,
  implement: STEP_TIMES.implement,
  gate: STEP_TIMES.gate,
  coverage: STEP_TIMES.coverage,
} as const;

/** The first step alone closed, for the second-close refusal. */
export const BRIEF_DONE = { brief: STEP_TIMES.brief } as const;

/** The activity target a stage event on the canonical story is filed under. */
export const CODE_QUALITY_TARGET = "financial-planner/CNV-001#code-quality";

/** Why the first stage is reopened after all its steps closed. */
export const BUILD_REOPEN_REASON = "handoff wrote the wrong branch";

/** A reason offered for a reopen the stage's state must refuse. */
export const PLAIN_REASON = "reason";

/** The workflow step left open under the first stage. */
export const OPEN_STEP = STEP.HANDOFF;

/** The steps closed before it. */
export const CLOSED_STEPS = [
  STEP.BRIEF,
  STEP.RED,
  STEP.IMPLEMENT,
  STEP.GATE,
  STEP.COVERAGE,
] as const;

/** Why a stage is reopened. */
export const REOPEN_REASON = "defect found at commit";

/** A whitespace-only reason, refused because the guard trims before it checks for empty. */
export const EMPTY_REASON = "   ";
