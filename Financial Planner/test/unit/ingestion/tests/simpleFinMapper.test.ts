import { SimpleFINMapper } from "../../../../srv/modules/ingestion/simpleFinMapper.js";

import {
  ACCOUNT_MAPPED,
  ACCOUNT_MAPPED_ID,
  CARD_INSTANCE_ID,
} from "../../../shared/data/ingestion/simplefin.js";
import {
  SF_TX_AMAZON,
  SF_TX_NETFLIX,
  SF_TX_SETTLED_NEXT_DAY,
} from "../data/simplefin.js";

describe("SimpleFINMapper", () => {
  describe("toTransactionRow", () => {
    /** SimpleFIN stamps are epoch seconds and amounts are signed strings; a dropped ×1000 dates every bank-fed row in 1970, an inverted sign turns spend into credits. */
    it("keeps the charge sign and converts epoch seconds to the posted date", () => {
      const row = SimpleFINMapper.toTransactionRow(SF_TX_AMAZON, ACCOUNT_MAPPED);

      expect(row).toMatchObject({
        amount: -42.5,
        postedAt: "2026-05-29",
        transactedAt: null,
      });
    });

    /** A charge that carries transacted_at must keep it; dropping it loses the authorization date the review screen shows. */
    it("maps transacted_at when the provider sends it", () => {
      const row = SimpleFINMapper.toTransactionRow(SF_TX_NETFLIX, ACCOUNT_MAPPED);

      expect(row).toMatchObject({
        amount: -12.99,
        postedAt: "2026-05-30",
        transactedAt: "2026-05-30",
      });
    });

    /** Authorization and settlement can fall on different days; reading transactedAt from `posted` would silently copy the settlement date. */
    it("takes transactedAt from transacted_at, not from posted", () => {
      const row = SimpleFINMapper.toTransactionRow(
        SF_TX_SETTLED_NEXT_DAY,
        ACCOUNT_MAPPED,
      );

      expect(row).toMatchObject({
        postedAt: "2026-05-29",
        transactedAt: "2026-05-28",
      });
    });
  });

  describe("toIncoming", () => {
    /** Dedup compares the candidate to stored rows; a candidate whose amount or date differs from the row it would insert can never match it. */
    it("builds the dedup candidate with the same amount and posted date as the row", () => {
      const incoming = SimpleFINMapper.toIncoming(SF_TX_AMAZON, ACCOUNT_MAPPED);

      expect(incoming).toMatchObject({
        amount: -42.5,
        postedAt: "2026-05-29",
        providerAccount_ID: ACCOUNT_MAPPED_ID,
        cardInstance_ID: CARD_INSTANCE_ID,
        source: "simplefin",
      });
    });
  });
});
