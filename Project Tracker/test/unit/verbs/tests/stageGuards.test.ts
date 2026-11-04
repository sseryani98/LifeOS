import { StageGuards } from "../../../../mcp/verbs/shared/stageGuards.js";
import { TrackerGateway } from "../../../../mcp/verbs/shared/trackerGateway.js";
import { VerbError } from "../../../../mcp/verbs/shared/verbError.js";
import {
  ACTOR_FIXTURE,
  CHAIN_FIXTURE,
  FINISHED_CHAIN,
  FIXTURE_STORY_ID,
  GUARD_KEYS,
  OPEN_BUILD_STEPS,
  SUBTASK_FIXTURE,
} from "../data/verbFixtures.js";
import { buildRecordingRunner } from "../support/fakeRunner.js";

const BUILD = CHAIN_FIXTURE[0];
const HUMAN_REVIEW = CHAIN_FIXTURE[1];
const COMMIT = CHAIN_FIXTURE[3];

describe("stage guards", () => {
  /** A call with no declared caller writes rows nobody owns. */
  it("refuses a caller that declares nothing and trims one that does", () => {
    expect(StageGuards.assertCallerIdentity(" implementer ")).toBe("implementer");
    expect(() => StageGuards.assertCallerIdentity("   ")).toThrow(VerbError);
  });

  /** An unseeded caller otherwise trips the activity foreign key as an unnamed fault, and only where the database enforces it. */
  it("refuses an identity the actor list does not carry, naming the variable and the valid codes", async () => {
    const gateway = new TrackerGateway(
      buildRecordingRunner([ACTOR_FIXTURE.ROWS, ACTOR_FIXTURE.ROWS]),
    );
    let raised: VerbError | null = null;

    await expect(
      StageGuards.assertKnownActor(gateway, ACTOR_FIXTURE.KNOWN),
    ).resolves.toBeUndefined();
    try {
      await StageGuards.assertKnownActor(gateway, ACTOR_FIXTURE.UNSEEDED);
    } catch (error: unknown) {
      raised = error as VerbError;
    }

    expect(raised?.status).toBe(400);
    expect(raised?.code).toBe("verb.identity.unknown");
    expect(raised?.message).toContain("PROJECT_TRACKER_ACTOR");
    expect(raised?.message).toContain("implementer, sandro");
  });

  /** No kind is not a human kind, or any name the list lacks could close a human-only stage. */
  it("refuses a human-only completion by a caller with no seeded kind", async () => {
    const gateway = new TrackerGateway(buildRecordingRunner([[]]));

    await expect(
      StageGuards.assertHumanCaller(gateway, ACTOR_FIXTURE.UNSEEDED, HUMAN_REVIEW),
    ).rejects.toMatchObject({ code: "wfl.stage.humanOnly" });
  });

  /** Recommended steps never block, or a skippable stage strands everything after it. */
  it("names every blocking predecessor and no recommended one", () => {
    let raised: VerbError | null = null;
    try {
      StageGuards.assertStageNotBlocked(CHAIN_FIXTURE, COMMIT);
    } catch (error: unknown) {
      raised = error as VerbError;
    }

    expect(raised?.rule).toBe("wfl.stage.predecessorOpen");
    expect(raised?.remediation).toContain("human-review");
    expect(raised?.remediation).not.toContain("documentation");
    expect(() => StageGuards.assertStageNotBlocked(CHAIN_FIXTURE, HUMAN_REVIEW)).not.toThrow();
  });

  /** An agent skipping several build steps must be told every one, in order, and the shared command once. */
  it("names every open earlier step in order and a shared driver once", () => {
    const gate = OPEN_BUILD_STEPS[3];
    let raised: VerbError | null = null;
    try {
      StageGuards.assertSubtaskNotBlocked(OPEN_BUILD_STEPS, gate);
    } catch (error: unknown) {
      raised = error as VerbError;
    }

    expect(raised?.code).toBe("wfl.subtask.predecessorOpen");
    expect(raised?.target).toBe("gate");
    expect(raised?.remediation).toContain("brief, red, implement");
    expect((raised?.remediation ?? "").split("/build").length - 1).toBe(1);
  });

  /** The rejection must name the key and the reopen route, or the caller retries blind against a closed stage. */
  it("refuses a transition on a stage that is already complete", () => {
    let raised: VerbError | null = null;
    try {
      StageGuards.assertStageNotComplete(BUILD);
    } catch (error: unknown) {
      raised = error as VerbError;
    }

    expect(raised?.code).toBe(GUARD_KEYS.ALREADY_COMPLETE);
    expect(raised?.target).toBe(BUILD.step_code);
    expect(raised?.remediation).toContain("reopen_stage");
    expect(() => StageGuards.assertStageNotComplete(COMMIT)).not.toThrow();
  });

  /** Completing a stage nobody started would invent a start time, and the rejection must say to start it. */
  it("refuses a completion on a stage that never started", () => {
    let raised: VerbError | null = null;
    try {
      StageGuards.assertStageStarted(COMMIT);
    } catch (error: unknown) {
      raised = error as VerbError;
    }

    expect(raised?.code).toBe(GUARD_KEYS.NOT_STARTED);
    expect(raised?.target).toBe(COMMIT.step_code);
    expect(raised?.remediation).toContain("start_stage");
    expect(() => StageGuards.assertStageStarted(BUILD)).not.toThrow();
  });

  /** An open step warns and never blocks, and only a materialised one can be named. */
  it("warns once per open step and stays silent when all are closed", () => {
    const warnings = StageGuards.buildOpenSubtaskWarnings(SUBTASK_FIXTURE);

    expect(warnings).toHaveLength(1);
    expect(warnings[0].target).toBe("handoff");
    expect(StageGuards.buildOpenSubtaskWarnings([])).toEqual([]);
  });

  /** An unknown code must list what is addressable, or the caller guesses at the next call. */
  it("lists the addressable codes when a stage or a step does not resolve", () => {
    expect(StageGuards.resolveStage(CHAIN_FIXTURE, "commit")).toBe(COMMIT);
    expect(() => StageGuards.resolveStage(CHAIN_FIXTURE, "nope")).toThrow(VerbError);
    expect(StageGuards.resolveSubtask(SUBTASK_FIXTURE, "handoff").ID).toBe("sub-handoff");
    expect(() => StageGuards.resolveSubtask(SUBTASK_FIXTURE, "smoke")).toThrow(VerbError);
  });

  /** A blank list read "Valid codes: ." — a template fault, not the fact that nothing is addressable. */
  it("says none when the stage or the chain has nothing to address", () => {
    expect(() => StageGuards.resolveSubtask([], "gate")).toThrow(/Valid codes: none\./);
    expect(() => StageGuards.resolveStage([], "commit")).toThrow(/Valid codes: none\./);
  });

  /** The next action is the first incomplete stage regardless of kind, and null once none remains. */
  it("resolves the next action in position order, and null on a finished chain", () => {
    const next = StageGuards.resolveNextAction(CHAIN_FIXTURE, FIXTURE_STORY_ID);

    expect(next?.stepCode).toBe("human-review");
    expect(next?.driver).toBe("/human-review-loop");
    expect(next?.storyId).toBe(FIXTURE_STORY_ID);
    expect(StageGuards.resolveNextAction(FINISHED_CHAIN, FIXTURE_STORY_ID)).toBeNull();
  });
});
