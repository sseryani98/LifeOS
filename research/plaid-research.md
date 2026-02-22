# Plaid API in Canada: comprehensive assessment for personal finance

**Plaid supports all six of your target Canadian issuers on paper, but real-world reliability is the critical problem.** Connection success rates range from a functional **88% for BMO** down to an essentially broken **4% for CIBC**, with your four must-have launch issuers averaging just 52% reliability. This is driven by Canadian banks' aggressive blocking of screen scraping — the connection method Plaid still uses for most Canadian institutions. The incoming Consumer-Driven Banking framework (Phase 1 targeting early 2026) will eventually force standardized API access, but today, Plaid in Canada is significantly less reliable than in the US. For a single-user personal project, **SimpleFIN Bridge at $15/year** likely offers better value and comparable coverage through MX's backend, while Plaid's Pay-as-you-go tier would cost an estimated $5–30/month.

---

## 1. Your four must-have issuers include one that is functionally broken

All six Canadian issuers you listed are officially "supported" by Plaid. However, PocketSmith published granular success-rate data (February 2025) based on real user connections through both Plaid and Yodlee, and the numbers tell a very different story than "supported" implies.

| Institution | Plaid success rate | Auth failure rate | Credit cards supported | Key concern |
|---|---|---|---|---|
| **BMO** | **88%** | 12% | ✅ Yes | Best among Big 6; manageable |
| **American Express (CA)** | **84%** | 16% | ✅ Yes (primary account type) | ⚠️ Perpetual 2FA issue causes frequent re-auth |
| **TD Canada Trust** | **61%** | 39% | ✅ Yes | TD sued Plaid in 2020; has Finicity agreement, not Plaid |
| **Scotiabank** | **60%** | 40% | ✅ Yes | Moderate reliability; 2FA-driven failures |
| **RBC** | **57%** | 43% | ✅ Yes | Has formal API agreement with Plaid (June 2022) — should improve |
| **CIBC** | ⚠️ **4%** | **96%** | ⚠️ Technically yes, functionally no | **Essentially non-functional** via Plaid |

**CIBC is the showstopper.** A 96% authentication failure rate means connections almost never succeed. This alone means Plaid cannot reliably serve your four must-have issuers at launch. PocketSmith noted these stats hold for both Plaid and Yodlee, suggesting CIBC's security systems are the root cause, not Plaid specifically (though Yodlee achieves 38% for CIBC — still poor but 10× better than Plaid's 4%).

**American Express** deserves a specific flag: multiple sources report a "perpetual 2FA" issue where Amex requires re-authentication as frequently as daily. Plaid acknowledges the issue with no ETA for resolution. One Moneydance user concluded bluntly: "Plaid is best for banking and investing, not good for credit cards."

**Credit card accounts are supported** for all six issuers through Plaid's Transactions and Balance products. When you connect via Plaid Link, credit card accounts appear alongside chequing and savings under the same credentials. However, the **Liabilities product is not available in Canada**, meaning you cannot retrieve credit-card-specific metadata like APR, minimum payment amounts, or due dates — only transaction history and current balance.

### Other Canadian institutions worth noting

| Institution | Plaid success rate | Notes |
|---|---|---|
| Desjardins | 85% | Strong reliability |
| National Bank | 82% | Good |
| Canadian Tire Bank | 100% | Excellent |
| Wise (CA) | 93% | Excellent |
| Tangerine | 44% | Poor |
| President's Choice Financial | 25% | Very poor |
| Simplii Financial | 13% | Very poor |

---

## 2. Transaction data is rich, but MCC codes are hidden

Plaid returns a comprehensive transaction object with **30+ fields**. The data is substantially richer than raw bank feeds, thanks to Plaid's ML-driven enrichment pipeline.

### Core fields per transaction

| Field | Type | Description |
|---|---|---|
| `amount` | number | Positive = debit/purchase; negative = credit/refund |
| `iso_currency_code` | string | "CAD" for Canadian accounts |
| `date` | string | Posted date (YYYY-MM-DD) |
| `authorized_date` | string | Authorization date (nullable) |
| `merchant_name` | string | **Cleaned/normalized merchant name** via ML |
| `name` | string | Legacy lightly-cleaned description |
| `original_description` | string | Raw bank description (opt-in) |
| `pending` | boolean | `true` = unsettled; `false` = posted |
| `transaction_id` | string | Unique identifier (changes when pending→posted) |
| `pending_transaction_id` | string | Links posted txn to its former pending version |
| `account_id` | string | Stable account identifier |
| `payment_channel` | string | "online", "in store", or "other" |
| `logo_url` | string | Merchant logo (100×100 PNG) |
| `website` | string | Merchant website |
| `location` | object | Address, city, region, postal code, lat/lon |
| `counterparties` | array | Extracted entities with type, confidence, logos |

