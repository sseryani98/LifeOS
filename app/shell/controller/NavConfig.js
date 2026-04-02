/** Map of nav keys → { component, route }. */
sap.ui.define([], () => {
  "use strict";

  return Object.freeze({
    MD_ISSUERS: {
      component: "com.financialplanner.adminmasterdata",
      route: "IssuersList",
    },
    MD_REWARDS_PROGRAMS: {
      component: "com.financialplanner.adminmasterdata",
      route: "RewardsProgramsList",
    },
    MD_PURCHASE_TYPES: {
      component: "com.financialplanner.adminmasterdata",
      route: "PurchaseTypesList",
    },
    MD_EARNING_CATEGORIES: {
      component: "com.financialplanner.adminmasterdata",
      route: "EarningCategoriesList",
    },
    MD_APP_RULES: {
      component: "com.financialplanner.adminmasterdata",
      route: "IssuerApplicationRulesList",
    },
    MD_CSV_CONFIGS: {
      component: "com.financialplanner.adminmasterdata",
      route: "CsvFormatConfigsList",
    },
    MD_SYSTEM_CONFIGS: {
      component: "com.financialplanner.adminmasterdata",
      route: "SystemConfigsList",
    },
    MD_BUDGET_ALLOCATIONS: {
      component: "com.financialplanner.adminmasterdata",
      route: "BudgetAllocationsList",
    },
    MD_RECURRENT_EXPENSES: {
      component: "com.financialplanner.adminmasterdata",
      route: "RecurrentExpensesList",
    },
  });
});
