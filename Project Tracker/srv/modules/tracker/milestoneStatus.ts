import { CODES } from "../shared/constants.js";

/**
 * Derives a story's status from its chain. It sits outside both the handler
 * and the verb layer because both read it and neither may write it. An empty
 * chain derives Done: only a story created Done is chainless. A chain of only
 * recommended steps has no blocking set, so it falls through to the started
 * checks rather than being vacuously Done.
 * @param tasks The story's stages, each with its library step kind.
 * @returns The derived status code.
 */
export function deriveMilestoneStatus(
  tasks: { status_code: string; stepKind: string }[],
): string {
  if (tasks.length === 0) return CODES.MILESTONE_STATUS.DONE;
  const blocking = tasks.filter(
    task => task.stepKind !== CODES.STEP_KIND.RECOMMENDED,
  );
  const allBlockingComplete =
    blocking.length > 0 &&
    blocking.every(task => task.status_code === CODES.TASK_STATUS.COMPLETE);
  if (allBlockingComplete) return CODES.MILESTONE_STATUS.DONE;
  const noneStarted = tasks.every(
    task => task.status_code === CODES.TASK_STATUS.NOT_STARTED,
  );
  return noneStarted
    ? CODES.MILESTONE_STATUS.BACKLOG
    : CODES.MILESTONE_STATUS.IN_PROGRESS;
}
