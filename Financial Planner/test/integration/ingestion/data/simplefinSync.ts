// Named fixtures for the SimpleFIN integration spec. Every spec that mutates the
// DB owns its own ids here, so no spec reads rows another spec wrote (§6.3).
// The cross-tier connection/account world stays in test/shared/data.

import type { SimpleFINResponse } from "../../../../srv/modules/ingestion/types.js";
import { AMEX_COBALT_INSTANCE } from "../../../shared/data/cards.js";
import {
  ACCOUNT_MAPPED_ID,
  CONNECTION_ID,
  EXTERNAL_ACCOUNT_MAPPED,
} from "../../../shared/data/ingestion/simplefin.js";

/** SimpleFIN stamps are Unix seconds; fixtures are written in human time. */
const unixSeconds = (iso: string): number => Math.floor(Date.parse(iso) / 1000);

// ─── Stale check ────────────────────────────────────────────────────────────

/** Fixed clock for the stale check: 10 days after the stale seeds last synced. */
export const STALE_CHECK_NOW = Date.parse("2026-06-29T12:00:00.000Z");

/** Active connection last synced 10 days before STALE_CHECK_NOW — past any threshold. */
export const CONNECTION_STALE_SEED = {
  ID: "cccccccc-0000-0000-0000-0000000000a1",
  providerType: "simplefin",
  displayName: "Stale Seeded SimpleFIN",
  lastSyncStatus: "success",
  lastSyncAt: "2026-06-19T12:00:00.000Z",
  isActive: true,
} as const;

/** Same old lastSyncAt, but deactivated — the stale query must not pick it up. */
export const CONNECTION_INACTIVE_SEED = {
  ...CONNECTION_STALE_SEED,
  ID: "cccccccc-0000-0000-0000-0000000000a2",
  displayName: "Inactive SimpleFIN",
  isActive: false,
} as const;

// ─── Transaction rows (common columns) ──────────────────────────────────────

/** Columns every seeded SimpleFIN transaction shares. */
const SIMPLEFIN_ROW = {
  source: "simplefin",
  categorizationStatus: "uncategorized",
  isExcluded: false,
} as const;

// ─── Re-sync dedup ──────────────────────────────────────────────────────────

export const TX_RESYNC_EXISTING = "sf-tx-resync-existing";
export const TX_RESYNC_NEW = "sf-tx-resync-new";

/** A transaction a previous sync already stored on the mapped account. */
export const RESYNC_STORED_TRANSACTION = {
  ...SIMPLEFIN_ROW,
  ID: "ffffffff-0000-0000-0000-0000000000a1",
  externalId: TX_RESYNC_EXISTING,
  providerAccount_ID: ACCOUNT_MAPPED_ID,
  cardInstance_ID: AMEX_COBALT_INSTANCE.ID,
  amount: -30,
  postedAt: "2026-05-20",
  rawDescription: "RESYNC STORED CHARGE",
} as const;

/** Overlapping window: the stored charge again, plus one new one. */
export const RESPONSE_RESYNC: SimpleFINResponse = {
  errors: [],
  accounts: [
    {
      id: EXTERNAL_ACCOUNT_MAPPED,
      name: "Amex Cobalt",
      transactions: [
        {
          id: TX_RESYNC_EXISTING,
          posted: unixSeconds("2026-05-20T12:00:00Z"),
          amount: "-30.00",
          description: "RESYNC STORED CHARGE",
        },
        {
          id: TX_RESYNC_NEW,
          posted: unixSeconds("2026-05-22T12:00:00Z"),
          amount: "-6.00",
          description: "RESYNC NEW CHARGE",
        },
      ],
    },
  ],
};

// ─── Backfill ───────────────────────────────────────────────────────────────

export const TX_BACKFILL = "sf-tx-backfill";

/** An account the user has just mapped, whose earlier rows still carry no card. */
export const BACKFILL_ACCOUNT_SEED = {
  ID: "dddddddd-0000-0000-0000-0000000000b1",
  providerConnection_ID: CONNECTION_ID,
  cardInstance_ID: AMEX_COBALT_INSTANCE.ID,
  externalAccountId: "sf-acct-backfill",
  isActive: true,
} as const;

/** The orphaned null-card row on BACKFILL_ACCOUNT_SEED. */
export const BACKFILL_ORPHAN_TRANSACTION = {
  ...SIMPLEFIN_ROW,
  ID: "ffffffff-0000-0000-0000-0000000000b1",
  externalId: TX_BACKFILL,
  providerAccount_ID: BACKFILL_ACCOUNT_SEED.ID,
  cardInstance_ID: null,
  amount: -11,
  postedAt: "2026-05-23",
  rawDescription: "BACKFILL ORPHAN CHARGE",
} as const;

