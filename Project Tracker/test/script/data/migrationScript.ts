/** The cutover driver, relative to the module root it chdirs into. */
export const MIGRATION_SCRIPT = {
  ENTRY: "scripts/migrateFinancialPlanner.ts",
  DB_FILE: "tracker.sqlite",
  TMP_PREFIX: "tracker-migration-script-",
} as const;

/**
 * One deploy plus two full runs, each a cold CAP boot. A run that never exits
 * (a dropped disconnect holding the pool open) is killed at this bound.
 */
export const MIGRATION_SCRIPT_TIMEOUT_MS = {
  RUN: 60_000,
  ARRANGE: 180_000,
} as const;

/**
 * The test profile pins `database: null`, which the SQLite service reads
 * ahead of `url`, so the file is set through `database`.
 */
export const MIGRATION_SCRIPT_ENV = {
  PROFILE: "CDS_ENV",
  PROFILE_VALUE: "test",
  DATABASE: "cds_requires_db_credentials_database",
} as const;

/** The exit codes an operator or a chained step reads the cutover by. */
export const MIGRATION_SCRIPT_EXIT = {
  SUCCESS: 0,
  FAILURE: 1,
} as const;

/** The line the driver prints ahead of any refusal or failed tie-out. */
export const MIGRATION_SCRIPT_MARKERS = {
  FAILED: "Migration failed",
} as const;
