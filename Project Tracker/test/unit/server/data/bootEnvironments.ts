/** The two database bindings the boot path branches on, as `cds.env` carries them. */
export const BOOT_ENVIRONMENTS = {
  POSTGRES: {
    requires: { db: { kind: "postgres", credentials: { database: "project_tracker" } } },
  },
  IN_MEMORY: {
    requires: { db: { kind: "sqlite", credentials: { url: ":memory:" } } },
  },
} as const;

/** What `cds.load("*")` hands back: a CSN, recognisable by its definitions. */
export const LOADED_MODEL = { definitions: { TrackerService: { kind: "service" } } };

/** The boot calls, in order, each connect tagged with whether `cds.model` was set. */
export const EXPECTED_BOOT = {
  POSTGRES: ["load", "connect:db:withModel", "serve:all"],
  IN_MEMORY: ["load", "connect:db:withModel", "deploy", "serve:all"],
} as const;
