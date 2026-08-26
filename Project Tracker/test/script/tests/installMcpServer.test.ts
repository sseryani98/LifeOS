import {
  FOREIGN_REGISTRY,
  REGISTRY_ENV,
  REGISTRY_KEYS,
} from "../data/mcpRegistry.js";
import {
  makeRegistryPath,
  readRegistry,
  runInstaller,
  seedRegistry,
} from "../support/registryHarness.js";

describe("installMcpServer", () => {
  /** The registry is shared repo-root state; overwriting it drops every other module's server. */
  it("keeps another module's server when it writes its own", async () => {
    const path = makeRegistryPath();
    seedRegistry(path, FOREIGN_REGISTRY);

    await runInstaller(path);
    const registry = readRegistry(path);

    expect(Object.keys(registry.mcpServers).sort()).toEqual([
      REGISTRY_KEYS.FOREIGN,
      REGISTRY_KEYS.TRACKER,
    ]);
    expect(registry.mcpServers[REGISTRY_KEYS.FOREIGN]).toEqual(
      FOREIGN_REGISTRY.mcpServers.playwright,
    );
  });

  /** The file is gitignored, so a fresh clone has none and the installer has to create one. */
  it("creates the registration file holding just its own entry", async () => {
    const path = makeRegistryPath();

    await runInstaller(path);
    const registry = readRegistry(path);

    expect(Object.keys(registry.mcpServers)).toEqual([REGISTRY_KEYS.TRACKER]);
    expect(registry.mcpServers[REGISTRY_KEYS.TRACKER].args).toHaveLength(2);
  });

  /** A registration that declares no actor registers a server whose every verb is refused. */
  it("writes the actor the environment declared into the registration", async () => {
    const path = makeRegistryPath();

    await runInstaller(path, REGISTRY_ENV.ACTOR_VALUE);
    const registry = readRegistry(path);

    expect(registry.mcpServers[REGISTRY_KEYS.TRACKER].env).toEqual({
      [REGISTRY_ENV.ACTOR]: REGISTRY_ENV.ACTOR_VALUE,
    });
  });
});
