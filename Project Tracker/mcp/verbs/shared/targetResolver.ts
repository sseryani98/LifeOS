import { CODES } from "../../../srv/modules/shared/constants.js";

import { Addressing } from "./addressing.js";
import { HTTP, VERB_KEYS } from "./constants.js";
import { Envelope } from "./envelope.js";
import type { TrackerGateway } from "./trackerGateway.js";
import type {
  ChainRow,
  InitiativeRow,
  MilestoneRow,
  NextAction,
  SubtaskRow,
  WorkspaceRow,
} from "./types.js";

/**
 * The lookups that resolve what a caller addressed — workspace, story, sprint,
 * stage, step — and the next action a chain points at. An unresolved target is
 * refused with the codes the caller could have named instead.
 */
export class TargetResolver {
  /**
   * Resolves a sprint-scoped write's target: the one rule saying sprint scope
   * means the workspace's active initiative, shared by every verb that files a
   * register row against the sprint.
   * @param gateway The gateway the reads run through.
   * @param slug The workspace slug the caller supplied.
   * @returns The workspace and its active initiative.
   */
  static async resolveActiveSprint(
    gateway: TrackerGateway,
    slug: string,
  ): Promise<{ workspace: WorkspaceRow; initiative: InitiativeRow }> {
    const workspace = await TargetResolver.resolveWorkspace(gateway, slug);
    const initiative = await gateway.readActiveInitiative(workspace.ID);
    if (!initiative) {
      Envelope.rejectVerb(
        HTTP.NOT_FOUND,
        VERB_KEYS.SPRINT_NONE_ACTIVE,
        [workspace.slug],
        { target: workspace.slug },
      );
    }
    return { workspace, initiative };
  }

  /**
   * Resolves the next incomplete stage of a story, in library position order and
   * regardless of kind. Null is a success: it means the chain is finished.
   * @param chain The story's chain in library position order.
   * @param storyId The story the chain belongs to.
   * @returns The next action, or null when no stage remains.
   */
  static resolveNextAction(
    chain: ChainRow[],
    storyId: string,
  ): NextAction | null {
    const next = chain.find(
      row => row.status_code !== CODES.TASK_STATUS.COMPLETE,
    );
    if (!next) return null;
    return {
      storyId,
      stepCode: next.step_code,
      label: next.stepName,
      driver: next.driver,
    };
  }

  /**
   * Locates a stage inside a story's chain.
   * @param chain The story's chain in library position order.
   * @param stepCode The stage code the caller addressed.
   * @returns The matching chain row.
   */
  static resolveStage(chain: ChainRow[], stepCode: string): ChainRow {
    const task = chain.find(row => row.step_code === stepCode);
    if (!task) {
      Envelope.rejectVerb(
        HTTP.NOT_FOUND,
        VERB_KEYS.TARGET_NOT_FOUND,
        [
          "stage",
          stepCode,
          Envelope.formatValidCodes(chain.map(row => row.step_code)),
        ],
        { target: stepCode },
      );
    }
    return task;
  }

  /**
   * Resolves a qualified story reference to its workspace and story.
   * @param gateway The gateway the reads run through.
   * @param reference The `{workspace}/{story}` reference the caller supplied.
   * @returns The workspace and the story it names.
   */
  static async resolveStoryContext(
    gateway: TrackerGateway,
    reference: string,
  ): Promise<{ workspace: WorkspaceRow; milestone: MilestoneRow }> {
    const { workspaceSlug, storyId } =
      Addressing.parseStoryReference(reference);
    const workspace = await TargetResolver.resolveWorkspace(
      gateway,
      workspaceSlug,
    );
    const milestone = await gateway.readMilestone(workspace.ID, storyId);
    if (!milestone) {
      const stories = await gateway.readMilestones(workspace.ID);
      Envelope.rejectVerb(
        HTTP.NOT_FOUND,
        VERB_KEYS.TARGET_NOT_FOUND,
        [
          "story",
          storyId,
          Envelope.formatValidCodes(stories.map(row => row.storyId)),
        ],
        { target: storyId },
      );
    }
    return { workspace, milestone };
  }

  /**
   * Locates a step inside a stage.
   * @param subtasks The stage's materialised steps.
   * @param stepCode The step code the caller addressed.
   * @returns The matching step row.
   */
  static resolveSubtask(subtasks: SubtaskRow[], stepCode: string): SubtaskRow {
    const subtask = subtasks.find(row => row.step_code === stepCode);
    if (!subtask) {
      Envelope.rejectVerb(
        HTTP.NOT_FOUND,
        VERB_KEYS.TARGET_NOT_FOUND,
        [
          "step",
          stepCode,
          Envelope.formatValidCodes(subtasks.map(row => row.step_code)),
        ],
        { target: stepCode },
      );
    }
    return subtask;
  }

  /**
   * Resolves a workspace slug.
   * @param gateway The gateway the read runs through.
   * @param slug The workspace slug the caller supplied.
   * @returns The workspace row.
   */
  static async resolveWorkspace(
    gateway: TrackerGateway,
    slug: string,
  ): Promise<WorkspaceRow> {
    const workspace = await gateway.readWorkspaceBySlug(slug);
    if (!workspace) {
      const workspaces = await gateway.readWorkspaces();
      Envelope.rejectVerb(
        HTTP.NOT_FOUND,
        VERB_KEYS.TARGET_NOT_FOUND,
        [
          "workspace",
          slug,
          Envelope.formatValidCodes(workspaces.map(row => row.slug)),
        ],
        { target: slug },
      );
    }
    return workspace;
  }
}
