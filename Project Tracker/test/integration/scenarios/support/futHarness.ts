import type { Client } from "@modelcontextprotocol/sdk/client/index.js";

import { readToolEnvelope } from "../../../protocol/support/mcpHarness.js";

/** A tool call's raw result alongside the envelope its text payload carries. */
export interface ToolOutcome {
  envelope: Record<string, unknown>;
  isError: boolean;
}

/**
 * Issues one tool call and hands back both halves a functional unit judges: the
 * envelope the caller acts on, and the protocol-level error flag a host reads.
 * @param client The connected client.
 * @param name The tool to call.
 * @param args The arguments to call it with.
 * @returns The parsed envelope and whether the result was flagged an error.
 */
export async function callTool(
  client: Client,
  name: string,
  args: Record<string, unknown> = {},
): Promise<ToolOutcome> {
  const result = await client.callTool({ name, arguments: args });
  return {
    envelope: _readEnvelopeOrEmpty(result),
    isError: (result as { isError?: boolean }).isError === true,
  };
}

/**
 * Parses the envelope, tolerating the one result that carries none: a call the
 * advertised schema refuses never reaches a verb, so its text is the schema's
 * complaint rather than a verb envelope, and that absence is itself the answer.
 * @param result Whatever the client resolved with.
 * @returns The envelope, or an empty object when the payload carries none.
 */
function _readEnvelopeOrEmpty(result: unknown): Record<string, unknown> {
  try {
    return readToolEnvelope(result);
  } catch {
    return {};
  }
}

/**
 * Issues one tool call that a scenario depends on rather than asserts, refusing
 * to continue on a rejection so an arrangement failure never reads as the
 * functional unit's own failure.
 * @param client The connected client.
 * @param name The tool to call.
 * @param args The arguments to call it with.
 * @returns The success envelope it answered with.
 */
export async function driveTool(
  client: Client,
  name: string,
  args: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const { envelope } = await callTool(client, name, args);
  if (envelope.ok !== true) {
    throw new Error(`Arranging "${name}" failed: ${String(envelope.message)}`);
  }
  return envelope;
}

/**
 * Reads the warning codes a success envelope reported.
 * @param envelope The success envelope.
 * @returns The codes, in the order the verb reported them.
 */
export function warningCodesOf(envelope: Record<string, unknown>): string[] {
  const warnings = (envelope.warnings ?? []) as { code: string }[];
  return warnings.map(warning => warning.code);
}

/**
 * Reads the targets a success envelope's warnings named.
 * @param envelope The success envelope.
 * @returns The targets, in the order the verb reported them.
 */
export function warningTargetsOf(envelope: Record<string, unknown>): string[] {
  const warnings = (envelope.warnings ?? []) as { target?: string }[];
  return warnings.map(warning => warning.target ?? "");
}

/**
 * Reads the step code a next action points at, or null when nothing remains.
 * @param envelope The success envelope.
 * @returns The step code, or null.
 */
export function nextStepOf(envelope: Record<string, unknown>): string | null {
  const nextAction = envelope.nextAction as { stepCode?: string } | null;
  return nextAction?.stepCode ?? null;
}
