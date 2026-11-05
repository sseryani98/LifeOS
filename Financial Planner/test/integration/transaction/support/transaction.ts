// Harness for the transaction-processing integration test: seeds vendors and
// transactions, and reads split + categorization state so the spec stays free of
// CQL. Actions are invoked through the connected TransactionService.

import { CategorizationDataService } from "../../../../srv/modules/categorization/categorizationDataService.js";
import { CategorizationService } from "../../../../srv/modules/categorization/categorizationService.js";
import { TransactionDataService } from "../../../../srv/modules/transaction/transactionDataService.js";
import { TransactionFacade } from "../../../../srv/modules/transaction/transactionFacade.js";
import { TransactionService } from "../../../../srv/modules/transaction/transactionService.js";
import { TransactionSplitService } from "../../../../srv/modules/transaction/transactionSplitService.js";

import type { SplitSuggestion } from "../../../../srv/modules/transaction/types.js";

import cds from "@sap/cds";

import { LEARNED_PATTERN_SOURCE } from "../../../shared/data/reference.js";
import {
  AUTO_EDIT_TRANSACTION,
  BULK_KEEP_TRANSACTION,
  CAFE_NERO_VENDOR,
  BULK_TRANSACTIONS,
  CORRECTION_TRANSACTION,
  EXISTING_SPLIT,
  INLINE_EDIT_TRANSACTION,
  RECAT_CORRECTED_TRANSACTIONS,
  RECAT_UNCATEGORIZED_TRANSACTIONS,
  RESPLIT_TRANSACTION,
  SHARE_EDIT_SPLITS,
  SHARE_EDIT_TRANSACTIONS,
  SPLIT_TRANSACTION,
  STARBUCKS_VENDOR,
  SUGGESTION_SPLITS,
  SUGGESTION_TRANSACTIONS,
  SUGGESTION_VENDORS,
  UBER_EATS_PATTERN,
  UBER_EATS_VENDOR,
  VENDOR_FILL_TRANSACTIONS,
  OBJECT_PAGE_HEADER_TRANSACTIONS,
} from "../data/transaction.js";

const VENDOR = "com.financialplanner.Vendor";
const TRANSACTION = "com.financialplanner.Transaction";
const TRANSACTION_SPLIT = "com.financialplanner.TransactionSplit";
const MERCHANT_PATTERN = "com.financialplanner.MerchantPattern";
const SERVICE_PATH = "/service/transactionSvcs";
const SERVICE_NAME = "TransactionService";
const SERVICE_TRANSACTIONS = "TransactionService.Transactions";

/** A persisted split's values, in the shape the spec asserts on. */
export interface SplitRow {
  mySharePct: number | null;
  myShareAmount: number;
  splitDescription: string | null;
  isRecurring: boolean;
}

/** A transaction's categorization state, in the shape the spec asserts on. */
export interface TransactionStateRow {
  vendor_ID: string | null;
  purchaseType_ID: string | null;
  earningCategory_ID: string | null;
  categorizationStatus: string;
}

/** The calculated elements the Transactions projection derives for the UI. */
export interface TransactionProjectionRow {
  hasSplit: boolean;
  statusCriticality: number;
}

/** The splitTransaction action's OData response. */
export interface SplitActionResponse {
  status: number;
  data: {
    transactionId: string;
    mySharePct: number | null;
    myShareAmount: number;
    isRecurring: boolean;
  };
}

/** The bulkCategorize action's OData response. */
export interface BulkActionResponse {
  status: number;
  data: { updatedCount: number };
}

/** The correctCategorization action's OData response — a void action. */
export interface CorrectActionResponse {
  status: number;
}

/** The reCategorize action's OData response. */
export interface ReCategorizeActionResponse {
  status: number;
  data: { recategorizedCount: number; skippedCount: number };
}

type PostFn = <TResponse>(
  url: string,
  data: Record<string, unknown>,
) => Promise<TResponse>;

type PatchFn = <TResponse>(
  url: string,
  data: Record<string, unknown>,
) => Promise<TResponse>;