### Categorization system

Plaid uses a **two-tier Personal Finance Category (PFC)** taxonomy that replaced their legacy 600+ category system. The current PFC system has **16 primary categories** (e.g., FOOD_AND_DRINK, TRANSPORTATION, ENTERTAINMENT) and **~104 detailed subcategories** (e.g., FOOD_AND_DRINK_RESTAURANTS). PFC v2, default for accounts enabled after December 2025, adds 12+ new subcategories and claims **10–20% higher accuracy** over v1 using AI enhancements. Plaid states **>90% overall categorization accuracy**, with each transaction tagged with a confidence level: VERY_HIGH (>98%), HIGH (>90%), MEDIUM, LOW, or UNKNOWN.

⚠️ **MCC codes are not exposed** in the standard Transactions API response. Plaid deliberately replaces raw MCC data with their own ML-driven categories. MCC is only accepted as an *input* to the `/transactions/enrich` endpoint for enhancing your own transaction data. If your application requires raw MCC codes, this is a gap.

### Sample JSON response (from `/transactions/sync`)

```json
{
  "added": [{
    "transaction_id": "lPNjeW1nR6CDn5okmGQ6hEpMo4lLNoSrzqDje",
    "account_id": "BxBXxLj1m4HMXBm9WZZmCWVbPjX16EHwv99vp",
    "amount": 89.45,
    "iso_currency_code": "CAD",
    "date": "2025-01-15",
    "authorized_date": "2025-01-14",
    "pending": false,
    "pending_transaction_id": "no86Eox18VHMvaOVL7gPUM9ap3aR1LsAVZ5nc",
    "merchant_name": "Loblaws",
    "name": "LOBLAWS #1234",
    "original_description": null,
    "logo_url": "https://plaid-merchant-logos.plaid.com/loblaws_1100.png",
    "website": "loblaws.ca",
    "payment_channel": "in store",
    "personal_finance_category": {
      "primary": "FOOD_AND_DRINK",
      "detailed": "FOOD_AND_DRINK_GROCERIES",
      "confidence_level": "VERY_HIGH"
    },
    "location": { "city": "Toronto", "region": "ON", "country": "CA" },
    "counterparties": [{ "name": "Loblaws", "type": "merchant", "confidence_level": "VERY_HIGH" }]
  }],
  "modified": [],
  "removed": [{ "transaction_id": "no86Eox18VHMvaOVL7gPUM9ap3aR1LsAVZ5nc" }],
  "next_cursor": "CAESKgoaChYIARIQ...",
  "has_more": false
}
```

---

## 3. Supplementary cards are aggregated with no reliable card-level distinction

Plaid returns transactions from supplementary/authorized user cards, but **cannot reliably distinguish which physical card made a purchase**. All transactions aggregate under a single `account_id`. Plaid's documentation acknowledges this limitation directly:

> *"The `account_owner` field is not typically populated and only relevant when dealing with sub-accounts. A sub-account most commonly exists in cases where a single account is linked to multiple cards... If the account does have sub-accounts, this field will typically be some combination of the sub-account owner's name and/or the sub-account mask."*

The `account_owner` field format is **not standardized** and varies by institution. In practice, it is frequently blank — especially on the primary cardholder's transactions. Some third-party integrations (Nexonia, Workamajig) report that sub-cards may appear as separate entries in Plaid Link, with Plaid transferring sub-card data approximately 24 hours after the primary card is connected. But this behavior is inconsistent across institutions.

⚠️ **Bottom line**: If distinguishing primary vs. supplementary card transactions is important to your application, Plaid does not provide a reliable mechanism for this. You would need to build heuristic matching (e.g., based on merchant location patterns or the occasionally-populated `account_owner` field).

---

## 4. Pricing is opaque but feasible for personal use at $5–30/month

Plaid does not publish a public price list. Pricing is revealed only during the Production access application process. Here is what is known:

| Tier | Minimum spend | Best for |
|---|---|---|
| **Pay as You Go** | None | Hobbyist/personal projects |
| **Growth** | Annual commitment | Businesses up to ~$6K/month API usage |
| **Custom** | Higher commitment | High-volume businesses |

**Free options**: The **Sandbox** environment is completely free with unlimited API calls using fake data. **Limited Production** provides **200 free API calls per product** against real bank connections — enough for approximately 2–3 months of light use with 4–5 accounts syncing weekly.

