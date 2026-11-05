import { CODES } from "../../../srv/modules/shared/constants.js";

import { GUARD, HTTP, VERB_KEYS, WFL_KEYS } from "./constants.js";
import { Envelope } from "./envelope.js";
import type { TrackerGateway } from "./trackerGateway.js";
import type { ChainRow, SubtaskRow, VerbWarning } from "./types.js";

/**
 * The methodology guards the stage verbs share; the lookups that resolve what
 * a caller addressed live in TargetResolver. Every rejection here is a named
 * answer, not a fault.
 */
export class StageGuards {
  /**
   * Refuses a call that declares no caller.
   * @param actor The identity the caller declared.
   * @returns The trimmed identity.
   */
  static assertCallerIdentity(actor: string): string {
    const trimmed = (actor ?? "").trim();
    if (!trimmed) {
      Envelope.rejectVerb(HTTP.BAD_REQUEST, VERB_KEYS.IDENTITY_MISSING);
    }
    return trimmed;
  }

  /**
   * Refuses a human-only stage's completion by any caller whose seeded kind is
   * not human. The kind is read from the actor code list rather than compared
   * against a name, so a system identity is refused exactly as an agent is and
   * any identity seeded as human may close the stage.
   * @param gateway The gateway the actor read runs through.
   * @param actor The identity the caller declared.
   * @param task The stage the caller addressed.
   * @returns Resolves when the caller may close the stage.
   */
  static async assertHumanCaller(
    gateway: TrackerGateway,
    actor: string,
    task: ChainRow,
  ): Promise<void> {
    if (!task.requiresHuman) return;
    const kind = await gateway.readActorKind(actor.trim());
    if (kind === CODES.ACTOR_KIND.HUMAN) return;
    Envelope.rejectVerb(
      HTTP.CONFLICT,
      WFL_KEYS.STAGE_HUMAN_ONLY,
      [task.step_code],
      {
        target: task.step_code,
        remediation: Envelope.resolveMessage(GUARD.REMEDIATION_HUMAN_ONLY, [
          task.step_code,
          task.driver,
        ]),
      },
    );
  }

  /**
   * Refuses a write from an identity the actor code list does not carry. The
   * activity row's foreign key would refuse it anyway, but only on a database
   * that enforces it, and only as an unnamed fault the caller cannot act on.
   * @param gateway The gateway the actor read runs through.
   * @param actor The trimmed identity the caller declared.
   * @returns Resolves when the identity is seeded.
   */
  static async assertKnownActor(
    gateway: TrackerGateway,
    actor: string,
  ): Promise<void> {
    const codes = await gateway.readActorCodes();
    if (codes.includes(actor)) return;
    Envelope.rejectVerb(HTTP.BAD_REQUEST, VERB_KEYS.IDENTITY_UNKNOWN, [
      actor,
      Envelope.formatValidCodes(codes),
    ]);
  }

  /**
   * Refuses a reopen of a stage that is not complete: anything else would make
   * the reopen an ungated start, skipping the predecessor guard.
   * @param task The stage the caller addressed.
   */
  static assertStageComplete(task: ChainRow): void {
    if (task.status_code === CODES.TASK_STATUS.COMPLETE) return;
    // A running stage is cleared by finishing it; start_stage would refuse it.
    const remediation =
      task.status_code === CODES.TASK_STATUS.IN_PROGRESS
        ? GUARD.REMEDIATION_COMPLETE_STAGE
        : GUARD.REMEDIATION_START_STAGE;
    Envelope.rejectVerb(
      HTTP.CONFLICT,
      WFL_KEYS.STAGE_NOT_COMPLETE,
      [task.step_code, task.status_code],
      {
        target: task.step_code,
        remediation: Envelope.resolveMessage(remediation),
      },
    );
  }

