import { CODES } from "../shared/constants.js";

import type {
  ChainTaskRow,
  LibraryStepRow,
  MilestoneRow,
  SubtaskInsertRow,
  TaskInsertRow,
} from "./types.js";

/** Shape translation between read results and the shapes the logic works on. */
export class TrackerMapper {
  /**
   * Walks a project-view read result and returns every Milestone row an expand
   * brought with it, so one derivation pass can annotate them all.
   * @param rows The project-view rows a read returned.
   * @returns The expanded Milestone rows, flattened across initiatives.
   */
  static listExpandedMilestones(
    rows: Record<string, unknown>[],
  ): MilestoneRow[] {
    const milestones: MilestoneRow[] = [];
    for (const row of rows) {
      const initiatives = row.initiatives;
      if (!Array.isArray(initiatives)) continue;
      for (const initiative of initiatives) {
        const nested = (initiative as Record<string, unknown>).milestones;
        if (!Array.isArray(nested)) continue;
        milestones.push(...(nested as MilestoneRow[]));
      }
    }
    return milestones;
  }

  /**
   * Buckets chain rows by the Milestone they belong to.
   * @param tasks The Task rows read across several Milestones.
   * @returns A map from Milestone ID to that Milestone's Tasks.
   */
  static groupTasksByMilestone(
    tasks: ChainTaskRow[],
  ): Map<string, ChainTaskRow[]> {
    const grouped = new Map<string, ChainTaskRow[]>();
    for (const task of tasks) {
      const bucket = grouped.get(task.milestone_ID);
      if (bucket) bucket.push(task);
      else grouped.set(task.milestone_ID, [task]);
    }
    return grouped;
  }

  /**
   * Shapes a library stage step into the Task row that materialises it. Every
   * materialised row starts Not Started. Kind, position and the human-only flag
   * are copied because the guards and the status derivation read them, and a
   * chain is never refreshed; the driver is not, because remediation must name
   * the command as seeded now.
   * @param taskId The identifier the new Task takes.
   * @param step The library stage step it materialises.
   * @param milestoneId The story the chain belongs to.
   * @returns The Task row to write.
   */
  static toTaskRow(
    taskId: string,
    step: LibraryStepRow,
    milestoneId: string,
  ): TaskInsertRow {
    return {
      ID: taskId,
      step_code: step.code,
      kind_code: step.kind_code,
      position: step.position,
      requiresHuman: step.requiresHuman,
      status_code: CODES.TASK_STATUS.NOT_STARTED,
      milestone_ID: milestoneId,
    };
  }

  /**
   * Shapes a library workflow step into the Subtask row that materialises it
   * under its stage, its guard inputs frozen for the same reason as a Task's.
   * @param step The library workflow step it materialises.
   * @param taskId The stage the step hangs off.
   * @returns The Subtask row to write.
   */
  static toSubtaskRow(step: LibraryStepRow, taskId: string): SubtaskInsertRow {
    return {
      step_code: step.code,
      kind_code: step.kind_code,
      position: step.position,
      requiresHuman: step.requiresHuman,
      status_code: CODES.SUBTASK_STATUS.NOT_STARTED,
      task_ID: taskId,
    };
  }
}
