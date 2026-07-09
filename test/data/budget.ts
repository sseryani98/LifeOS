/**
 * Named test data constants for budget entities.
 * UPPER_SNAKE_CASE naming convention.
 * IDs use series a1b2c3d4-0030 for BudgetAllocation,
 *   a1b2c3d4-0031 for RecurrentExpense.
 *
 * See TEST_STRATEGY.md for naming pattern and canonical test world.
 */

import {
  GROCERIES_CATEGORY,
  DINING_CATEGORY,
  TRANSPORTATION_CATEGORY,
} from "./reference.js";

import { AMEX_COBALT_INSTANCE } from "./cards.js";

// ─── Budget Allocations ────────────────────────────────────────────────────────
export const GROCERIES_ALLOCATION_CURRENT = {
  ID: "a1b2c3d4-0030-4000-8000-000000000001",
  purchaseCategory_ID: GROCERIES_CATEGORY.ID,
  ratio: 35,
  effectiveFrom: "2026-01-01",
  effectiveTo: "9999-12-31",
} as const;

export const DINING_ALLOCATION_CURRENT = {
  ID: "a1b2c3d4-0030-4000-8000-000000000002",
  purchaseCategory_ID: DINING_CATEGORY.ID,
  ratio: 25,
  effectiveFrom: "2026-01-01",
  effectiveTo: "9999-12-31",
} as const;

export const TRANSPORTATION_ALLOCATION_CURRENT = {
  ID: "a1b2c3d4-0030-4000-8000-000000000003",
  purchaseCategory_ID: TRANSPORTATION_CATEGORY.ID,
  ratio: 15,
  effectiveFrom: "2026-01-01",
  effectiveTo: "9999-12-31",
} as const;

// Historical (closed) allocation — for time-bounding tests
export const GROCERIES_ALLOCATION_HISTORICAL = {
  ID: "a1b2c3d4-0030-4000-8000-000000000099",
  purchaseCategory_ID: GROCERIES_CATEGORY.ID,
  ratio: 40,
  effectiveFrom: "2025-01-01",
  effectiveTo: "2025-12-31",
} as const;

// ─── Recurrent Expenses ────────────────────────────────────────────────────────
export const NETFLIX_EXPENSE = {
  ID: "a1b2c3d4-0031-4000-8000-000000000001",
  name: "Netflix",
  amount: 22.99,
  purchaseType_ID: null,
  cardInstance_ID: AMEX_COBALT_INSTANCE.ID,
  effectiveFrom: "2026-01-01",
  effectiveTo: "9999-12-31",
  notes: null,
} as const;

export const CAR_LOAN_EXPENSE = {
  ID: "a1b2c3d4-0031-4000-8000-000000000002",
  name: "Car Loan Payment",
  amount: 450.0,
  purchaseType_ID: null,
  cardInstance_ID: null,
  effectiveFrom: "2025-06-01",
  effectiveTo: "9999-12-31",
  notes: "Monthly auto-payment",
} as const;

// Historical (closed) expense — for overlap tests
export const OLD_NETFLIX_EXPENSE = {
  ID: "a1b2c3d4-0031-4000-8000-000000000099",
  name: "Netflix",
  amount: 16.99,
  purchaseType_ID: null,
  cardInstance_ID: null,
  effectiveFrom: "2024-01-01",
  effectiveTo: "2025-12-31",
  notes: "Old plan price",
} as const;
