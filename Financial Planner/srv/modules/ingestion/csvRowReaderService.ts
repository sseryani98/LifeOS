import { CSV } from "./constants.js";
import { CsvFieldParser } from "./csvFieldParser.js";
import type {
  AttributionCard,
  CsvFormatConfigRecord,
  CsvRowDecodeResult,
} from "./types.js";

/**
 * Config-driven decoder for a single CSV file's rows: resolves cells by header
 * name or numeric index, computes the signed amount (single column + sign or
 * split debit/credit), and attributes each row to a cardholder. It touches only
 * the config, cells, and attribution cards.
 */
export class CsvRowReaderService {
  private readonly config: CsvFormatConfigRecord;
  private readonly headerMap: Map<string, number>;
  private readonly attribution: Map<string, string>;
  private readonly selectedId: string;

  /**
   * Builds the decoder for one file: precomputes the header name→index map and
   * the cardholder-name→card-id attribution map so per-row decoding is cheap.
   * @param config Resolved issuer format config.
   * @param rows All parsed rows of the file — only the header row is read here.
   * @param cards Cards eligible for cardmember attribution.
   * @param selectedId The selected (primary) card id, the attribution fallback.
   */
  constructor(
    config: CsvFormatConfigRecord,
    rows: string[][],
    cards: AttributionCard[],
    selectedId: string,
  ) {
    this.config = config;
    this.selectedId = selectedId;
    this.headerMap = this._buildHeaderMap(rows);
    this.attribution = this._buildAttributionMap(cards);
  }

  /**
   * Decodes one row's cells into scalar fields, or reports the field that failed
   * to parse. A date or amount parse error returns `ok:false` with the raw value
   * so the orchestrator can route the row to the Excluded tab.
   * @param cells Raw cells of the row.
   * @returns The parsed fields on success, or the failed field and raw value.
   */
  decodeRow(cells: string[]): CsvRowDecodeResult {
    const dateRaw = this._readColumn(cells, this.config.dateColumn);
    const postedAt = CsvFieldParser.parseDate(dateRaw, this.config.dateFormat);
    if (postedAt === null) {
      return { ok: false, field: "date", rawValue: dateRaw };
    }
    const amount = this._computeAmount(cells);
    if (amount === null) {
      const raw = this._readColumn(cells, this.config.amountColumn ?? "");
      return { ok: false, field: "amount", rawValue: raw };
    }
    const attributed = this._resolveAttribution(cells);
    const rawDescription = this._readColumn(
      cells,
      this.config.descriptionColumn,
    ).trim();
    return {
      ok: true,
      fields: {
        postedAt,
        amount,
        rawDescription,
        cardInstance_ID: attributed.cardInstance_ID,
        cardholderName: attributed.cardholderName,
      },
    };
  }

  /**
   * True when every cell in a row is blank — a preamble/spacer line to skip.
   * @param cells Raw cells of the row.
   * @returns True when the row carries no data.
   */
  isEmptyRow(cells: string[]): boolean {
    return cells.every(cell => cell.trim() === "");
  }

  /**
   * True when a status column is configured and the row's status is not the
   * posted value — such rows are discarded, not reviewed.
   * @param cells Raw cells of the row.
   * @returns True when the row should be discarded by status filtering.
   */
  isStatusFiltered(cells: string[]): boolean {
    if (!this.config.statusColumn || !this.config.statusPostedValue) {
      return false;
    }
    const status = this._readColumn(cells, this.config.statusColumn).trim();
    return status !== this.config.statusPostedValue;
  }

  /**
   * Builds the header name → column-index map when the config references columns
   * by name; the header is the last skipped row (index headerRowsSkip - 1).
   * @param rows All parsed rows of the file.
   * @returns A name → index map, empty for index-only (headerless) configs.
   */
  private _buildHeaderMap(rows: string[][]): Map<string, number> {
    const map = new Map<string, number>();
    if (!this._hasNamedColumns() || this.config.headerRowsSkip < 1) {
      return map;
    }
    const header = rows[this.config.headerRowsSkip - 1] ?? [];
    header.forEach((cell, index) => map.set(cell.trim(), index));
    return map;
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
   * @param cells Raw cells of the row.
   * @returns The signed amount, or null when no valid amount is present.
   */
  private _computeAmount(cells: string[]): number | null {
    const { config } = this;
    if (config.debitColumn && config.creditColumn) {
      const debit = CsvFieldParser.parseAmount(
        this._readColumn(cells, config.debitColumn),
      );
      if (debit !== null) {
        return -Math.abs(debit);
      }
      const credit = CsvFieldParser.parseAmount(
        this._readColumn(cells, config.creditColumn),
      );
      return credit === null ? null : Math.abs(credit);
    }
    const value = CsvFieldParser.parseAmount(
      this._readColumn(cells, config.amountColumn ?? ""),
    );
    if (value === null) {
      return null;
    }
    return config.amountSign === CSV.SIGN.POSITIVE_IS_DEBIT ? -value : value;
  }

  /**
   * True when any configured column is referenced by name (needs a header row)
   * rather than a numeric index.
   * @returns True when the config uses header names.
   */
  private _hasNamedColumns(): boolean {
    const columns = [
      this.config.dateColumn,
      this.config.amountColumn,
      this.config.debitColumn,
      this.config.creditColumn,
      this.config.descriptionColumn,
      this.config.statusColumn,
      this.config.cardmemberColumn,
    ];
    return columns.some(column => !!column && !/^\d+$/.test(column));
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
   * @returns The cell text, or "" when the column is absent.
   */
  private _readColumn(cells: string[], columnId: string): string {
    if (columnId === "") {
      return "";
    }
    const index = /^\d+$/.test(columnId)
      ? Number(columnId)
      : this.headerMap.get(columnId);
    if (index === undefined) {
      return "";
    }
    return cells[index] ?? "";
  }

  /**
   * Resolves the card a row attributes to via its cardmember cell, falling back
   * to the selected card when unset or unmatched.
   * @param cells Raw cells of the row.
   * @returns The resolved card id and the raw cardholder name, if any.
   */
  private _resolveAttribution(
    cells: string[],
  ): { cardInstance_ID: string; cardholderName: string | null } {
    const { config } = this;
    if (!config.cardmemberColumn) {
      return { cardInstance_ID: this.selectedId, cardholderName: null };
    }
    const raw = this._readColumn(cells, config.cardmemberColumn).trim();
    if (raw === "") {
      return { cardInstance_ID: this.selectedId, cardholderName: null };
    }
    const matched = this.attribution.get(this._normalizeName(raw));
    return { cardInstance_ID: matched ?? this.selectedId, cardholderName: raw };
  }
}
