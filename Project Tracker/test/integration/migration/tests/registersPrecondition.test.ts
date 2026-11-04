import {
  MIGRATION_KEYS,
  MIGRATION_STATUS,
} from "../data/financialPlannerSnapshot.js";
import {
  captureMigrationRefusal,
  runSeedRegisters,
} from "../support/migrationHarness.js";
import { countRowsByEntity } from "../support/readMigration.js";
import { trackerServer } from "../../../shared/support/trackerHarness.js";

/**
 * The register seed run out of order, over a store the hierarchy load has not
 * touched. Kept apart from the seeded suite so its empty store is its own.
 */
describe("seeding the registers before the hierarchy exists", () => {
  beforeAll(async () => {
    await trackerServer;
  });

  /** Registers hang off sprints the hierarchy load creates; seeding first would orphan every row. */
  it("refuses with a conflict naming the missing hierarchy", async () => {
    const refusal = await captureMigrationRefusal(runSeedRegisters);

    expect(refusal.status).toBe(MIGRATION_STATUS.CONFLICT);
    expect(refusal.key).toBe(MIGRATION_KEYS.HIERARCHY_MISSING);
  });

  /** A refused conversion must leave nothing behind, or a retry in order meets half a load. */
  it("writes and emits nothing when it refuses", async () => {
    const before = await countRowsByEntity();

    await captureMigrationRefusal(runSeedRegisters);

    expect(await countRowsByEntity()).toEqual(before);
  });
});
