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
import { StageGuards } from "./shared/stageGuards.js";
import type { TrackerGateway } from "./shared/trackerGateway.js";
import type {
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
    "There is no verb that adds a story to an existing sprint.",
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
      const workspace = await StageGuards.resolveWorkspace(
        gateway,
        input.workspace,
      );
      await this._assertStoryIdsFree(gateway, workspace.ID, input.stories);
      const initiatives = await gateway.readInitiatives(workspace.ID);
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
   * Refuses a plan that would create a story ID already live in the workspace —
   * or carried twice inside the plan itself. The uniqueness the model enforces
   * is per sprint; the addressing form the verbs use is per workspace, so this
   * is the wider of the two.
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
