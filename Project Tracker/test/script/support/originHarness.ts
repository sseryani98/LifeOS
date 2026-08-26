import { spawn, type ChildProcess } from "node:child_process";
import { createServer, request, type Server } from "node:http";
import { join } from "node:path";

import { PROXY_REQUEST, PROXY_STATUS } from "../data/oneOriginRoutes.js";

/**
 * The script under test is the tracked, shared one — the suite drives the real
 * entry point rather than a copy, which is the only way a script-tier test says
 * anything about what `node …` will do.
 */
const PROXY_SCRIPT = join(
  __dirname,
  "..",
  "..",
  "..",
  "..",
  "Standards (Technical + Linting)",
  "scripts",
  "serveOneOrigin.mjs",
);

const READY_MARKER = "One origin on";
const STARTUP_TIMEOUT_MS = 10_000;
const LOCALHOST = "127.0.0.1";

interface OriginPorts {
  readonly PROXY: number;
  readonly PREFIX_UPSTREAM: number;
  readonly DEFAULT_UPSTREAM: number;
}

/** What a caller may vary about a request the proxy has to carry through. */
export interface ProxyRequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
}

/** What a marker origin reports back about the request it received. */
export interface OriginEcho {
  marker: string;
  method: string;
  csrf: string | null;
  body: string;
}

/**
 * Starts a trivial origin that echoes the request it received back as JSON, so
 * an assertion can see the method, the CSRF header and the body that arrived.
 * @param port Port to bind.
 * @param marker Value identifying this origin in every echo.
 * @param errorPath Path this origin answers with an upstream error, if any.
 * @returns The listening server, once it is accepting connections.
 */
export function startMarkerOrigin(
  port: number,
  marker: string,
  errorPath?: string,
): Promise<Server> {
  const server = createServer((incoming, response) => {
    let body = "";
    incoming.setEncoding("utf8");
    incoming.on("data", chunk => {
      body += String(chunk);
    });
    incoming.on("end", () => {
      const echo: OriginEcho = {
        marker,
        method: incoming.method ?? "",
        csrf: _readCsrfHeader(incoming.headers),
        body,
      };
      const status =
        incoming.url === errorPath
          ? PROXY_STATUS.UPSTREAM_ERROR
          : PROXY_STATUS.OK;
      response.writeHead(status, { "content-type": "application/json" });
      response.end(JSON.stringify(echo));
    });
  });
  return new Promise((resolve, reject) => {
    // Without this a held port emits an unhandled 'error' on the Server and the
    // promise never settles, so the suite dies at the runner timeout instead.
    server.once("error", reject);
    server.listen(port, LOCALHOST, () => resolve(server));
  });
}

/**
 * Stops an origin started by startMarkerOrigin.
 * @param server The server to close.
 * @returns Resolves once the port is released.
 */
export function stopMarkerOrigin(server: Server): Promise<void> {
  return new Promise(resolve => {
    server.close(() => resolve());
  });
}

/**
 * Spawns the real proxy script bound to the harness ports and waits for the
 * line it prints once it is listening.
 * @param ports Proxy port plus the two upstream ports it routes between.
 * @param prefix Path prefix routed to the prefixed upstream.
 * @returns The running child process.
 */
export function startOneOriginProxy(
  ports: OriginPorts,
  prefix: string,
): Promise<ChildProcess> {
  const child = spawn(process.execPath, [PROXY_SCRIPT], {
    env: {
      ...process.env,
      ONE_ORIGIN_PORT: String(ports.PROXY),
      ONE_ORIGIN_PREFIX: prefix,
      ONE_ORIGIN_PREFIX_PORT: String(ports.PREFIX_UPSTREAM),
      ONE_ORIGIN_DEFAULT_PORT: String(ports.DEFAULT_UPSTREAM),
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  return new Promise((resolve, reject) => {
    // The child's stderr is piped, so a startup crash lands on a stream nobody
    // reads unless it is collected here and quoted in the rejection.
    let stderr = "";
    const timer = setTimeout(() => {
      reject(
        new Error(
          `Proxy did not report ready within ${STARTUP_TIMEOUT_MS}ms. stderr: ${stderr}`,
        ),
      );
    }, STARTUP_TIMEOUT_MS);

    child.stderr.on("data", chunk => {
      stderr += String(chunk);
    });
    child.stdout.on("data", chunk => {
      if (String(chunk).includes(READY_MARKER)) {
        clearTimeout(timer);
        resolve(child);
      }
    });
    child.once("exit", code => {
      clearTimeout(timer);
      reject(new Error(`Proxy exited ${code}: ${stderr}`));
    });
    child.on("error", error => {
      clearTimeout(timer);
      reject(error);
    });
  });
}

/**
 * Stops a proxy started by startOneOriginProxy.
 * @param child The running proxy process.
 * @returns Resolves once the process has exited.
 */
export function stopOneOriginProxy(child: ChildProcess): Promise<void> {
  return new Promise(resolve => {
    child.once("exit", () => resolve());
    child.kill();
  });
}

/**
 * Issues a request through the proxy and collects the whole response.
 * @param port Proxy port to call.
 * @param path Request path.
 * @param options Method, headers and body the proxy has to carry upstream.
 * @returns The status code and body text the proxy returned.
 */
export function readThroughProxy(
  port: number,
  path: string,
  options: ProxyRequestOptions = {},
): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const call = request(
      {
        host: LOCALHOST,
        port,
        path,
        method: options.method ?? "GET",
        headers: options.headers ?? {},
      },
      response => {
        let body = "";
        response.setEncoding("utf8");
        response.on("data", chunk => {
          body += String(chunk);
        });
        response.on("end", () =>
          resolve({ status: response.statusCode ?? 0, body }),
        );
      },
    );
    call.on("error", reject);
    call.end(options.body);
  });
}

/**
 * Issues a request through the proxy and reads the origin's echo of it.
 * @param port Proxy port to call.
 * @param path Request path.
 * @param options Method, headers and body the proxy has to carry upstream.
 * @returns The relayed status and what the origin saw arrive.
 */
export async function echoThroughProxy(
  port: number,
  path: string,
  options: ProxyRequestOptions = {},
): Promise<{ status: number; echo: OriginEcho }> {
  const response = await readThroughProxy(port, path, options);
  return {
    status: response.status,
    echo: JSON.parse(response.body) as OriginEcho,
  };
}

/**
 * Reads the CSRF token off an inbound request's headers.
 * @param headers The headers the origin received.
 * @returns The token, or null when the request carried none.
 */
function _readCsrfHeader(headers: NodeJS.Dict<string | string[]>): string | null {
  const value = headers[PROXY_REQUEST.CSRF_HEADER];
  if (value === undefined) return null;
  return Array.isArray(value) ? value.join(",") : value;
}
