import { z } from "zod";

import { buildActivityTarget } from "./shared/addressing.js";
import { ACTIVITY_KINDS, PLANNING, VERB_KEYS } from "./shared/constants.js";
import { rejectVerb } from "./shared/envelope.js";
import { runWriteVerb } from "./shared/runVerb.js";
import { toSecondPrecision } from "./shared/writeQueue.js";
import {
  resolveStage,
  resolveStoryContext,
  resolveWorkspace,
} from "./shared/stageGuards.js";
import type { TrackerGateway } from "./shared/trackerGateway.js";
import type {
  TestRunMetrics,
  VerbContext,
  VerbDefinition,
  VerbResult,
} from "./shared/types.js";

/** The tool schema, as the transport advertises it. */
export const inputShape = {
  story: z.string().optional().describe("Story reference, with a stage"),
  stage: z.string().optional().describe("Stage code the run belongs to"),
  workspace: z
    .string()
    .optional()
    .describe("Workspace slug, when the run belongs to no stage"),
  metrics: z
    .object({
      total: z.number().int(),
      passed: z.number().int(),
      failed: z.number().int(),
      pending: z.number().int().optional(),
      durationMs: z.number().int().optional(),
      linesPct: z.number().optional(),
      branchesPct: z.number().optional(),
      failures: z
        .array(
          z.object({
            suite: z.string(),
            title: z.string(),
            message: z.string(),
          }),
        )
        .optional(),
    })
    .describe("Counts and coverage from the run"),
  executedAt: z.string().describe("When the run executed, as an ISO timestamp"),
};

interface RecordTestRunInput {
  story?: string;
  stage?: string;
  workspace?: string;
  metrics: TestRunMetrics;
  executedAt: string;
}

/**
 * Records one test run against the stage that produced it, or against the
 * sprint when a bare run supplies no stage.
 * @param ctx The connected service and the calling agent's identity.
 * @param input The scope, the metrics and when the run executed.
 * @returns The success or failure envelope.
 */
export async function recordTestRun(
  ctx: VerbContext,
  input: RecordTestRunInput,
): Promise<VerbResult> {
  return runWriteVerb(ctx, async (gateway, timestamp) => {
    const scope = await _resolveTestRunScope(gateway, input);
    const metrics = input.metrics;
    await gateway.insertTestRun({
      total: metrics.total,
      passed: metrics.passed,
      failed: metrics.failed,
      pending: metrics.pending ?? null,
      durationMs: metrics.durationMs ?? null,
      linesPct: metrics.linesPct ?? null,
      branchesPct: metrics.branchesPct ?? null,
      failures: metrics.failures ? JSON.stringify(metrics.failures) : null,
      executedAt: toSecondPrecision(input.executedAt),
      task_ID: scope.taskId,
      initiative_ID: scope.initiativeId,
      workspace_ID: scope.workspaceId,
    });
    await gateway.insertActivity(
      {
        kind: ACTIVITY_KINDS.TEST_RUN_RECORDED,
        target: scope.target,
        workspaceId: scope.workspaceId,
        payload: { total: metrics.total, failed: metrics.failed },
      },
      ctx.actor,
      timestamp,
    );
    return { nextAction: null };
  });
}

/**
 * Resolves which of the two scopes the caller asked for. A story without a
 * stage is rejected rather than widened: it names a target that does not exist.
 * @param gateway The gateway the reads run through.
 * @param input The verb input carrying at most one scope.
 * @returns The workspace, the link to write and the activity target.
 */
async function _resolveTestRunScope(
  gateway: TrackerGateway,
  input: RecordTestRunInput,
): Promise<{
  workspaceId: string;
  taskId: string | null;
  initiativeId: string | null;
  target: string;
}> {
  const hasStory = Boolean(input.story?.trim());
  const hasStage = Boolean(input.stage?.trim());
  const hasWorkspace = Boolean(input.workspace?.trim());
  const storyMode = hasStory && hasStage;
  if (storyMode === hasWorkspace || (hasStory && !hasStage)) {
    rejectVerb(PLANNING.HTTP_BAD_REQUEST, VERB_KEYS.TESTRUN_SCOPE_REQUIRED);
  }
  if (storyMode) {
    const { workspace, milestone } = await resolveStoryContext(
      gateway,
      input.story as string,
    );
    const chain = await gateway.readChain(milestone.ID);
    const task = resolveStage(chain, input.stage as string);
    return {
      workspaceId: workspace.ID,
      taskId: task.ID,
      initiativeId: null,
      target: buildActivityTarget(
        workspace.slug,
        milestone.storyId,
        task.step_code,
      ),
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
    taskId: null,
    initiativeId: initiative.ID,
    target: buildActivityTarget(workspace.slug),
  };
}

/** The registered tool behind this verb. */
export const definition: VerbDefinition = {
  name: "record_test_run",
  title: "Record test run",
  description: "Record one test run against a stage or against the sprint.",
  inputShape,
  readOnly: false,
  run: (ctx, input) => recordTestRun(ctx, input as RecordTestRunInput),
};
