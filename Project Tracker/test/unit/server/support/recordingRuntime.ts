import type { CdsRuntime } from "../../../../mcp/types.js";

/** A CAP runtime double, and the boot calls it saw in order. */
export interface RecordingRuntime {
  runtime: CdsRuntime;
  calls: string[];
}

/**
 * Builds a runtime that records each boot call it receives. A connect is tagged
 * with whether `cds.model` was set at that moment, because a db service reads
 * the model when it connects and never again.
 * @param env The `cds.env` the boot path reads its database binding from.
 * @param loadedModel What `cds.load` answers with.
 * @returns The runtime and its call log.
 */
export const buildRecordingRuntime = (
  env: unknown,
  loadedModel: unknown,
): RecordingRuntime => {
  const calls: string[] = [];
  const fake = {
    env,
    model: undefined as unknown,
    load: () => {
      calls.push("load");
      return Promise.resolve(loadedModel);
    },
    compile: { for: { nodejs: (csn: unknown) => csn } },
    connect: {
      to: (name: string) => {
        calls.push(`connect:${name}:${fake.model ? "withModel" : "noModel"}`);
        return Promise.resolve({});
      },
    },
    deploy: () => {
      calls.push("deploy");
      return Promise.resolve();
    },
    serve: (services: string) => ({
      from: () => {
        calls.push(`serve:${services}`);
        return Promise.resolve({});
      },
    }),
  };
  return { runtime: fake as unknown as CdsRuntime, calls };
};
