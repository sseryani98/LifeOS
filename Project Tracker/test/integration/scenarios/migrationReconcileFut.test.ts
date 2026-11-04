import {
  EXPECTED_COUNTS,
  HIERARCHY_ONLY_MISMATCHES,
  MIGRATION_KEYS,
} from "../migration/data/financialPlannerSnapshot.js";
import {
  arrangeHierarchyLoaded,
  captureMigrationRefusal,
  runReconcile,
  runSeedRegisters,
} from "../migration/support/migrationHarness.js";
import { readStoreSnapshot } from "../migration/support/tamperReconciled.js";
import { trackerServer } from "../../shared/support/trackerHarness.js";
import { MIGRATION_FUT } from "./data/functionalUnits.js";

/**
 * The reconciliation's functional unit, executed at the migration's own method
 * surface: half a load must fail loudly, the whole load must tie out.
 */
describe("the migration reconciliation's functional unit", () => {
  beforeAll(async () => {
    await trackerServer;
  });

  /** Reconciliation is the only check between a partial load and a store read as complete. */
  it(`${MIGRATION_FUT.RECONCILIATION_TIES_OUT} fails a half load loudly, ties out the full one, and writes neither time`, async () => {
    await arrangeHierarchyLoaded();
    const beforeHalf = await readStoreSnapshot();
    const halfLoad = await captureMigrationRefusal(runReconcile);
    const afterHalf = await readStoreSnapshot();
    await runSeedRegisters();
    const beforeFull = await readStoreSnapshot();
    const fullLoad = await runReconcile();
    const afterFull = await readStoreSnapshot();

    expect(halfLoad.key).toBe(MIGRATION_KEYS.COUNT_MISMATCH);
    expect(halfLoad.counts.filter(line => line.actual !== line.expected)).toEqual(
      expect.arrayContaining([...HIERARCHY_ONLY_MISMATCHES]),
    );
    expect(halfLoad.counts.filter(line => line.actual !== line.expected)).toHaveLength(
      HIERARCHY_ONLY_MISMATCHES.length,
    );
    expect(afterHalf).toEqual(beforeHalf);
    expect(fullLoad.counts).toEqual(
      expect.arrayContaining(
        EXPECTED_COUNTS.map(line => ({ ...line, actual: line.expected })),
      ),
    );
    expect(afterFull).toEqual(beforeFull);
  });
});
