import cds from "@sap/cds";

import {
  buildDraftHelpers,
  seedAdmin,
} from "../support/adminService.js";

import {
  ALLOCATION_EXCLUDED_CATEGORY,
  ALLOCATION_HISTORICAL_EFFECTIVE_TO,
  ALLOCATION_DUPLICATE_COMPOSITE,
  ALLOCATION_DIFFERENT_EFFECTIVE_FROM,
  ALLOCATION_RATIO_ABOVE_MAX,
  ALLOCATION_RATIO_NEGATIVE,
  ALLOCATION_MISSING_RATIO,
  ISSUER_RULE_ORPHAN,
  ISSUER_RULE_ISSUER_ONLY,
  CSV_CONFIG_XOR_BOTH,
  CSV_CONFIG_XOR_NEITHER,
  CSV_CONFIG_MISSING_STATUS_VALUE,
  CSV_CONFIG_DUPLICATE_NAME,
  SCRAPE_MAPPING_FIRST,
  SCRAPE_MAPPING_DUPLICATE,
  ISSUER_DUPLICATE_NAME,
  PROGRAM_DUPLICATE_NAME,
  PURCHASE_CATEGORY_DUPLICATE_NAME,
  EARNING_CATEGORY_DUPLICATE_NAME,
  FINANCIAL_ACCOUNT_TYPE_DUPLICATE_NAME,
  INCOME_SOURCE_TYPE_DUPLICATE_NAME,
  PERK_TYPE_DUPLICATE_NAME,
  ADJUSTMENT_TYPE_DUPLICATE_NAME,
  REDEMPTION_TYPE_DUPLICATE_NAME,
  ISSUER_MISSING_NAME,
  ISSUER_MISSING_SHORT_NAME,
  PROGRAM_MISSING_CURRENCY,
  RECURRENT_EXPENSE_MISSING_NAME,
} from "../data/admin.js";

const { POST, expect } = cds.test("serve", "--with-mocks", "--in-memory");

const { createViaDraft, createViaDraftExpectError } = buildDraftHelpers(POST);

beforeAll(seedAdmin);

