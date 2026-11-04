import type cds from "@sap/cds";

import { STORY_REFERENCE } from "../../../shared/data/world.js";
import {
  readDerivedMilestoneStatus,
  readTaskByCode,
} from "../../../shared/support/readTracker.js";
import {
  clearWorld,
  seedCanonicalWorld,
  type SeededWorld,
} from "../../../shared/support/seedWorld.js";
import {
  connectTrackerService,
  trackerServer,
} from "../../../shared/support/trackerHarness.js";
import { DERIVED_STATUS_SEQUENCE, FULL_CHAIN_SCRIPT } from "../data/chainScripts.js";
import { STAGE } from "../data/chainStates.js";
import { collapseRepeatedReadings, driveChainStep } from "../support/driveChain.js";
import { readStoredMilestone } from "../support/readChain.js";

describe("the derived story status, end to end", () => {
  let service: cds.Service;
  let world: SeededWorld;

  beforeAll(async () => {
    await trackerServer;
    service = await connectTrackerService();
  });

  beforeEach(async () => {
    await clearWorld();
    world = await seedCanonicalWorld();
  });

  /** Status is derived from the chain alone, so it must move forward exactly once per transition as the verbs run it. */
  it("moves Backlog to In Progress to Done as the chain runs, with documentation never started", async () => {
    const readings = [await readDerivedMilestoneStatus(service, world.milestoneId)];

    for (const step of FULL_CHAIN_SCRIPT) {
      await driveChainStep(service, STORY_REFERENCE, step);
      readings.push(await readDerivedMilestoneStatus(service, world.milestoneId));
    }
    const documentation = await readTaskByCode(world.milestoneId, STAGE.DOCUMENTATION);

    expect(readings[0]).toBe("backlog");
    expect(readings[1]).toBe("inProgress");
    expect(collapseRepeatedReadings(readings)).toEqual([...DERIVED_STATUS_SEQUENCE]);
    expect(documentation.status_code).toBe("notStarted");
  });

  /** No verb may write a story's status; a stored or touched row would be a second source of truth that drifts. */
  it("never writes the story row while the whole chain runs", async () => {
    const before = await readStoredMilestone(world.milestoneId);

    for (const step of FULL_CHAIN_SCRIPT) {
      await driveChainStep(service, STORY_REFERENCE, step);
    }
    const after = await readStoredMilestone(world.milestoneId);

    expect(Object.keys(after)).not.toContain("status");
    expect(after.modifiedAt).toEqual(before.modifiedAt);
    expect(after).toEqual(before);
  });
});
