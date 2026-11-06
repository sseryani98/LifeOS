import { NEXT_ACTION, SECTION_COUNT } from "./constants.js";
import { NextActionResolver } from "./nextActionResolver.js";
import { ProjectViewDataService } from "./projectViewDataService.js";
import { ProjectViewMapper } from "./projectViewMapper.js";
import type {
  CompletedItemList,
  CompletedItemRow,
  ProjectViewRow,
  QueueItemRow,
  QueuePlacement,
  SectionCountRow,
  SectionPage,
  SectionQuery,
  StageFactRow,
} from "./types.js";

/**
 * The report's three sections, filled on read: the next action, the open task
 * queue in resolution order, and the five most recent completions. The next
 * action and the queue come from the one engine, so the queue's first row is
 * always the next action. Nothing here writes.
 */
export class ProjectViewService {
  private readonly data: ProjectViewDataService;
  private readonly pages = new WeakMap<object, SectionPage>();
  private readonly bareCounts = new WeakSet<object>();

  /** Wires the layer with its own data access. */
  constructor() {
    this.data = new ProjectViewDataService();
  }

  /**
   * Orders recently completed rows newest first, keeps the five most recent,
   * and names each one's completer from its latest completion event rather
   * than a field on the stage. Sorts and trims the array in place, because
   * that array is the read's result.
   * @param rows The completed rows a read returned.
   * @param req The read, carrying any page detached from its query.
   */
  async applyCompletionDerivations(
    rows: CompletedItemList,
    req?: object,
  ): Promise<void> {
    if (rows.length === 0) return;
    if (this._isBareCount(req)) {
      this._applyCountCap(rows as unknown as SectionCountRow[]);
      return;
    }
    const stages = await this.data.readStagesByIds(rows.map(row => row.ID));
    const byId = new Map(stages.map(stage => [stage.ID, stage]));
    const targetOf = (row: CompletedItemRow): string =>
      ProjectViewMapper.toStageTarget(byId.get(row.ID) as StageFactRow);
    const events = await this.data.readCompletionEvents(rows.map(targetOf));
    const recency = new Map<string, number>();
    const completers = new Map<string, string>();
    events.forEach((event, index) => {
      if (recency.has(event.target)) return;
      recency.set(event.target, index);
      completers.set(event.target, event.actor_code);
    });
    // completedAt is stored to the second, so two closes in one second tie;
    // the completion events keep milliseconds and break the tie.
    const newestFirst = (row: CompletedItemRow): [number, number] => [
      -Date.parse(String((byId.get(row.ID) as StageFactRow).completedAt)),
      recency.get(targetOf(row)) ?? Number.MAX_SAFE_INTEGER,
    ];
    rows.sort((left, right) => {
      const [leftAt, leftRecency] = newestFirst(left);
      const [rightAt, rightRecency] = newestFirst(right);
      return leftAt - rightAt || leftRecency - rightRecency;
    });
    rows.splice(NEXT_ACTION.RECENT_COMPLETIONS_CAP);
    // A counted read counts the whole view; left as is, the table would offer
    // to load rows past the cap.
    if (rows.$count !== undefined) {
      rows.$count = Math.min(rows.$count, NEXT_ACTION.RECENT_COMPLETIONS_CAP);
    }
    this._applyPage(rows, req);
    for (const row of rows)
      row.completedBy = completers.get(targetOf(row)) ?? null;
  }

  /**
   * Takes a section read's page off its query, so the store returns every row
   * and the ranking runs over the whole section before the page is cut.
   * @param req The section read.
   * @param query The read's query.
   */
  detachSectionPage(req: object, query: SectionQuery): void {
    // A bare count has no stages to rank, so the after-READ must leave it alone.
    if (query.SELECT?.columns?.some(column => column.as === SECTION_COUNT.ALIAS)) {
      this.bareCounts.add(req);
    }
    const limit = query.SELECT?.limit;
    if (!limit) return;
    this.pages.set(req, {
      top: limit.rows?.val,
      skip: limit.offset?.val ?? 0,
    });
    delete query.SELECT?.limit;
  }

