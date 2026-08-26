import type { ChainTaskRow, MilestoneRow } from "./types.js";

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
}
