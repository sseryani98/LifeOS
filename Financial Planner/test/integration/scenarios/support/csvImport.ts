// Harness for the CSV import storyline: OData callers typed with the full parse
// and save results, the wizard's review-to-save step, and a persisted-row reader.

import type {
  CsvClassifiedRow,
  CsvImportSummary,
  CsvParseResult,
  CsvSaveRow,
} from "../../../../srv/modules/ingestion/types.js";

const SERVICE_PATH = "/service/transactionSvcs";

type PostFn = <TResponse>(
  url: string,
  data: Record<string, unknown>,
) => Promise<TResponse>;

/** An OData action response; the body is the action's complex return type. */
export interface ActionResponse<TData> {
  status: number;
  data: TData;
}

/** The parse upload body the wizard posts. */
export interface CsvUploadBody {
  cardInstance_ID: string;
  fileName: string;
  fileContent: string;
}

/** The OData callers a CSV import journey drives. */
export interface CsvImportJourney {
  uploadCsv: (body: CsvUploadBody) => Promise<ActionResponse<CsvParseResult>>;
  saveReviewed: (
    upload: CsvUploadBody,
    review: CsvParseResult,
  ) => Promise<ActionResponse<CsvImportSummary>>;
}

/** A persisted transaction, projected to its id. */
export interface PersistedTransactionId {
  ID: string;
}

/**
 * Maps the review tab's rows to the save payload exactly as the wizard does when
 * the user accepts every row with its suggested categorization.
 * @param rows Classified rows from the review step.
 * @returns The rows the saveCsvImport action takes.
 */
export const toAcceptedSaveRows = (rows: CsvClassifiedRow[]): CsvSaveRow[] => {
  return rows.map(row => ({
    postedAt: row.postedAt,
    amount: row.amount,
    rawDescription: row.rawDescription,
    cardInstance_ID: row.cardInstance_ID,
    vendor_ID: row.suggestedVendor_ID,
    purchaseType_ID: row.suggestedPurchaseType_ID,
    earningCategory_ID: row.suggestedEarningCategory_ID,
  }));
};

/** Binds the upload and save steps of the wizard to a cds.test POST handle. */
export const buildCsvImportJourney = (post: PostFn): CsvImportJourney => {
  /** Uploads a file to the review step. */
  const uploadCsv = async (
    body: CsvUploadBody,
  ): Promise<ActionResponse<CsvParseResult>> => {
    return post(`${SERVICE_PATH}/parseCsvImport`, { ...body });
  };

  /** Saves every New-tab row of a review, as the wizard's Save does. */
  const saveReviewed = async (
    upload: CsvUploadBody,
    review: CsvParseResult,
  ): Promise<ActionResponse<CsvImportSummary>> => {
    return post(`${SERVICE_PATH}/saveCsvImport`, {
      cardInstance_ID: upload.cardInstance_ID,
      fileName: upload.fileName,
      skippedCount: review.skippedCount,
      rows: toAcceptedSaveRows(review.newRows),
    });
  };

  return { uploadCsv, saveReviewed };
};

/** Reads the ids of every transaction persisted on one card. */
export const readTransactionIdsForCard = async (
  cardInstanceId: string,
): Promise<string[]> => {
  const rows = (await SELECT.from("com.financialplanner.Transaction")
    .columns("ID")
    .where({ cardInstance_ID: cardInstanceId })) as PersistedTransactionId[];
  return rows.map(row => row.ID);
};
