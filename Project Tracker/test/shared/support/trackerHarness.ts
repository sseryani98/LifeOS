import { join } from "node:path";

import cds from "@sap/cds";

/** The module root cds.test boots from. */
const PROJECT_ROOT = join(__dirname, "..", "..", "..");

/**
 * Boots the CAP server in-process for the importing suite. Importing this
 * module registers the runner hooks, so every suite that needs the service just
 * imports the helpers below.
 */
export const trackerServer = cds.test(PROJECT_ROOT);

/**
 * Connects to the one service the module serves.
 * @returns The connected service.
 */
export async function connectTrackerService(): Promise<cds.Service> {
  return cds.connect.to("TrackerService");
}

/**
 * Reports whether the harness lever that lets CAP load a TypeScript service
 * implementation is set. Reading it through a helper keeps the assertion in the
 * spec about the lever rather than about an environment variable.
 * @returns The value the runner set, or undefined when nothing set it.
 */
export function readTypescriptLever(): string | undefined {
  return process.env.CDS_TYPESCRIPT;
}