**Estimated ongoing cost**: The Transactions product uses **subscription billing** — a monthly fee per connected Item (bank connection) as long as the access token exists. Community reports suggest approximately **$1.50 for initial connection + $0.30/month per Item** for Transactions, putting a 4-account setup at roughly **$5–10/month**. A Beancount community estimate from January 2026 pegged personal use at $5–30/month depending on usage patterns.

⚠️ **Access gating**: You must apply for Production access and describe your use case. Plaid reviews applications and can reject or terminate accounts. Their terms explicitly state development accounts are for "internal evaluation" only — you need a paid Production account for any real usage. Accounts inactive for 3 months may be deactivated.

---

## 5. Transactions refresh 1–4 times daily with up to 24 months of history

Plaid is **not real-time**. Transaction data refreshes automatically **1–4 times per day** depending on the institution. You can force an immediate refresh via the `/transactions/refresh` endpoint (billed per request). Typical latency between a transaction posting at the bank and appearing in Plaid is several hours to one business day.

**Historical depth** on initial connection is **up to 24 months** (730 days, configurable via `days_requested`). Data loads in two phases: ~30 days of recent transactions arrive quickly, followed by the full historical backfill which takes longer. Plaid fires webhooks to signal when each phase completes.

**Recommended sync approach**: Use `/transactions/sync` (cursor-based) rather than the legacy `/transactions/get` (date-range). The sync endpoint returns `added`, `modified`, and `removed` arrays — a clean patch model for maintaining a local database. Listen for `SYNC_UPDATES_AVAILABLE` webhooks to trigger sync calls.

**Pending-to-posted lifecycle**: Plaid does not update pending transactions in-place. Instead, the pending transaction is *removed* and a new posted transaction is *added* with `pending_transaction_id` linking back to the original. Amount, merchant name, and date may all change during this transition (e.g., restaurant tips added after authorization).

---

## 6. Plaid Link handles authentication, but Canadian re-auth frequency is a pain point

The connection flow uses **Plaid Link**, a mandatory client-side UI widget. The technical sequence is: your server creates a `link_token` → your client opens Plaid Link → the user selects their bank, enters credentials, completes MFA → Link returns a `public_token` → your server exchanges it for a permanent `access_token`.

**Re-authentication** is the major friction point for Canadian banks. Since most Canadian connections still use **credential-based (non-OAuth) screen scraping**, connections break whenever the user changes their password, updates MFA settings, or when the bank modifies its login flow. When this happens, Plaid fires an `ITEM_LOGIN_REQUIRED` webhook, and you must launch Link in "update mode" for the user to re-authenticate. For American Express specifically, community reports indicate re-authentication may be required **daily** due to perpetual 2FA requirements.

Only **RBC** has a confirmed OAuth-based API agreement with Plaid in Canada (June 2022), which should provide more stable, token-based connections without stored credentials. The other five banks likely still rely on screen scraping.

**Available SDKs**: Server-side libraries for Node.js, Python, Ruby, Java, and Go (all auto-generated from OpenAPI spec). Client-side Link SDKs for Web/JavaScript, React, iOS, Android, and React Native. Community libraries exist for Flutter, .NET, Elixir, and others.

---

## 7. SimpleFIN Bridge is the strongest alternative for a personal project

### Comparison of alternatives

| Alternative | Canadian coverage | Credit cards | Pricing | Personal-use viable | Assessment |
|---|---|---|---|---|---|
| **SimpleFIN Bridge** ⭐ | Good (via MX backend) | ✅ Yes | **$15/year** | ✅ Yes | Best option for personal use |
| **Flinks** | Best in Canada | ✅ Yes | Enterprise only | ❌ No | Requires sales contact; not for individuals |
| **MX** | Good | ✅ Yes | ~$15K+/year | ❌ No | Enterprise only; access via SimpleFIN instead |
| **Yodlee** | Good globally | ✅ Yes | Enterprise | ❌ No | Dated developer experience |
| **Akoya** | US only | N/A | N/A | ❌ No | No Canadian bank participation |
| **Teller** | US only | N/A | Free tier available | ❌ No (US only) | Irrelevant for Canada |
| **Wealthica** | Excellent (investments) | Limited | $50–250/year | ✅ Yes | Investment-focused, not bank transactions |
| **Manual CSV/OFX** | All banks | ✅ Yes | Free | ✅ Yes | Manual but no dependencies |

**SimpleFIN Bridge** stands out for personal projects. At **$1.50/month** ($15/year), it provides a simple REST API backed by MX's 16,000+ institution connections. You connect banks on SimpleFIN's site, receive an access token, and pull data with simple HTTP requests. Limitations include once-daily updates, max 90 days historical data, and a 24 requests/day rate limit — all acceptable for personal budgeting. Compatible apps include Actual Budget, Buckets, and Beancount.

