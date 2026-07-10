import { CategorizationMapper } from "../../../../srv/modules/categorization/categorizationMapper.js";
import {
  AMAZON_COMBOS,
  AMAZON_CONTAINS_PATTERN,
  AMAZON_VENDOR_ID,
  DISCRIMINATOR_LEARNED_PARAMS,
  SCRATCH_LEARNED_PARAMS,
  SHOPPING_PT,
} from "../data/patterns.js";

describe("CategorizationMapper", () => {
  /** A matched result must carry the vendor, the top combo, and the rest as alternatives so callers get one suggestion plus fallbacks. */
  it("maps a match to vendor, top combo, and alternatives", () => {
    const result = CategorizationMapper.toResult(
      AMAZON_CONTAINS_PATTERN,
      AMAZON_COMBOS,
    );

    expect(result.vendor_ID).toBe(AMAZON_VENDOR_ID);
    expect(result.purchaseType_ID).toBe(SHOPPING_PT);
    expect(result.alternatives).toEqual(AMAZON_COMBOS.slice(1));
    expect(result.status).toBe("auto");
  });

  /** A null match must map to a fully-empty uncategorized result — the shape the UI shows for unknown rows. */
  it("maps a null match to an uncategorized result", () => {
    const result = CategorizationMapper.toResult(null, []);

    expect(result).toEqual({
      vendor_ID: null,
      vendorName: null,
      purchaseType_ID: null,
      earningCategory_ID: null,
      confidence: null,
      alternatives: [],
      status: "uncategorized",
    });
  });

  /** A from-scratch correction must learn an exact, amount-agnostic pattern so the identical description auto-categorizes next time. */
  it("builds an exact amount-agnostic pattern for a from-scratch correction", () => {
    const insert = CategorizationMapper.toLearnedPatternInsert(
      SCRATCH_LEARNED_PARAMS,
    );

    expect(insert.matchType).toBe("exact");
    expect(insert.amount).toBeNull();
    expect(insert.isActive).toBe(true);
  });

  /** A discriminating correction must learn a contains pattern carrying the absolute amount so amount separates the two vendors. */
  it("builds a contains amount-specific pattern for a discriminating correction", () => {
    const insert = CategorizationMapper.toLearnedPatternInsert(
      DISCRIMINATOR_LEARNED_PARAMS,
    );

    expect(insert.matchType).toBe("contains");
    expect(insert.amount).toBe(3.99);
  });
});
