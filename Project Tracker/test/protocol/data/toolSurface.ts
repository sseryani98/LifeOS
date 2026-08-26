/**
 * The exposed surface, exhaustive — the list is the contract, and so is each
 * tool's read-only flag: a host that auto-approves read-only tools runs a write
 * verb without asking the moment one is mislabelled.
 */
export const EXPECTED_TOOLS = [
  { name: "start_stage", readOnly: false },
  { name: "complete_stage", readOnly: false },
  { name: "complete_subtask", readOnly: false },
  { name: "reopen_stage", readOnly: false },
  { name: "log_defect", readOnly: false },
  { name: "resolve_defect", readOnly: false },
  { name: "record_decision", readOnly: false },
  { name: "record_test_run", readOnly: false },
  { name: "plan_sprint", readOnly: false },
  { name: "next_action", readOnly: true },
  { name: "project_view", readOnly: true },
] as const;

/** The same surface as bare names, so the exhaustiveness check reads unchanged. */
export const EXPECTED_TOOL_NAMES = EXPECTED_TOOLS.map(tool => tool.name);

/**
 * The activity kind each write tool's own verb emits. No two verbs share one, so
 * the kind on the row is what proves the tool reached its own verb rather than a
 * near-identical sibling.
 */
export const WRITE_TOOL_KINDS = {
  start_stage: "stageStarted",
  complete_stage: "stageCompleted",
  complete_subtask: "subtaskCompleted",
  reopen_stage: "stageReopened",
  log_defect: "defectLogged",
  resolve_defect: "defectResolved",
  record_decision: "decisionRecorded",
  record_test_run: "testRunRecorded",
  plan_sprint: "sprintPlanned",
} as const;

/** Where the advertised schema declares the FRICEW code list, key by key. */
export const FRICEW_SCHEMA_PATH = {
  TOOL: "plan_sprint",
  PROPERTY: "stories",
  MEMBER: "type",
} as const;

/** A lost store, as the retry gate recognises one. */
export const CONNECTION_FAILURE = {
  CODE: "ECONNRESET",
  MESSAGE: "socket hang up",
} as const;

/** What the reopened transaction hands back on the retry. */
export const RETRY_OUTCOME = {
  nextAction: null,
  warnings: [],
  extra: {},
} as const;

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

/** Names a generic data tool would carry. None of them may appear. */
export const FORBIDDEN_TOOLS = [
  "query",
  "describe",
  "call_action",
  // @cap-js/mcp's shorter name for the same generic action tool (D-231).
  "call",
  "select",
  "insert",
  "update",
  "delete",
] as const;
