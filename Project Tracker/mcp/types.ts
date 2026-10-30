import type cds from "@sap/cds";

/** The CAP runtime, as the dynamic import hands it back. */
export type CdsRuntime = typeof cds & {
  deploy: (model: unknown, options: { silent: boolean }) => Promise<unknown>;
};

/** The slice of a runtime whose logger factory the server replaces. */
export interface LoggerHost {
  log: { Logger: unknown };
}
