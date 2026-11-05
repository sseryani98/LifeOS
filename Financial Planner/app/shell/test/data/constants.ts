// Named inputs for the shell unit tests: side-nav keys, the URL hashes a user
// deep-links with, and the routes and page names the shell must resolve them to.

/** Side-nav keys as App.view.xml declares them; UNREGISTERED is deliberately in neither the view nor NAV_CONFIG. */
export const NAV_KEY = {
  ISSUERS: "MD_ISSUERS",
  REWARDS_PROGRAMS: "MD_REWARDS_PROGRAMS",
  TRANSACTION_LIST: "TRANSACTION_LIST",
  UNREGISTERED: "MD_NOT_A_PAGE",
} as const;

/** The component each nav entry loads into the content page. */
export const COMPONENT_NAME = {
  ADMIN_MASTER_DATA: "com.financialplanner.adminmasterdata",
  TRANSACTIONS: "com.financialplanner.transactions",
} as const;

/** The components whose pages are FE ListReports, each list with its own records' object pages. */
export const FE_LIST_COMPONENTS: readonly string[] = [
  COMPONENT_NAME.ADMIN_MASTER_DATA,
  COMPONENT_NAME.TRANSACTIONS,
];

/** Inner-app routes the shell navigates a hosted component to. */
export const ROUTE = {
  ISSUERS_LIST: "IssuersList",
  REWARDS_PROGRAMS_LIST: "RewardsProgramsList",
  TRANSACTIONS_LIST: "TransactionsList",
} as const;

/** URL hashes as a typed, pasted or reloaded address carries them. */
export const HASH = {
  EMPTY: "",
  ISSUERS: "#IssuersList",
  ISSUERS_WITH_SLASH: "#/IssuersList",
  ISSUERS_OBJECT_PAGE: "#Issuers(ID=1,IsActiveEntity=true)",
  ISSUERS_OBJECT_PAGE_SUB_PATH:
    "#/Issuers(ID=1,IsActiveEntity=true)/rewardsPrograms",
  REWARDS_PROGRAMS_OBJECT_PAGE: "#RewardsPrograms(ID=1,IsActiveEntity=true)",
  TRANSACTIONS: "#TransactionsList",
  TRANSACTIONS_OLD_LIST: "#/Transactions",
  TRANSACTIONS_OBJECT_PAGE:
    "#/Transactions(ID=7e5d0002-0000-4000-8000-000000000002,IsActiveEntity=true)",
  UNKNOWN: "#NotAShellPage",
} as const;

/** Hash fragments, without the leading `#`, as NavConfig receives them. */
export const HASH_FRAGMENT = {
  ISSUERS: "IssuersList",
  ISSUERS_RECORD: "Issuers",
  TRANSACTIONS_RECORD: "Transactions",
  UNKNOWN: "NotAShellPage",
} as const;

/** Page names the ToolHeader shows, from the shell i18n bundle. */
export const PAGE_NAME = {
  ISSUERS: "Issuers",
  REWARDS_PROGRAMS: "Rewards Programs",
  TRANSACTION_LIST: "Transaction List",
} as const;

/** Shell fixtures: its content page, i18n bundle, component name and stylesheets. */
export const SHELL = {
  CONTENT_PAGE_ID: "idAppContentPage",
  I18N_BUNDLE: "com.financialplanner.shell.i18n.i18n",
  COMPONENT_NAME: "com.financialplanner.shell",
  THEME_OVERRIDES_HREF: "shared/css/theme-overrides.css",
  LATE_LIBRARY_HREF: "late-library.css",
} as const;
