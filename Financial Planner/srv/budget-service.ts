import cds from "@sap/cds";

/** BudgetService — Budget management, income, goals, financial picture. */
export default class BudgetService extends cds.ApplicationService {
  /**
   * Registers event handlers for BudgetService entities.
   * @returns Resolves once base service initialization completes.
   */
  async init(): Promise<void> {
    return super.init();
  }
}
