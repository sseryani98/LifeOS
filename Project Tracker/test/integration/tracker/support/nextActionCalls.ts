import type cds from "@sap/cds";

import { PlanSprintVerb } from "../../../../mcp/verbs/planSprint.js";
import { ACTORS } from "../../../shared/data/world.js";
import { readStoriesOf } from "../../../shared/support/readTracker.js";
import { buildSprintPlanInput } from "../../../shared/support/verbInputs.js";

import { buildVerbContext, expectSuccess } from "./verbHarness.js";

/**
 * Plans the standard sprint with the given stories through the real verb, so
 * every position it assigns is plan_sprint's own. A rejection fails loudly.
 * @param service The connected service.
 * @param stories The stories to plan, in the order the plan supplies them.
 * @returns The planned sprint's identifier.
 */
export const planSprintWith = async (
  service: cds.Service,
  stories: { id: string; type: string; description: string; shipsUi: boolean }[],
): Promise<string> => {
  const planned = expectSuccess(
    await new PlanSprintVerb().run(
      buildVerbContext(service, ACTORS.IMPLEMENTER),
      buildSprintPlanInput(stories) as never,
    ),
  );
  return String(planned.initiativeId);
};

/**
 * Reads each story's position in a sprint, keyed by bare story identifier.
 * @param initiativeId The sprint to read.
 * @returns Every story's position.
 */
export const readStoryPositionsOf = async (
  initiativeId: string,
): Promise<Record<string, number>> => {
  const stories = await readStoriesOf(initiativeId);
  return Object.fromEntries(stories.map(story => [story.storyId, story.position]));
};
