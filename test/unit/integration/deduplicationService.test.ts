import { DeduplicationService } from "../../../srv/modules/integration/deduplicationService.js";
import type { DeduplicationDataService } from "../../../srv/modules/integration/deduplicationDataService.js";

import {
  INCOMING_SIMPLEFIN_NEW,
  INCOMING_CSV_NEW,
  EXISTING_TXN_ID,
} from "../../data/integration/transactions.js";

describe("DeduplicationService", () => {
  let findByExternalId: jest.Mock;
  let findByNaturalKey: jest.Mock;
  let service: DeduplicationService;

  beforeEach(() => {
    findByExternalId = jest.fn();
    findByNaturalKey = jest.fn();
    const dataService = {
      findByExternalId,
      findByNaturalKey,
    } as unknown as DeduplicationDataService;
    service = new DeduplicationService(dataService);
  });

  it("returns duplicate on an external-id match (SimpleFIN, silent skip)", async () => {
    findByExternalId.mockResolvedValue({ ID: EXISTING_TXN_ID });

    const result = await service.evaluate(INCOMING_SIMPLEFIN_NEW);

    expect(result).toEqual({
      outcome: "duplicate",
      matchedTransactionId: EXISTING_TXN_ID,
    });
    expect(findByNaturalKey).not.toHaveBeenCalled();
  });

  it("returns new when the external id does not match", async () => {
    findByExternalId.mockResolvedValue(null);

    const result = await service.evaluate(INCOMING_SIMPLEFIN_NEW);

    expect(result).toEqual({ outcome: "new" });
    expect(findByNaturalKey).not.toHaveBeenCalled();
  });

  it("returns potential_duplicate on a CSV natural-key match", async () => {
    findByNaturalKey.mockResolvedValue({ ID: EXISTING_TXN_ID });

    const result = await service.evaluate(INCOMING_CSV_NEW);

    expect(result).toEqual({
      outcome: "potential_duplicate",
      matchedTransactionId: EXISTING_TXN_ID,
    });
    expect(findByExternalId).not.toHaveBeenCalled();
  });

  it("returns new when the CSV natural key has no match", async () => {
    findByNaturalKey.mockResolvedValue(null);

    const result = await service.evaluate(INCOMING_CSV_NEW);

    expect(result).toEqual({ outcome: "new" });
  });

  it("trims the description before the natural-key lookup", async () => {
    findByNaturalKey.mockResolvedValue(null);

    await service.evaluate(INCOMING_CSV_NEW);

    expect(findByNaturalKey).toHaveBeenCalledWith(
      "NETFLIX.COM",
      INCOMING_CSV_NEW.postedAt,
      INCOMING_CSV_NEW.amount,
      INCOMING_CSV_NEW.cardInstance_ID,
    );
  });
});
