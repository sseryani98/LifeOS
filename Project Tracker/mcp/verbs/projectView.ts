import { z } from "zod";

import { deriveMilestoneStatus } from "../../srv/modules/tracker/milestoneStatus.js";

import { HTTP, VERB_KEYS } from "./shared/constants.js";
import { rejectVerb } from "./shared/envelope.js";
import { runReadVerb } from "./shared/runVerb.js";
import { resolveNextAction, resolveWorkspace } from "./shared/stageGuards.js";
import type { TrackerGateway } from "./shared/trackerGateway.js";
import type {
  ChainRow,
  InitiativeRow,
  MilestoneRow,
  NextAction,
  SubtaskRow,
  VerbContext,
  VerbDefinition,
  VerbResult,
  WorkspaceRow,
} from "./shared/types.js";

/** A stage of the composed tree, with its steps nested on. */
interface ComposedStage extends ChainRow {
  subtasks: SubtaskRow[];
}

/** A story of the composed tree, with its derived status and its chain. */
interface ComposedStory extends MilestoneRow {
  status: string;
  chain: ComposedStage[];
}

/** A sprint of the composed tree, with its stories nested on. */
interface ComposedInitiative extends InitiativeRow {
  milestones: ComposedStory[];
}

/** The tool schema, as the transport advertises it. */
const inputShape = {
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
    const [taskQueue, defects, decisions, activities] = await Promise.all([
      gateway.readTaskQueue(workspace.ID),
      gateway.readDefects(workspace.ID),
      gateway.readDecisions(workspace.ID),
      gateway.readActivities(workspace.ID),
    ]);
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
          taskQueue,
          initiatives,
          defects,
          decisions,
          activities,
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
): Promise<ComposedInitiative[]> {
  const milestones = await gateway.readMilestones(workspaceId);
  const composed: ComposedInitiative[] = [];
  for (const initiative of await gateway.readInitiatives(workspaceId)) {
    const stories: ComposedStory[] = [];
    for (const milestone of milestones.filter(
      row => row.initiative_ID === initiative.ID,
    )) {
      const chain = await gateway.readChain(milestone.ID);
      const stages: ComposedStage[] = [];
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
 * Reads the workspace the caller named, or the only one there is. Several
 * workspaces with no slug is an ambiguity, rejected rather than silently
 * resolved to any of them.
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
    rejectVerb(HTTP.NOT_FOUND, VERB_KEYS.TARGET_NOT_FOUND, [
      "workspace",
      "",
      "",
    ]);
  }
  if (workspaces.length > 1) {
    rejectVerb(HTTP.BAD_REQUEST, VERB_KEYS.WORKSPACE_AMBIGUOUS, [
      workspaces.map(row => row.slug).join(", "),
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
  initiatives: ComposedInitiative[],
): NextAction | null {
  for (const initiative of initiatives) {
    for (const story of initiative.milestones) {
      const resolved = resolveNextAction(story.chain, story.storyId);
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
