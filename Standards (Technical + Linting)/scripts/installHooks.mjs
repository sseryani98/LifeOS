// Registers the repo's Claude Code hooks in the gitignored .claude/settings.json (D-32: a
// tracked installer, not a committed config). Idempotent: it replaces only its own entries.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "..", "..");
const SETTINGS = path.join(REPO_ROOT, ".claude", "settings.json");
const JSON_INDENT = 2;
// Claude Code hook timeouts are seconds, not milliseconds.
const HOOK_TIMEOUT_SECONDS = 30;
const SCRIPT_DIR = "Standards (Technical + Linting)/scripts";

// Commands are relative to the project directory, which is where Claude Code runs a hook.
const HOOKS = {
  PostToolUse: [
    {
      matcher: "Write|Edit",
      hooks: [{ type: "command", command: `node "${SCRIPT_DIR}/lintOnEditHook.mjs"`, timeout: HOOK_TIMEOUT_SECONDS }],
    },
  ],
};

const ownsEntry = entry => (entry.hooks ?? []).some(hook => String(hook.command).includes(SCRIPT_DIR));

const settings = existsSync(SETTINGS) ? JSON.parse(readFileSync(SETTINGS, "utf8")) : {};
settings.hooks ??= {};
for (const [event, entries] of Object.entries(HOOKS)) {
  const kept = (settings.hooks[event] ?? []).filter(entry => !ownsEntry(entry));
  settings.hooks[event] = [...kept, ...entries];
}
mkdirSync(path.dirname(SETTINGS), { recursive: true });
writeFileSync(SETTINGS, `${JSON.stringify(settings, null, JSON_INDENT)}\n`);
console.log(`Hooks installed in ${SETTINGS}: ${Object.entries(HOOKS).map(([event, entries]) => `${event} ×${entries.length}`).join(", ")}`);
