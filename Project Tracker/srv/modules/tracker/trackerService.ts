import type cds from "@sap/cds";

import { DERIVED_SCALARS, HANDLER_KEYS } from "../shared/constants.js";

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
 * The handler-layer logic: the two uniqueness rules the model cannot express as
 * an annotation without losing its named 409, and the status derivation that is
 * filled on read because no verb may write it.
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
   * Guards an Initiative write: its name is unique inside its Workspace, and a
   * Complete one carries both git facts.
   * @param req Request carrying the Initiative payload.
   */
  async checkInitiativeWrite(req: cds.Request): Promise<void> {
    for (const data of TrackerMapper.toPayloadList<InitiativePayload>(
      req.data,
    )) {
      this.validator.validateInitiativeCompletion(req, data);
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
   * Guards a Milestone write: its story ID is unique inside its Initiative.
   * @param req Request carrying the Milestone payload.
   */
  async checkMilestoneWrite(req: cds.Request): Promise<void> {
    for (const data of TrackerMapper.toPayloadList<MilestonePayload>(req.data)) {
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
    for (const data of TrackerMapper.toPayloadList<DefectPayload>(req.data)) {
      if (req.event === "UPDATE" && !_mentionsDefectScope(data)) continue;
      this.validator.validateDefectScope(req, data);
    }
  }

  /**
   * Guards a TestRun write: it hangs off a stage or off a sprint.
   * @param req Request carrying the TestRun payload.
   */
  checkTestRunWrite(req: cds.Request): void {
    for (const data of TrackerMapper.toPayloadList<TestRunPayload>(req.data)) {
      this.validator.validateTestRunScope(req, data);
    }
  }
}
