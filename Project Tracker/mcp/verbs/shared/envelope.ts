import { MessagingUtility } from "../../../srv/modules/shared/messagingUtility.js";

import { CONNECTION, HTTP, VALID_CODES, VERB_KEYS } from "./constants.js";
import type {
  NextAction,
  VerbErrorDetail,
  VerbFailure,
  VerbSuccess,
  VerbWarning,
} from "./types.js";
import { VerbError } from "./verbError.js";

/** Builds the two envelopes a verb answers with, and raises its rejections. */
export class Envelope {
  /**
   * Builds the success envelope.
   * @param timestamp Server timestamp the call was stamped with.
   * @param nextAction The resulting next action, or null when none remains.
   * @param warnings Non-blocking conditions the caller should see.
   * @param extra Verb-specific fields, such as a created row's identifier.
   * @returns The success envelope.
   */
  static buildSuccess(
    timestamp: string,
    nextAction: NextAction | null,
    warnings: VerbWarning[] = [],
    extra: Record<string, unknown> = {},
  ): VerbSuccess {
    return { ok: true, timestamp, nextAction, warnings, ...extra };
  }

  /**
   * Renders the valid-codes argument of a rejection. An empty list says so in
   * words, because a blank reads as a template fault rather than as "none".
   * @param codes Every code the caller could have addressed.
   * @returns The codes, comma-joined and capped, with the remainder counted.
   */
  static formatValidCodes(codes: readonly string[]): string {
    if (codes.length === 0)
      return Envelope.resolveMessage(VALID_CODES.NONE_KEY);
    const listed = codes.slice(0, VALID_CODES.LIMIT).join(", ");
    if (codes.length <= VALID_CODES.LIMIT) return listed;
    return Envelope.resolveMessage(VALID_CODES.TRUNCATED_KEY, [
      listed,
      String(codes.length - VALID_CODES.LIMIT),
    ]);
  }

  /**
   * Raises a rejection under a runtime message key.
   * @param status HTTP status the caller sees.
   * @param key Runtime message key.
   * @param params Ordered placeholder values for the message.
   * @param detail Optional target, remediation and the guard rule that fired.
   * @returns Never — it always throws.
   */
  static rejectVerb(
    status: number,
    key: string,
    params?: string[],
    detail?: VerbErrorDetail,
  ): never {
    throw new VerbError(
      status,
      key,
      Envelope.resolveMessage(key, params),
      detail,
    );
  }

  /**
   * Resolves a runtime message key into text.
   * @param key Runtime message key.
   * @param params Ordered placeholder values.
   * @returns The resolved message.
   */
  static resolveMessage(key: string, params?: string[]): string {
    return MessagingUtility.getText(key, params);
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
  static toFailure(error: unknown, timestamp: string): VerbFailure {
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
    const rejection = Envelope._readCapRejection(error);
    if (rejection) {
      return { ok: false, timestamp, ...rejection };
    }
    if (Envelope._isConnectionError(error)) {
      const detail = error instanceof Error ? error.message : String(error);
      return {
        ok: false,
        timestamp,
        status: HTTP.SERVICE_UNAVAILABLE,
        code: VERB_KEYS.CONNECTION_UNAVAILABLE,
        message: `${Envelope.resolveMessage(VERB_KEYS.CONNECTION_UNAVAILABLE)} ${detail}`,
        retryable: true,
      };
    }
    // A fault in this layer, not a lost store. The thrown text is deliberately
    // dropped from the envelope — a stack, a path or a SQL fragment must not
    // reach the model — so stderr is the only place the cause survives.
    Envelope._logInternalFailure(error);
    return {
      ok: false,
      timestamp,
      status: HTTP.INTERNAL_ERROR,
      code: VERB_KEYS.INTERNAL_FAILURE,
      message: Envelope.resolveMessage(VERB_KEYS.INTERNAL_FAILURE),
    };
  }

  /**
   * Reports whether a thrown value is a genuine transport fault, by the error
   * code Node's sockets and the Postgres driver put on one.
   * @param error The thrown value.
   * @returns True when the code names a connection failure.
   */
  private static _isConnectionError(error: unknown): boolean {
    if (error === null || typeof error !== "object") return false;
    const code = (error as { code?: unknown }).code;
    return (
      typeof code === "string" &&
      (CONNECTION.ERROR_CODES as readonly string[]).includes(code)
    );
  }

  /**
   * Logs the cause of an internal failure through `cds.log`, which the server
   * redirects to stderr, off the JSON-RPC stream. Resolved off the global, not imported:
   * a static "@sap/cds" import would run ahead of the server's CDS_TYPESCRIPT.
   * @param error The thrown value.
   */
  private static _logInternalFailure(error: unknown): void {
    const runtime = (
      globalThis as {
        cds?: {
          log: (channel: string) => { error: (...args: unknown[]) => void };
        };
      }
    ).cds;
    const cause =
      error instanceof Error ? (error.stack ?? error.message) : String(error);
    runtime?.log("verbs").error(VERB_KEYS.INTERNAL_FAILURE, cause);
  }

  /**
   * Reads a handler rejection off a thrown value. A driver's SQLSTATE is
   * deliberately not a status, or a constraint violation would read as one.
   * @param error The thrown value.
   * @returns The rejection's envelope fields, or undefined when it is not one.
   */
  private static _readCapRejection(
    error: unknown,
  ): { status: number; code: string; message: string } | undefined {
    if (error === null || typeof error !== "object") return undefined;
    const candidate = error as {
      status?: unknown;
      statusCode?: unknown;
      code?: unknown;
      message?: unknown;
      args?: unknown;
    };
    const status = [
      candidate.status,
      candidate.statusCode,
      candidate.code,
    ].find(
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
        : Envelope.resolveMessage(
            code,
            Envelope._readRejectionArgs(candidate.args),
          );
    return { status, code, message };
  }

  /**
   * Reads the placeholder values a CAP rejection carries on `args`.
   * @param args The thrown value's `args`, whatever it holds.
   * @returns The values as strings, or undefined when there are none.
   */
  private static _readRejectionArgs(args: unknown): string[] | undefined {
    return Array.isArray(args) ? args.map(value => String(value)) : undefined;
  }
}
