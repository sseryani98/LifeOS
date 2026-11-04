import { ACTORS } from "../../../shared/data/world.js";

/** One verb call a scripted chain run makes, and who makes it. */
export interface ChainScriptStep {
  verb: "start" | "complete";
  stage: string;
  actor: string;
}

/**
 * The whole chain of a backend story driven to Done, leaving the Recommended
 * stage untouched. An agent runs every stage; only the human closes review.
 */
export const FULL_CHAIN_SCRIPT: ChainScriptStep[] = [
  { verb: "start", stage: "sprint-build", actor: ACTORS.IMPLEMENTER },
  { verb: "complete", stage: "sprint-build", actor: ACTORS.IMPLEMENTER },
  { verb: "start", stage: "code-quality", actor: ACTORS.IMPLEMENTER },
  { verb: "complete", stage: "code-quality", actor: ACTORS.IMPLEMENTER },
  { verb: "start", stage: "test-quality", actor: ACTORS.IMPLEMENTER },
  { verb: "complete", stage: "test-quality", actor: ACTORS.IMPLEMENTER },
  { verb: "start", stage: "functional-test", actor: ACTORS.IMPLEMENTER },
  { verb: "complete", stage: "functional-test", actor: ACTORS.IMPLEMENTER },
  { verb: "start", stage: "human-review", actor: ACTORS.IMPLEMENTER },
  { verb: "complete", stage: "human-review", actor: ACTORS.SANDRO },
  { verb: "start", stage: "pm-update", actor: ACTORS.IMPLEMENTER },
  { verb: "complete", stage: "pm-update", actor: ACTORS.IMPLEMENTER },
  { verb: "start", stage: "commit", actor: ACTORS.IMPLEMENTER },
  { verb: "complete", stage: "commit", actor: ACTORS.IMPLEMENTER },
];

/** The statuses a story passes through as its chain runs, each once and in this order. */
export const DERIVED_STATUS_SEQUENCE = ["backlog", "inProgress", "done"] as const;

/** The last two Required stages run past an untouched Recommended one. */
export const PAST_RECOMMENDED_SCRIPT: ChainScriptStep[] = [
  { verb: "start", stage: "pm-update", actor: ACTORS.IMPLEMENTER },
  { verb: "complete", stage: "pm-update", actor: ACTORS.IMPLEMENTER },
  { verb: "start", stage: "commit", actor: ACTORS.IMPLEMENTER },
  { verb: "complete", stage: "commit", actor: ACTORS.IMPLEMENTER },
];

/**
 * Three stages closed and a fourth under way, reached through the verbs alone,
 * so every state the reopen suite starts from is one the guards allowed.
 */
export const REOPEN_PRECONDITION_SCRIPT: ChainScriptStep[] = [
  { verb: "start", stage: "sprint-build", actor: ACTORS.IMPLEMENTER },
  { verb: "complete", stage: "sprint-build", actor: ACTORS.IMPLEMENTER },
  { verb: "start", stage: "code-quality", actor: ACTORS.IMPLEMENTER },
  { verb: "complete", stage: "code-quality", actor: ACTORS.IMPLEMENTER },
  { verb: "start", stage: "test-quality", actor: ACTORS.IMPLEMENTER },
  { verb: "complete", stage: "test-quality", actor: ACTORS.IMPLEMENTER },
  { verb: "start", stage: "functional-test", actor: ACTORS.IMPLEMENTER },
];
