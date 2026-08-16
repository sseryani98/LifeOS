import { z } from "zod";

import { CODES } from "../../srv/modules/shared/constants.js";

import { buildActivityTarget } from "./shared/addressing.js";
import { ACTIVITY_KINDS } from "./shared/constants.js";
import { runWriteVerb } from "./shared/runVerb.js";
import { toSecondPrecision } from "./shared/writeQueue.js";
import {
  resolveNextAction,
  resolveStage,
  resolveStoryContext,
  resolveSubtask,
} from "./shared/stageGuards.js";
import type {
  VerbContext,
  VerbDefinition,
  VerbResult,
} from "./shared/types.js";

/** The tool schema, as the transport advertises it. */
export const inputShape = {
  story: z.string().describe("Story reference, as {workspace-slug}/{story-id}"),
  stage: z.string().describe("Methodology stage code the step hangs off"),
  subtask: z.string().describe("Workflow step code, such as handoff"),
};

interface CompleteSubtaskInput {
  story: string;
  stage: string;
  subtask: string;
}

/**
 * Completes one workflow step inside a stage.
 * @param ctx The connected service and the calling agent's identity.
 * @param input The story, its stage, and the step to close.
 * @returns The success or failure envelope.
 */
export async function completeSubtask(
  ctx: VerbContext,
  input: CompleteSubtaskInput,
): Promise<VerbResult> {
  return runWriteVerb(ctx, async (gateway, timestamp) => {
    const { workspace, milestone } = await resolveStoryContext(
      gateway,
      input.story,
    );
    const chain = await gateway.readChain(milestone.ID);
    const task = resolveStage(chain, input.stage);
    const subtask = resolveSubtask(
      await gateway.readSubtasks(task.ID),
      input.subtask,
    );
    await gateway.updateSubtask(subtask.ID, {
      status_code: CODES.SUBTASK_STATUS.COMPLETE,
      completedAt: toSecondPrecision(timestamp),
    });
    await gateway.insertActivity(
      {
        kind: ACTIVITY_KINDS.SUBTASK_COMPLETED,
        target: buildActivityTarget(
          workspace.slug,
          milestone.storyId,
          task.step_code,
        ),
        workspaceId: workspace.ID,
        payload: { subtask: subtask.step_code },
      },
      ctx.actor,
      timestamp,
    );
    return { nextAction: resolveNextAction(chain, milestone.storyId) };
  });
}

/** The registered tool behind this verb. */
export const definition: VerbDefinition = {
  name: "complete_subtask",
  title: "Complete step",
  description: "Complete one workflow step inside a methodology stage.",
  inputShape,
  readOnly: false,
  run: (ctx, input) => completeSubtask(ctx, input as CompleteSubtaskInput),
};
