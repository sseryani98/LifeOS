import {
  INCOMING_SIMPLEFIN_NEW,
  INCOMING_CSV_NEW,
  EXISTING_TXN_ID,
} from "../data/transactions.js";
import { buildDedupMocks } from "../support/deduplicationMocks.js";

describe("DeduplicationService", () => {
  /** SimpleFIN's external id is the authoritative idempotency key — a match must short-circuit as a silent duplicate so re-syncs never double-count. */
  it("returns duplicate on an external-id match (SimpleFIN, silent skip)", async () => {
    const mocks = buildDedupMocks();
    mocks.findByExternalId.mockResolvedValue({ ID: EXISTING_TXN_ID });

    const result = await mocks.service.evaluate(INCOMING_SIMPLEFIN_NEW);

    expect(result).toEqual({
      outcome: "duplicate",
      matchedTransactionId: EXISTING_TXN_ID,
    });
    expect(mocks.findByNaturalKey).not.toHaveBeenCalled();
  });

  /** An unseen external id is definitively new — SimpleFIN must not fall back to the fuzzy natural-key check and risk a false collision. */
  it("returns new when the external id does not match", async () => {
    const mocks = buildDedupMocks();
    mocks.findByExternalId.mockResolvedValue(null);

    const result = await mocks.service.evaluate(INCOMING_SIMPLEFIN_NEW);

    expect(result).toEqual({ outcome: "new" });
    expect(mocks.findByNaturalKey).not.toHaveBeenCalled();
  });

  /** CSV lacks an external id, so a natural-key hit is only a *maybe* — flagging it for review rather than silently dropping a legitimate charge. */
  it("returns potential_duplicate on a CSV natural-key match", async () => {
    const mocks = buildDedupMocks();
    mocks.findByNaturalKey.mockResolvedValue({ ID: EXISTING_TXN_ID });

    const result = await mocks.service.evaluate(INCOMING_CSV_NEW);

    expect(result).toEqual({
      outcome: "potential_duplicate",
      matchedTransactionId: EXISTING_TXN_ID,
    });
    expect(mocks.findByExternalId).not.toHaveBeenCalled();
  });

  /** No natural-key match means the CSV row is genuinely new and must be imported, not discarded. */
  it("returns new when the CSV natural key has no match", async () => {
    const mocks = buildDedupMocks();
    mocks.findByNaturalKey.mockResolvedValue(null);

    const result = await mocks.service.evaluate(INCOMING_CSV_NEW);

    expect(result).toEqual({ outcome: "new" });
  });

  /** Normalising whitespace before the lookup lets "NETFLIX.COM " and "NETFLIX.COM" match — otherwise stray spaces would defeat dedup. */
  it("trims the description before the natural-key lookup", async () => {
    const mocks = buildDedupMocks();
    mocks.findByNaturalKey.mockResolvedValue(null);

    await mocks.service.evaluate(INCOMING_CSV_NEW);

    expect(mocks.findByNaturalKey).toHaveBeenCalledWith(
      "NETFLIX.COM",
      INCOMING_CSV_NEW.postedAt,
      INCOMING_CSV_NEW.amount,
      INCOMING_CSV_NEW.cardInstance_ID,
    );
  });
});
