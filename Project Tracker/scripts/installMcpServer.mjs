#!/usr/bin/env node
// Registers the verb server with the agent harness. The registration file is
// gitignored, so a fresh clone has no servers at all — which is why the durable
// artifact is this script rather than the file it writes.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** Where this module's root sits, derived from this file rather than the cwd. */
const MODULE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** The repository root, one level above the module. */
const REPO_ROOT = resolve(MODULE_ROOT, "..");

/** The gitignored registration file the harness reads. */
const REGISTRATION_FILE = join(REPO_ROOT, ".mcp.json");

/** The server key and the command that starts it. */
const SERVER_NAME = "project-tracker";

/**
 * Reads the existing registration file, or an empty registry when none exists.
 * @returns The parsed registry.
 */
function readRegistry() {
  try {
    return JSON.parse(readFileSync(REGISTRATION_FILE, "utf8"));
  } catch {
    return {};
  }
}

/**
 * Writes this module's server into the registry, leaving every other entry as
 * it was. The actor is taken from the environment so the registration itself
 * declares who is calling; without one, every verb is refused.
 */
function installServer() {
  const registry = readRegistry();
  registry.mcpServers = registry.mcpServers ?? {};
  registry.mcpServers[SERVER_NAME] = {
    command: "npx",
    args: ["tsx", join(MODULE_ROOT, "mcp", "server.ts")],
    env: { PROJECT_TRACKER_ACTOR: process.env.PROJECT_TRACKER_ACTOR ?? "sandro" },
  };
  writeFileSync(REGISTRATION_FILE, `${JSON.stringify(registry, null, 2)}\n`);
  process.stdout.write(`Registered "${SERVER_NAME}" in ${REGISTRATION_FILE}\n`);
}

installServer();
