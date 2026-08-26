import { MessagingUtility } from "../../../srv/modules/shared/messagingUtility.js";

import { CONNECTION, HTTP, VERB_KEYS } from "./constants.js";
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
 * Builds the failure envelope from whatever was thrown. A rejection raised by
 * a verb keeps its status and key; a rejection a CAP handler raised keeps its
 * own status, code and message — it is a methodology answer, never retried;
 * anything else is reported as a lost connection, and carries the retryable
 * flag only when the error is recognisably one.
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
  const rejection = _asCapRejection(error);
  if (rejection) {
    return { ok: false, timestamp, ...rejection };
  }
  const detail = error instanceof Error ? error.message : String(error);
  return {
    ok: false,
    timestamp,
    status: HTTP.SERVICE_UNAVAILABLE,
    code: VERB_KEYS.CONNECTION_UNAVAILABLE,
    message: `${resolveMessage(VERB_KEYS.CONNECTION_UNAVAILABLE)} ${detail}`,
    ...(_isConnectionError(error) ? { retryable: true } : {}),
  };
}

/**
 * Reads a CAP handler rejection off a thrown value. Measured on the pinned
 * runtime: `req.reject(409, key)` reaches here as `code: 409` — the number —
 * with the key as the message, so the status is whichever of the three fields
 * carries an HTTP number. A driver's SQLSTATE (`"23505"`) is a string and is
 * deliberately not one, or a constraint violation would read as a status.
 * @param error The thrown value.
 * @returns The rejection's envelope fields, or undefined when it is not one.
 */
function _asCapRejection(
  error: unknown,
): { status: number; code: string; message: string } | undefined {
  if (error === null || typeof error !== "object") return undefined;
  const candidate = error as {
    status?: unknown;
    statusCode?: unknown;
    code?: unknown;
    message?: unknown;
  };
  const status = [candidate.status, candidate.statusCode, candidate.code].find(
    value =>
      typeof value === "number" &&
      value >= HTTP.BAD_REQUEST &&
      value <= HTTP.SERVER_ERROR_CEILING,
  ) as number | undefined;
  if (status === undefined) return undefined;
  // A string `code` is the key; with a numeric one the key rode in as the message.
  const code =
    typeof candidate.code === "string"
      ? candidate.code
      : typeof candidate.message === "string"
        ? candidate.message
        : String(status);
  const message =
    typeof candidate.message === "string" && candidate.message !== code
      ? candidate.message
      : resolveMessage(code);
  return { status, code, message };
}

/**
 * Reports whether a thrown value is a genuine transport fault, by the error
 * code Node's sockets and the Postgres driver put on one.
 * @param error The thrown value.
 * @returns True when the code names a connection failure.
 */
function _isConnectionError(error: unknown): boolean {
  if (error === null || typeof error !== "object") return false;
  const code = (error as { code?: unknown }).code;
  return (
    typeof code === "string" &&
    (CONNECTION.ERROR_CODES as readonly string[]).includes(code)
  );
}