/** The transaction actions invoked over OData, as the UI invokes them. */
export interface TransactionActions {
  postSplitTransaction: (
    payload: Record<string, unknown>,
  ) => Promise<SplitActionResponse>;
  postBulkCategorize: (
    payload: Record<string, unknown>,
  ) => Promise<BulkActionResponse>;
  postCorrectCategorization: (
    payload: Record<string, unknown>,
  ) => Promise<CorrectActionResponse>;
  postReCategorize: (
    payload: Record<string, unknown>,
  ) => Promise<ReCategorizeActionResponse>;
}

/**
 * Binds the action callers to a cds.test POST handle so the spec exercises the
 * real facade bindings and the CDS action signatures, not the engine directly.
 */
export const buildTransactionActions = (post: PostFn): TransactionActions => {
  /** Invokes splitTransaction over OData. */
  const postSplitTransaction = async (
    payload: Record<string, unknown>,
  ): Promise<SplitActionResponse> => {
    return post<SplitActionResponse>(
      `${SERVICE_PATH}/splitTransaction`,
      payload,
    );
  };

  /** Invokes bulkCategorize over OData. */
  const postBulkCategorize = async (
    payload: Record<string, unknown>,
  ): Promise<BulkActionResponse> => {
    return post<BulkActionResponse>(`${SERVICE_PATH}/bulkCategorize`, payload);
  };

  /** Invokes correctCategorization over OData. */
  const postCorrectCategorization = async (
    payload: Record<string, unknown>,
  ): Promise<CorrectActionResponse> => {
    return post<CorrectActionResponse>(
      `${SERVICE_PATH}/correctCategorization`,
      payload,
    );
  };

  /** Invokes reCategorize over OData. */
  const postReCategorize = async (
    payload: Record<string, unknown>,
  ): Promise<ReCategorizeActionResponse> => {
    return post<ReCategorizeActionResponse>(
      `${SERVICE_PATH}/reCategorize`,
      payload,
    );
  };

  return {
    postSplitTransaction,
    postBulkCategorize,
    postCorrectCategorization,
    postReCategorize,
  };
};

/** The real transaction engine wired to the in-memory DB and categorization. */
export const buildTransactionService = (): TransactionService => {
  return new TransactionService(
    new TransactionDataService(),
    new CategorizationService(new CategorizationDataService()),
  );
};

/** The real split engine wired to the in-memory DB. */
export const buildTransactionSplitService = (): TransactionSplitService => {
  return new TransactionSplitService(new TransactionDataService());
};

/** Wraps an action payload as a request with a no-op error() collaborator. */
export const actionRequest = (data: unknown): { data: unknown; error: () => void } => {
  return { data, error: () => undefined };
};

/** Wraps a draft patch as a request keyed to its row, for the in-process engine. */
export const keyedRequest = (
  data: Record<string, unknown>,
  id: string,
): { data: Record<string, unknown>; params: unknown[] } => {
  return { data, params: [{ ID: id }] };
};

/** Wraps a READ's selected columns as a request, for the in-process engine. */
export const selectingRequest = (
  columns: Array<{ ref: string[] }>,
): { query: { SELECT: { columns: Array<{ ref: string[] }> } } } => {
  return { query: { SELECT: { columns } } };
};

/**
 * Seeds the bulk vendor, the split transaction, the bulk transactions, and the
 * re-split, inline-edit and correction rows that own their own state.
 */
export const seedTransactionProcessing = async (): Promise<void> => {
  await INSERT.into(VENDOR).entries(STARBUCKS_VENDOR);
  await INSERT.into(TRANSACTION).entries(SPLIT_TRANSACTION);
  await INSERT.into(TRANSACTION).entries(BULK_TRANSACTIONS);
  await INSERT.into(TRANSACTION).entries(RESPLIT_TRANSACTION);
  await INSERT.into(TRANSACTION).entries(INLINE_EDIT_TRANSACTION);
  await INSERT.into(TRANSACTION).entries(CORRECTION_TRANSACTION);
  await INSERT.into(TRANSACTION).entries(AUTO_EDIT_TRANSACTION);
  await INSERT.into(TRANSACTION).entries(BULK_KEEP_TRANSACTION);
  await INSERT.into(TRANSACTION_SPLIT).entries(EXISTING_SPLIT);
};

