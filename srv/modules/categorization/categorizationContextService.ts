import { CategorizationMapper } from "./categorizationMapper.js";
import { CONFIDENCE_RANK, MATCH_TYPE, TIER_RANK } from "./constants.js";
import type {
  CategorizationResult,
  CategoryCombo,
  MerchantPatternRecord,
} from "./types.js";

/**
 * The categorization matching pipeline over a loaded snapshot (patterns, vendor
 * counts, category stats). Match priority: tier (exact > starts_with > contains),
 * amount-specific, confidence, longer pattern, higher vendor count. 
 * Only the top match is used.
 */
export class CategorizationContext {
  private readonly patterns: MerchantPatternRecord[];
  private readonly vendorCounts: Map<string, number>;
  private readonly statsByVendor: Map<string, CategoryCombo[]>;

  /**
   * Builds a matching context from a loaded data snapshot.
   * @param patterns Active merchant patterns.
   * @param vendorCounts Vendor id → transaction count (tie-breaker).
   * @param statsByVendor Vendor id → category combos, ranked by count desc.
   */
  constructor(
    patterns: MerchantPatternRecord[],
    vendorCounts: Map<string, number>,
    statsByVendor: Map<string, CategoryCombo[]>,
  ) {
    this.patterns = patterns;
    this.vendorCounts = vendorCounts;
    this.statsByVendor = statsByVendor;
  }

  /**
   * Categorizes one description + amount: matches a vendor, then suggests the
   * top-ranked category combo with the rest as alternatives.
   * @param rawDescription Raw bank description.
   * @param amount Signed transaction amount, or null.
   * @returns The categorization result (uncategorized when nothing matches).
   */
  categorize(
    rawDescription: string,
    amount: number | null,
  ): CategorizationResult {
    const matched = this.findMatch(rawDescription, amount);
    const combos = matched
      ? this.statsByVendor.get(matched.vendor_ID) ?? []
      : [];
    return CategorizationMapper.toResult(matched, combos);
  }

  /**
   * Finds the single best-scoring active pattern for a description + amount.
   * @param rawDescription Raw bank description.
   * @param amount Signed transaction amount, or null.
   * @returns The winning pattern, or null when none match.
   */
  findMatch(
    rawDescription: string,
    amount: number | null,
  ): MerchantPatternRecord | null {
    const normalized = rawDescription.trim().toLowerCase();
    const candidates = this.patterns.filter(pattern =>
      this._isPatternMatch(pattern, normalized, amount),
    );
    if (candidates.length === 0) {
      return null;
    }
    return candidates.reduce((best, current) =>
      this._computePatternOrder(best, current) <= 0 ? best : current,
    );
  }

  /**
   * Whether any active pattern for the given vendor already matches the
   * description — the gate that stops learning a duplicate pattern.
   * @param vendorId The assigned vendor id.
   * @param rawDescription Raw bank description.
   * @param amount Signed transaction amount, or null.
   * @returns True when the vendor already has a matching pattern.
   */
  hasVendorMatch(
    vendorId: string,
    rawDescription: string,
    amount: number | null,
  ): boolean {
    const normalized = rawDescription.trim().toLowerCase();
    return this.patterns.some(
      pattern =>
        pattern.vendor_ID === vendorId &&
        this._isPatternMatch(pattern, normalized, amount),
    );
  }

  /**
   * Whether a pattern matches the normalized description, honouring the amount
   * discriminator (a pattern with an amount matches only when the transaction's
   * absolute amount equals it).
   * @param pattern The pattern to test.
   * @param normalized Trimmed, lower-cased description.
   * @param amount Signed transaction amount, or null.
   * @returns True when the pattern matches.
   */
  private _isPatternMatch(
    pattern: MerchantPatternRecord,
    normalized: string,
    amount: number | null,
  ): boolean {
    if (pattern.amount !== null) {
      if (amount === null || Math.abs(amount) !== pattern.amount) {
        return false;
      }
    }
    const text = pattern.pattern.trim().toLowerCase();
    if (pattern.matchType === MATCH_TYPE.EXACT) {
      return normalized === text;
    }
    if (pattern.matchType === MATCH_TYPE.STARTS_WITH) {
      return normalized.startsWith(text);
    }
    if (pattern.matchType === MATCH_TYPE.CONTAINS) {
      return normalized.includes(text);
    }
    return false;
  }

  /**
   * Orders two matching patterns by the tie-break chain; negative means `left`
   * ranks ahead of `right`.
   * @param left A matching pattern.
   * @param right Another matching pattern.
   * @returns Negative, zero, or positive per the ranking.
   */
  private _computePatternOrder(
    left: MerchantPatternRecord,
    right: MerchantPatternRecord,
  ): number {
    const tier =
      (TIER_RANK[left.matchType] ?? Number.MAX_SAFE_INTEGER) -
      (TIER_RANK[right.matchType] ?? Number.MAX_SAFE_INTEGER);
    if (tier !== 0) {
      return tier;
    }
    const amountSpecificity =
      this._computeAmountRank(left) - this._computeAmountRank(right);
    if (amountSpecificity !== 0) {
      return amountSpecificity;
    }
    const confidence =
      this._computeConfidenceRank(left.confidenceName) -
      this._computeConfidenceRank(right.confidenceName);
    if (confidence !== 0) {
      return confidence;
    }
    const length = right.pattern.length - left.pattern.length;
    if (length !== 0) {
      return length;
    }
    return (
      this._getVendorCount(right.vendor_ID) -
      this._getVendorCount(left.vendor_ID)
    );
  }

  /**
   * Ranks a pattern's amount specificity — amount-discriminated patterns (0)
   * beat amount-agnostic ones (1).
   * @param pattern The pattern to rank.
   * @returns 0 for an amount-specific pattern, 1 otherwise.
   */
  private _computeAmountRank(pattern: MerchantPatternRecord): number {
    return pattern.amount !== null ? 0 : 1;
  }

  /**
   * Ranks a confidence name case-insensitively — stored names are Title Case,
   * but tie-break order is defined lower-cased.
   * @param confidenceName The pattern's confidence name.
   * @returns The confidence rank (lower wins), or a large value when unknown.
   */
  private _computeConfidenceRank(confidenceName: string): number {
    return (
      CONFIDENCE_RANK[confidenceName.toLowerCase()] ?? Number.MAX_SAFE_INTEGER
    );
  }

  /**
   * The transaction count for a vendor, defaulting to zero.
   * @param vendorId The vendor id.
   * @returns The vendor's transaction count.
   */
  private _getVendorCount(vendorId: string): number {
    return this.vendorCounts.get(vendorId) ?? 0;
  }
}
