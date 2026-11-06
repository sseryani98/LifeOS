import { z } from "zod";

import { VerbRunner } from "./shared/runVerb.js";
import { TargetResolver } from "./shared/targetResolver.js";
import type { TrackerGateway } from "./shared/trackerGateway.js";
import type {
  CandidateChain,
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
    "ranks every story with work left: resuming started work (tier 1) first,",
    "then fresh work (tier 2), then optional work only (tier 3), each in sprint",
    "then story order. status names the verb to call next; requiresHuman says",
    "an agent cannot close the stage. A null answer is a success meaning",
    "nothing is incomplete in scope, not an error.",
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
        const { workspace, milestone } =
          await TargetResolver.resolveStoryContext(gateway, input.story);
        const chain = await gateway.readChain(milestone.ID);
        return {
          nextAction: TargetResolver.resolveNextAction(
            chain,
            workspace.slug,
            milestone.storyId,
          ),
        };
      }
      return { nextAction: await this._selectCandidateAction(gateway) };
    });
  }

  /**
   * Ranks every story of each workspace and walks the winner, taking the first
   * workspace in slug order that still has work anywhere in it.
   * @param gateway The gateway the reads run through.
   * @returns The next action, or null when nothing is incomplete anywhere.
   */
  private async _selectCandidateAction(
    gateway: TrackerGateway,
  ): Promise<NextAction | null> {
    for (const workspace of await gateway.readWorkspaces()) {
      const initiatives = await gateway.readInitiatives(workspace.ID);
      const positions = new Map(initiatives.map(row => [row.ID, row.position]));
      const stories: CandidateChain[] = [];
      for (const milestone of await gateway.readMilestones(workspace.ID)) {
        stories.push({
          storyId: milestone.storyId,
          initiativePosition: Number(positions.get(milestone.initiative_ID)),
          milestonePosition: milestone.position,
          tasks: await gateway.readChain(milestone.ID),
        });
      }
      const resolved = TargetResolver.resolveCandidateAction(
        workspace.slug,
        stories,
      );
      if (resolved) return resolved;
    }
    return null;
  }
}
