/**
 * What the register seed is checked against beyond the snapshot's own rows.
 * Every phrase and fragment is copied from the W1-S2 checkpoint at the snapshot
 * commit, so a match here is a match on the source, not on the migration's copy.
 */
export const REGISTER_SEED = {
  // One phrase per checkpoint decision, matched against the decision text with
  // backticks and emphasis removed and case folded, so a seeded duplicate shows.
  DECISION_SUBJECTS: [
    "db/ingestion",
    "formatamount",
    "vendor entity",
    "multi-file same-card",
    "earning-yield",
  ],
  // Source the checkpoint holds that already reached another register: the
  // stories table, the defect table, a decision and the coverage table.
  LOADED_ELSEWHERE: [
    "| INT-001 | Integration |",
    "| D-001 | High |",
    "Included **multi-file same-card** upload.",
    "| Lines | 98.71% (1001/1014) |",
  ],
  // The two forms the run's "no failures" may take: absent, or an empty list.
  EMPTY_FAILURES: [null, "[]"],
  // How far a timestamp may sit before the clock read that preceded the write.
  CLOCK_SLACK_MS: 1000,
} as const;
