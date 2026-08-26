import { spawn } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { REGISTRY_ENV, REGISTRY_TMP_PREFIX } from "../data/mcpRegistry.js";

/**
 * The installer under test is the tracked script itself, driven as a real
 * process — a copy would prove nothing about what `npm run install-mcp` does.
 */
const INSTALLER_SCRIPT = join(
  __dirname,
  "..",
  "..",
  "..",
  "scripts",
  "installMcpServer.mjs",
);

/** One registered server, as an assertion reads it. */
export interface RegisteredServer {
  command: string;
  args: string[];
  env?: Record<string, string>;
}

/** The registration file's shape, as an assertion reads it. */
export interface McpRegistry {
  mcpServers: Record<string, RegisteredServer>;
}

/**
 * Makes a throwaway path for one run's registration file, inside its own
 * temporary directory so a case about a missing file has one.
 * @returns The path the installer will be pointed at.
 */
export function makeRegistryPath(): string {
  return join(mkdtempSync(join(tmpdir(), REGISTRY_TMP_PREFIX)), ".mcp.json");
}

/**
 * Writes a starting registry, for the cases where one already exists.
 * @param path Where to write it.
 * @param registry The registry to write.
 */
export function seedRegistry(path: string, registry: unknown): void {
  writeFileSync(path, `${JSON.stringify(registry, null, 2)}\n`, "utf8");
}

/**
 * Runs the installer against a registration file it is allowed to write.
 * @param path The registration file the run is pointed at.
 * @param actor The identity the registration should declare, if any.
 * @returns Resolves once the process has exited cleanly.
 */
export function runInstaller(path: string, actor?: string): Promise<void> {
  const child = spawn(process.execPath, [INSTALLER_SCRIPT], {
    env: {
      ...process.env,
      [REGISTRY_ENV.REGISTRATION_FILE]: path,
      ...(actor === undefined ? {} : { [REGISTRY_ENV.ACTOR]: actor }),
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  return new Promise((resolve, reject) => {
    let stderr = "";
    child.stderr.on("data", chunk => {
      stderr += String(chunk);
    });
    child.once("error", reject);
    child.once("exit", code => {
      if (code === 0) resolve();
      else reject(new Error(`Installer exited ${code}: ${stderr}`));
    });
  });
}

/**
 * Reads a registration file back.
 * @param path The file to read.
 * @returns The parsed registry.
 */
export function readRegistry(path: string): McpRegistry {
  return JSON.parse(readFileSync(path, "utf8")) as McpRegistry;
}
