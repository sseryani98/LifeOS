import cds from "@sap/cds";

import {
  AMEX_COBALT,
  AMEX_COBALT_DEC2025_OFFER,
  AMEX_COBALT_INSTANCE,
} from "../data/cards.js";

import {
  GROCERIES_ALLOCATION_CURRENT,
  DINING_ALLOCATION_CURRENT,
} from "../data/budget.js";

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

const SERVICE = "/service/adminSvcs";

/** Creates a draft, applies data, and activates it. Returns the active entity. */
async function createViaDraft(entity: string, data: Record<string, unknown>) {
  const draft = await POST(`${SERVICE}/${entity}`, data);
  const id = draft.data.ID;
  const activated = await POST(
    `${SERVICE}/${entity}(ID=${id},IsActiveEntity=false)/AdminService.draftActivate`,
    {},
  );
  return activated;
}

/** Creates a draft, applies data, and attempts activation. Returns the error or activated entity. */
async function createViaDraftExpectError(
  entity: string,
  data: Record<string, unknown>,
) {
  const draft = await POST(`${SERVICE}/${entity}`, data);
  const id = draft.data.ID;
  return POST(
    `${SERVICE}/${entity}(ID=${id},IsActiveEntity=false)/AdminService.draftActivate`,
    {},
  ).catch((error: { status: number }) => error);
}

async function seed() {
  // Reference data is already seeded from db/data/*.csv by cds.deploy.
  // Only insert entities that have no CSV seed files.
  await INSERT.into("com.financialplanner.MarketCard").entries([AMEX_COBALT]);
  await INSERT.into("com.financialplanner.Offer").entries([
    AMEX_COBALT_DEC2025_OFFER,
  ]);
  await INSERT.into("com.financialplanner.CardInstance").entries([
    AMEX_COBALT_INSTANCE,
  ]);
  await INSERT.into("com.financialplanner.BudgetAllocation").entries([
    GROCERIES_ALLOCATION_CURRENT,
    DINING_ALLOCATION_CURRENT,
  ]);
}

beforeAll(seed);

