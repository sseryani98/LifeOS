import { spawn, type ChildProcess } from "node:child_process";
import { createServer, request, type Server } from "node:http";
import { join } from "node:path";

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

/**
 * Starts a trivial origin that answers every request with one marker string.
 * @param port Port to bind.
 * @param marker Body every response carries.
 * @returns The listening server, once it is accepting connections.
 */
export function startMarkerOrigin(
  port: number,
  marker: string,
): Promise<Server> {
  const server = createServer((_unused, response) => {
    response.writeHead(200, { "content-type": "text/plain" });
    response.end(marker);
  });
  return new Promise(resolve => {
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
    const timer = setTimeout(() => {
      reject(
        new Error(`Proxy did not report ready within ${STARTUP_TIMEOUT_MS}ms`),
      );
    }, STARTUP_TIMEOUT_MS);

    child.stdout.on("data", chunk => {
      if (String(chunk).includes(READY_MARKER)) {
        clearTimeout(timer);
        resolve(child);
      }
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
 * Issues a GET through the proxy and collects the whole response.
 * @param port Proxy port to call.
 * @param path Request path.
 * @returns The status code and body text the proxy returned.
 */
export function readThroughProxy(
  port: number,
  path: string,
): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const call = request(
      { host: LOCALHOST, port, path, method: "GET" },
      response => {
        let body = "";
        response.setEncoding("utf8");
        response.on("data", chunk => {
          body += chunk;
        });
        response.on("end", () =>
          resolve({ status: response.statusCode ?? 0, body }),
        );
      },
    );
    call.on("error", reject);
    call.end();
  });
}
