import { MessagingUtility } from "../../../srv/modules/shared/messagingUtility.js";

import { VERB_KEYS } from "./constants.js";
import type {
  NextAction,
  VerbFailure,
  VerbSuccess,
  VerbWarning,
} from "./types.js";
import { VerbError } from "./verbError.js";

/**
 * Resolves a runtime message key into text.
 * @param key Runtime message key.
 * @param params Ordered placeholder values.
 * @returns The resolved message.
 */
export function resolveMessage(key: string, params?: string[]): string {
  return MessagingUtility.getText(key, params);
}

/**
 * Raises a rejection under a runtime message key.
 * @param status HTTP status the caller sees.
 * @param key Runtime message key.
 * @param params Ordered placeholder values for the message.
 * @param detail Optional target, remediation and the guard rule that fired.
 * @returns Never — it always throws.
 */
export function rejectVerb(
  status: number,
  key: string,
  params?: string[],
  detail?: { target?: string; remediation?: string; rule?: string },
): never {
  throw new VerbError(status, key, resolveMessage(key, params), detail);
}

/**
 * Builds the success envelope.
 * @param timestamp Server timestamp the call was stamped with.
 * @param nextAction The resulting next action, or null when none remains.
 * @param warnings Non-blocking conditions the caller should see.
 * @param extra Verb-specific fields, such as a created row's identifier.
 * @returns The success envelope.
 */
export function succeed(
  timestamp: string,
  nextAction: NextAction | null,
  warnings: VerbWarning[] = [],
  extra: Record<string, unknown> = {},
): VerbSuccess {
  return { ok: true, timestamp, nextAction, warnings, ...extra };
}

/**
 * Builds the failure envelope from whatever was thrown. A rejection raised by a
 * verb keeps its status and key; anything else is reported as a lost connection,
 * which is the one failure mode the caller can act on.
 * @param error The thrown value.
 * @param timestamp Server timestamp the call was stamped with.
 * @returns The failure envelope.
 */
export function toFailure(error: unknown, timestamp: string): VerbFailure {
  if (error instanceof VerbError) {
    return {
      ok: false,
      timestamp,
      status: error.status,
      code: error.code,
      message: error.message,
      ...(error.target ? { target: error.target } : {}),
      ...(error.remediation ? { remediation: error.remediation } : {}),
      ...(error.rule ? { rule: error.rule } : {}),
    };
  }
  const detail = error instanceof Error ? error.message : String(error);
  return {
    ok: false,
    timestamp,
    status: 503,
    code: VERB_KEYS.CONNECTION_UNAVAILABLE,
    message: `${resolveMessage(VERB_KEYS.CONNECTION_UNAVAILABLE)} ${detail}`,
  };
}
