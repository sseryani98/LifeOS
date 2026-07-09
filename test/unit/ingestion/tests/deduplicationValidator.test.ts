import { DeduplicationValidator } from "../../../../srv/modules/ingestion/deduplicationValidator.js";

import {
  INCOMING_SIMPLEFIN_NEW,
  INCOMING_CSV_NEW,
  INCOMING_MISSING_AMOUNT,
  INCOMING_NAN_AMOUNT,
  INCOMING_MISSING_POSTED_AT,
  INCOMING_EMPTY_DESCRIPTION,
  INCOMING_BLANK_DESCRIPTION,
  INCOMING_INVALID_SOURCE,
} from "../data/transactions.js";

describe("DeduplicationValidator", () => {
  /** A well-formed SimpleFIN payload must clear validation, or genuine transactions would be blocked from ingestion. */
  it("accepts a valid SimpleFIN transaction", () => {
    expect(DeduplicationValidator.validate(INCOMING_SIMPLEFIN_NEW)).toEqual([]);
  });

  /** CSV imports carry no external id yet must still validate, or manual statement imports would fail wholesale. */
  it("accepts a valid CSV transaction", () => {
    expect(DeduplicationValidator.validate(INCOMING_CSV_NEW)).toEqual([]);
  });

  /** Amount feeds the natural-key match and spend totals — letting a null through would corrupt dedup and budget math. */
  it("flags a missing amount", () => {
    expect(DeduplicationValidator.validate(INCOMING_MISSING_AMOUNT)).toContainEqual(
      { field: "amount", messageKey: "dedup.amountRequired" },
    );
  });

  /** NaN slips past a naive truthy check but poisons every downstream sum — it must be rejected like a missing amount. */
  it("flags a NaN amount", () => {
    expect(DeduplicationValidator.validate(INCOMING_NAN_AMOUNT)).toContainEqual({
      field: "amount",
      messageKey: "dedup.amountRequired",
    });
  });

  /** postedAt is half the natural key — without a date the dedup window can't align CSV duplicates. */
  it("flags a missing posted date", () => {
    expect(DeduplicationValidator.validate(INCOMING_MISSING_POSTED_AT)).toContainEqual(
      { field: "postedAt", messageKey: "dedup.postedAtRequired" },
    );
  });

  /** rawDescription anchors the natural key; an empty one would make unrelated transactions collide as duplicates. */
  it("flags an empty description", () => {
    expect(DeduplicationValidator.validate(INCOMING_EMPTY_DESCRIPTION)).toContainEqual(
      { field: "rawDescription", messageKey: "dedup.rawDescriptionRequired" },
    );
  });

  /** A space-filled description is effectively empty — trimming before the check stops whitespace masquerading as a merchant name. */
  it("flags a whitespace-only description", () => {
    expect(DeduplicationValidator.validate(INCOMING_BLANK_DESCRIPTION)).toContainEqual(
      { field: "rawDescription", messageKey: "dedup.rawDescriptionRequired" },
    );
  });

  /** source selects the dedup strategy (external-id vs natural-key); an unrecognised value would fall through both branches. */
  it("flags an unrecognised source", () => {
    expect(DeduplicationValidator.validate(INCOMING_INVALID_SOURCE)).toContainEqual(
      { field: "source", messageKey: "dedup.sourceInvalid" },
    );
  });
});
