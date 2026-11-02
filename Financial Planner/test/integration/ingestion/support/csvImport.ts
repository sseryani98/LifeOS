// Harness for the CSV import integration test: the real engine on the in-memory
// DB, seeded CIBC + Amex cards so the seeded format configs resolve, and the
// production facade bound so OData requests reach the real handlers.

import cds from "@sap/cds";

import { CategorizationDataService } from "../../../../srv/modules/categorization/categorizationDataService.js";
import { CategorizationService } from "../../../../srv/modules/categorization/categorizationService.js";
import { CsvImportDataService } from "../../../../srv/modules/ingestion/csvImportDataService.js";
import { CsvImportFacade } from "../../../../srv/modules/ingestion/csvImportFacade.js";
import { CsvImportSaveService } from "../../../../srv/modules/ingestion/csvImportSaveService.js";
import { CsvImportService } from "../../../../srv/modules/ingestion/csvImportService.js";
import { DeduplicationDataService } from "../../../../srv/modules/ingestion/deduplicationDataService.js";
import { DeduplicationService } from "../../../../srv/modules/ingestion/deduplicationService.js";

import {
  AMEX_COBALT,
  AMEX_COBALT_DEC2025_OFFER,
  AMEX_COBALT_INSTANCE,
  CIBC_AEROPLAN_OFFER,
  CIBC_AEROPLAN_VISA_INFINITE,
  TO_CANCEL_CARD_INSTANCE,
} from "../../../shared/data/cards.js";
import {
  AMEX_SUPP_PERSON_1_INSTANCE,
  AMEX_SUPP_PERSON_2_INSTANCE,
  CIBC_PER_SPEC_CARD_INSTANCES,
  RBC_CARD_INSTANCE,
  RBC_MARKET_CARD,
  RBC_OFFER,
} from "../data/csvImport.js";

const SERVICE_PATH = "/service/transactionSvcs";
const SERVICE_NAME = "TransactionService";

type PostFn = <TResponse>(
  url: string,
  data: Record<string, unknown>,
) => Promise<TResponse>;

/** An OData action response; the body is the action's complex return type. */
export interface CsvActionResponse<TData> {
  status: number;
  data: TData;
}

/** The OData callers for the CSV import actions on TransactionService. */
export interface CsvImportActions {
  postParseCsvImport: (
    payload: Record<string, unknown>,
  ) => Promise<CsvActionResponse<{ configResolved: boolean }>>;
  postSaveCsvImport: (
    payload: Record<string, unknown>,
  ) => Promise<
    CsvActionResponse<{ transactionCount: number; topVendorName: string | null }>
  >;
  postReclassifyCsvRow: (
    payload: Record<string, unknown>,
  ) => Promise<CsvActionResponse<{ amount: number; postedAt: string; dedupOutcome: string }>>;
}

/** The real CSV import engine wired to the in-memory DB. */
export const buildCsvImportService = (): CsvImportService => {
  return new CsvImportService(
    new CsvImportDataService(),
    new DeduplicationService(new DeduplicationDataService()),
    new CategorizationService(new CategorizationDataService()),
  );
};

/**
 * Registers the production CSV facade on the served TransactionService.
 * cds.test cannot load the TypeScript service impl, so the facade is bound here
 * to put the CDS action signatures and the req.data mapping under test.
 */
export const registerCsvImportHandlers = async (): Promise<void> => {
  const srv = (await cds.connect.to(SERVICE_NAME)) as cds.ApplicationService;
  new CsvImportFacade(
    srv,
    buildCsvImportService(),
    new CsvImportSaveService(new CsvImportDataService()),
  ).registerHandlers();
};

/** Binds the CSV action callers to a cds.test POST handle. */
export const buildCsvImportActions = (post: PostFn): CsvImportActions => {
  /** Invokes parseCsvImport over OData. */
  const postParseCsvImport = async (
    payload: Record<string, unknown>,
  ): Promise<CsvActionResponse<{ configResolved: boolean }>> => {
    return post(`${SERVICE_PATH}/parseCsvImport`, payload);
  };

  /** Invokes saveCsvImport over OData. */
  const postSaveCsvImport = async (
    payload: Record<string, unknown>,
  ): Promise<
    CsvActionResponse<{ transactionCount: number; topVendorName: string | null }>
  > => {
    return post(`${SERVICE_PATH}/saveCsvImport`, payload);
  };

  /** Invokes reclassifyCsvRow over OData. */
  const postReclassifyCsvRow = async (
    payload: Record<string, unknown>,
  ): Promise<CsvActionResponse<{ amount: number; postedAt: string; dedupOutcome: string }>> => {
    return post(`${SERVICE_PATH}/reclassifyCsvRow`, payload);
  };

  return { postParseCsvImport, postSaveCsvImport, postReclassifyCsvRow };
};

/** Persists one transaction so a CSV row can be compared with it on the natural key. */
export const seedPersistedTransaction = async (
  transaction: Record<string, unknown>,
): Promise<void> => {
  await INSERT.into("com.financialplanner.Transaction").entries([
    { ...transaction },
  ]);
};

/** Seeds CIBC cards (issuer has a seeded CsvFormatConfig), an RBC card (none), and an Amex primary with two supps. */
export const seedCsvImport = async (): Promise<void> => {
  await INSERT.into("com.financialplanner.MarketCard").entries([
    CIBC_AEROPLAN_VISA_INFINITE,
  ]);
  await INSERT.into("com.financialplanner.Offer").entries([CIBC_AEROPLAN_OFFER]);
  await INSERT.into("com.financialplanner.CardInstance").entries([
    TO_CANCEL_CARD_INSTANCE,
    ...CIBC_PER_SPEC_CARD_INSTANCES,
  ]);
  await INSERT.into("com.financialplanner.MarketCard").entries([RBC_MARKET_CARD]);
  await INSERT.into("com.financialplanner.Offer").entries([RBC_OFFER]);
  await INSERT.into("com.financialplanner.CardInstance").entries([
    RBC_CARD_INSTANCE,
  ]);
  await INSERT.into("com.financialplanner.MarketCard").entries([AMEX_COBALT]);
  await INSERT.into("com.financialplanner.Offer").entries([
    AMEX_COBALT_DEC2025_OFFER,
  ]);
  await INSERT.into("com.financialplanner.CardInstance").entries([
    AMEX_COBALT_INSTANCE,
    AMEX_SUPP_PERSON_1_INSTANCE,
    AMEX_SUPP_PERSON_2_INSTANCE,
  ]);
};
