/**
 * Named test data constants for card entities.
 * UPPER_SNAKE_CASE naming convention.
 * Deterministic UUIDs for reproducible tests.
 * IDs use series a1b2c3d4-002X for card domain entities:
 *   0020 = MarketCard, 0021 = Offer, 0022 = OfferTranche,
 *   0023 = CardInstance, 0024 = EarningMultiplier,
 *   0025 = SoftPerkDefinition, 0026 = CardPerk
 *
 * See TEST_STRATEGY.md §6.5 for naming pattern, §7.2 for canonical test world.
 */

import {
  TD_ISSUER,
  AMEX_ISSUER,
  CIBC_ISSUER,
  AEROPLAN_PROGRAM,
  AMEX_MR_PROGRAM,
  SCENE_PLUS_PROGRAM,
  VISA_NETWORK,
  AMEX_NETWORK,
  AEROPLAN_CORE_TIER,
  GROCERIES_EARNING_CATEGORY,
  DINING_EARNING_CATEGORY,
  GAS_EARNING_CATEGORY,
  TRAVEL_EARNING_CATEGORY,
  EVERYTHING_ELSE_EARNING_CATEGORY,
  LOUNGE_PASS_PERK,
  TRAVEL_CREDIT_PERK,
} from "./reference.js";

// ─── Market Cards ──────────────────────────────────────────────────────────────
export const TD_AEROPLAN_VISA_INFINITE = {
  ID: "a1b2c3d4-0020-4000-8000-000000000001",
  name: "TD Aeroplan Visa Infinite",
  issuer_ID: TD_ISSUER.ID,
  rewardsProgram_ID: AEROPLAN_PROGRAM.ID,
  cardNetwork_ID: VISA_NETWORK.ID,
  programTier_ID: AEROPLAN_CORE_TIER.ID,
  cardType_code: "credit",
  cardSegment_code: "personal",
  feeStructure: "annual",
  feeAmount: 139,
  status: "active",
} as const;

export const AMEX_COBALT = {
  ID: "a1b2c3d4-0020-4000-8000-000000000002",
  name: "Amex Cobalt Card",
  issuer_ID: AMEX_ISSUER.ID,
  rewardsProgram_ID: AMEX_MR_PROGRAM.ID,
  cardNetwork_ID: AMEX_NETWORK.ID,
  programTier_ID: null,
  cardType_code: "credit",
  cardSegment_code: "personal",
  feeStructure: "monthly",
  feeAmount: 12.99,
  status: "active",
} as const;

export const AMEX_PLATINUM = {
  ID: "a1b2c3d4-0020-4000-8000-000000000003",
  name: "Amex Platinum Card",
  issuer_ID: AMEX_ISSUER.ID,
  rewardsProgram_ID: AMEX_MR_PROGRAM.ID,
  cardNetwork_ID: AMEX_NETWORK.ID,
  programTier_ID: null,
  cardType_code: "charge",
  cardSegment_code: "personal",
  feeStructure: "annual",
  feeAmount: 799,
  status: "active",
} as const;

export const CIBC_AEROPLAN_VISA_INFINITE = {
  ID: "a1b2c3d4-0020-4000-8000-000000000004",
  name: "CIBC Aeroplan Visa Infinite",
  issuer_ID: CIBC_ISSUER.ID,
  rewardsProgram_ID: AEROPLAN_PROGRAM.ID,
  cardNetwork_ID: VISA_NETWORK.ID,
  programTier_ID: AEROPLAN_CORE_TIER.ID,
  cardType_code: "credit",
  cardSegment_code: "personal",
  feeStructure: "annual",
  feeAmount: 139,
  status: "active",
} as const;

export const DISCONTINUED_CARD = {
  ID: "a1b2c3d4-0020-4000-8000-000000000099",
  name: "Old Discontinued Card",
  issuer_ID: TD_ISSUER.ID,
  rewardsProgram_ID: SCENE_PLUS_PROGRAM.ID,
  cardNetwork_ID: VISA_NETWORK.ID,
  programTier_ID: null,
  cardType_code: "credit",
  cardSegment_code: "personal",
  feeStructure: "annual",
  feeAmount: 0,
  status: "discontinued",
} as const;

