import { TrackerMcpServer } from "../../../../mcp/server.js";
import {
  BOOT_ENVIRONMENTS,
  EXPECTED_BOOT,
  LOADED_MODEL,
} from "../data/bootEnvironments.js";
import { buildRecordingRuntime } from "../support/recordingRuntime.js";

describe("the verb server's boot sequence", () => {
  /** The gate runs in-memory, where deploy connected db by accident; on Postgres nothing did, and every verb answered 500. */
  it("connects the database with the model set before serving on Postgres", async () => {
    const { runtime, calls } = buildRecordingRuntime(
      BOOT_ENVIRONMENTS.POSTGRES,
      LOADED_MODEL,
    );

    await TrackerMcpServer.startRuntime(runtime);

    expect(calls).toEqual(EXPECTED_BOOT.POSTGRES);
    expect(runtime.model).toBe(LOADED_MODEL);
  });

  /** The in-memory store is empty at boot, so its schema has to land after db connects and before a service can read it. */
  it("deploys an in-memory database between connecting and serving", async () => {
    const { runtime, calls } = buildRecordingRuntime(
      BOOT_ENVIRONMENTS.IN_MEMORY,
      LOADED_MODEL,
    );

    await TrackerMcpServer.startRuntime(runtime);

    expect(calls).toEqual(EXPECTED_BOOT.IN_MEMORY);
  });
});
