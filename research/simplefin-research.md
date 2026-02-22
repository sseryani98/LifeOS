# SimpleFIN Bridge for Canadian personal finance: a complete assessment

**SimpleFIN Bridge can connect to all six of your target Canadian banks, but Scotiabank poses a serious reliability risk and the transaction data you'll receive is far sparser than Plaid's.** At $15/year with zero developer costs, SimpleFIN offers an unmatched price-to-simplicity ratio for personal finance automation. However, its reliance on MX's screen scraping for four of your six banks means frequent re-authentication interruptions, and Canada's incoming open banking legislation could disrupt the entire model within 12–18 months. Your existing assumptions are mostly correct but need refinement: the historical depth, refresh cadence, and rate limits are accurate, while the data schema is significantly more limited than you may expect.

---

## Your six Canadian banks: two excellent, one dangerous, three adequate

All six target institutions are supported by SimpleFIN Bridge via MX, but connection quality varies dramatically based on whether MX has a direct API partnership or relies on screen scraping.

**CIBC and American Express Canada are the strongest connections.** CIBC signed a direct API data-access agreement with MX in August 2022 — MX's first Canadian bank partnership. American Express followed with a global OAuth2-based API agreement announced November 7, 2024. Both connections eliminate credential sharing entirely, use tokenized access, and MX states that API connections "last years, not months." Credit card accounts are explicitly covered under both agreements. Re-authentication should be very infrequent.

**TD Bank, RBC, and BMO rely on screen scraping**, with no public MX API partnerships. TD's known data-access agreement is with Finicity (Mastercard), not MX. RBC has API deals with Plaid and Yodlee but not MX. BMO has no announced API deal with any aggregator. For all three, expect periodic re-authentication every few weeks to months, triggered by 2FA challenges (SMS, email, or app-based). User reports from the Tiller Community indicate RBC "works well" through MX-powered aggregation. No specific breakage reports were found for TD or BMO, but screen-scraped connections are inherently fragile — bank website changes, CAPTCHAs, and IP blocking can cause silent failures.

**Scotiabank is the critical risk.** It has no data-access agreement with any aggregator and relies entirely on screen scraping. More problematically, **Scotiabank uses app-based-only 2FA**, which means every automated connection attempt may trigger a manual approval on the user's phone. A Quicken Simplifi user reported needing to "manually confirm with my bank's 2FA every single time" for Scotiabank — a pattern incompatible with automated daily syncing. Scotiabank also historically rejected aggregation explicitly (Globe and Mail reporting). This bank is your most likely point of failure at launch, and you should plan a CSV-import fallback.

| Bank | Connection type | Credit cards | 2FA risk | Re-auth frequency | Reliability |
|------|----------------|-------------|----------|-------------------|-------------|
| **CIBC** | Direct API (MX partnership, Aug 2022) | ✅ Confirmed | Low | Very infrequent | **High** |
| **Amex Canada** | Direct API/OAuth2 (MX partnership, Nov 2024) | ✅ Confirmed | Low | Very infrequent | **High** |
| **TD Bank** | Screen scraping | ✅ Expected | Medium | Weeks–months | Moderate |
| **RBC** | Screen scraping | ✅ Expected | Medium | Weeks–months | Moderate |
| **BMO** | Screen scraping | ✅ Expected | Medium | Weeks–months | Moderate |
| **Scotiabank** | Screen scraping | ✅ Expected | **High** (app-only) | **Very frequent** | **Low** |

Beyond your six targets, SimpleFIN/MX also covers Desjardins, National Bank of Canada, Tangerine, Simplii Financial, MBNA, Canadian Tire Bank, EQ Bank, Manulife Bank, Meridian Credit Union, ATB Financial, Rogers Bank, Wealthsimple Cash, PC Financial, and dozens of others — though reliability varies per institution.

---

## The transaction data schema is deliberately minimalist

SimpleFIN's protocol (v1.0.7-draft) returns a sparse data structure that will require you to build your own merchant normalization and categorization layers. Here is the actual schema:

