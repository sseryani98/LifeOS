import type cds from "@sap/cds";

import { CODES } from "../shared/constants.js";

import { MIGRATION_KEYS, MIGRATION_STATUS } from "./constants.js";
import type {
  DefectResolutionFacts,
  MilestoneInsertRow,
  ReconcileOutcome,
  RegisterTargetLinks,
} from "./types.js";

/**
 * The rules every seeded register row and the finished load are held to. Each
 * accumulates on the request, so one run reports every bad row at once.
 */
export class MigrationValidator {
  /**
   * A resolution is carried by exactly the Closed Defects, in both directions:
   * an Open one with a fix reads as resolved, a Closed one without loses why.
   * @param req Request the error accumulates on.
   * @param defect The Defect's status and resolution.
   */
  validateDefectResolution(
    req: cds.Request,
    defect: DefectResolutionFacts,
  ): void {
    const resolved =
      typeof defect.resolution === "string" &&
      defect.resolution.trim().length > 0;
    if (defect.status_code === CODES.DEFECT_STATUS.OPEN && resolved) {
      req.error({
        code: MIGRATION_KEYS.DEFECT_RESOLUTION_ON_OPEN,
        message: MIGRATION_KEYS.DEFECT_RESOLUTION_ON_OPEN,
        target: "resolution",
        status: MIGRATION_STATUS.BAD_INPUT,
      });
    }
    if (defect.status_code === CODES.DEFECT_STATUS.CLOSED && !resolved) {
      req.error({
        code: MIGRATION_KEYS.DEFECT_RESOLUTION_MISSING,
        message: MIGRATION_KEYS.DEFECT_RESOLUTION_MISSING,
        target: "resolution",
        status: MIGRATION_STATUS.BAD_INPUT,
      });
    }
  }

  /**
   * A seeded Defect links to a story or a sprint; one linked to neither would
   * show in no register.
   * @param req Request the error accumulates on.
   * @param defect The Defect's two links.
   */
  validateDefectTarget(req: cds.Request, defect: RegisterTargetLinks): void {
    if (defect.milestone_ID || defect.initiative_ID) return;
    req.error({
      code: MIGRATION_KEYS.DEFECT_TARGET_MISSING,
      message: MIGRATION_KEYS.DEFECT_TARGET_MISSING,
      target: "initiative_ID",
      status: MIGRATION_STATUS.BAD_INPUT,
    });
  }

  /**
   * A story's type, after the remap, is one of the six FRICEW codes; any other
   * would fail the code list's integrity check mid-insert.
   * @param req Request the errors accumulate on.
   * @param milestones The mapped stories.
   */
  validateFricewTypes(
    req: cds.Request,
    milestones: MilestoneInsertRow[],
  ): void {
    const types: readonly string[] = CODES.FRICEW_TYPES;
    for (const row of milestones) {
      if (types.includes(row.fricewType_code)) continue;
      req.error({
        code: MIGRATION_KEYS.VALUE_NOT_IN_CODE_LIST,
        message: MIGRATION_KEYS.VALUE_NOT_IN_CODE_LIST,
        target: "fricewType_code",
        status: MIGRATION_STATUS.BAD_INPUT,
        args: [row.fricewType_code, types.join(", "), row.storyId],
      });
    }
  }

  /**
   * Reports every reconciliation assertion that found something, with the full
   * tie-out attached so a failure says expected against actual per entity.
   * @param req Request the errors accumulate on.
   * @param outcome The counts and each assertion's findings.
   */
  validateReconciliation(req: cds.Request, outcome: ReconcileOutcome): void {
    for (const finding of outcome.findings) {
      if (finding.offenders.length === 0) continue;
      const failure = {
        code: finding.key,
        message: finding.key,
        status: MIGRATION_STATUS.CONFLICT,
        args: [finding.offenders.join(", ")],
        counts: outcome.counts,
      };
      req.error(failure);
    }
  }

  /**
   * A seeded TestRun links to a stage or a sprint; one linked to neither is a
   * result about no work.
   * @param req Request the error accumulates on.
   * @param testRun The TestRun's two links.
   */
  validateTestRunTarget(req: cds.Request, testRun: RegisterTargetLinks): void {
    if (testRun.task_ID || testRun.initiative_ID) return;
    req.error({
      code: MIGRATION_KEYS.TEST_RUN_TARGET_MISSING,
      message: MIGRATION_KEYS.TEST_RUN_TARGET_MISSING,
      target: "task_ID",
      status: MIGRATION_STATUS.BAD_INPUT,
    });
  }
}
