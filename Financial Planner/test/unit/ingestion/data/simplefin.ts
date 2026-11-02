// Unit-only SimpleFIN fixtures: seed-faithful alert reference ids, single mapper
// inputs, and the pending-flag edge cases. Cross-tier fixtures stay in
// test/shared/data/ingestion/simplefin.ts; these are read by unit specs alone.

import type {
  SimpleFINResponse,
  SimpleFINTransaction,
} from "../../../../srv/modules/ingestion/types.js";
import {
  EXTERNAL_ACCOUNT_MAPPED,
  RESPONSE_TWO_NEW,
} from "../../../shared/data/ingestion/simplefin.js";

/**
 * AlertType name → id, copied from db/data/com.financialplanner-AlertType.csv.
 * Literal names on purpose: a source constant drifting from the seed must miss.
 */
export const ALERT_TYPE_IDS: Record<string, string> = {
  "Connection Error": "a1b2c3d4-000e-4000-8000-000000000009",
  "Stale Data": "a1b2c3d4-000e-4000-8000-00000000000a",
  "Unmapped Account": "a1b2c3d4-000e-4000-8000-00000000000b",
};

/** AlertSeverity name → id, copied from db/data/com.financialplanner-AlertSeverity.csv. */
export const ALERT_SEVERITY_IDS: Record<string, string> = {
  Info: "a1b2c3d4-0004-4000-8000-000000000001",
  Warning: "a1b2c3d4-0004-4000-8000-000000000002",
  Critical: "a1b2c3d4-0004-4000-8000-000000000003",
};

/** The Amazon charge from RESPONSE_TWO_NEW — posted only, no transacted_at. */
export const SF_TX_AMAZON: SimpleFINTransaction =
  RESPONSE_TWO_NEW.accounts[0].transactions[0];

/** The Netflix charge from RESPONSE_TWO_NEW — authorized and posted the same day. */
export const SF_TX_NETFLIX: SimpleFINTransaction =
  RESPONSE_TWO_NEW.accounts[0].transactions[1];

/** A charge authorized the day before it posted, so the two dates differ. */
export const SF_TX_SETTLED_NEXT_DAY: SimpleFINTransaction = {
  id: "sf-tx-settled-next-day",
  posted: Date.parse("2026-05-29T12:00:00Z") / 1000,
  transacted_at: Date.parse("2026-05-28T12:00:00Z") / 1000,
  amount: "-7.25",
  description: "COFFEE SHOP",
};

/** A pending charge that already carries a provisional, non-zero posted stamp. */
export const RESPONSE_PENDING_FLAG_ONLY: SimpleFINResponse = {
  errors: [],
  accounts: [
    {
      id: EXTERNAL_ACCOUNT_MAPPED,
      name: "Amex Cobalt",
      transactions: [
        {
          id: "sf-tx-pending-flag-only",
          posted: Date.parse("2026-05-29T12:00:00Z") / 1000,
          amount: "-5.00",
          description: "PENDING WITH POSTED STAMP",
          pending: true,
        },
      ],
    },
  ],
};

/** An unposted charge (posted=0) from a bank that never sends the pending key. */
export const RESPONSE_UNPOSTED_ONLY: SimpleFINResponse = {
  errors: [],
  accounts: [
    {
      id: EXTERNAL_ACCOUNT_MAPPED,
      name: "Amex Cobalt",
      transactions: [
        {
          id: "sf-tx-unposted-only",
          posted: 0,
          amount: "-5.00",
          description: "UNPOSTED NO FLAG",
        },
      ],
    },
  ],
};

/** A SystemConfig override: a 5-day lookback instead of the 7-day default. */
export const CONFIG_LOOKBACK_FIVE_DAYS: Record<string, string> = {
  SIMPLEFIN_LOOKBACK_DAYS: "5",
};
