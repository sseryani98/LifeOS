import { CODES } from "../../../srv/modules/shared/constants.js";

import { GUARD, HTTP, VERB_KEYS } from "./constants.js";
import { parseStoryReference } from "./addressing.js";
import { rejectVerb, resolveMessage } from "./envelope.js";
import type { TrackerGateway } from "./trackerGateway.js";
import type {
  ChainRow,
  InitiativeRow,
  MilestoneRow,
  NextAction,
  SubtaskRow,
  VerbWarning,
  WorkspaceRow,
} from "./types.js";

/**
 * Refuses a call that declares no caller.
 * @param actor The identity the caller declared.
 * @returns The trimmed identity.
 */
export function assertCallerIdentity(actor: string): string {
  const trimmed = (actor ?? "").trim();
  if (!trimmed) {
    rejectVerb(HTTP.BAD_REQUEST, VERB_KEYS.IDENTITY_MISSING);
  }
  return trimmed;
}

/**
 * Refuses a transition on a stage that is already complete, and hands back the
 * state the caller needs to decide what to do instead.
 * @param task The stage the caller addressed.
 */
export function assertStageNotComplete(task: ChainRow): void {
  if (task.status_code !== CODES.TASK_STATUS.COMPLETE) return;
  rejectVerb(
    HTTP.CONFLICT,
    VERB_KEYS.STAGE_ALREADY_COMPLETE,
    [task.step_code, task.status_code, task.completedAt ?? ""],
    {
      target: task.step_code,
      remediation: resolveMessage(GUARD.REMEDIATION_REOPEN_STAGE),
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
export function assertStageNotBlocked(chain: ChainRow[], task: ChainRow): void {
  const blocking = chain.filter(
    row =>
      row.stepPosition < task.stepPosition &&
      row.stepKind !== CODES.STEP_KIND.RECOMMENDED &&
      row.status_code !== CODES.TASK_STATUS.COMPLETE,
  );
  if (blocking.length === 0) return;
  const remediation = resolveMessage(GUARD.REMEDIATION_RUN_DRIVER, [
    blocking.map(row => row.step_code).join(", "),
    blocking.map(row => row.driver).join(", "),
  ]);
  rejectVerb(
    HTTP.CONFLICT,
    VERB_KEYS.STAGE_BLOCKED,
    [task.step_code],
    {
      target: task.step_code,
      remediation,
      rule: GUARD.PREDECESSOR_OPEN_RULE,
    },
  );
}

/**
 * Refuses a completion on a stage nobody started.
 * @param task The stage the caller addressed.
 */
export function assertStageStarted(task: ChainRow): void {
  if (task.status_code !== CODES.TASK_STATUS.NOT_STARTED) return;
  rejectVerb(
    HTTP.CONFLICT,
    VERB_KEYS.STAGE_NOT_STARTED,
    [task.step_code],
    {
      target: task.step_code,
      remediation: resolveMessage(GUARD.REMEDIATION_START_STAGE),
    },
  );
}

/**
 * Names every step still open under a stage being completed. Open steps warn;
 * they never block.
 * @param subtasks The stage's materialised steps.
 * @returns One warning per open step.
 */
export function collectOpenSubtaskWarnings(
  subtasks: SubtaskRow[],
): VerbWarning[] {
  return subtasks
    .filter(row => row.status_code !== CODES.SUBTASK_STATUS.COMPLETE)
    .map(row => ({
      code: VERB_KEYS.STAGE_SUBTASKS_OPEN,
      message: resolveMessage(VERB_KEYS.STAGE_SUBTASKS_OPEN, [row.step_code]),
      target: row.step_code,
    }));
}

/**
 * Locates a stage inside a story's chain.
 * @param chain The story's chain in library position order.
 * @param stepCode The stage code the caller addressed.
 * @returns The matching chain row.
 */
export function resolveStage(chain: ChainRow[], stepCode: string): ChainRow {
  const task = chain.find(row => row.step_code === stepCode);
  if (!task) {
    rejectVerb(
      HTTP.NOT_FOUND,
      VERB_KEYS.TARGET_NOT_FOUND,
      ["stage", stepCode, chain.map(row => row.step_code).join(", ")],
      { target: stepCode },
    );
  }
  return task;
}

/**
 * Locates a step inside a stage.
 * @param subtasks The stage's materialised steps.
 * @param stepCode The step code the caller addressed.
 * @returns The matching step row.
 */
export function resolveSubtask(
  subtasks: SubtaskRow[],
  stepCode: string,
): SubtaskRow {
  const subtask = subtasks.find(row => row.step_code === stepCode);
  if (!subtask) {
    rejectVerb(
      HTTP.NOT_FOUND,
      VERB_KEYS.TARGET_NOT_FOUND,
      ["step", stepCode, subtasks.map(row => row.step_code).join(", ")],
      { target: stepCode },
    );
  }
  return subtask;
}

/**
 * Resolves the next incomplete stage of a story, in library position order and
 * regardless of kind. Null is a success: it means the chain is finished.
 * @param chain The story's chain in library position order.
 * @param storyId The story the chain belongs to.
 * @returns The next action, or null when no stage remains.
 */
export function resolveNextAction(
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
 * Resolves a qualified story reference to its workspace and story.
 * @param gateway The gateway the reads run through.
 * @param reference The `{workspace}/{story}` reference the caller supplied.
 * @returns The workspace and the story it names.
 */
export async function resolveStoryContext(
  gateway: TrackerGateway,
  reference: string,
): Promise<{ workspace: WorkspaceRow; milestone: MilestoneRow }> {
  const { workspaceSlug, storyId } = parseStoryReference(reference);
  const workspace = await resolveWorkspace(gateway, workspaceSlug);
  const milestone = await gateway.readMilestone(workspace.ID, storyId);
  if (!milestone) {
    rejectVerb(
      HTTP.NOT_FOUND,
      VERB_KEYS.TARGET_NOT_FOUND,
      ["story", storyId, workspace.slug],
      { target: storyId },
    );
  }
  return { workspace, milestone };
}

/**
 * Resolves a sprint-scoped write's target: the one rule saying sprint scope
 * means the workspace's active initiative, shared by every verb that files a
 * register row against the sprint.
 * @param gateway The gateway the reads run through.
 * @param slug The workspace slug the caller supplied.
 * @returns The workspace and its active initiative.
 */
export async function resolveActiveSprint(
  gateway: TrackerGateway,
  slug: string,
): Promise<{ workspace: WorkspaceRow; initiative: InitiativeRow }> {
  const workspace = await resolveWorkspace(gateway, slug);
  const initiative = await gateway.readActiveInitiative(workspace.ID);
  if (!initiative) {
    rejectVerb(HTTP.NOT_FOUND, VERB_KEYS.TARGET_NOT_FOUND, [
      "active sprint",
      workspace.slug,
      "",
    ]);
  }
  return { workspace, initiative };
}

/**
 * Resolves a workspace slug.
 * @param gateway The gateway the read runs through.
 * @param slug The workspace slug the caller supplied.
 * @returns The workspace row.
 */
export async function resolveWorkspace(
  gateway: TrackerGateway,
  slug: string,
): Promise<WorkspaceRow> {
  const workspace = await gateway.readWorkspaceBySlug(slug);
  if (!workspace) {
    rejectVerb(
      HTTP.NOT_FOUND,
      VERB_KEYS.TARGET_NOT_FOUND,
      ["workspace", slug, ""],
      { target: slug },
    );
  }
  return workspace;
}
