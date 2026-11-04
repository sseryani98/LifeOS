import { randomUUID } from "node:crypto";

import type cds from "@sap/cds";

import {
  CHAIN_PREDICATES,
  CODES,
  DERIVED_SCALARS,
  HANDLER_KEYS,
  TEST_RUN_COUNT_FIELDS,
} from "../shared/constants.js";
import { PayloadList } from "../shared/payloadList.js";

import { MilestoneStatus } from "./milestoneStatus.js";
import { TrackerDataService } from "./trackerDataService.js";
import { TrackerMapper } from "./trackerMapper.js";
import { TrackerValidator } from "./trackerValidator.js";
import type {
  DefectPayload,
  InitiativePayload,
  LibraryStepRow,
  MilestonePayload,
  MilestoneRow,
  SubtaskInsertRow,
  TaskInsertRow,
  TestRunPayload,
} from "./types.js";

/**
 * The handler-layer logic: the named 409s for an Initiative name unique in its
 * Workspace and a story ID unique across it (wider than the store's per-Initiative
 * constraint), the Defect and TestRun scope guards, the TestRun count-within-total
 * guard, the chain a story is given at
 * creation, and the status derivation filled on read because no verb may write it.
 */
export class TrackerService {
  private readonly data: TrackerDataService;
  private readonly validator: TrackerValidator;

  /** Wires the layer with its own data access and validator. */
  constructor() {
    this.data = new TrackerDataService();
    this.validator = new TrackerValidator();
  }

  /**
   * Fills the derived status onto every Milestone row a read returned.
   * @param rows The Milestone rows to annotate in place.
   */
  async applyMilestoneStatuses(rows: MilestoneRow[]): Promise<void> {
    if (rows.length === 0) return;
    const tasks = await this.data.readChainTasks(rows.map(row => row.ID));
    const byMilestone = TrackerMapper.groupTasksByMilestone(tasks);
    for (const row of rows) {
      row.status = MilestoneStatus.deriveFromChain(
        byMilestone.get(row.ID) ?? [],
      );
    }
  }

  /**
   * Fills the derived scalars and the nested Milestone statuses of a read of the
   * project view. The scalars stay null here: health and the next action are
   * computed by engines that land in later stories, and this handler is the seam
   * they fill rather than a second read path they would have to add.
   * @param rows The project-view rows a read returned.
   */
  async applyProjectViewDerivations(
    rows: Record<string, unknown>[],
  ): Promise<void> {
    for (const row of rows) {
      for (const element of DERIVED_SCALARS) row[element] ??= null;
    }
    await this.applyMilestoneStatuses(
      TrackerMapper.listExpandedMilestones(rows),
    );
  }

  /**
   * Guards an Initiative write: a Complete one carries both git facts, and a
   * duplicate name in the Workspace gets its named 409. Both rules judge the
   * merged row, so a partial update carrying one half of the unique pair is
   * counted against its real siblings rather than falling through to the store
   * constraint's raw driver error. That constraint stays as the backstop.
   * @param req Request carrying the Initiative payload.
   */
  async checkInitiativeWrite(req: cds.Request): Promise<void> {
    for (const data of PayloadList.fromPayload<InitiativePayload>(req.data)) {
      const merged = await this._mergeStoredInitiative(req, data);
      this.validator.validateInitiativeCompletion(req, merged);
      if (!this._hasInitiativeIdentity(data)) continue;
      if (!merged.name || !merged.workspace_ID) continue;
      const duplicates = await this.data.countInitiativesNamed(
        merged.workspace_ID,
        merged.name,
        data.ID,
      );
      if (duplicates > 0) {
        req.reject(409, HANDLER_KEYS.INITIATIVE_DUPLICATE, [merged.name]);
      }
    }
  }

