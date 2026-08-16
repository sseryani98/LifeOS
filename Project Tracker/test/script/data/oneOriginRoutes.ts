/**
 * Ports the harness binds. Deliberately not the documented 4000/4004/4005 — a
 * suite that fights a running dev server for a port fails for a reason that has
 * nothing to do with the routing it is asserting.
 */
export const ORIGIN_PORTS = {
  PROXY: 14000,
  PREFIX_UPSTREAM: 14005,
  DEFAULT_UPSTREAM: 14004,
} as const;

/** A second, disjoint set so the dead-upstream case never collides with the live one. */
export const DEAD_ORIGIN_PORTS = {
  PROXY: 14100,
  PREFIX_UPSTREAM: 14105,
  DEFAULT_UPSTREAM: 14104,
} as const;

/** The prefix under test and one path either side of it. */
export const ORIGIN_ROUTES = {
  PREFIX: "/service/trackerSvcs",
  PREFIXED_PATH: "/service/trackerSvcs/$metadata",
  UNPREFIXED_PATH: "/index.html",
} as const;

/** Each stub origin answers with its own marker, so a body proves which one replied. */
export const ORIGIN_MARKERS = {
  PREFIX_UPSTREAM: "prefix-upstream-answered",
  DEFAULT_UPSTREAM: "default-upstream-answered",
} as const;

export const PROXY_STATUS = {
  OK: 200,
  BAD_GATEWAY: 502,
} as const;
