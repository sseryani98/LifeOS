/**
 * A single side-navigation entry: which component to load, the inner route to
 * navigate to, and the URL hash fragment that deep-links to it.
 */
interface NavEntry {
  component: string;
  route: string;
  hash: string;
}

/**
 * Nav keys → component, route, and URL hash. Each key must match the `key=`
 * attribute of a NavigationListItem in App.view.xml — `_navigateToKey` silently
 * no-ops on a key with no entry here.
 */
const navConfig: Record<string, NavEntry> = {
  MD_ISSUERS: {
    component: "com.financialplanner.adminmasterdata",
    route: "IssuersList",
    hash: "Issuers",
  },
  MD_REWARDS_PROGRAMS: {
    component: "com.financialplanner.adminmasterdata",
    route: "RewardsProgramsList",
    hash: "RewardsPrograms",
  },
  MD_PURCHASE_CATEGORIES: {
    component: "com.financialplanner.adminmasterdata",
    route: "PurchaseCategoriesList",
    hash: "PurchaseCategories",
  },
  MD_EARNING_CATEGORIES: {
    component: "com.financialplanner.adminmasterdata",
    route: "EarningCategoriesList",
    hash: "EarningCategories",
  },
  MD_APP_RULES: {
    component: "com.financialplanner.adminmasterdata",
    route: "IssuerApplicationRulesList",
    hash: "IssuerApplicationRules",
  },
  MD_CSV_CONFIGS: {
    component: "com.financialplanner.adminmasterdata",
    route: "CsvFormatConfigsList",
    hash: "CsvFormatConfigs",
  },
  MD_SYSTEM_CONFIGS: {
    component: "com.financialplanner.adminmasterdata",
    route: "SystemConfigsList",
    hash: "SystemConfigs",
  },
  MD_BUDGET_ALLOCATIONS: {
    component: "com.financialplanner.adminmasterdata",
    route: "BudgetAllocationsList",
    hash: "BudgetAllocations",
  },
  MD_RECURRENT_EXPENSES: {
    component: "com.financialplanner.adminmasterdata",
    route: "RecurrentExpensesList",
    hash: "RecurrentExpenses",
  },
  MD_FINANCIAL_ACCOUNT_TYPES: {
    component: "com.financialplanner.adminmasterdata",
    route: "FinancialAccountTypesList",
    hash: "FinancialAccountTypes",
  },
  MD_INCOME_SOURCE_TYPES: {
    component: "com.financialplanner.adminmasterdata",
    route: "IncomeSourceTypesList",
    hash: "IncomeSourceTypes",
  },
  MD_PERK_TYPES: {
    component: "com.financialplanner.adminmasterdata",
    route: "PerkTypesList",
    hash: "PerkTypes",
  },
  MD_ADJUSTMENT_TYPES: {
    component: "com.financialplanner.adminmasterdata",
    route: "AdjustmentTypesList",
    hash: "AdjustmentTypes",
  },
  MD_REDEMPTION_TYPES: {
    component: "com.financialplanner.adminmasterdata",
    route: "RedemptionTypesList",
    hash: "RedemptionTypes",
  },
  MD_SCRAPE_MAPPINGS: {
    component: "com.financialplanner.adminmasterdata",
    route: "ScrapeMappingsList",
    hash: "ScrapeMappings",
  },
  SIMPLEFIN_CONNECTIONS: {
    component: "com.financialplanner.connectionmanager",
    route: "ConnectionManager",
    hash: "SimpleFINConnections",
  },
  CSV_IMPORT: {
    component: "com.financialplanner.csvimportwizard",
    route: "CsvImportWizard",
    hash: "CsvImport",
  },
  TRANSACTION_LIST: {
    component: "com.financialplanner.transactions",
    route: "TransactionsList",
    hash: "Transactions",
  },
};

/** Reverse map: hash fragment → nav key (e.g. "Issuers" → "MD_ISSUERS"). */
export const HASH_TO_NAV_KEY: Record<string, string> = Object.entries(
  navConfig,
).reduce((map: Record<string, string>, [key, conf]) => {
  map[conf.hash] = key;
  return map;
}, {});

export default navConfig;
