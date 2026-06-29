import { DeduplicationValidator } from "../../../srv/modules/integration/deduplicationValidator.js";

import {
  INCOMING_SIMPLEFIN_NEW,
  INCOMING_CSV_NEW,
  INCOMING_MISSING_AMOUNT,
  INCOMING_NAN_AMOUNT,
  INCOMING_MISSING_POSTED_AT,
  INCOMING_EMPTY_DESCRIPTION,
  INCOMING_BLANK_DESCRIPTION,
  INCOMING_INVALID_SOURCE,
} from "../../data/integration/transactions.js";

describe("DeduplicationValidator", () => {
  it("accepts a valid SimpleFIN transaction", () => {
    expect(DeduplicationValidator.validate(INCOMING_SIMPLEFIN_NEW)).toEqual([]);
  });

  it("accepts a valid CSV transaction", () => {
    expect(DeduplicationValidator.validate(INCOMING_CSV_NEW)).toEqual([]);
  });

  it("flags a missing amount", () => {
    expect(DeduplicationValidator.validate(INCOMING_MISSING_AMOUNT)).toContainEqual(
      { field: "amount", messageKey: "dedup.amountRequired" },
    );
  });

  it("flags a NaN amount", () => {
    expect(DeduplicationValidator.validate(INCOMING_NAN_AMOUNT)).toContainEqual({
      field: "amount",
      messageKey: "dedup.amountRequired",
    });
  });

  it("flags a missing posted date", () => {
    expect(DeduplicationValidator.validate(INCOMING_MISSING_POSTED_AT)).toContainEqual(
      { field: "postedAt", messageKey: "dedup.postedAtRequired" },
    );
  });

  it("flags an empty description", () => {
    expect(DeduplicationValidator.validate(INCOMING_EMPTY_DESCRIPTION)).toContainEqual(
      { field: "rawDescription", messageKey: "dedup.rawDescriptionRequired" },
    );
  });

  it("flags a whitespace-only description", () => {
    expect(DeduplicationValidator.validate(INCOMING_BLANK_DESCRIPTION)).toContainEqual(
      { field: "rawDescription", messageKey: "dedup.rawDescriptionRequired" },
    );
  });

  it("flags an unrecognised source", () => {
    expect(DeduplicationValidator.validate(INCOMING_INVALID_SOURCE)).toContainEqual(
      { field: "source", messageKey: "dedup.sourceInvalid" },
    );
  });
});
