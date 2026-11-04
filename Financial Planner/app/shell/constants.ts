// Shell app constants.

import type { NavEntry } from "com/financialplanner/shell/types";

/**
 * Nav keys → component, route, URL hash, and the i18n key of the page name.
 * Each key must match the `key=` attribute of a NavigationListItem in
 * App.view.xml as `_navigateToKey` does nothing on a key with no entry here.
 */
export const NAV_CONFIG: Record<string, NavEntry> = {
  MD_ISSUERS: {
    component: "com.financialplanner.adminmasterdata",
    route: "IssuersList",
    hash: "Issuers",
    label: "navIssuers",
  },
  MD_REWARDS_PROGRAMS: {
    component: "com.financialplanner.adminmasterdata",
    route: "RewardsProgramsList",
    hash: "RewardsPrograms",
    label: "navRewardsPrograms",
  },
  MD_PURCHASE_CATEGORIES: {
    component: "com.financialplanner.adminmasterdata",
    route: "PurchaseCategoriesList",
    hash: "PurchaseCategories",
    label: "navPurchaseCategories",
  },
  MD_EARNING_CATEGORIES: {
    component: "com.financialplanner.adminmasterdata",
    route: "EarningCategoriesList",
    hash: "EarningCategories",
    label: "navEarningCategories",
  },
  MD_APP_RULES: {
    component: "com.financialplanner.adminmasterdata",
    route: "IssuerApplicationRulesList",
    hash: "IssuerApplicationRules",
    label: "navApplicationRules",
  },
  MD_CSV_CONFIGS: {
    component: "com.financialplanner.adminmasterdata",
    route: "CsvFormatConfigsList",
    hash: "CsvFormatConfigs",
    label: "navCsvFormats",
  },
  MD_SYSTEM_CONFIGS: {
    component: "com.financialplanner.adminmasterdata",
    route: "SystemConfigsList",
    hash: "SystemConfigs",
    label: "navSystemConfig",
  },
  MD_BUDGET_ALLOCATIONS: {
    component: "com.financialplanner.adminmasterdata",
    route: "BudgetAllocationsList",
    hash: "BudgetAllocations",
    label: "navBudgetAllocations",
  },
  MD_RECURRENT_EXPENSES: {
    component: "com.financialplanner.adminmasterdata",
    route: "RecurrentExpensesList",
    hash: "RecurrentExpenses",
    label: "navRecurrentExpenses",
  },
  MD_FINANCIAL_ACCOUNT_TYPES: {
    component: "com.financialplanner.adminmasterdata",
    route: "FinancialAccountTypesList",
    hash: "FinancialAccountTypes",
    label: "navFinancialAccountTypes",
  },
  MD_INCOME_SOURCE_TYPES: {
    component: "com.financialplanner.adminmasterdata",
    route: "IncomeSourceTypesList",
    hash: "IncomeSourceTypes",
    label: "navIncomeSourceTypes",
  },
  MD_PERK_TYPES: {
    component: "com.financialplanner.adminmasterdata",
    route: "PerkTypesList",
    hash: "PerkTypes",
    label: "navPerkTypes",
  },
  MD_ADJUSTMENT_TYPES: {
    component: "com.financialplanner.adminmasterdata",
    route: "AdjustmentTypesList",
    hash: "AdjustmentTypes",
    label: "navAdjustmentTypes",
  },
  MD_REDEMPTION_TYPES: {
    component: "com.financialplanner.adminmasterdata",
    route: "RedemptionTypesList",
    hash: "RedemptionTypes",
    label: "navRedemptionTypes",
  },
  MD_SCRAPE_MAPPINGS: {
    component: "com.financialplanner.adminmasterdata",
    route: "ScrapeMappingsList",
    hash: "ScrapeMappings",
    label: "navScrapeMappings",
  },
  SIMPLEFIN_CONNECTIONS: {
    component: "com.financialplanner.connectionmanager",
    route: "ConnectionManager",
    hash: "SimpleFINConnections",
    label: "navSimplefinConnections",
  },
  CSV_IMPORT: {
    component: "com.financialplanner.csvimportwizard",
    route: "CsvImportWizard",
    hash: "CsvImport",
    label: "navCsvImport",
  },
  TRANSACTION_LIST: {
    component: "com.financialplanner.transactions",
    route: "TransactionsList",
    hash: "Transactions",
    label: "navTransactionList",
  },
};
