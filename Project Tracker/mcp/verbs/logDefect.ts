import { z } from "zod";

import { CODES } from "../../srv/modules/shared/constants.js";

import { buildActivityTarget } from "./shared/addressing.js";
import {
  ACTIVITY_KINDS,
  DEFECT_SEVERITIES,
  PLANNING,
  VERB_KEYS,
} from "./shared/constants.js";
import { rejectVerb } from "./shared/envelope.js";
import { runWriteVerb } from "./shared/runVerb.js";
import {
  resolveNextAction,
  resolveStoryContext,
  resolveWorkspace,
} from "./shared/stageGuards.js";
import type { TrackerGateway } from "./shared/trackerGateway.js";
import type {
  NextAction,
  VerbContext,
  VerbDefinition,
  VerbResult,
} from "./shared/types.js";

/** The tool schema, as the transport advertises it. */
export const inputShape = {
  story: z
    .string()
    .optional()
    .describe("Story reference, when the defect belongs to one story"),
  workspace: z
    .string()
    .optional()
    .describe("Workspace slug, when the defect belongs to the sprint"),
  severity: z.enum(DEFECT_SEVERITIES).describe("Defect severity"),
  title: z.string().describe("One-line defect title"),
  description: z.string().describe("What is wrong, and how it shows"),
  references: z
    .string()
    .optional()
    .describe("Free-text file:line references"),
};

interface LogDefectInput {
  story?: string;
  workspace?: string;
  severity: string;
  title: string;
  description: string;
  references?: string;
}

/**
 * Records a defect against one story or against the sprint. Exactly one scope
 * is carried: with neither there is nothing to resolve, and with both there is
 * no rule saying which wins.
 * @param ctx The connected service and the calling agent's identity.
 * @param input The scope, the severity, and the defect itself.
 * @returns The success or failure envelope, carrying the new defect's id.
 */
export async function logDefect(
  ctx: VerbContext,
  input: LogDefectInput,
): Promise<VerbResult> {
  return runWriteVerb(ctx, async (gateway, timestamp) => {
    const scope = await _resolveDefectScope(gateway, input);
    const defectId = await gateway.insertDefect({
      severity_code: input.severity,
      status_code: CODES.DEFECT_STATUS.OPEN,
      title: input.title,
      description: input.description,
      references: input.references ?? null,
      milestone_ID: scope.milestoneId,
      initiative_ID: scope.initiativeId,
      workspace_ID: scope.workspaceId,
    });
    await gateway.insertActivity(
      {
        kind: ACTIVITY_KINDS.DEFECT_LOGGED,
        target: scope.target,
        workspaceId: scope.workspaceId,
        payload: { defectId, severity: input.severity },
      },
      ctx.actor,
      timestamp,
    );
    return { nextAction: scope.nextAction, extra: { defectId } };
  });
}

/**
 * Resolves which of the two scopes the caller asked for, and the links it
 * implies.
 * @param gateway The gateway the reads run through.
 * @param input The verb input carrying at most one scope.
 * @returns The workspace, the link to write, the activity target and the next
 *   action the response carries.
 */
async function _resolveDefectScope(
  gateway: TrackerGateway,
  input: LogDefectInput,
): Promise<{
  workspaceId: string;
  milestoneId: string | null;
  initiativeId: string | null;
  target: string;
  nextAction: NextAction | null;
}> {
  const hasStory = Boolean(input.story?.trim());
  const hasWorkspace = Boolean(input.workspace?.trim());
  if (hasStory === hasWorkspace) {
    rejectVerb(PLANNING.HTTP_BAD_REQUEST, VERB_KEYS.DEFECT_SCOPE_REQUIRED);
  }
  if (hasStory) {
    const { workspace, milestone } = await resolveStoryContext(
      gateway,
      input.story as string,
    );
    const chain = await gateway.readChain(milestone.ID);
    return {
      workspaceId: workspace.ID,
      milestoneId: milestone.ID,
      initiativeId: null,
      target: buildActivityTarget(workspace.slug, milestone.storyId),
      nextAction: resolveNextAction(chain, milestone.storyId),
    };
  }
  const workspace = await resolveWorkspace(gateway, input.workspace as string);
  const initiative = await gateway.readActiveInitiative(workspace.ID);
  if (!initiative) {
    rejectVerb(PLANNING.HTTP_NOT_FOUND, VERB_KEYS.TARGET_NOT_FOUND, [
      "active sprint",
      workspace.slug,
      "",
    ]);
  }
  return {
    workspaceId: workspace.ID,
    milestoneId: null,
    initiativeId: initiative.ID,
    target: buildActivityTarget(workspace.slug),
    nextAction: null,
  };
}

/** The registered tool behind this verb. */
export const definition: VerbDefinition = {
  name: "log_defect",
  title: "Log defect",
  description: "Record a defect against one story or against the sprint.",
  inputShape,
  readOnly: false,
  run: (ctx, input) => logDefect(ctx, input as LogDefectInput),
};
