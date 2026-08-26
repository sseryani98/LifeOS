/** The keys the registration file is read by, this module's and another module's. */
export const REGISTRY_KEYS = {
  TRACKER: "project-tracker",
  FOREIGN: "playwright",
} as const;

/** The environment the installer is driven through. */
export const REGISTRY_ENV = {
  REGISTRATION_FILE: "MCP_REGISTRATION_FILE",
  ACTOR: "PROJECT_TRACKER_ACTOR",
  ACTOR_VALUE: "test-report",
} as const;

/**
 * A registry that already holds another module's server. Playwright is the real
 * neighbour: the root CLAUDE.md relies on it for frontend validation in every
 * module, and it lives in this same repo-root file.
 */
export const FOREIGN_REGISTRY = {
  mcpServers: {
    playwright: {
      command: "npx",
      args: ["@playwright/mcp@latest"],
    },
  },
} as const;

/** Prefix of the throwaway directory each run writes its registry into. */
export const REGISTRY_TMP_PREFIX = "tracker-mcp-registry-";