```json
{
  "errors": [],
  "accounts": [
    {
      "org": {
        "domain": "mybank.com",
        "sfin-url": "https://sfin.mybank.com",
        "name": "My Bank"
      },
      "id": "2930002",
      "name": "Savings",
      "currency": "CAD",
      "balance": "100.23",
      "available-balance": "75.23",
      "balance-date": 978366153,
      "transactions": [
        {
          "id": "12394832938403",
          "posted": 793090572,
          "amount": "-33293.43",
          "description": "Uncle Frank's Bait Shop",
          "pending": true,
          "transacted_at": 793090572,
          "extra": {
            "category": "food"
          }
        }
      ]
    }
  ]
}
```

**What you get:** transaction `id` (unique within account, usable for deduplication), `posted` timestamp (UNIX epoch; `0` if pending), `amount` (numeric string; negative = withdrawal), `description` (raw bank text — **not cleaned or normalized**), optional `pending` boolean, optional `transacted_at` timestamp, and an optional `extra` object that may contain a `category` field but with no guaranteed taxonomy.

**What you don't get:** No MCC (Merchant Category Code), no standardized category hierarchy, no merchant name normalization, no location data, no merchant logos, no payment channel classification, no recurring transaction detection. The `description` field passes through whatever the bank provides — expect strings like `"AMZN MKTP US*2K4R..."` rather than `"Amazon"`. Actual Budget GitHub Issue #5336 confirms payee names differ between SimpleFIN imports and direct OFX downloads from the same bank.

**Compared to Plaid, the gap is substantial.** Plaid returns a cleaned `merchant_name`, a detailed category taxonomy with 98% coverage, physical location data (address, lat/long), payment channel (online/in-store), authorized vs. posted dates, and supports up to **24 months** of historical data versus SimpleFIN's 90 days. Plaid also offers a recurring transaction detection endpoint available in Canada. No direct head-to-head comparison of SimpleFIN vs. Plaid data for the same Canadian bank exists in any public forum, but the structural differences are clear from their respective API specifications. MX does have a "Data Enhancement" product with 119+ granular categories and merchant enrichment, but **this enrichment does not flow through to SimpleFIN** — the SimpleFIN protocol only exposes the basic fields.

---

## Supplementary cards cannot be distinguished

**SimpleFIN cannot tell you which physical card on an account made a transaction.** This is an industry-wide limitation, not specific to SimpleFIN. The protocol operates at the account level — there is no field for card number, cardholder name, or card identifier. All transactions from primary and supplementary cards appear aggregated under the single account.

