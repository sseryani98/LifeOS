import { z } from "zod";

import { CODES } from "../../srv/modules/shared/constants.js";

import { buildActivityTarget } from "./shared/addressing.js";
import { ACTIVITY_KINDS } from "./shared/constants.js";
import { runWriteVerb } from "./shared/runVerb.js";
import { toSecondPrecision } from "./shared/writeQueue.js";
import {
  assertStageNotBlocked,
  assertStageNotComplete,
  assertStageStarted,
  collectOpenSubtaskWarnings,
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
  notes: z.string().optional().describe("What the stage concluded"),
};

interface CompleteStageInput {
  story: string;
  stage: string;
  notes?: string;
}

/**
 * Completes a methodology stage. Open steps under it warn rather than block, so
 * a stage that ran without one of its optional steps still closes.
 * @param ctx The connected service and the calling agent's identity.
 * @param input The story, the stage, and what it concluded.
 * @returns The success or failure envelope.
 */
export async function completeStage(
  ctx: VerbContext,
  input: CompleteStageInput,
): Promise<VerbResult> {
  return runWriteVerb(ctx, async (gateway, timestamp) => {
    const { workspace, milestone } = await resolveStoryContext(
      gateway,
      input.story,
    );
    const chain = await gateway.readChain(milestone.ID);
    const task = resolveStage(chain, input.stage);
    // The order is the answer, not the set: where more than one condition
    // holds, the first to fire is what the caller is told.
    assertStageNotBlocked(chain, task);
    assertStageStarted(task);
    assertStageNotComplete(task);
    const warnings = collectOpenSubtaskWarnings(
      await gateway.readSubtasks(task.ID),
    );
    await gateway.updateTask(task.ID, {
      status_code: CODES.TASK_STATUS.COMPLETE,
      completedAt: toSecondPrecision(timestamp),
      ...(input.notes ? { notes: input.notes } : {}),
    });
    await gateway.insertActivity(
      {
        kind: ACTIVITY_KINDS.STAGE_COMPLETED,
        target: buildActivityTarget(
          workspace.slug,
          milestone.storyId,
          task.step_code,
        ),
        workspaceId: workspace.ID,
        payload: { openSteps: warnings.map(warning => warning.target) },
      },
      ctx.actor,
      timestamp,
    );
    const updated = await gateway.readChain(milestone.ID);
    return {
      nextAction: resolveNextAction(updated, milestone.storyId),
      warnings,
    };
  });
}

/** The registered tool behind this verb. */
export const definition: VerbDefinition = {
  name: "complete_stage",
  title: "Complete stage",
  description: "Complete a methodology stage of a story.",
  inputShape,
  readOnly: false,
  run: (ctx, input) => completeStage(ctx, input as CompleteStageInput),
};