  /**
   * Fills the view's next action and, when expanded, its queue and recently
   * completed sections. The next action is workspace-wide; it stays null when
   * no story holds an open stage.
   * @param rows The project-view rows a read returned.
   */
  async applyProjectViewSections(rows: ProjectViewRow[]): Promise<void> {
    for (const row of rows) {
      const stages = await this.data.readStagesOfWorkspace(String(row.ID));
      const resolved = NextActionResolver.resolveAcrossStories(
        ProjectViewMapper.groupStories(stages),
      );
      if (resolved) {
        Object.assign(
          row,
          ProjectViewMapper.toNextActionFields(resolved.task, resolved.tier),
        );
      }
      if (row.taskQueue) await this.applyQueueDerivations(row.taskQueue);
      if (row.recentCompletions) {
        await this.applyCompletionDerivations(row.recentCompletions);
      }
    }
  }

  /**
   * Fills each queue row's tier and blocker and sorts the rows into resolution
   * order: candidate rank across stories, chain position within each. Both are
   * judged against the whole chain, closed stages included, so the stages are
   * read again rather than taken from the open rows alone.
   * @param rows The queue rows a read returned.
   * @param req The read, carrying any page detached from its query.
   */
  async applyQueueDerivations(
    rows: QueueItemRow[],
    req?: object,
  ): Promise<void> {
    if (rows.length === 0 || this._isBareCount(req)) return;
    const queued = await this.data.readStagesByIds(rows.map(row => row.ID));
    const stages = await this.data.readStagesOfMilestones([
      ...new Set(queued.map(stage => stage.milestone_ID)),
    ]);
    const placements = this._computeQueuePlacements(stages);
    const placementOf = (row: QueueItemRow): QueuePlacement =>
      placements.get(row.ID) as QueuePlacement;
    for (const row of rows) {
      row.tier = placementOf(row).tier;
      row.blockerStepCode = placementOf(row).blockerStepCode;
    }
    rows.sort(
      (left, right) =>
        placementOf(left).rank - placementOf(right).rank ||
        placementOf(left).position - placementOf(right).position,
    );
    this._applyPage(rows, req);
  }

  /**
   * Clamps a bare count of the recently completed section to the cap, as the
   * counted read clamps its own.
   * @param rows The count row the read returned, clamped in place.
   */
  private _applyCountCap(rows: SectionCountRow[]): void {
    for (const row of rows) {
      row.$count = Math.min(row.$count, NEXT_ACTION.RECENT_COMPLETIONS_CAP);
    }
  }

  /**
   * Tells whether a section read asked for its count alone.
   * @param req The read, if any.
   * @returns True for a bare `$count` read.
   */
  private _isBareCount(req?: object): boolean {
    return req !== undefined && this.bareCounts.has(req);
  }

  /**
   * Cuts the ranked rows down to the page their read asked for.
   * @param rows The ranked rows, cut in place.
   * @param req The read whose page was lifted, if any.
   */
  private _applyPage(rows: unknown[], req?: object): void {
    const page = req ? this.pages.get(req) : undefined;
    if (!page) return;
    rows.splice(0, page.skip);
    if (page.top !== undefined) rows.splice(page.top);
  }

  /**
   * Places every stage of the candidate stories: its story's rank and tier, its
   * position, and the blocker a predecessor guard would name on it — the
   * earliest open blocking stage ahead of it in its own story, never another's.
   * @param stages Every stage of the stories the queue touches.
   * @returns Each stage's placement, by stage identifier.
   */
  private _computeQueuePlacements(
    stages: StageFactRow[],
  ): Map<string, QueuePlacement> {
    const placements = new Map<string, QueuePlacement>();
    const ranked = NextActionResolver.sortCandidates(
      ProjectViewMapper.groupStories(stages),
    );
    ranked.forEach((story, rank) => {
      const tier = NextActionResolver.deriveTier(story.tasks);
      for (const task of story.tasks) {
        const [blocker] = NextActionResolver.listOpenBlockers(
          story.tasks,
          task.stepPosition,
        );
        placements.set(task.ID, {
          rank,
          position: task.stepPosition,
          tier,
          blockerStepCode: blocker ? blocker.step_code : null,
        });
      }
    });
    return placements;
  }
}
