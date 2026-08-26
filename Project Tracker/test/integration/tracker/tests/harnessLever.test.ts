import type cds from "@sap/cds";

import { readDerivedMilestoneStatus } from "../../../shared/support/readTracker.js";
import {
  clearWorld,
  seedCanonicalWorld,
  setChainStates,
} from "../../../shared/support/seedWorld.js";
import {
  connectTrackerService,
  readTypescriptLever,
  trackerServer,
} from "../../../shared/support/trackerHarness.js";
import { WHOLE_CHAIN_COMPLETE } from "../data/chainStates.js";
import { ORPHAN_DEFECT, PATHS } from "../data/writePayloads.js";
import { postExpectingRejection } from "../support/odataHarness.js";

describe("the harness lever", () => {
  let service: cds.Service;

  beforeAll(async () => {
    await trackerServer;
    service = await connectTrackerService();
  });

  /** Nothing else checks the lever, and omitting it is a silent pass rather than an error. */
  it("is set by the runner before any suite boots", () => {
    expect(readTypescriptLever()).toBe("true");
  });

  /** Both halves are the lever's own proof: generic CRUD derives no status and refuses no orphan. */
  it("has the service implementation loaded, proven by a derivation and a guard", async () => {
    await clearWorld();
    const world = await seedCanonicalWorld();
    await setChainStates(world.milestoneId, WHOLE_CHAIN_COMPLETE);

    const derived = await readDerivedMilestoneStatus(service, world.milestoneId);
    const rejected = await postExpectingRejection(PATHS.DEFECTS, {
      ...ORPHAN_DEFECT,
      workspace_ID: world.workspaceId,
    });

    expect(derived).toBe("done");
    expect(rejected.status).toBe(400);
    expect(rejected.code).toBe("tracker.defect.scopeRequired");
  });
});
