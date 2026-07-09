import cds from "@sap/cds";

import { DeduplicationDataService } from "./modules/integration/deduplicationDataService.js";
import { DeduplicationService } from "./modules/integration/deduplicationService.js";
import { SchedulingService } from "./modules/integration/schedulingService.js";
import { SimpleFINDataService } from "./modules/integration/simpleFinDataService.js";
import { SimpleFINFacade } from "./modules/integration/simpleFinFacade.js";
import { SimpleFINService } from "./modules/integration/simpleFinService.js";

/** AdminService — Reference data CRUD, system config, integrations, alerts. */
export default class AdminService extends cds.ApplicationService {
  /**
   * Wires SimpleFIN connection-management handlers and the daily scheduler.
   * @returns Resolves once handlers are registered and the scheduler has started.
   */
  async init(): Promise<void> {
    const simpleFINService = new SimpleFINService(
      new SimpleFINDataService(),
      new DeduplicationService(new DeduplicationDataService()),
    );
    new SimpleFINFacade(this, simpleFINService).registerHandlers();
    await new SchedulingService(simpleFINService).start();
    return super.init();
  }
}
