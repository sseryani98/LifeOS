import { z } from "zod";

import { CODES } from "../../srv/modules/shared/constants.js";

import { Addressing } from "./shared/addressing.js";
import {
  ACTIVITY_KINDS,
  FRICEW_TYPES,
  HTTP,
  PLANNING,
  VERB_KEYS,
} from "./shared/constants.js";
import { Envelope } from "./shared/envelope.js";
import { VerbRunner } from "./shared/runVerb.js";
import { TargetResolver } from "./shared/targetResolver.js";
import type { TrackerGateway } from "./shared/trackerGateway.js";
import type {
  InitiativeRow,
  PlannedStory,
  PlanSprintInput,
  VerbContext,
  VerbDefinition,
  VerbResult,
} from "./shared/types.js";

/**
 * Creates one sprint and its stories in a single call, emitting one event for
 * the sprint rather than one per story.
 */
export class PlanSprintVerb implements VerbDefinition {
  readonly name = "plan_sprint";
  readonly title = "Plan sprint";
  readonly description = [
    "Create one sprint and its stories in a single call.",
    "",
    "The stories arrive in the order they will be built and keep it. A story",
    "id already used in the workspace is refused, and each story's type must",
    "be one of the six FRICEW codes the schema declares.",
    "A sprint needs at least one story, and its name must be new to the",
    "workspace. There is no verb that adds a story to an existing sprint.",
    "",
    "Returns the new sprint's id.",
  ].join("\n");
  readonly inputShape = {
    workspace: z.string().describe("Workspace slug the sprint is planned in"),
    name: z.string().describe("Sprint name, such as W1-S4"),
    goal: z.string().describe("What the sprint is for"),
    branch: z.string().describe("Git branch the sprint runs on"),
    stories: z
      .array(
        // .strict() here for the same reason server.ts wraps the top level: a
        // story row carrying a key this shape never declared would otherwise be
        // planned with that key silently dropped.
        z
          .object({
            id: z.string(),
            type: z.enum(FRICEW_TYPES),
            description: z.string(),
            shipsUi: z.boolean(),
          })
          .strict(),
      )
      // A sprint is an Initiative and its stories; with none, the plan would
      // write an Active sprint that has nothing to build.
      .min(1)
      .describe("The sprint's stories, in the order they will be built"),
  };
  readonly readOnly = false;

  /**
   * Plans the sprint and its stories into the named workspace.
   * @param ctx The connected service and the calling agent's identity.
   * @param input The workspace, the sprint facts and its stories.
   * @returns The success or failure envelope, carrying the new sprint's id.
   */
  async run(ctx: VerbContext, input: PlanSprintInput): Promise<VerbResult> {
    return VerbRunner.runWriteVerb(ctx, async (gateway, timestamp) => {
      const workspace = await TargetResolver.resolveWorkspace(
        gateway,
        input.workspace,
      );
      const initiatives = await gateway.readInitiatives(workspace.ID);
      this._assertSprintNameFree(initiatives, input.name);
      await this._assertStoryIdsFree(gateway, workspace.ID, input.stories);
      const position =
        initiatives.reduce(
          (highest, row) => Math.max(highest, row.position),
          0,
        ) + PLANNING.POSITION_GAP;
      const initiativeId = await gateway.insertInitiative({
        name: input.name,
        goal: input.goal,
        branch: input.branch,
        status_code: CODES.INITIATIVE_STATUS.ACTIVE,
        position,
        workspace_ID: workspace.ID,
      });
      for (let index = 0; index < input.stories.length; index++) {
        const story = input.stories[index];
        await gateway.insertMilestone({
          storyId: story.id,
          fricewType_code: story.type,
          description: story.description,
          shipsUi: story.shipsUi,
          position: (index + 1) * PLANNING.POSITION_GAP,
          initiative_ID: initiativeId,
        });
      }
      await gateway.insertActivity(
        {
          kind: ACTIVITY_KINDS.SPRINT_PLANNED,
          target: Addressing.buildActivityTarget(workspace.slug),
          workspaceId: workspace.ID,
          payload: {
            initiativeId,
            stories: input.stories.map(story => story.id),
          },
        },
        ctx.actor,
        timestamp,
      );
      return { nextAction: null, extra: { initiativeId } };
    });
  }

  /**
   * A fail-fast mirror of TrackerService.checkInitiativeWrite, which owns the
   * per-workspace sprint-name rule. Raised here so the refusal names the sprint
   * as its `target`, which a handler rejection cannot carry in verb terms.
   * @param initiatives The workspace's existing sprints.
   * @param name The sprint name the caller asked for.
   */
  private _assertSprintNameFree(
    initiatives: InitiativeRow[],
    name: string,
  ): void {
    if (!initiatives.some(row => row.name === name)) return;
    Envelope.rejectVerb(HTTP.CONFLICT, VERB_KEYS.INITIATIVE_DUPLICATE, [name], {
      target: name,
    });
  }

  /**
   * A fail-fast mirror of TrackerService.checkMilestoneWrite, which owns the
   * workspace-wide story-ID rule. Checking here, before the first insert, also
   * catches an ID carried twice inside the plan and names it as the `target`.
   * @param gateway The gateway the read runs through.
   * @param workspaceId The workspace being planned into.
   * @param stories The stories the caller asked for.
   */
  private async _assertStoryIdsFree(
    gateway: TrackerGateway,
    workspaceId: string,
    stories: PlannedStory[],
  ): Promise<void> {
    const existing = new Set(
      (await gateway.readMilestones(workspaceId)).map(row => row.storyId),
    );
    for (const story of stories) {
      if (existing.has(story.id)) {
        Envelope.rejectVerb(
          HTTP.CONFLICT,
          VERB_KEYS.STORY_DUPLICATE,
          [story.id],
          { target: story.id },
        );
      }
      existing.add(story.id);
    }
  }
}
