import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  DEFECT_SEVERITIES,
  FRICEW_TYPES,
} from "../../../mcp/verbs/shared/constants.js";

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

/**
 * Every code list the advertised schema declares, and where. One hard-coded
 * path proved the pattern for one tool and left every other enum-valued
 * parameter unchecked; a table checks them all and grows with the surface.
 * A `MEMBER` names a property of an array's items, and its absence means the
 * enum sits directly on the tool's own property.
 */
export const ENUM_SCHEMA_PATHS = [
  { TOOL: "plan_sprint", PROPERTY: "stories", MEMBER: "type" },
  { TOOL: "log_defect", PROPERTY: "severity" },
] as const;

/**
 * Array parameters the advertised schema must declare non-empty. A sprint is an
 * Initiative and its stories, so a plan with none has nothing to build.
 */
export const NON_EMPTY_ARRAY_PATHS = [
  { TOOL: "plan_sprint", PROPERTY: "stories" },
] as const;

/**
 * Counts the advertised schema must floor at zero. A negative count can balance
 * an over-total one, so a schema without the floor lets a caller construct a
 * sum the total check accepts.
 */
export const NON_NEGATIVE_METRIC_PATHS = [
  { TOOL: "record_test_run", PROPERTY: "metrics", MEMBER: "total" },
  { TOOL: "record_test_run", PROPERTY: "metrics", MEMBER: "passed" },
  { TOOL: "record_test_run", PROPERTY: "metrics", MEMBER: "failed" },
  { TOOL: "record_test_run", PROPERTY: "metrics", MEMBER: "pending" },
] as const;

/**
 * What a description has to clear to count as one. The floor is deliberately
 * low — this catches a description emptied, stubbed or pasted from a sibling,
 * not a thin one, because only the first three are mechanically decidable.
 */
export const DESCRIPTION_FLOOR = 40;

/**
 * Phrases the server's instructions have to carry. They are the premise a
 * client is told once at initialize and nowhere else, so an instructions block
 * that loses them has stopped doing the job it was added for.
 */
export const INSTRUCTIONS_MARKERS = ["only write path", "no query"] as const;

/** The values each path above must advertise, so a shortened list is caught too. */
export const EXPECTED_CODE_LISTS: Record<string, readonly string[]> = {
  plan_sprint: FRICEW_TYPES,
  log_defect: DEFECT_SEVERITIES,
};

/**
 * The version the manifest declares, read rather than copied. Copying it would
 * make the assertion pass while the two facts it compares drifted apart, which
 * is the defect it exists to catch.
 */
export const MANIFEST_VERSION = (
  JSON.parse(
    readFileSync(join(__dirname, "..", "..", "..", "package.json"), "utf8"),
  ) as { version: string }
).version;

/** A key no tool's schema declares, sent to prove an undeclared one is refused. */
export const UNKNOWN_ARGUMENT = { key: "workspaceSlug", value: "typo" } as const;

/** How many calls the overlap check has in flight against one server at once. */
export const CONCURRENT_READS = 8;

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

/**
 * How long a server whose stdin has closed gets to end on its own. Generous:
 * the point is to distinguish "shuts down" from "never shuts down", not to
 * measure how quickly.
 */
export const SHUTDOWN_GRACE_MS = 10_000;

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
