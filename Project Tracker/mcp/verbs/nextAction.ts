import { z } from "zod";

import { VerbRunner } from "./shared/runVerb.js";
import { StageGuards } from "./shared/stageGuards.js";
import type { TrackerGateway } from "./shared/trackerGateway.js";
import type {
  NextAction,
  NextActionInput,
  VerbContext,
  VerbDefinition,
  VerbResult,
} from "./shared/types.js";

/**
 * Answers what to do next. Null is a success rather than an error: it means no
 * incomplete stage remains in scope.
 */
export class NextActionVerb implements VerbDefinition {
  readonly name = "next_action";
  readonly title = "Next action";
  readonly description = [
    "Resolve the next incomplete stage, for one story or overall.",
    "",
    "Call this before writing, to find what to work on. With no story it",
    "scans in sprint then story order and answers with the first story that",
    "still has work. A null answer is a success meaning nothing is",
    "incomplete in scope, not an error.",
    "Not for rendering a page — that is project_view.",
  ].join("\n");
  readonly inputShape = {
    story: z
      .string()
      .optional()
      .describe("Story reference; omit to let the store choose the story"),
  };
  readonly readOnly = true;

  /**
   * Resolves the next action within the named story, or across the store.
   * @param ctx The connected service and the calling agent's identity.
   * @param input The story to resolve within, if the caller names one.
   * @returns The success or failure envelope, carrying the next action.
   */
  async run(ctx: VerbContext, input: NextActionInput): Promise<VerbResult> {
    return VerbRunner.runReadVerb(ctx, async gateway => {
      if (input.story?.trim()) {
        const { milestone } = await StageGuards.resolveStoryContext(
          gateway,
          input.story,
        );
        const chain = await gateway.readChain(milestone.ID);
        return {
          nextAction: StageGuards.resolveNextAction(chain, milestone.storyId),
        };
      }
      return { nextAction: await this._selectCandidateAction(gateway) };
    });
  }

  /**
   * Selects a story before resolving within it, in sprint then story position
   * order, and answers with the first story that still has work in it.
   * @param gateway The gateway the reads run through.
   * @returns The next action, or null when nothing is incomplete anywhere.
   */
  private async _selectCandidateAction(
    gateway: TrackerGateway,
  ): Promise<NextAction | null> {
    for (const workspace of await gateway.readWorkspaces()) {
      for (const milestone of await gateway.readMilestones(workspace.ID)) {
        const chain = await gateway.readChain(milestone.ID);
        const resolved = StageGuards.resolveNextAction(chain, milestone.storyId);
        if (resolved) return resolved;
      }
    }
    return null;
  }
}
