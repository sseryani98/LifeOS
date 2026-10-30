import { z } from "zod";

import { CODES } from "../../srv/modules/shared/constants.js";

import { Addressing } from "./shared/addressing.js";
import { ACTIVITY_KINDS, HTTP, VERB_KEYS } from "./shared/constants.js";
import { Envelope } from "./shared/envelope.js";
import { VerbRunner } from "./shared/runVerb.js";
import type {
  ResolveDefectInput,
  VerbContext,
  VerbDefinition,
  VerbResult,
} from "./shared/types.js";

/**
 * Closes a defect. The resolution is required because a closed defect with no
 * resolution is the state the register exists to make impossible.
 */
export class ResolveDefectVerb implements VerbDefinition {
  readonly name = "resolve_defect";
  readonly title = "Resolve defect";
  readonly description = [
    "Close a defect, recording how it was resolved.",
    "",
    "The resolution text is required and may not be blank: a closed defect",
    "with no resolution is the state this register exists to make impossible.",
    "Take the defect identifier from log_defect's result or from project_view.",
  ].join("\n");
  readonly inputShape = {
    defect: z.string().describe("Identifier of the defect to close"),
    resolution: z.string().describe("How the defect was resolved"),
  };
  readonly readOnly = false;

  /**
   * Closes the defect the caller addressed.
   * @param ctx The connected service and the calling agent's identity.
   * @param input The defect and how it was resolved.
   * @returns The success or failure envelope.
   */
  async run(ctx: VerbContext, input: ResolveDefectInput): Promise<VerbResult> {
    return VerbRunner.runWriteVerb(ctx, async (gateway, timestamp) => {
      if (!input.resolution.trim()) {
        Envelope.rejectVerb(
          HTTP.BAD_REQUEST,
          VERB_KEYS.DEFECT_RESOLUTION_REQUIRED,
        );
      }
      const defect = await gateway.readDefect(input.defect);
      if (!defect) {
        Envelope.rejectVerb(
          HTTP.NOT_FOUND,
          VERB_KEYS.TARGET_NOT_FOUND,
          ["defect", input.defect, ""],
          { target: input.defect },
        );
      }
      await gateway.updateDefect(defect.ID, {
        status_code: CODES.DEFECT_STATUS.CLOSED,
        resolution: input.resolution.trim(),
      });
      await gateway.insertActivity(
        {
          kind: ACTIVITY_KINDS.DEFECT_RESOLVED,
          target: Addressing.buildActivityTarget(defect.workspaceSlug),
          workspaceId: defect.workspace_ID,
          payload: { defectId: defect.ID },
        },
        ctx.actor,
        timestamp,
      );
      return { nextAction: null };
    });
  }
}
