import { CODES } from "../shared/constants.js";

import { NEXT_ACTION } from "./constants.js";
import type {
  CandidateResolution,
  CandidateStory,
  StageFacts,
} from "./types.js";

/**
 * The one next-action engine every consumer shares: the next_action verb, the
 * project view and every write verb's answer. It reads stages only, never a
 * story's derived status, and writes nothing. It sits outside both the handler
 * and the verb layer for the same reason MilestoneStatus does.
 */
export class NextActionResolver {
  /**
   * Derives a story's tier from its stages. A story with no open stage is no
   * candidate and has no tier, which is what keeps a chainless story's vacuous
   * Done out of the comparison.
   * @param tasks The story's stages.
   * @returns 1 resuming, 2 fresh, 3 optional work only, or null for no candidate.
   */
  static deriveTier(tasks: StageFacts[]): number | null {
    const open = tasks.filter(task => NextActionResolver._isOpen(task));
    if (open.length === 0) return null;
    const blockingOpen = open.some(task =>
      NextActionResolver._isBlocking(task),
    );
    if (!blockingOpen) return NEXT_ACTION.TIER.OPTIONAL_ONLY;
    const started = tasks.some(
      task => task.status_code !== CODES.TASK_STATUS.NOT_STARTED,
    );
    return started ? NEXT_ACTION.TIER.RESUMING : NEXT_ACTION.TIER.FRESH;
  }

  /**
   * Lists the open blocking stages ahead of a position, earliest first — the set
   * a predecessor guard refuses on, so the guard and the queue's blocker are one
   * computation. Recommended never blocks.
   * @param rows The chain, in any order.
   * @param position The position of the row being judged.
   * @param completeCode The status code that means a row is done.
   * @returns The open blockers in position order.
   */
  static listOpenBlockers<T extends StageFacts>(
    rows: T[],
    position: number,
    completeCode: string = CODES.TASK_STATUS.COMPLETE,
  ): T[] {
    return NextActionResolver._sortByPosition(rows).filter(
      row =>
        row.stepPosition < position &&
        NextActionResolver._isBlocking(row) &&
        row.status_code !== completeCode,
    );
  }

  /**
   * Orders the candidates: tier, then sprint position, then story position.
   * Stories with no open stage are dropped.
   * @param stories The stories to rank.
   * @returns The candidates, best first.
   */
  static sortCandidates<S extends CandidateStory>(stories: S[]): S[] {
    return stories
      .map(story => ({
        story,
        tier: NextActionResolver.deriveTier(story.tasks),
      }))
      .filter(ranked => ranked.tier !== null)
      .sort(
        (left, right) =>
          Number(left.tier) - Number(right.tier) ||
          left.story.initiativePosition - right.story.initiativePosition ||
          left.story.milestonePosition - right.story.milestonePosition,
      )
      .map(ranked => ranked.story);
  }

  /**
   * Selects the first candidate and walks it: one selector plus one walk, the
   * same walk a story-scoped call uses.
   * @param stories The stories in scope.
   * @returns The winning story, its next stage and its tier, or null when nothing is open.
   */
  static resolveAcrossStories<S extends CandidateStory>(
    stories: S[],
  ): CandidateResolution<S> | null {
    const [story] = NextActionResolver.sortCandidates(stories);
    if (!story) return null;
    return {
      story,
      task: NextActionResolver.resolveWithinStory(
        story.tasks,
      ) as S["tasks"][number],
      tier: NextActionResolver.deriveTier(story.tasks) as number,
    };
  }

  /**
   * Resolves one story alone, without consulting any other story's rank.
   * @param tasks The story's stages.
   * @returns The next stage and the story's tier, or null when nothing is open.
   */
  static resolveStory<T extends StageFacts>(
    tasks: T[],
  ): { task: T; tier: number } | null {
    const resolved = NextActionResolver.resolveAcrossStories([
      { initiativePosition: 0, milestonePosition: 0, tasks },
    ]);
    return resolved ? { task: resolved.task, tier: resolved.tier } : null;
  }

  /**
   * Walks a story's stages in position order to the first open one, whatever
   * its kind. Rows arrive from more than one reader, so the walk sorts itself.
   * @param tasks The story's stages, in any order.
   * @returns The first open stage, or null when none is.
   */
  static resolveWithinStory<T extends StageFacts>(tasks: T[]): T | null {
    return (
      NextActionResolver._sortByPosition(tasks).find(task =>
        NextActionResolver._isOpen(task),
      ) ?? null
    );
  }

  /**
   * Reports whether a stage can block: Required, or Conditional and so materialised.
   * @param task The stage.
   * @returns True unless the stage is Recommended.
   */
  private static _isBlocking(task: StageFacts): boolean {
    return task.stepKind !== CODES.STEP_KIND.RECOMMENDED;
  }

  /**
   * Reports whether a stage is still to do: Not Started or In Progress.
   * @param task The stage.
   * @returns True unless the stage is complete.
   */
  private static _isOpen(task: StageFacts): boolean {
    return task.status_code !== CODES.TASK_STATUS.COMPLETE;
  }

  /**
   * Copies a chain into position order, leaving the caller's array alone.
   * @param rows The chain.
   * @returns The rows, lowest position first.
   */
  private static _sortByPosition<T extends StageFacts>(rows: T[]): T[] {
    return [...rows].sort(
      (left, right) => left.stepPosition - right.stepPosition,
    );
  }
}