// ─── Offers ────────────────────────────────────────────────────────────────────
export const TD_AEROPLAN_JAN2026_OFFER = {
  ID: "a1b2c3d4-0021-4000-8000-000000000001",
  marketCard_ID: TD_AEROPLAN_VISA_INFINITE.ID,
  name: "Jan 2026: 30,000 AP + FYF",
  fyf: true,
  offerStartDate: "2026-01-01",
  offerEndDate: "2026-03-31",
  feeAmount: null,
  isCurrent: true,
  offerUrl: null,
  source: "Prince of Travel",
  notes: null,
} as const;

export const AMEX_COBALT_DEC2025_OFFER = {
  ID: "a1b2c3d4-0021-4000-8000-000000000002",
  marketCard_ID: AMEX_COBALT.ID,
  name: "Dec 2025: 2,500 MR/month × 12",
  fyf: false,
  offerStartDate: "2025-12-01",
  offerEndDate: "2026-02-28",
  feeAmount: null,
  isCurrent: true,
  offerUrl: null,
  source: "Amex.ca",
  notes: null,
} as const;

// Expired past offer for multi-offer-per-card scenario (offer switching)
export const AMEX_COBALT_JUN2025_OFFER = {
  ID: "a1b2c3d4-0021-4000-8000-000000000005",
  marketCard_ID: AMEX_COBALT.ID,
  name: "Jun 2025: 15,000 MR + FYF",
  fyf: true,
  offerStartDate: "2025-06-01",
  offerEndDate: "2025-08-31",
  feeAmount: null,
  isCurrent: false,
  offerUrl: null,
  source: "GCR",
  notes: null,
} as const;

export const AMEX_PLATINUM_OCT2025_OFFER = {
  ID: "a1b2c3d4-0021-4000-8000-000000000003",
  marketCard_ID: AMEX_PLATINUM.ID,
  name: "Oct 2025: 100,000 MR + FYF",
  fyf: true,
  offerStartDate: "2025-10-01",
  offerEndDate: "2025-12-31",
  feeAmount: null,
  isCurrent: false,
  offerUrl: null,
  source: "Prince of Travel",
  notes: null,
} as const;

export const CIBC_AEROPLAN_OFFER = {
  ID: "a1b2c3d4-0021-4000-8000-000000000004",
  marketCard_ID: CIBC_AEROPLAN_VISA_INFINITE.ID,
  name: "Mar 2026: 20,000 AP",
  fyf: false,
  offerStartDate: "2026-03-01",
  offerEndDate: null,
  feeAmount: null,
  isCurrent: true,
  offerUrl: null,
  source: null,
  notes: null,
} as const;

// ─── Offer Tranches ────────────────────────────────────────────────────────────
export const TD_AEROPLAN_TRANCHE_1 = {
  ID: "a1b2c3d4-0022-4000-8000-000000000001",
  offer_ID: TD_AEROPLAN_JAN2026_OFFER.ID,
  trancheNumber: 1,
  msrAmount: 7500,
  msrWindowType: "oneTime",
  msrWindowMonths: 3,
  bonusAmount: 30000,
  unlockMonth: null,
} as const;

export const AMEX_COBALT_TRANCHE_1 = {
  ID: "a1b2c3d4-0022-4000-8000-000000000002",
  offer_ID: AMEX_COBALT_DEC2025_OFFER.ID,
  trancheNumber: 1,
  msrAmount: 750,
  msrWindowType: "monthlyRecurring",
  msrWindowMonths: 12,
  bonusAmount: 2500,
  unlockMonth: null,
} as const;

// Tranche for expired Cobalt offer (multi-offer-per-card scenario)
export const AMEX_COBALT_JUN2025_TRANCHE_1 = {
  ID: "a1b2c3d4-0022-4000-8000-000000000006",
  offer_ID: AMEX_COBALT_JUN2025_OFFER.ID,
  trancheNumber: 1,
  msrAmount: 3000,
  msrWindowType: "oneTime",
  msrWindowMonths: 3,
  bonusAmount: 15000,
  unlockMonth: null,
} as const;

