import { CATEGORIZATION_STATUS, MATCH_TYPE } from "./constants.js";
import type {
  CategorizationResult,
  CategoryCombo,
  LearnedPatternParams,
  MerchantPatternInsert,
  MerchantPatternRecord,
  TransactionCategorizationPatch,
} from "./types.js";

/**
 * Mapping for the categorization engine: matched pattern +
 * ranked combos into a result, and correction inputs into the learned
 * MerchantPattern and transaction patch.
 */
export class CategorizationMapper {
  /**
   * Builds a categorization result from the winning pattern and its vendor's
   * ranked category combinations. A null match yields an uncategorized result.
   * @param matched The best-scoring pattern, or null when nothing matched.
   * @param combos The matched vendor's (PT, EC) combos, ranked by count desc.
   * @returns The categorization result.
   */
  static toResult(
    matched: MerchantPatternRecord | null,
    combos: CategoryCombo[],
  ): CategorizationResult {
    if (!matched) {
      return {
        vendor_ID: null,
        vendorName: null,
        purchaseType_ID: null,
        earningCategory_ID: null,
        confidence: null,
        alternatives: [],
        status: CATEGORIZATION_STATUS.UNCATEGORIZED,
      };
    }
    const top = combos[0] ?? null;
    return {
      vendor_ID: matched.vendor_ID,
      vendorName: matched.vendorName,
      purchaseType_ID: top?.purchaseType_ID ?? null,
      earningCategory_ID: top?.earningCategory_ID ?? null,
      confidence: matched.confidenceName,
      alternatives: combos.slice(1),
      status: CATEGORIZATION_STATUS.AUTO,
    };
  }

  /**
   * Builds the transaction categorization fields written on a user correction.
   * An absent (undefined) taxonomy id is left out of the patch, so a bulk apply
   * that names only the vendor never clears the row's PT/EC.
   * @param vendorId The assigned vendor id.
   * @param purchaseTypeId The assigned purchase type id, null to clear, undefined to keep.
   * @param earningCategoryId The assigned earning category id, null to clear, undefined to keep.
   * @returns The transaction categorization patch.
   */
  static toCategorizationPatch(
    vendorId: string,
    purchaseTypeId: string | null | undefined,
    earningCategoryId: string | null | undefined,
  ): TransactionCategorizationPatch {
    return {
      vendor_ID: vendorId,
      ...(purchaseTypeId === undefined ? {} : { purchaseType_ID: purchaseTypeId }),
      ...(earningCategoryId === undefined ? {} : { earningCategory_ID: earningCategoryId }),
      categorizationStatus: CATEGORIZATION_STATUS.USER_CORRECTED,
    };
  }

  /**
   * Builds the transaction categorization fields written when the re-categorize
   * batch re-matches a row — same taxonomy as a fresh match, status `auto`.
   * @param result The re-run categorization result (a matched vendor).
   * @returns The transaction categorization patch.
   */
  static toAutoCategorizationPatch(
    result: CategorizationResult,
  ): TransactionCategorizationPatch {
    return {
      vendor_ID: result.vendor_ID as string,
      purchaseType_ID: result.purchaseType_ID,
      earningCategory_ID: result.earningCategory_ID,
      categorizationStatus: CATEGORIZATION_STATUS.AUTO,
    };
  }

  /**
   * Builds a learned MerchantPattern from a correction. A correction over a
   * description that already matched a different vendor becomes an amount-
   * discriminated `contains` pattern; a from-scratch correction becomes an
   * amount-agnostic `exact` pattern.
   * @param params Correction inputs plus the resolved reference ids.
   * @returns The MerchantPattern insert row.
   */
  static toLearnedPatternInsert(
    params: LearnedPatternParams,
  ): MerchantPatternInsert {
    return {
      vendor_ID: params.vendorId,
      pattern: params.pattern,
      matchType: params.isDiscriminator
        ? MATCH_TYPE.CONTAINS
        : MATCH_TYPE.EXACT,
      patternSource_ID: params.patternSourceId,
      confidenceLevel_ID: params.confidenceLevelId,
      amount: params.isDiscriminator ? Math.abs(params.amount) : null,
      isActive: true,
    };
  }
}