/**
 * Registers the production facade on the served CDS service. cds.test cannot
 * load the TypeScript service impl, so the facade is bound here to put the real
 * srv.on/srv.before wiring and the CDS action signatures under test.
 */
export const registerTransactionHandlers = async (): Promise<void> => {
  const srv = (await cds.connect.to(SERVICE_NAME)) as cds.ApplicationService;
  new TransactionFacade(
    srv,
    buildTransactionService(),
    buildTransactionSplitService(),
  ).registerHandlers();
};

/**
 * Drives the object page's draft edit → patch → activate flow for an existing
 * transaction, firing the real before-SAVE hook. Bound to the cds.test
 * POST/PATCH handles.
 */
export const buildDraftSaveFlow = (
  post: PostFn,
  patch: PatchFn,
): (transactionId: string, changes: Record<string, unknown>) => Promise<void> => {
  const draftUrl = (transactionId: string, active: boolean): string =>
    `${SERVICE_PATH}/Transactions(ID=${transactionId},IsActiveEntity=${active})`;

  return async (
    transactionId: string,
    changes: Record<string, unknown>,
  ): Promise<void> => {
    await post(
      `${draftUrl(transactionId, true)}/${SERVICE_NAME}.draftEdit`,
      { PreserveChanges: true },
    );
    await patch(draftUrl(transactionId, false), changes);
    await post(
      `${draftUrl(transactionId, false)}/${SERVICE_NAME}.draftActivate`,
      {},
    );
  };
};

/** Binds the draft-save flow to a vendor-only edit, the inline-edit UI's path. */
export const buildInlineEditFlow = (
  post: PostFn,
  patch: PatchFn,
): (transactionId: string, vendorId: string) => Promise<void> => {
  const saveDraft = buildDraftSaveFlow(post, patch);
  return (transactionId: string, vendorId: string): Promise<void> =>
    saveDraft(transactionId, { vendor_ID: vendorId });
};

/** Binds the draft-save flow to a save expected to be refused, returning its status and code. */
export const buildRefusedDraftSaveFlow = (
  post: PostFn,
  patch: PatchFn,
): (transactionId: string, changes: Record<string, unknown>) => Promise<SuggestionRejection> => {
  const saveDraft = buildDraftSaveFlow(post, patch);
  return async (
    transactionId: string,
    changes: Record<string, unknown>,
  ): Promise<SuggestionRejection> => {
    try {
      await saveDraft(transactionId, changes);
    } catch (error: unknown) {
      const response = (
        error as { response?: { status: number; data?: { error?: { code?: string } } } }
      ).response;
      return {
        status: response?.status ?? 0,
        code: response?.data?.error?.code ?? "",
      };
    }
    throw new Error("Expected the draft save to be refused");
  };
};

/** Reads the projection's calculated elements for a transaction. */
export const readTransactionProjection = async (
  transactionId: string,
): Promise<TransactionProjectionRow | null> => {
  const srv = await cds.connect.to(SERVICE_NAME);
  const row = (await srv.run(
    SELECT.one
      .from(SERVICE_TRANSACTIONS)
      .columns("hasSplit", "statusCriticality")
      .where({ ID: transactionId }),
  )) as { hasSplit: boolean | number; statusCriticality: number } | undefined;
  if (!row) {
    return null;
  }
  return {
    hasSplit: !!row.hasSplit,
    statusCriticality: Number(row.statusCriticality),
  };
};

/** Counts the split rows a transaction has — the at-most-one invariant. */
export const countSplitsForTransaction = async (
  transactionId: string,
): Promise<number> => {
  const rows = (await SELECT.from(TRANSACTION_SPLIT)
    .columns("ID")
    .where({ transaction_ID: transactionId })) as Array<{ ID: string }>;
  return rows.length;
};

/**
 * Seeds the re-categorize scenario: the Uber Eats vendor, a pattern added after
 * ingestion, three uncategorized rows, and two user-corrected rows.
 */
