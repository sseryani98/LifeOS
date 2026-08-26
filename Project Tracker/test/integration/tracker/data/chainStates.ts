/** Fixed completion times, so an assertion about "unchanged" has something to name. */
export const CHAIN_TIMES = {
  BUILD_DONE: "2026-08-10T09:00:00Z",
  CODE_QUALITY_STARTED: "2026-08-10T10:00:00Z",
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
  "pm-update": { status: "complete", completedAt: CHAIN_TIMES.HUMAN_REVIEW_DONE },
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
  UX_TEST: "ux-test",
  HUMAN_REVIEW: "human-review",
  DOCUMENTATION: "documentation",
  PM_UPDATE: "pm-update",
  COMMIT: "commit",
} as const;

/** The workflow step left open under the first stage. */
export const OPEN_STEP = "handoff";

/** The steps closed before it. */
export const CLOSED_STEPS = ["brief", "red", "implement", "gate", "coverage"] as const;

/** Why a stage is reopened, and the empty reason that is refused. */
export const REOPEN_REASON = "defect found at commit";

/** An empty reason, which carries no information and is therefore refused. */
export const EMPTY_REASON = "   ";
