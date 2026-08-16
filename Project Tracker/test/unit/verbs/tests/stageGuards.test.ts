import {
  assertCallerIdentity,
  assertStageNotBlocked,
  assertStageNotComplete,
  assertStageStarted,
  collectOpenSubtaskWarnings,
  resolveNextAction,
  resolveStage,
  resolveSubtask,
} from "../../../../mcp/verbs/shared/stageGuards.js";
import { VerbError } from "../../../../mcp/verbs/shared/verbError.js";
import {
  CHAIN_FIXTURE,
  FINISHED_CHAIN,
  FIXTURE_STORY_ID,
  SUBTASK_FIXTURE,
} from "../data/verbFixtures.js";

const BUILD = CHAIN_FIXTURE[0];
const HUMAN_REVIEW = CHAIN_FIXTURE[1];
const COMMIT = CHAIN_FIXTURE[3];

describe("stage guards", () => {
  /** A call with no declared caller writes rows nobody owns. */
  it("refuses a caller that declares nothing and trims one that does", () => {
    expect(assertCallerIdentity(" implementer ")).toBe("implementer");
    expect(() => assertCallerIdentity("   ")).toThrow(VerbError);
  });

  /** Recommended steps never block, or a skippable stage strands everything after it. */
  it("names every blocking predecessor and no recommended one", () => {
    let raised: VerbError | null = null;
    try {
      assertStageNotBlocked(CHAIN_FIXTURE, COMMIT);
    } catch (error: unknown) {
      raised = error as VerbError;
    }

    expect(raised?.rule).toBe("wfl.stage.predecessorOpen");
    expect(raised?.remediation).toContain("human-review");
    expect(raised?.remediation).not.toContain("documentation");
    expect(() => assertStageNotBlocked(CHAIN_FIXTURE, HUMAN_REVIEW)).not.toThrow();
  });

  /** The rejection must carry the state that explains it, or the caller retries blind. */
  it("refuses a transition on a stage that is already complete", () => {
    expect(() => assertStageNotComplete(BUILD)).toThrow(VerbError);
    expect(() => assertStageNotComplete(COMMIT)).not.toThrow();
  });

  /** Completing a stage nobody started would invent a start time. */
  it("refuses a completion on a stage that never started", () => {
    expect(() => assertStageStarted(COMMIT)).toThrow(VerbError);
    expect(() => assertStageStarted(BUILD)).not.toThrow();
  });

  /** An open step warns and never blocks, and only a materialised one can be named. */
  it("warns once per open step and stays silent when all are closed", () => {
    const warnings = collectOpenSubtaskWarnings(SUBTASK_FIXTURE);

    expect(warnings).toHaveLength(1);
    expect(warnings[0].target).toBe("handoff");
    expect(collectOpenSubtaskWarnings([])).toEqual([]);
  });

  /** An unknown code must list what is addressable, or the caller guesses at the next call. */
  it("lists the addressable codes when a stage or a step does not resolve", () => {
    expect(resolveStage(CHAIN_FIXTURE, "commit")).toBe(COMMIT);
    expect(() => resolveStage(CHAIN_FIXTURE, "nope")).toThrow(VerbError);
    expect(resolveSubtask(SUBTASK_FIXTURE, "handoff").ID).toBe("sub-handoff");
    expect(() => resolveSubtask(SUBTASK_FIXTURE, "smoke")).toThrow(VerbError);
  });

  /** The next action is the first incomplete stage regardless of kind, and null once none remains. */
  it("resolves the next action in position order, and null on a finished chain", () => {
    const next = resolveNextAction(CHAIN_FIXTURE, FIXTURE_STORY_ID);

    expect(next?.stepCode).toBe("human-review");
    expect(next?.driver).toBe("/human-review-loop");
    expect(next?.storyId).toBe(FIXTURE_STORY_ID);
    expect(resolveNextAction(FINISHED_CHAIN, FIXTURE_STORY_ID)).toBeNull();
  });
});