describe("AdminService", () => {
  describe("BudgetAllocation cross-field rules", () => {
    /** A category flagged excludesFromBudget is money that gets reimbursed, so budgeting a share of it would double-count non-spending. */
    it("rejects allocation referencing an excluded-from-budget category", async () => {
      const res = await createViaDraftExpectError(
        "BudgetAllocations",
        ALLOCATION_EXCLUDED_CATEGORY,
      );
      expect(res.status).to.be.oneOf([400, 409, 422]);
    });

    /** Only the open-ended row (effectiveTo 9999-12-31) is current; writing a closed one would retroactively rewrite an already-settled past budget period. */
    it("rejects allocation with effectiveTo != 9999-12-31 (historical protection)", async () => {
      const res = await createViaDraftExpectError(
        "BudgetAllocations",
        ALLOCATION_HISTORICAL_EFFECTIVE_TO,
      );
      expect(res.status).to.be.oneOf([400, 409, 422]);
    });
  });

  describe("IssuerApplicationRule cross-field rules", () => {
    /** An application rule must be anchored to an issuer or a program; scoped to neither, it has no target to enforce against (cross-field @assert). */
    it("rejects rule with neither issuer nor rewards program", async () => {
      const res = await createViaDraftExpectError(
        "IssuerApplicationRules",
        ISSUER_RULE_ORPHAN,
      );
      expect(res.status).to.be.oneOf([400, 409, 422]);
    });

    /** Anchoring to just the issuer is already a complete scope; guards the cross-field rule against over-rejecting the valid one-sided case. */
    it("accepts rule with only issuer set", async () => {
      const { status } = await createViaDraft(
        "IssuerApplicationRules",
        ISSUER_RULE_ISSUER_ONLY,
      );
      expect(status).to.be.oneOf([200, 201]);
    });
  });

  describe("CsvFormatConfig cross-field rules", () => {
    /** A single signed amount column and separate debit/credit columns are mutually exclusive CSV layouts; setting both leaves parsing ambiguous about the sign. */
    it("rejects config with both amount styles set (XOR violation)", async () => {
      const res = await createViaDraftExpectError(
        "CsvFormatConfigs",
        CSV_CONFIG_XOR_BOTH,
      );
      expect(res.status).to.be.oneOf([400, 409, 422]);
    });

    /** With neither an amount column nor debit/credit columns, a parsed row carries no monetary value to import. */
    it("rejects config with neither amount style set (XOR violation)", async () => {
      const res = await createViaDraftExpectError(
        "CsvFormatConfigs",
        CSV_CONFIG_XOR_NEITHER,
      );
      expect(res.status).to.be.oneOf([400, 409, 422]);
    });

    /** A status column is unusable without the value that marks a row posted, so the parser couldn't tell posted transactions from pending ones. */
    it("rejects config with statusColumn but no statusPostedValue", async () => {
      const res = await createViaDraftExpectError(
        "CsvFormatConfigs",
        CSV_CONFIG_MISSING_STATUS_VALUE,
      );
      expect(res.status).to.be.oneOf([400, 409, 422]);
    });
  });

  describe("composite uniqueness", () => {
    /** Two allocations for one category starting the same day would give a single budget period two conflicting shares (composite @assert.unique). */
    it("rejects duplicate BudgetAllocation [purchaseCategory, effectiveFrom]", async () => {
      const res = await createViaDraftExpectError(
        "BudgetAllocations",
        ALLOCATION_DUPLICATE_COMPOSITE,
      );
      expect(res.status).to.be.oneOf([400, 409, 500]);
    });

    /** The same category may recur across different start dates as period versioning; confirms uniqueness is scoped to the pair, not the category alone. */
    it("allows same category with different effectiveFrom", async () => {
      const { status } = await createViaDraft(
        "BudgetAllocations",
        ALLOCATION_DIFFERENT_EFFECTIVE_FROM,
      );
      expect(status).to.be.oneOf([200, 201]);
    });

    /** One scraped source string per entity type must resolve to a single target; a duplicate would make the mapping lookup non-deterministic (composite @assert.unique). */
    it("rejects duplicate ScrapeMapping [entityType, sourceText]", async () => {
      await createViaDraft("ScrapeMappings", SCRAPE_MAPPING_FIRST);
      const res = await createViaDraftExpectError(
        "ScrapeMappings",
        SCRAPE_MAPPING_DUPLICATE,
      );
      expect(res.status).to.be.oneOf([400, 409, 500]);
    });
  });

  describe("simple uniqueness", () => {
    /** Two issuers sharing a name would make card-to-issuer resolution by name ambiguous (@assert.unique). */
    it("rejects duplicate issuer name", async () => {
      const res = await createViaDraftExpectError(
        "Issuers",
        ISSUER_DUPLICATE_NAME,
      );
      expect(res.status).to.be.oneOf([400, 409, 500]);
    });

    /** Two rewards programs with one name would make card and points references to a program ambiguous. */
    it("rejects duplicate rewards program name", async () => {
      const res = await createViaDraftExpectError(
        "RewardsPrograms",
        PROGRAM_DUPLICATE_NAME,
      );
      expect(res.status).to.be.oneOf([400, 409, 500]);
    });

    /** Duplicate category names would let transaction categorization and budget allocation target the wrong category. */
    it("rejects duplicate purchase category name", async () => {
      const res = await createViaDraftExpectError(
        "PurchaseCategories",
        PURCHASE_CATEGORY_DUPLICATE_NAME,
      );
      expect(res.status).to.be.oneOf([400, 409, 500]);
    });

    /** Duplicate earning-category names would make earn-rate rules ambiguous about which category a purchase earns under. */
    it("rejects duplicate earning category name", async () => {
      const res = await createViaDraftExpectError(
        "EarningCategories",
        EARNING_CATEGORY_DUPLICATE_NAME,
      );
      expect(res.status).to.be.oneOf([400, 409, 500]);
    });

    /** The config name is how a user picks an import format; duplicates would make that selection ambiguous. */
    it("rejects duplicate csv format config name", async () => {
      const res = await createViaDraftExpectError(
        "CsvFormatConfigs",
        CSV_CONFIG_DUPLICATE_NAME,
      );
      expect(res.status).to.be.oneOf([400, 409, 500]);
    });

    /** Two account types with one name would make account classification (asset vs liability) ambiguous. */
    it("rejects duplicate financial account type name", async () => {
      const res = await createViaDraftExpectError(
        "FinancialAccountTypes",
        FINANCIAL_ACCOUNT_TYPE_DUPLICATE_NAME,
      );
      expect(res.status).to.be.oneOf([400, 409, 500]);
    });

    /** Duplicate income-source-type names would make income classification ambiguous. */
    it("rejects duplicate income source type name", async () => {
      const res = await createViaDraftExpectError(
        "IncomeSourceTypes",
        INCOME_SOURCE_TYPE_DUPLICATE_NAME,
      );
      expect(res.status).to.be.oneOf([400, 409, 500]);
    });

    /** Two perk types sharing a name would make card-perk references ambiguous. */
    it("rejects duplicate perk type name", async () => {
      const res = await createViaDraftExpectError(
        "PerkTypes",
        PERK_TYPE_DUPLICATE_NAME,
      );
      expect(res.status).to.be.oneOf([400, 409, 500]);
    });

    /** Duplicate adjustment-type names would make points-adjustment references ambiguous. */
    it("rejects duplicate adjustment type name", async () => {
      const res = await createViaDraftExpectError(
        "AdjustmentTypes",
        ADJUSTMENT_TYPE_DUPLICATE_NAME,
      );
      expect(res.status).to.be.oneOf([400, 409, 500]);
    });

    /** Duplicate redemption-type names would make redemption references ambiguous. */
    it("rejects duplicate redemption type name", async () => {
      const res = await createViaDraftExpectError(
        "RedemptionTypes",
        REDEMPTION_TYPE_DUPLICATE_NAME,
      );
      expect(res.status).to.be.oneOf([400, 409, 500]);
    });
  });

  describe("field validation", () => {
    /** A budget ratio is a percentage of spend; above 100 would allocate more than the whole to one category (@assert.range). */
    it("rejects budget allocation with ratio above 100", async () => {
      const res = await createViaDraftExpectError(
        "BudgetAllocations",
        ALLOCATION_RATIO_ABOVE_MAX,
      );
      expect(res.status).to.be.oneOf([400, 409, 422]);
    });

    /** A negative budget share is meaningless — a category can't claim less than zero of spend (@assert.range lower bound). */
    it("rejects budget allocation with negative ratio", async () => {
      const res = await createViaDraftExpectError(
        "BudgetAllocations",
        ALLOCATION_RATIO_NEGATIVE,
      );
      expect(res.status).to.be.oneOf([400, 409, 422]);
    });
  });

  describe("mandatory fields", () => {
    /** The name is the issuer's human-facing identifier that cards and rules reference; without it the record can't be identified (@mandatory). */
    it("rejects issuer without name", async () => {
      const res = await createViaDraftExpectError(
        "Issuers",
        ISSUER_MISSING_NAME,
      );
      expect(res.status).to.be.oneOf([400, 409, 422]);
    });

    /** The short name drives compact display such as the combined issuer column, so it can't be left empty (@mandatory). */
    it("rejects issuer without short name", async () => {
      const res = await createViaDraftExpectError(
        "Issuers",
        ISSUER_MISSING_SHORT_NAME,
      );
      expect(res.status).to.be.oneOf([400, 409, 422]);
    });

    /** Without a ratio there is no share to budget, leaving the allocation meaningless (@mandatory). */
    it("rejects budget allocation without ratio", async () => {
      const res = await createViaDraftExpectError(
        "BudgetAllocations",
        ALLOCATION_MISSING_RATIO,
      );
      expect(res.status).to.be.oneOf([400, 409, 422]);
    });

    /** The currency type defines what unit a program earns (points/miles/cash), without which its earnings can't be valued (@mandatory). */
    it("rejects rewards program without currency type", async () => {
      const res = await createViaDraftExpectError(
        "RewardsPrograms",
        PROGRAM_MISSING_CURRENCY,
      );
      expect(res.status).to.be.oneOf([400, 409, 422]);
    });

    /** The name identifies a recurring expense to the user; an unnamed one can't be recognized or managed (@mandatory). */
    it("rejects recurrent expense without name", async () => {
      const res = await createViaDraftExpectError(
        "RecurrentExpenses",
        RECURRENT_EXPENSE_MISSING_NAME,
      );
      expect(res.status).to.be.oneOf([400, 409, 422]);
    });
  });
});
