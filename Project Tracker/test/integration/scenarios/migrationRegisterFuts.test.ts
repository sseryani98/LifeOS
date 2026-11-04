import {
  ACTIVITY_KIND,
  CHECKPOINT_DATE,
  CHECKPOINT_PROSE_LINES,
  DEFECT_TOTALS,
  EXPECTED_DECISIONS,
  EXPECTED_TEST_RUN,
  RESOLUTION_PLACEHOLDER,
  STATEMENTS_PCT,
} from "../migration/data/financialPlannerSnapshot.js";
import { pairDefectsWithLog } from "../migration/support/inspectRegisters.js";
import {
  arrangeHierarchyLoaded,
  runSeedRegisters,
} from "../migration/support/migrationHarness.js";
import {
  readMigratedActivities,
  readMigratedDecisions,
  readMigratedDefects,
  readMigratedTestRuns,
  type ActivityRow,
} from "../migration/support/readMigration.js";
import { trackerServer } from "../../shared/support/trackerHarness.js";
import { MIGRATION_FUT } from "./data/functionalUnits.js";

/**
 * The register seed's functional units, executed at the surface the cutover
 * script calls: the hierarchy loaded, then the seed run once, then read back.
 */
describe("the register seed's functional units", () => {
  let activitiesBeforeSeed: ActivityRow[];

  beforeAll(async () => {
    await trackerServer;
    await arrangeHierarchyLoaded();
    activitiesBeforeSeed = await readMigratedActivities();
    await runSeedRegisters();
  });

  /** The log names no story; the register must not invent one, and must lose no row the log holds. */
  it(`${MIGRATION_FUT.DEFECTS_KEEP_NO_STORY} seeds every logged defect on its sprint, with no story`, async () => {
    const rows = await readMigratedDefects();
    const paired = pairDefectsWithLog(rows);

    expect(rows).toHaveLength(DEFECT_TOTALS.CLOSED + DEFECT_TOTALS.OPEN);
    expect(rows.filter(row => row.status_code === "Open")).toHaveLength(
      DEFECT_TOTALS.OPEN,
    );
    for (const { logId, expected, matches } of paired) {
      expect({
        logId,
        found: matches.length,
        severity: matches[0]?.severity_code,
        status: matches[0]?.status_code,
        story: matches[0]?.milestone_ID,
        sprint: matches[0]?.initiativeName,
        references: matches[0]?.references,
        titled: (matches[0]?.title ?? "").trim().length > 0,
      }).toEqual({
        logId,
        found: 1,
        severity: expected.severity,
        status: expected.status,
        story: null,
        sprint: expected.initiative,
        references: null,
        titled: true,
      });
    }
  });

  /** An open defect showing a fix reads as resolved; a closed one without its fix loses why it closed. */
  it(`${MIGRATION_FUT.OPEN_DEFECT_NO_RESOLUTION} carries a resolution on exactly the closed defects`, async () => {
    const paired = pairDefectsWithLog(await readMigratedDefects());

    for (const { logId, expected, matches } of paired) {
      expect({ logId, resolution: matches[0]?.resolution }).toEqual({
        logId,
        resolution: expected.resolution,
      });
      expect(matches[0]?.resolution).not.toBe(RESOLUTION_PLACEHOLDER);
    }
    const open = paired.filter(({ matches }) => matches[0]?.status_code === "Open");
    expect(open.map(({ matches }) => matches[0].resolution)).toEqual(
      open.map(() => null),
    );
  });

  /** The run is the sprint's only gate evidence; the wrong coverage row or date would misstate it. */
  it(`${MIGRATION_FUT.TEST_RUN_STATED_METRIC} records the one run the checkpoint states`, async () => {
    const runs = await readMigratedTestRuns();

    expect(runs).toHaveLength(1);
    expect(runs[0]).toMatchObject({
      total: EXPECTED_TEST_RUN.total,
      passed: EXPECTED_TEST_RUN.passed,
      failed: EXPECTED_TEST_RUN.failed,
      branchesPct: EXPECTED_TEST_RUN.branchesPct,
      linesPct: EXPECTED_TEST_RUN.linesPct,
      pending: null,
      durationMs: null,
      task_ID: null,
      initiativeName: EXPECTED_TEST_RUN.initiative,
    });
    expect(runs[0].linesPct).not.toBe(STATEMENTS_PCT);
    expect(runs[0].executedAt.slice(0, 10)).toBe(EXPECTED_TEST_RUN.executedOn);
  });

  /** Decisions carry only what the checkpoint recorded, dated when it recorded them. */
  it(`${MIGRATION_FUT.FIVE_DECISIONS} records the checkpoint's five decisions and nothing more`, async () => {
    const rows = await readMigratedDecisions();

    expect(rows).toHaveLength(EXPECTED_DECISIONS.COUNT);
    expect(rows.map(row => row.initiativeName)).toEqual(
      rows.map(() => EXPECTED_DECISIONS.INITIATIVE),
    );
    expect(rows.map(row => [row.context, row.options])).toEqual(
      rows.map(() => [null, null]),
    );
    expect(rows.map(row => row.decidedAt.slice(0, 10))).toEqual(
      rows.map(() => CHECKPOINT_DATE),
    );
    expect(rows.every(row => row.decision.trim().length > 0)).toBe(true);
    const withoutRationale = rows.filter(row => row.rationale === null);
    expect(withoutRationale).toHaveLength(EXPECTED_DECISIONS.NULL_RATIONALE_COUNT);
    expect(withoutRationale[0].decision.toLowerCase()).toContain(
      EXPECTED_DECISIONS.NULL_RATIONALE_SUBJECT,
    );
  });

  /** Per-row history would bury the project's real activity under a thousand load events. */
  it(`${MIGRATION_FUT.TWO_ACTIVITY_ROWS} leaves exactly the load's row and the checkpoint's`, async () => {
    const rows = await readMigratedActivities();
    const checkpoint = rows.filter(row => row.kind_code === ACTIVITY_KIND.CHECKPOINT);

    expect(activitiesBeforeSeed.map(row => row.kind_code)).toEqual([
      ACTIVITY_KIND.MIGRATION,
    ]);
    expect(rows).toHaveLength(2);
    expect(rows.map(row => row.kind_code).sort()).toEqual(
      [ACTIVITY_KIND.CHECKPOINT, ACTIVITY_KIND.MIGRATION].sort(),
    );
    expect(checkpoint[0].occurredAt.slice(0, 10)).toBe(CHECKPOINT_DATE);
    for (const line of CHECKPOINT_PROSE_LINES) {
      expect(checkpoint[0].payload).toContain(line);
    }
  });
});
