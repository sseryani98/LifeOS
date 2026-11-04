import { dirname, join } from "node:path";

import type cds from "@sap/cds";

/**
 * The one-time cutover load: boots TrackerService in-process against the
 * configured database, then loads, seeds and ties out in that order. The
 * library seed runs before it, as the model deploy. It is a script, not an
 * OData action, so no caller can trigger a second load over HTTP.
 */
export class MigrateFinancialPlanner {
  static {
    if (
      process.argv[1]
        ?.split("\\")
        .join("/")
        .endsWith("scripts/migrateFinancialPlanner.ts")
    ) {
      void MigrateFinancialPlanner.runMigration();
    }
  }

  /**
   * Runs the three conversions in order and stops at the first that refuses or
   * fails. The ones before it stay committed and a rerun is refused at the
   * hierarchy load, so a partial load needs manual cleanup.
   * @returns Resolves once the run has finished and the database is released.
   */
  static async runMigration(): Promise<void> {
    process.env.CDS_TYPESCRIPT ??= "true";
    // Started from anywhere; the project must load from the module root.
    process.chdir(join(dirname(process.argv[1] ?? ""), ".."));
    const runtime = (await import("@sap/cds")).default;
    try {
      const tracker = await MigrateFinancialPlanner._startTracker(runtime);
      const { MigrationService } =
        await import("../srv/modules/migration/migrationService.js");
      const migration = new MigrationService(tracker);
      await migration.loadHierarchy();
      await migration.seedRegisters();
      const report = await migration.reconcile();
      console.table(report.counts);
    } catch (error: unknown) {
      MigrateFinancialPlanner._logFailure(error);
      process.exitCode = 1;
    } finally {
      // Released, or the database pool holds the process open; the typings omit it.
      await (
        runtime as unknown as { disconnect: () => Promise<void> }
      ).disconnect();
    }
  }

  /**
   * Prints a refusal or a failed tie-out with everything it named.
   * @param error What the conversion threw.
   */
  private static _logFailure(error: unknown): void {
    const { message, args, counts } = error as {
      message?: string;
      args?: unknown[];
      counts?: unknown[];
    };
    console.error(`Migration failed: ${message ?? String(error)}`);
    if (args?.length) console.error(args);
    if (counts?.length) console.table(counts);
  }

  /**
   * Loads the model, connects the database and serves TrackerService, so the
   * migration's writes pass through its handlers.
   * @param runtime The CAP runtime.
   * @returns The connected TrackerService.
   */
  private static async _startTracker(
    runtime: typeof cds,
  ): Promise<cds.Service> {
    const model = await runtime.load("*");
    runtime.model = runtime.compile.for.nodejs(model);
    await runtime.connect.to("db");
    await runtime.serve("all").from(model as never);
    return runtime.connect.to("TrackerService");
  }
}
