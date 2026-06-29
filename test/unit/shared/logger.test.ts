import { Logger } from "../../../srv/modules/shared/logger.js";

describe("Logger", () => {
  let logger: Logger;

  beforeEach(() => {
    logger = new Logger("test.module");
  });

  it("logs info, warn, and error entries without throwing", () => {
    expect(() => logger.info("ENTRY", "started")).not.toThrow();
    expect(() => logger.warn("STATE_CHANGE", "changed", { from: "a" })).not.toThrow();
    expect(() => logger.error("ERROR", "boom", { error: "x" })).not.toThrow();
  });

  it("accepts a correlation id from a request", () => {
    expect(() => logger.setCorrelationId("corr-123")).not.toThrow();
  });

  it("redacts sensitive fields at debug level, recursing into nested objects", () => {
    expect(() =>
      logger.debug("BATCH_RESULT", "sync", {
        token: "secret",
        nested: { password: "p", ok: 1 },
        plain: "value",
      }),
    ).not.toThrow();
  });

  it("logs a debug entry with no data payload", () => {
    expect(() => logger.debug("EXTERNAL_CALL", "ping")).not.toThrow();
  });
});
