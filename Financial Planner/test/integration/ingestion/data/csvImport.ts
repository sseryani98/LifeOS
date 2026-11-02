// Named fixtures for the CSV import integration test. Kept out of the support
// harness so data lives in a data/ folder and the harness stays pure functions.

import {
  AMEX_COBALT_INSTANCE,
  TO_CANCEL_CARD_INSTANCE,
} from "../../../shared/data/cards.js";
import {
  AMEX_CSV,
  CIBC_CSV,
  P1_SUPP_ID,
  P2_SUPP_ID,
} from "../../../shared/data/ingestion/csv.js";
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

// ─── Per-spec CIBC cards ────────────────────────────────────────────────────
// Dedup is keyed on the card, so each natural-key spec parses against its own
// card and the rows it persists can never reach another spec's parse (§6.3).

/** Columns every per-spec CIBC instance shares (same card + offer as TO_CANCEL). */
const CIBC_CARD_TEMPLATE = {
  marketCard_ID: TO_CANCEL_CARD_INSTANCE.marketCard_ID,
  offer_ID: TO_CANCEL_CARD_INSTANCE.offer_ID,
  parentCardInstance_ID: null,
  lifecycleState: "active",
} as const;

/** Card the exact natural-key duplicate is persisted on and parsed against. */
export const CIBC_DUP_CARD_INSTANCE = {
  ...CIBC_CARD_TEMPLATE,
  ID: "a1b2c3d4-0023-4000-8000-0000000000d1",
} as const;

/** Card whose persisted row differs from the CSV row by amount only. */
export const CIBC_AMOUNT_VARIANT_CARD_INSTANCE = {
  ...CIBC_CARD_TEMPLATE,
  ID: "a1b2c3d4-0023-4000-8000-0000000000d2",
} as const;

/** Card whose persisted row differs from the CSV row by posted date only. */
export const CIBC_DATE_VARIANT_CARD_INSTANCE = {
  ...CIBC_CARD_TEMPLATE,
  ID: "a1b2c3d4-0023-4000-8000-0000000000d3",
} as const;

/** Card the CSV is parsed against while the identical row sits on a sibling card. */
export const CIBC_CARD_VARIANT_TARGET_INSTANCE = {
  ...CIBC_CARD_TEMPLATE,
  ID: "a1b2c3d4-0023-4000-8000-0000000000d4",
} as const;

/** The sibling card (e.g. another household member's) holding the identical row. */
export const CIBC_CARD_VARIANT_SIBLING_INSTANCE = {
  ...CIBC_CARD_TEMPLATE,
  ID: "a1b2c3d4-0023-4000-8000-0000000000d5",
} as const;

/** Every per-spec CIBC card, seeded together. */
export const CIBC_PER_SPEC_CARD_INSTANCES = [
  CIBC_DUP_CARD_INSTANCE,
  CIBC_AMOUNT_VARIANT_CARD_INSTANCE,
  CIBC_DATE_VARIANT_CARD_INSTANCE,
  CIBC_CARD_VARIANT_TARGET_INSTANCE,
  CIBC_CARD_VARIANT_SIBLING_INSTANCE,
];

/** The CIBC_CSV "PURCHASE INTEREST" row's natural key, stored on its own card. */
export const CIBC_DUP_TRANSACTION = {
  ID: "ffffffff-0000-0000-0000-000000000001",
  cardInstance_ID: CIBC_DUP_CARD_INSTANCE.ID,
  source: "csv",
  amount: -1.12,
  postedAt: "2025-07-24",
  rawDescription: "PURCHASE INTEREST",
  categorizationStatus: "uncategorized",
  isExcluded: false,
} as const;

/** Same description, date and card — one cent apart, so a different charge. */
export const CIBC_AMOUNT_VARIANT_TRANSACTION = {
  ...CIBC_DUP_TRANSACTION,
  ID: "ffffffff-0000-0000-0000-000000000002",
  cardInstance_ID: CIBC_AMOUNT_VARIANT_CARD_INSTANCE.ID,
  amount: -1.13,
} as const;

/** Same description, amount and card — posted one day later, so a different charge. */
export const CIBC_DATE_VARIANT_TRANSACTION = {
  ...CIBC_DUP_TRANSACTION,
  ID: "ffffffff-0000-0000-0000-000000000003",
  cardInstance_ID: CIBC_DATE_VARIANT_CARD_INSTANCE.ID,
  postedAt: "2025-07-25",
} as const;

/** Same description, amount and date — but on the sibling card. */
export const CIBC_CARD_VARIANT_TRANSACTION = {
  ...CIBC_DUP_TRANSACTION,
  ID: "ffffffff-0000-0000-0000-000000000004",
  cardInstance_ID: CIBC_CARD_VARIANT_SIBLING_INSTANCE.ID,
} as const;

// ─── Amex supplementary attribution ─────────────────────────────────────────

/** Person 1's supplementary card under the Amex Cobalt primary. */
export const AMEX_SUPP_PERSON_1_INSTANCE = {
  ...AMEX_COBALT_INSTANCE,
  ID: P1_SUPP_ID,
  parentCardInstance_ID: AMEX_COBALT_INSTANCE.ID,
  cardholderName: "Person 1",
} as const;

/** Person 2's supplementary card under the Amex Cobalt primary. */
export const AMEX_SUPP_PERSON_2_INSTANCE = {
  ...AMEX_COBALT_INSTANCE,
  ID: P2_SUPP_ID,
  parentCardInstance_ID: AMEX_COBALT_INSTANCE.ID,
  cardholderName: "Person 2",
} as const;

/** A parse of the Amex export (one row per cardmember) against the Cobalt primary. */
export const AMEX_PARSE_REQUEST = {
  cardInstance_ID: AMEX_COBALT_INSTANCE.ID,
  fileName: "amex.csv",
  fileContent: AMEX_CSV,
} as const;

// ─── OData action payloads ──────────────────────────────────────────────────

/** The parseCsvImport body the wizard posts for a CIBC upload. */
export const PARSE_CSV_ODATA_PAYLOAD = {
  cardInstance_ID: TO_CANCEL_CARD_INSTANCE.ID,
  fileName: "cibc.csv",
  fileContent: CIBC_CSV,
} as const;

/** A CIBC upload whose second row has a malformed date. */
export const CIBC_BAD_DATE_CSV = [
  "2025-11-20,PAYMENT THANK YOU,,1.00,4500********0000",
  "2025-07-xx,PURCHASE INTEREST,1.12,,4500********0000",
].join("\n");

/** The reclassifyCsvRow body the wizard posts after the user fixes that date. */
export const RECLASSIFY_CSV_ODATA_PAYLOAD = {
  cardInstance_ID: TO_CANCEL_CARD_INSTANCE.ID,
  fileName: "cibc.csv",
  fileContent: CIBC_BAD_DATE_CSV,
  rowNumber: 2,
  correctedValue: "2025-07-24",
} as const;

/** The same body with fileContent omitted — must be a 400, not a crash. */
export const PARSE_CSV_ODATA_NO_CONTENT = {
  cardInstance_ID: TO_CANCEL_CARD_INSTANCE.ID,
  fileName: "cibc.csv",
} as const;
