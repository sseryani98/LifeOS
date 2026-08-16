import type cds from "@sap/cds";

import { CODES, HANDLER_KEYS } from "../shared/constants.js";

import type {
  DefectPayload,
  InitiativePayload,
  TestRunPayload,
} from "./types.js";

/**
 * Input rules the model itself cannot carry. Each one is a cross-field
 * condition, and a boolean-expression assertion is not something the pinned
 * compiler has — so these are handlers by measurement, not by preference.
 */
export class TrackerValidator {
  /**
   * A Defect is scoped to a story or to a sprint; an orphan Defect is one the
   * registers cannot show under any Workspace.
   * @param req Request the error accumulates on.
   * @param data The Defect payload being written.
   */
  validateDefectScope(req: cds.Request, data: DefectPayload): void {
    if (!data.milestone_ID && !data.initiative_ID) {
      req.error({
        code: HANDLER_KEYS.DEFECT_SCOPE,
        message: HANDLER_KEYS.DEFECT_SCOPE,
        target: "milestone_ID",
        status: 400,
      });
    }
  }

  /**
   * A Complete Initiative records how it landed. Both fields are nullable while
   * it is Active, which is why this cannot be a not-null column.
   * @param req Request the error accumulates on.
   * @param data The Initiative payload being written.
   */
  validateInitiativeCompletion(req: cds.Request, data: InitiativePayload): void {
    if (data.status_code !== CODES.INITIATIVE_STATUS.COMPLETE) return;
    if (!data.mergeCommit || !data.tag) {
      req.error({
        code: HANDLER_KEYS.INITIATIVE_COMPLETION_FIELDS,
        message: HANDLER_KEYS.INITIATIVE_COMPLETION_FIELDS,
        target: "mergeCommit",
        status: 400,
      });
    }
  }

  /**
   * A TestRun hangs off the stage that produced it or off the sprint it ran in.
   * @param req Request the error accumulates on.
   * @param data The TestRun payload being written.
   */
  validateTestRunScope(req: cds.Request, data: TestRunPayload): void {
    if (!data.task_ID && !data.initiative_ID) {
      req.error({
        code: HANDLER_KEYS.TEST_RUN_SCOPE,
        message: HANDLER_KEYS.TEST_RUN_SCOPE,
        target: "task_ID",
        status: 400,
      });
    }
  }
}
