import cds from '@sap/cds';

/** AdminService — Reference data CRUD, system config, integrations, alerts. */
export default class AdminService extends cds.ApplicationService {
  /** Registers event handlers for AdminService entities. */
  async init(): Promise<void> {
    // Handler registration added in W1-S1 (FRM-009)
    return super.init();
  }
}
