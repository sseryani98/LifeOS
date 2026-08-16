import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import type cds from "@sap/cds";

import {
  ACTORS,
  SPRINT_PLAN_WITH_BAD_TYPE,
} from "../../shared/data/world.js";
import { countAllMilestones, countInitiativesOf } from "../../shared/support/readTracker.js";
import {
  clearWorld,
  seedCanonicalWorld,
  type SeededWorld,
} from "../../shared/support/seedWorld.js";
import {
  connectTrackerService,
  trackerServer,
} from "../../shared/support/trackerHarness.js";
import { buildSprintPlanInput } from "../../shared/support/verbInputs.js";
import { EXPECTED_TOOLS, FORBIDDEN_TOOLS } from "../data/toolSurface.js";
import { connectInMemoryClient } from "../support/mcpHarness.js";

describe("the exposed tool surface", () => {
  let service: cds.Service;
  let client: Client;
  let world: SeededWorld;

  beforeAll(async () => {
    await trackerServer;
    service = await connectTrackerService();
    client = await connectInMemoryClient(service, ACTORS.IMPLEMENTER);
  });

  beforeEach(async () => {
    await clearWorld();
    world = await seedCanonicalWorld();
  });

  /** The list is the escape hatch's absence made visible; a twelfth tool is a second write path. */
  it("advertises exactly the eleven verbs and no generic data tool", async () => {
    const listed = await client.listTools();
    const names = listed.tools.map(tool => tool.name);

    expect(names).toHaveLength(EXPECTED_TOOLS.length);
    expect(names.sort()).toEqual([...EXPECTED_TOOLS].sort());
    for (const forbidden of FORBIDDEN_TOOLS) {
      expect(names).not.toContain(forbidden);
    }
  });

  /** A value outside the code list must be refused before the verb runs, or a partial sprint lands. */
  it("refuses a story typed outside the code list at the boundary", async () => {
    const before = await countAllMilestones();

    const result = await client.callTool({
      name: "plan_sprint",
      arguments: buildSprintPlanInput([...SPRINT_PLAN_WITH_BAD_TYPE.stories]),
    });

    expect(result.isError).toBe(true);
    expect(await countInitiativesOf(world.workspaceId)).toBe(1);
    expect(await countAllMilestones()).toBe(before);
  });
});
