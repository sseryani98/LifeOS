import "@sap/cds";

import type { QueryRunner } from "../../../../mcp/verbs/shared/types.js";

/** A runner that records what it was asked to run and answers with fixtures. */
export interface RecordingRunner extends QueryRunner {
  statements: unknown[];
}

/**
 * Builds a runner that answers each call from a queue of prepared results, and
 * keeps every statement it was handed so a spec can assert on the shape built.
 * @param results One result per call, in call order.
 * @returns The recording runner.
 */
export function buildRecordingRunner(results: unknown[] = []): RecordingRunner {
  const queue = [...results];
  const statements: unknown[] = [];
  return {
    statements,
    run: ((statement: unknown) => {
      statements.push(statement);
      return Promise.resolve(queue.length > 0 ? queue.shift() : []);
    }) as QueryRunner["run"],
  };
}

/**
 * Reads back the rows an INSERT statement carried.
 * @param statement The recorded statement.
 * @returns The entries it would have written.
 */
export function readInsertedEntries(
  statement: unknown,
): Record<string, unknown>[] {
  const insert = (statement as { INSERT?: { entries?: unknown } }).INSERT;
  const entries = insert?.entries;
  if (Array.isArray(entries)) return entries as Record<string, unknown>[];
  return entries ? [entries as Record<string, unknown>] : [];
}
