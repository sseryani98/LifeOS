import { z } from "zod";

import { CODES } from "../../srv/modules/shared/constants.js";

import { buildActivityTarget } from "./shared/addressing.js";
import { ACTIVITY_KINDS, PLANNING, VERB_KEYS } from "./shared/constants.js";
import { rejectVerb } from "./shared/envelope.js";
import { runWriteVerb } from "./shared/runVerb.js";
import { toSecondPrecision } from "./shared/writeQueue.js";
import {
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
  stage: z.string().describe("Methodology stage code to reopen"),
  reason: z.string().describe("Why the stage is being reopened"),
};

interface ReopenStageInput {
  story: string;
  stage: string;
  reason: string;
}

/**
 * Reopens one completed stage. Later stages keep their completion records: the
 * reason lives in the activity register, which is what makes clearing the
 * reopened stage's own completion safe.
 * @param ctx The connected service and the calling agent's identity.
 * @param input The story, the stage, and why it is being reopened.
 * @returns The success or failure envelope.
 */
export async function reopenStage(
  ctx: VerbContext,
  input: ReopenStageInput,
): Promise<VerbResult> {
  return runWriteVerb(ctx, async (gateway, timestamp) => {
    if (!input.reason.trim()) {
      rejectVerb(PLANNING.HTTP_BAD_REQUEST, VERB_KEYS.REOPEN_REASON_REQUIRED);
    }
    const { workspace, milestone } = await resolveStoryContext(
      gateway,
      input.story,
    );
    const chain = await gateway.readChain(milestone.ID);
    const task = resolveStage(chain, input.stage);
    await gateway.updateTask(task.ID, {
      status_code: CODES.TASK_STATUS.IN_PROGRESS,
      startedAt: toSecondPrecision(timestamp),
      completedAt: null,
    });
    await gateway.insertActivity(
      {
        kind: ACTIVITY_KINDS.STAGE_REOPENED,
        target: buildActivityTarget(
          workspace.slug,
          milestone.storyId,
          task.step_code,
        ),
        workspaceId: workspace.ID,
        payload: { reason: input.reason.trim() },
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
  name: "reopen_stage",
  title: "Reopen stage",
  description: "Reopen one completed methodology stage, with a reason.",
  inputShape,
  readOnly: false,
  run: (ctx, input) => reopenStage(ctx, input as ReopenStageInput),
};
