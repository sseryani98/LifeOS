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
  CsvClassifiedRow,
  CsvFileSession,
  CsvParseRequest,
  CsvParseResult,
  CsvReclassifyRequest,
  CsvRowDecodeResult,
  CsvValidationError,
  ParsedCsvFields,
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
      this._raiseErrors(req, errors);
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
    const session = await this._openFile(request);
    if (!session) {
      return {
        configResolved: false,
        configName: null,
        newRows: [],
        potentialDuplicates: [],
        excludedRows: [],
        skippedCount: 0,
      };
    }
    const buckets = await this._processRows(session);
    return {
      configResolved: true,
      configName: session.configName,
      ...buckets,
    };
  }

  /**
   * Action entry point — re-decodes one Excluded row with the user's correction
   * in the cell that failed, then dedups and categorizes it like any parsed row.
   * The client cannot do this itself: only the config knows the columns and sign.
   * @param req Request carrying the parse inputs plus rowNumber and correctedValue.
   * @returns The classified row, or undefined when validation or the re-decode fails.
   */
  async reclassify(req: cds.Request): Promise<CsvClassifiedRow | undefined> {
    const request = CsvImportMapper.toReclassifyRequest(req.data);
    const errors = CsvImportValidator.validateReclassifyRequest(request);
    if (errors.length > 0) {
      this._raiseErrors(req, errors);
      return undefined;
    }
    const session = await this._openFile(request);
    const decoded = session ? this._decodeCorrectedRow(session, request) : null;
    if (!session || !decoded) {
      this._raiseErrors(req, [{ field: "rowNumber", messageKey: "csv.rowNumberInvalid" }]);
      return undefined;
    }
    if (!decoded.ok) {
      const messageKey = this._resolveParseErrorKey(decoded.field);
      req.error({
        code: messageKey,
        message: MessagingUtility.getText(messageKey, [decoded.rawValue]),
        target: "correctedValue",
        status: 400,
      });
      return undefined;
    }
    return this._classifyRow(request.rowNumber as number, decoded.fields, session.categorization);
  }

  /**
   * Dedups and categorizes one decoded row into a review row.
   * @param rowNumber 1-based source line number.
   * @param fields Scalar fields decoded from the row.
   * @param categorization Loaded categorization context for suggestions.
   * @returns The classified row, carrying its dedup outcome.
   */
  private async _classifyRow(
    rowNumber: number,
    fields: ParsedCsvFields,
    categorization: CategorizationContext,
  ): Promise<CsvClassifiedRow> {
    const dedup = await this.dedupService.evaluate(
      CsvImportMapper.toCandidate(fields),
    );
    const suggestion = categorization.categorize(
      fields.rawDescription,
      fields.amount,
    );
    return CsvImportMapper.toClassifiedRow(rowNumber, fields, dedup, suggestion);
  }

  /**
   * Decodes the requested row, retrying once with the correction in the failed cell.
   * A row that already parses is returned as it stands — there is no failed cell to fix.
   * @param session The opened file.
   * @param request Validated reclassify request.
   * @returns The decode result, or null when the row number is past the file's end.
   */
  private _decodeCorrectedRow(
    session: CsvFileSession,
    request: CsvReclassifyRequest,
  ): CsvRowDecodeResult | null {
    const cells = session.rows[(request.rowNumber as number) - 1];
    if (!cells) {
      return null;
    }
    const firstPass = session.reader.decodeRow(cells);
    if (firstPass.ok) {
      return firstPass;
    }
    const corrected = session.reader.correctFailedCell(
      cells,
      firstPass.field,
      request.correctedValue as string,
    );
    return session.reader.decodeRow(corrected);
  }

  /**
   * Resolves the card's format config and builds everything needed to decode the file.
   * @param request Validated request carrying the card and file content.
   * @returns The open file, or null when no format config resolves for the card.
   */
  private async _openFile(request: CsvParseRequest): Promise<CsvFileSession | null> {
    const cardInstanceId = request.cardInstance_ID as string;
    const config = await this.dataService.getFormatConfigForCard(cardInstanceId);
    if (!config) {
      this.logger.warn("STATE_CHANGE", "No CSV format config for card", {
        cardInstanceId,
      });
      return null;
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
    return {
      rows,
      reader,
      categorization,
      configName: config.configName,
      headerRowsSkip: config.headerRowsSkip,
    };
  }

  /**
   * Processes every data row (after the skipped header/preamble) into the new,
   * potential-duplicate, or excluded buckets, discarding status-filtered rows.
   * @param session The opened file: rows, reader, and categorization context.
   * @returns The accumulated row buckets and skipped count.
   */
  private async _processRows(session: CsvFileSession): Promise<RowBuckets> {
    const { rows, reader, categorization } = session;
    const buckets: RowBuckets = {
      newRows: [],
      potentialDuplicates: [],
      excludedRows: [],
      skippedCount: 0,
    };
    for (let index = session.headerRowsSkip; index < rows.length; index++) {
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
    const row = await this._classifyRow(rowNumber, decoded.fields, categorization);
    const bucket =
      row.dedupOutcome === "potential_duplicate"
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
    const messageKey = this._resolveParseErrorKey(field);
    buckets.excludedRows.push(
      CsvImportMapper.toExcludedRow(rowNumber, cells, field, messageKey, rawValue),
    );
  }

  /**
   * Raises each validation error on the request as a 400.
   * @param req Request to raise the errors on.
   * @param errors Validation errors to raise.
   */
  private _raiseErrors(req: cds.Request, errors: CsvValidationError[]): void {
    for (const error of errors) {
      req.error({
        code: error.messageKey,
        message: MessagingUtility.getText(error.messageKey),
        target: error.field,
        status: 400,
      });
    }
  }

  /**
   * Maps the decoder's failed field to the user-facing parse-error message key.
   * @param field Field whose parse failed.
   * @returns The i18n key for that field's parse error.
   */
  private _resolveParseErrorKey(field: "date" | "amount"): string {
    return field === "date"
      ? "ingestion.csv.parseErrorDate"
      : "ingestion.csv.parseErrorAmount";
  }
}
