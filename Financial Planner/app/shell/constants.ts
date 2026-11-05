// Shell app constants.

import type { NavEntry } from "com/financialplanner/shell/types";

/**
 * Nav keys → component, route, URL hash, record entity set, and page-name i18n key.
 * A list's hash is its route name, never its entity set: FE pushes a history
 * entry for a record only when the two differ, so Back returns to the list.
 * Each key must match the `key=` attribute of a NavigationListItem in
 * App.view.xml as `_navigateToKey` does nothing on a key with no entry here.
 */
export const NAV_CONFIG: Record<string, NavEntry> = {
  MD_ISSUERS: {
    component: "com.financialplanner.adminmasterdata",
    route: "IssuersList",
    hash: "IssuersList",
    recordHash: "Issuers",
    label: "navIssuers",
  },
  MD_REWARDS_PROGRAMS: {
    component: "com.financialplanner.adminmasterdata",
    route: "RewardsProgramsList",
    hash: "RewardsProgramsList",
    recordHash: "RewardsPrograms",
    label: "navRewardsPrograms",
  },
  MD_PURCHASE_CATEGORIES: {
    component: "com.financialplanner.adminmasterdata",
    route: "PurchaseCategoriesList",
    hash: "PurchaseCategoriesList",
    recordHash: "PurchaseCategories",
    label: "navPurchaseCategories",
  },
  MD_EARNING_CATEGORIES: {
    component: "com.financialplanner.adminmasterdata",
    route: "EarningCategoriesList",
    hash: "EarningCategoriesList",
    recordHash: "EarningCategories",
    label: "navEarningCategories",
  },
  MD_APP_RULES: {
    component: "com.financialplanner.adminmasterdata",
    route: "IssuerApplicationRulesList",
    hash: "IssuerApplicationRulesList",
    recordHash: "IssuerApplicationRules",
    label: "navApplicationRules",
  },
  MD_CSV_CONFIGS: {
    component: "com.financialplanner.adminmasterdata",
    route: "CsvFormatConfigsList",
    hash: "CsvFormatConfigsList",
    recordHash: "CsvFormatConfigs",
    label: "navCsvFormats",
  },
  MD_SYSTEM_CONFIGS: {
    component: "com.financialplanner.adminmasterdata",
    route: "SystemConfigsList",
    hash: "SystemConfigsList",
    recordHash: "SystemConfigs",
    label: "navSystemConfig",
  },
  MD_BUDGET_ALLOCATIONS: {
    component: "com.financialplanner.adminmasterdata",
    route: "BudgetAllocationsList",
    hash: "BudgetAllocationsList",
    recordHash: "BudgetAllocations",
    label: "navBudgetAllocations",
  },
  MD_RECURRENT_EXPENSES: {
    component: "com.financialplanner.adminmasterdata",
    route: "RecurrentExpensesList",
    hash: "RecurrentExpensesList",
    recordHash: "RecurrentExpenses",
    label: "navRecurrentExpenses",
  },
  MD_FINANCIAL_ACCOUNT_TYPES: {
    component: "com.financialplanner.adminmasterdata",
    route: "FinancialAccountTypesList",
    hash: "FinancialAccountTypesList",
    recordHash: "FinancialAccountTypes",
    label: "navFinancialAccountTypes",
  },
  MD_INCOME_SOURCE_TYPES: {
    component: "com.financialplanner.adminmasterdata",
    route: "IncomeSourceTypesList",
    hash: "IncomeSourceTypesList",
    recordHash: "IncomeSourceTypes",
    label: "navIncomeSourceTypes",
  },
  MD_PERK_TYPES: {
    component: "com.financialplanner.adminmasterdata",
    route: "PerkTypesList",
    hash: "PerkTypesList",
    recordHash: "PerkTypes",
    label: "navPerkTypes",
  },
  MD_ADJUSTMENT_TYPES: {
    component: "com.financialplanner.adminmasterdata",
    route: "AdjustmentTypesList",
    hash: "AdjustmentTypesList",
    recordHash: "AdjustmentTypes",
    label: "navAdjustmentTypes",
  },
  MD_REDEMPTION_TYPES: {
    component: "com.financialplanner.adminmasterdata",
    route: "RedemptionTypesList",
    hash: "RedemptionTypesList",
    recordHash: "RedemptionTypes",
    label: "navRedemptionTypes",
  },
  MD_SCRAPE_MAPPINGS: {
    component: "com.financialplanner.adminmasterdata",
    route: "ScrapeMappingsList",
    hash: "ScrapeMappingsList",
    recordHash: "ScrapeMappings",
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
    hash: "TransactionsList",
    recordHash: "Transactions",
    label: "navTransactionList",
  },
};
