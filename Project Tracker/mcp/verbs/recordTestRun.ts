import { z } from "zod";

import { Addressing } from "./shared/addressing.js";
import { ACTIVITY_KINDS, HTTP, VERB_KEYS } from "./shared/constants.js";
import { Envelope } from "./shared/envelope.js";
import { VerbRunner } from "./shared/runVerb.js";
import { StageGuards } from "./shared/stageGuards.js";
import type { TrackerGateway } from "./shared/trackerGateway.js";
import type {
  RecordTestRunInput,
  VerbContext,
  VerbDefinition,
  VerbResult,
} from "./shared/types.js";
import { WriteQueue } from "./shared/writeQueue.js";

/**
 * Records one test run against the stage that produced it, or against the
 * sprint when a bare run supplies no stage.
 */
export class RecordTestRunVerb implements VerbDefinition {
  readonly name = "record_test_run";
  readonly title = "Record test run";
  readonly description = [
    "Record one test run against a stage or against the sprint.",
    "",
    "Two scopes, and exactly one of them: story together with stage, or",
    "workspace alone. All three are optional in the schema because each is",
    "used by one of the two forms; story without stage, or a form mixed with",
    "workspace, is refused, as is a story-mode run on a stage never started.",
    "",
    "Counts are non-negative, and passed + failed + pending may not exceed",
    "total; a run breaking either rule is refused and nothing is written.",
    "",
    "executedAt is an ISO timestamp carrying an offset.",
  ].join("\n");
  readonly inputShape = {
    story: z.string().optional().describe("Story reference, with a stage"),
    stage: z.string().optional().describe("Stage code the run belongs to"),
    workspace: z
      .string()
      .optional()
      .describe("Workspace slug, when the run belongs to no stage"),
    // Both objects are strict for the same reason server.ts wraps the top level:
    // a metric key this shape never declared is a recorded run missing the number
    // the caller thought it was recording.
    metrics: z
      .object({
        total: z.number().int().nonnegative(),
        passed: z.number().int().nonnegative(),
        failed: z.number().int().nonnegative(),
        pending: z.number().int().nonnegative().optional(),
        durationMs: z.number().int().optional(),
        linesPct: z.number().optional(),
        branchesPct: z.number().optional(),
        failures: z
          .array(
            z
              .object({
                suite: z.string(),
                title: z.string(),
                message: z.string(),
              })
              .strict(),
          )
          .optional(),
      })
      .strict()
      .describe("Counts and coverage from the run"),
    executedAt: z
      .iso
      .datetime({ offset: true })
      .describe("When the run executed, as an ISO timestamp"),
  };
  readonly readOnly = false;

  /**
   * Records the run in whichever scope the caller named.
   * @param ctx The connected service and the calling agent's identity.
   * @param input The scope, the metrics and when the run executed.
   * @returns The success or failure envelope.
   */
  async run(ctx: VerbContext, input: RecordTestRunInput): Promise<VerbResult> {
    return VerbRunner.runWriteVerb(ctx, async (gateway, timestamp) => {
      const executedAt = this._normalizeExecutedAt(input.executedAt);
      const scope = await this._resolveTestRunScope(gateway, input);
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
        executedAt,
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
   * Normalises the caller's timestamp to UTC before it is trimmed to whole
   * seconds: toSecondPrecision assumes a toISOString shape, and an offset form
   * would otherwise have its wall-clock time silently restamped as UTC.
   * @param executedAt The timestamp the caller supplied.
   * @returns The same instant as a second-precision UTC timestamp.
   */
  private _normalizeExecutedAt(executedAt: string): string {
    const parsed = new Date(executedAt);
    if (Number.isNaN(parsed.getTime())) {
      Envelope.rejectVerb(HTTP.BAD_REQUEST, VERB_KEYS.TIMESTAMP_INVALID, [
        executedAt,
      ]);
    }
    return WriteQueue.toSecondPrecision(parsed.toISOString());
  }

  /**
   * Resolves which of the two scopes the caller asked for. A scope must arrive
   * whole: a story without a stage — or a stage without a story — names a target
   * that does not exist, so both are rejected rather than widened.
   * @param gateway The gateway the reads run through.
   * @param input The verb input carrying at most one scope.
   * @returns The workspace, the link to write and the activity target.
   */
  private async _resolveTestRunScope(
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
    if (storyMode === hasWorkspace || hasStory !== hasStage) {
      Envelope.rejectVerb(HTTP.BAD_REQUEST, VERB_KEYS.TESTRUN_SCOPE_REQUIRED);
    }
    if (storyMode) {
      const { workspace, milestone } = await StageGuards.resolveStoryContext(
        gateway,
        input.story as string,
      );
      const chain = await gateway.readChain(milestone.ID);
      const task = StageGuards.resolveStage(chain, input.stage as string);
      StageGuards.assertTestRunStageStarted(task);
      return {
        workspaceId: workspace.ID,
        taskId: task.ID,
        initiativeId: null,
        target: Addressing.buildActivityTarget(
          workspace.slug,
          milestone.storyId,
          task.step_code,
        ),
      };
    }
    const { workspace, initiative } = await StageGuards.resolveActiveSprint(
      gateway,
      input.workspace as string,
    );
    return {
      workspaceId: workspace.ID,
      taskId: null,
      initiativeId: initiative.ID,
      target: Addressing.buildActivityTarget(workspace.slug),
    };
  }
}