export const seedReCategorizeScenario = async (): Promise<void> => {
  await INSERT.into(VENDOR).entries(UBER_EATS_VENDOR);
  await INSERT.into(MERCHANT_PATTERN).entries(UBER_EATS_PATTERN);
  await INSERT.into(TRANSACTION).entries(RECAT_UNCATEGORIZED_TRANSACTIONS);
  await INSERT.into(TRANSACTION).entries(RECAT_CORRECTED_TRANSACTIONS);
};

/** Reads the single split for a transaction. */
export const readSplitByTransaction = async (
  transactionId: string,
): Promise<SplitRow | null> => {
  const row = (await SELECT.one
    .from(TRANSACTION_SPLIT)
    .columns("mySharePct", "myShareAmount", "splitDescription", "isRecurring")
    .where({ transaction_ID: transactionId })) as
    | {
      mySharePct: number | string | null;
      myShareAmount: number | string;
      splitDescription: string | null;
      isRecurring: boolean;
    }
    | undefined;
  if (!row) {
    return null;
  }
  return {
    mySharePct: row.mySharePct === null ? null : Number(row.mySharePct),
    myShareAmount: Number(row.myShareAmount),
    splitDescription: row.splitDescription,
    isRecurring: row.isRecurring,
  };
};

/** Reads a transaction's categorization state by id. */
export const readTransactionState = async (
  transactionId: string,
): Promise<TransactionStateRow | null> => {
  const row = (await SELECT.one
    .from(TRANSACTION)
    .columns("vendor_ID", "purchaseType_ID", "earningCategory_ID", "categorizationStatus")
    .where({ ID: transactionId })) as TransactionStateRow | undefined;
  return row ?? null;
};

/** Reads the pattern strings a vendor has learned. */
export const readLearnedPatternTextsForVendor = async (
  vendorId: string,
): Promise<string[]> => {
  const rows = (await SELECT.from(MERCHANT_PATTERN)
    .columns("pattern")
    .where({
      vendor_ID: vendorId,
      patternSource_ID: LEARNED_PATTERN_SOURCE.ID,
    })) as Array<{ pattern: string }>;
  return rows.map(row => row.pattern);
};

/** Counts the learned patterns a vendor has accumulated. */
export const countLearnedPatternsForVendor = async (
  vendorId: string,
): Promise<number> => {
  const rows = (await SELECT.from(MERCHANT_PATTERN)
    .columns("ID")
    .where({
      vendor_ID: vendorId,
      patternSource_ID: LEARNED_PATTERN_SOURCE.ID,
    })) as Array<{ ID: string }>;
  return rows.length;
};

/** The suggestRecurringSplit function's OData response. */
export interface SuggestionFunctionResponse {
  status: number;
  data: SplitSuggestion;
}

/** A rejected suggestRecurringSplit call — the HTTP status and the error code. */
export interface SuggestionRejection {
  status: number;
  code: string;
}

type GetFn = <TResponse>(url: string) => Promise<TResponse>;

/** Seeds the recurring-suggestion vendors, charges and prior splits. */
export const seedRecurringSuggestionScenario = async (): Promise<void> => {
  await INSERT.into(VENDOR).entries(SUGGESTION_VENDORS);
  await INSERT.into(TRANSACTION).entries(SUGGESTION_TRANSACTIONS);
  await INSERT.into(TRANSACTION_SPLIT).entries(SUGGESTION_SPLITS);
};

/**
 * Binds the suggestRecurringSplit function callers to a cds.test GET handle, so
 * the facade binding and the CDS function signature are under test.
 */
export const buildSuggestionQueries = (
  get: GetFn,
): {
  getSplitSuggestion: (transactionId: string) => Promise<SuggestionFunctionResponse>;
  getSplitSuggestionRejection: (transactionId: string) => Promise<SuggestionRejection>;
} => {
  const urlFor = (transactionId: string): string =>
    `${SERVICE_PATH}/suggestRecurringSplit(transactionId=${transactionId})`;

  /** Invokes suggestRecurringSplit over OData. */
  const getSplitSuggestion = async (
    transactionId: string,
  ): Promise<SuggestionFunctionResponse> => {
    return get<SuggestionFunctionResponse>(urlFor(transactionId));
  };

  /** Invokes suggestRecurringSplit expecting a refusal, returning its status and code. */
  const getSplitSuggestionRejection = async (
    transactionId: string,
  ): Promise<SuggestionRejection> => {
    try {
      await get(urlFor(transactionId));
    } catch (error: unknown) {
      const response = (
        error as { response?: { status: number; data?: { error?: { code?: string } } } }
      ).response;
      return {
        status: response?.status ?? 0,
        code: response?.data?.error?.code ?? "",
      };
    }
    throw new Error("Expected suggestRecurringSplit to refuse the call");
  };

  return { getSplitSuggestion, getSplitSuggestionRejection };
};

