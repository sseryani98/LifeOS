import {
  AMAZON_CONTAINS_PATTERN,
  AMAZON_VENDOR_ID,
  APPLE_GENERIC_PATTERN,
  GENERIC_STATION_CONTAINS_PATTERN,
  ICLOUD_AMOUNT_PATTERN,
  NETFLIX_EXACT_PATTERN,
  NETFLIX_VENDOR_ID,
  SHELL_STARTS_WITH_PATTERN,
  SHOPPING_PT,
  STREAMING_EC,
  SUBSCRIPTIONS_PT,
  YOUTUBE_AMOUNT_PATTERN,
  YOUTUBE_VENDOR_ID,
} from "../data/patterns.js";
import { buildCategorizationContext } from "../support/categorizationMocks.js";

describe("CategorizationContext", () => {
  /** An exact pattern match must assign the vendor and the top-ranked taxonomy with status auto — the day-to-day auto-categorization path. */
  it("assigns vendor + top taxonomy on an exact match (auto)", () => {
    const context = buildCategorizationContext([NETFLIX_EXACT_PATTERN]);

    const result = context.categorize("NETFLIX.COM", -22.99);

    expect(result.vendor_ID).toBe(NETFLIX_VENDOR_ID);
    expect(result.purchaseType_ID).toBe(SUBSCRIPTIONS_PT);
    expect(result.earningCategory_ID).toBe(STREAMING_EC);
    expect(result.status).toBe("auto");
    expect(result.confidence).toBe("high");
  });

  /** Matching is case- and whitespace-insensitive so bank-cased, padded descriptions still resolve to the vendor. */
  it("matches ignoring case and surrounding whitespace", () => {
    const context = buildCategorizationContext([NETFLIX_EXACT_PATTERN]);

    const result = context.categorize("  netflix.com  ", -22.99);

    expect(result.vendor_ID).toBe(NETFLIX_VENDOR_ID);
  });

  /** A contains pattern must match a longer real-world description ("AMZN MKTP US*...") — exact-only matching would miss most rows. */
  it("matches a substring via a contains pattern", () => {
    const context = buildCategorizationContext([AMAZON_CONTAINS_PATTERN]);

    const result = context.categorize("AMZN MKTP US*2K4R7J3M", -42.5);

    expect(result.vendor_ID).toBe(AMAZON_VENDOR_ID);
    expect(result.purchaseType_ID).toBe(SHOPPING_PT);
  });

  /** The amount discriminator must beat the generic pattern so same-description-different-vendor rows resolve by amount (APPLE.COM/BILL at $13.99 = YouTube). */
  it("prefers an amount-specific pattern over a generic one", () => {
    const context = buildCategorizationContext([
      APPLE_GENERIC_PATTERN,
      YOUTUBE_AMOUNT_PATTERN,
      ICLOUD_AMOUNT_PATTERN,
    ]);

    const result = context.categorize("APPLE.COM/BILL", -13.99);

    expect(result.vendor_ID).toBe(YOUTUBE_VENDOR_ID);
  });

  /** An amount-specific pattern must not match a different amount — otherwise the $3.99 iCloud pattern would wrongly claim a $13.99 charge. */
  it("does not match an amount-specific pattern at a different amount", () => {
    const context = buildCategorizationContext([ICLOUD_AMOUNT_PATTERN]);

    const result = context.categorize("APPLE.COM/BILL", -13.99);

    expect(result.vendor_ID).toBeNull();
    expect(result.status).toBe("uncategorized");
  });

  /** Tier priority (exact > starts_with > contains) must decide when two patterns both match — the more specific match type wins. */
  it("prefers a higher match tier when two patterns both match", () => {
    const context = buildCategorizationContext([
      GENERIC_STATION_CONTAINS_PATTERN,
      SHELL_STARTS_WITH_PATTERN,
    ]);

    const result = context.categorize("SHELL STATION 123", -50);

    expect(result.vendorName).toBe("Shell");
  });

  /** No matching pattern must leave the row uncategorized with no vendor — the engine never guesses. */
  it("returns uncategorized when nothing matches", () => {
    const context = buildCategorizationContext([NETFLIX_EXACT_PATTERN]);

    const result = context.categorize("XYZ UNKNOWN MERCHANT 12345", -10);

    expect(result.vendor_ID).toBeNull();
    expect(result.purchaseType_ID).toBeNull();
    expect(result.earningCategory_ID).toBeNull();
    expect(result.status).toBe("uncategorized");
  });

  /** Runner-up combos must be returned as alternatives so the UI can offer other (PT, EC) pairs ranked by usage. */
  it("returns runner-up combos as ranked alternatives", () => {
    const context = buildCategorizationContext([AMAZON_CONTAINS_PATTERN]);

    const result = context.categorize("AMZN MKTP CA", -19.99);

    expect(result.alternatives).toHaveLength(1);
    expect(result.alternatives[0].purchaseType_ID).toBe(SUBSCRIPTIONS_PT);
  });

  /** hasVendorMatch gates learning: a vendor that already matches the description must report true so no duplicate pattern is created. */
  it("reports an existing vendor match for the learning gate", () => {
    const context = buildCategorizationContext([NETFLIX_EXACT_PATTERN]);

    expect(context.hasVendorMatch(NETFLIX_VENDOR_ID, "NETFLIX.COM", -22.99)).toBe(true);
    expect(context.hasVendorMatch(YOUTUBE_VENDOR_ID, "NETFLIX.COM", -22.99)).toBe(false);
  });
});
