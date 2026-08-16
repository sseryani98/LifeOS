import { z } from "zod";

import { CODES } from "../../srv/modules/shared/constants.js";

import { buildActivityTarget } from "./shared/addressing.js";
import { ACTIVITY_KINDS } from "./shared/constants.js";
import { runWriteVerb } from "./shared/runVerb.js";
import { toSecondPrecision } from "./shared/writeQueue.js";
import {
  assertStageNotBlocked,
  assertStageNotComplete,
  resolveNextAction,
  resolveStage,
  resolveStoryContext,
} from "./shared/stageGuards.js";
import type {
  VerbContext,
  VerbDefinition,
  VerbResult,
} from "./shared/types.js";

/** The tool schema, as the transport advertises it. */
export const inputShape = {
  story: z.string().describe("Story reference, as {workspace-slug}/{story-id}"),
  stage: z.string().describe("Methodology stage code, such as code-quality"),
};

interface StartStageInput {
  story: string;
  stage: string;
}

/**
 * Puts a methodology stage in progress.
 * @param ctx The connected service and the calling agent's identity.
 * @param input The story and the stage to start.
 * @returns The success or failure envelope.
 */
export async function startStage(
  ctx: VerbContext,
  input: StartStageInput,
): Promise<VerbResult> {
  return runWriteVerb(ctx, async (gateway, timestamp) => {
    const { workspace, milestone } = await resolveStoryContext(
      gateway,
      input.story,
    );
    const chain = await gateway.readChain(milestone.ID);
    const task = resolveStage(chain, input.stage);
    assertStageNotBlocked(chain, task);
    assertStageNotComplete(task);
    await gateway.updateTask(task.ID, {
      status_code: CODES.TASK_STATUS.IN_PROGRESS,
      startedAt: toSecondPrecision(timestamp),
    });
    await gateway.insertActivity(
      {
        kind: ACTIVITY_KINDS.STAGE_STARTED,
        target: buildActivityTarget(
          workspace.slug,
          milestone.storyId,
          task.step_code,
        ),
        workspaceId: workspace.ID,
      },
      ctx.actor,
      timestamp,
    );
    const updated = await gateway.readChain(milestone.ID);
    return { nextAction: resolveNextAction(updated, milestone.storyId) };
  });
}

/** The registered tool behind this verb. */
export const definition: VerbDefinition = {
  name: "start_stage",
  title: "Start stage",
  description: "Put a methodology stage of a story in progress.",
  inputShape,
  readOnly: false,
  run: (ctx, input) => startStage(ctx, input as StartStageInput),
};
