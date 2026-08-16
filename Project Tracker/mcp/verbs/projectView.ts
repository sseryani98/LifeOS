import { z } from "zod";

import { deriveMilestoneStatus } from "../../srv/modules/tracker/milestoneStatus.js";

import { PLANNING, VERB_KEYS } from "./shared/constants.js";
import { rejectVerb } from "./shared/envelope.js";
import { runReadVerb } from "./shared/runVerb.js";
import { resolveNextAction, resolveWorkspace } from "./shared/stageGuards.js";
import type { TrackerGateway } from "./shared/trackerGateway.js";
import type {
  VerbContext,
  VerbDefinition,
  VerbResult,
  WorkspaceRow,
} from "./shared/types.js";

/** The tool schema, as the transport advertises it. */
export const inputShape = {
  workspace: z
    .string()
    .optional()
    .describe("Workspace slug; omit when the store holds one workspace"),
};

interface ProjectViewInput {
  workspace?: string;
}

/**
 * Answers the whole view in one call, so nothing has to make a second one to
 * render a page.
 * @param ctx The connected service and the calling agent's identity.
 * @param input The workspace to read, if the caller names one.
 * @returns The success or failure envelope, carrying the composed view.
 */
export async function projectView(
  ctx: VerbContext,
  input: ProjectViewInput,
): Promise<VerbResult> {
  return runReadVerb(ctx, async gateway => {
    const workspace = await _selectWorkspace(gateway, input.workspace);
    const initiatives = await _composeInitiatives(gateway, workspace.ID);
    const nextAction = _selectFirstNextAction(initiatives);
    return {
      nextAction,
      extra: {
        view: {
          header: {
            slug: workspace.slug,
            name: workspace.name,
            currentFocus: workspace.currentFocus,
            // Calculated health is an engine of its own and lands with the
            // story that owns it; the field is here so nothing has to be added
            // to the payload shape when it does.
            health: null,
          },
          nextAction,
          taskQueue: await gateway.readTaskQueue(workspace.ID),
          initiatives,
          defects: await gateway.readDefects(workspace.ID),
          decisions: await gateway.readDecisions(workspace.ID),
          activities: await gateway.readActivities(workspace.ID),
        },
      },
    };
  });
}

/**
 * Composes every sprint of a workspace with its stories, and every story with
 * its chain and each stage's steps.
 * @param gateway The gateway the reads run through.
 * @param workspaceId The workspace to compose.
 * @returns The sprint tree.
 */
async function _composeInitiatives(
  gateway: TrackerGateway,
  workspaceId: string,
): Promise<Record<string, unknown>[]> {
  const milestones = await gateway.readMilestones(workspaceId);
  const composed: Record<string, unknown>[] = [];
  for (const initiative of await gateway.readInitiatives(workspaceId)) {
    const stories = [];
    for (const milestone of milestones.filter(
      row => row.initiative_ID === initiative.ID,
    )) {
      const chain = await gateway.readChain(milestone.ID);
      const stages = [];
      for (const task of chain) {
        stages.push({ ...task, subtasks: await gateway.readSubtasks(task.ID) });
      }
      stories.push({
        ...milestone,
        status: deriveMilestoneStatus(chain),
        chain: stages,
      });
    }
    composed.push({ ...initiative, milestones: stories });
  }
  return composed;
}

/**
 * Reads the workspace the caller named, or the only one there is.
 * @param gateway The gateway the reads run through.
 * @param slug The workspace slug, when the caller supplied one.
 * @returns The workspace row.
 */
async function _selectWorkspace(
  gateway: TrackerGateway,
  slug?: string,
): Promise<WorkspaceRow> {
  if (slug?.trim()) return resolveWorkspace(gateway, slug);
  const workspaces = await gateway.readWorkspaces();
  if (workspaces.length === 0) {
    rejectVerb(PLANNING.HTTP_NOT_FOUND, VERB_KEYS.TARGET_NOT_FOUND, [
      "workspace",
      "",
      "",
    ]);
  }
  return workspaces[0];
}

/**
 * Picks the first story in the composed tree that still has work in it.
 * @param initiatives The composed sprint tree.
 * @returns The next action, or null when nothing is incomplete.
 */
function _selectFirstNextAction(
  initiatives: Record<string, unknown>[],
): ReturnType<typeof resolveNextAction> {
  for (const initiative of initiatives) {
    const stories = initiative.milestones as Record<string, unknown>[];
    for (const story of stories) {
      const resolved = resolveNextAction(
        story.chain as Parameters<typeof resolveNextAction>[0],
        story.storyId as string,
      );
      if (resolved) return resolved;
    }
  }
  return null;
}

/** The registered tool behind this verb. */
export const definition: VerbDefinition = {
  name: "project_view",
  title: "Project view",
  description: "Read the whole project view for a workspace in one call.",
  inputShape,
  readOnly: true,
  run: (ctx, input) => projectView(ctx, input as ProjectViewInput),
};
