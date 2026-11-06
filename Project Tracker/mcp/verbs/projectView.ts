import { z } from "zod";

import { MilestoneStatus } from "../../srv/modules/tracker/milestoneStatus.js";

import { HTTP, READ_LIMITS, VERB_KEYS } from "./shared/constants.js";
import { Envelope } from "./shared/envelope.js";
import { VerbRunner } from "./shared/runVerb.js";
import { TargetResolver } from "./shared/targetResolver.js";
import type { TrackerGateway } from "./shared/trackerGateway.js";
import type {
  ComposedInitiative,
  ComposedStage,
  ComposedStory,
  NextAction,
  ProjectViewInput,
  VerbContext,
  VerbDefinition,
  VerbResult,
  WorkspaceRow,
} from "./shared/types.js";

/**
 * Answers the whole view in one call, so nothing has to make a second one to
 * render a page.
 */
export class ProjectViewVerb implements VerbDefinition {
  readonly name = "project_view";
  readonly title = "Project view";
  readonly description = [
    "Read the whole project view for a workspace in one call.",
    "",
    "Answers the sprint tree, the task queue, and the defect, decision and",
    "activity registers together, so nothing needs a second call to render a",
    "page. Omit workspace only when the store holds exactly one.",
    "The activity feed carries the newest entries and stops at a ceiling;",
    "activitiesTruncated says whether the register held more.",
  ].join("\n");
  readonly inputShape = {
    workspace: z
      .string()
      .optional()
      .describe("Workspace slug; omit when the store holds one workspace"),
  };
  readonly readOnly = true;

  /**
   * Composes the view of the named workspace, or of the only one there is.
   * @param ctx The connected service and the calling agent's identity.
   * @param input The workspace to read, if the caller names one.
   * @returns The success or failure envelope, carrying the composed view.
   */
  async run(ctx: VerbContext, input: ProjectViewInput): Promise<VerbResult> {
    return VerbRunner.runReadVerb(ctx, async gateway => {
      const workspace = await this._selectWorkspace(gateway, input.workspace);
      const initiatives = await this._buildInitiatives(gateway, workspace.ID);
      const nextAction = this._resolveNextAction(workspace.slug, initiatives);
      const [taskQueue, defects, decisions, activities] = await Promise.all([
        gateway.readTaskQueue(workspace.ID),
        gateway.readDefects(workspace.ID),
        gateway.readDecisions(workspace.ID),
        gateway.readActivities(workspace.ID, READ_LIMITS.ACTIVITIES),
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
            activities: activities.rows,
            // Stated rather than implied: a reader that cannot tell a whole
            // register from its newest page will draw conclusions from a feed
            // that stops where the ceiling is, not where the history does.
            activitiesTruncated: activities.truncated,
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
  private async _buildInitiatives(
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
          status: MilestoneStatus.deriveFromChain(chain),
          chain: stages,
        });
      }
      composed.push({ ...initiative, milestones: stories });
    }
    return composed;
  }

  /**
   * Resolves the workspace's next action from the composed tree, through the
   * same engine and payload as next_action.
   * @param workspaceSlug The workspace the tree belongs to.
   * @param initiatives The composed sprint tree.
   * @returns The next action, or null when nothing is incomplete.
   */
  private _resolveNextAction(
    workspaceSlug: string,
    initiatives: ComposedInitiative[],
  ): NextAction | null {
    return TargetResolver.resolveCandidateAction(
      workspaceSlug,
      initiatives.flatMap(initiative =>
        initiative.milestones.map(story => ({
          storyId: story.storyId,
          initiativePosition: initiative.position,
          milestonePosition: story.position,
          tasks: story.chain,
        })),
      ),
    );
  }

  /**
   * Reads the workspace the caller named, or the only one there is. Several
   * workspaces with no slug is an ambiguity, rejected rather than silently
   * resolved to any of them.
   * @param gateway The gateway the reads run through.
   * @param slug The workspace slug, when the caller supplied one.
   * @returns The workspace row.
   */
  private async _selectWorkspace(
    gateway: TrackerGateway,
    slug?: string,
  ): Promise<WorkspaceRow> {
    if (slug?.trim()) return TargetResolver.resolveWorkspace(gateway, slug);
    const workspaces = await gateway.readWorkspaces();
    if (workspaces.length === 0) {
      Envelope.rejectVerb(HTTP.NOT_FOUND, VERB_KEYS.TARGET_NOT_FOUND, [
        "workspace",
        "",
        Envelope.formatValidCodes([]),
      ]);
    }
    if (workspaces.length > 1) {
      Envelope.rejectVerb(HTTP.BAD_REQUEST, VERB_KEYS.WORKSPACE_AMBIGUOUS, [
        workspaces.map(row => row.slug).join(", "),
      ]);
    }
    return workspaces[0];
  }
}
