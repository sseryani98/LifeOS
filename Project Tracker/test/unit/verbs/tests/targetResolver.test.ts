import { TargetResolver } from "../../../../mcp/verbs/shared/targetResolver.js";
import { VerbError } from "../../../../mcp/verbs/shared/verbError.js";
import {
  CHAIN_FIXTURE,
  FINISHED_CHAIN,
  FIXTURE_STORY_ID,
  SUBTASK_FIXTURE,
} from "../data/verbFixtures.js";

const COMMIT = CHAIN_FIXTURE[3];

describe("target resolver", () => {
  /** An unknown code must list what is addressable, or the caller guesses at the next call. */
  it("lists the addressable codes when a stage or a step does not resolve", () => {
    expect(TargetResolver.resolveStage(CHAIN_FIXTURE, "commit")).toBe(COMMIT);
    expect(() => TargetResolver.resolveStage(CHAIN_FIXTURE, "nope")).toThrow(
      VerbError,
    );
    expect(TargetResolver.resolveSubtask(SUBTASK_FIXTURE, "handoff").ID).toBe(
      "sub-handoff",
    );
    expect(() =>
      TargetResolver.resolveSubtask(SUBTASK_FIXTURE, "smoke"),
    ).toThrow(VerbError);
  });

  /** A blank list read "Valid codes: ." — a template fault, not the fact that nothing is addressable. */
  it("says none when the stage or the chain has nothing to address", () => {
    expect(() => TargetResolver.resolveSubtask([], "gate")).toThrow(
      /Valid codes: none\./,
    );
    expect(() => TargetResolver.resolveStage([], "commit")).toThrow(
      /Valid codes: none\./,
    );
  });

  /** The next action is the first incomplete stage regardless of kind, and null once none remains. */
  it("resolves the next action in position order, and null on a finished chain", () => {
    const next = TargetResolver.resolveNextAction(
      CHAIN_FIXTURE,
      FIXTURE_STORY_ID,
    );

    expect(next?.stepCode).toBe("human-review");
    expect(next?.driver).toBe("/human-review-loop");
    expect(next?.storyId).toBe(FIXTURE_STORY_ID);
    expect(
      TargetResolver.resolveNextAction(FINISHED_CHAIN, FIXTURE_STORY_ID),
    ).toBeNull();
  });
});
