// PostToolUse hook: lints just the edited file, from its owning module, and hands violations back
// as context. That costs seconds instead of a later repair round. It never blocks and never fixes:
// the agent should see the rule and correct it on purpose.
import { exec } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPTS_DIR = fileURLToPath(new URL(".", import.meta.url));
const ESLINT_CONFIG = "eslint.config.mjs";
const STEP_TIMEOUT_MS = 20_000;
const MAX_OUTPUT_BYTES = 4 * 1024 * 1024;
const MAX_CONTEXT_CHARS = 4_000;

// The custom linters are module-wide, so each one's output is filtered to the lines that name the
// edited file — a violation somewhere else is the gate's job, not this edit's.
const CHECKS = [
  { test: /[.]ts$/i, eslint: true, scripts: ["lintCommentLength", "lintNoTrackingIds", "lintFilenames", "lintGroupedConstants", "lintDomainTypes"] },
  { test: /^(srv|mcp)[/].*[.]ts$/i, scripts: ["lintFacades", "lintMapperMethods", "lintHandlerEventTypes"] },
  { test: /^app[/].*[.]ts$/i, scripts: ["lintMessaging", "lintFrontendDataAccess", "lintFrontendControllerShape", "lintFrontendConstants"] },
  { test: /^test[/].*[.]ts$/i, scripts: ["lintTestData", "lintTestStructure", "lintTestCqlAccess"] },
  { test: /[.]cds$/i, scripts: ["lintAnnotations", "lintI18n", "lintFilenames", "lintCdsServiceLayout"] },
  { test: /^app[/].*[.]xml$/i, scripts: ["lintControlIds", "lintNoDefaultAttributes", "lintEventHandlers", "lintI18n"] },
  { test: /[.]properties$/i, scripts: ["lintI18n"] },
  { test: /CLAUDE[.]md$/, scripts: ["lintDocClaims"] },
];

// A module is the nearest ancestor carrying an ESLint config. The repo root has none, so a stray
// file there is skipped; the Standards folder carries the shared config, so its scripts are linted.
const findModuleDir = (filePath, stopAt) => {
  let dir = path.dirname(filePath);
  for (;;) {
    if (existsSync(path.join(dir, ESLINT_CONFIG))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir || (stopAt && path.resolve(dir) === path.resolve(stopAt))) return null;
    dir = parent;
  }
};

// eslint_d keeps one ESLint process warm, so the type-aware program is loaded once rather than on
// every save (7.9 s cold, under 2 s warm). After a change to eslint.config.mjs run
// `npx eslint_d restart`, or the daemon keeps judging by the old rules. Plain eslint is the fallback.
const ESLINT_DAEMON = "eslint_d";
const binaryName = name => (process.platform === "win32" ? `${name}.cmd` : name);
const eslintBinary = moduleDir => {
  for (let dir = moduleDir; ; dir = path.dirname(dir)) {
    if (existsSync(path.join(dir, "node_modules", ".bin", binaryName(ESLINT_DAEMON)))) return ESLINT_DAEMON;
    if (path.dirname(dir) === dir) return "eslint";
  }
};

const runCommand = (command, cwd) =>
  new Promise(resolve => {
    exec(command, { cwd, timeout: STEP_TIMEOUT_MS, windowsHide: true, maxBuffer: MAX_OUTPUT_BYTES }, (error, stdout, stderr) => {
      if (!error) return resolve(null);
      if (error.killed) return resolve(`timed out after ${STEP_TIMEOUT_MS / 1000}s`);
      resolve(`${stdout}${stderr}`.trim() || `exited ${error.code ?? "?"} with no output`);
    });
  });

const mentionsFile = (line, relative) => {
  const forward = relative.split(path.sep).join("/");
  const backward = relative.split(path.sep).join("\\");
  return line.includes(forward) || line.includes(backward) || line.includes(path.basename(relative));
};

const checksFor = relative => {
  const normalised = relative.split(path.sep).join("/");
  const matched = CHECKS.filter(check => check.test.test(normalised));
  return {
    eslint: matched.some(check => check.eslint),
    scripts: [...new Set(matched.flatMap(check => check.scripts))].filter(name => existsSync(path.join(SCRIPTS_DIR, `${name}.ts`))),
  };
};

const lint = async (moduleDir, filePath) => {
  const relative = path.relative(moduleDir, filePath);
  const { eslint, scripts } = checksFor(relative);
  const forward = relative.split(path.sep).join("/");
  const jobs = [];
  if (eslint) jobs.push(runCommand(`npx ${eslintBinary(moduleDir)} --no-color "${forward}"`, moduleDir).then(output => output && `## ESLint\n${output}`));
  for (const name of scripts) {
    const script = path.join(SCRIPTS_DIR, `${name}.ts`);
    jobs.push(
      runCommand(`npx tsx "${script}"`, moduleDir).then(output => {
        if (!output) return null;
        const lines = output.split(/\r?\n/).filter(line => mentionsFile(line, relative));
        return lines.length ? `## ${name}\n${lines.join("\n")}` : null;
      }),
    );
  }
  return (await Promise.all(jobs)).filter(Boolean);
};

const emit = (moduleDir, sections) => {
  const text = sections.join("\n\n");
  const body = text.length > MAX_CONTEXT_CHARS ? `${text.slice(0, MAX_CONTEXT_CHARS)}\n… (truncated)` : text;
  const additionalContext = `Lint on the file you just edited (run from ${path.basename(moduleDir)}):\n${body}\nFix it now — the build gate fails on exactly this.`;
  process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: "PostToolUse", additionalContext } }));
};

const run = async payload => {
  const filePath = payload?.tool_input?.file_path;
  if (!filePath) return;
  const absolute = path.resolve(filePath);
  const moduleDir = findModuleDir(absolute, process.env.CLAUDE_PROJECT_DIR ?? payload?.cwd);
  if (!moduleDir) return;
  const sections = await lint(moduleDir, absolute);
  if (sections.length) emit(moduleDir, sections);
};

// `--self-test <file>` runs the hook as if Claude had just edited that file, for checking the
// registration from a terminal without waiting for a real edit.
const selfTest = process.argv.indexOf("--self-test");
if (selfTest !== -1) {
  await run({ tool_input: { file_path: process.argv[selfTest + 1] }, cwd: process.cwd() });
} else {
  let input = "";
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", chunk => { input += chunk; });
  process.stdin.on("end", () => {
    try { run(JSON.parse(input)); } catch { /* a hook that cannot parse its input stays silent */ }
  });
}