export const TX_PATCH_BACKFILL = "sf-tx-patch-backfill";

/** A still-unmapped account the spec maps through OData PATCH. */
export const PATCH_ACCOUNT_SEED = {
  ID: "dddddddd-0000-0000-0000-0000000000b2",
  providerConnection_ID: CONNECTION_ID,
  cardInstance_ID: null,
  externalAccountId: "sf-acct-patch",
  isActive: true,
} as const;

/** The null-card row on PATCH_ACCOUNT_SEED that the after-UPDATE hook must backfill. */
export const PATCH_ORPHAN_TRANSACTION = {
  ...SIMPLEFIN_ROW,
  ID: "ffffffff-0000-0000-0000-0000000000b2",
  externalId: TX_PATCH_BACKFILL,
  providerAccount_ID: PATCH_ACCOUNT_SEED.ID,
  cardInstance_ID: null,
  amount: -12,
  postedAt: "2026-05-24",
  rawDescription: "PATCH ORPHAN CHARGE",
} as const;

/** The PATCH body a user's mapping in the UI sends. */
export const MAP_TO_COBALT_PAYLOAD = {
  cardInstance_ID: AMEX_COBALT_INSTANCE.ID,
} as const;

// ─── Natural-key lookup ─────────────────────────────────────────────────────

export const TX_NATURAL_KEY = "sf-tx-natural-key";

/** A stored row the natural-key lookup is aimed at. */
export const NATURAL_KEY_TRANSACTION = {
  ...SIMPLEFIN_ROW,
  ID: "ffffffff-0000-0000-0000-0000000000c1",
  externalId: TX_NATURAL_KEY,
  providerAccount_ID: ACCOUNT_MAPPED_ID,
  cardInstance_ID: AMEX_COBALT_INSTANCE.ID,
  amount: -17.5,
  postedAt: "2026-05-21",
  rawDescription: "NATURAL KEY CHARGE",
} as const;

// ─── Facade (OData) sync ────────────────────────────────────────────────────

/** What the facade-registered engine's stub returns: two charges no other spec uses. */
export const RESPONSE_FACADE_SYNC: SimpleFINResponse = {
  errors: [],
  accounts: [
    {
      id: EXTERNAL_ACCOUNT_MAPPED,
      name: "Amex Cobalt",
      transactions: [
        {
          id: "sf-tx-facade-1",
          posted: unixSeconds("2026-05-25T12:00:00Z"),
          amount: "-3.00",
          description: "FACADE CHARGE ONE",
        },
        {
          id: "sf-tx-facade-2",
          posted: unixSeconds("2026-05-26T12:00:00Z"),
          amount: "-4.00",
          description: "FACADE CHARGE TWO",
        },
      ],
    },
  ],
};

// ─── Remap ──────────────────────────────────────────────────────────────────

export const TX_REMAP = "sf-tx-remap";

/** A second Amex Cobalt instance the remapped account moves to. */
export const REMAP_TARGET_CARD_INSTANCE = {
  ...AMEX_COBALT_INSTANCE,
  ID: "a1b2c3d4-0023-4000-8000-0000000000e1",
} as const;

/** An account mapped to card A (Cobalt) with one already-ingested charge. */
export const REMAP_ACCOUNT_SEED = {
  ID: "dddddddd-0000-0000-0000-0000000000c1",
  providerConnection_ID: CONNECTION_ID,
  cardInstance_ID: AMEX_COBALT_INSTANCE.ID,
  externalAccountId: "sf-acct-remap",
  isActive: true,
} as const;

/** The charge ingested while the account still pointed at card A. */
export const REMAP_INGESTED_TRANSACTION = {
  ...SIMPLEFIN_ROW,
  ID: "ffffffff-0000-0000-0000-0000000000d1",
  externalId: TX_REMAP,
  providerAccount_ID: REMAP_ACCOUNT_SEED.ID,
  cardInstance_ID: AMEX_COBALT_INSTANCE.ID,
  amount: -21,
  postedAt: "2026-05-27",
  rawDescription: "REMAP CHARGE",
} as const;

/** The next sync's overlapping window: the same charge, same external id. */
export const RESPONSE_REMAP_RESYNC: SimpleFINResponse = {
  errors: [],
  accounts: [
    {
      id: REMAP_ACCOUNT_SEED.externalAccountId,
      name: "Remapped Account",
      transactions: [
        {
          id: TX_REMAP,
          posted: unixSeconds("2026-05-27T12:00:00Z"),
          amount: "-21.00",
          description: "REMAP CHARGE",
        },
      ],
    },
  ],
};
