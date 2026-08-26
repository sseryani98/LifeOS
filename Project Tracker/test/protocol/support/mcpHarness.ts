import { spawn, type ChildProcess } from "node:child_process";
import { join } from "node:path";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type cds from "@sap/cds";

import { createTrackerMcpServer } from "../../../mcp/server.js";
import {
  CLIENT_INFO,
  CONNECTION_FAILURE,
  HANDSHAKE_FRAMES,
  READY_LOG,
  SPAWN_TIMEOUT_MS,
} from "../data/toolSurface.js";

/** The module root, and the server entry point inside it. */
const MODULE_ROOT = join(__dirname, "..", "..", "..");

/** What the raw-stdout run collected from the spawned process. */
export interface CapturedStreams {
  stdout: string;
  stderr: string;
}

/**
 * Connects a client to the verb server over a linked in-memory transport pair,
 * so the tier exercises real framing with no pipe and no second CAP runtime.
 * @param service The connected CAP service the verbs run against.
 * @param actor The identity the calls declare.
 * @returns The connected client.
 */
export async function connectInMemoryClient(
  service: cds.Service,
  actor: string,
): Promise<Client> {
  return connectClientTo(createTrackerMcpServer({ service, actor }));
}

/**
 * Connects a client to an already-built server over a linked transport pair, so
 * a suite can supply its own context and reconnect hook.
 * @param server The server to bind.
 * @returns The connected client.
 */
export async function connectClientTo(server: McpServer): Promise<Client> {
  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);
  const client = new Client(CLIENT_INFO);
  await client.connect(clientTransport);
  return client;
}

/**
 * Reads the verb envelope a tool result carries. The transport hands back text,
 * so the contract a caller acts on is only visible once it is parsed.
 * @param result Whatever the client's callTool resolved with.
 * @returns The parsed envelope.
 */
export function readToolEnvelope(result: unknown): Record<string, unknown> {
  const content = (result as { content?: { text?: string }[] }).content ?? [];
  return JSON.parse(content[0]?.text ?? "") as Record<string, unknown>;
}

/**
 * Reads the code list a tool's advertised schema declares for one member of an
 * array property, so an assertion can name the values rather than the flag a
 * rejection sets.
 * @param tool The listed tool.
 * @param property The array property on the tool's input schema.
 * @param member The member of that array's items.
 * @returns The declared values, or an empty list when none are declared.
 */
export function readSchemaEnum(
  tool: unknown,
  property: string,
  member: string,
): string[] {
  const schema =
    (tool as { inputSchema?: Record<string, unknown> } | undefined)
      ?.inputSchema ?? {};
  const properties = schema.properties as
    | Record<
        string,
        { items?: { properties?: Record<string, { enum?: string[] }> } }
      >
    | undefined;
  return properties?.[property]?.items?.properties?.[member]?.enum ?? [];
}

/**
 * Builds a stand-in service whose first transaction dies as a lost connection
 * and whose second answers, so the reconnect-and-retry path has a fault to
 * recover from.
 * @param outcome What the second transaction hands back.
 * @returns The service, and how many transactions it has been asked for.
 */
export function buildFlakyService(outcome: unknown): {
  service: cds.Service;
  attempts: () => number;
} {
  let attempts = 0;
  const service = {
    tx: async (): Promise<unknown> => {
      attempts += 1;
      if (attempts > 1) return outcome;
      throw Object.assign(new Error(CONNECTION_FAILURE.MESSAGE), {
        code: CONNECTION_FAILURE.CODE,
      });
    },
  } as unknown as cds.Service;
  return { service, attempts: () => attempts };
}

/**
 * Spawns the verb server as its own process, drives a whole session over raw
 * pipes and returns both streams verbatim. Nothing but a real transport
 * reproduces a log line landing inside the live frame stream.
 * @returns Everything the process wrote to each stream.
 */
export function captureServerStreams(): Promise<CapturedStreams> {
  const child = spawn(
    process.execPath,
    ["--import", "tsx", join(MODULE_ROOT, "mcp", "server.ts")],
    {
      cwd: MODULE_ROOT,
      env: {
        ...process.env,
        NODE_ENV: "test",
        PROJECT_TRACKER_ACTOR: "implementer",
      },
      stdio: ["pipe", "pipe", "pipe"],
    },
  );
  return _driveSession(child);
}

/**
 * Writes the handshake once the server is ready, then collects both streams
 * until the session is closed.
 * @param child The spawned server process.
 * @returns Everything the process wrote to each stream.
 */
function _driveSession(child: ChildProcess): Promise<CapturedStreams> {
  const streams: CapturedStreams = { stdout: "", stderr: "" };
  return new Promise((resolve, reject) => {
    let handshakeSent = false;
    const finish = (): void => {
      clearTimeout(timer);
      child.kill();
      resolve(streams);
    };
    const timer = setTimeout(() => {
      child.kill();
      reject(
        new Error(
          `Server did not answer within ${SPAWN_TIMEOUT_MS}ms. stderr: ${streams.stderr}`,
        ),
      );
    }, SPAWN_TIMEOUT_MS);

    child.stdout?.on("data", chunk => {
      streams.stdout += String(chunk);
      if (streams.stdout.includes('"id":3')) finish();
    });
    child.stderr?.on("data", chunk => {
      streams.stderr += String(chunk);
      if (handshakeSent || !streams.stderr.includes(READY_LOG)) return;
      handshakeSent = true;
      for (const frame of HANDSHAKE_FRAMES) {
        child.stdin?.write(`${JSON.stringify(frame)}\n`);
      }
    });
    child.on("error", error => {
      clearTimeout(timer);
      reject(error);
    });
  });
}
