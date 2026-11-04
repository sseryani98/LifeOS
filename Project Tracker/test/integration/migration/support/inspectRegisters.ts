import { EXPECTED_DEFECTS } from "../data/financialPlannerSnapshot.js";

import type { DecisionRow, DefectRow } from "./readMigration.js";

/** One log row beside every stored Defect whose description is its verbatim text. */
export interface PairedDefect {
  logId: string;
  expected: (typeof EXPECTED_DEFECTS)[number];
  matches: DefectRow[];
}

/**
 * Pairs every row of the defect log with the stored Defects carrying its exact
 * description. The log's identifier is not a column, so the description is
 * the only key a stored row can be found by.
 * @param rows The stored Defects.
 * @returns One pairing per log row, in log order.
 */
export const pairDefectsWithLog = (rows: DefectRow[]): PairedDefect[] => {
  return EXPECTED_DEFECTS.map(expected => ({
    logId: expected.logId,
    expected,
    matches: rows.filter(row => row.description === expected.description),
  }));
};

/**
 * Removes the markdown a title derivation may or may not keep, so a title and
 * its description compare as prose.
 * @param text The text to plain.
 * @returns The text without backticks or emphasis markers.
 */
export const stripMarkdown = (text: string): string => {
  return text.replace(/[`*]/g, "");
};

/**
 * Reduces a title to the stem that must open its description: no markdown and
 * no trailing ellipsis, stop or colon a derivation may add or leave behind.
 * @param title The stored title.
 * @returns The stem.
 */
export const readTitleStem = (title: string): string => {
  return stripMarkdown(title)
    .replace(/[\s.:;,…—-]+$/u, "")
    .trim();
};

/**
 * Counts the Decisions whose text names a subject, ignoring markdown and case.
 * @param rows The stored Decisions.
 * @param subject The subject phrase, already lower-case.
 * @returns How many Decisions name it.
 */
export const countDecisionsNaming = (
  rows: DecisionRow[],
  subject: string,
): number => {
  return rows.filter(row =>
    stripMarkdown(row.decision).toLowerCase().includes(subject),
  ).length;
};

/**
 * Tells whether a stored timestamp is no earlier than a clock read taken before
 * the write, give or take the slack a driver's rounding needs.
 * @param stored The stored timestamp.
 * @param readBefore Milliseconds since the epoch, read before the write.
 * @param slackMs The tolerance.
 * @returns True when the row was written at or after the read.
 */
export const isAtOrAfter = (
  stored: string,
  readBefore: number,
  slackMs: number,
): boolean => {
  return Date.parse(stored) >= readBefore - slackMs;
};
