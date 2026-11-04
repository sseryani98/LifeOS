// Points the VSCode ui5plugin at the shared ui5plugin.json. The plugin reads that file only through
// `ui5.plugin.globalConfigurationPath`, which takes a raw absolute path (no ${workspaceFolder}), so the
// path is machine-specific and ships as a tracked installer. Idempotent; reload VSCode afterwards.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const STANDARDS_DIR = path.resolve(
  fileURLToPath(new URL(".", import.meta.url)),
  "..",
);
const REPO_ROOT = path.resolve(STANDARDS_DIR, "..");
const SETTINGS = path.join(REPO_ROOT, ".vscode", "settings.json");
const CONFIG = path.join(STANDARDS_DIR, "ui5plugin.json");
const SETTING_KEY = "ui5.plugin.globalConfigurationPath";
const JSON_INDENT = 2;

const settings = existsSync(SETTINGS)
  ? JSON.parse(readFileSync(SETTINGS, "utf8"))
  : {};
settings[SETTING_KEY] = CONFIG;
writeFileSync(SETTINGS, `${JSON.stringify(settings, null, JSON_INDENT)}\n`);
console.log(
  `${SETTING_KEY} → ${CONFIG} in ${SETTINGS}. Reload VSCode to apply.`,
);
