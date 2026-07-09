// Named test data for the SimpleFIN sync engine.
// UPPER_SNAKE_CASE constants — no inline payloads or identifiers in test files.
// Mock/service/seed *builders* live in test/support/integration/, not here.

import type {
  ClaimRequest,
  SimpleFINResponse,
} from "../../../srv/modules/integration/types.js";
import { AMEX_COBALT_INSTANCE } from "../cards.js";

// ─── Identifiers ────────────────────────────────────────────────────────────

/** A Provider Connection under test — shared by the unit mocks and the integration DB seed. */
export const CONNECTION_ID = "cccccccc-0000-0000-0000-000000000001";

/** A mapped Provider Account (→ Amex Cobalt instance). */
export const ACCOUNT_MAPPED_ID = "dddddddd-0000-0000-0000-000000000001";

/** Card instance the unit-test mock account points at. */
export const CARD_INSTANCE_ID = "11111111-1111-1111-1111-111111111111";

/** External account id known to the system (mapped to a card). */
export const EXTERNAL_ACCOUNT_MAPPED = "sf-acct-known";

/** External account id NOT yet known — triggers auto-create + unmapped alert. */
export const EXTERNAL_ACCOUNT_UNKNOWN = "sf-acct-new";

/** An id/name guaranteed to match no seeded row — exercises data-layer "not found" paths. */
export const MISSING_ID = "no-such-id";

/** Resolved AlertType / AlertSeverity ids returned by the mocked data layer. */
export const ALERT_TYPE_ID = "a1b2c3d4-000e-4000-8000-000000000009";
export const ALERT_SEVERITY_ID = "a1b2c3d4-0004-4000-8000-000000000003";

/**
 * Plaintext access URL: what the encryption stub decrypts to, and what the
 * integration seed encrypts before storing. Its host must never appear in ciphertext.
 */
export const ACCESS_URL_PLAINTEXT = "https://user:pass@example.simplefin.org";

// ─── SimpleFIN transaction ids ──────────────────────────────────────────────

export const TX_AMAZON = "sf-tx-1";
export const TX_NETFLIX = "sf-tx-2";
export const TX_NEW = "sf-tx-3";
export const TX_UNMAPPED = "sf-tx-unmapped";
export const TX_EXISTING = "sf-tx-existing";
export const TX_POSTED = "sf-tx-posted";
export const TX_PENDING = "sf-tx-pending";
export const TX_AFTER_ERROR = "sf-tx-after-error";

// ─── Posted timestamps ──────────────────────────────────────────────────────
// SimpleFIN reports timestamps as Unix *seconds*. These fixtures care only about
// ordering, so express them in human time and keep before/after relationships clear.

const unixSeconds = (iso: string): number => Math.floor(Date.parse(iso) / 1000);

const POSTED_DAY_1 = unixSeconds("2026-05-29T12:00:00Z");
const POSTED_DAY_2 = unixSeconds("2026-05-30T12:00:00Z");
const POSTED_DAY_3 = unixSeconds("2026-05-31T12:00:00Z");

/** The day-2 charge is authorized before it settles — transacted_at precedes posted. */
const TRANSACTED_DAY_2 = unixSeconds("2026-05-30T09:00:00Z");

// ─── Connection records (as returned by the data layer) ─────────────────────

/** Active, previously-synced connection. */
export const CONNECTION_ACTIVE = {
  ID: CONNECTION_ID,
  displayName: "Main SimpleFIN",
  accessUrlEnc: "iv:tag:ciphertext",
  isActive: true,
  lastSyncAt: "2026-06-28T20:00:00.000Z",
  lastSyncStatus: "success",
} as const;

/** Connection last synced 4 days ago — stale per default 3-day threshold. */
export const CONNECTION_STALE = {
  ID: "cccccccc-0000-0000-0000-000000000002",
  displayName: "Stale SimpleFIN",
  accessUrlEnc: "iv:tag:ciphertext",
  isActive: true,
  lastSyncAt: "2026-06-25T20:00:00.000Z",
  lastSyncStatus: "error",
} as const;

/** Connection synced today — not stale. */
export const CONNECTION_FRESH = {
  ID: "cccccccc-0000-0000-0000-000000000003",
  displayName: "Fresh SimpleFIN",
  accessUrlEnc: "iv:tag:ciphertext",
  isActive: true,
  lastSyncAt: "2026-06-29T08:00:00.000Z",
  lastSyncStatus: "success",
} as const;

// ─── Provider Account records ───────────────────────────────────────────────

/** A mapped Provider Account record (as returned by the data layer). */
export const ACCOUNT_MAPPED = {
  ID: ACCOUNT_MAPPED_ID,
  cardInstance_ID: CARD_INSTANCE_ID,
  externalAccountId: EXTERNAL_ACCOUNT_MAPPED,
  isActive: true,
} as const;

/** The same account before it is mapped to a card — used by the backfill no-op test. */
export const ACCOUNT_UNMAPPED = {
  ID: ACCOUNT_MAPPED_ID,
  cardInstance_ID: null,
  externalAccountId: EXTERNAL_ACCOUNT_UNKNOWN,
  isActive: true,
} as const;

// ─── Integration DB seed rows ───────────────────────────────────────────────

