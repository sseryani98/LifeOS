import { ACTORS, SECOND_WORKSPACE, SPRINT_PLAN, WORLD } from "../../../shared/data/world.js";

import { FULL_CHAIN_SCRIPT, type ChainScriptStep } from "./chainScripts.js";
import { BUILD_IN_PROGRESS, CHAIN_TIMES, STAGE, STEP } from "./chainStates.js";
import { MIGRATED_REFERENCE, PLANNED_REFERENCES, TIER } from "./nextActionWorld.js";
import { SECOND_STORY } from "./writePayloads.js";

/** A backend story's stages, in chain position order. */
export const BACKEND_CHAIN = [
  STAGE.BUILD,
  STAGE.CODE_QUALITY,
  STAGE.TEST_QUALITY,
  STAGE.FUNCTIONAL_TEST,
  STAGE.HUMAN_REVIEW,
  STAGE.DOCUMENTATION,
  STAGE.PM_UPDATE,
  STAGE.COMMIT,
] as const;

/** A UI story's stages, with the one Conditional stage its flag materialises. */
export const UI_CHAIN = [
  STAGE.BUILD,
  STAGE.CODE_QUALITY,
  STAGE.TEST_QUALITY,
  STAGE.FUNCTIONAL_TEST,
  STAGE.UX_TEST,
  STAGE.HUMAN_REVIEW,
  STAGE.DOCUMENTATION,
  STAGE.PM_UPDATE,
  STAGE.COMMIT,
] as const;

/** Every workflow step code, none of which may ever reach a section of the report. */
export const SUBTASK_CODES = Object.values(STEP);

/** A workspace-qualified story reference: slug, slash, story identifier. */
export const QUALIFIED_STORY_PATTERN = new RegExp(
  `^${WORLD.WORKSPACE.slug}/[A-Z]{3}-\\d{3}$`,
);

/** The planned sprint's stories, qualified, by role. */
const PLANNED = {
  BACKEND: PLANNED_REFERENCES[0],
  REPORT: PLANNED_REFERENCES[1],
  FORM: PLANNED_REFERENCES[2],
} as const;

/** The planned backend story's bare identifier, for arranging its chain. */
export const PLANNED_BACKEND_STORY_ID = SPRINT_PLAN.stories[0].id;

/**
 * The candidate world's queue when every chain is untouched: all four stories
 * start fresh, so the earlier sprint's story leads and the planned sprint's
 * follow in their plan order, each in its own chain order.
 */
export const UNTOUCHED_CANDIDATE_QUEUE = [
  ...BACKEND_CHAIN.map(stage => `${MIGRATED_REFERENCE.BACKLOG}#${stage}`),
  ...BACKEND_CHAIN.map(stage => `${PLANNED.BACKEND}#${stage}`),
  ...UI_CHAIN.map(stage => `${PLANNED.REPORT}#${stage}`),
  ...UI_CHAIN.map(stage => `${PLANNED.FORM}#${stage}`),
];

/** The planned backend story's first stage under way, which makes it the one story being resumed. */
export const PLANNED_BACKEND_RESUMED = BUILD_IN_PROGRESS;

/** The queue once the planned backend story is resumed: started work outranks an earlier sprint. */
export const RESUMED_FIRST_QUEUE = [
  ...BACKEND_CHAIN.map(stage => `${PLANNED.BACKEND}#${stage}`),
  ...BACKEND_CHAIN.map(stage => `${MIGRATED_REFERENCE.BACKLOG}#${stage}`),
  ...UI_CHAIN.map(stage => `${PLANNED.REPORT}#${stage}`),
  ...UI_CHAIN.map(stage => `${PLANNED.FORM}#${stage}`),
];

/** The one tier each story's rows all carry once the planned backend story is resumed. */
export const RESUMED_FIRST_TIERS = {
  [MIGRATED_REFERENCE.BACKLOG]: [TIER.FRESH],
  [PLANNED.BACKEND]: [TIER.RESUMING],
  [PLANNED.REPORT]: [TIER.FRESH],
  [PLANNED.FORM]: [TIER.FRESH],
} as const;

