import { spawn, type ChildProcess } from "node:child_process";
import { join } from "node:path";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type cds from "@sap/cds";

import { TrackerMcpServer } from "../../../mcp/server.js";
import { LAUNCH } from "../../shared/data/launch.js";
import {
  CLIENT_INFO,
  CONNECTION_FAILURE,
  HANDSHAKE_FRAMES,
  READY_LOG,
  SPAWN_TIMEOUT_MS,
} from "../data/toolSurface.js";

/** The module root, and the server entry point inside it. */
const MODULE_ROOT = join(__dirname, "..", "..", "..");

/**
 * Where a client starts the server: Claude Code spawns it from the project it
 * is open in, which is the repo, not the module. Spawning from the module root
 * is what hid a server that could not find its own CAP project.
 */
const CLIENT_CWD = join(MODULE_ROOT, "..");

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
export const connectInMemoryClient = async (
  service: cds.Service,
  actor: string,
): Promise<Client> => {
  return connectClientTo(TrackerMcpServer.createServer({ service, actor }));
};

/**
 * Connects a client to an already-built server over a linked transport pair, so
 * a suite can supply its own context and reconnect hook.
 * @param server The server to bind.
 * @returns The connected client.
 */
export const connectClientTo = async (server: McpServer): Promise<Client> => {
  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);
  const client = new Client(CLIENT_INFO);
  await client.connect(clientTransport);
  return client;
};

/**
 * Reads the verb envelope a tool result carries. The transport hands back text,
 * so the contract a caller acts on is only visible once it is parsed.
 * @param result Whatever the client's callTool resolved with.
 * @returns The parsed envelope.
 */
export const readToolEnvelope = (result: unknown): Record<string, unknown> => {
  const content = (result as { content?: { text?: string }[] }).content ?? [];
  return JSON.parse(content[0]?.text ?? "") as Record<string, unknown>;
};

/**
 * Reads the code list a tool's advertised schema declares for one member of an
 * array property, so an assertion can name the values rather than the flag a
 * rejection sets.
 * @param tool The listed tool.
 * @param property The array property on the tool's input schema.
 * @param member The member of that array's items.
 * @returns The declared values, or an empty list when none are declared.
 */
export const readSchemaEnum = (
  tool: unknown,
  property: string,
  member?: string,
): string[] => {
  const schema =
    (tool as { inputSchema?: Record<string, unknown> } | undefined)
      ?.inputSchema ?? {};
  const properties = schema.properties as
    | Record<
        string,
        {
          enum?: string[];
          items?: { properties?: Record<string, { enum?: string[] }> };
        }
      >
    | undefined;
  const declared = properties?.[property];
  if (!member) return declared?.enum ?? [];
  return declared?.items?.properties?.[member]?.enum ?? [];
};

/**
 * Reads the minimum length an advertised schema declares on one array parameter.
 * @param tool The tool as `tools/list` returned it.
 * @param property The array parameter to read.
 * @returns The declared `minItems`, or undefined when none is declared.
 */
export const readSchemaMinItems = (
  tool: unknown,
  property: string,
): number | undefined => {
  const schema =
    (tool as { inputSchema?: Record<string, unknown> } | undefined)
      ?.inputSchema ?? {};
  const properties = schema.properties as
    | Record<string, { minItems?: number }>
    | undefined;
  return properties?.[property]?.minItems;
};

/**
 * Reads the floor an advertised schema declares on one member of an object
 * parameter.
 * @param tool The tool as `tools/list` returned it.
 * @param property The object parameter to read.
 * @param member The member of that object whose floor is wanted.
 * @returns The declared minimum, or undefined when none is declared.
 */
export const readSchemaMinimum = (
  tool: unknown,
  property: string,
  member: string,
): number | undefined => {
  const schema =
    (tool as { inputSchema?: Record<string, unknown> } | undefined)
      ?.inputSchema ?? {};
  const properties = schema.properties as
    | Record<string, { properties?: Record<string, { minimum?: number }> }>
    | undefined;
  return properties?.[property]?.properties?.[member]?.minimum;
};