  /**
   * Guards a Milestone write: a story ID exists once per Workspace, across
   * every Initiative of it, because the verbs address a story by workspace and
   * story ID alone. Judged on the merged row, so a move carrying only the
   * Initiative is counted against the Workspace it lands in. The store's
   * per-Initiative unique constraint stays as the narrower backstop.
   * @param req Request carrying the Milestone payload.
   */
  async checkMilestoneWrite(req: cds.Request): Promise<void> {
    for (const data of PayloadList.fromPayload<MilestonePayload>(req.data)) {
      if (!this._hasMilestoneIdentity(data)) continue;
      const merged = await this._mergeStoredMilestone(req, data);
      if (!merged.storyId || !merged.initiative_ID) continue;
      const workspaceId = await this.data.readInitiativeWorkspaceId(
        merged.initiative_ID,
      );
      if (!workspaceId) continue;
      const duplicates = await this.data.countMilestonesWithStoryId(
        workspaceId,
        merged.storyId,
        data.ID,
      );
      if (duplicates > 0) {
        req.reject(409, HANDLER_KEYS.STORY_DUPLICATE, [merged.storyId]);
      }
    }
  }

  /**
   * Materialises the chain of every story created in Backlog; one created Done
   * stays chainless, which is why an empty chain derives Done. Conditionality
   * is settled here, once: a failed predicate gets no row. Each row keeps its
   * step's guard inputs as of now and this runs only on create, so no library
   * edit reaches an existing chain.
   * @param req Request carrying the created Milestone payload.
   */
  async createChains(req: cds.Request): Promise<void> {
    const stories = PayloadList.fromPayload<MilestonePayload>(req.data).filter(
      story => story.createdDone !== true,
    );
    if (stories.length === 0) return;
    const library = await this.data.readLibrarySteps();
    const tasks: TaskInsertRow[] = [];
    const subtasks: SubtaskInsertRow[] = [];
    for (const story of stories) {
      const applicable = library.filter(step =>
        this._isMaterialised(step, story),
      );
      for (const stage of applicable.filter(step => !step.parent_code)) {
        const taskId = randomUUID();
        tasks.push(TrackerMapper.toTaskRow(taskId, stage, story.ID as string));
        for (const step of applicable) {
          if (step.parent_code !== stage.code) continue;
          subtasks.push(TrackerMapper.toSubtaskRow(step, taskId));
        }
      }
    }
    await this.data.insertChainTasks(tasks);
    await this.data.insertChainSubtasks(subtasks);
  }

  /**
   * Guards a Defect write: it is scoped to a story or to a sprint. A patch that
   * names neither link is not an orphan — it is a patch of something else, and
   * rejecting it would make closing a defect impossible. The rule judges the
   * merged row, so nulling one link while the other stays stored is allowed.
   * @param req Request carrying the Defect payload.
   */
  async checkDefectWrite(req: cds.Request): Promise<void> {
    for (const data of PayloadList.fromPayload<DefectPayload>(req.data)) {
      if (req.event === "UPDATE" && !this._hasDefectScope(data)) continue;
      const merged = await this._mergeStoredDefect(req, data);
      this.validator.validateDefectScope(req, merged);
    }
  }

  /**
   * Guards a TestRun write: it hangs off a stage or off a sprint, and its counts
   * fit inside its total. Both rules live here rather than in the verb so an
   * OData write meets them too. Updates are guarded as well, or a patch could
   * orphan the run or lift one count past the stored total; a patch naming
   * neither a link nor a count skips both, as Defect's does.
   * @param req Request carrying the TestRun payload.
   */
  async checkTestRunWrite(req: cds.Request): Promise<void> {
    const isUpdate = req.event === "UPDATE";
    for (const data of PayloadList.fromPayload<TestRunPayload>(req.data)) {
      const checksScope = !isUpdate || this._hasTestRunScope(data);
      const checksCounts = !isUpdate || this._hasTestRunCounts(data);
      if (!checksScope && !checksCounts) continue;
      const merged = await this._mergeStoredTestRun(req, data);
      if (checksScope) this.validator.validateTestRunScope(req, merged);
      if (checksCounts) this.validator.validateTestRunCounts(req, merged);
    }
  }

  /**
   * Overlays an update's payload on the stored row, so the completion and
   * duplicate rules are judged against the state the write produces rather than
   * the fields it happens to carry. A create, or an update whose row cannot be
   * read, is judged on the payload alone.
   * @param req Request carrying the Initiative payload.
   * @param data One payload row of the write.
   * @returns The merged view of the row being written.
   */
  private async _mergeStoredInitiative(
    req: cds.Request,
    data: InitiativePayload,
  ): Promise<InitiativePayload> {
    if (req.event !== "UPDATE" || !data.ID) return data;
    const stored = await this.data.readInitiativeRow(data.ID);
    if (!stored) return data;
    return { ...stored, ...data };
  }

