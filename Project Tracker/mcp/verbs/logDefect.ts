import { z } from "zod";

import { CODES } from "../../srv/modules/shared/constants.js";

import { Addressing } from "./shared/addressing.js";
import {
  ACTIVITY_KINDS,
  DEFECT_SEVERITIES,
  HTTP,
  VERB_KEYS,
} from "./shared/constants.js";
import { Envelope } from "./shared/envelope.js";
import { VerbRunner } from "./shared/runVerb.js";
import { TargetResolver } from "./shared/targetResolver.js";
import type { TrackerGateway } from "./shared/trackerGateway.js";
import type {
  LogDefectInput,
  NextAction,
  VerbContext,
  VerbDefinition,
  VerbResult,
} from "./shared/types.js";

/**
 * Records a defect against one story or against the sprint. Exactly one scope
 * is carried: with neither there is nothing to resolve, and with both there is
 * no rule saying which wins.
 */
export class LogDefectVerb implements VerbDefinition {
  readonly name = "log_defect";
  readonly title = "Log defect";
  readonly description = [
    "Record a defect against one story or against the sprint.",
    "",
    "Supply exactly one of story or workspace. Both are optional in the",
    "schema because either may be the one used, but a call carrying neither",
    "or both is refused: with neither there is nothing to resolve, and with",
    "both no rule says which wins.",
    "",
    "Returns the new defect's id.",
  ].join("\n");
  readonly inputShape = {
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
  readonly readOnly = false;

  /**
   * Records the defect in whichever scope the caller named.
   * @param ctx The connected service and the calling agent's identity.
   * @param input The scope, the severity, and the defect itself.
   * @returns The success or failure envelope, carrying the new defect's id.
   */
  async run(ctx: VerbContext, input: LogDefectInput): Promise<VerbResult> {
    return VerbRunner.runWriteVerb(ctx, async (gateway, timestamp) => {
      // The advertised schema carries the same code list, but it only guards the
      // transport: a verb called in-process reaches the store otherwise, where a
      // bad code is a driver constraint error rather than a named 400.
      if (!(DEFECT_SEVERITIES as readonly string[]).includes(input.severity)) {
        Envelope.rejectVerb(
          HTTP.BAD_REQUEST,
          VERB_KEYS.VALUE_NOT_IN_CODE_LIST,
          [input.severity, DEFECT_SEVERITIES.join(", ")],
          { target: "severity" },
        );
      }
      const scope = await this._resolveDefectScope(gateway, input);
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
  private async _resolveDefectScope(
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
      Envelope.rejectVerb(HTTP.BAD_REQUEST, VERB_KEYS.DEFECT_SCOPE_REQUIRED);
    }
    if (hasStory) {
      const { workspace, milestone } = await TargetResolver.resolveStoryContext(
        gateway,
        input.story as string,
      );
      const chain = await gateway.readChain(milestone.ID);
      return {
        workspaceId: workspace.ID,
        milestoneId: milestone.ID,
        initiativeId: null,
        target: Addressing.buildActivityTarget(workspace.slug, milestone.storyId),
        nextAction: TargetResolver.resolveNextAction(
          chain,
          workspace.slug,
          milestone.storyId,
        ),
      };
    }
    const { workspace, initiative } = await TargetResolver.resolveActiveSprint(
      gateway,
      input.workspace as string,
    );
    return {
      workspaceId: workspace.ID,
      milestoneId: null,
      initiativeId: initiative.ID,
      target: Addressing.buildActivityTarget(workspace.slug),
      nextAction: null,
    };
  }
}
