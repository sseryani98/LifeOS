import { dirname, join } from "node:path";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { BOOTSTRAP } from "./constants.js";
import type { CdsRuntime, LoggerHost } from "./types.js";
import { VerbRegistry } from "./verbs/index.js";
import type { VerbContext, VerbResult } from "./verbs/shared/types.js";

/**
 * The verb server process: bootstrap, stdout guard, tool registration and
 * transport. Wiring only — every rule lives in the verb behind the tool.
 */
export class TrackerMcpServer {
  static {
    // Started as a process rather than imported: the protocol tier builds the
    // server over its own connected service, and must not boot a second runtime.
    if (process.argv[1]?.split("\\").join("/").endsWith("mcp/server.ts")) {
      void TrackerMcpServer.startServer();
    }
  }

  /**
   * Builds the MCP server over a connected CAP service.
   * @param context The connected service and the calling agent's identity.
   * @param reconnect Reopens the connection once when a call fails for connection
   *   reasons, which is the single retry the transport is allowed.
   * @returns The server, not yet bound to a transport.
   */
  static createServer(
    context: VerbContext,
    reconnect?: () => Promise<void>,
  ): McpServer {
    const server = new McpServer(BOOTSTRAP.SERVER_INFO, {
      instructions: BOOTSTRAP.INSTRUCTIONS,
    });
    for (const verb of VerbRegistry.DEFINITIONS) {
      server.registerTool(
        verb.name,
        {
          title: verb.title,
          description: verb.description,
          // A bare raw shape emits no `additionalProperties`, so an undeclared
          // argument passes silently; wrapping here rather than in eleven
          // shapes is what makes a twelfth verb inherit `.strict()`.
          inputSchema: z.object(verb.inputShape).strict(),
          annotations: { readOnlyHint: verb.readOnly },
        },
        async (input: unknown) => {
          let result = await verb.run(context, input);
          if (TrackerMcpServer._isRetryableFailure(result) && reconnect) {
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
   * Sends every log line to stderr. A single line on stdout lands inside the live
   * JSON-RPC frame stream, where the client reports a parse error and carries on —
   * which is why test/protocol/tests/stdoutGuard.test.ts asserts stdout purity.
   * @param runtime The CAP runtime whose logger factory is being replaced.
   */
  static setupStderrLogging(runtime: LoggerHost): void {
    const write = (...args: unknown[]): void => {
      process.stderr.write(`${args.map(part => String(part)).join(" ")}\n`);
    };
    Object.assign(console, {
      log: write,
      info: write,
      warn: write,
      debug: write,
      error: write,
    });
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
   * Loads the model, connects the database and serves every service, in that
   * order.
   * @param cds The CAP runtime.
   * @returns Resolves once every service is served.
   */
  static async startRuntime(cds: CdsRuntime): Promise<void> {
    const model = await cds.load("*");
    cds.model = cds.compile.for.nodejs(model);
    await cds.connect.to(BOOTSTRAP.DATABASE_SERVICE);
    if (TrackerMcpServer._isInMemoryDatabase(cds)) {
      await TrackerMcpServer._runSilentDeploy(cds, model);
    }
    await cds.serve("all").from(model as never);
  }

  /**
   * Boots CAP in this process, then serves the MCP tools over stdio.
   * @returns Resolves once the transport is connected.
   */
  static async startServer(): Promise<void> {
    process.env.CDS_TYPESCRIPT ??= "true";
    // A client spawns this from wherever it is open; the project must load from the module root.
    process.chdir(join(dirname(process.argv[1] ?? ""), ".."));
    const cds = (await import("@sap/cds")).default as CdsRuntime;
    TrackerMcpServer.setupStderrLogging(cds);
    await TrackerMcpServer.startRuntime(cds);
    const context: VerbContext = {
      service: await cds.connect.to(BOOTSTRAP.SERVICE_NAME),
      actor: process.env[BOOTSTRAP.ACTOR_VARIABLE] ?? "",
    };
    const reconnect = async (): Promise<void> => {
      context.service = await cds.connect.to(BOOTSTRAP.SERVICE_NAME);
    };
    await TrackerMcpServer.createServer(context, reconnect).connect(
      new StdioServerTransport(),
    );
    // Deliberately after the transport is live: this is the exact line the
    // stdout-purity test (see BOOTSTRAP.READY_MESSAGE) needs emitted last.
    cds.log("app").info(BOOTSTRAP.READY_MESSAGE);
  }

  /**
   * Reports whether the configured database lives only in this process, which is
   * the one case where the server has to deploy the model itself.
   * @param cds The CAP runtime.
   * @returns True when the database is in-memory.
   */
  private static _isInMemoryDatabase(cds: CdsRuntime): boolean {
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
  private static _isRetryableFailure(result: VerbResult): boolean {
    return !result.ok && result.retryable === true;
  }

  /**
   * Deploys the model silently: stdout belongs to the MCP transport.
   * @param cds The CAP runtime.
   * @param model The loaded model.
   * @returns Resolves once the deployment finishes.
   */
  private static async _runSilentDeploy(
    cds: CdsRuntime,
    model: unknown,
  ): Promise<void> {
    await cds.deploy(model, { silent: true });
  }
}