### Canada's Consumer-Driven Banking framework is the long-term game-changer

Canada's **Consumer-Driven Banking Act** received Royal Assent (Part 1) in June 2024. Bill C-15, containing the comprehensive framework, was tabled in November 2025. **Phase 1 (read-only API access) targets early 2026**, with Phase 2 (payment initiation) targeting mid-2027.

The framework's most significant provisions for your project:

- **Screen scraping will be banned** once the framework is operational, forcing all aggregators to use standardized APIs
- **Mandatory participation** for Schedule I banks above retail volume thresholds (expected to include all Big 6)
- The **Bank of Canada** will oversee accreditation of third-party service providers
- Aggregators like Plaid and Flinks must become **accredited entities** to continue operating
- **$25.7 million** allocated over 5 years for security infrastructure
- A new **data-mobility right** under PIPEDA amendments will give consumers explicit legal authority to direct banks to share their data

⚠️ **Timeline risk**: While "early 2026" is the stated target, implementing regulations and technical standards are still being developed. Multiple legal analyses note significant regulatory details remain unresolved. The framework's completion could slip.

---

## 8. The biggest risks are connection reliability and the imminent screen-scraping ban

### Plaid Canada vs. US: key gaps

The **Liabilities product** is unavailable in Canada — you cannot retrieve credit card APR, minimum payments, or due dates. Transfer, Signal, Statements, Beacon, and Layer products are also absent. Institution coverage nominally reaches 99%+ of deposit accounts, but real-world connection success rates lag the US dramatically because most Canadian connections still rely on screen scraping rather than direct APIs.

### Data accuracy

Plaid claims **>90% categorization accuracy** (some marketing materials cite ~98%). Currency handling is straightforward — Canadian accounts return CAD amounts with `iso_currency_code: "CAD"`. Cross-border accounts (e.g., US-dollar Amex cards) may return USD. The pending-to-posted transaction lifecycle can cause **apparent duplicates** if you don't properly handle the removal/addition cycle using `pending_transaction_id`. Balance data may be cached unless explicitly refreshed.

### Terms of service for personal use

⚠️ Plaid's terms include individuals as valid clients, and the Pay-as-you-go tier has no minimums. However, the development environment explicitly cannot be used for production. Plaid can terminate accounts "for any or no reason" and deactivates accounts after 3 months of inactivity. For a single-user project where you are both developer and sole user, you exist in a grey area — technically compliant, but not the intended use case.

### Rate limits are a non-issue for personal use

The most restrictive relevant limit is `/transactions/refresh` at 2 calls per minute per Item — more than sufficient for a personal project. `/transactions/sync` allows 50 calls per minute per Item.

---

## Key findings and risks

1. **⚠️ CIBC is broken on Plaid** — a 4% success rate makes it functionally unusable. Since CIBC is one of your four must-have issuers, Plaid alone cannot serve your launch requirements.

2. **Screen scraping underlies most Canadian connections**, causing the 40–96% auth failure rates you see across your target banks. Only RBC has a confirmed API agreement with Plaid. This will structurally change once Canada's open banking framework goes live, but that timeline is uncertain.

3. **SimpleFIN Bridge at $15/year is the most practical alternative** for a single-user personal project. It uses MX as its backend, offers a simple REST API, and avoids Plaid's enterprise-oriented pricing and access gating. Its limitations (daily refresh, 90-day history max) are acceptable trade-offs for personal budgeting.

4. **American Express re-authentication is a known, unresolved issue.** The perpetual 2FA requirement causes daily or near-daily disconnections across all aggregators, not just Plaid. Expect ongoing friction with Amex regardless of which provider you choose.

5. **Plaid's transaction data is genuinely rich** — normalized merchant names, ML-driven categorization with confidence scores, merchant logos, location data, and a clean cursor-based sync model. If connections were reliable, the data quality would be excellent.

6. **Canada's Consumer-Driven Banking framework could resolve all connectivity issues** by mandating standardized bank APIs and banning screen scraping. Phase 1 targets early 2026, but regulatory details remain incomplete. This is the right long-term bet, but not something to depend on for a near-term launch.

7. **Supplementary card transactions are included but indistinguishable** — all transactions aggregate under one account with no reliable card-level identifier. If tracking spending by cardholder matters, you'll need to build your own heuristics.

8. **Recommended strategy**: Start with **SimpleFIN Bridge** for immediate, low-cost access to your Canadian credit card transactions. Use **manual CSV/OFX exports** as a fallback for any institution SimpleFIN doesn't handle reliably (especially CIBC and Amex). Monitor Canada's open banking rollout — when Phase 1 launches, re-evaluate whether Plaid or another accredited provider offers reliable, standardized API access to all your target issuers.