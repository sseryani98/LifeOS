// Registers (or removes) the weekly Windows scheduled task that runs `/defect-sweep --pick`
// headless. A tracked installer rather than a committed config, like installHooks.mjs (D-32).
// Usage: node installDefectSweepTask.mjs [--day WED] [--time 23:00] [--uninstall]
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const RUNNER = path.join(SCRIPT_DIR, "runDefectSweep.mjs");
const TASK = "LifeOS Defect Sweep";
const DEFAULTS = { day: "WED", time: "23:00" };

const args = process.argv.slice(2);
const option = (name, fallback) => {
  const at = args.indexOf(`--${name}`);
  return at >= 0 && args[at + 1] ? args[at + 1] : fallback;
};

if (args.includes("--uninstall")) {
  execFileSync("schtasks", ["/Delete", "/TN", TASK, "/F"], {
    stdio: "inherit",
  });
} else {
  const day = option("day", DEFAULTS.day);
  const time = option("time", DEFAULTS.time);
  const command = `"${process.execPath}" "${RUNNER}"`;
  execFileSync(
    "schtasks",
    [
      "/Create",
      "/TN",
      TASK,
      "/SC",
      "WEEKLY",
      "/D",
      day,
      "/ST",
      time,
      "/TR",
      command,
      "/F",
    ],
    {
      stdio: "inherit",
    },
  );
  console.log(
    `Scheduled "${TASK}" every ${day} at ${time}. Remove with --uninstall.`,
  );
}
