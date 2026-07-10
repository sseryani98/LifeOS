// Harness for the CsvImportSaveService unit test: wires the save engine to a
// mocked data layer while using the real validator and mapper. A helper wraps a
// save request as an action request with a spy error() so specs stay AAA.

import { CsvImportSaveService } from "../../../../srv/modules/ingestion/csvImportSaveService.js";

import type { CsvImportDataService } from "../../../../srv/modules/ingestion/csvImportDataService.js";
import type { CsvSaveRequest } from "../../../../srv/modules/ingestion/types.js";

export interface CsvImportSaveMocks {
  data: jest.Mocked<CsvImportDataService>;
  service: CsvImportSaveService;
}

/** Builds a fresh CsvImportSaveService with its data layer mocked. */
export function buildCsvImportSaveMocks(vendorName = "Amazon"): CsvImportSaveMocks {
  const data = {
    insertTransactions: jest.fn(async () => undefined),
    insertImportLog: jest.fn(async () => undefined),
    getVendorName: jest.fn(async () => vendorName),
  } as unknown as jest.Mocked<CsvImportDataService>;

  const service = new CsvImportSaveService(data);
  return { data, service };
}

/** Wraps a save request as an action request with a spy error() collaborator. */
export function saveRequestOf(request: CsvSaveRequest): {
  data: CsvSaveRequest;
  error: jest.Mock;
} {
  return { data: request, error: jest.fn() };
}
