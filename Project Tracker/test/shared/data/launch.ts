/**
 * How the verb server is launched, in one place. The installer authors the
 * client's copy of this and the protocol harness spawns its own, and until both
 * read the same constant the tested path and the registered path were free to
 * differ — which they did, one going through a wrapper the other never used.
 */
export const LAUNCH = {
  /** Resolved from PATH, so a Node upgrade does not strand the registration. */
  COMMAND: "node",
  /**
   * The loader flags, ahead of the entry point. `tsx` rather than Node's
   * strip-only mode: the module resolves siblings as "./types.js" under
   * Node16, which strip-only does not rewrite back.
   */
  ARGS: ["--import", "tsx"],
  /** The entry point, relative to the module root. */
  ENTRY: ["mcp", "server.ts"],
} as const;
