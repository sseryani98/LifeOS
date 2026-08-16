import {
  rejectVerb,
  resolveMessage,
  succeed,
  toFailure,
} from "../../../../mcp/verbs/shared/envelope.js";
import { VerbError } from "../../../../mcp/verbs/shared/verbError.js";
import { ENVELOPE_DETAIL, ENVELOPE_KEYS } from "../data/verbFixtures.js";

const STAMP = "2026-08-16T10:00:00.000Z";

describe("the response envelope", () => {
  /** A key with no entry must still return something addressable, or a message becomes empty text. */
  it("falls back to the key when no message is defined for it", () => {
    expect(resolveMessage(ENVELOPE_KEYS.KNOWN)).not.toBe(ENVELOPE_KEYS.KNOWN);
    expect(resolveMessage(ENVELOPE_KEYS.UNKNOWN)).toBe(ENVELOPE_KEYS.UNKNOWN);
  });

  /** A success with nothing to add still carries the two fields every caller reads. */
  it("defaults the next action and the warnings on a bare success", () => {
    const result = succeed(STAMP, null);

    expect(result.ok).toBe(true);
    expect(result.timestamp).toBe(STAMP);
    expect(result.nextAction).toBeNull();
    expect(result.warnings).toEqual([]);
  });

  /** Optional detail must be absent rather than null, or a caller cannot tell "no remediation" from "none applies". */
  it("carries only the detail a rejection actually supplied", () => {
    const bare = toFailure(
      new VerbError(400, ENVELOPE_KEYS.KNOWN, "no identity"),
      STAMP,
    );
    const detailed = toFailure(
      new VerbError(409, ENVELOPE_KEYS.BLOCKED, "blocked", ENVELOPE_DETAIL),
      STAMP,
    );

    expect(bare).not.toHaveProperty("target");
    expect(bare).not.toHaveProperty("remediation");
    expect(bare).not.toHaveProperty("rule");
    expect(detailed.target).toBe(ENVELOPE_DETAIL.target);
    expect(detailed.remediation).toBe(ENVELOPE_DETAIL.remediation);
    expect(detailed.rule).toBe(ENVELOPE_DETAIL.rule);
  });

  /** Anything thrown that is not a deliberate rejection is a lost store, which is the one thing a caller can retry. */
  it("reports an unexpected throw as a connection failure", () => {
    const fromError = toFailure(new Error("socket closed"), STAMP);
    const fromValue = toFailure("socket closed", STAMP);

    expect(fromError.status).toBe(503);
    expect(fromError.code).toBe("verb.connection.unavailable");
    expect(fromError.message).toContain("socket closed");
    expect(fromValue.message).toContain("socket closed");
  });

  /** A rejection has to throw rather than return, or a verb body would carry on past its own guard. */
  it("throws the rejection it builds", () => {
    expect(() => rejectVerb(400, ENVELOPE_KEYS.KNOWN)).toThrow(VerbError);
  });
});
