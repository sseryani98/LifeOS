import cds from "@sap/cds";

import {
  TD_ISSUER,
  AMEX_ISSUER,
  GROCERIES_PURCHASE_TYPE,
  DINING_PURCHASE_TYPE,
  REIMBURSABLE_PURCHASE_TYPE,
  RESTAURANTS_SUBTYPE,
  ALERT_TYPE_MSR_DEADLINE,
} from "../data/reference.js";

import {
  GROCERIES_ALLOCATION_CURRENT,
  DINING_ALLOCATION_CURRENT,
} from "../data/budget.js";

const { GET, POST, PATCH, DELETE, expect } = cds.test(
  "serve",
  "--with-mocks",
  "--in-memory",
);

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
  await INSERT.into("com.financialplanner.BudgetAllocation").entries([
    GROCERIES_ALLOCATION_CURRENT,
    DINING_ALLOCATION_CURRENT,
  ]);
}

beforeAll(seed);

describe("AdminService", () => {
  // ─── CRUD on editable entities ─────────────────────────────────────────

  describe("editable reference entities", () => {
    it("can read issuers", async () => {
      const { status, data } = await GET(`${SERVICE}/Issuers`);
      expect(status).to.be.oneOf([200, 201]);
      expect(data.value.length).to.be.greaterThanOrEqual(3);
    });

    it("can create a new issuer via draft", async () => {
      const { status, data } = await createViaDraft("Issuers", {
        name: "National Bank",
        shortName: "NBC",
      });
      expect(status).to.be.oneOf([200, 201]);
      expect(data.name).to.equal("National Bank");
      expect(data.IsActiveEntity).to.equal(true);
    });

    it("can update an issuer via draft edit", async () => {
      const edit = await POST(
        `${SERVICE}/Issuers(ID=${AMEX_ISSUER.ID},IsActiveEntity=true)/AdminService.draftEdit`,
        { PreserveChanges: true },
      );
      expect(edit.status).to.equal(201);

      await PATCH(
        `${SERVICE}/Issuers(ID=${AMEX_ISSUER.ID},IsActiveEntity=false)`,
        { shortName: "AMEX" },
      );

      const { status } = await POST(
        `${SERVICE}/Issuers(ID=${AMEX_ISSUER.ID},IsActiveEntity=false)/AdminService.draftActivate`,
        {},
      );
      expect(status).to.be.oneOf([200, 201]);
    });

    it("can delete an unreferenced issuer", async () => {
      const created = await createViaDraft("Issuers", {
        name: "Temp Issuer For Delete",
        shortName: "TMP",
      });
      const { status } = await DELETE(
        `${SERVICE}/Issuers(ID=${created.data.ID},IsActiveEntity=true)`,
      );
      expect(status).to.equal(204);
    });
  });

  // ─── Uniqueness constraints ─────────────────────────────────────────────

  describe("uniqueness constraints", () => {
    it("rejects duplicate issuer name on activation", async () => {
      const res = await createViaDraftExpectError("Issuers", {
        name: TD_ISSUER.name,
        shortName: "DUP",
      });
      expect(res.status).to.be.oneOf([400, 409, 500]);
    });

    it("rejects duplicate budget allocation for same purchase type and start date", async () => {
      const res = await createViaDraftExpectError("BudgetAllocations", {
        purchaseType_ID: GROCERIES_PURCHASE_TYPE.ID,
        ratio: 50,
        effectiveFrom: GROCERIES_ALLOCATION_CURRENT.effectiveFrom,
        effectiveTo: "9999-12-31",
      });
      expect(res.status).to.be.oneOf([400, 409, 500]);
    });

    it("allows same purchase type with different start date", async () => {
      const { status } = await createViaDraft("BudgetAllocations", {
        purchaseType_ID: GROCERIES_PURCHASE_TYPE.ID,
        ratio: 30,
        effectiveFrom: "2027-01-01",
        effectiveTo: "9999-12-31",
      });
      expect(status).to.be.oneOf([200, 201]);
    });
  });

  // ─── Field validation ───────────────────────────────────────────────────
  describe("field validation", () => {
    it("rejects budget allocation with ratio above 100", async () => {
      const res = await createViaDraftExpectError("BudgetAllocations", {
        purchaseType_ID: DINING_PURCHASE_TYPE.ID,
        ratio: 150,
        effectiveFrom: "2028-01-01",
        effectiveTo: "9999-12-31",
      });
      expect(res.status).to.be.oneOf([400, 409, 422, 500]);
    });

    it("rejects budget allocation with negative ratio", async () => {
      const res = await createViaDraftExpectError("BudgetAllocations", {
        purchaseType_ID: DINING_PURCHASE_TYPE.ID,
        ratio: -5,
        effectiveFrom: "2028-06-01",
        effectiveTo: "9999-12-31",
      });
      expect(res.status).to.be.oneOf([400, 409, 422, 500]);
    });

    it("rejects system config key that is not UPPER_SNAKE_CASE", async () => {
      const res = await createViaDraftExpectError("SystemConfigs", {
        key: "lowercase_key",
        value: "test",
        description: "Invalid key format",
      });
      expect(res.status).to.be.oneOf([400, 409, 422, 500]);
    });

    it("accepts system config key in UPPER_SNAKE_CASE", async () => {
      const { status } = await createViaDraft("SystemConfigs", {
        key: "VALID_KEY",
        value: "test",
        description: "Valid key format",
      });
      expect(status).to.be.oneOf([200, 201]);
    });
  });

  // ─── CDS @assert (cross-field validation) ───────────────────────────────
  describe("cross-field validation", () => {
    it("rejects budget allocation referencing a child purchase type", async () => {
      const res = await createViaDraftExpectError("BudgetAllocations", {
        purchaseType_ID: RESTAURANTS_SUBTYPE.ID,
        ratio: 10,
        effectiveFrom: "2028-01-01",
        effectiveTo: "9999-12-31",
      });
      expect(res.status).to.be.oneOf([400, 409, 422, 500]);
    });

    it("rejects budget allocation referencing an excluded-from-budget purchase type", async () => {
      const res = await createViaDraftExpectError("BudgetAllocations", {
        purchaseType_ID: REIMBURSABLE_PURCHASE_TYPE.ID,
        ratio: 10,
        effectiveFrom: "2028-01-01",
        effectiveTo: "9999-12-31",
      });
      expect(res.status).to.be.oneOf([400, 409, 422, 500]);
    });
  });

  // ─── Read-only entities ─────────────────────────────────────────────────
  describe("read-only entities", () => {
    it("can read alert types", async () => {
      const { status, data } = await GET(`${SERVICE}/AlertTypes`);
      expect(status).to.be.oneOf([200, 201]);
      expect(data.value.length).to.be.greaterThanOrEqual(1);
    });

    it("rejects creating an alert type", async () => {
      const res = await POST(`${SERVICE}/AlertTypes`, {
        name: "new_alert",
        sortOrder: 99,
      }).catch((e: { status: number }) => e);
      expect(res.status).to.equal(405);
    });

    it("rejects deleting an alert type", async () => {
      const res = await DELETE(
        `${SERVICE}/AlertTypes(${ALERT_TYPE_MSR_DEADLINE.ID})`,
      ).catch((e: { status: number }) => e);
      expect(res.status).to.equal(405);
    });

    it("rejects creating an alert severity", async () => {
      const res = await POST(`${SERVICE}/AlertSeverities`, {
        name: "new_severity",
        sortOrder: 99,
      }).catch((e: { status: number }) => e);
      expect(res.status).to.equal(405);
    });

    it("rejects creating a card network", async () => {
      const res = await POST(`${SERVICE}/CardNetworks`, {
        name: "new_network",
        sortOrder: 99,
      }).catch((e: { status: number }) => e);
      expect(res.status).to.equal(405);
    });
  });

  // ─── Mandatory fields ──────────────────────────────────────────────────
  describe("mandatory fields", () => {
    it("rejects issuer without name", async () => {
      const res = await createViaDraftExpectError("Issuers", {
        shortName: "X",
      });
      expect(res.status).to.be.oneOf([400, 409, 422, 500]);
    });

    it("rejects issuer without short name", async () => {
      const res = await createViaDraftExpectError("Issuers", {
        name: "Some Issuer",
      });
      expect(res.status).to.be.oneOf([400, 409, 422, 500]);
    });

    it("rejects budget allocation without ratio", async () => {
      const res = await createViaDraftExpectError("BudgetAllocations", {
        purchaseType_ID: DINING_PURCHASE_TYPE.ID,
        effectiveFrom: "2029-01-01",
        effectiveTo: "9999-12-31",
      });
      expect(res.status).to.be.oneOf([400, 409, 422, 500]);
    });
  });

  // ─── Referential integrity ─────────────────────────────────────────────

  describe("referential integrity", () => {
    it("rejects budget allocation with non-existent purchase type", async () => {
      const res = await createViaDraftExpectError("BudgetAllocations", {
        purchaseType_ID: "00000000-0000-0000-0000-000000000000",
        ratio: 10,
        effectiveFrom: "2029-01-01",
        effectiveTo: "9999-12-31",
      });
      expect(res.status).to.be.greaterThanOrEqual(400);
    });
  });
});