/** The queue once the earlier sprint's story has only its Recommended stage left: it sinks to last. */
export const OPTIONAL_LAST_QUEUE = [
  ...BACKEND_CHAIN.map(stage => `${PLANNED.BACKEND}#${stage}`),
  ...UI_CHAIN.map(stage => `${PLANNED.REPORT}#${stage}`),
  ...UI_CHAIN.map(stage => `${PLANNED.FORM}#${stage}`),
  `${MIGRATED_REFERENCE.BACKLOG}#${STAGE.DOCUMENTATION}`,
];

/** The stories the candidate world's queue references, qualified. */
export const CANDIDATE_STORIES = [MIGRATED_REFERENCE.BACKLOG, ...PLANNED_REFERENCES];

/**
 * The blocker each open stage names while the second stage is open, untouched
 * or running. Every one names the earliest open blocking stage, not its
 * immediate predecessor, and the head names none.
 */
export const BLOCKERS_WITH_CODE_QUALITY_OPEN = {
  [STAGE.CODE_QUALITY]: null,
  [STAGE.TEST_QUALITY]: STAGE.CODE_QUALITY,
  [STAGE.FUNCTIONAL_TEST]: STAGE.CODE_QUALITY,
  [STAGE.HUMAN_REVIEW]: STAGE.CODE_QUALITY,
  [STAGE.DOCUMENTATION]: STAGE.CODE_QUALITY,
  [STAGE.PM_UPDATE]: STAGE.CODE_QUALITY,
  [STAGE.COMMIT]: STAGE.CODE_QUALITY,
} as const;

/**
 * Everything through human review closed: the open Recommended stage blocks
 * nothing, so the stage after it is free and only the last one waits.
 */
export const BLOCKERS_PAST_RECOMMENDED = {
  [STAGE.DOCUMENTATION]: null,
  [STAGE.PM_UPDATE]: null,
  [STAGE.COMMIT]: STAGE.PM_UPDATE,
} as const;

/** Seven completion times, all distinct, interleaved across two stories. */
const SPREAD_TIMES = {
  FIRST: "2026-08-11T09:00:00Z",
  SECOND: "2026-08-11T10:00:00Z",
  THIRD: "2026-08-11T11:00:00Z",
  FOURTH: "2026-08-11T12:00:00Z",
  FIFTH: "2026-08-11T13:00:00Z",
  SIXTH: "2026-08-11T14:00:00Z",
  SEVENTH: "2026-08-11T15:00:00Z",
} as const;

/** The earlier sprint's story: four stages closed at the odd times. */
export const BACKLOG_SPREAD_COMPLETIONS = {
  [STAGE.BUILD]: { status: "complete", completedAt: SPREAD_TIMES.FIRST },
  [STAGE.CODE_QUALITY]: { status: "complete", completedAt: SPREAD_TIMES.THIRD },
  [STAGE.TEST_QUALITY]: { status: "complete", completedAt: SPREAD_TIMES.FIFTH },
  [STAGE.FUNCTIONAL_TEST]: { status: "complete", completedAt: SPREAD_TIMES.SEVENTH },
} as const;

/** The planned backend story: three stages closed at the even times. */
export const PLANNED_SPREAD_COMPLETIONS = {
  [STAGE.BUILD]: { status: "complete", completedAt: SPREAD_TIMES.SECOND },
  [STAGE.CODE_QUALITY]: { status: "complete", completedAt: SPREAD_TIMES.FOURTH },
  [STAGE.TEST_QUALITY]: { status: "complete", completedAt: SPREAD_TIMES.SIXTH },
} as const;

/** The first stage's six workflow steps, closed later than any stage, so a list that let them in would lead with them. */
export const LATE_SUBTASK_COMPLETIONS = {
  [STEP.BRIEF]: "2026-08-11T16:00:00Z",
  [STEP.RED]: "2026-08-11T16:10:00Z",
  [STEP.IMPLEMENT]: "2026-08-11T16:20:00Z",
  [STEP.GATE]: "2026-08-11T16:30:00Z",
  [STEP.COVERAGE]: "2026-08-11T16:40:00Z",
  [STEP.HANDOFF]: "2026-08-11T16:50:00Z",
} as const;

