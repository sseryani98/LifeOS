import cds from "@sap/cds";

import { DeduplicationDataService } from "./modules/ingestion/deduplicationDataService.js";
import { DeduplicationService } from "./modules/ingestion/deduplicationService.js";
import { SchedulingService } from "./modules/ingestion/schedulingService.js";
import { SimpleFINDataService } from "./modules/ingestion/simpleFinDataService.js";
import { SimpleFINFacade } from "./modules/ingestion/simpleFinFacade.js";
import { SimpleFINService } from "./modules/ingestion/simpleFinService.js";

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
