import { z } from "zod";

import { Addressing } from "./shared/addressing.js";
import { ACTIVITY_KINDS, HTTP, VERB_KEYS } from "./shared/constants.js";
import { Envelope } from "./shared/envelope.js";
import { VerbRunner } from "./shared/runVerb.js";
import { StageGuards } from "./shared/stageGuards.js";
import type { TrackerGateway } from "./shared/trackerGateway.js";
import type {
  RecordDecisionInput,
  VerbContext,
  VerbDefinition,
  VerbResult,
} from "./shared/types.js";
import { WriteQueue } from "./shared/writeQueue.js";

/** Records a decision against a workspace, a sprint or a story. */
export class RecordDecisionVerb implements VerbDefinition {
  readonly name = "record_decision";
  readonly title = "Record decision";
  readonly description = [
    "Record a decision against a workspace, sprint or story.",
    "",
    "The target picks the scope: a bare {workspace-slug} records against the",
    "workspace, and {workspace-slug}/{name} is matched as a story first and a",
    "sprint second.",
    "",
    "Returns the new decision's id.",
  ].join("\n");
  readonly inputShape = {
    target: z
      .string()
      .describe(
        "{workspace-slug} for the workspace, or {workspace-slug}/{story-or-sprint}",
      ),
    context: z.string().describe("What made the decision necessary"),
    options: z.string().optional().describe("The options that were weighed"),
    decision: z.string().describe("What was decided"),
    rationale: z.string().describe("Why that option won"),
  };
  readonly readOnly = false;

  /**
   * Records the decision against the target the caller named.
   * @param ctx The connected service and the calling agent's identity.
   * @param input The target and the decision itself.
   * @returns The success or failure envelope, carrying the new decision's id.
   */
  async run(ctx: VerbContext, input: RecordDecisionInput): Promise<VerbResult> {
    return VerbRunner.runWriteVerb(ctx, async (gateway, timestamp) => {
      const scope = await this._resolveDecisionTarget(gateway, input.target);
      const decisionId = await gateway.insertDecision({
        decision: input.decision,
        rationale: input.rationale,
        context: input.context,
        options: input.options ?? null,
        decidedAt: WriteQueue.toSecondPrecision(timestamp),
        milestone_ID: scope.milestoneId,
        initiative_ID: scope.initiativeId,
        workspace_ID: scope.workspaceId,
      });
      await gateway.insertActivity(
        {
          kind: ACTIVITY_KINDS.DECISION_RECORDED,
          target: scope.target,
          workspaceId: scope.workspaceId,
          payload: { decisionId },
        },
        ctx.actor,
        timestamp,
      );
      return { nextAction: null, extra: { decisionId } };
    });
  }

  /**
   * Refuses a decision target that is neither a story nor a sprint, listing
   * both, since the one address form reaches either.
   * @param gateway The gateway the reads run through.
   * @param workspaceId The workspace the target was looked up in.
   * @param innerName The name the caller supplied after the slug.
   * @returns Never — it always throws.
   */
  private async _rejectUnresolvedTarget(
    gateway: TrackerGateway,
    workspaceId: string,
    innerName: string,
  ): Promise<never> {
    const stories = await gateway.readMilestones(workspaceId);
    const sprints = await gateway.readInitiatives(workspaceId);
    return Envelope.rejectVerb(
      HTTP.NOT_FOUND,
      VERB_KEYS.TARGET_NOT_FOUND,
      [
        "story or sprint",
        innerName,
        Envelope.formatValidCodes([
          ...stories.map(row => row.storyId),
          ...sprints.map(row => row.name),
        ]),
      ],
      { target: innerName },
    );
  }

  /**
   * Resolves the decision's target. A bare slug targets the workspace itself; a
   * second segment is matched as a story first and as a sprint second, so the two
   * inner targets share one address form rather than inventing a second.
   * @param gateway The gateway the reads run through.
   * @param target The reference the caller supplied.
   * @returns The workspace, the link to write and the activity target.
   */
  private async _resolveDecisionTarget(
    gateway: TrackerGateway,
    target: string,
  ): Promise<{
    workspaceId: string;
    milestoneId: string | null;
    initiativeId: string | null;
    target: string;
  }> {
    const { workspaceSlug, innerName } = Addressing.parseDecisionTarget(target);
    const workspace = await StageGuards.resolveWorkspace(gateway, workspaceSlug);
    if (!innerName) {
      return {
        workspaceId: workspace.ID,
        milestoneId: null,
        initiativeId: null,
        target: Addressing.buildActivityTarget(workspace.slug),
      };
    }
    const milestone = await gateway.readMilestone(workspace.ID, innerName);
    if (milestone) {
      return {
        workspaceId: workspace.ID,
        milestoneId: milestone.ID,
        initiativeId: null,
        target: Addressing.buildActivityTarget(workspace.slug, milestone.storyId),
      };
    }
    const initiative = await gateway.readInitiativeByName(
      workspace.ID,
      innerName,
    );
    if (!initiative) {
      return this._rejectUnresolvedTarget(gateway, workspace.ID, innerName);
    }
    return {
      workspaceId: workspace.ID,
      milestoneId: null,
      initiativeId: initiative.ID,
      target: Addressing.buildActivityTarget(workspace.slug, initiative.name),
    };
  }
}
