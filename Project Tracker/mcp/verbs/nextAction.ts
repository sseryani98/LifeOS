import { z } from "zod";

import { runReadVerb } from "./shared/runVerb.js";
import { resolveNextAction, resolveStoryContext } from "./shared/stageGuards.js";
import type { TrackerGateway } from "./shared/trackerGateway.js";
import type {
  NextAction,
  VerbContext,
  VerbDefinition,
  VerbResult,
} from "./shared/types.js";

/** The tool schema, as the transport advertises it. */
export const inputShape = {
  story: z
    .string()
    .optional()
    .describe("Story reference; omit to let the store choose the story"),
};

interface NextActionInput {
  story?: string;
}

/**
 * Answers what to do next. Null is a success rather than an error: it means no
 * incomplete stage remains in scope.
 * @param ctx The connected service and the calling agent's identity.
 * @param input The story to resolve within, if the caller names one.
 * @returns The success or failure envelope, carrying the next action.
 */
export async function nextAction(
  ctx: VerbContext,
  input: NextActionInput,
): Promise<VerbResult> {
  return runReadVerb(ctx, async gateway => {
    if (input.story?.trim()) {
      const { milestone } = await resolveStoryContext(gateway, input.story);
      const chain = await gateway.readChain(milestone.ID);
      return { nextAction: resolveNextAction(chain, milestone.storyId) };
    }
    return { nextAction: await _selectCandidateAction(gateway) };
  });
}

/**
 * Selects a story before resolving within it, in sprint then story position
 * order, and answers with the first story that still has work in it.
 * @param gateway The gateway the reads run through.
 * @returns The next action, or null when nothing is incomplete anywhere.
 */
async function _selectCandidateAction(
  gateway: TrackerGateway,
): Promise<NextAction | null> {
  for (const workspace of await gateway.readWorkspaces()) {
    for (const milestone of await gateway.readMilestones(workspace.ID)) {
      const chain = await gateway.readChain(milestone.ID);
      const resolved = resolveNextAction(chain, milestone.storyId);
      if (resolved) return resolved;
    }
  }
  return null;
}

/** The registered tool behind this verb. */
export const definition: VerbDefinition = {
  name: "next_action",
  title: "Next action",
  description: "Resolve the next incomplete stage, for one story or overall.",
  inputShape,
  readOnly: true,
  run: (ctx, input) => nextAction(ctx, input as NextActionInput),
};