/** The five most recent of the seven, newest first, drawn from both stories. */
export const RECENT_FIVE = [
  {
    story: MIGRATED_REFERENCE.BACKLOG,
    stepCode: STAGE.FUNCTIONAL_TEST,
    completedAt: SPREAD_TIMES.SEVENTH,
  },
  { story: PLANNED.BACKEND, stepCode: STAGE.TEST_QUALITY, completedAt: SPREAD_TIMES.SIXTH },
  {
    story: MIGRATED_REFERENCE.BACKLOG,
    stepCode: STAGE.TEST_QUALITY,
    completedAt: SPREAD_TIMES.FIFTH,
  },
  { story: PLANNED.BACKEND, stepCode: STAGE.CODE_QUALITY, completedAt: SPREAD_TIMES.FOURTH },
  {
    story: MIGRATED_REFERENCE.BACKLOG,
    stepCode: STAGE.CODE_QUALITY,
    completedAt: SPREAD_TIMES.THIRD,
  },
] as const;

/** A sprint in the second workspace, so its completions have somewhere to live. */
export const OTHER_WORKSPACE_SPRINT = {
  name: "PT-W1",
  goal: "The tracker runs on itself",
  branch: "sprint/PT-W1",
  status_code: "Active",
  position: 10,
} as const;

/** A story in the second workspace. */
export const OTHER_WORKSPACE_STORY = {
  storyId: "ENH-002",
  fricewType_code: "Enhancement",
  description: "Next-action resolver",
  shipsUi: false,
  position: 10,
} as const;

/** The second workspace's story reference, which must never reach the first workspace's report. */
export const OTHER_WORKSPACE_REFERENCE = `${SECOND_WORKSPACE.slug}/${OTHER_WORKSPACE_STORY.storyId}`;

/** Five completions in the second workspace, every one newer than the first workspace's two. */
export const OTHER_WORKSPACE_COMPLETIONS = {
  [STAGE.BUILD]: { status: "complete", completedAt: "2026-09-01T09:00:00Z" },
  [STAGE.CODE_QUALITY]: { status: "complete", completedAt: "2026-09-01T10:00:00Z" },
  [STAGE.TEST_QUALITY]: { status: "complete", completedAt: "2026-09-01T11:00:00Z" },
  [STAGE.FUNCTIONAL_TEST]: { status: "complete", completedAt: "2026-09-01T12:00:00Z" },
  [STAGE.HUMAN_REVIEW]: { status: "complete", completedAt: "2026-09-01T13:00:00Z" },
} as const;

/** Two stages closed in the first workspace, fewer than the cap. */
export const TWO_COMPLETIONS = {
  [STAGE.BUILD]: { status: "complete", completedAt: CHAIN_TIMES.BUILD_DONE },
  [STAGE.CODE_QUALITY]: { status: "complete", completedAt: CHAIN_TIMES.CODE_QUALITY_DONE },
} as const;

/** The two of them, newest first. */
export const TWO_COMPLETIONS_NEWEST_FIRST = [STAGE.CODE_QUALITY, STAGE.BUILD] as const;

/** The canonical world's second story, qualified. */
export const SECOND_STORY_REFERENCE = `${WORLD.WORKSPACE.slug}/${SECOND_STORY.storyId}`;

/** The first stage started by one identity and closed by another, so the completer is the one to name. */
export const BUILD_CLOSED_BY_SANDRO: ChainScriptStep[] = [
  { verb: "start", stage: STAGE.BUILD, actor: ACTORS.IMPLEMENTER },
  { verb: "complete", stage: STAGE.BUILD, actor: ACTORS.SANDRO },
];

/** The first stage run start to finish by the implementer. */
export const BUILD_CLOSED_BY_IMPLEMENTER: ChainScriptStep[] = [
  { verb: "start", stage: STAGE.BUILD, actor: ACTORS.IMPLEMENTER },
  { verb: "complete", stage: STAGE.BUILD, actor: ACTORS.IMPLEMENTER },
];

/** The first two stages run start to finish through the verbs, so each closed with a completion event. */
export const THROUGH_CODE_QUALITY_SCRIPT: ChainScriptStep[] = FULL_CHAIN_SCRIPT.slice(0, 4);

/** Closing the first stage again after a reopen, by a different identity than closed it first. */
export const BUILD_RECLOSED_BY_SANDRO: ChainScriptStep[] = [
  { verb: "complete", stage: STAGE.BUILD, actor: ACTORS.SANDRO },
];

/** The target a first-stage event on the migrated Backlog story is filed under. */
export const BACKLOG_BUILD_TARGET = `${MIGRATED_REFERENCE.BACKLOG}#${STAGE.BUILD}`;
