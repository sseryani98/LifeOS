// Harness for the CsvImportService unit test: wires the engine to a mocked data
// layer and dedup engine while using the real validator, mapper, and field
// parser. Kept out of the test file so each test reads arrange-act-assert.

import { CsvImportService } from "../../../../srv/modules/ingestion/csvImportService.js";

import { CSV_SINGLE_CARD, SCOTIA_CONFIG } from "../../../shared/data/ingestion/csv.js";

import type { CsvImportDataService } from "../../../../srv/modules/ingestion/csvImportDataService.js";
import type { DeduplicationService } from "../../../../srv/modules/ingestion/deduplicationService.js";

export interface CsvImportMocks {
  data: jest.Mocked<CsvImportDataService>;
  dedup: jest.Mocked<DeduplicationService>;
  service: CsvImportService;
}

/** Builds a fresh CsvImportService with data + dedup collaborators mocked. */
export function buildCsvImportMocks(): CsvImportMocks {
  const data = {
    getFormatConfigForCard: jest.fn(async () => ({ ...SCOTIA_CONFIG })),
    getAttributionCards: jest.fn(async () => [...CSV_SINGLE_CARD]),
  } as unknown as jest.Mocked<CsvImportDataService>;

  const dedup = {
    evaluate: jest.fn(async () => ({ outcome: "new" as const })),
  } as unknown as jest.Mocked<DeduplicationService>;

  const service = new CsvImportService(data, dedup);
  return { data, dedup, service };
}
