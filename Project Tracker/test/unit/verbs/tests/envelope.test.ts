import cds from "@sap/cds";

import { Envelope } from "../../../../mcp/verbs/shared/envelope.js";
import { VerbError } from "../../../../mcp/verbs/shared/verbError.js";
import {
  CAP_REJECTION,
  CAP_REJECTION_BY_KEY,
  CAP_REJECTION_WITH_ARGS,
  ENVELOPE_DETAIL,
  ENVELOPE_KEYS,
  SOCKET_ERROR_CODE,
  VALID_CODE_LISTS,
} from "../data/verbFixtures.js";

const STAMP = "2026-08-16T10:00:00.000Z";

describe("the response envelope", () => {
  /** A key with no entry must still return something addressable, or a message becomes empty text. */
  it("falls back to the key when no message is defined for it", () => {
    expect(Envelope.resolveMessage(ENVELOPE_KEYS.KNOWN)).not.toBe(ENVELOPE_KEYS.KNOWN);
    expect(Envelope.resolveMessage(ENVELOPE_KEYS.UNKNOWN)).toBe(ENVELOPE_KEYS.UNKNOWN);
  });

  /** A success with nothing to add still carries the two fields every caller reads. */
  it("defaults the next action and the warnings on a bare success", () => {
    const result = Envelope.buildSuccess(STAMP, null);

    expect(result.ok).toBe(true);
    expect(result.timestamp).toBe(STAMP);
    expect(result.nextAction).toBeNull();
    expect(result.warnings).toEqual([]);
  });

  /** Optional detail must be absent rather than null, or a caller cannot tell "no remediation" from "none applies". */
  it("carries only the detail a rejection actually supplied", () => {
    const bare = Envelope.toFailure(
      new VerbError(400, ENVELOPE_KEYS.KNOWN, "no identity"),
      STAMP,
    );
    const detailed = Envelope.toFailure(
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
    const result = Envelope.toFailure(
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
    const byKey = Envelope.toFailure(
      Object.assign(new Error(CAP_REJECTION_BY_KEY.message), {
        ...CAP_REJECTION_BY_KEY,
      }),
      STAMP,
    );

    expect(byKey.status).toBe(CAP_REJECTION_BY_KEY.statusCode);
    expect(byKey.code).toBe(CAP_REJECTION_BY_KEY.code);
    expect(byKey.message).toContain("already exists");
  });

  /** Resolving the key without the handler's arguments handed the caller a raw "{0}". */
  it("substitutes a handler rejection's arguments into its message", () => {
    const result = Envelope.toFailure(
      Object.assign(new Error(CAP_REJECTION_WITH_ARGS.message), {
        ...CAP_REJECTION_WITH_ARGS,
      }),
      STAMP,
    );

    expect(result.status).toBe(CAP_REJECTION_WITH_ARGS.code);
    expect(result.code).toBe(CAP_REJECTION_WITH_ARGS.message);
    expect(result.message).toContain(`"${CAP_REJECTION_WITH_ARGS.args[0]}"`);
    expect(result.message).not.toContain("{0}");
  });

  /** Reported as a lost store, a fault in this layer sent the caller chasing an outage that was not happening. */
  it("reports an unexpected throw as a fault in the verb layer", () => {
    const fromError = Envelope.toFailure(new Error("x is not a function"), STAMP);
    const fromValue = Envelope.toFailure("x is not a function", STAMP);

    expect(fromError.status).toBe(500);
    expect(fromError.code).toBe("verb.internal.failure");
    expect(fromError).not.toHaveProperty("retryable");
    expect(fromValue.status).toBe(500);
  });

  /** The thrown text is the one path a stack, a file path or a SQL fragment reaches the model. */
  it("keeps the thrown detail out of what the caller reads", () => {
    const leaky = Envelope.toFailure(new Error("SELECT * FROM Activity -- C:/secret"), STAMP);

    expect(leaky.message).not.toContain("SELECT");
    expect(leaky.message).not.toContain("C:/secret");
  });

  /** The envelope drops the cause on purpose, so without the log a 500 is undiagnosable. */
  it("logs the cause of an internal failure where the caller cannot read it", () => {
    const channel = cds.log("verbs");
    const logged = jest.spyOn(channel, "error").mockImplementation(() => undefined);

    Envelope.toFailure(new Error("x is not a function"), STAMP);
    Envelope.toFailure(new VerbError(400, ENVELOPE_KEYS.KNOWN, "no identity"), STAMP);

    expect(logged).toHaveBeenCalledTimes(1);
    expect(logged).toHaveBeenCalledWith(
      "verb.internal.failure",
      expect.stringContaining("x is not a function"),
    );
    logged.mockRestore();
  });

  /** The retry flag exists for exactly one case: an error the sockets or the driver marked as connection loss. */
  it("marks only a recognisable connection error as retryable", () => {
    const socket = Envelope.toFailure(
      Object.assign(new Error("connect refused"), { code: SOCKET_ERROR_CODE }),
      STAMP,
    );
    const typeError = Envelope.toFailure(new TypeError("x is not a function"), STAMP);

    expect(socket.retryable).toBe(true);
    expect(socket.code).toBe("verb.connection.unavailable");
    expect(typeError).not.toHaveProperty("retryable");
  });

  /** A blank list reads as a template fault, and an uncapped one lets a growing register flood the message. */
  it("renders valid codes as words when empty, joined when short, and counted past the cap", () => {
    const long = Envelope.formatValidCodes(VALID_CODE_LISTS.LONG);

    expect(Envelope.formatValidCodes([])).toBe("none");
    expect(Envelope.formatValidCodes(VALID_CODE_LISTS.SHORT)).toBe(
      VALID_CODE_LISTS.SHORT.join(", "),
    );
    expect(long).toContain("STORY-19");
    expect(long).not.toContain("STORY-20");
    expect(long).toContain("and 5 more");
  });

  /** A rejection has to throw rather than return, or a verb body would carry on past its own guard. */
  it("throws the rejection it builds", () => {
    expect(() => Envelope.rejectVerb(400, ENVELOPE_KEYS.KNOWN)).toThrow(VerbError);
  });
});
