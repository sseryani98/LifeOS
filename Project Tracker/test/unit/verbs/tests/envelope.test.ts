import {
  rejectVerb,
  resolveMessage,
  succeed,
  toFailure,
} from "../../../../mcp/verbs/shared/envelope.js";
import { VerbError } from "../../../../mcp/verbs/shared/verbError.js";
import {
  CAP_REJECTION,
  CAP_REJECTION_BY_KEY,
  ENVELOPE_DETAIL,
  ENVELOPE_KEYS,
  SOCKET_ERROR_CODE,
} from "../data/verbFixtures.js";

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

  /** A CAP rejection is a methodology answer: its status and key must reach the caller intact. */
  it("surfaces a CAP handler rejection under its own status and code", () => {
    const result = toFailure(
      Object.assign(new Error(CAP_REJECTION.message), CAP_REJECTION),
      STAMP,
    );

    expect(result.status).toBe(CAP_REJECTION.status);
    expect(result.code).toBe(CAP_REJECTION.code);
    expect(result.message).toBe(CAP_REJECTION.message);
    expect(result).not.toHaveProperty("retryable");
  });

  /** req.reject leaves the status on statusCode and the key as the message; missing either fallback reports a 409 as a lost store or hands back a raw key. */
  it("reads a rejection that carries statusCode and no resolved message", () => {
    const byKey = toFailure(
      Object.assign(new Error(CAP_REJECTION_BY_KEY.message), {
        ...CAP_REJECTION_BY_KEY,
      }),
      STAMP,
    );

    expect(byKey.status).toBe(CAP_REJECTION_BY_KEY.statusCode);
    expect(byKey.code).toBe(CAP_REJECTION_BY_KEY.code);
    expect(byKey.message).toContain("already exists");
  });

  /** Anything thrown that is not a deliberate rejection is a lost store, but only a genuine transport fault may be retried. */
  it("reports an unexpected throw as a connection failure", () => {
    const fromError = toFailure(new Error("socket closed"), STAMP);
    const fromValue = toFailure("socket closed", STAMP);

    expect(fromError.status).toBe(503);
    expect(fromError.code).toBe("verb.connection.unavailable");
    expect(fromError.message).toContain("socket closed");
    expect(fromError).not.toHaveProperty("retryable");
    expect(fromValue.message).toContain("socket closed");
  });

  /** The retry flag exists for exactly one case: an error the sockets or the driver marked as connection loss. */
  it("marks only a recognisable connection error as retryable", () => {
    const socket = toFailure(
      Object.assign(new Error("connect refused"), { code: SOCKET_ERROR_CODE }),
      STAMP,
    );
    const typeError = toFailure(new TypeError("x is not a function"), STAMP);

    expect(socket.retryable).toBe(true);
    expect(socket.code).toBe("verb.connection.unavailable");
    expect(typeError).not.toHaveProperty("retryable");
  });

  /** A rejection has to throw rather than return, or a verb body would carry on past its own guard. */
  it("throws the rejection it builds", () => {
    expect(() => rejectVerb(400, ENVELOPE_KEYS.KNOWN)).toThrow(VerbError);
  });
});
