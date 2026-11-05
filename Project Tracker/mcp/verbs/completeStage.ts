import { z } from "zod";

import { CODES } from "../../srv/modules/shared/constants.js";

import { Addressing } from "./shared/addressing.js";
import { ACTIVITY_KINDS } from "./shared/constants.js";
import { VerbRunner } from "./shared/runVerb.js";
import { StageGuards } from "./shared/stageGuards.js";
import { TargetResolver } from "./shared/targetResolver.js";
import type {
  CompleteStageInput,
  VerbContext,
  VerbDefinition,
  VerbResult,
} from "./shared/types.js";
import { WriteQueue } from "./shared/writeQueue.js";

/**
 * Completes a methodology stage. Open steps under it warn rather than block, so
 * a stage that ran without one of its optional steps still closes.
 */
export class CompleteStageVerb implements VerbDefinition {
  readonly name = "complete_stage";
  readonly title = "Complete stage";
  readonly description = [
    "Complete a methodology stage of a story.",
    "",
    "Use when the stage is in progress. A stage that was never started is",
    "refused, as is a human-only stage closed by a caller who is not human;",
    "open workflow steps under it warn rather than block, and the warnings",
    "name each one.",
    "Not for closing a single workflow step — that is complete_subtask.",
    "",
    "Returns the story's next incomplete stage, plus any open-step warnings.",
  ].join("\n");
  readonly inputShape = {
    story: z.string().describe("Story reference, as {workspace-slug}/{story-id}"),
    stage: z.string().describe("Methodology stage code, such as code-quality"),
    notes: z.string().optional().describe("What the stage concluded"),
  };
  readonly readOnly = false;

  /**
   * Completes the stage the caller addressed.
   * @param ctx The connected service and the calling agent's identity.
   * @param input The story, the stage, and what it concluded.
   * @returns The success or failure envelope.
   */
  async run(ctx: VerbContext, input: CompleteStageInput): Promise<VerbResult> {
    return VerbRunner.runWriteVerb(ctx, async (gateway, timestamp) => {
      const { workspace, milestone } = await TargetResolver.resolveStoryContext(
        gateway,
        input.story,
      );
      const chain = await gateway.readChain(milestone.ID);
      const task = TargetResolver.resolveStage(chain, input.stage);
      // The order is the answer, not the set: where more than one condition
      // holds, the first to fire is what the caller is told.
      StageGuards.assertStageNotBlocked(chain, task);
      await StageGuards.assertHumanCaller(gateway, ctx.actor, task);
      StageGuards.assertStageStarted(task);
      StageGuards.assertStageNotComplete(task);
      const warnings = StageGuards.buildOpenSubtaskWarnings(
        await gateway.readSubtasks(task.ID),
      );
      await gateway.updateTask(task.ID, {
        status_code: CODES.TASK_STATUS.COMPLETE,
        completedAt: WriteQueue.toSecondPrecision(timestamp),
        ...(input.notes ? { notes: input.notes } : {}),
      });
      await gateway.insertActivity(
        {
          kind: ACTIVITY_KINDS.STAGE_COMPLETED,
          target: Addressing.buildActivityTarget(
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
        nextAction: TargetResolver.resolveNextAction(updated, milestone.storyId),
        warnings,
      };
    });
  }
}
