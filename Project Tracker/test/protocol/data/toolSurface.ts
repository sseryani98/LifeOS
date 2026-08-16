/** The exposed surface, exhaustive — the list is the contract. */
export const EXPECTED_TOOLS = [
  "start_stage",
  "complete_stage",
  "complete_subtask",
  "reopen_stage",
  "log_defect",
  "resolve_defect",
  "record_decision",
  "record_test_run",
  "plan_sprint",
  "next_action",
  "project_view",
] as const;

/** Names a generic data tool would carry. None of them may appear. */
export const FORBIDDEN_TOOLS = [
  "query",
  "describe",
  "call_action",
  "select",
  "insert",
  "update",
  "delete",
] as const;

/** Identity the client announces to the server. */
export const CLIENT_INFO = { name: "protocol-suite", version: "1.0.0" } as const;

/** How long the spawned server gets to boot before the suite gives up. */
export const SPAWN_TIMEOUT_MS = 25_000;

/** The line the server logs once its transport is live. */
export const READY_LOG = "project tracker verb server ready";

/** Frames the raw-stdout suite writes, in order. */
export const HANDSHAKE_FRAMES = [
  {
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2025-06-18",
      capabilities: {},
      clientInfo: { name: "stdout-suite", version: "1.0.0" },
    },
  },
  { jsonrpc: "2.0", method: "notifications/initialized" },
  { jsonrpc: "2.0", id: 2, method: "tools/list", params: {} },
  {
    jsonrpc: "2.0",
    id: 3,
    method: "tools/call",
    params: { name: "next_action", arguments: {} },
  },
] as const;
