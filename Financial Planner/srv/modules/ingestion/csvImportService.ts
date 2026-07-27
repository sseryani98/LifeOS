import Papa from "papaparse";
import cds from "@sap/cds";

import { BaseService } from "../shared/baseService.js";
import { MessagingUtility } from "../shared/messagingUtility.js";
import type { CategorizationContext } from "../categorization/categorizationContextService.js";
import type { CategorizationService } from "../categorization/categorizationService.js";

import { CsvImportMapper } from "./csvImportMapper.js";
import { CsvImportValidator } from "./csvImportValidator.js";
import { CsvRowReaderService } from "./csvRowReaderService.js";
import type { CsvImportDataService } from "./csvImportDataService.js";
import type { DeduplicationService } from "./deduplicationService.js";
import type {
  CsvParseRequest,
  CsvParseResult,
  RowBuckets,
} from "./types.js";

/**
 * CSV transaction import engine. Resolves the issuer format config from the
 * selected card, builds a per-file row reader for that config, and runs each
 * decoded row through dedup + categorization — classifying rows as new,
 * potential duplicate, or excluded. Cell decoding lives in CsvRowReaderService;
 * this class is pure orchestration.
 */
export class CsvImportService extends BaseService {
  private readonly categorizationService: CategorizationService;
  private readonly dataService: CsvImportDataService;
  private readonly dedupService: DeduplicationService;

  /**
   * Creates the engine with injected data, dedup, and categorization collaborators.
   * @param dataService Data-access layer for config resolution and attribution cards.
   * @param dedupService Engine that classifies rows as new or potential duplicate.
   * @param categorizationService Engine that pre-fills vendor + category suggestions.
   */
  constructor(
    dataService: CsvImportDataService,
    dedupService: DeduplicationService,
    categorizationService: CategorizationService,
  ) {
    super("integration.csv");
    this.dataService = dataService;
    this.dedupService = dedupService;
    this.categorizationService = categorizationService;
  }

  /**
   * Action entry point — validates the request then parses the file.
   * @param req Request carrying cardInstance_ID, fileName, and fileContent.
   * @returns The parse result, or undefined when validation fails.
   */
  async parse(req: cds.Request): Promise<CsvParseResult | undefined> {
    const request: CsvParseRequest = {
      cardInstance_ID: (req.data?.cardInstance_ID ?? null) as string | null,
      fileName: (req.data?.fileName ?? null) as string | null,
      fileContent: (req.data?.fileContent ?? null) as string | null,
    };
    const errors = CsvImportValidator.validateParseRequest(request);
    if (errors.length > 0) {
      for (const error of errors) {
        req.error({
          code: error.messageKey,
          message: MessagingUtility.getText(error.messageKey),
          target: error.field,
          status: 400,
        });
      }
      return undefined;
    }
    return this.parseFile(request);
  }

  /**
   * Parses and classifies a CSV file for the selected card.
   * @param request Validated parse request (card + file).
   * @returns Classified rows plus counts; `configResolved:false` blocks the import.
   */
  async parseFile(request: CsvParseRequest): Promise<CsvParseResult> {
    const cardInstanceId = request.cardInstance_ID as string;
    const config = await this.dataService.getFormatConfigForCard(cardInstanceId);
    if (!config) {
      this.logger.warn("STATE_CHANGE", "No CSV format config for card", {
        cardInstanceId,
      });
      return {
        configResolved: false,
        configName: null,
        newRows: [],
        potentialDuplicates: [],
        excludedRows: [],
        skippedCount: 0,
      };
    }
    const attributionCards = await this.dataService.getAttributionCards(
      cardInstanceId,
    );
    const categorization = await this.categorizationService.buildContext();
    const rows = Papa.parse<string[]>(request.fileContent as string, {
      header: false,
      skipEmptyLines: false,
    }).data;
    const reader = new CsvRowReaderService(
      config,
      rows,
      attributionCards,
      cardInstanceId,
    );
    const buckets = await this._processRows(
      rows,
      config.headerRowsSkip,
      reader,
      categorization,
    );
    return {
      configResolved: true,
      configName: config.configName,
      ...buckets,
    };
  }

  /**
   * Processes every data row (after the skipped header/preamble) into the new,
   * potential-duplicate, or excluded buckets, discarding status-filtered rows.
   * @param rows All parsed rows of the file.
   * @param headerRowsSkip Number of leading rows to skip before the data begins.
   * @param reader Decoder for the resolved format config.
   * @param categorization Loaded categorization context for suggestions.
   * @returns The accumulated row buckets and skipped count.
   */
  private async _processRows(
    rows: string[][],
    headerRowsSkip: number,
    reader: CsvRowReaderService,
    categorization: CategorizationContext,
  ): Promise<RowBuckets> {
    const buckets: RowBuckets = {
      newRows: [],
      potentialDuplicates: [],
      excludedRows: [],
      skippedCount: 0,
    };
    for (let index = headerRowsSkip; index < rows.length; index++) {
      const cells = rows[index];
      if (reader.isEmptyRow(cells)) {
        continue;
      }
      if (reader.isStatusFiltered(cells)) {
        buckets.skippedCount++;
        continue;
      }
      await this._processRow(reader, categorization, cells, index + 1, buckets);
    }
    return buckets;
  }

  /**
   * Decodes one row and routes it to the excluded bucket (parse error) or, after
   * deduplication, to the new / potential-duplicate bucket.
   * @param reader Decoder for the resolved format config.
   * @param categorization Loaded categorization context for suggestions.
   * @param cells Raw cells of the row.
   * @param rowNumber 1-based source line number.
   * @param buckets Buckets to append the classified row to.
   */
  private async _processRow(
    reader: CsvRowReaderService,
    categorization: CategorizationContext,
    cells: string[],
    rowNumber: number,
    buckets: RowBuckets,
  ): Promise<void> {
    const decoded = reader.decodeRow(cells);
    if (!decoded.ok) {
      this._addExcludedRow(
        buckets,
        rowNumber,
        cells,
        decoded.field,
        decoded.rawValue,
      );
      return;
    }
    const { fields } = decoded;
    const dedup = await this.dedupService.evaluate(
      CsvImportMapper.toCandidate(fields),
    );
    const suggestion = categorization.categorize(
      fields.rawDescription,
      fields.amount,
    );
    const row = CsvImportMapper.toClassifiedRow(
      rowNumber,
      fields,
      dedup,
      suggestion,
    );
    const bucket =
      dedup.outcome === "potential_duplicate"
        ? buckets.potentialDuplicates
        : buckets.newRows;
    bucket.push(row);
  }

  /**
   * Appends a parse-failed row to the excluded bucket, translating the decoder's
   * semantic field into the user-facing i18n message key.
   * @param buckets Buckets to append to.
   * @param rowNumber 1-based source line number.
   * @param cells Raw cells of the row.
   * @param field Field whose parse failed.
   * @param rawValue The unparseable raw cell value.
   */
  private _addExcludedRow(
    buckets: RowBuckets,
    rowNumber: number,
    cells: string[],
    field: "date" | "amount",
    rawValue: string,
  ): void {
    const messageKey =
      field === "date"
        ? "ingestion.csv.parseErrorDate"
        : "ingestion.csv.parseErrorAmount";
    buckets.excludedRows.push(
      CsvImportMapper.toExcludedRow(rowNumber, cells, field, messageKey, rawValue),
    );
  }
}