export const AMEX_PLATINUM_TRANCHE_1 = {
  ID: "a1b2c3d4-0022-4000-8000-000000000003",
  offer_ID: AMEX_PLATINUM_OCT2025_OFFER.ID,
  trancheNumber: 1,
  msrAmount: 10000,
  msrWindowType: "oneTime",
  msrWindowMonths: 3,
  bonusAmount: 80000,
  unlockMonth: null,
} as const;

export const AMEX_PLATINUM_TRANCHE_2 = {
  ID: "a1b2c3d4-0022-4000-8000-000000000004",
  offer_ID: AMEX_PLATINUM_OCT2025_OFFER.ID,
  trancheNumber: 2,
  msrAmount: 0,
  msrWindowType: "oneTime",
  msrWindowMonths: 1,
  bonusAmount: 20000,
  unlockMonth: 15,
} as const;

export const CIBC_AEROPLAN_TRANCHE_1 = {
  ID: "a1b2c3d4-0022-4000-8000-000000000005",
  offer_ID: CIBC_AEROPLAN_OFFER.ID,
  trancheNumber: 1,
  msrAmount: 3000,
  msrWindowType: "oneTime",
  msrWindowMonths: 4,
  bonusAmount: 20000,
  unlockMonth: null,
} as const;

// ─── Card Instances ────────────────────────────────────────────────────────────
export const TD_AEROPLAN_INSTANCE_ACTIVE = {
  ID: "a1b2c3d4-0023-4000-8000-000000000001",
  marketCard_ID: TD_AEROPLAN_VISA_INFINITE.ID,
  offer_ID: TD_AEROPLAN_JAN2026_OFFER.ID,
  parentCardInstance_ID: null,
  lifecycleState: "focus",
  applicationDate: "2026-01-15",
  activationDate: "2026-01-20",
  tentativeCancelDate: null,
  closedDate: null,
  creditLimit: 15000,
  cardholderName: "Sandro Seryani",
  statementCloseDay: 15,
  notes: null,
} as const;

export const AMEX_COBALT_INSTANCE = {
  ID: "a1b2c3d4-0023-4000-8000-000000000002",
  marketCard_ID: AMEX_COBALT.ID,
  offer_ID: AMEX_COBALT_DEC2025_OFFER.ID,
  parentCardInstance_ID: null,
  lifecycleState: "focus",
  applicationDate: "2025-12-10",
  activationDate: "2025-12-15",
  tentativeCancelDate: null,
  closedDate: null,
  creditLimit: 10000,
  cardholderName: "Sandro Seryani",
  statementCloseDay: 10,
  notes: null,
} as const;

export const AMEX_PLATINUM_INSTANCE = {
  ID: "a1b2c3d4-0023-4000-8000-000000000003",
  marketCard_ID: AMEX_PLATINUM.ID,
  offer_ID: AMEX_PLATINUM_OCT2025_OFFER.ID,
  parentCardInstance_ID: null,
  lifecycleState: "active",
  applicationDate: "2025-10-05",
  activationDate: "2025-10-10",
  tentativeCancelDate: null,
  closedDate: null,
  creditLimit: null,
  cardholderName: "Sandro Seryani",
  statementCloseDay: 5,
  notes: null,
} as const;

export const AMEX_PLATINUM_SUPP = {
  ID: "a1b2c3d4-0023-4000-8000-000000000004",
  marketCard_ID: AMEX_PLATINUM.ID,
  offer_ID: AMEX_PLATINUM_OCT2025_OFFER.ID,
  parentCardInstance_ID: AMEX_PLATINUM_INSTANCE.ID,
  lifecycleState: "active",
  applicationDate: "2025-10-05",
  activationDate: "2025-10-15",
  tentativeCancelDate: null,
  closedDate: null,
  creditLimit: null,
  cardholderName: "Supplementary Holder",
  statementCloseDay: 5,
  notes: "Supplementary card for Amex Platinum",
} as const;