/**
 * Builds a stand-in service whose first transaction dies as a lost connection
 * and whose second answers, so the reconnect-and-retry path has a fault to
 * recover from.
 * @param outcome What the second transaction hands back.
 * @returns The service, and how many transactions it has been asked for.
 */
export const buildFlakyService = (outcome: unknown): {
  service: cds.Service;
  attempts: () => number;
} => {
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
};

/**
 * Spawns the verb server as its own process, drives a whole session over raw
 * pipes and returns both streams verbatim. Nothing but a real transport
 * reproduces a log line landing inside the live frame stream.
 * @returns Everything the process wrote to each stream.
 */
export const captureServerStreams = (): Promise<CapturedStreams> => {
  // Same flags and entry point the installer registers (test/shared/data/
  // launch.ts). This spawns the running interpreter rather than resolving
  // "node" off PATH, so the child is direct and kill() reaches it.
  const child = spawn(
    process.execPath,
    [...LAUNCH.ARGS, join(MODULE_ROOT, ...LAUNCH.ENTRY)],
    {
      cwd: CLIENT_CWD,
      env: {
        ...process.env,
        NODE_ENV: "test",
        PROJECT_TRACKER_ACTOR: "implementer",
      },
      stdio: ["pipe", "pipe", "pipe"],
    },
  );
  return _driveSession(child);
};

/**
 * Spawns the server, waits for it to be ready, then closes its stdin and
 * reports whether the process ended on its own. Closing stdin is the spec's
 * primary and only portable shutdown signal, and every other test here kills
 * the child instead — so nothing else would notice it stopped working.
 * @param graceMs How long the process gets to exit before it is killed.
 * @returns Whether it exited unaided, and its code once it did.
 */
export const captureStdinShutdown = (
  graceMs: number,
): Promise<{ exited: boolean; code: number | null }> => {
  const child = spawn(
    process.execPath,
    [...LAUNCH.ARGS, join(MODULE_ROOT, ...LAUNCH.ENTRY)],
    {
      cwd: CLIENT_CWD,
      env: {
        ...process.env,
        NODE_ENV: "test",
        PROJECT_TRACKER_ACTOR: "implementer",
      },
      stdio: ["pipe", "pipe", "pipe"],
    },
  );
  return new Promise(resolve => {
    let ready = false;
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill();
      resolve({ exited: false, code: null });
    }, graceMs);
    child.stderr?.on("data", chunk => {
      stderr += String(chunk);
      if (ready || !stderr.includes(READY_LOG)) return;
      ready = true;
      child.stdin?.end();
    });
    child.on("exit", code => {
      clearTimeout(timer);
      resolve({ exited: ready, code });
    });
  });
};

/**
 * Writes the handshake once the server is ready, then collects both streams
 * until the session is closed.
 * @param child The spawned server process.
 * @returns Everything the process wrote to each stream.
 */
const _driveSession = (child: ChildProcess): Promise<CapturedStreams> => {
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
      // Parsed, not matched as a substring: a payload containing the literal
      // '"id":3' would otherwise cut the stream short, and the purity
      // assertion would then run against a truncated capture and pass.
      if (_hasFrame(streams.stdout, _lastFrameId())) finish();
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
      // Without this the failed run leaves the process behind, and the suite
      // exits holding a handle it never released.
      child.kill();
      reject(error);
    });
  });
};

/**
 * The id of the last request the handshake sends, which is the frame whose
 * answer means the session is done.
 * @returns The id to wait for.
 */
const _lastFrameId = (): number => {
  const ids = HANDSHAKE_FRAMES.map(frame =>
    "id" in frame ? (frame.id as number) : 0,
  );
  return Math.max(...ids);
};

/**
 * Reports whether a parseable response to one request id has arrived. Partial
 * trailing output is expected mid-stream and is not an error here.
 * @param stdout Everything collected from the stream so far.
 * @param id The request id to look for.
 * @returns True once a frame carrying that id has been received whole.
 */
const _hasFrame = (stdout: string, id: number): boolean => {
  return stdout
    .split("\n")
    .filter(line => line.trim())
    .some(line => {
      try {
        return (JSON.parse(line) as { id?: number }).id === id;
      } catch {
        return false;
      }
    });
};
