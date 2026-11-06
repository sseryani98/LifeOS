import type {
  CandidateStory,
  StageFacts,
} from "../../../../srv/modules/tracker/types.js";

/** The stage status codes a chain carries. */
const STATUS = {
  NOT_STARTED: "notStarted",
  IN_PROGRESS: "inProgress",
  COMPLETE: "complete",
} as const;

/** The step kind codes a chain carries. */
const KIND = {
  REQUIRED: "Required",
  CONDITIONAL: "Conditional",
  RECOMMENDED: "Recommended",
} as const;

/** The stage codes the assertions name. */
export const STAGE_CODE = {
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

/** The backend chain as the seeded library materialises it, in position order. */
const BACKEND_STAGES = [
  { step_code: STAGE_CODE.BUILD, stepKind: KIND.REQUIRED, stepPosition: 10 },
  { step_code: STAGE_CODE.CODE_QUALITY, stepKind: KIND.REQUIRED, stepPosition: 20 },
  { step_code: STAGE_CODE.TEST_QUALITY, stepKind: KIND.REQUIRED, stepPosition: 30 },
  { step_code: STAGE_CODE.FUNCTIONAL_TEST, stepKind: KIND.REQUIRED, stepPosition: 40 },
  { step_code: STAGE_CODE.HUMAN_REVIEW, stepKind: KIND.REQUIRED, stepPosition: 60 },
  { step_code: STAGE_CODE.DOCUMENTATION, stepKind: KIND.RECOMMENDED, stepPosition: 70 },
  { step_code: STAGE_CODE.PM_UPDATE, stepKind: KIND.REQUIRED, stepPosition: 80 },
  { step_code: STAGE_CODE.COMMIT, stepKind: KIND.REQUIRED, stepPosition: 90 },
] as const;

/** Where the last stage sits in the chain, so every stage ahead of it is judged. */
export const COMMIT_POSITION = BACKEND_STAGES[BACKEND_STAGES.length - 1].stepPosition;

/** The one stage a UI story's chain adds, materialised because the story ships UI. */
const UX_STAGE = {
  step_code: STAGE_CODE.UX_TEST,
  stepKind: KIND.CONDITIONAL,
  stepPosition: 50,
} as const;

/**
 * Builds a chain in position order with every stage the states name set, and
 * every other one left at the default.
 * @param states Each named stage's status.
 * @param fallback The status every unnamed stage carries.
 * @param withUx Whether the chain is a UI story's, holding the conditional stage.
 * @returns The chain.
 */
const buildChain = (
  states: Partial<Record<string, string>>,
  fallback: string = STATUS.NOT_STARTED,
  withUx = false,
): StageFacts[] => {
  const stages = withUx
    ? [...BACKEND_STAGES.slice(0, 4), UX_STAGE, ...BACKEND_STAGES.slice(4)]
    : [...BACKEND_STAGES];
  return stages.map(stage => ({
    ...stage,
    status_code: states[stage.step_code] ?? fallback,
  }));
};

/** Named chains, one per state the rules distinguish. */
export const CHAINS = {
  /** Freshly materialised: nothing started. */
  UNTOUCHED: buildChain({}),
  /** The first stage running. */
  BUILD_IN_PROGRESS: buildChain({ [STAGE_CODE.BUILD]: STATUS.IN_PROGRESS }),
  /** The first stage closed and nothing else touched. */
  BUILD_COMPLETE: buildChain({ [STAGE_CODE.BUILD]: STATUS.COMPLETE }),
  /** Everything through human review closed; the Recommended stage is next. */
  THROUGH_REVIEW_COMPLETE: buildChain(
    {
      [STAGE_CODE.DOCUMENTATION]: STATUS.NOT_STARTED,
      [STAGE_CODE.PM_UPDATE]: STATUS.NOT_STARTED,
      [STAGE_CODE.COMMIT]: STATUS.NOT_STARTED,
    },
    STATUS.COMPLETE,
  ),
  /** Every blocking stage closed; only the Recommended one is left, untouched. */
  BLOCKING_COMPLETE: buildChain(
    { [STAGE_CODE.DOCUMENTATION]: STATUS.NOT_STARTED },
    STATUS.COMPLETE,
  ),
  /** Every blocking stage closed; the Recommended one is running. */
  RECOMMENDED_RUNNING_ONLY: buildChain(
    { [STAGE_CODE.DOCUMENTATION]: STATUS.IN_PROGRESS },
    STATUS.COMPLETE,
  ),
  /** The Recommended stage is the only one ever started. */
  RECOMMENDED_STARTED_FIRST: buildChain({
    [STAGE_CODE.DOCUMENTATION]: STATUS.IN_PROGRESS,
  }),
  /** A UI story with only its Conditional stage left open. */
  CONDITIONAL_LEFT_OPEN: buildChain(
    { [STAGE_CODE.UX_TEST]: STATUS.NOT_STARTED },
    STATUS.COMPLETE,
    true,
  ),
  /** The second stage reopened after the third already closed. */
  REOPENED_BEHIND_LATER_WORK: buildChain({
    [STAGE_CODE.BUILD]: STATUS.COMPLETE,
    [STAGE_CODE.CODE_QUALITY]: STATUS.IN_PROGRESS,
    [STAGE_CODE.TEST_QUALITY]: STATUS.COMPLETE,
  }),
  /** Every stage closed. */
  ALL_COMPLETE: buildChain({}, STATUS.COMPLETE),
  /** A story created Done, which never had a chain. */
  EMPTY: [] as StageFacts[],
} as const;

/** The first stage closed, with the rows handed over in reverse position order. */
export const BUILD_COMPLETE_REVERSED = [...CHAINS.BUILD_COMPLETE].reverse();

/**
 * Every chain the seeded library can actually produce while work remains, so
 * a candidate. A chain of only Recommended stages is absent on purpose: the
 * library always materialises Required stages.
 */
export const REACHABLE_CANDIDATE_CHAINS = [
  CHAINS.UNTOUCHED,
  CHAINS.BUILD_IN_PROGRESS,
  CHAINS.BUILD_COMPLETE,
  CHAINS.THROUGH_REVIEW_COMPLETE,
  CHAINS.BLOCKING_COMPLETE,
  CHAINS.RECOMMENDED_RUNNING_ONLY,
  CHAINS.RECOMMENDED_STARTED_FIRST,
  CHAINS.CONDITIONAL_LEFT_OPEN,
  CHAINS.REOPENED_BEHIND_LATER_WORK,
] as const;

/** Each reachable chain's tier paired with the status the story derives, in the same order. */
export const EXPECTED_TIER_STATUS_PAIRS = [
  [2, "backlog"],
  [1, "inProgress"],
  [1, "inProgress"],
  [1, "inProgress"],
  [3, "done"],
  [3, "done"],
  [1, "inProgress"],
  [1, "inProgress"],
  [1, "inProgress"],
] as const;

/**
 * Builds one story as the selector sees it.
 * @param storyId The story's identifier, which the assertions read back.
 * @param initiativePosition Its sprint's position in the workspace.
 * @param milestonePosition Its own position in the sprint.
 * @param tasks Its chain.
 * @returns The story.
 */
const buildStory = (
  storyId: string,
  initiativePosition: number,
  milestonePosition: number,
  tasks: StageFacts[],
): CandidateStory & { storyId: string } => ({ storyId, initiativePosition, milestonePosition, tasks });

/** Story sets for the ordering rules, each listed out of the order expected back. */
export const STORY_SETS = {
  /** Started work in the latest sprint, fresh work in the middle, optional work in the earliest. */
  TIER_AGAINST_POSITION: [
    buildStory("OPT-001", 10, 10, CHAINS.BLOCKING_COMPLETE),
    buildStory("NEW-001", 20, 20, CHAINS.UNTOUCHED),
    buildStory("RUN-001", 90, 90, CHAINS.BUILD_IN_PROGRESS),
  ],
  /** One tier; the earlier sprint holds the later story position. */
  SPRINT_AGAINST_STORY: [
    buildStory("LATE-SPRINT", 20, 10, CHAINS.UNTOUCHED),
    buildStory("EARLY-SPRINT", 10, 90, CHAINS.UNTOUCHED),
  ],
  /** One tier and one sprint; only story position separates them. */
  ONE_SPRINT: [
    buildStory("THIRD", 10, 30, CHAINS.UNTOUCHED),
    buildStory("FIRST", 10, 10, CHAINS.UNTOUCHED),
    buildStory("SECOND", 10, 20, CHAINS.UNTOUCHED),
  ],
  /** One candidate between a finished story and one that never had a chain. */
  WITH_NON_CANDIDATES: [
    buildStory("FINISHED", 10, 10, CHAINS.ALL_COMPLETE),
    buildStory("CHAINLESS", 10, 20, CHAINS.EMPTY),
    buildStory("OPEN", 10, 30, CHAINS.UNTOUCHED),
  ],
  /** Nothing left anywhere. */
  NOTHING_OPEN: [
    buildStory("FINISHED", 10, 10, CHAINS.ALL_COMPLETE),
    buildStory("CHAINLESS", 10, 20, CHAINS.EMPTY),
  ],
  /** Fresh work early, resumable work late: the late story's next stage must win. */
  RESUMABLE_LATE: [
    buildStory("NEW-001", 10, 10, CHAINS.UNTOUCHED),
    buildStory("RUN-001", 90, 90, CHAINS.BUILD_COMPLETE),
  ],
  /** One story whose only remaining stage is Recommended. */
  OPTIONAL_ONLY: [
    buildStory("FINISHED", 10, 10, CHAINS.ALL_COMPLETE),
    buildStory("OPT-001", 10, 20, CHAINS.BLOCKING_COMPLETE),
  ],
} as const;

/** The order each story set must come back in. */
export const EXPECTED_RANKS = {
  TIER_AGAINST_POSITION: ["RUN-001", "NEW-001", "OPT-001"],
  SPRINT_AGAINST_STORY: ["EARLY-SPRINT", "LATE-SPRINT"],
  ONE_SPRINT: ["FIRST", "SECOND", "THIRD"],
  WITH_NON_CANDIDATES: ["OPEN"],
} as const;
