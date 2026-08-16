import cds from "@sap/cds";

import { TrackerFacade } from "./modules/tracker/trackerFacade.js";
import { TrackerService as TrackerLogic } from "./modules/tracker/trackerService.js";

/** TrackerService — the one CAP service behind the verbs and the project view. */
export default class TrackerService extends cds.ApplicationService {
  /**
   * Registers every handler this service owns.
   * @returns Resolves once base service initialization completes.
   */
  async init(): Promise<void> {
    new TrackerFacade(this, new TrackerLogic()).registerHandlers();
    return super.init();
  }
}