  /**
   * Refuses a completion while a blocking stage earlier in library position order
   * is still open, naming the whole blocking set and the command that clears each.
   * A Recommended step never blocks, and a Conditional step that was not
   * materialised has no row to block with.
   * @param chain The story's chain in library position order.
   * @param task The stage the caller addressed.
   */
  static assertStageNotBlocked(chain: ChainRow[], task: ChainRow): void {
    const blocking = chain.filter(row =>
      StageGuards._isOpenBlocker(
        row,
        task.stepPosition,
        CODES.TASK_STATUS.COMPLETE,
      ),
    );
    if (blocking.length === 0) return;
    Envelope.rejectVerb(
      HTTP.CONFLICT,
      VERB_KEYS.STAGE_BLOCKED,
      [task.step_code],
      {
        target: task.step_code,
        remediation: StageGuards._buildRunDriverRemediation(blocking),
        rule: WFL_KEYS.STAGE_PREDECESSOR_OPEN,
      },
    );
  }

  /**
   * Refuses a transition on a stage that is already complete, and hands back the
   * state the caller needs to decide what to do instead.
   * @param task The stage the caller addressed.
   */
  static assertStageNotComplete(task: ChainRow): void {
    if (task.status_code !== CODES.TASK_STATUS.COMPLETE) return;
    Envelope.rejectVerb(
      HTTP.CONFLICT,
      VERB_KEYS.STAGE_ALREADY_COMPLETE,
      [task.step_code, task.status_code, task.completedAt ?? ""],
      {
        target: task.step_code,
        remediation: Envelope.resolveMessage(GUARD.REMEDIATION_REOPEN_STAGE),
      },
    );
  }

  /**
   * Refuses a second start of a running stage, which would overwrite when it
   * really started, and hands that time back.
   * @param task The stage the caller addressed.
   */
  static assertStageNotInProgress(task: ChainRow): void {
    if (task.status_code !== CODES.TASK_STATUS.IN_PROGRESS) return;
    Envelope.rejectVerb(
      HTTP.CONFLICT,
      WFL_KEYS.STAGE_ALREADY_STARTED,
      [task.step_code, task.startedAt ?? ""],
      {
        target: task.step_code,
        remediation: Envelope.resolveMessage(GUARD.REMEDIATION_COMPLETE_STAGE),
      },
    );
  }

  /**
   * Refuses a completion on a stage nobody started.
   * @param task The stage the caller addressed.
   */
  static assertStageStarted(task: ChainRow): void {
    if (task.status_code !== CODES.TASK_STATUS.NOT_STARTED) return;
    Envelope.rejectVerb(
      HTTP.CONFLICT,
      VERB_KEYS.STAGE_NOT_STARTED,
      [task.step_code],
      {
        target: task.step_code,
        remediation: Envelope.resolveMessage(GUARD.REMEDIATION_START_STAGE),
      },
    );
  }

  /**
   * Refuses a step closed while a blocking step earlier in library position
   * order is still open, naming the whole blocking set and its command.
   * @param subtasks The stage's materialised steps in library position order.
   * @param subtask The step the caller addressed.
   */
  static assertSubtaskNotBlocked(
    subtasks: SubtaskRow[],
    subtask: SubtaskRow,
  ): void {
    const blocking = subtasks.filter(row =>
      StageGuards._isOpenBlocker(
        row,
        subtask.stepPosition,
        CODES.SUBTASK_STATUS.COMPLETE,
      ),
    );
    if (blocking.length === 0) return;
    Envelope.rejectVerb(
      HTTP.CONFLICT,
      WFL_KEYS.SUBTASK_PREDECESSOR_OPEN,
      [subtask.step_code],
      {
        target: subtask.step_code,
        remediation: StageGuards._buildRunDriverRemediation(blocking),
        rule: WFL_KEYS.SUBTASK_PREDECESSOR_OPEN,
      },
    );
  }

