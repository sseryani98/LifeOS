import type cds from "@sap/cds";

import { ACTORS, STORY_REFERENCE } from "../../../shared/data/world.js";
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
import { CODE_QUALITY_COMPLETE, STAGE } from "../data/chainStates.js";
import {
  buildVerbContext,
  expectFailure,
} from "../support/verbHarness.js";
import { completeStage } from "../../../../mcp/verbs/completeStage.js";

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

  /** With the lever missing the handlers never register, so this rejection is the lever's own proof. */
  it("has the service implementation loaded, proven by a handler that fires", async () => {
    await clearWorld();
    const world = await seedCanonicalWorld();
    await setChainStates(world.milestoneId, CODE_QUALITY_COMPLETE);

    const result = expectFailure(
      await completeStage(buildVerbContext(service, ACTORS.IMPLEMENTER), {
        story: STORY_REFERENCE,
        stage: STAGE.CODE_QUALITY,
      }),
    );

    expect(result.code).toBe("verb.stage.alreadyComplete");
  });
});
