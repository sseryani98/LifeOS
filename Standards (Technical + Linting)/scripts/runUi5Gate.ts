// The UI5 leg of a module's `npm test`. Runs ui5-test-runner from the module's
// ui5-test-runner.json, then checks each per-folder threshold row on the merged UI5 coverage.
// The runner checks only one global threshold set, and resolves `coverageRemoteScanner`
// relative to its own source, so this passes the shared scanner by absolute path.
//
// Usage (from a module): tsx "../Standards (Technical + Linting)/scripts/runUi5Gate.ts"
//   [--row "<glob>:<lines>:<branches>"]...

import { spawnSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import { createRequire } from "module";
import { join } from "path";

const require = createRequire(import.meta.url);
const CONFIG_FILE = join(process.cwd(), "ui5-test-runner.json");
const SCANNER = join(import.meta.dirname, "scanUi5Coverage.cjs");

const runNode = (args: string[]): number =>
  spawnSync(process.execPath, args, { stdio: "inherit", cwd: process.cwd() }).status ?? 1;

const parseRows = (argv: string[]): { glob: string; lines: string; branches: string }[] =>
  argv.flatMap((arg, index) => {
    if (arg !== "--row") {
      return [];
    }
    const [glob, lines, branches] = (argv[index + 1] ?? "").split(":");
    if (!glob || !lines || !branches) {
      throw new Error(`--row expects "<glob>:<lines>:<branches>", got "${argv[index + 1]}"`);
    }
    return [{ glob, lines, branches }];
  });

if (!existsSync(CONFIG_FILE)) {
  console.error(`runUi5Gate: no ui5-test-runner.json in ${process.cwd()}; the UI5 leg cannot run.`);
  process.exit(1);
}

const config = JSON.parse(readFileSync(CONFIG_FILE, "utf8")) as { coverageTempDir?: string };
const rows = parseRows(process.argv.slice(2));

const runnerExit = runNode([
  require.resolve("ui5-test-runner/index.js"),
  "--no-npm-install",
  "--coverage-remote-scanner",
  SCANNER,
]);
// Rows still run after a red runner, so one run reports every threshold it misses.
const mergedDir = join(process.cwd(), config.coverageTempDir ?? ".nyc_output", "merged");
if (!existsSync(mergedDir)) {
  console.error(`runUi5Gate: no merged UI5 coverage at ${mergedDir}.`);
  process.exit(runnerExit === 0 ? 1 : runnerExit);
}
const nyc = require.resolve("nyc/bin/nyc.js");
const failedRows = rows.filter(row => {
  console.log(`\nUI5 coverage row ${row.glob}: lines ${row.lines}%, branches ${row.branches}%`);
  return (
    runNode([
      nyc,
      "check-coverage",
      "--temp-dir",
      mergedDir,
      "--include",
      row.glob,
      "--lines",
      row.lines,
      "--branches",
      row.branches,
      "--functions",
      "0",
      "--statements",
      "0",
    ]) !== 0
  );
});

process.exit(runnerExit === 0 && failedRows.length === 0 ? 0 : 1);
