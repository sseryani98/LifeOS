// Harness for the CSV save integration test: the real save engine wired to the
// in-memory DB, plus seed + read helpers so the spec issues no CQL directly.

import { CsvImportDataService } from "../../../../srv/modules/ingestion/csvImportDataService.js";
import { CsvImportSaveService } from "../../../../srv/modules/ingestion/csvImportSaveService.js";

import { SAVE_VENDOR } from "../data/csvImportSave.js";
import { seedCsvImport } from "./csvImport.js";

/** A persisted transaction, projected to the fields the spec asserts on. */
export interface SavedTransactionRow {
  source: string;
  amount: number;
  categorizationStatus: string;
  vendor_ID: string | null;
}

/** A persisted import-log row, projected to the fields the spec asserts on. */
export interface SavedImportLogRow {
  fileName: string;
  transactionCount: number;
  totalAmount: number;
  skippedCount: number;
}

/** The real CSV save engine wired to the in-memory DB. */
export const buildCsvImportSaveService = (): CsvImportSaveService => {
  return new CsvImportSaveService(new CsvImportDataService());
};

/** Seeds the CIBC card (for config resolution) plus the summary's vendor. */
export const seedCsvImportSave = async (): Promise<void> => {
  await seedCsvImport();
  await INSERT.into("com.financialplanner.Vendor").entries([SAVE_VENDOR]);
};

/** Reads the CSV transactions persisted with any of the given raw descriptions. */
export const readCsvTransactionsByDescriptions = async (
  descriptions: string[],
): Promise<SavedTransactionRow[]> => {
  return (await SELECT.from("com.financialplanner.Transaction")
    .columns("source", "amount", "categorizationStatus", "vendor_ID")
    .where({ rawDescription: { in: descriptions } })) as SavedTransactionRow[];
};

/** Reads the import-log rows recorded for one uploaded file name. */
export const readImportLogsByFileName = async (
  fileName: string,
): Promise<SavedImportLogRow[]> => {
  return (await SELECT.from("com.financialplanner.ImportLog")
    .columns("fileName", "transactionCount", "totalAmount", "skippedCount")
    .where({ fileName })) as SavedImportLogRow[];
};
