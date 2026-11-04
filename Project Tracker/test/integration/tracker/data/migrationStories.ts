/**
 * The three sprints the migrated workspace holds, without their stories. The
 * git facts are the real ones, because a Complete sprint must record both.
 */
export const MIGRATION_SPRINTS = [
  {
    name: "W1-S1",
    goal: null,
    branch: "sprint/W1-S1",
    status_code: "Complete",
    mergeCommit: "0a9804f",
    tag: "v1.1",
    position: 10,
  },
  {
    name: "W1-S2",
    goal: "Transactions flow from SimpleFIN and CSV into the system.",
    branch: "sprint/W1-S2",
    status_code: "Complete",
    mergeCommit: "9bbe826",
    tag: "v1.2",
    position: 20,
  },
  {
    name: "W1-S3",
    goal: "Transactions categorized, splits supported, historical data backfilled.",
    branch: "sprint/W1-S3",
    status_code: "Active",
    mergeCommit: null,
    tag: null,
    position: 30,
  },
] as const;

/**
 * The twelve stories the migration load creates, each keyed to its sprint by
 * name. Eleven were finished before the register existed and carry the flag;
 * the one still in Backlog omits it, so the absent-means-Backlog default runs.
 * These are test rows, not seeded ones.
 */
export const MIGRATION_STORIES = [
  {
    sprint: "W1-S1",
    row: {
      storyId: "CNV-002",
      fricewType_code: "Conversion",
      description: "Seed the card catalogue",
      shipsUi: false,
      position: 10,
      createdDone: true,
    },
  },
  {
    sprint: "W1-S1",
    row: {
      storyId: "CNV-003",
      fricewType_code: "Conversion",
      description: "Seed the issuer reference data",
      shipsUi: false,
      position: 20,
      createdDone: true,
    },
  },
  {
    sprint: "W1-S1",
    row: {
      storyId: "FRM-009",
      fricewType_code: "Form",
      description: "Admin master data maintenance",
      shipsUi: true,
      position: 30,
      createdDone: true,
    },
  },
  {
    sprint: "W1-S2",
    row: {
      storyId: "INT-001",
      fricewType_code: "Interface",
      description: "SimpleFIN account sync",
      shipsUi: false,
      position: 10,
      createdDone: true,
    },
  },
  {
    sprint: "W1-S2",
    row: {
      storyId: "INT-002",
      fricewType_code: "Interface",
      description: "CSV statement import",
      shipsUi: false,
      position: 20,
      createdDone: true,
    },
  },
  {
    sprint: "W1-S2",
    row: {
      storyId: "ENH-008",
      fricewType_code: "Enhancement",
      description: "Connection health tracking",
      shipsUi: false,
      position: 30,
      createdDone: true,
    },
  },
  {
    sprint: "W1-S2",
    row: {
      storyId: "FRM-003",
      fricewType_code: "Form",
      description: "Connection setup page",
      shipsUi: true,
      position: 40,
      createdDone: true,
    },
  },
  {
    sprint: "W1-S2",
    row: {
      storyId: "FRM-010",
      fricewType_code: "Form",
      description: "Import review page",
      shipsUi: true,
      position: 50,
      createdDone: true,
    },
  },
  {
    sprint: "W1-S3",
    row: {
      storyId: "ENH-001",
      fricewType_code: "Enhancement",
      description: "Transaction categorization rules",
      shipsUi: false,
      position: 10,
      createdDone: true,
    },
  },
  {
    sprint: "W1-S3",
    row: {
      storyId: "ENH-009",
      fricewType_code: "Enhancement",
      description: "Split transactions",
      shipsUi: false,
      position: 20,
      createdDone: true,
    },
  },
  {
    sprint: "W1-S3",
    row: {
      storyId: "FRM-001",
      fricewType_code: "Form",
      description: "Transaction maintenance page",
      shipsUi: true,
      position: 30,
      createdDone: true,
    },
  },
  {
    sprint: "W1-S3",
    row: {
      storyId: "CNV-001",
      fricewType_code: "Conversion",
      description: "Historical backfill of transactions",
      shipsUi: false,
      position: 40,
    },
  },
] as const;

/** The one migrated story still in Backlog, which alone gets a chain. */
export const BACKLOG_STORY_ID = "CNV-001";

/** A story created with the flag set false, which must behave exactly as absent. */
export const FLAG_FALSE_STORY = {
  storyId: "ENH-040",
  fricewType_code: "Enhancement",
  description: "Created with the flag explicitly false",
  shipsUi: false,
  position: 40,
  createdDone: false,
} as const;

/** A story created Done in the canonical sprint, for the chainless reads. */
export const DONE_STORY = {
  storyId: "ENH-041",
  fricewType_code: "Enhancement",
  description: "Finished before the register existed",
  shipsUi: false,
  position: 50,
  createdDone: true,
} as const;

/** An edit that turns UI on, so a chain wrongly rebuilt on update would grow the UI stage. */
export const STORY_EDIT_WITH_UI = {
  description: "Edited after the chain was made",
  shipsUi: true,
} as const;

/** The same story identifier the canonical story holds, for the duplicate attempts. */
export const DUPLICATE_OF_CANONICAL = {
  storyId: "CNV-001",
  fricewType_code: "Enhancement",
  description: "A second carrier of a live identifier",
  shipsUi: false,
  position: 10,
} as const;

/** The text a duplicate story identifier is refused with, scoped to the workspace. */
export const DUPLICATE_STORY_MESSAGE = 'Story "CNV-001" already exists.';