export const CLOSED_CARD_INSTANCE = {
  ID: "a1b2c3d4-0023-4000-8000-000000000099",
  marketCard_ID: TD_AEROPLAN_VISA_INFINITE.ID,
  offer_ID: TD_AEROPLAN_JAN2026_OFFER.ID,
  parentCardInstance_ID: null,
  lifecycleState: "closed",
  applicationDate: "2024-06-01",
  activationDate: "2024-06-10",
  tentativeCancelDate: "2025-05-01",
  closedDate: "2025-06-01",
  creditLimit: 10000,
  cardholderName: "Sandro Seryani",
  statementCloseDay: 15,
  notes: "Closed after first year",
} as const;

export const TO_CANCEL_CARD_INSTANCE = {
  ID: "a1b2c3d4-0023-4000-8000-000000000098",
  marketCard_ID: CIBC_AEROPLAN_VISA_INFINITE.ID,
  offer_ID: CIBC_AEROPLAN_OFFER.ID,
  parentCardInstance_ID: null,
  lifecycleState: "toCancel",
  applicationDate: "2025-03-01",
  activationDate: "2025-03-10",
  tentativeCancelDate: "2026-03-01",
  closedDate: null,
  creditLimit: 8000,
  cardholderName: "Sandro Seryani",
  statementCloseDay: 20,
  notes: null,
} as const;

// ─── Earning Multipliers ───────────────────────────────────────────────────────
export const AMEX_COBALT_GROCERIES_5X = {
  ID: "a1b2c3d4-0024-4000-8000-000000000001",
  marketCard_ID: AMEX_COBALT.ID,
  earningCategory_ID: GROCERIES_EARNING_CATEGORY.ID,
  cardInstance_ID: null,
  multiplier: 5.0,
  effectiveFrom: "2025-01-01",
  effectiveTo: "9999-12-31",
} as const;

export const AMEX_COBALT_DINING_5X = {
  ID: "a1b2c3d4-0024-4000-8000-000000000002",
  marketCard_ID: AMEX_COBALT.ID,
  earningCategory_ID: DINING_EARNING_CATEGORY.ID,
  cardInstance_ID: null,
  multiplier: 5.0,
  effectiveFrom: "2025-01-01",
  effectiveTo: "9999-12-31",
} as const;

export const AMEX_COBALT_GAS_2X = {
  ID: "a1b2c3d4-0024-4000-8000-000000000003",
  marketCard_ID: AMEX_COBALT.ID,
  earningCategory_ID: GAS_EARNING_CATEGORY.ID,
  cardInstance_ID: null,
  multiplier: 2.0,
  effectiveFrom: "2025-01-01",
  effectiveTo: "9999-12-31",
} as const;

export const AMEX_COBALT_TRAVEL_3X = {
  ID: "a1b2c3d4-0024-4000-8000-000000000004",
  marketCard_ID: AMEX_COBALT.ID,
  earningCategory_ID: TRAVEL_EARNING_CATEGORY.ID,
  cardInstance_ID: null,
  multiplier: 3.0,
  effectiveFrom: "2025-01-01",
  effectiveTo: "9999-12-31",
} as const;

export const AMEX_COBALT_ELSE_1X = {
  ID: "a1b2c3d4-0024-4000-8000-000000000005",
  marketCard_ID: AMEX_COBALT.ID,
  earningCategory_ID: EVERYTHING_ELSE_EARNING_CATEGORY.ID,
  cardInstance_ID: null,
  multiplier: 1.0,
  effectiveFrom: "2025-01-01",
  effectiveTo: "9999-12-31",
} as const;

export const TD_AEROPLAN_GROCERIES_4X = {
  ID: "a1b2c3d4-0024-4000-8000-000000000006",
  marketCard_ID: TD_AEROPLAN_VISA_INFINITE.ID,
  earningCategory_ID: GROCERIES_EARNING_CATEGORY.ID,
  cardInstance_ID: null,
  multiplier: 4.0,
  effectiveFrom: "2025-01-01",
  effectiveTo: "9999-12-31",
} as const;

