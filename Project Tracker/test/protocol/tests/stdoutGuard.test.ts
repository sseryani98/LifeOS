import { READY_LOG, SPAWN_TIMEOUT_MS } from "../data/toolSurface.js";
import {
  captureServerStreams,
  type CapturedStreams,
} from "../support/mcpHarness.js";

describe("the stdout guard", () => {
  let streams: CapturedStreams;

  beforeAll(async () => {
    streams = await captureServerStreams();
  }, SPAWN_TIMEOUT_MS + 5_000);

  /** A log line inside the frame stream is reported and then survived, so nothing but this reads it. */
  it("writes nothing but parseable JSON-RPC frames to stdout", () => {
    const lines = streams.stdout.split("\n").filter(line => line.trim());

    expect(lines.length).toBeGreaterThan(0);
    for (const line of lines) {
      const frame = JSON.parse(line) as { jsonrpc?: string };
      expect(frame.jsonrpc).toBe("2.0");
    }
  });

  /** The runtime's own logging has to land somewhere, and stderr is the only stream free to carry it. */
  it("sends the runtime's log line to stderr instead", () => {
    expect(streams.stderr).toContain(READY_LOG);
    expect(streams.stdout).not.toContain(READY_LOG);
  });
});
