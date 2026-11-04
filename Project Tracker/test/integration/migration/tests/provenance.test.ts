import {
  EXPECTED_CHAIN,
  MIGRATION_ACTOR,
} from "../data/financialPlannerSnapshot.js";
import { trackerServer } from "../../../shared/support/trackerHarness.js";
import { arrangeFullLoad } from "../support/migrationHarness.js";
import { readCreatedByByEntity } from "../support/readMigration.js";

/**
 * Provenance of the whole load: every row it leaves behind, the chain the
 * create-handler builds included, is attributable to the migration and no one else.
 */
describe("the migration's provenance", () => {
  beforeAll(async () => {
    await trackerServer;
    await arrangeFullLoad();
  });

  /** Later human and agent work is told apart from the load by createdBy alone; any other value blurs that line. */
  it("creates every row of every entity as the migration identity", async () => {
    const createdBy = await readCreatedByByEntity();

    expect([...new Set(Object.values(createdBy).flat())]).toEqual([
      MIGRATION_ACTOR,
    ]);
  });

  /** The chain is written by the create-handler, not the load, so it is where a lost identity would surface. */
  it("creates the chain's Tasks and Subtasks as the migration identity", async () => {
    const createdBy = await readCreatedByByEntity();

    expect(createdBy.Task).toEqual(
      Array.from({ length: EXPECTED_CHAIN.TASK_COUNT }, () => MIGRATION_ACTOR),
    );
    expect(createdBy.Subtask).toEqual(
      Array.from(
        { length: EXPECTED_CHAIN.SUBTASK_COUNT },
        () => MIGRATION_ACTOR,
      ),
    );
  });
});
