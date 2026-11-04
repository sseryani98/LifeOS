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
export const buildRecordingRunner = (results: unknown[] = []): RecordingRunner => {
  const queue = [...results];
  const statements: unknown[] = [];
  return {
    statements,
    run: ((statement: unknown) => {
      statements.push(statement);
      return Promise.resolve(queue.length > 0 ? queue.shift() : []);
    }) as QueryRunner["run"],
  };
};

/**
 * Reads back the filter an UPDATE statement was keyed on.
 * @param statement The recorded statement.
 * @returns The where clause as CXN tokens, or undefined when it has none.
 */
export const readUpdateWhere = (statement: unknown): unknown[] | undefined =>
  (statement as { UPDATE?: { where?: unknown[] } }).UPDATE?.where;

/**
 * Reads back the rows an INSERT statement carried.
 * @param statement The recorded statement.
 * @returns The entries it would have written.
 */
export const readInsertedEntries = (
  statement: unknown,
): Record<string, unknown>[] => {
  const insert = (statement as { INSERT?: { entries?: unknown } }).INSERT;
  const entries = insert?.entries;
  if (Array.isArray(entries)) return entries as Record<string, unknown>[];
  return entries ? [entries as Record<string, unknown>] : [];
};

/**
 * Reads the keys an array schema's items declare, so a spec can pin the shape
 * of each row a verb accepts without reaching into the schema library itself.
 * @param schema The array schema.
 * @returns The item object's keys, in declaration order.
 */
export const readArrayItemKeys = (schema: unknown): string[] => {
  const element = (schema as { element?: { shape?: Record<string, unknown> } }).element;
  return Object.keys(element?.shape ?? {});
};