describe("AdminService", () => {
  // ─── Cross-field business rules ────────────────────────────────────────

  describe("BudgetAllocation cross-field rules", () => {
    it("rejects allocation referencing an excluded-from-budget category", async () => {
      const res = await createViaDraftExpectError(
        "BudgetAllocations",
        ALLOCATION_EXCLUDED_CATEGORY,
      );
      expect(res.status).to.be.oneOf([400, 409, 422, 500]);
    });

    it("rejects allocation with effectiveTo != 9999-12-31 (historical protection)", async () => {
      const res = await createViaDraftExpectError(
        "BudgetAllocations",
        ALLOCATION_HISTORICAL_EFFECTIVE_TO,
      );
      expect(res.status).to.be.oneOf([400, 409, 422, 500]);
    });
  });

  describe("IssuerApplicationRule cross-field rules", () => {
    it("rejects rule with neither issuer nor rewards program", async () => {
      const res = await createViaDraftExpectError(
        "IssuerApplicationRules",
        ISSUER_RULE_ORPHAN,
      );
      expect(res.status).to.be.oneOf([400, 409, 422, 500]);
    });

    it("accepts rule with only issuer set", async () => {
      const { status } = await createViaDraft(
        "IssuerApplicationRules",
        ISSUER_RULE_ISSUER_ONLY,
      );
      expect(status).to.be.oneOf([200, 201]);
    });
  });

  describe("CsvFormatConfig cross-field rules", () => {
    it("rejects config with both amount styles set (XOR violation)", async () => {
      const res = await createViaDraftExpectError(
        "CsvFormatConfigs",
        CSV_CONFIG_XOR_BOTH,
      );
      expect(res.status).to.be.oneOf([400, 409, 422, 500]);
    });

    it("rejects config with neither amount style set (XOR violation)", async () => {
      const res = await createViaDraftExpectError(
        "CsvFormatConfigs",
        CSV_CONFIG_XOR_NEITHER,
      );
      expect(res.status).to.be.oneOf([400, 409, 422, 500]);
    });

    it("rejects config with statusColumn but no statusPostedValue", async () => {
      const res = await createViaDraftExpectError(
        "CsvFormatConfigs",
        CSV_CONFIG_MISSING_STATUS_VALUE,
      );
      expect(res.status).to.be.oneOf([400, 409, 422, 500]);
    });
  });

  // ─── Composite uniqueness constraints ──────────────────────────────────

  describe("composite uniqueness", () => {
    it("rejects duplicate BudgetAllocation [purchaseCategory, effectiveFrom]", async () => {
      const res = await createViaDraftExpectError(
        "BudgetAllocations",
        ALLOCATION_DUPLICATE_COMPOSITE,
      );
      expect(res.status).to.be.oneOf([400, 409, 500]);
    });

    it("allows same category with different effectiveFrom", async () => {
      const { status } = await createViaDraft(
        "BudgetAllocations",
        ALLOCATION_DIFFERENT_EFFECTIVE_FROM,
      );
      expect(status).to.be.oneOf([200, 201]);
    });

    it("rejects duplicate ScrapeMapping [entityType, sourceText]", async () => {
      await createViaDraft("ScrapeMappings", SCRAPE_MAPPING_FIRST);
      const res = await createViaDraftExpectError(
        "ScrapeMappings",
        SCRAPE_MAPPING_DUPLICATE,
      );
      expect(res.status).to.be.oneOf([400, 409, 500]);
    });
  });

  // ─── Simple uniqueness constraints ─────────────────────────────────────

  describe("simple uniqueness", () => {
    it("rejects duplicate issuer name", async () => {
      const res = await createViaDraftExpectError(
        "Issuers",
        ISSUER_DUPLICATE_NAME,
      );
      expect(res.status).to.be.oneOf([400, 409, 500]);
    });

    it("rejects duplicate rewards program name", async () => {
      const res = await createViaDraftExpectError(
        "RewardsPrograms",
        PROGRAM_DUPLICATE_NAME,
      );
      expect(res.status).to.be.oneOf([400, 409, 500]);
    });

    it("rejects duplicate purchase category name", async () => {
      const res = await createViaDraftExpectError(
        "PurchaseCategories",
        PURCHASE_CATEGORY_DUPLICATE_NAME,
      );
      expect(res.status).to.be.oneOf([400, 409, 500]);
    });

    it("rejects duplicate earning category name", async () => {
      const res = await createViaDraftExpectError(
        "EarningCategories",
        EARNING_CATEGORY_DUPLICATE_NAME,
      );
      expect(res.status).to.be.oneOf([400, 409, 500]);
    });

    it("rejects duplicate csv format config name", async () => {
      const res = await createViaDraftExpectError(
        "CsvFormatConfigs",
        CSV_CONFIG_DUPLICATE_NAME,
      );
      expect(res.status).to.be.oneOf([400, 409, 500]);
    });

    it("rejects duplicate financial account type name", async () => {
      const res = await createViaDraftExpectError(
        "FinancialAccountTypes",
        FINANCIAL_ACCOUNT_TYPE_DUPLICATE_NAME,
      );
      expect(res.status).to.be.oneOf([400, 409, 500]);
    });

    it("rejects duplicate income source type name", async () => {
      const res = await createViaDraftExpectError(
        "IncomeSourceTypes",
        INCOME_SOURCE_TYPE_DUPLICATE_NAME,
      );
      expect(res.status).to.be.oneOf([400, 409, 500]);
    });

    it("rejects duplicate perk type name", async () => {
      const res = await createViaDraftExpectError(
        "PerkTypes",
        PERK_TYPE_DUPLICATE_NAME,
      );
      expect(res.status).to.be.oneOf([400, 409, 500]);
    });

    it("rejects duplicate adjustment type name", async () => {
      const res = await createViaDraftExpectError(
        "AdjustmentTypes",
        ADJUSTMENT_TYPE_DUPLICATE_NAME,
      );
      expect(res.status).to.be.oneOf([400, 409, 500]);
    });

    it("rejects duplicate redemption type name", async () => {
      const res = await createViaDraftExpectError(
        "RedemptionTypes",
        REDEMPTION_TYPE_DUPLICATE_NAME,
      );
      expect(res.status).to.be.oneOf([400, 409, 500]);
    });
  });

  // ─── Field validation ──────────────────────────────────────────────────

  describe("field validation", () => {
    it("rejects budget allocation with ratio above 100", async () => {
      const res = await createViaDraftExpectError(
        "BudgetAllocations",
        ALLOCATION_RATIO_ABOVE_MAX,
      );
      expect(res.status).to.be.oneOf([400, 409, 422, 500]);
    });

    it("rejects budget allocation with negative ratio", async () => {
      const res = await createViaDraftExpectError(
        "BudgetAllocations",
        ALLOCATION_RATIO_NEGATIVE,
      );
      expect(res.status).to.be.oneOf([400, 409, 422, 500]);
    });
  });

  // ─── Mandatory fields ──────────────────────────────────────────────────

  describe("mandatory fields", () => {
    it("rejects issuer without name", async () => {
      const res = await createViaDraftExpectError(
        "Issuers",
        ISSUER_MISSING_NAME,
      );
      expect(res.status).to.be.oneOf([400, 409, 422, 500]);
    });

    it("rejects issuer without short name", async () => {
      const res = await createViaDraftExpectError(
        "Issuers",
        ISSUER_MISSING_SHORT_NAME,
      );
      expect(res.status).to.be.oneOf([400, 409, 422, 500]);
    });

    it("rejects budget allocation without ratio", async () => {
      const res = await createViaDraftExpectError(
        "BudgetAllocations",
        ALLOCATION_MISSING_RATIO,
      );
      expect(res.status).to.be.oneOf([400, 409, 422, 500]);
    });

    it("rejects rewards program without currency type", async () => {
      const res = await createViaDraftExpectError(
        "RewardsPrograms",
        PROGRAM_MISSING_CURRENCY,
      );
      expect(res.status).to.be.oneOf([400, 409, 422, 500]);
    });

    it("rejects recurrent expense without name", async () => {
      const res = await createViaDraftExpectError(
        "RecurrentExpenses",
        RECURRENT_EXPENSE_MISSING_NAME,
      );
      expect(res.status).to.be.oneOf([400, 409, 422, 500]);
    });
  });
});
