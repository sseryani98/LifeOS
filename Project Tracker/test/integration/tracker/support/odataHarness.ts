import { trackerServer } from "../../../shared/support/trackerHarness.js";

/** What a rejected OData write hands back to an assertion. */
export interface RejectedWrite {
  status: number;
  code: string;
  message: string;
}

/**
 * Awaits a write expecting the service to refuse it, and unwraps the rejection
 * so the spec asserts on a status and a key rather than on an axios error.
 * @param path The service path the write went to, for the failure message.
 * @param write The pending write.
 * @returns The status and the key the service refused under.
 */
async function _expectRejection(
  path: string,
  write: Promise<unknown>,
): Promise<RejectedWrite> {
  try {
    await write;
  } catch (error: unknown) {
    const response = (
      error as {
        response?: {
          status: number;
          data?: { error?: { code?: string; message?: string } };
        };
      }
    ).response;
    return {
      status: response?.status ?? 0,
      code: response?.data?.error?.code ?? "",
      message: response?.data?.error?.message ?? "",
    };
  }
  throw new Error(`Expected ${path} to refuse the write`);
}

/**
 * Posts a payload expecting the service to refuse it.
 * @param path The service path to post to.
 * @param payload The body to post.
 * @returns The status and the key the service refused under.
 */
export async function postExpectingRejection(
  path: string,
  payload: Record<string, unknown>,
): Promise<RejectedWrite> {
  return _expectRejection(path, trackerServer.POST(path, payload));
}

/**
 * Patches a row expecting the service to refuse it.
 * @param path The service path of the row to patch.
 * @param payload The fields to patch.
 * @returns The status and the key the service refused under.
 */
export async function patchExpectingRejection(
  path: string,
  payload: Record<string, unknown>,
): Promise<RejectedWrite> {
  return _expectRejection(path, trackerServer.PATCH(path, payload));
}

/**
 * Patches a row expecting it to be accepted.
 * @param path The service path of the row to patch.
 * @param payload The fields to patch.
 * @returns The updated row.
 */
export async function patchExpectingSuccess(
  path: string,
  payload: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const response = await trackerServer.PATCH(path, payload);
  return response.data as Record<string, unknown>;
}

/**
 * Posts a payload expecting it to be accepted.
 * @param path The service path to post to.
 * @param payload The body to post.
 * @returns The created row.
 */
export async function postExpectingSuccess(
  path: string,
  payload: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const response = await trackerServer.POST(path, payload);
  return response.data as Record<string, unknown>;
}

/**
 * Reads a service path.
 * @param path The service path to read, query string included.
 * @returns The rows the service returned.
 */
export async function readCollection(
  path: string,
): Promise<Record<string, unknown>[]> {
  const response = await trackerServer.GET(path);
  return (response.data as { value: Record<string, unknown>[] }).value;
}