This limitation extends to MX (SimpleFIN's backend) and Plaid alike. The root cause is that most banks don't expose card-level attribution in their data feeds. NerdWallet's August 2023 analysis found that Chase, Wells Fargo, Bank of America, and US Bank provide no way to sort transactions by card user. **American Express is the notable exception** — Amex breaks down transactions by card number, and authorized user logins show only that user's transactions. If a supplementary Amex cardholder creates their own login and connects independently through SimpleFIN, only their transactions would appear as a separate "account." For all other issuers, manual tagging is the only option.

---

## Pricing is confirmed at $15/year with a generous model for developers

The **$15/year (or $1.50/month)** flat-rate pricing remains current as of 2025–2026 with no evidence of changes since at least 2024. The pricing includes up to **25 financial institutions** and **25 connected apps** per subscription.

The most distinctive aspect of SimpleFIN's pricing model is that **developers pay nothing**. SimpleFIN operates on a user-pays model: each end user maintains their own $15/year subscription and controls their own data access. Your app simply integrates against the protocol. This is fundamentally different from Plaid or MX direct, where the developer pays per connection. For a personal finance app, this means your users absorb the $15/year cost themselves.

**A free developer sandbox exists.** The developer guide at `beta-bridge.simplefin.org/info/developers` provides a demo Setup Token on every page load, connecting to synthetic data (fake checking/savings accounts with sample transactions). You can test the full authentication flow and data retrieval without paying. There are no per-API-call costs, no usage tiers, and the Terms of Use do not differentiate between personal and commercial use. SimpleFIN is operated by One Part Rain, LLC (the same company behind Buckets budgeting app).

---

## Daily polling with no webhooks and a 90-day ceiling

Your assumptions about refresh cadence are correct. SimpleFIN pulls new data **approximately once every 24 hours** per linked account. The specific refresh time varies by bank and day, determined by MX's upstream scheduling. There is no real-time, on-demand, or near-real-time option. The protocol is described by its creators as "like RSS for financial data."

**There is no webhook support** — SimpleFIN is strictly polling-only. You must issue `GET /accounts` requests to check for new data. Historical transaction depth on initial connection is **up to 90 days**, though actual depth varies by institution (some banks provide only 30–60 days). Each API request is capped at a **60-day date range** between `start-date` and `end-date`, so pulling the full 90 days requires multiple requests.

**Pending transactions** are available but opt-in: add `?pending=1` to your request. When pending, the `posted` timestamp is `0` and the `pending` field is `true`. When the transaction posts, it receives a real timestamp and `pending` becomes `false` or is removed. The transaction `id` should remain stable through this lifecycle, enabling deduplication. Actual Budget handles this by importing pending transactions as "uncleared" and later marking them "cleared."

**Rate limiting is set at 24 requests per day** per access token for the `GET /accounts` endpoint. Per-account requests (filtered with `?account=...`) have their own separate quota. Quotas replenish throughout the day, not all at midnight, and there is "a little leeway" above the limit during initial setup. Enforcement is progressive: warnings appear in the `errors` array first, then access tokens are disabled if abuse continues. For a personal daily-sync use case, 24 requests/day is adequate — you'd typically need just 1–2 requests per sync cycle.

---

## A clipboard-based auth flow with no official SDKs

SimpleFIN uses an unusual **clipboard-based token exchange** rather than OAuth or embedded credential entry:

1. Your app sends the user to `https://bridge.simplefin.org/simplefin/create`
2. The user logs into SimpleFIN Bridge (via email magic link or passkey — no passwords), connects their banks through MX's interface, and generates a **Setup Token** (Base64-encoded URL)
3. The user copies this token and pastes it back into your app
4. Your app decodes the token, POSTs to the claim URL (one-time), and receives a permanent **Access URL** with HTTP Basic Auth credentials
5. All subsequent data retrieval uses this Access URL

When bank connections break (password change, MFA reset), the `errors` array in API responses will contain `"You must reauthenticate."` — your app must surface this to users, who then visit SimpleFIN's dashboard to re-authenticate. Your Access URL remains valid; only the bank-side MX connection needs refreshing. **SimpleFIN does not proactively notify you of broken connections** (confirmed by Lunch Flow, which positions its notification feature as an advantage over SimpleFIN).

**No official SDKs exist** in any language. SimpleFIN provides only Python and Bash/cURL examples in its developer guide. Community libraries include: Actual Budget's Node.js implementation (`app-simplefin.js`), a Swift library (`Effywolf/SwiftFin`), a Python library (`simplefin4py` on PyPI, used by Home Assistant), and a Go Prometheus exporter. The entire API surface is just 4 endpoints (`GET /info`, `GET /create`, `POST /claim/:token`, `GET /accounts`), so building a client from scratch is straightforward. The protocol specification remains at **v1.0.7-draft** — still technically a draft, though it has been stable for years.

---

## The integration ecosystem is small but actively maintained

SimpleFIN's consumer base centers on **privacy-focused, self-hosted personal finance tools**. The official ecosystem page lists six apps: **Buckets** (first-party, same company), **Actual Budget** (largest third-party integration, 23.5k+ GitHub stars), **SimpleFIN Bridge** itself, **Skwad**, **Sparky Budget**, and **EnvelopeBudget**. Beyond the official list, community integrations include **Firefly III** (active development with known duplicate-handling issues), **Home Assistant** (core integration since v2024.8, 45 active installations), **Beancount/Ledger** (via `sfin2ledger` and custom importers), a **YNAB sync script** (unofficial), **Maybe Finance**, and a **Google Sheets** connector.

Actual Budget is the primary health indicator. Its SimpleFIN integration has been through active development since January 2024, with multiple bug reports and fixes spanning 2024–2025, including timeout issues with many accounts (7+ institutions), `INVALID_ACCESS_TOKEN` errors (December 2025), and payee name mismatches. These issues predominantly live in Actual's integration layer, not in SimpleFIN itself. The Beancount community shows recent activity (September 2025) with users connecting 6+ institutions and 20+ accounts successfully.

**Operational risk is elevated.** SimpleFIN is a two-person operation (the developer and his wife, per a November 2021 blog post). The production URL is still `beta-bridge.simplefin.org`. The protocol is still in "draft." There is no public Discord or forum — support is via email. GitHub activity is low-moderate (protocol website last updated February 2026). SimpleFIN's stated mission is literally "to not exist" — it views itself as a temporary bridge until banks implement standardized APIs. This philosophical stance, combined with the tiny team, introduces long-term continuity risk.

---

## Canada's open banking framework poses an existential medium-term risk

**Canada's Consumer-Driven Banking Act (CDBA), tabled as part of Bill C-15 on November 18, 2025, includes a broad prohibition on screen scraping that would fundamentally disrupt SimpleFIN's Canadian operating model.** Phase 1 (read-only data access) officially targets early 2026, though passage of Bill C-15 and supporting regulations makes this timeline optimistic. Phase 2 (payment initiation) targets mid-2027.

The framework requires all participants — including aggregators — to be **accredited by the Bank of Canada**. MX could seek accreditation as a "third-party service provider" performing consent management and data movement on behalf of banks, but cannot independently access data. SimpleFIN, as a tiny wrapper around MX, would likely need to rely entirely on MX's accreditation status. Banks meeting retail volume thresholds (expected to include all Big Six) will be mandated to provide standardized API access for deposit accounts, credit cards, lines of credit, mortgages, and investment products — **free of charge**.

The screen-scraping ban is unusually broad. McCarthy Tétrault's analysis notes it purports to ban all screen scraping for providing products or services, not just within the open banking context. The ban takes effect once the framework is "fully operational," with the specific timeline subject to stakeholder consultation. Industry voices like Fintechs Canada have cautioned against premature enforcement, arguing the ban should only apply "once open banking is working effectively."

**For your planning horizon, this creates three scenarios.** In the optimistic case (Phase 1 operational by late 2026), standardized APIs would dramatically improve connectivity to all Big Six banks, potentially making SimpleFIN unnecessary but also giving MX a path to API-based access. In the realistic case (Phase 1 delayed into 2027), SimpleFIN continues working via screen scraping for another 1–2 years. In the pessimistic case (legislative stalls), the current screen-scraping status quo persists indefinitely. MX is actively positioning for the transition — it published a blog post in November 2025 welcoming the CDBA and is a member of the FDX Canada Working Group alongside all Big Five banks.

**Flinks, the Canadian-native aggregator 80% owned by National Bank of Canada ($103M acquisition in 2021), is best positioned for the open banking transition.** It already operates direct API connections with National Bank and EQ Bank, claims roughly 1 in 3 Canadians have connected through its platform, and is building an accreditation-partner model that mirrors the CDBA's framework. However, Flinks' Quickstart pricing starts at $500/month — prohibitive for a personal project.

---

## Conclusion: viable for launch, but plan your escape routes

SimpleFIN Bridge works for your immediate needs at an unbeatable price point. CIBC and Amex will connect reliably via direct MX API partnerships. TD, RBC, and BMO will function through screen scraping with periodic re-authentication friction. **Scotiabank is your launch blocker** — its app-only 2FA and anti-aggregation history make reliable automated syncing unlikely, and you should implement CSV import as a fallback from day one.

The data you'll receive is raw and sparse. You will need to build or integrate your own merchant name normalization (consider Plaid Enrich or Ntropy as enrichment layers) and transaction categorization. Supplementary card distinction is impossible through any aggregator — this is a bank-level limitation across the industry, with Amex as the only partial exception.

Three strategic realities should shape your architecture decisions. First, SimpleFIN's minimal schema means your app's intelligence must live in your own processing pipeline, not in the data source. Second, the daily-refresh-only cadence with no webhooks means designing for batch processing rather than real-time updates. Third, Canada's open banking framework will likely reshape the aggregation landscape within 18–24 months — architect your data ingestion layer with an abstraction that can swap SimpleFIN for standardized bank APIs or alternative aggregators when that transition occurs. SimpleFIN's own creators expect exactly this outcome.