/**
 * Reads a row's categorization status label the way the ListReport column
 * does: the code plus its text association, expanded over OData.
 */
export const readCategorizationStatusLabel = async (
  get: GetFn,
  transactionId: string,
): Promise<string | undefined> => {
  const response = await get<{ data: { categorizationStatusType?: { name?: string } } }>(
    `${SERVICE_PATH}/Transactions(ID=${transactionId},IsActiveEntity=true)` +
    "?$select=categorizationStatus&$expand=categorizationStatusType($select=name)",
  );
  return response.data.categorizationStatusType?.name;
};

/** The vendor-category alternatives the object page lists, ranked by count. */
export interface CategoryAlternativeRow {
  purchaseTypeName: string | null;
  earningCategoryName: string | null;
  usageCount: number;
}

/** Seeds Cafe Nero's history and the rows its object-page pick fills. */
export const seedVendorFillScenario = async (): Promise<void> => {
  await INSERT.into(VENDOR).entries(CAFE_NERO_VENDOR);
  await INSERT.into(TRANSACTION).entries(VENDOR_FILL_TRANSACTIONS);
};

/** Reads the TransactionService $metadata document, where annotation labels resolve. */
export const readServiceMetadata = async (get: GetFn): Promise<string> => {
  const response = await get<{ data: string }>(`${SERVICE_PATH}/$metadata`);
  return response.data;
};

/** Reads the $metadata annotations block one target carries, empty when it has none. */
export const readAnnotationBlock = async (get: GetFn, target: string): Promise<string> => {
  const metadata = await readServiceMetadata(get);
  const start = metadata.indexOf(`<Annotations Target="${target}">`);
  if (start < 0) {
    return "";
  }
  return metadata.slice(start, metadata.indexOf("</Annotations>", start));
};

/** Reads a row's source label the way the object page does: the code's text association. */
export const readSourceLabel = async (
  get: GetFn,
  transactionId: string,
): Promise<string | undefined> => {
  const response = await get<{ data: { sourceType?: { name?: string } } }>(
    `${SERVICE_PATH}/Transactions(ID=${transactionId},IsActiveEntity=true)` +
    "?$select=source&$expand=sourceType($select=name)",
  );
  return response.data.sourceType?.name;
};

/** Seeds the refund and the charge the object-page header colours apart. */
export const seedObjectPageHeaderScenario = async (): Promise<void> => {
  await INSERT.into(TRANSACTION).entries(OBJECT_PAGE_HEADER_TRANSACTIONS);
};

/**
 * Binds object-page draft steps to the cds.test handles: open a draft, patch it,
 * and read selected fields of the active row or of the draft.
 */
export const buildObjectPageDraft = (
  get: GetFn,
  post: PostFn,
  patch: PatchFn,
): {
  openDraft: (transactionId: string) => Promise<void>;
  patchDraft: (transactionId: string, changes: Record<string, unknown>) => Promise<void>;
  readFields: (
    transactionId: string,
    fields: string[],
    active: boolean,
  ) => Promise<Record<string, unknown>>;
} => {
  const rowUrl = (transactionId: string, active: boolean): string =>
    `${SERVICE_PATH}/Transactions(ID=${transactionId},IsActiveEntity=${active})`;
  return {
    openDraft: async (transactionId: string): Promise<void> => {
      await post(`${rowUrl(transactionId, true)}/${SERVICE_NAME}.draftEdit`, {
        PreserveChanges: true,
      });
    },
    patchDraft: async (
      transactionId: string,
      changes: Record<string, unknown>,
    ): Promise<void> => {
      await patch(rowUrl(transactionId, false), changes);
    },
    readFields: async (
      transactionId: string,
      fields: string[],
      active: boolean,
    ): Promise<Record<string, unknown>> => {
      const response = await get<{ data: Record<string, unknown> }>(
        `${rowUrl(transactionId, active)}?$select=${fields.join(",")}`,
      );
      return response.data;
    },
  };
};

