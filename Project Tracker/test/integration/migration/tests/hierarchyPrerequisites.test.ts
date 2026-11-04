import { trackerServer } from "../../../shared/support/trackerHarness.js";
import {
  MIGRATION_KEYS,
  MIGRATION_STATUS,
} from "../data/financialPlannerSnapshot.js";
import {
  captureMigrationRefusal,
  runLoadHierarchy,
} from "../support/migrationHarness.js";
import { countRowsByEntity } from "../support/readMigration.js";
import { removeMethodologyLibrary } from "../support/removeLibrary.js";

/**
 * The hierarchy load run out of order, before the library seed. Its own file,
 * because emptying the library leaves a store no other suite can share.
 */
describe("loading the planner's hierarchy before the library exists", () => {
  beforeAll(async () => {
    await trackerServer;
  });

  /** Without the library every story would be created with no chain, silently; the load must refuse and write nothing. */
  it("refuses with a conflict naming the missing library, writing and emitting nothing", async () => {
    await removeMethodologyLibrary();

    const refusal = await captureMigrationRefusal(runLoadHierarchy);

    expect(refusal.status).toBe(MIGRATION_STATUS.CONFLICT);
    expect(refusal.key).toBe(MIGRATION_KEYS.LIBRARY_MISSING);
    expect(
      Object.entries(await countRowsByEntity()).filter(
        ([, count]) => count > 0,
      ),
    ).toEqual([]);
  });
});
