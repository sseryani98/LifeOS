import {
  INCOMING_SIMPLEFIN_NEW,
  INCOMING_SIMPLEFIN_UNSCOPED,
  INCOMING_CSV_NEW,
  INCOMING_CSV_UNCARDED,
  EXISTING_TXN_ID,
  PROVIDER_ACCOUNT_AMEX,
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

  /** External ids are scoped by provider account, not card — a card scope re-inserts an account's whole history after a remap. */
  it("looks up the external id within the provider account", async () => {
    const mocks = buildDedupMocks();
    mocks.findByExternalId.mockResolvedValue(null);

    await mocks.service.evaluate(INCOMING_SIMPLEFIN_NEW);

    expect(mocks.findByExternalId).toHaveBeenCalledWith(
      INCOMING_SIMPLEFIN_NEW.externalId,
      PROVIDER_ACCOUNT_AMEX,
    );
  });

  /** A candidate with no provider account must look up null, never undefined — CQL drops an undefined key and would match the id on any account. */
  it("looks up a null provider account when the candidate has none", async () => {
    const mocks = buildDedupMocks();
    mocks.findByExternalId.mockResolvedValue(null);

    await mocks.service.evaluate(INCOMING_SIMPLEFIN_UNSCOPED);

    expect(mocks.findByExternalId).toHaveBeenCalledWith(
      INCOMING_SIMPLEFIN_UNSCOPED.externalId,
      null,
    );
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

  /** An uncarded candidate must look up a null card, never undefined — CQL drops an undefined key and would match the charge on every card. */
  it("looks up a null card when the CSV candidate has none", async () => {
    const mocks = buildDedupMocks();
    mocks.findByNaturalKey.mockResolvedValue(null);

    await mocks.service.evaluate(INCOMING_CSV_UNCARDED);

    expect(mocks.findByNaturalKey).toHaveBeenCalledWith(
      INCOMING_CSV_UNCARDED.rawDescription,
      INCOMING_CSV_UNCARDED.postedAt,
      INCOMING_CSV_UNCARDED.amount,
      null,
    );
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
