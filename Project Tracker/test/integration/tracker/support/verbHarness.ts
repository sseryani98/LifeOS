import type cds from "@sap/cds";

import type {
  VerbContext,
  VerbFailure,
  VerbResult,
  VerbSuccess,
} from "../../../../mcp/verbs/shared/types.js";

/**
 * Builds the context a verb runs under. The verbs run directly over a connected
 * service, so the tier reaches the real handlers with no transport, no port and
 * no client.
 * @param service The connected service.
 * @param actor The identity the call declares.
 * @returns The verb context.
 */
export const buildVerbContext = (
  service: cds.Service,
  actor: string,
): VerbContext => {
  return { service, actor };
};

/**
 * Narrows a result to the success envelope, failing loudly with the rejection's
 * own message when it is not one.
 * @param result The verb result.
 * @returns The success envelope.
 */
export const expectSuccess = (result: VerbResult): VerbSuccess => {
  if (!result.ok) {
    throw new Error(`Expected success, got ${result.code}: ${result.message}`);
  }
  return result;
};

/**
 * Reads the workflow step codes a start_stage success handed back, in the order
 * it listed them. Missing is read as empty, so the assertion states the list.
 * @param result The success envelope.
 * @returns The step codes it carried.
 */
export const subtaskCodesOf = (result: VerbSuccess): string[] => {
  const subtasks = (result.subtasks ?? []) as { step_code: string }[];
  return subtasks.map(subtask => subtask.step_code);
};

/**
 * Lists which of the given fragments a text contains, in the order they first
 * appear in it. A fragment the text lacks is dropped, so comparing the answer
 * to the input checks presence and order at once.
 * @param text The text searched, such as a remediation.
 * @param fragments The fragments to look for.
 * @returns The fragments found, earliest first.
 */
export const orderOfAppearance = (
  text: string | undefined,
  fragments: readonly string[],
): string[] => {
  const source = text ?? "";
  return fragments
    .filter(fragment => source.includes(fragment))
    .sort((left, right) => source.indexOf(left) - source.indexOf(right));
};

/**
 * Narrows a result to the failure envelope.
 * @param result The verb result.
 * @returns The failure envelope.
 */
export const expectFailure = (result: VerbResult): VerbFailure => {
  if (result.ok) throw new Error("Expected a rejection, got a success");
  return result;
};
