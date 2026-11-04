import {
  HIERARCHY_ONLY_MISMATCHES,
  MIGRATION_KEYS,
} from "../data/financialPlannerSnapshot.js";
import { trackerServer } from "../../../shared/support/trackerHarness.js";
import {
  arrangeHierarchyLoaded,
  captureMigrationRefusal,
  runReconcile,
} from "../support/migrationHarness.js";
import { readStoreSnapshot } from "../support/tamperReconciled.js";

/**
 * Reconciliation over the legal half-way state — the hierarchy loaded, the
 * registers not — which is exactly the partial load it exists to catch.
 */
describe("reconciling a load stopped after the hierarchy", () => {
  beforeAll(async () => {
    await trackerServer;
    await arrangeHierarchyLoaded();
  });

  /** A half-done migration that only warned would be read as finished and the registers never seeded. */
  it("fails loudly under the count-mismatch key", async () => {
    const refusal = await captureMigrationRefusal(runReconcile);

    expect(refusal.key).toBe(MIGRATION_KEYS.COUNT_MISMATCH);
  });

  /** The failure must say which entities are short and by how much, or the operator cannot tell what to re-run. */
  it("reports expected against actual for exactly the short entities", async () => {
    const refusal = await captureMigrationRefusal(runReconcile);

    const mismatches = refusal.counts.filter(
      line => line.actual !== line.expected,
    );
    expect(mismatches).toHaveLength(HIERARCHY_ONLY_MISMATCHES.length);
    expect(mismatches).toEqual(
      expect.arrayContaining([...HIERARCHY_ONLY_MISMATCHES]),
    );
  });

  /** A failing reconciliation that patched the store would hide the very gap it reported. */
  it("leaves every row of every entity untouched when it fails", async () => {
    const before = await readStoreSnapshot();

    await captureMigrationRefusal(runReconcile);

    expect(await readStoreSnapshot()).toEqual(before);
  });
});
