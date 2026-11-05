// What the scheduled task runs: one headless `/defect-sweep --pick` from the repo root, its output
// written to a gitignored dated log. Run it by hand to test the schedule without waiting a week.
import { spawn } from "node:child_process";
import { createWriteStream, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
);
const LOG_DIR = path.join(REPO_ROOT, ".claude", "defect-sweep", "logs");
const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");

mkdirSync(LOG_DIR, { recursive: true });
const log = createWriteStream(path.join(LOG_DIR, `${stamp}.log`));
// Auto mode: no human is there to answer a prompt; anything it would refuse is refused, and the
// skill stops and reports rather than retrying.
const child = spawn(
  "claude",
  ["-p", "/defect-sweep --pick", "--permission-mode", "auto"],
  {
    cwd: REPO_ROOT,
    shell: true,
  },
);
child.stdout.pipe(log);
child.stderr.pipe(log);
child.on("close", code => {
  log.end(`\n[runDefectSweep] exited ${code}\n`);
  process.exitCode = code ?? 1;
});
