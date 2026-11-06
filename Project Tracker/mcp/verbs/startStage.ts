import { z } from "zod";

import { CODES } from "../../srv/modules/shared/constants.js";

import { Addressing } from "./shared/addressing.js";
import { ACTIVITY_KINDS } from "./shared/constants.js";
import { VerbRunner } from "./shared/runVerb.js";
import { StageGuards } from "./shared/stageGuards.js";
import { TargetResolver } from "./shared/targetResolver.js";
import type {
  StartStageInput,
  VerbContext,
  VerbDefinition,
  VerbResult,
} from "./shared/types.js";
import { WriteQueue } from "./shared/writeQueue.js";

/** Puts a methodology stage in progress. */
export class StartStageVerb implements VerbDefinition {
  readonly name = "start_stage";
  readonly title = "Start stage";
  readonly description = [
    "Put a methodology stage of a story in progress.",
    "",
    "Use when the stage has never been started. A stage whose predecessor is",
    "still open is refused, as is one already in progress or complete.",
    "Not for restarting a finished stage — that is reopen_stage, and it takes",
    "a reason this verb does not.",
    "",
    "Returns the story's next incomplete stage after the change, and the",
    "stage's workflow steps in position order.",
  ].join("\n");
  readonly inputShape = {
    story: z.string().describe("Story reference, as {workspace-slug}/{story-id}"),
    stage: z.string().describe("Methodology stage code, such as code-quality"),
  };
  readonly readOnly = false;

  /**
   * Starts the stage the caller addressed.
   * @param ctx The connected service and the calling agent's identity.
   * @param input The story and the stage to start.
   * @returns The success or failure envelope.
   */
  async run(ctx: VerbContext, input: StartStageInput): Promise<VerbResult> {
    return VerbRunner.runWriteVerb(ctx, async (gateway, timestamp) => {
      const { workspace, milestone } = await TargetResolver.resolveStoryContext(
        gateway,
        input.story,
      );
      const chain = await gateway.readChain(milestone.ID);
      const task = TargetResolver.resolveStage(chain, input.stage);
      StageGuards.assertStageNotBlocked(chain, task);
      StageGuards.assertStageNotInProgress(task);
      StageGuards.assertStageNotComplete(task);
      await gateway.updateTask(task.ID, {
        status_code: CODES.TASK_STATUS.IN_PROGRESS,
        startedAt: WriteQueue.toSecondPrecision(timestamp),
      });
      await gateway.insertActivity(
        {
          kind: ACTIVITY_KINDS.STAGE_STARTED,
          target: Addressing.buildActivityTarget(
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
      // The stage's conditional steps were settled when the chain was made, so
      // the start is where the caller learns which ones this story carries.
      return {
        nextAction: TargetResolver.resolveNextAction(
          updated,
          workspace.slug,
          milestone.storyId,
        ),
        extra: { subtasks: await gateway.readSubtasks(task.ID) },
      };
    });
  }
}
