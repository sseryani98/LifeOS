import {
  EXPECTED_COUNTS,
  MIGRATION_KEYS,
} from "../../integration/migration/data/financialPlannerSnapshot.js";
import {
  MIGRATION_SCRIPT_EXIT,
  MIGRATION_SCRIPT_MARKERS,
  MIGRATION_SCRIPT_TIMEOUT_MS,
} from "../data/migrationScript.js";
import {
  deployFreshDatabase,
  readPrintedCount,
  removeDatabase,
  runMigrationScript,
  type ScriptOutcome,
} from "../support/migrationScriptHarness.js";

describe("migrateFinancialPlanner", () => {
  let database: string;
  let firstRun: ScriptOutcome;
  let rerun: ScriptOutcome;

  beforeAll(async () => {
    database = await deployFreshDatabase();
    firstRun = await runMigrationScript(database);
    rerun = await runMigrationScript(database);
  }, MIGRATION_SCRIPT_TIMEOUT_MS.ARRANGE);

  afterAll(() => {
    removeDatabase(database);
  });

  /** Loading, seeding and tying out in any other order fails every real cutover on the count check. */
  it("loads a fresh store, ties out every entity and exits zero", () => {
    expect(firstRun.stderr).not.toContain(MIGRATION_SCRIPT_MARKERS.FAILED);
    expect(firstRun.code).toBe(MIGRATION_SCRIPT_EXIT.SUCCESS);
    for (const line of EXPECTED_COUNTS) {
      expect(readPrintedCount(firstRun.stdout, line.entity)).toEqual({
        expected: line.expected,
        actual: line.expected,
      });
    }
  });

  /** A refused rerun that exits zero reads to an operator or a chained step as a finished cutover. */
  it("refuses a second run loudly and exits non-zero", () => {
    expect(rerun.code).toBe(MIGRATION_SCRIPT_EXIT.FAILURE);
    expect(rerun.stderr).toContain(
      `${MIGRATION_SCRIPT_MARKERS.FAILED}: ${MIGRATION_KEYS.ALREADY_LOADED}`,
    );
  });
});
