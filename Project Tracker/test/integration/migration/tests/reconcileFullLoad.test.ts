import {
  EXPECTED_COUNTS,
  MIGRATION_KEYS,
  RETIRED_FRICEW_TYPE,
} from "../data/financialPlannerSnapshot.js";
import {
  COMPLETED_SUBTASK_STATUS,
  FOREIGN_CREATOR,
  KEYS_OF_OTHER_ASSERTIONS,
  PROVENANCE_TAMPER_ENTITIES,
  RECONCILE_KEY_PATTERN,
  STARTED_TASK_STATUS,
  UI_ONLY_STEP_TAMPERS,
} from "../data/reconcileTampers.js";
import { trackerServer } from "../../../shared/support/trackerHarness.js";
import {
  arrangeFullLoad,
  captureMigrationRefusal,
  runReconcile,
} from "../support/migrationHarness.js";
import {
  addSecondChain,
  deleteChainSubtask,
  deleteOpenStoryChain,
  readStoreSnapshot,
  setChainStep,
  setChainSubtaskStatus,
  setChainTaskStatus,
  setRowCreator,
  setStoryType,
  type StoreTamper,
} from "../support/tamperReconciled.js";

/**
 * Reconciliation over the whole load: it ties out clean, and each assertion
 * fails loudly on the one defect it exists to catch, with every other one held.
 */
describe("reconciling a complete load", () => {
  let tamper: StoreTamper | undefined;

  beforeAll(async () => {
    await trackerServer;
    await arrangeFullLoad();
  });

  afterEach(async () => {
    await tamper?.restore();
    tamper = undefined;
  });

  /** The tie-out is the migration's evidence it moved everything; a missing line is an entity nobody checked. */
  it("reports every entity's expected count against an equal actual one", async () => {
    const report = await runReconcile();

    expect(report.counts).toEqual(
      expect.arrayContaining(
        EXPECTED_COUNTS.map(line => ({ ...line, actual: line.expected })),
      ),
    );
    expect(report.counts.filter(line => line.actual !== line.expected)).toEqual(
      [],
    );
  });

  /** Reconciliation only reads; a write would change the very state it is vouching for. */
  it("leaves every row of every entity untouched when it passes", async () => {
    const before = await readStoreSnapshot();

    await runReconcile();

    expect(await readStoreSnapshot()).toEqual(before);
  });

  /** A second chain means a Done story was created as Backlog, and its guards now block work that already shipped. */
  it("fails on a second chained story, naming both stories", async () => {
    const secondChain = await addSecondChain();
    tamper = secondChain;

    const refusal = await captureMigrationRefusal(runReconcile);

    expect(refusal.key).toBe(MIGRATION_KEYS.CHAIN_MISMATCH);
    for (const storyId of secondChain.storyIds) {
      expect(JSON.stringify(refusal.args)).toContain(storyId);
    }
  });

  /** A migrated chain is untouched work; a started step claims progress nobody made. */
  it("fails when a chain step is no longer Not Started", async () => {
    tamper = await setChainTaskStatus(STARTED_TASK_STATUS);

    const refusal = await captureMigrationRefusal(runReconcile);

    expect(refusal.key).toBe(MIGRATION_KEYS.CHAIN_MISMATCH);
  });

  /** A chain short one Subtask has lost a gate, and the open story would ship without it. */
  it("fails when the chain is missing a Subtask", async () => {
    tamper = await deleteChainSubtask();

    const refusal = await captureMigrationRefusal(runReconcile);

    expect(refusal.key).toBe(MIGRATION_KEYS.CHAIN_MISMATCH);
  });

  /** A completed Subtask claims a gate passed on work nobody has started. */
  it("fails when a chain Subtask is no longer Not Started", async () => {
    tamper = await setChainSubtaskStatus(COMPLETED_SUBTASK_STATUS);

    const refusal = await captureMigrationRefusal(runReconcile);

    expect(refusal.key).toBe(MIGRATION_KEYS.CHAIN_MISMATCH);
  });

  /** An open story with no chain has no guards at all; the failure must name it, since no chained story is left to name. */
  it("fails when the open story has no chain, naming that story", async () => {
    const unchained = await deleteOpenStoryChain();
    tamper = unchained;

    const refusal = await captureMigrationRefusal(runReconcile);

    expect(refusal.key).toBe(MIGRATION_KEYS.CHAIN_MISMATCH);
    expect(JSON.stringify(refusal.args)).toContain(unchained.storyIds[0]);
  });

  /** A backend story carrying a UI-only step would demand a browser review of pages that do not exist. */
  it.each(UI_ONLY_STEP_TAMPERS)(
    "fails when a chain $entity carries the UI-only step $stepCode",
    async ({ entity, stepCode }) => {
      tamper = await setChainStep(entity, stepCode);

      const refusal = await captureMigrationRefusal(runReconcile);

      expect(refusal.key).toBe(MIGRATION_KEYS.CHAIN_MISMATCH);
    },
  );

  /** The retired plural type is outside the six-value list; a story holding it falls out of every type filter. */
  it("fails on a story typed as the retired interface type", async () => {
    tamper = await setStoryType(RETIRED_FRICEW_TYPE);

    const refusal = await captureMigrationRefusal(runReconcile);

    expect(refusal.key).toMatch(RECONCILE_KEY_PATTERN);
    expect(KEYS_OF_OTHER_ASSERTIONS).not.toContain(refusal.key);
  });

  /** A row with another creator breaks the audit trail separating the load from later human and agent work. */
  it.each(PROVENANCE_TAMPER_ENTITIES)(
    "fails on a %s row not created by the migration, naming that row",
    async entity => {
      const reattributed = await setRowCreator(entity, FOREIGN_CREATOR);
      tamper = reattributed;

      const refusal = await captureMigrationRefusal(runReconcile);

      expect(refusal.key).toBe(MIGRATION_KEYS.PROVENANCE_MISMATCH);
      expect(JSON.stringify(refusal.args)).toContain(reattributed.rowId);
    },
  );
});
