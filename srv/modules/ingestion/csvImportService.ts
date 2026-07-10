import Papa from "papaparse";
import cds from "@sap/cds";

import { BaseService } from "../shared/baseService.js";
import { MessagingUtility } from "../shared/messagingUtility.js";
import type { CategorizationService } from "../categorization/categorizationService.js";

import { CSV } from "./constants.js";
import { CsvFieldParser } from "./csvFieldParser.js";
import { CsvImportMapper } from "./csvImportMapper.js";
import { CsvImportValidator } from "./csvImportValidator.js";
import type { CsvImportDataService } from "./csvImportDataService.js";
import type { DeduplicationService } from "./deduplicationService.js";
import type {
  AttributionCard,
  CsvFormatConfigRecord,
  CsvParseRequest,
  CsvParseResult,
  ParseContext,
  ParsedCsvFields,
  RowBuckets,
} from "./types.js";

/**
 * CSV transaction import engine. Resolves the issuer format config from the
 * selected card, parses the file per that config (single or split amounts,
 * name or index columns), attributes supplementary-card rows, and runs each
 * through dedup — classifying rows as new, potential duplicate, or excluded.
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
    const headerMap = this._buildHeaderMap(rows, config);
    const parseContext: ParseContext = {
      config,
      headerMap,
      attribution: this._buildAttributionMap(attributionCards),
      selectedId: cardInstanceId,
      categorization,
    };
    const buckets = await this._processRows(rows, parseContext);
    return {
      configResolved: true,
      configName: config.configName,
      ...buckets,
    };
  }

  /**
   * Resolves the card a row attributes to via its cardmember cell, falling back
   * to the selected card when unset or unmatched.
   * @param context Per-file parse context (config, header map, attribution, selected card).
   * @param cells Raw cells of the row.
   * @returns The resolved card id and the raw cardholder name, if any.
   */
  private _resolveAttribution(
    context: ParseContext,
    cells: string[],
  ): { cardInstance_ID: string; cardholderName: string | null } {
    const { config, headerMap, attribution, selectedId } = context;
    if (!config.cardmemberColumn) {
      return { cardInstance_ID: selectedId, cardholderName: null };
    }
    const raw = this._readColumn(cells, config.cardmemberColumn, headerMap).trim();
    if (raw === "") {
      return { cardInstance_ID: selectedId, cardholderName: null };
    }
    const matched = attribution.get(this._normalizeName(raw));
    return { cardInstance_ID: matched ?? selectedId, cardholderName: raw };
  }

  /**
   * Builds the header name → column-index map when the config references columns
   * by name; the header is the last skipped row (index headerRowsSkip - 1).
   * @param rows All parsed rows of the file.
   * @param config Active format config.
   * @returns A name → index map, empty for index-only (headerless) configs.
   */
  private _buildHeaderMap(
    rows: string[][],
    config: CsvFormatConfigRecord,
  ): Map<string, number> {
    const map = new Map<string, number>();
    if (!this._hasNamedColumns(config) || config.headerRowsSkip < 1) {
      return map;
    }
    const header = rows[config.headerRowsSkip - 1] ?? [];
    header.forEach((cell, index) => map.set(cell.trim(), index));
    return map;
  }

  /**
   * Processes every data row (after the skipped header/preamble) into the new,
   * potential-duplicate, or excluded buckets, discarding status-filtered rows.
   * @param rows All parsed rows of the file.
   * @param context Per-file parse context (config, maps, categorization).
   * @returns The accumulated row buckets and skipped count.
   */
  private async _processRows(
    rows: string[][],
    context: ParseContext,
  ): Promise<RowBuckets> {
    const { config, headerMap } = context;
    const buckets: RowBuckets = {
      newRows: [],
      potentialDuplicates: [],
      excludedRows: [],
      skippedCount: 0,
    };
    for (let index = config.headerRowsSkip; index < rows.length; index++) {
      const cells = rows[index];
      if (this._isEmptyRow(cells)) {
        continue;
      }
      if (this._isStatusFiltered(config, cells, headerMap)) {
        buckets.skippedCount++;
        continue;
      }
      await this._processRow(context, cells, index + 1, buckets);
    }
    return buckets;
  }

  /**
   * Parses one row and routes it to the excluded bucket (parse error) or, after
   * deduplication, to the new / potential-duplicate bucket.
   * @param context Per-file parse context.
   * @param cells Raw cells of the row.
   * @param rowNumber 1-based source line number.
   * @param buckets Buckets to append the classified row to.
   */
  private async _processRow(
    context: ParseContext,
    cells: string[],
    rowNumber: number,
    buckets: RowBuckets,
  ): Promise<void> {
    const fields = this._parseFields(context, cells, rowNumber, buckets);
    if (fields === null) {
      return;
    }
    const dedup = await this.dedupService.evaluate(
      CsvImportMapper.toCandidate(fields),
    );
    const suggestion = context.categorization.categorize(
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
   * Reads and parses a row's date, amount, attribution, and description; on a
   * date or amount parse error it excludes the row and returns null.
   * @param context Per-file parse context.
   * @param cells Raw cells of the row.
   * @param rowNumber 1-based source line number.
   * @param buckets Buckets that receive the excluded row on parse failure.
   * @returns The parsed fields, or null when the row was excluded.
   */
  private _parseFields(
    context: ParseContext,
    cells: string[],
    rowNumber: number,
    buckets: RowBuckets,
  ): ParsedCsvFields | null {
    const { config, headerMap } = context;
    const dateRaw = this._readColumn(cells, config.dateColumn, headerMap);
    const postedAt = CsvFieldParser.parseDate(dateRaw, config.dateFormat);
    if (postedAt === null) {
      this._addExcludedRow(buckets, rowNumber, cells, "date", dateRaw);
      return null;
    }
    const amount = this._computeAmount(config, cells, headerMap);
    if (amount === null) {
      const raw = this._readColumn(cells, config.amountColumn ?? "", headerMap);
      this._addExcludedRow(buckets, rowNumber, cells, "amount", raw);
      return null;
    }
    const attributed = this._resolveAttribution(context, cells);
    const rawDescription = this._readColumn(
      cells,
      config.descriptionColumn,
      headerMap,
    ).trim();
    return {
      postedAt,
      amount,
      rawDescription,
      cardInstance_ID: attributed.cardInstance_ID,
      cardholderName: attributed.cardholderName,
    };
  }

  /**
   * Appends a parse-failed row to the excluded bucket.
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

  /**
   * Builds the cardholder-name → card-id map for attribution, keyed on the
   * normalized name so "SANDRO SERYANI" matches a "Sandro Seryani" cardholder.
   * @param cards Cards eligible for attribution.
   * @returns Normalized name → card id map.
   */
  private _buildAttributionMap(cards: AttributionCard[]): Map<string, string> {
    const map = new Map<string, string>();
    for (const card of cards) {
      if (card.cardholderName) {
        map.set(this._normalizeName(card.cardholderName), card.ID);
      }
    }
    return map;
  }

  /**
   * Computes the signed amount: split debit/credit (debit → negative, credit →
   * positive) or a single column normalized by amount sign.
   * @param config Active format config.
   * @param cells Raw cells of the row.
   * @param headerMap Header name → index map.
   * @returns The signed amount, or null when no valid amount is present.
   */
  private _computeAmount(
    config: CsvFormatConfigRecord,
    cells: string[],
    headerMap: Map<string, number>,
  ): number | null {
    if (config.debitColumn && config.creditColumn) {
      const debit = CsvFieldParser.parseAmount(
        this._readColumn(cells, config.debitColumn, headerMap),
      );
      if (debit !== null) {
        return -Math.abs(debit);
      }
      const credit = CsvFieldParser.parseAmount(
        this._readColumn(cells, config.creditColumn, headerMap),
      );
      return credit === null ? null : Math.abs(credit);
    }
    const value = CsvFieldParser.parseAmount(
      this._readColumn(cells, config.amountColumn ?? "", headerMap),
    );
    if (value === null) {
      return null;
    }
    return config.amountSign === CSV.SIGN.POSITIVE_IS_DEBIT ? -value : value;
  }

  /**
   * True when every cell in a row is blank — a preamble/spacer line to skip.
   * @param cells Raw cells of the row.
   * @returns True when the row carries no data.
   */
  private _isEmptyRow(cells: string[]): boolean {
    return cells.every(cell => cell.trim() === "");
  }

  /**
   * True when a status column is configured and the row's status is not the
   * posted value — such rows are discarded, not reviewed.
   * @param config Active format config.
   * @param cells Raw cells of the row.
   * @param headerMap Header name → index map.
   * @returns True when the row should be discarded by status filtering.
   */
  private _isStatusFiltered(
    config: CsvFormatConfigRecord,
    cells: string[],
    headerMap: Map<string, number>,
  ): boolean {
    if (!config.statusColumn || !config.statusPostedValue) {
      return false;
    }
    const status = this._readColumn(cells, config.statusColumn, headerMap).trim();
    return status !== config.statusPostedValue;
  }

  /**
   * Normalizes a cardholder name for case- and whitespace-insensitive matching.
   * @param name Raw cardholder name.
   * @returns The upper-cased, trimmed name.
   */
  private _normalizeName(name: string): string {
    return name.trim().toUpperCase();
  }

  /**
   * Reads a cell by column id — a numeric index (headerless) or a header name.
   * @param cells Raw cells of the row.
   * @param columnId Numeric index or header name from the config.
   * @param headerMap Header name → index map.
   * @returns The cell text, or "" when the column is absent.
   */
  private _readColumn(
    cells: string[],
    columnId: string,
    headerMap: Map<string, number>,
  ): string {
    if (columnId === "") {
      return "";
    }
    const index = /^\d+$/.test(columnId)
      ? Number(columnId)
      : headerMap.get(columnId);
    if (index === undefined) {
      return "";
    }
    return cells[index] ?? "";
  }

  /**
   * True when any configured column is referenced by name (needs a header row)
   * rather than a numeric index.
   * @param config Active format config.
   * @returns True when the config uses header names.
   */
  private _hasNamedColumns(config: CsvFormatConfigRecord): boolean {
    const columns = [
      config.dateColumn,
      config.amountColumn,
      config.debitColumn,
      config.creditColumn,
      config.descriptionColumn,
      config.statusColumn,
      config.cardmemberColumn,
    ];
    return columns.some(column => !!column && !/^\d+$/.test(column));
  }
}
