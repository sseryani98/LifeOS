import {
  ACTIVITY_KIND,
  CHECKPOINT_DATE,
  CHECKPOINT_PROSE_LINES,
  DEFECT_TOTALS,
  EXPECTED_DECISIONS,
  EXPECTED_TEST_RUN,
  MIGRATION_ACTOR,
  RESOLUTION_PLACEHOLDER,
  STATEMENTS_PCT,
} from "../data/financialPlannerSnapshot.js";
import { REGISTER_SEED } from "../data/registerSeed.js";
import {
  countDecisionsNaming,
  isAtOrAfter,
  pairDefectsWithLog,
  readTitleStem,
  stripMarkdown,
} from "../support/inspectRegisters.js";
import {
  arrangeHierarchyLoaded,
  runSeedRegisters,
} from "../support/migrationHarness.js";
import {
  readMigratedActivities,
  readMigratedDecisions,
  readMigratedDefects,
  readMigratedTestRuns,
  type ActivityRow,
} from "../support/readMigration.js";
import { trackerServer } from "../../../shared/support/trackerHarness.js";

/**
 * The register seed, run once over a loaded hierarchy and read back register by
 * register. Every expected value comes from the planner's ledgers, never from
 * the migration's embedded copy of them.
 */
describe("seeding the registers from the planner's ledgers", () => {
  let hierarchyStartedAt: number;
  let activitiesBeforeSeed: ActivityRow[];

  beforeAll(async () => {
    await trackerServer;
    hierarchyStartedAt = Date.now();
    await arrangeHierarchyLoaded();
    activitiesBeforeSeed = await readMigratedActivities();
    await runSeedRegisters();
  });

  /** The register replaces the log, so a row lost or doubled is a defect the project forgets or counts twice. */
  it("seeds every log row exactly once, with its recorded severity and status", async () => {
    const rows = await readMigratedDefects();
    const paired = pairDefectsWithLog(rows);

    expect(rows).toHaveLength(paired.length);
    for (const { logId, expected, matches } of paired) {
      expect({ logId, found: matches.length }).toEqual({ logId, found: 1 });
      expect({
        logId,
        severity: matches[0].severity_code,
        status: matches[0].status_code,
      }).toEqual({
        logId,
        severity: expected.severity,
        status: expected.status,
      });
    }
  });

  /** The totals are what the health banding reads, so they must be the log's own. */
  it("totals twenty closed and seven open defects, two high, thirteen medium and twelve low", async () => {
    const rows = await readMigratedDefects();

    expect(rows.filter(row => row.status_code === "Closed")).toHaveLength(
      DEFECT_TOTALS.CLOSED,
    );
    expect(rows.filter(row => row.status_code === "Open")).toHaveLength(
      DEFECT_TOTALS.OPEN,
    );
    for (const [severity, total] of Object.entries(DEFECT_TOTALS.BY_SEVERITY)) {
      expect({
        severity,
        total: rows.filter(row => row.severity_code === severity).length,
      }).toEqual({ severity, total });
    }
  });

  /** The log names no story, so inventing one would file a defect under work it never belonged to. */
  it("links every defect to its recorded sprint and to no story", async () => {
    const paired = pairDefectsWithLog(await readMigratedDefects());

    for (const { logId, expected, matches } of paired) {
      expect({
        logId,
        story: matches[0].milestone_ID,
        sprint: matches[0].initiativeName,
      }).toEqual({ logId, story: null, sprint: expected.initiative });
    }
  });

  /** References are added later by hand; a seeded value would be one the log never recorded. */
  it("starts every defect with no references", async () => {
    const rows = await readMigratedDefects();

    expect(rows.map(row => row.references)).toEqual(rows.map(() => null));
  });

  /** A title is what a register list shows; it must be the description's opening, not the whole of it or a label. */
  it("derives every title from the opening of its description", async () => {
    const rows = await readMigratedDefects();

    for (const row of rows) {
      const stem = readTitleStem(row.title);
      expect(stem.length).toBeGreaterThan(0);
      expect(row.title.length).toBeLessThan(row.description.length);
      expect(stripMarkdown(row.description).startsWith(stem)).toBe(true);
    }
  });

  /** How a closed defect was fixed is the reason it is closed; losing it loses the fix. */
  it("carries the log's resolution verbatim on every closed defect", async () => {
    const paired = pairDefectsWithLog(await readMigratedDefects());
    const closed = paired.filter(
      ({ expected }) => expected.status === "Closed",
    );

    expect(closed).toHaveLength(DEFECT_TOTALS.CLOSED);
    for (const { logId, expected, matches } of closed) {
      expect({ logId, resolution: matches[0].resolution }).toEqual({
        logId,
        resolution: expected.resolution,
      });
    }
  });

  /** An open defect with a resolution reads as fixed; the log's dash placeholder must load as nothing. */
  it("stores no resolution on an open defect, not even the log's placeholder", async () => {
    const rows = await readMigratedDefects();
    const open = rows.filter(row => row.status_code === "Open");

    expect(open).toHaveLength(DEFECT_TOTALS.OPEN);
    expect(open.map(row => row.resolution)).toEqual(open.map(() => null));
    expect(rows.map(row => row.resolution)).not.toContain(
      RESOLUTION_PLACEHOLDER,
    );
  });

  /** The checkpoint fixes five decisions on its own sprint; context and options it never recorded stay empty. */
  it("records five decisions on the W1-S2 sprint, with no context or options", async () => {
    const rows = await readMigratedDecisions();

    expect(rows).toHaveLength(EXPECTED_DECISIONS.COUNT);
    for (const row of rows) {
      expect(row.initiativeName).toBe(EXPECTED_DECISIONS.INITIATIVE);
      expect(row.milestone_ID).toBeNull();
      expect(row.context).toBeNull();
      expect(row.options).toBeNull();
      expect(row.decision.trim().length).toBeGreaterThan(0);
    }
  });

  /** The checkpoint states the Vendor decision twice; a second row would count one decision as two. */
  it("seeds each of the checkpoint's decisions once", async () => {
    const rows = await readMigratedDecisions();

    for (const subject of REGISTER_SEED.DECISION_SUBJECTS) {
      expect({ subject, seeded: countDecisionsNaming(rows, subject) }).toEqual({
        subject,
        seeded: 1,
      });
    }
  });

  /** A rationale the checkpoint never gave would be one the migration made up. */
  it("leaves only the multi-file same-card decision without a rationale", async () => {
    const rows = await readMigratedDecisions();
    const withoutRationale = rows.filter(row => row.rationale === null);
    const withRationale = rows.filter(row => row.rationale !== null);

    expect(withoutRationale).toHaveLength(
      EXPECTED_DECISIONS.NULL_RATIONALE_COUNT,
    );
    expect(stripMarkdown(withoutRationale[0].decision).toLowerCase()).toContain(
      EXPECTED_DECISIONS.NULL_RATIONALE_SUBJECT,
    );
    for (const row of withRationale) {
      expect((row.rationale ?? "").trim().length).toBeGreaterThan(0);
    }
  });

  /** A decision dated at the load would sort four months after the sprint that made it. */
  it("dates every decision on the checkpoint, not on the load", async () => {
    const rows = await readMigratedDecisions();

    expect(rows.map(row => row.decidedAt.slice(0, 10))).toEqual(
      rows.map(() => CHECKPOINT_DATE),
    );
  });

  /** The checkpoint's one run is the only gate evidence the sprint left; its figures must be the stated ones. */
  it("records one test run with the checkpoint's counts and its Lines figure", async () => {
    const runs = await readMigratedTestRuns();

    expect(runs).toHaveLength(1);
    expect(runs[0]).toMatchObject({
      total: EXPECTED_TEST_RUN.total,
      passed: EXPECTED_TEST_RUN.passed,
      failed: EXPECTED_TEST_RUN.failed,
      pending: EXPECTED_TEST_RUN.pending,
      durationMs: EXPECTED_TEST_RUN.durationMs,
      linesPct: EXPECTED_TEST_RUN.linesPct,
      branchesPct: EXPECTED_TEST_RUN.branchesPct,
    });
    expect(runs[0].linesPct).not.toBe(STATEMENTS_PCT);
    expect(REGISTER_SEED.EMPTY_FAILURES).toContain(runs[0].failures);
  });

  /** A run dated at the load would claim the suite went green on cutover day. */
  it("dates the test run on the checkpoint, not on the load", async () => {
    const runs = await readMigratedTestRuns();

    expect(runs[0].executedAt.slice(0, 10)).toBe(EXPECTED_TEST_RUN.executedOn);
  });

  /** No task exists to own the run, so it belongs to its sprint or to nothing visible. */
  it("links the test run to the W1-S2 sprint and to no task", async () => {
    const runs = await readMigratedTestRuns();

    expect(runs[0].initiativeName).toBe(EXPECTED_TEST_RUN.initiative);
    expect(runs[0].task_ID).toBeNull();
  });

  /** The load is one event, not a row per write; per-row history would bury the real activity. */
  it("adds exactly one activity row, the checkpoint, beside the load's own", async () => {
    const after = await readMigratedActivities();

    expect(activitiesBeforeSeed.map(row => row.kind_code)).toEqual([
      ACTIVITY_KIND.MIGRATION,
    ]);
    expect(after.map(row => row.kind_code).sort()).toEqual(
      [ACTIVITY_KIND.CHECKPOINT, ACTIVITY_KIND.MIGRATION].sort(),
    );
  });

  /** The checkpoint's narrative must survive the cutover once, whole, and dated when it was written. */
  it("dates the checkpoint row on the checkpoint and carries its remaining prose verbatim", async () => {
    const checkpoint = (await readMigratedActivities()).filter(
      row => row.kind_code === ACTIVITY_KIND.CHECKPOINT,
    );

    expect(checkpoint).toHaveLength(1);
    expect(checkpoint[0].occurredAt.slice(0, 10)).toBe(CHECKPOINT_DATE);
    for (const line of CHECKPOINT_PROSE_LINES) {
      expect(checkpoint[0].payload).toContain(line);
    }
  });

  /** Prose already loaded as a story, defect, decision or run would be held twice and drift apart. */
  it("keeps out of the checkpoint row what the other registers already hold", async () => {
    const checkpoint = (await readMigratedActivities()).find(
      row => row.kind_code === ACTIVITY_KIND.CHECKPOINT,
    );

    for (const fragment of REGISTER_SEED.LOADED_ELSEWHERE) {
      expect(checkpoint?.payload).not.toContain(fragment);
    }
  });

  /** The load's own row marks when the cutover happened, so it carries the load time, not a source date. */
  it("leaves the load's own row at load time", async () => {
    const migration = (await readMigratedActivities()).filter(
      row => row.kind_code === ACTIVITY_KIND.MIGRATION,
    );

    expect(migration).toHaveLength(1);
    expect(
      isAtOrAfter(
        migration[0].occurredAt,
        hierarchyStartedAt,
        REGISTER_SEED.CLOCK_SLACK_MS,
      ),
    ).toBe(true);
  });

  /** A seeded row must be told apart from anything a person or an agent wrote later. */
  it("writes every register row, and both activity rows, as the migration", async () => {
    const defects = await readMigratedDefects();
    const decisions = await readMigratedDecisions();
    const runs = await readMigratedTestRuns();
    const activities = await readMigratedActivities();

    const writers = [...defects, ...decisions, ...runs, ...activities].map(
      row => row.createdBy,
    );
    expect(new Set(writers)).toEqual(new Set([MIGRATION_ACTOR]));
    expect(activities.map(row => row.actor_code)).toEqual(
      activities.map(() => MIGRATION_ACTOR),
    );
  });
});
