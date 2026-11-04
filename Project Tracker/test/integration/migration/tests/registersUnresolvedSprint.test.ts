import {
  MIGRATION_KEYS,
  MIGRATION_STATUS,
  SPRINT,
} from "../data/financialPlannerSnapshot.js";
import { UNRESOLVABLE_SPRINT_NAME } from "../data/reconcileTampers.js";
import {
  arrangeHierarchyLoaded,
  captureMigrationRefusal,
  runSeedRegisters,
} from "../support/migrationHarness.js";
import { countRowsByEntity } from "../support/readMigration.js";
import { renameInitiative } from "../support/tamperReconciled.js";
import { trackerServer } from "../../../shared/support/trackerHarness.js";

/**
 * The register seed over a hierarchy whose checkpoint sprint no longer matches
 * the ledgers. Kept apart from the seeded suite because it renames a sprint.
 */
describe("seeding the registers when a ledger sprint cannot be resolved", () => {
  beforeAll(async () => {
    await trackerServer;
    await arrangeHierarchyLoaded();
    await renameInitiative(SPRINT.W1_S2, UNRESOLVABLE_SPRINT_NAME);
  });

  /** Every row is checked before any is written, so one run reports every orphan rather than the first insert's. */
  it("refuses as bad input with every orphaned register row's key, and writes nothing", async () => {
    const before = await countRowsByEntity();

    const refusal = await captureMigrationRefusal(runSeedRegisters);

    expect(refusal.status).toBe(MIGRATION_STATUS.BAD_INPUT);
    expect(refusal.keys).toEqual(
      expect.arrayContaining([
        MIGRATION_KEYS.DEFECT_TARGET_MISSING,
        MIGRATION_KEYS.TEST_RUN_TARGET_MISSING,
      ]),
    );
    expect(await countRowsByEntity()).toEqual(before);
    expect(before).toMatchObject({
      Defect: 0,
      Decision: 0,
      TestRun: 0,
      Activity: 1,
    });
  });
});
