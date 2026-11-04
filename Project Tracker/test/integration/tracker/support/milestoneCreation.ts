import { createMilestoneThroughService } from "../../../shared/support/seedWorld.js";

/** What a refused service-level create hands back to an assertion. */
export interface RefusedCreate {
  status: number;
  key: string;
}

/**
 * Creates a story through the service expecting the create-handler to refuse
 * it. Measured on the pinned runtime, a handler's `req.reject(409, key)`
 * arrives here as a numeric `code` carrying the status and the key as message.
 * @param row The story columns to send.
 * @returns The status and key the create was refused under.
 */
export const createMilestoneExpectingRejection = async (
  row: Record<string, unknown>,
): Promise<RefusedCreate> => {
  try {
    await createMilestoneThroughService(row);
  } catch (error: unknown) {
    const thrown = error as { code?: unknown; status?: unknown; message?: string };
    const status =
      typeof thrown.code === "number" ? thrown.code : Number(thrown.status ?? 0);
    return { status, key: thrown.message ?? "" };
  }
  throw new Error("Expected the story create to be refused");
};
