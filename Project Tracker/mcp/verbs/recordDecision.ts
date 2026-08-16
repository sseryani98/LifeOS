import { z } from "zod";

import { buildActivityTarget, parseDecisionTarget } from "./shared/addressing.js";
import { ACTIVITY_KINDS, PLANNING, VERB_KEYS } from "./shared/constants.js";
import { rejectVerb } from "./shared/envelope.js";
import { runWriteVerb } from "./shared/runVerb.js";
import { toSecondPrecision } from "./shared/writeQueue.js";
import { resolveWorkspace } from "./shared/stageGuards.js";
import type { TrackerGateway } from "./shared/trackerGateway.js";
import type {
  VerbContext,
  VerbDefinition,
  VerbResult,
} from "./shared/types.js";

/** The tool schema, as the transport advertises it. */
export const inputShape = {
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

interface RecordDecisionInput {
  target: string;
  context: string;
  options?: string;
  decision: string;
  rationale: string;
}

/**
 * Records a decision against a workspace, a sprint or a story.
 * @param ctx The connected service and the calling agent's identity.
 * @param input The target and the decision itself.
 * @returns The success or failure envelope, carrying the new decision's id.
 */
export async function recordDecision(
  ctx: VerbContext,
  input: RecordDecisionInput,
): Promise<VerbResult> {
  return runWriteVerb(ctx, async (gateway, timestamp) => {
    const scope = await _resolveDecisionTarget(gateway, input.target);
    const decisionId = await gateway.insertDecision({
      decision: input.decision,
      rationale: input.rationale,
      context: input.context,
      options: input.options ?? null,
      decidedAt: toSecondPrecision(timestamp),
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
 * Resolves the decision's target. A bare slug targets the workspace itself; a
 * second segment is matched as a story first and as a sprint second, so the two
 * inner targets share one address form rather than inventing a second.
 * @param gateway The gateway the reads run through.
 * @param target The reference the caller supplied.
 * @returns The workspace, the link to write and the activity target.
 */
async function _resolveDecisionTarget(
  gateway: TrackerGateway,
  target: string,
): Promise<{
  workspaceId: string;
  milestoneId: string | null;
  initiativeId: string | null;
  target: string;
}> {
  const { workspaceSlug, innerName } = parseDecisionTarget(target);
  const workspace = await resolveWorkspace(gateway, workspaceSlug);
  if (!innerName) {
    return {
      workspaceId: workspace.ID,
      milestoneId: null,
      initiativeId: null,
      target: buildActivityTarget(workspace.slug),
    };
  }
  const milestone = await gateway.readMilestone(workspace.ID, innerName);
  if (milestone) {
    return {
      workspaceId: workspace.ID,
      milestoneId: milestone.ID,
      initiativeId: null,
      target: buildActivityTarget(workspace.slug, milestone.storyId),
    };
  }
  const initiative = await gateway.readInitiativeByName(
    workspace.ID,
    innerName,
  );
  if (!initiative) {
    rejectVerb(
      PLANNING.HTTP_NOT_FOUND,
      VERB_KEYS.TARGET_NOT_FOUND,
      ["story or sprint", innerName, workspace.slug],
      { target: innerName },
    );
  }
  return {
    workspaceId: workspace.ID,
    milestoneId: null,
    initiativeId: initiative.ID,
    target: buildActivityTarget(workspace.slug, initiative.name),
  };
}

/** The registered tool behind this verb. */
export const definition: VerbDefinition = {
  name: "record_decision",
  title: "Record decision",
  description: "Record a decision against a workspace, sprint or story.",
  inputShape,
  readOnly: false,
  run: (ctx, input) => recordDecision(ctx, input as RecordDecisionInput),
};
