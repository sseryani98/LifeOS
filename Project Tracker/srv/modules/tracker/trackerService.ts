import type cds from "@sap/cds";

import { DERIVED_SCALARS, HANDLER_KEYS } from "../shared/constants.js";
import { toPayloadList } from "../shared/payloadList.js";

import { deriveMilestoneStatus } from "./milestoneStatus.js";
import { TrackerDataService } from "./trackerDataService.js";
import { TrackerMapper } from "./trackerMapper.js";
import { TrackerValidator } from "./trackerValidator.js";
import type {
  DefectPayload,
  InitiativePayload,
  MilestonePayload,
  MilestoneRow,
  TestRunPayload,
} from "./types.js";

/**
 * Reports whether a payload says anything about which story or sprint a defect
 * belongs to.
 * @param data The payload being written.
 * @returns True when either link appears in it.
 */
function _mentionsDefectScope(data: DefectPayload): boolean {
  return "milestone_ID" in data || "initiative_ID" in data;
}

/**
 * The handler-layer logic: the friendly named 409s in front of the store's two
 * unique constraints, and the status derivation that is filled on read because
 * no verb may write it.
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
      row.status = deriveMilestoneStatus(byMilestone.get(row.ID) ?? []);
    }
  }

  /**
   * Fills the derived scalars and the nested Milestone statuses of a read of the
   * project view. The scalars stay null here: health and the next action are
   * computed by engines that land in later stories, and this handler is the seam
   * they fill rather than a second read path they would have to add.
   * @param rows The project-view rows a read returned.
   */
  async applyProjectViewDerivations(rows: Record<string, unknown>[]): Promise<void> {
    for (const row of rows) {
      for (const element of DERIVED_SCALARS) row[element] ??= null;
    }
    await this.applyMilestoneStatuses(
      TrackerMapper.listExpandedMilestones(rows),
    );
  }

  /**
   * Guards an Initiative write: a Complete one carries both git facts, judged
   * on the merged row for an update, and a duplicate name in the Workspace
   * gets its named 409. That pre-check runs only when the write supplies both
   * name and workspace; a partial update omitting either is left to the
   * store's unique constraint, which backstops every write path.
   * @param req Request carrying the Initiative payload.
   */
  async checkInitiativeWrite(req: cds.Request): Promise<void> {
    for (const data of toPayloadList<InitiativePayload>(req.data)) {
      this.validator.validateInitiativeCompletion(
        req,
        await this._mergeStoredInitiative(req, data),
      );
      if (!data.name || !data.workspace_ID) continue;
      const duplicates = await this.data.countInitiativesNamed(
        data.workspace_ID,
        data.name,
        data.ID,
      );
      if (duplicates > 0) req.reject(409, HANDLER_KEYS.INITIATIVE_DUPLICATE);
    }
  }

  /**
   * Guards a Milestone write: a duplicate story ID inside the Initiative gets
   * its named 409. The pre-check runs only when the write itself supplies both
   * the story ID and the initiative; a partial update that omits either is
   * left to the store's unique constraint, which backstops every write path.
   * @param req Request carrying the Milestone payload.
   */
  async checkMilestoneWrite(req: cds.Request): Promise<void> {
    for (const data of toPayloadList<MilestonePayload>(req.data)) {
      if (!data.storyId || !data.initiative_ID) continue;
      const duplicates = await this.data.countMilestonesWithStoryId(
        data.initiative_ID,
        data.storyId,
        data.ID,
      );
      if (duplicates > 0) req.reject(409, HANDLER_KEYS.STORY_DUPLICATE);
    }
  }

  /**
   * Guards a Defect write: it is scoped to a story or to a sprint. A patch that
   * names neither link is not an orphan — it is a patch of something else, and
   * rejecting it would make closing a defect impossible.
   * @param req Request carrying the Defect payload.
   */
  checkDefectWrite(req: cds.Request): void {
    for (const data of toPayloadList<DefectPayload>(req.data)) {
      if (req.event === "UPDATE" && !_mentionsDefectScope(data)) continue;
      this.validator.validateDefectScope(req, data);
    }
  }

  /**
   * Guards a TestRun write: it hangs off a stage or off a sprint.
   * @param req Request carrying the TestRun payload.
   */
  checkTestRunWrite(req: cds.Request): void {
    for (const data of toPayloadList<TestRunPayload>(req.data)) {
      this.validator.validateTestRunScope(req, data);
    }
  }

  /**
   * Overlays an update's payload on the stored row, so the completion rule is
   * judged against the state the write produces rather than the fields it
   * happens to carry. A create, or an update whose row cannot be read, is
   * judged on the payload alone.
   * @param req Request carrying the Initiative payload.
   * @param data One payload row of the write.
   * @returns The merged view of the row being written.
   */
  private async _mergeStoredInitiative(
    req: cds.Request,
    data: InitiativePayload,
  ): Promise<InitiativePayload> {
    if (req.event !== "UPDATE" || !data.ID) return data;
    const stored = await this.data.readInitiativeCompletion(data.ID);
    if (!stored) return data;
    return { ...stored, ...data };
  }
}