/** Reads the object page's category alternatives for a transaction, ranked by count. */
export const readCategoryAlternatives = async (
  get: GetFn,
  transactionId: string,
): Promise<CategoryAlternativeRow[]> => {
  const response = await get<{
    data: {
      value: Array<{
        usageCount: number | string;
        purchaseType?: { name?: string } | null;
        earningCategory?: { name?: string } | null;
      }>;
    };
  }>(
    `${SERVICE_PATH}/Transactions(ID=${transactionId},IsActiveEntity=true)/categoryAlternatives` +
    "?$orderby=usageCount desc&$expand=purchaseType($select=name),earningCategory($select=name)",
  );
  return response.data.value.map(row => ({
    purchaseTypeName: row.purchaseType?.name ?? null,
    earningCategoryName: row.earningCategory?.name ?? null,
    usageCount: Number(row.usageCount),
  }));
};

/** Seeds the charges whose 50% splits the object page re-edits. */
export const seedSplitShareEditScenario = async (): Promise<void> => {
  await INSERT.into(TRANSACTION).entries(SHARE_EDIT_TRANSACTIONS);
  await INSERT.into(TRANSACTION_SPLIT).entries(SHARE_EDIT_SPLITS);
};

/** A refused draft patch's status and error code. */
export interface DraftPatchRejection {
  status: number;
  code: string;
}

/**
 * Binds the object page's split-section edits to the cds.test handles: patch the
 * draft's split through its parent, read the draft split back, and activate.
 */
export const buildSplitShareEdit = (
  get: GetFn,
  post: PostFn,
  patch: PatchFn,
): {
  patchSplit: (transactionId: string, changes: Record<string, unknown>) => Promise<void>;
  patchSplitExpectingRefusal: (
    transactionId: string,
    changes: Record<string, unknown>,
  ) => Promise<DraftPatchRejection>;
  readDraftSplit: (transactionId: string) => Promise<SplitRow>;
  activate: (transactionId: string) => Promise<void>;
} => {
  const rowUrl = (transactionId: string, active: boolean): string =>
    `${SERVICE_PATH}/Transactions(ID=${transactionId},IsActiveEntity=${active})`;
  const patchSplit = async (
    transactionId: string,
    changes: Record<string, unknown>,
  ): Promise<void> => {
    await patch(`${rowUrl(transactionId, false)}/split`, changes);
  };
  return {
    patchSplit,
    patchSplitExpectingRefusal: async (
      transactionId: string,
      changes: Record<string, unknown>,
    ): Promise<DraftPatchRejection> => {
      try {
        await patchSplit(transactionId, changes);
      } catch (error: unknown) {
        const response = (
          error as { response?: { status: number; data?: { error?: { code?: string } } } }
        ).response;
        return {
          status: response?.status ?? 0,
          code: response?.data?.error?.code ?? "",
        };
      }
      throw new Error("Expected the split patch to be refused");
    },
    readDraftSplit: async (transactionId: string): Promise<SplitRow> => {
      const response = await get<{
        data: {
          mySharePct: number | string | null;
          myShareAmount: number | string;
          splitDescription: string | null;
          isRecurring: boolean;
        };
      }>(
        `${rowUrl(transactionId, false)}/split` +
        "?$select=mySharePct,myShareAmount,splitDescription,isRecurring",
      );
      const row = response.data;
      return {
        mySharePct: row.mySharePct === null ? null : Number(row.mySharePct),
        myShareAmount: Number(row.myShareAmount),
        splitDescription: row.splitDescription,
        isRecurring: row.isRecurring,
      };
    },
    activate: async (transactionId: string): Promise<void> => {
      await post(`${rowUrl(transactionId, false)}/${SERVICE_NAME}.draftActivate`, {});
    },
  };
};