  /**
   * Overlays an update's payload on the stored Milestone, so the duplicate rule
   * sees the pair the write produces. Same shape as the Initiative merge.
   * @param req Request carrying the Milestone payload.
   * @param data One payload row of the write.
   * @returns The merged view of the row being written.
   */
  private async _mergeStoredMilestone(
    req: cds.Request,
    data: MilestonePayload,
  ): Promise<MilestonePayload> {
    if (req.event !== "UPDATE" || !data.ID) return data;
    const stored = await this.data.readMilestoneRow(data.ID);
    if (!stored) return data;
    return { ...stored, ...data };
  }

  /**
   * Overlays an update's payload on the stored Defect links, so the scope rule
   * sees the links the write leaves behind. Same shape as the Initiative merge.
   * @param req Request carrying the Defect payload.
   * @param data One payload row of the write.
   * @returns The merged view of the row being written.
   */
  private async _mergeStoredDefect(
    req: cds.Request,
    data: DefectPayload,
  ): Promise<DefectPayload> {
    if (req.event !== "UPDATE" || !data.ID) return data;
    const stored = await this.data.readDefectScopeRow(data.ID);
    if (!stored) return data;
    return { ...stored, ...data };
  }

  /**
   * Overlays an update's payload on the stored TestRun links and counts. Same
   * shape as the Defect merge.
   * @param req Request carrying the TestRun payload.
   * @param data One payload row of the write.
   * @returns The merged view of the row being written.
   */
  private async _mergeStoredTestRun(
    req: cds.Request,
    data: TestRunPayload,
  ): Promise<TestRunPayload> {
    if (req.event !== "UPDATE" || !data.ID) return data;
    const stored = await this.data.readTestRunGuardRow(data.ID);
    if (!stored) return data;
    return { ...stored, ...data };
  }

  /**
   * Reports whether a payload says anything about which story or sprint a defect
   * belongs to.
   * @param data The payload being written.
   * @returns True when either link appears in it.
   */
  private _hasDefectScope(data: DefectPayload): boolean {
    return "milestone_ID" in data || "initiative_ID" in data;
  }

  /**
   * Reports whether a payload touches any count the total bounds.
   * @param data The payload being written.
   * @returns True when the total or any outcome count appears in it.
   */
  private _hasTestRunCounts(data: TestRunPayload): boolean {
    return TEST_RUN_COUNT_FIELDS.some(field => field in data);
  }

  /**
   * Reports whether a payload says anything about which stage or sprint a test
   * run belongs to.
   * @param data The payload being written.
   * @returns True when either link appears in it.
   */
  private _hasTestRunScope(data: TestRunPayload): boolean {
    return "task_ID" in data || "initiative_ID" in data;
  }

  /**
   * Reports whether a payload touches either half of the pair an Initiative is
   * unique on, which is what makes the duplicate rule worth evaluating.
   * @param data The payload being written.
   * @returns True when the name or the Workspace appears in it.
   */
  private _hasInitiativeIdentity(data: InitiativePayload): boolean {
    return "name" in data || "workspace_ID" in data;
  }

  /**
   * Reports whether a payload touches either half of the pair a Milestone is
   * unique on.
   * @param data The payload being written.
   * @returns True when the story ID or the Initiative appears in it.
   */
  private _hasMilestoneIdentity(data: MilestonePayload): boolean {
    return "storyId" in data || "initiative_ID" in data;
  }

  /**
   * Decides whether a library step applies to a story. Required and
   * Recommended steps always do; a Conditional step does only when the
   * predicate it names holds for the story, and an unknown predicate holds for
   * none.
   * @param step The library step.
   * @param story The story being created.
   * @returns True when the step is materialised for the story.
   */
  private _isMaterialised(
    step: LibraryStepRow,
    story: MilestonePayload,
  ): boolean {
    if (step.kind_code !== CODES.STEP_KIND.CONDITIONAL) return true;
    if (step.conditional === CHAIN_PREDICATES.SHIPS_UI)
      return story.shipsUi === true;
    return false;
  }
}
