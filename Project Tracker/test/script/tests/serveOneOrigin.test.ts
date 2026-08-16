import type { ChildProcess } from "node:child_process";
import type { Server } from "node:http";

import {
  DEAD_ORIGIN_PORTS,
  ORIGIN_MARKERS,
  ORIGIN_PORTS,
  ORIGIN_ROUTES,
  PROXY_STATUS,
} from "../data/oneOriginRoutes.js";
import {
  readThroughProxy,
  startMarkerOrigin,
  startOneOriginProxy,
  stopMarkerOrigin,
  stopOneOriginProxy,
} from "../support/originHarness.js";

describe("serveOneOrigin routing", () => {
  let proxy: ChildProcess;
  let prefixOrigin: Server;
  let defaultOrigin: Server;

  beforeAll(async () => {
    prefixOrigin = await startMarkerOrigin(
      ORIGIN_PORTS.PREFIX_UPSTREAM,
      ORIGIN_MARKERS.PREFIX_UPSTREAM,
    );
    defaultOrigin = await startMarkerOrigin(
      ORIGIN_PORTS.DEFAULT_UPSTREAM,
      ORIGIN_MARKERS.DEFAULT_UPSTREAM,
    );
    proxy = await startOneOriginProxy(ORIGIN_PORTS, ORIGIN_ROUTES.PREFIX);
  });

  afterAll(async () => {
    await stopOneOriginProxy(proxy);
    await stopMarkerOrigin(prefixOrigin);
    await stopMarkerOrigin(defaultOrigin);
  });

  /** The service prefix must reach the second server, or every OData call answers from the wrong process. */
  it("sends a prefixed path to the prefixed upstream", async () => {
    const response = await readThroughProxy(
      ORIGIN_PORTS.PROXY,
      ORIGIN_ROUTES.PREFIXED_PATH,
    );

    expect(response.status).toBe(PROXY_STATUS.OK);
    expect(response.body).toBe(ORIGIN_MARKERS.PREFIX_UPSTREAM);
  });

  /** Everything outside the prefix must fall through, or the shell page and its components never load. */
  it("sends every other path to the default upstream", async () => {
    const response = await readThroughProxy(
      ORIGIN_PORTS.PROXY,
      ORIGIN_ROUTES.UNPREFIXED_PATH,
    );

    expect(response.status).toBe(PROXY_STATUS.OK);
    expect(response.body).toBe(ORIGIN_MARKERS.DEFAULT_UPSTREAM);
  });
});

describe("serveOneOrigin with no upstream listening", () => {
  let proxy: ChildProcess;

  beforeAll(async () => {
    proxy = await startOneOriginProxy(DEAD_ORIGIN_PORTS, ORIGIN_ROUTES.PREFIX);
  });

  afterAll(async () => {
    await stopOneOriginProxy(proxy);
  });

  /** A dead upstream must name its port, or a blank page is indistinguishable from a routing bug. */
  it("answers a bad gateway naming the port it could not reach", async () => {
    const response = await readThroughProxy(
      DEAD_ORIGIN_PORTS.PROXY,
      ORIGIN_ROUTES.PREFIXED_PATH,
    );

    expect(response.status).toBe(PROXY_STATUS.BAD_GATEWAY);
    expect(response.body).toContain(String(DEAD_ORIGIN_PORTS.PREFIX_UPSTREAM));
  });
});
