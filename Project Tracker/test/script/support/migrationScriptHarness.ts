import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import {
  MIGRATION_SCRIPT,
  MIGRATION_SCRIPT_ENV,
  MIGRATION_SCRIPT_TIMEOUT_MS,
} from "../data/migrationScript.js";

/** The module root; the driver and the deploy both resolve the model from it. */
const MODULE_ROOT = join(__dirname, "..", "..", "..");

/** How one process ended, as an assertion reads it. */
export interface ScriptOutcome {
  code: number | null;
  stdout: string;
  stderr: string;
}

/** One tie-out row as the driver's table prints it. */
export interface PrintedCount {
  expected: number;
  actual: number;
}

/**
 * Deploys the model and its library CSVs to a fresh SQLite file in its own
 * temporary directory — the state the cutover starts from.
 * @returns The database file the driver will be pointed at.
 */
export const deployFreshDatabase = async (): Promise<string> => {
  const database = join(
    mkdtempSync(join(tmpdir(), MIGRATION_SCRIPT.TMP_PREFIX)),
    MIGRATION_SCRIPT.DB_FILE,
  );
  const outcome = await _runNodeProcess([
    require.resolve("@sap/cds/bin/deploy.js"),
    "--to",
    "sqlite",
    "--database",
    database,
  ]);
  if (outcome.code !== 0) {
    throw new Error(`Deploy exited ${outcome.code}: ${outcome.stderr}`);
  }
  return database;
};

/**
 * Removes a database made by deployFreshDatabase, with its WAL siblings.
 * @param database The file to remove.
 */
export const removeDatabase = (database: string): void => {
  rmSync(dirname(database), { recursive: true, force: true });
};

/**
 * Runs the real cutover driver, exactly as `npm run migrate-financial-planner`
 * does, against one database file.
 * @param database The SQLite file the run loads into.
 * @returns Its exit code and everything it printed.
 */
export const runMigrationScript = (database: string): Promise<ScriptOutcome> => {
  return _runNodeProcess(
    [require.resolve("tsx/cli"), join(MODULE_ROOT, MIGRATION_SCRIPT.ENTRY)],
    {
      [MIGRATION_SCRIPT_ENV.PROFILE]: MIGRATION_SCRIPT_ENV.PROFILE_VALUE,
      [MIGRATION_SCRIPT_ENV.DATABASE]: database,
    },
  );
};

/**
 * Reads one entity's row out of the tie-out table the driver prints.
 * @param stdout What the run printed.
 * @param entity The entity the row names.
 * @returns The printed expected and actual counts, or null when no row names it.
 */
export const readPrintedCount = (
  stdout: string,
  entity: string,
): PrintedCount | null => {
  const row = stdout.split("\n").find(line => line.includes(`'${entity}'`));
  if (row === undefined) return null;
  const cells = row
    .split("│")
    .map(cell => cell.trim())
    .filter(cell => cell !== "");
  return {
    expected: Number(cells[cells.length - 2]),
    actual: Number(cells[cells.length - 1]),
  };
};

/**
 * Spawns node from the module root and collects its output; a process still
 * running at the bound is killed and reported, since a hang is the failure.
 * @param args Script and arguments for node.
 * @param env Variables layered over this process's environment.
 * @returns Its exit code and everything it printed.
 */
const _runNodeProcess = (
  args: string[],
  env: Record<string, string> = {},
): Promise<ScriptOutcome> => {
  const child = spawn(process.execPath, args, {
    cwd: MODULE_ROOT,
    env: { ...process.env, ...env },
    stdio: ["ignore", "pipe", "pipe"],
  });
  return new Promise((resolve, reject) => {
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill();
      reject(
        new Error(
          `Process did not exit within ${MIGRATION_SCRIPT_TIMEOUT_MS.RUN}ms. stderr: ${stderr}`,
        ),
      );
    }, MIGRATION_SCRIPT_TIMEOUT_MS.RUN);
    child.stdout.on("data", chunk => {
      stdout += String(chunk);
    });
    child.stderr.on("data", chunk => {
      stderr += String(chunk);
    });
    child.once("error", error => {
      clearTimeout(timer);
      reject(error);
    });
    child.once("close", code => {
      clearTimeout(timer);
      resolve({ code, stdout, stderr });
    });
  });
};
