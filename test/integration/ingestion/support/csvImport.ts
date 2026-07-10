// Harness for the CSV import integration test: the real engine wired to the
// in-memory DB, plus a seeded CIBC card so the seeded format config resolves.
// Kept out of the test file so the body reads as arrange-act-assert.

import { CsvImportDataService } from "../../../../srv/modules/ingestion/csvImportDataService.js";
import { CsvImportService } from "../../../../srv/modules/ingestion/csvImportService.js";
import { DeduplicationDataService } from "../../../../srv/modules/ingestion/deduplicationDataService.js";
import { DeduplicationService } from "../../../../srv/modules/ingestion/deduplicationService.js";

import {
  CIBC_AEROPLAN_OFFER,
  CIBC_AEROPLAN_VISA_INFINITE,
  TO_CANCEL_CARD_INSTANCE,
} from "../../../shared/data/cards.js";
import {
  CIBC_DUP_TRANSACTION,
  RBC_CARD_INSTANCE,
  RBC_MARKET_CARD,
  RBC_OFFER,
} from "../data/csvImport.js";

/** The real CSV import engine wired to the in-memory DB. */
export function buildCsvImportService(): CsvImportService {
  return new CsvImportService(
    new CsvImportDataService(),
    new DeduplicationService(new DeduplicationDataService()),
  );
}

/** Persists one transaction so a CSV row can collide with it on the natural key. */
export async function seedDuplicateTransaction(): Promise<void> {
  await INSERT.into("com.financialplanner.Transaction").entries([
    { ...CIBC_DUP_TRANSACTION },
  ]);
}

/** Seeds a CIBC card (issuer has a seeded CsvFormatConfig) into SQLite. */
export async function seedCsvImport(): Promise<void> {
  await INSERT.into("com.financialplanner.MarketCard").entries([
    CIBC_AEROPLAN_VISA_INFINITE,
  ]);
  await INSERT.into("com.financialplanner.Offer").entries([CIBC_AEROPLAN_OFFER]);
  await INSERT.into("com.financialplanner.CardInstance").entries([
    TO_CANCEL_CARD_INSTANCE,
  ]);
  await INSERT.into("com.financialplanner.MarketCard").entries([RBC_MARKET_CARD]);
  await INSERT.into("com.financialplanner.Offer").entries([RBC_OFFER]);
  await INSERT.into("com.financialplanner.CardInstance").entries([
    RBC_CARD_INSTANCE,
  ]);
}
