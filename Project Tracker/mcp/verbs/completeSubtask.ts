import { z } from "zod";

import { CODES } from "../../srv/modules/shared/constants.js";

import { Addressing } from "./shared/addressing.js";
import { ACTIVITY_KINDS } from "./shared/constants.js";
import { VerbRunner } from "./shared/runVerb.js";
import { StageGuards } from "./shared/stageGuards.js";
import type {
  CompleteSubtaskInput,
  VerbContext,
  VerbDefinition,
  VerbResult,
} from "./shared/types.js";
import { WriteQueue } from "./shared/writeQueue.js";

/** Completes one workflow step inside a stage. */
export class CompleteSubtaskVerb implements VerbDefinition {
  readonly name = "complete_subtask";
  readonly title = "Complete step";
  readonly description = [
    "Complete one workflow step inside a methodology stage.",
    "",
    "Use for a single step within a stage that is still running. A step under",
    "an unstarted stage, ahead of an open earlier step, or already complete is",
    "refused. Completing every step does not close the stage; complete_stage",
    "does that.",
    "",
    "Returns the story's next incomplete stage.",
  ].join("\n");
  readonly inputShape = {
    story: z.string().describe("Story reference, as {workspace-slug}/{story-id}"),
    stage: z.string().describe("Methodology stage code the step hangs off"),
    subtask: z.string().describe("Workflow step code, such as handoff"),
  };
  readonly readOnly = false;

  /**
   * Completes the step the caller addressed.
   * @param ctx The connected service and the calling agent's identity.
   * @param input The story, its stage, and the step to close.
   * @returns The success or failure envelope.
   */
  async run(ctx: VerbContext, input: CompleteSubtaskInput): Promise<VerbResult> {
    return VerbRunner.runWriteVerb(ctx, async (gateway, timestamp) => {
      const { workspace, milestone } = await StageGuards.resolveStoryContext(
        gateway,
        input.story,
      );
      const chain = await gateway.readChain(milestone.ID);
      const task = StageGuards.resolveStage(chain, input.stage);
      const subtasks = await gateway.readSubtasks(task.ID);
      const subtask = StageGuards.resolveSubtask(subtasks, input.subtask);
      StageGuards.assertSubtaskStageStarted(task, subtask);
      StageGuards.assertSubtaskNotBlocked(subtasks, subtask);
      StageGuards.assertSubtaskNotComplete(subtask);
      await gateway.updateSubtask(subtask.ID, {
        status_code: CODES.SUBTASK_STATUS.COMPLETE,
        completedAt: WriteQueue.toSecondPrecision(timestamp),
      });
      await gateway.insertActivity(
        {
          kind: ACTIVITY_KINDS.SUBTASK_COMPLETED,
          target: Addressing.buildActivityTarget(
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
      return {
        nextAction: StageGuards.resolveNextAction(chain, milestone.storyId),
      };
    });
  }
}
