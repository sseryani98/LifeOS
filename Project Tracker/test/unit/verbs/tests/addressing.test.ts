import {
  buildActivityTarget,
  parseDecisionTarget,
  parseStoryReference,
} from "../../../../mcp/verbs/shared/addressing.js";
import { VerbError } from "../../../../mcp/verbs/shared/verbError.js";
import { EXPECTED, REFERENCES, TARGET_PARTS } from "../data/verbFixtures.js";

describe("addressing", () => {
  /** Both halves have to be present, or a reference resolves to whichever board answers first. */
  it("splits a qualified story reference and refuses every other shape", () => {
    expect(parseStoryReference(REFERENCES.QUALIFIED)).toEqual(
      EXPECTED.PARSED_STORY,
    );
    expect(() => parseStoryReference(REFERENCES.BARE)).toThrow(VerbError);
    expect(() => parseStoryReference(REFERENCES.EMPTY_WORKSPACE)).toThrow(
      VerbError,
    );
    expect(() => parseStoryReference(REFERENCES.EMPTY_STORY)).toThrow(VerbError);
    expect(() => parseStoryReference(REFERENCES.THREE_SEGMENTS)).toThrow(
      VerbError,
    );
  });

  /** A decision may target the workspace itself, so one segment is a legal target rather than a truncation. */
  it("reads a decision target with and without an inner name", () => {
    expect(parseDecisionTarget(REFERENCES.WORKSPACE_ONLY)).toEqual(
      EXPECTED.PARSED_WORKSPACE,
    );
    expect(parseDecisionTarget(REFERENCES.QUALIFIED)).toEqual(
      EXPECTED.PARSED_INNER,
    );
    expect(parseDecisionTarget(REFERENCES.EMPTY_STORY)).toEqual(
      EXPECTED.PARSED_WORKSPACE,
    );
    expect(() => parseDecisionTarget(REFERENCES.THREE_SEGMENTS)).toThrow(
      VerbError,
    );
  });

  /** The register's Scope column reads this string, so each depth has to render distinctly. */
  it("builds a target at each addressable depth", () => {
    expect(buildActivityTarget(TARGET_PARTS.WORKSPACE)).toBe(
      EXPECTED.TARGET_WORKSPACE,
    );
    expect(
      buildActivityTarget(TARGET_PARTS.WORKSPACE, TARGET_PARTS.STORY),
    ).toBe(EXPECTED.TARGET_STORY);
    expect(
      buildActivityTarget(
        TARGET_PARTS.WORKSPACE,
        TARGET_PARTS.STORY,
        TARGET_PARTS.STAGE,
      ),
    ).toBe(EXPECTED.TARGET_STAGE);
  });
});