/** Static columns of the seeded connection; the harness adds the encrypted access URL at runtime. */
export const CONNECTION_SEED = {
  ID: CONNECTION_ID,
  providerType: "simplefin",
  displayName: "Main SimpleFIN",
  lastSyncStatus: "never_synced",
  isActive: true,
} as const;

/** Mapped account row seeded alongside the connection (→ Amex Cobalt instance). */
export const ACCOUNT_MAPPED_SEED = {
  ID: ACCOUNT_MAPPED_ID,
  providerConnection_ID: CONNECTION_ID,
  cardInstance_ID: AMEX_COBALT_INSTANCE.ID,
  externalAccountId: EXTERNAL_ACCOUNT_MAPPED,
  isActive: true,
} as const;

// ─── SimpleFIN API responses ────────────────────────────────────────────────

/** Two posted transactions on a known, mapped account. */
export const RESPONSE_TWO_NEW: SimpleFINResponse = {
  errors: [],
  accounts: [
    {
      id: EXTERNAL_ACCOUNT_MAPPED,
      name: "Amex Cobalt",
      transactions: [
        {
          id: TX_AMAZON,
          posted: POSTED_DAY_1,
          amount: "-42.50",
          description: "AMZN MKTP CA",
        },
        {
          id: TX_NETFLIX,
          posted: POSTED_DAY_2,
          amount: "-12.99",
          description: "NETFLIX.COM",
          transacted_at: TRANSACTED_DAY_2,
        },
      ],
    },
  ],
};

/** Re-sync of the mapped account: one external-id duplicate (TX_AMAZON) + one new (TX_NEW). */
export const RESYNC_ONE_DUP_ONE_NEW: SimpleFINResponse = {
  errors: [],
  accounts: [
    {
      id: EXTERNAL_ACCOUNT_MAPPED,
      name: "Amex Cobalt",
      transactions: [
        {
          id: TX_AMAZON,
          posted: POSTED_DAY_1,
          amount: "-42.50",
          description: "AMZN MKTP CA",
        },
        {
          id: TX_NEW,
          posted: POSTED_DAY_3,
          amount: "-5.00",
          description: "NEW ONE",
        },
      ],
    },
  ],
};

/** One posted and one pending transaction — pending must be discarded. */
export const RESPONSE_WITH_PENDING: SimpleFINResponse = {
  errors: [],
  accounts: [
    {
      id: EXTERNAL_ACCOUNT_MAPPED,
      name: "Amex Cobalt",
      transactions: [
        {
          id: TX_POSTED,
          posted: POSTED_DAY_1,
          amount: "-20.00",
          description: "POSTED CHARGE",
        },
        {
          id: TX_PENDING,
          posted: 0,
          amount: "-5.00",
          description: "PENDING CHARGE",
          pending: true,
        },
      ],
    },
  ],
};

/** A single transaction whose external id already exists (duplicate). */
export const RESPONSE_DUPLICATE: SimpleFINResponse = {
  errors: [],
  accounts: [
    {
      id: EXTERNAL_ACCOUNT_MAPPED,
      name: "Amex Cobalt",
      transactions: [
        {
          id: TX_EXISTING,
          posted: POSTED_DAY_1,
          amount: "-99.00",
          description: "ALREADY IMPORTED",
        },
      ],
    },
  ],
};

/** A transaction on an unknown account — auto-create + unmapped_account alert. */
export const RESPONSE_UNMAPPED_ACCOUNT: SimpleFINResponse = {
  errors: [],
  accounts: [
    {
      id: EXTERNAL_ACCOUNT_UNKNOWN,
      name: "New Linked Account",
      transactions: [
        {
          id: TX_UNMAPPED,
          posted: POSTED_DAY_1,
          amount: "-15.00",
          description: "UNKNOWN ACCT CHARGE",
        },
      ],
    },
  ],
};

/** Non-empty errors array but a good account alongside it. */
export const RESPONSE_BANK_ERROR: SimpleFINResponse = {
  errors: ["You must reauthenticate."],
  accounts: [
    {
      id: EXTERNAL_ACCOUNT_MAPPED,
      name: "Amex Cobalt",
      transactions: [
        {
          id: TX_AFTER_ERROR,
          posted: POSTED_DAY_1,
          amount: "-8.00",
          description: "STILL PROCESSED",
        },
      ],
    },
  ],
};

/** Empty pull — no accounts, no transactions (backfill / claim tests). */
export const EMPTY_RESPONSE: SimpleFINResponse = { errors: [], accounts: [] };

// ─── Claim requests ─────────────────────────────────────────────────────────

/** Base64 of a claim URL — Buffer.from(token,'base64') → the claim URL. */
export const SETUP_TOKEN = Buffer.from(
  "https://bridge.simplefin.org/simplefin/claim/abc123",
).toString("base64");

export const VALID_CLAIM: ClaimRequest = {
  setupToken: SETUP_TOKEN,
  displayName: "Main SimpleFIN",
};

export const CLAIM_MISSING_TOKEN: ClaimRequest = {
  setupToken: "",
  displayName: "Main SimpleFIN",
};

export const CLAIM_MISSING_NAME: ClaimRequest = {
  setupToken: SETUP_TOKEN,
  displayName: "   ",
};
