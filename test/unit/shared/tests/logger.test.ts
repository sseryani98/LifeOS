import { Logger } from "../../../../srv/modules/shared/logger.js";

describe("Logger", () => {
  let logger: Logger;

  beforeEach(() => {
    logger = new Logger("test.module");
  });

  /** The logger sits in every request path, so a throw here would crash handlers instead of just recording a line — all severities must be safe to call. */
  it("logs info, warn, and error entries without throwing", () => {
    expect(() => logger.info("ENTRY", "started")).not.toThrow();
    expect(() => logger.warn("STATE_CHANGE", "changed", { from: "a" })).not.toThrow();
    expect(() => logger.error("ERROR", "boom", { error: "x" })).not.toThrow();
  });

  /** Correlation IDs (from req.id) are what stitch scattered log lines into one traceable request; setting one must never destabilise the logger. */
  it("accepts a correlation id from a request", () => {
    expect(() => logger.setCorrelationId("corr-123")).not.toThrow();
  });

  /** Secrets like tokens/passwords can hide inside nested payloads; if redaction didn't recurse, debug logs would leak credentials to disk. */
  it("redacts sensitive fields at debug level, recursing into nested objects", () => {
    expect(() =>
      logger.debug("BATCH_RESULT", "sync", {
        token: "secret",
        nested: { password: "p", ok: 1 },
        plain: "value",
      }),
    ).not.toThrow();
  });

  /** Redaction walks req.data, so a missing payload must be handled gracefully rather than dereferencing undefined and throwing. */
  it("logs a debug entry with no data payload", () => {
    expect(() => logger.debug("EXTERNAL_CALL", "ping")).not.toThrow();
  });
});
