import { z } from "zod";

import { CODES } from "../../srv/modules/shared/constants.js";

import { buildActivityTarget } from "./shared/addressing.js";
import { ACTIVITY_KINDS, HTTP, VERB_KEYS } from "./shared/constants.js";
import { rejectVerb } from "./shared/envelope.js";
import { runWriteVerb } from "./shared/runVerb.js";
import type {
  VerbContext,
  VerbDefinition,
  VerbResult,
} from "./shared/types.js";

/** The tool schema, as the transport advertises it. */
const inputShape = {
  defect: z.string().describe("Identifier of the defect to close"),
  resolution: z.string().describe("How the defect was resolved"),
};

interface ResolveDefectInput {
  defect: string;
  resolution: string;
}

/**
 * Closes a defect. The resolution is required because a closed defect with no
 * resolution is the state the register exists to make impossible.
 * @param ctx The connected service and the calling agent's identity.
 * @param input The defect and how it was resolved.
 * @returns The success or failure envelope.
 */
export async function resolveDefect(
  ctx: VerbContext,
  input: ResolveDefectInput,
): Promise<VerbResult> {
  return runWriteVerb(ctx, async (gateway, timestamp) => {
    if (!input.resolution.trim()) {
      rejectVerb(
        HTTP.BAD_REQUEST,
        VERB_KEYS.DEFECT_RESOLUTION_REQUIRED,
      );
    }
    const defect = await gateway.readDefect(input.defect);
    if (!defect) {
      rejectVerb(
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
        target: buildActivityTarget(defect.workspaceSlug),
        workspaceId: defect.workspace_ID,
        payload: { defectId: defect.ID },
      },
      ctx.actor,
      timestamp,
    );
    return { nextAction: null };
  });
}

/** The registered tool behind this verb. */
export const definition: VerbDefinition = {
  name: "resolve_defect",
  title: "Resolve defect",
  description: "Close a defect, recording how it was resolved.",
  inputShape,
  readOnly: false,
  run: (ctx, input) => resolveDefect(ctx, input as ResolveDefectInput),
};
