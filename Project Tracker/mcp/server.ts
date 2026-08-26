import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import type cds from "@sap/cds";

import { VERB_DEFINITIONS } from "./verbs/index.js";
import type { VerbContext, VerbResult } from "./verbs/shared/types.js";

/** The CAP runtime, as the dynamic import hands it back. */
type CdsRuntime = typeof cds & { deploy: (model: unknown, options: { silent: boolean }) => Promise<unknown> };

/** What the process needs to know before it can serve anything. */
const BOOTSTRAP = {
  /** The one CAP service every verb connects to. */
  SERVICE_NAME: "TrackerService",
  /** Where the calling agent declares who it is. */
  ACTOR_VARIABLE: "PROJECT_TRACKER_ACTOR",
  /**
   * Logged once the transport is live. The stdout-purity test
   * (test/protocol/tests/stdoutGuard.test.ts) asserts this exact line lands on
   * stderr, which is what makes the redirection below load-bearing.
   */
  READY_MESSAGE: "project tracker verb server ready",
  /** Server identity advertised to a client. */
  SERVER_INFO: { name: "project-tracker", version: "1.0.0" },
} as const;

/**
 * Builds the MCP server over a connected CAP service. Wiring only: every rule
 * lives in the verb behind the tool.
 * @param context The connected service and the calling agent's identity.
 * @param reconnect Reopens the connection once when a call fails for connection
 *   reasons, which is the single retry the transport is allowed.
 * @returns The server, not yet bound to a transport.
 */
export function createTrackerMcpServer(
  context: VerbContext,
  reconnect?: () => Promise<void>,
): McpServer {
  const server = new McpServer(BOOTSTRAP.SERVER_INFO);
  for (const verb of VERB_DEFINITIONS) {
    server.registerTool(
      verb.name,
      {
        title: verb.title,
        description: verb.description,
        inputSchema: verb.inputShape,
        annotations: { readOnlyHint: verb.readOnly },
      },
      async (input: unknown) => {
        let result = await verb.run(context, input);
        if (_isRetryableFailure(result) && reconnect) {
          await reconnect();
          result = await verb.run(context, input);
        }
        return {
          content: [{ type: "text" as const, text: JSON.stringify(result) }],
          ...(result.ok ? {} : { isError: true }),
        };
      },
    );
  }
  return server;
}

/**
 * Boots CAP in this process, then serves the MCP tools over stdio.
 * @returns Resolves once the transport is connected.
 */
export async function startTrackerMcpServer(): Promise<void> {
  // CAP decides once, at module load, whether ".ts" belongs in the extension
  // list its service-impl resolver searches. This process is neither a cds
  // command nor under Jest, so nothing sets the lever for it — hence the
  // assignment here and the dynamic import on the next line.
  process.env.CDS_TYPESCRIPT ??= "true";
  const cds = (await import("@sap/cds")).default as CdsRuntime;
  redirectLogsToStderr(cds);
  const model = await cds.load("*");
  if (_isInMemoryDatabase(cds)) await _deploySilently(cds, model);
  // Serving happens exactly once, at boot: with nothing served there is
  // nothing to connect to, but a reconnect reopens the connection only.
  await cds.serve("all").from(model as never);
  const context: VerbContext = {
    service: await cds.connect.to(BOOTSTRAP.SERVICE_NAME),
    actor: process.env[BOOTSTRAP.ACTOR_VARIABLE] ?? "",
  };
  const reconnect = async (): Promise<void> => {
    context.service = await cds.connect.to(BOOTSTRAP.SERVICE_NAME);
  };
  await createTrackerMcpServer(context, reconnect).connect(
    new StdioServerTransport(),
  );
  // Deliberately after the transport is live: this is the exact line the
  // stdout-purity test (see BOOTSTRAP.READY_MESSAGE) needs emitted last.
  cds.log("app").info(BOOTSTRAP.READY_MESSAGE);
}

/**
 * Sends every log line to stderr. A single line on stdout lands inside the live
 * JSON-RPC frame stream, where the client reports a parse error and carries on —
 * which is why test/protocol/tests/stdoutGuard.test.ts asserts stdout purity.
 * @param runtime The CAP runtime whose logger factory is being replaced.
 */
export function redirectLogsToStderr(runtime: {
  log: { Logger: unknown };
}): void {
  const write = (...args: unknown[]): void => {
    process.stderr.write(`${args.map(part => String(part)).join(" ")}\n`);
  };
  console.log = write;
  console.info = write;
  console.warn = write;
  console.debug = write;
  console.error = write;
  runtime.log.Logger = () => ({
    trace: write,
    debug: write,
    info: write,
    log: write,
    warn: write,
    error: write,
  });
}

/**
 * Deploys the model without CAP announcing it. The banner is stdout traffic,
 * and the published signature omits the option the runtime accepts.
 * @param cds The CAP runtime.
 * @param model The loaded model.
 * @returns Resolves once the deployment finishes.
 */
async function _deploySilently(cds: CdsRuntime, model: unknown): Promise<void> {
  await cds.deploy(model, { silent: true });
}

/**
 * Reports whether the configured database lives only in this process, which is
 * the one case where the server has to deploy the model itself.
 * @param cds The CAP runtime.
 * @returns True when the database is in-memory.
 */
function _isInMemoryDatabase(cds: CdsRuntime): boolean {
  const credentials = cds.env.requires?.db?.credentials as
    | { url?: string }
    | undefined;
  return credentials?.url === ":memory:";
}

/**
 * Reports whether a result failed because the store was unreachable, by the
 * flag the envelope sets where the error's nature is actually known.
 * @param result The verb result.
 * @returns True when the failure is worth one reconnect-and-retry.
 */
function _isRetryableFailure(result: VerbResult): boolean {
  return !result.ok && result.retryable === true;
}

// Started as a process rather than imported: the protocol tier builds the server
// over its own connected service, and must not boot a second CAP runtime.
if (process.argv[1]?.split("\\").join("/").endsWith("mcp/server.ts")) {
  void startTrackerMcpServer();
}
