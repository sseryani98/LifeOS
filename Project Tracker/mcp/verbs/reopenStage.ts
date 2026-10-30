import { z } from "zod";

import { CODES } from "../../srv/modules/shared/constants.js";

import { Addressing } from "./shared/addressing.js";
import { ACTIVITY_KINDS, GUARD, HTTP, VERB_KEYS } from "./shared/constants.js";
import { Envelope } from "./shared/envelope.js";
import { VerbRunner } from "./shared/runVerb.js";
import { StageGuards } from "./shared/stageGuards.js";
import type {
  ReopenStageInput,
  VerbContext,
  VerbDefinition,
  VerbResult,
} from "./shared/types.js";
import { WriteQueue } from "./shared/writeQueue.js";

/**
 * Reopens one completed stage. Later stages keep their completion records: the
 * reason lives in the activity register, which is what makes clearing the
 * reopened stage's own completion safe.
 */
export class ReopenStageVerb implements VerbDefinition {
  readonly name = "reopen_stage";
  readonly title = "Reopen stage";
  readonly description = [
    "Reopen one completed methodology stage, with a reason.",
    "",
    "Use when a finished stage has to run again. Only a complete stage",
    "reopens, and the reason is required and recorded in the activity",
    "register. Later stages keep their own completion records.",
    "Not for starting a stage for the first time — that is start_stage.",
    "",
    "Returns the story's next incomplete stage.",
  ].join("\n");
  readonly inputShape = {
    story: z.string().describe("Story reference, as {workspace-slug}/{story-id}"),
    stage: z.string().describe("Methodology stage code to reopen"),
    reason: z.string().describe("Why the stage is being reopened"),
  };
  readonly readOnly = false;

  /**
   * Reopens the stage the caller addressed.
   * @param ctx The connected service and the calling agent's identity.
   * @param input The story, the stage, and why it is being reopened.
   * @returns The success or failure envelope.
   */
  async run(ctx: VerbContext, input: ReopenStageInput): Promise<VerbResult> {
    return VerbRunner.runWriteVerb(ctx, async (gateway, timestamp) => {
      if (!input.reason.trim()) {
        Envelope.rejectVerb(HTTP.BAD_REQUEST, VERB_KEYS.REOPEN_REASON_REQUIRED);
      }
      const { workspace, milestone } = await StageGuards.resolveStoryContext(
        gateway,
        input.story,
      );
      const chain = await gateway.readChain(milestone.ID);
      const task = StageGuards.resolveStage(chain, input.stage);
      // Only a complete stage reopens: anything else would make this verb an
      // ungated start_stage, skipping the predecessor-blocking guard.
      if (task.status_code !== CODES.TASK_STATUS.COMPLETE) {
        Envelope.rejectVerb(
          HTTP.CONFLICT,
          VERB_KEYS.STAGE_NOT_COMPLETE,
          [task.step_code, task.status_code],
          {
            target: task.step_code,
            remediation: Envelope.resolveMessage(GUARD.REMEDIATION_START_STAGE),
          },
        );
      }
      await gateway.updateTask(task.ID, {
        status_code: CODES.TASK_STATUS.IN_PROGRESS,
        startedAt: WriteQueue.toSecondPrecision(timestamp),
        completedAt: null,
      });
      await gateway.insertActivity(
        {
          kind: ACTIVITY_KINDS.STAGE_REOPENED,
          target: Addressing.buildActivityTarget(
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
      return {
        nextAction: StageGuards.resolveNextAction(updated, milestone.storyId),
      };
    });
  }
}