// Instance-level override: Cobalt groceries changed to 3x for a specific instance
export const AMEX_COBALT_GROCERIES_INSTANCE_OVERRIDE = {
  ID: "a1b2c3d4-0024-4000-8000-000000000099",
  marketCard_ID: AMEX_COBALT.ID,
  earningCategory_ID: GROCERIES_EARNING_CATEGORY.ID,
  cardInstance_ID: AMEX_COBALT_INSTANCE.ID,
  multiplier: 3.0,
  effectiveFrom: "2026-01-01",
  effectiveTo: "9999-12-31",
} as const;

// Time-bounded historical multiplier (closed)
export const AMEX_COBALT_GROCERIES_OLD = {
  ID: "a1b2c3d4-0024-4000-8000-000000000098",
  marketCard_ID: AMEX_COBALT.ID,
  earningCategory_ID: GROCERIES_EARNING_CATEGORY.ID,
  cardInstance_ID: null,
  multiplier: 4.0,
  effectiveFrom: "2024-01-01",
  effectiveTo: "2024-12-31",
} as const;

// ─── Soft Perk Definitions ─────────────────────────────────────────────────────
export const AMEX_PLATINUM_LOUNGE_PASS = {
  ID: "a1b2c3d4-0025-4000-8000-000000000001",
  marketCard_ID: AMEX_PLATINUM.ID,
  cardInstance_ID: null,
  perkType_ID: LOUNGE_PASS_PERK.ID,
  name: "Priority Pass (4 visits)",
  quantity: 4,
  dollarValue: 200,
  annualReset: true,
  effectiveFrom: "2025-01-01",
  effectiveTo: "9999-12-31",
  notes: null,
} as const;

export const AMEX_PLATINUM_TRAVEL_CREDIT = {
  ID: "a1b2c3d4-0025-4000-8000-000000000002",
  marketCard_ID: AMEX_PLATINUM.ID,
  cardInstance_ID: null,
  perkType_ID: TRAVEL_CREDIT_PERK.ID,
  name: "Annual Travel Credit",
  quantity: null,
  dollarValue: 200,
  annualReset: true,
  effectiveFrom: "2025-01-01",
  effectiveTo: "9999-12-31",
  notes: null,
} as const;

// Instance-level override
export const AMEX_PLATINUM_LOUNGE_INSTANCE_OVERRIDE = {
  ID: "a1b2c3d4-0025-4000-8000-000000000099",
  marketCard_ID: AMEX_PLATINUM.ID,
  cardInstance_ID: AMEX_PLATINUM_INSTANCE.ID,
  perkType_ID: LOUNGE_PASS_PERK.ID,
  name: "Priority Pass (6 visits — Centurion promo)",
  quantity: 6,
  dollarValue: 300,
  annualReset: true,
  effectiveFrom: "2025-10-10",
  effectiveTo: "9999-12-31",
  notes: "Special promo for this card year",
} as const;

// ─── Card Perks ────────────────────────────────────────────────────────────────
export const AMEX_PLAT_LOUNGE_PERK_YEAR1 = {
  ID: "a1b2c3d4-0026-4000-8000-000000000001",
  cardInstance_ID: AMEX_PLATINUM_INSTANCE.ID,
  softPerkDefinition_ID: AMEX_PLATINUM_LOUNGE_PASS.ID,
  periodStart: "2025-10-10",
  periodEnd: "2026-10-09",
  quantityUsed: 2,
  dollarValueRealized: 100,
  notes: null,
} as const;

export const AMEX_PLAT_TRAVEL_CREDIT_YEAR1 = {
  ID: "a1b2c3d4-0026-4000-8000-000000000002",
  cardInstance_ID: AMEX_PLATINUM_INSTANCE.ID,
  softPerkDefinition_ID: AMEX_PLATINUM_TRAVEL_CREDIT.ID,
  periodStart: "2025-10-10",
  periodEnd: "2026-10-09",
  quantityUsed: null,
  dollarValueRealized: 150,
  notes: "Partially claimed",
} as const;
