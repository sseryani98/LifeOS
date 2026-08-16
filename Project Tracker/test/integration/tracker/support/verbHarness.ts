import type cds from "@sap/cds";

import type {
  VerbContext,
  VerbFailure,
  VerbResult,
  VerbSuccess,
} from "../../../../mcp/verbs/shared/types.js";

/**
 * Builds the context a verb runs under. The verbs are plain functions over a
 * connected service, so the tier reaches the real handlers with no transport,
 * no port and no client.
 * @param service The connected service.
 * @param actor The identity the call declares.
 * @returns The verb context.
 */
export function buildVerbContext(
  service: cds.Service,
  actor: string,
): VerbContext {
  return { service, actor };
}

/**
 * Narrows a result to the success envelope, failing loudly with the rejection's
 * own message when it is not one.
 * @param result The verb result.
 * @returns The success envelope.
 */
export function expectSuccess(result: VerbResult): VerbSuccess {
  if (!result.ok) {
    throw new Error(`Expected success, got ${result.code}: ${result.message}`);
  }
  return result;
}

/**
 * Narrows a result to the failure envelope.
 * @param result The verb result.
 * @returns The failure envelope.
 */
export function expectFailure(result: VerbResult): VerbFailure {
  if (result.ok) throw new Error("Expected a rejection, got a success");
  return result;
}