  /**
   * Refuses a second close of a step, which would overwrite when it really
   * finished, and hands that time back.
   * @param subtask The step the caller addressed.
   */
  static assertSubtaskNotComplete(subtask: SubtaskRow): void {
    if (subtask.status_code !== CODES.SUBTASK_STATUS.COMPLETE) return;
    Envelope.rejectVerb(
      HTTP.CONFLICT,
      WFL_KEYS.SUBTASK_ALREADY_COMPLETE,
      [subtask.step_code, subtask.completedAt ?? ""],
      {
        target: subtask.step_code,
        remediation: Envelope.resolveMessage(GUARD.REMEDIATION_NEXT_STEP),
      },
    );
  }

  /**
   * Refuses a step closed under a stage nobody started.
   * @param task The stage the step hangs off.
   * @param subtask The step the caller addressed.
   */
  static assertSubtaskStageStarted(task: ChainRow, subtask: SubtaskRow): void {
    if (task.status_code !== CODES.TASK_STATUS.NOT_STARTED) return;
    Envelope.rejectVerb(
      HTTP.CONFLICT,
      WFL_KEYS.SUBTASK_STAGE_NOT_STARTED,
      [task.step_code, subtask.step_code],
      {
        target: subtask.step_code,
        remediation: Envelope.resolveMessage(GUARD.REMEDIATION_START_STAGE),
      },
    );
  }

  /**
   * Refuses a story-mode test run against a stage that never started: the run
   * would be evidence for work that did not happen.
   * @param task The stage the run would link to.
   */
  static assertTestRunStageStarted(task: ChainRow): void {
    if (task.status_code !== CODES.TASK_STATUS.NOT_STARTED) return;
    Envelope.rejectVerb(
      HTTP.CONFLICT,
      WFL_KEYS.TESTRUN_STAGE_NOT_STARTED,
      [task.step_code],
      {
        target: task.step_code,
        remediation: Envelope.resolveMessage(GUARD.REMEDIATION_START_STAGE),
      },
    );
  }

  /**
   * Names every step still open under a stage being completed. Open steps warn;
   * they never block.
   * @param subtasks The stage's materialised steps.
   * @returns One warning per open step.
   */
  static buildOpenSubtaskWarnings(subtasks: SubtaskRow[]): VerbWarning[] {
    return subtasks
      .filter(row => row.status_code !== CODES.SUBTASK_STATUS.COMPLETE)
      .map(row => ({
        code: VERB_KEYS.STAGE_SUBTASKS_OPEN,
        message: Envelope.resolveMessage(VERB_KEYS.STAGE_SUBTASKS_OPEN, [
          row.step_code,
        ]),
        target: row.step_code,
      }));
  }

  /**
   * Builds the remediation naming a whole blocking set in position order and
   * the command that clears it. The commands come from the seeded drivers, so a
   * renamed driver is what the caller is told; a driver shared by several
   * blockers is named once.
   * @param blocking The open blockers, in library position order.
   * @returns The resolved remediation.
   */
  private static _buildRunDriverRemediation(
    blocking: { step_code: string; driver: string }[],
  ): string {
    const drivers = [...new Set(blocking.map(row => row.driver))];
    return Envelope.resolveMessage(GUARD.REMEDIATION_RUN_DRIVER, [
      blocking.map(row => row.step_code).join(", "),
      drivers.join(", "),
    ]);
  }

  /**
   * The blocking rule, named once so stages and steps cannot drift: an
   * earlier row blocks unless it is Recommended or already complete.
   * @param row The candidate blocker.
   * @param position The library position of the row being transitioned.
   * @param completeCode The status code that means the row is done.
   * @returns Whether the row blocks the transition.
   */
  private static _isOpenBlocker(
    row: Pick<
      ChainRow | SubtaskRow,
      "stepPosition" | "stepKind" | "status_code"
    >,
    position: number,
    completeCode: string,
  ): boolean {
    return (
      row.stepPosition < position &&
      row.stepKind !== CODES.STEP_KIND.RECOMMENDED &&
      row.status_code !== completeCode
    );
  }
}
