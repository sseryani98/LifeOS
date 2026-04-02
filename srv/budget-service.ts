import cds from "@sap/cds";

/** BudgetService — Budget management, income, goals, financial picture. */
export default class BudgetService extends cds.ApplicationService {
  /** Registers event handlers for BudgetService entities. */
  async init(): Promise<void> {
    // Handler registration added in W3-S1+
    return super.init();
  }
}
