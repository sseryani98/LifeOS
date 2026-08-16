// One origin for a page that composes more than one CAP server. Cross-origin
// composition fails the $batch preflight in every profile, and an absolute
// dataSource URI crashes CAP at boot — so the manifests keep their relative
// /service/... URIs and this fronts both processes on a single port.
// The route table is prefixes and ports, which is configuration: it names no module.
import http from "node:http";

const UPSTREAM_HOST = "127.0.0.1";
const BAD_GATEWAY = 502;

// Defaults are the documented topology; the overrides exist so a test can run
// the real script on ports nobody else is holding.
const ORIGIN_PORT = Number(process.env.ONE_ORIGIN_PORT ?? 4000);
const PREFIX = process.env.ONE_ORIGIN_PREFIX ?? "/service/trackerSvcs";
const PREFIX_PORT = Number(process.env.ONE_ORIGIN_PREFIX_PORT ?? 4005);
const DEFAULT_PORT = Number(process.env.ONE_ORIGIN_DEFAULT_PORT ?? 4004);

const server = http.createServer((request, response) => {
  const port = request.url.startsWith(PREFIX) ? PREFIX_PORT : DEFAULT_PORT;
  const upstream = http.request(
    {
      host: UPSTREAM_HOST,
      port,
      path: request.url,
      method: request.method,
      headers: request.headers,
    },
    upstreamResponse => {
      response.writeHead(upstreamResponse.statusCode, upstreamResponse.headers);
      upstreamResponse.pipe(response);
    },
  );

  upstream.on("error", () => {
    response.writeHead(BAD_GATEWAY, { "content-type": "text/plain" });
    response.end(`One-origin proxy: no upstream answering on port ${port}.\n`);
  });

  request.pipe(upstream);
});

server.listen(ORIGIN_PORT, () => {
  process.stdout.write(
    `One origin on http://localhost:${ORIGIN_PORT} — ` +
      `${PREFIX} to :${PREFIX_PORT}, everything else to :${DEFAULT_PORT}\n`,
  );
});
