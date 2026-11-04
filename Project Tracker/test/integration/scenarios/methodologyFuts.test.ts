import type { Client } from "@modelcontextprotocol/sdk/client/index.js";

import { connectInMemoryClient } from "../../protocol/support/mcpHarness.js";
import { ACTORS } from "../../shared/data/world.js";
import {
  clearWorld,
  seedCanonicalWorld,
} from "../../shared/support/seedWorld.js";
import {
  connectTrackerService,
  trackerServer,
} from "../../shared/support/trackerHarness.js";
import { buildSprintPlanInput } from "../../shared/support/verbInputs.js";
import { STAGE } from "../tracker/data/chainStates.js";
import {
  CODES_FROZEN_EARLIER,
  EXPECTED_STAGE_STEPS,
  EXPECTED_SUBTASK_STEPS,
} from "../tracker/data/seededLibrary.js";
import { PLANNED_UI_STORY_REFERENCE } from "../tracker/data/writePayloads.js";
import { readLibrarySteps } from "../tracker/support/libraryAccess.js";
import { METHODOLOGY_FUT, TOOL } from "./data/functionalUnits.js";
import { callTool, driveTool, outcomeOf } from "./support/futHarness.js";

/**
 * The methodology library's functional units, executed through a real client
 * over the advertised tools. Kept apart from the verb-layer units so each file
 * changes for one spec's reasons only.
 */
describe("the methodology library's functional units", () => {
  let client: Client;

  beforeAll(async () => {
    await trackerServer;
    const service = await connectTrackerService();
    client = await connectInMemoryClient(service, ACTORS.IMPLEMENTER);
  });

  beforeEach(async () => {
    await clearWorld();
    await seedCanonicalWorld();
  });

  /** Every seeded code must be addressable, or a verb answers "no such stage" for a step the methodology says exists. */
  it(`${METHODOLOGY_FUT.SEEDED_CODES_ADDRESSABLE} resolves every seeded code through the verbs`, async () => {
    await driveTool(client, TOOL.PLAN_SPRINT, buildSprintPlanInput());

    const outcomes: { code: string; outcome: string }[] = [];
    for (const stage of EXPECTED_STAGE_STEPS) {
      const { envelope } = await callTool(client, TOOL.START_STAGE, {
        story: PLANNED_UI_STORY_REFERENCE,
        stage: stage.code,
      });
      outcomes.push({ code: stage.code, outcome: outcomeOf(envelope) });
    }
    for (const step of EXPECTED_SUBTASK_STEPS) {
      const { envelope } = await callTool(client, TOOL.COMPLETE_SUBTASK, {
        story: PLANNED_UI_STORY_REFERENCE,
        stage: STAGE.BUILD,
        subtask: step.code,
      });
      outcomes.push({ code: step.code, outcome: outcomeOf(envelope) });
    }
    const seededCodes = (await readLibrarySteps()).map(step => step.code);

    expect(
      outcomes.filter(entry => !/^(ok|wfl\.)/.test(entry.outcome)),
    ).toEqual([]);
    for (const code of CODES_FROZEN_EARLIER)
      expect(seededCodes).toContain(code);
  });
});
