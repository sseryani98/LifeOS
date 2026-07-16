// Named fixtures for the CSV import integration test. Kept out of the support
// harness so data lives in a data/ folder and the harness stays pure functions.

import { TO_CANCEL_CARD_INSTANCE } from "../../../shared/data/cards.js";
import { RBC_ISSUER, VISA_NETWORK } from "../../../shared/data/reference.js";

// A card on an issuer with NO CsvFormatConfig (RBC), for the blocked-import path.
export const RBC_MARKET_CARD = {
  ID: "a1b2c3d4-0020-4000-8000-0000000000f1",
  name: "RBC Avion Visa (test)",
  issuer_ID: RBC_ISSUER.ID,
  rewardsProgram_ID: null,
  cardNetwork_ID: VISA_NETWORK.ID,
  programTier_ID: null,
  cardType_code: "credit",
  cardSegment_code: "personal",
  feeStructure: "annual",
  feeAmount: 0,
  status: "active",
} as const;

export const RBC_OFFER = {
  ID: "a1b2c3d4-0021-4000-8000-0000000000f1",
  marketCard_ID: RBC_MARKET_CARD.ID,
  name: "RBC test offer",
  fyf: false,
  isCurrent: true,
} as const;

/** Instance of a card whose issuer has no CSV format config. */
export const RBC_CARD_INSTANCE = {
  ID: "a1b2c3d4-0023-4000-8000-0000000000f1",
  marketCard_ID: RBC_MARKET_CARD.ID,
  offer_ID: RBC_OFFER.ID,
  parentCardInstance_ID: null,
  lifecycleState: "active",
} as const;

/** A Transaction whose natural key matches the CIBC "PURCHASE INTEREST" row. */
export const CIBC_DUP_TRANSACTION = {
  ID: "ffffffff-0000-0000-0000-000000000001",
  cardInstance_ID: TO_CANCEL_CARD_INSTANCE.ID,
  source: "csv",
  amount: -1.12,
  postedAt: "2025-07-24",
  rawDescription: "PURCHASE INTEREST",
  categorizationStatus: "uncategorized",
  isExcluded: false,
} as const;
