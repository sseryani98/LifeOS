# Design Decisions Log

All decisions made during the discovery and design phases. Each decision is referenced by ID in design documents.

## How to Read This Log

- **Decision ID**: Referenced in all design documents (e.g., D-01)
- **Context**: What question or gap prompted this decision
- **Options Considered**: What alternatives were discussed
- **Decision**: What was chosen
- **Rationale**: Why

---

## D-01: Transaction Source

- **Context:** How do transactions get into the system?
- **Options:** Manual web entry (original spec), CSV import, Plaid API, web scraping
- **Decision:** ~~Plaid API as primary source. CSV for historical backfill only.~~ **Amended by D-30 (Aggregator Spike).** Provider-abstracted ingestion layer. SimpleFIN Bridge as V1 provider. CSV for historical backfill and Scotiabank ongoing.
- **Rationale:** Manual effort killed the Excel approach. Automation is the foundation - without it, the system won't be used. ~~Plaid covers all 4 current issuers.~~ Aggregator spike (Step 2) revealed Plaid has a 4% success rate for CIBC and daily re-auth issues with Amex. SimpleFIN/MX has direct API partnerships with CIBC and Amex. Architecture is provider-agnostic to support future CDB transition. See D-30 for full rationale.

## D-02: Supplementary Card Attribution

- **Context:** Plaid pulls all transactions under one account. Can't always distinguish main vs supp card.
- **Options:** A) Always roll up to main, B) Always require attribution, C) Conditional
- **Decision:** C - Roll up to main card by default. Only require attribution when supp has an active signup bonus.
- **Rationale:** Attribution only matters for signup bonus tracking. Adding friction for every transaction is unnecessary.

## D-03: New Card Onboarding

- **Context:** User opens 6-8 cards/year. What's the registration flow?
- **Options:** A) Register in app first, B) Plaid detects and prompts, C) Both
- **Decision:** A - Register in app first. Unmatched Plaid transactions queue until card is registered.
- **Rationale:** The app needs card metadata (market card reference, offer, activation date) before it can properly process transactions.

## D-04: Credit Card Fees

- **Context:** Annual fees appear as Plaid transactions. Budget expense or churning cost?
- **Options:** A) Churning only, B) Budget only, C) Both
- **Decision:** C - Purchase Type "Subscriptions" / Subtype "Credit Card Fee" for budget AND deducted from churning net value.
- **Rationale:** It's real money spent (budget) and a cost of the hobby (churning profitability).

## D-05: Category Taxonomies

- **Context:** Transactions need categorization for both budget and churning purposes.
- **Options:** Single taxonomy, two linked taxonomies, two independent taxonomies
- **Decision:** Two independent taxonomies. Purchase Type (budget) and Earning Category (churning). Both auto-learned.
- **Rationale:** They overlap but aren't 1:1. Netflix = "Subscriptions" for budget but "Streaming" for earning multipliers. Forcing them into one taxonomy would compromise accuracy on one side.

## D-06: Card Recommendation Logic

- **Context:** Which card should the user use for a given purchase?
- **Options:** A) Best earning rate only, B) Factor in signup bonuses, C) Side-by-side both views
- **Decision:** B - Factor in active signup bonuses, but only recommend the bonus-chasing card if the bonus value exceeds the earning difference.
- **Rationale:** Pure earning rate is the default, but the signup bonus override is the smart play when the math supports it. This is the decision Sandro makes manually today.

## D-07: Refund Handling

- **Context:** Refunds come through Plaid as negative transactions. Different systems should treat them differently.
- **Decision:** Budget: reversed (gives back discretionary room). Points earned: not reversed. Signup bonus progress: not reversed. Yield calculation: uses gross spend.
- **Rationale:** Mirrors actual credit card company behaviour. CC companies don't claw back points or reverse bonus progress on refunds.

## D-08: Shared Expenses / Splits

- **Context:** Sandro often pays for group activities (padel $110, friends reimburse $80 via e-transfer).
- **Decision:** Split feature with "my share" concept. Recurring splits remembered by system. Reimbursed transactions = split with 0% share. Churning always uses full amount, budget uses share.
- **Rationale:** Common pattern in Sandro's life. Padel is weekly. Family supp card spend also follows this pattern. Full card amount matters for points/bonus, but budget should only reflect actual cost to Sandro.

## D-09: Points Valuation

- **Context:** How to value unredeemed points?
- **Decision:** One CPP value per rewards program, user-adjustable. Calculated balance from (transactions x multipliers) + manual adjustments.
- **Rationale:** CPP is inherently subjective. A simple per-program value is pragmatic. Manual adjustments handle signup bonus deposits, transfers, and reconciliation.

## D-10: Redemption Tracking

- **Context:** Should redemptions just be "X points used" or more detailed?
- **Decision:** Rich records: points spent, program, dollar value received, effective CPP, description of what it was for.
- **Rationale:** Earning CPP vs burning CPP gap is a key metric. "Business class Toronto to Tokyo for 50k points" is also a memory worth keeping.

## D-11: Goals (Unified Concept)

- **Context:** Original spec had "planned expenses" as one thing. User also mentioned savings goals, FHSA targets, vacation planning.
- **Options:** Separate concepts (planned expenses + savings goals) or unified
- **Decision:** Unified "Goals" concept with direction flag (saving vs spending). Each has: target amount, timeline, user-defined monthly allocations (not auto-split), progress tracking, linked transactions.
- **Rationale:** Both are "future money with a target." Keeping them as one concept simplifies the model and the UX.

## D-12: Budget Rollover

- **Context:** Does surplus or deficit carry between months?
- **Options:** A) Clean slate, B) Rollover surplus and deficit, C) Rollover surplus only
- **Decision:** A - Clean slate. Each month starts fresh from the budget formula.
- **Rationale:** Simplicity. No compounding debt/surplus complexity.

## D-13: Historical Data

- **Context:** System is more useful with historical context. User doesn't track today.
- **Decision:** Backfill to 2023 via CSV import from past issuer statements. CSV import is a one-time migration tool, not an ongoing workflow.
- **Rationale:** 3 years of data makes dashboards immediately useful. CSV is the only option for pre-Plaid transactions.

## D-14: Market Card Offer Database

- **Context:** Should the system only track cards the user holds, or all major Canadian cards?
- **Decision:** Full database of ~50-100 major Canadian churning cards with historical offers. Maintained eventually via automated scraping + human approval. Scraping is deprioritized.
- **Rationale:** Enables "is this a good offer vs history?" decisions. Core value prop for a churner.

## D-15: Income Entry

- **Context:** How does income get into the system?
- **Decision:** Monthly lump sum, manually entered.
- **Rationale:** Plaid only covers credit cards. Income is simple enough to enter once per month.

## D-16: Alerts

- **Context:** How to notify about time-sensitive events (bonus deadlines, fee dates, cancellation dates)?
- **Decision:** Dashboard alerts only. No push notifications or email.
- **Rationale:** User is in the app weekly for the review session. Dashboard visibility is sufficient.

## D-17: Foreign Currency

- **Context:** Some transactions are in USD.
- **Decision:** Not tracked for now. CAD posted amount only.
- **Rationale:** USD transactions are rare. Not worth the complexity for V1.

## D-18: Primary Platform

- **Context:** What device is the primary interface?
- **Decision:** Desktop-first web application. No mobile optimization for V1.
- **Rationale:** Weekly review is a sit-down session at a desk.

## D-19: Points Transfers

- **Context:** Some programs allow transfers (e.g., Amex MR → Aeroplan).
- **Decision:** Manual balance adjustments only. No transfer partner network modeling.
- **Rationale:** Transfers are infrequent. Modeling the full network is over-engineering.

## D-20: Card Application Pipeline

- **Context:** Should the system track cards being considered for future application?
- **Decision:** No pipeline. Cards are registered after approval.
- **Rationale:** User doesn't want this level of tracking.

## D-21: Soft Perks

- **Context:** Cards have non-points benefits (lounge passes, travel credits, etc.).
- **Decision:** Track usage and remaining balance. Counts toward realized card value.
- **Rationale:** Part of total card value equation. "2 of 4 lounge passes used" is useful to know.

## D-22: Issuer Application Rules & Bonus Eligibility

- **Context:** Domain research reveals complex issuer-specific rules governing application timing and bonus eligibility (Amex 4-card limit, 1-in-5, 2-in-90; TD 12-month cooldown; RBC 1/90; Scotia 2-year; Aeroplan 5-tier cross-issuer lifetime limit). The PSV tracked card lifecycle but had no concept of these rules.
- **Options:** A) Store rules as read-only reference (user does the math), B) Store rules as reference data + compute eligibility from card history at runtime, C) Full eligibility entity with stored relational state
- **Decision:** B — Issuer application rules stored as reference data (SM30-style config). Eligibility computed at runtime from existing card history. No new relational links or stored eligibility state.
- **Rationale:** The system already captures card open/close dates and bonus received status. A reference table of rules + runtime computation is clean, avoids model complexity, and surfaces "eligible now" / "eligible in X days" on the dashboard. Aeroplan 5-tier tracking works the same way — scan card history for tier usage.

## D-23: Soft Perk Scope & Realized vs Unrealized

- **Context:** Domain research identified GCR/FlyerFunds cashback portal rebates ($50–$230 per card application) as a significant value component missing from the PSV. Discussion revealed these fit naturally under D-21's Soft Perks concept — both are non-points value associated with a card.
- **Options:** A) Track portal rebates as a separate concept, B) Treat portal rebates as a type of soft perk under D-21
- **Decision:** B — Portal rebates (GCR, FlyerFunds, CCG) are a type of soft perk. All soft perks carry a **realized/unrealized** status. Only realized perks count toward card profitability. Examples: GCR $120 rebate = realized when claimed. Nexus $100 rebate = unrealized if user didn't apply. 4 lounge passes at $30 each = 2 realized ($60), 2 unrealized ($60).
- **Rationale:** Avoids concept proliferation. Soft perks already existed (D-21) — this just broadens the scope and adds the key distinction that a perk can exist on a card without being used. Profitability formula updated: points earned + redemptions + realized perks − fees.

## D-24: Multi-Tranche Welcome Bonus Structure

- **Context:** Domain research reveals many cards split welcome bonuses across multiple tranches with different timelines (e.g., Amex Platinum: 80K MR after $10K/3 months + 30K MR in months 15–17; Cobalt: 1,250 MR/month for 12 months at $750/month MSR). The PSV assumed a single bonus with a single spend target. OI-05 deferred "multi-tier completion."
- **Options:** A) Model as single bonus (ignore tranches), B) Model offer with an ordered list of bonus tranches, each with its own MSR/deadline/payout
- **Decision:** B — An offer consists of one or more bonus tranches. Each tranche has: MSR amount, MSR window (one-time deadline or monthly recurring), bonus amount, and tranche status (pending / in progress / met / missed). Monthly MSR patterns (Cobalt-style) are a tranche type where the window resets monthly.
- **Rationale:** Without this, the system can't show "Tranche 1 complete, Tranche 2 unlocks at month 15" or alert that cancelling early forfeits remaining tranches worth hundreds of dollars. Directly impacts the keep/cancel/PS decision at AF renewal. Resolves OI-05's "multi-tier completion" concern.

## D-25: Card Type & Segment Attributes

- **Context:** Domain research reveals Amex distinguishes between credit cards (4-card limit, 1-in-5, 2-in-90 rules) and charge cards (unlimited, exempt from those rules). Additionally, personal and business cards are treated as separate products for the once-per-lifetime rule. D-22's eligibility computation cannot evaluate Amex rules without these attributes.
- **Decision:** Market card reference data carries two classification attributes: **card type** (credit card / charge card) and **card segment** (personal / business). Both are fields on the market card definition, not new entities.
- **Rationale:** Required for D-22 to correctly compute Amex eligibility. Also useful for filtering and reporting (e.g., "how many Amex credit card slots do I have left?"). Minimal cost — just two fields on existing reference data.

## D-26: Referral Bonus Tracking

- **Context:** Domain research identifies referral bonuses as a significant points earning channel (e.g., 10,000–15,000 MR per Amex referral, with annual caps up to 300,000 MR). Referral points don't come from spending — they're a separate income stream not captured in the PSV.
- **Options:** A) Ignore referrals (out of scope), B) Track as a categorized manual points adjustment on the referring card, C) Full referral entity with recipient tracking
- **Decision:** B — Referral bonuses are a type of manual points adjustment (per D-09) tagged to the referring card. Metadata: referring card, bonus amount, program, date, optional note (who was referred). Credits the referring card's profitability. No need to model the recipient.
- **Rationale:** Keeps it simple — referrals are points income attributed to a card, just like welcome bonuses. The referring card gets credit in the profitability calculation. Doesn't require a new entity, just a categorization of an existing adjustment type.

## D-27: First Year Free (FYF) Tracking

- **Context:** Domain research shows many cards waive the annual fee in year one (TD Aeroplan VI $139, CIBC Aventura VI $120, Scotia Gold Amex $120, etc.). The PSV tracks fees (D-04) but doesn't distinguish FYF from paid years. This causes incorrect profitability in year one and misses the nuance in the AF renewal alert — year one is "first AF coming, decide if card is worth keeping" vs later years' "pay again?"
- **Decision:** FYF is an attribute on the card instance (the specific offer the user signed up for). The system tracks the actual AF paid per year, not just the standard AF. Year one with FYF = $0 actual AF. The AF renewal alert differentiates between first AF (new decision point) and subsequent renewals.
- **Rationale:** Small field, meaningful impact. Profitability in year one is overstated if the system deducts an AF that was never charged. And the "first AF approaching" alert is the most important keep/cancel decision point for a churner.

## D-28: Fee Structure Variant (Annual vs Monthly)

- **Context:** Domain research shows the Amex Cobalt charges $15.99/month ($191.88/year) instead of a traditional annual fee. This affects how fees appear in Plaid transactions (12 monthly charges vs 1 lump sum), how profitability is computed, and the cancel decision (no pro-rated refund concern — just stop paying).
- **Decision:** Market card reference data carries a **fee structure** attribute: annual or monthly. The fee amount is stored accordingly (annual amount or monthly amount). The system normalizes to annual for profitability calculations but uses the actual structure for Plaid transaction recognition and display.
- **Rationale:** Sandro holds the Cobalt. Without this, 12 monthly fee transactions would be unrecognized or misclassified. Minimal cost — one field on market card reference data plus normalization logic for calculations.

## D-29: Additional Market Card & Card Instance Attributes

- **Context:** Domain validation identified several missing reference data and card instance fields needed for complete card tracking and D-22 eligibility computation.
- **Decision:** Add the following attributes:
  - **Market card reference data:** card network (Visa / Mastercard / Amex), Aeroplan tier (Entry / Core / Premium / Core Business / Premium Business, nullable for non-Aeroplan cards)
  - **Card instance (user's specific card):** card number (encrypted), CVV (encrypted), expiry date (encrypted), credit limit
- **Rationale:** Card network is useful for filtering and display. Aeroplan tier is required for D-22's cross-issuer 5-tier lifetime rule computation. Card instance fields (number, CVV, expiry) serve as a quick reference so the user doesn't need to pull out the physical card. Credit limit is relevant for display and potential future PS eligibility checks. **Security note:** encrypted card details require careful encryption design during technical architecture — flagged as OI-08.

## D-30: V1 Aggregator Provider (Amends D-01)

- **Context:** Aggregator spike (Step 2) researched Plaid and SimpleFIN Bridge against the 4 must-have Canadian issuers. Plaid's CIBC connection has a 4% success rate (functionally broken), Amex requires daily re-authentication, and pricing is $5–30/month with access gating. SimpleFIN Bridge (MX backend) has direct API partnerships with CIBC (Aug 2022) and Amex (OAuth2, Nov 2024), costs $15/year flat, and has no access gating.
- **Options:** A) Plaid as V1 provider, B) SimpleFIN as V1 provider, C) Hybrid (SimpleFIN for CIBC/Amex, Plaid for TD/RBC/BMO)
- **Decision:** B — SimpleFIN Bridge as the sole V1 aggregator provider. CSV import as fallback for any issuer SimpleFIN cannot handle reliably (specifically Scotiabank). Architecture uses a provider-abstraction layer so the aggregator can be swapped for Plaid, direct bank APIs, or a CDB-compliant provider when Canada's open banking framework goes live.
- **Rationale:** SimpleFIN solves the two biggest Plaid problems (CIBC broken, Amex re-auth) via direct MX API partnerships. Pricing is dramatically better ($15/year vs $5–30/month). No access gating risk. The trade-off is sparser transaction data (raw bank descriptions, no enriched categories) — accepted and addressed by D-32 (in-house categorization). Plaid remains a future option when CDB mandates standardized bank APIs.

## D-31: Scotiabank Automation Strategy

- **Context:** Neither Plaid (60% success, screen scraping) nor SimpleFIN/MX (screen scraping + app-only 2FA) can reliably automate Scotiabank. Scotia has no data-access agreement with any aggregator and historically blocks aggregation attempts. App-based-only 2FA means every connection attempt may require manual phone approval — incompatible with automated daily syncing.
- **Options:** A) Accept unreliable automated syncing and re-auth frequently, B) CSV import as primary for Scotia, C) Drop Scotia support until CDB
- **Decision:** B — CSV import is the primary transaction source for Scotiabank. SimpleFIN connection can be attempted but is not relied upon. CSV import (already built for D-13 historical backfill) is extended as an ongoing workflow for Scotia.
- **Rationale:** The "15-minute weekly session" promise cannot depend on an issuer that may require manual 2FA approval on every sync. CSV export from Scotia's website is reliable and within the user's control. When CDB Phase 1 mandates standardized APIs for all Big Six banks, Scotia will be migrated to the automated aggregator. This means the CSV import tool (conversion object) must support ongoing use, not just one-time migration.

## D-32: Transaction Categorization Strategy

- **Context:** SimpleFIN returns raw bank descriptions (e.g., `"AMZN MKTP US*2K4R..."`) with no merchant normalization, no standardized categories, and no MCC codes. The vision targets ~90%+ auto-categorization accuracy across both Purchase Type (budget) and Earning Category (churning) taxonomies. Plaid Enrich was considered as an external enrichment API but requires Plaid Production access (access gating risk) and adds cost and dependency.
- **Options:** A) Use Plaid Enrich API to normalize and categorize SimpleFIN data, B) Build categorization entirely in-house, C) Use another enrichment API (Ntropy, etc.)
- **Decision:** B — Build merchant normalization and dual-taxonomy categorization entirely in-house. No external enrichment API dependency.
- **Rationale:** Keeps the system fully self-contained with no external API costs or access gating risks. The transaction volume is manageable (~100–300/month across 4–5 cards). A rules-based engine with merchant name → category mapping, seeded by initial data analysis and refined through user corrections (already planned in D-05), can reach the 90%+ target. The learning-from-corrections model means accuracy improves over time. If CDB standardizes richer transaction data in the future, the categorization engine benefits from better inputs without architectural change.

## D-33: Amex Supplementary Card Workaround

- **Context:** D-02 established that supplementary card transactions are aggregated with no reliable card-level distinction. SimpleFIN research confirmed this is industry-wide. However, American Express is the one exception: Amex breaks down transactions by card number, and authorized user logins show only that user's transactions. If a supplementary Amex cardholder creates their own Amex online login and connects independently through SimpleFIN, their transactions appear as a separate account.
- **Decision:** Document the Amex-specific workaround as an optional enhancement to D-02. For Amex supplementary cards, the cardholder can create a separate Amex login and connect it as an independent SimpleFIN account. The system links this account to the supplementary card instance, enabling automatic card-level attribution for Amex. For all other issuers, D-02's conditional attribution (manual when supp has active bonus) remains the approach.
- **Rationale:** Three of Sandro's current supplementary cards are Amex (Cobalt Supp 1, Cobalt Supp 2, Bonvoy Supp). This workaround directly addresses the most common supplementary card scenario without requiring heuristics. It's optional — the system works fine without it (D-02 fallback), but it removes friction for the majority case.

## D-34: Broken Connection Detection

- **Context:** SimpleFIN Bridge has no webhook support and does not proactively notify when a bank connection breaks (password change, MFA reset, bank-side blocking). The only signal is an error message in the `errors` array of the API response. Lunch Flow (a competing product) positions proactive broken-connection notifications as a differentiator over SimpleFIN.
- **Decision:** The system checks the `errors` array on every daily poll. When a connection error is detected (e.g., `"You must reauthenticate."`), the system surfaces a dashboard alert (per D-16) with the affected institution and a link to SimpleFIN's dashboard for re-authentication. Transactions from the affected institution are flagged as potentially stale (last successful sync date displayed).
- **Rationale:** Since the user is in the app weekly for the review session (D-16), a dashboard alert is sufficient — no push notification needed. Displaying the last successful sync date prevents the user from unknowingly working with incomplete data. The fix (re-authenticating on SimpleFIN's site) is a manual step, but it's the same for any aggregator — the system just needs to surface the problem clearly.

## D-35: No MVP Release — Build All Waves Before Go-Live

- **Context:** Wave plan (Step 4) groups 43 FRICEW objects into 4 build waves. Question: should Wave 1 ship as an MVP, with later waves as incremental updates?
- **Options:** A) Traditional MVP — ship Wave 1, iterate with feedback. B) Build all waves before go-live.
- **Decision:** B — All 4 waves are built before the system goes live. Waves define build order and testable increments, not release phases.
- **Rationale:** This is a personal project for a single user. The developer and the user are the same person — there is no external user base to gather feedback from. Building to completion avoids the overhead of maintaining a live system while still developing.

## D-36: Two-Level Purchase Type Hierarchy

- **Context:** D-04 mentions "Subscriptions" as a type and "Credit Card Fee" as a subtype. Data model needs to know whether the taxonomy is flat or hierarchical.
- **Options:** A) Flat list, B) Two-level hierarchy (type/subtype via self-referencing parent FK)
- **Decision:** B — Purchase Type has an optional `parent_id` self-reference. Null = top-level type, set = subtype. Budget ratios live on top-level types only; subtypes provide finer-grained reporting within the parent's budget bucket.
- **Rationale:** Matches how Sandro naturally describes categories (type + subtype). Budget tracking at the top level keeps it simple; subtypes add detail without complicating the budget formula.

## D-37: Offer Ownership Model

- **Context:** The Offer entity captures welcome bonus terms (multi-tranche per D-24). Question: does a Card Instance point to a shared Offer on the Market Card, or get its own private copy?
- **Options:** A) Shared — Offer belongs to Market Card, Card Instance references one of its Offers. B) Copied — each Card Instance gets an independent Offer record.
- **Decision:** A — Offer belongs to Market Card. Card Instance references one specific Offer. When Wave 4 adds historical offer variants, the user's signup is one of many Offers on the same Market Card. If the user's terms differ from any published offer, a new Offer variant is created on that Market Card.
- **Rationale:** No duplication. One Offer entity serves both "my signup terms" and "historical offer comparison database." Clean and extensible.

## D-38: Stored Alerts with Dismissible State

- **Context:** D-16 specifies dashboard alerts for time-sensitive events (MSR deadlines, AF renewals, broken connections, perk expirations). Should alerts be computed on each dashboard load or stored as persistent records?
- **Options:** A) Computed on the fly, B) Stored with status tracking
- **Decision:** B — Alerts are generated by periodic checks (daily sync or on-demand) and stored as records with status: active / dismissed / acknowledged. Dashboard queries filter on active alerts.
- **Rationale:** Sandro wants to dismiss and acknowledge alerts. That requires stored state. Periodic generation also keeps dashboard queries simple.

## D-39: Supplementary Cards as Card Instance Self-Reference

- **Context:** Supplementary cards (3 current Amex supps) need representation in the data model. Question: separate entity or self-reference on Card Instance?
- **Decision:** Self-reference — Card Instance has an optional `parent_card_instance_id` FK. Null = main card, set = supplementary card. Supplementary cards can have their own Offers (for signup promos like 10k-for-2k), their own Provider Accounts (D-33 Amex workaround), and their own lifecycle.
- **Rationale:** Supplementary cards share all the same attributes as main cards. A separate entity would duplicate the schema. The FRM-004 "supplementary cards" tab is just a filtered view on parent FK.

## D-40: Time-Bound vs Update-in-Place Reference Data Strategy

- **Context:** Reference data values can change over time (CPP valuations, earning multipliers, budget ratios, soft perks, recurrent expense amounts). The data model needs a strategy for each: preserve historical values or overwrite?
- **Decision:** Two strategies based on the nature of the data:
  - **Time-bound** (effective_from / effective_to dates): Earning Multipliers, Budget Allocations, Soft Perk Definitions, Recurrent Expenses. These are contractual rates or planning values where historical accuracy matters.
  - **Update in place**: CPP valuations (subjective opinion about current value), Issuer Application Rules (current rules apply to current decisions), CSV Format Configs (parser configuration).
  - **Stored per record**: Redemption effective CPP (frozen fact at burn time, per D-10).
- **Rationale:** The principle: facts about the past are time-bound; current opinions and configuration are updated in place. Earning multipliers determine how many points were earned historically (fact). CPP determines what points are worth today (opinion). Budget allocations determine what the budget was in a given month (fact). Issuer rules determine current eligibility (current state).

## D-41: FYF on Offer, Not Card Instance

- **Context:** D-27 placed First Year Free as a card instance attribute. The data model introduced Offer as a separate entity (D-37). FYF is a property of the signup terms — all signups under the same offer share the same FYF status.
- **Decision:** FYF moves from Card Instance to Offer. It's a boolean on the Offer entity.
- **Rationale:** FYF is inherent to the offer terms, not to the specific card instance. Avoids inconsistency if two card instances reference the same offer but have different FYF flags. Amends D-27's placement while preserving its intent.

## D-42: Ignore Pending Transactions (Resolves OI-08)

- **Context:** SimpleFIN supports pending transactions via opt-in (`?pending=1`). OI-08 flagged the pending-to-posted lifecycle as a data model concern — SimpleFIN uses stable IDs but amounts/dates can change on settlement.
- **Options:** A) Ingest pending, update on posting (handle amount/date changes). B) Ignore pending, only ingest posted transactions.
- **Decision:** B — The system only ingests posted transactions. SimpleFIN's pending opt-in is not used. Transactions appear when posted (1-3 day lag).
- **Rationale:** For a weekly review cadence, a 1-3 day lag is irrelevant. Ignoring pending eliminates the entire pending-to-posted lifecycle complexity — no `is_pending` flag, no amount change handling, no update-in-place logic. OI-08 is resolved.

## D-43: Count-Based Categorization Engine

- **Context:** ENH-001 needs to suggest Purchase Type and Earning Category for each transaction. Vendors like Uber can be categorized differently depending on context (Transportation vs Food/Delivery). A single default per vendor is insufficient.
- **Decision:** Usage-count-based ranking system. A Vendor Category Stats entity tracks how many times each vendor × purchase_type × earning_category combination has been used. Additionally, Vendor, Purchase Type, and Earning Category entities each carry a `usage_count` field for global ranking. ENH-001 suggests the most-used combination first, with ranked alternatives.
- **Rationale:** Learns from actual usage patterns. Uber with 15 Transportation hits and 8 Food hits suggests Transportation first but offers Food as an alternative. Two layers of counts: global counts for dropdown ranking, per-vendor combination counts for context-aware suggestions.

## D-44: Alert Entity References — Explicit Nullable FKs

- **Context:** Alerts can relate to different entity types (card instances, provider connections, offer tranches, card perks). Question: polymorphic reference (entity_type + entity_id) or explicit nullable foreign keys?
- **Options:** A) Polymorphic (flexible, no DB-level referential integrity). B) Explicit nullable FKs (one column per target entity, DB-enforced).
- **Decision:** B — Explicit nullable FKs: `card_instance_id`, `provider_connection_id`, `offer_tranche_id`, `card_perk_id`. One is set per alert; the rest are null.
- **Rationale:** Single-user local system with a known, small set of alert target entities. DB-level referential integrity is worth the trade-off of adding a column if a new target entity is introduced later.

## D-45: Config Tables vs Enums Strategy

- **Context:** The data model uses both enums and config tables for categorical values. Need a consistent strategy for when to use each.
- **Decision:** Two categories:
  - **Enums** (logic-dependent — app code branches on specific values): lifecycle_state, msr_window_type, fee_structure, categorization_status, transaction.source, goal.direction, last_sync_status, alert.status, match_type, rule_type, card_type, card_segment, provider_type.
  - **Config tables** (user-extendable vocabulary — used for grouping, filtering, display): Perk Type, Adjustment Type, Alert Type, Alert Severity, Card Network, Pattern Source, Confidence Level, Program Tier, Financial Account Type, Income Source Type. All maintained via FRM-009.
- **Rationale:** Config tables for values the user might extend without code changes. Enums for values where adding a new option requires new application logic. This balances flexibility with simplicity.

## D-46: TypeScript Full-Stack

- **Context:** Step 6 — choosing the backend language. Key considerations: 39 entities shared between backend and frontend, heavy UI layer (11 forms, 12 reports), data processing (9 ENH engines), and Claude Code build velocity.
- **Options:** A) TypeScript (Node.js) — full-stack, shared types. B) Python — strong for data processing, but requires TypeScript for frontend anyway. C) Python backend + TypeScript frontend — best-of-breed per layer, but two languages.
- **Decision:** A — TypeScript full-stack. Same language front-to-back with shared type definitions for all 39 entities.
- **Rationale:** The UI layer is massive (11 forms + 12 reports) — that's where most code lives. Data processing (categorization, CSV, bonus tracking) is well within TypeScript's capability. Full-stack TypeScript means shared types, one toolchain, and Claude Code operating in its strongest language. Sandro has deep JavaScript experience from SAP CAP + SAPUI5; TypeScript adds type safety while using the same runtime.

## D-47: CAP + SAPUI5 Architecture

- **Context:** Step 6 — choosing the backend framework and frontend framework. Sandro is an SAP CAP + SAPUI5/Fiori expert. The project has both a heavy backend (9 ENH engines, 3 interfaces, 4 workflows, background scheduling) and a heavy frontend (11 forms, 12 reports).
- **Options:** A) Next.js (full-stack monolith). B) Express/Fastify + React SPA. C) CAP + SAPUI5 (Fiori Elements + freestyle).
- **Decision:** C — SAP CAP backend + SAPUI5 frontend. Fiori Elements for CRUD / list reports / object pages (~8 apps). Freestyle SAPUI5 for dashboards (~12 reports) and wizards (~2 apps). VizFrame as primary charting; ApexCharts embedded in custom SAPUI5 controls as fallback where VizFrame is too rigid.
- **Rationale:** CDS models are purpose-built for the 39-entity data model. Fiori Elements auto-generates list reports, object pages, variant management, draft handling, and personalization — directly serving FRM-009 (SM30-style CRUD) and 7 other form apps. CAP runs fully outside BTP (local Node.js + PostgreSQL, no HANA/XSUAA needed). Sandro's expertise is the accelerator — zero framework learning curve, only TypeScript syntax is new. Dashboard charting decision (VizFrame vs ApexCharts) is made chart-by-chart during functional specs.

## D-48: Library Selections

- **Context:** Step 6 — selecting key libraries for non-framework concerns. CAP handles the ORM, OData, and service layer. Libraries needed for SimpleFIN integration, CSV parsing, fuzzy search, scheduling, encryption, web scraping, and dashboard charting fallback.
- **Decision:** axios (HTTP client), papaparse (CSV parsing), fuse.js (UI fuzzy search), node-cron (background scheduling), Node.js built-in crypto (encryption), cheerio + axios (web scraping, Wave 4), ApexCharts (dashboard charting fallback). Merchant pattern matching uses native string operations (no library).
- **Rationale:** All are small, well-established, low-dependency libraries. No controversial choices. axios handles SimpleFIN's HTTP Basic Auth natively. papaparse maps cleanly to the CSV Format Config entity. node-cron + cds.spawn() handles daily polling. ApexCharts chosen over Chart.js for more polished defaults in a dashboard context.

## D-49: Four CDS Services

- **Context:** Step 6 — how to split the OData service layer. CAP supports multiple services per project. Each Fiori Elements app binds to a specific service endpoint.
- **Options:** A) One monolithic service. B) Multiple services aligned to problem domains.
- **Decision:** B — Four services: TransactionService (transactions, categorization, splits, CSV, dedup), ChurningService (cards, offers, bonuses, points, eligibility, recommendations, redemptions, perks), BudgetService (budget, income, goals, recurrent expenses, financial picture), AdminService (reference data CRUD, SimpleFIN connections, alerts, system config). Wave 4 market intelligence folds into ChurningService.
- **Rationale:** Clean separation by domain. Each Fiori Elements app binds to a focused OData endpoint. Mirrors Sandro's Enbridge pattern of one service per domain area. Scope boundaries are clear: TransactionService owns the ingestion pipeline, ChurningService owns the card lifecycle, BudgetService owns the budget formula, AdminService owns config and system health.

## D-50: Local Deployment

- **Context:** Step 6 — deployment approach. Single user, local machine, no cloud for V1.
- **Options:** A) Local Node.js + PostgreSQL (simplest). B) Docker containers (cleaner isolation). C) Cloud deployment.
- **Decision:** A — Local deployment. `cds-serve` on localhost + PostgreSQL as a local Windows service. Background jobs (node-cron) start inside the CAP process on service `init()`. No Docker for V1.
- **Rationale:** Simplest possible deployment for a personal tool. Docker deferred to future cloud deployment. No containers, no reverse proxy — just Node.js and PostgreSQL on the local machine.

## D-51: Runtime Versions

- **Context:** Step 6 — pinning runtime and framework versions.
- **Decision:** Node.js 20 LTS (active LTS until April 2026, maintenance until 2027), TypeScript 5.x (latest stable), SAPUI5 1.120+ (latest CDN), CAP 8 with `@cap-js/cds-types` for TypeScript support, PostgreSQL via `@cap-js/postgres`.
- **Rationale:** All current stable versions. Node.js 20 is fully supported by CAP 8. No version-specific risk.

## D-52: Ten Subagent Personas

- **Context:** Step 6 — defining Claude Code subagent personas for the build phase. Need to cover backend, frontend, project management, integration, testing, documentation, security, UX, data migration, and defect tracking.
- **Decision:** Ten personas: Backend Developer (`db/`, `srv/`), Frontend Developer (`app/`), Project Manager (sprint board, ceremonies), Integration Specialist (SimpleFIN, CSV, scraping, scheduling), Test Captain (tests, coverage), Documentation Guardian (single source of truth, cross-references), Security Reviewer (encryption, credential handling, code audits), UX/Design Reviewer (design system, visual consistency), Data Migration Specialist (CNV-001–004, data quality), Defect Tracker (defect log, root cause, regressions).
- **Rationale:** Role-based, not technology-specific. Build personas produce work during sprints. Review personas audit work at sprint checkpoints. Management personas orchestrate across sprints. Sprint checkpoint meetings bring all 10 perspectives together as a quality gate. Detailed agent configurations (system prompts, checklists) deferred to after Steps 7–10 complete.

## D-53: Spec Grouping Strategy

- **Context:** Step 7 — 43 FRICEW objects need functional specs. Question: one spec per object (43 specs), group by pipeline (15-20 specs), or hybrid?
- **Options:** A) One spec per object — clean 1:1 traceability but tightly coupled objects repeat context and cross-reference heavily. B) Group by pipeline — matches build order but some groups get large. C) Hybrid — group tightly coupled clusters, standalone specs for leaf nodes.
- **Decision:** C — Hybrid grouping. 13 grouped specs covering 35 objects + 8 standalone specs covering 8 objects = 21 specs total. Grouping principle: objects that share a data pipeline or can't be designed without each other get one spec; leaf nodes get standalone specs.
- **Rationale:** Objects sharing a data pipeline must be designed together — can't spec dedup (ENH-008) without knowing what both ingestion sources (INT-001, INT-002) produce. Leaf nodes (standalone reports, independent forms) are self-contained consumers. Sprint plan already groups by dependency — spec grouping mirrors it. Full mapping in DESIGN_WORKSHOP.md §3.

## D-54: Lean Spec Template

- **Context:** Step 7 — defining a standardized spec template for consistency across 21 specs. Needs to work for both standalone specs (1 object) and grouped specs (up to 5 objects). Must serve three audiences: build personas (implement from it), review personas (validate against it), Sandro (approve it).
- **Decision:** 7-section template: Header, Overview, Data Model References, Functional Description (type-specific), Business Rules (BR-xx), Error Handling, Functional Unit Tests (FUT-xxx). Section 3 (Functional Description) varies by FRICEW type — forms get field lists and layout, reports get sections and charts, interfaces get API contracts, conversions get migration strategy, enhancements get algorithms, workflows get state machines. Acceptance criteria replaced by Functional Unit Tests with preconditions, steps, and expected results — gives Test Captain concrete test scripts directly from the spec.
- **Rationale:** Every section earns its place — no boilerplate. Type-specific content ensures each FRICEW type gets the right questions answered. FUTs are more actionable than declarative acceptance criteria. For grouped specs, each object gets a subsection within Section 3 using the appropriate type format. Full template in DESIGN_WORKSHOP.md §4.

## D-55: Workshop Methodology

- **Context:** Step 7 — how to run spec workshops efficiently. Sandro's time is the bottleneck. Extensive design documentation already exists (BA with 43 object descriptions, DM with 39 entities, 52 decisions, tech stack patterns). Pure interview approach would waste time re-stating documented information.
- **Options:** A) Interview-first — Claude asks everything from scratch, then produces spec. B) Draft-first — Claude pre-drafts, Sandro reviews. C) Draft-then-interview — Claude pre-drafts from existing docs with gap markers, Sandro validates draft then answers targeted questions on gaps only.
- **Decision:** C — Draft-then-interview with 6 phases: (1) Claude pre-drafts from existing docs with `[WORKSHOP]` gap markers, (2) Sandro validates pre-drafted sections, (3) Claude interviews through gaps one question at a time, (4) Claude proposes business rules for confirmation, (5) Claude drafts FUTs for validation, (6) Claude writes final spec + logs decisions + flags DM amendments. Implemented as a reusable `/workshop` Claude Code skill for consistent execution across all 21 specs.
- **Rationale:** Maximizes Claude's contribution, minimizes Sandro's time. The pre-draft leverages BA descriptions, DM entities, and 52+ decisions already documented. Sandro validates and fills gaps rather than narrating from scratch. The skill makes it repeatable — same methodology, same quality, every session. Full methodology in DESIGN_WORKSHOP.md §5.

## D-56: Horizon Light Theme + Compact Density

- **Context:** Step 8 — choosing the SAPUI5 theme and content density mode for the design system.
- **Options (theme):** A) SAP Horizon Light (`sap_horizon`). B) SAP Horizon Dark (`sap_horizon_dark`). C) SAP Quartz Light (`sap_fiori_3`).
- **Options (density):** A) Compact (`sapUiSizeCompact`, ~32px rows). B) Cozy (`sapUiSizeCozy`, ~48px rows).
- **Decision:** Horizon Light + Compact. Current-generation SAP theme with best SAPUI5 1.120+ component support. Compact density for desktop-first, mouse-driven, data-dense screens.
- **Rationale:** Horizon is SAP's current direction — no reason to use older themes when not constrained by an existing landscape. Compact mode is the standard for desktop Fiori apps with no touch requirement. Transaction list and master data screens benefit from denser rows. Dark mode can be added later as a runtime theme toggle.

## D-57: Side Navigation Pattern

- **Context:** Step 8 — how users navigate between 23 screens (11 forms + 12 reports).
- **Options:** A) Fiori Launchpad (tile-based home screen). B) Side navigation (persistent left sidebar with grouped menu items). C) Top tab bar.
- **Decision:** B — Side navigation using `sap.tl.ShellBar` + `sap.tl.SideNavigation`. Persistent left sidebar, collapsible to icon-only (~48px).
- **Rationale:** 23 screens is too many for tiles. The weekly workflow (WFL-001) crosses 4+ screens — persistent nav means one-click access instead of back-to-home round trips. Side nav collapses for full-width dashboards. Top tabs don't scale to 23 items.

## D-58: Navigation Grouping

- **Context:** Step 8 — organizing 23 screens into sidebar groups.
- **Options:** Various groupings considered. Key sub-decisions: whether to split Churning into two groups (10 items in one group is large), and whether Financial Picture (2 items, Wave 3) stays standalone or merges with Budget.
- **Decision:** 5 groups: Transactions (3), Churning — Cards (3), Churning — Analytics (7), Finances (8), Admin (2). Churning split for manageability. Budget and Financial Picture merged under "Finances" (not "Earning" — that term collides with Earning Category in the churning taxonomy).
- **Rationale:** Groups align with CDS service domains. Churning split keeps each group under 8 items. "Finances" avoids terminological collision with Earning Category. Financial Picture is too small (2 items) to justify its own group, and both it and budget answer "where does my money stand?"

## D-59: Dashboard Grid Layout

- **Context:** Step 8 — establishing a consistent layout pattern across 12 freestyle dashboards.
- **Options:** A) Free-form layout per dashboard. B) `sap.f.GridContainer` with standardized grid.
- **Decision:** B — `sap.f.GridContainer` with a base 2-column grid. Cards can span 1 column (half-width) or 2 columns (full-width). Dashboards scroll vertically. Each spec defines its own card arrangement within this grid system.
- **Rationale:** Simple, predictable, desktop-optimized. Consistent grid prevents 12 one-off layouts. Two column widths cover all dashboard card types (KPIs, charts, tables).

## D-60: Standard Semantic Colors

- **Context:** Step 8 — color strategy for domain-specific states (card lifecycle, budget health, bonus progress) beyond generic success/warning/error.
- **Options:** A) Standard Horizon semantic colors (Indication01–05) for all states. B) Custom brand accent color to distinguish churning visuals from budget visuals.
- **Decision:** A — Standard Horizon semantic colors only. No custom CSS. Domain states (Focus=blue, Active=green, To Cancel=orange, Closed=grey, etc.) mapped to existing Horizon semantic tokens.
- **Rationale:** Keeps the app visually consistent with Fiori guidelines. No custom CSS to maintain. The Horizon palette covers all required semantic states. Custom accent can be added later as a polish pass.

## D-61: Chart Conventions

- **Context:** Step 8 — styling and interaction rules for charts across 12 dashboards using VizFrame (primary) and ApexCharts (fallback).
- **Decision:** Three sub-decisions:
  - **Data series colors:** Domain-mapped for the 4 issuers (fixed color per issuer across all charts, maintained in constants file). VizFrame auto-assigned qualitative palette for everything else (categories, vendors, programs — dynamic sets too large for manual mapping).
  - **Chart type defaults:** Donut for part-of-whole, horizontal bar for comparisons, line for 1-2 series trends, stacked bar for 3+ series trends, bullet/KPI card for single KPIs, sorted horizontal bar for rankings. Defaults only — each spec can override.
  - **Chart interactions:** VizFrame defaults only. Tooltip on hover, no drill-down on click, visible toggleable legend, no zoom/pan. Custom interactions requested explicitly per spec if needed.
- **Rationale:** Domain-mapped issuer colors give cross-dashboard visual consistency for the most common chart dimension (spend by card). Auto-assigned for dynamic sets avoids maintaining a growing color map. Chart type defaults prevent repeated debates during specs. Minimal interactions keep dashboard development straightforward.

## D-62: Page Layout Standards & Status Indicators

- **Context:** Step 8 — conventions for Fiori Elements pages, freestyle pages, and visual status display.
- **Decision:** Four sub-decisions:
  - **Fiori Elements:** Compact table rows, collapsed filter bar with adapt-filters, single-select row navigation, scrolling object page sections with anchor bar (not tabs), no draft handling, variant management on for list reports.
  - **Freestyle dashboards:** Page title + filter bar → GridContainer body → vertical scroll. Period selector top-left. Section headers with `sap.m.Title` H2.
  - **Freestyle wizards:** `sap.m.Wizard`, linear steps, review step before save.
  - **Status indicators:** `ObjectStatus` (colored text + icon) for state display. `ObjectNumber` with state for semantic amounts. Full mapping of card lifecycle, bonus tranche, categorization, sync, and budget states to Horizon semantic colors and SAP icons.
  - **Empty states & loading:** Standard `noDataText` for empty lists and filtered-no-results. Dashboard cards render with placeholder (layout doesn't shift). `BusyIndicator` for page loads, `BusyDialog` for long operations. No illustrated empty states in V1.
- **Rationale:** Scrolling sections are standard Fiori object page behavior and avoid extra clicks vs tabs. Compact tables maximize data density. No draft handling for single-user app. Standard empty states avoid custom illustration work. All components are built-in SAPUI5 — no custom CSS.

## D-63: CDS Naming & Modeling Conventions

- **Context:** Step 9 — formalizing CDS naming rules for the Backend Dev persona. TECH_STACK.md §7 had high-level conventions; this makes them precise and enforceable.
- **Decision:** Three sub-decisions:
  - **FK naming:** Follow CAP's auto-generated convention — `cardInstance_ID` (underscore + capital `ID`). Less friction with CDS tooling.
  - **Modular schema:** `db/` subfolders with one `schema.cds` per domain (reference, cards, transactions, points, budget, financial, integration, alerts) instead of a single monolith. Plus `db/enums.cds` for all enum types.
  - **Annotations:** Entity-based files in `app/{name}/annotations/` folder — e.g., `Transaction.cds`, `Vendor.cds`. Replaces the three-file split (`annotations_ui.cds`, `annotations_mf.cds`, `annotations_se.cds`).
- **Rationale:** CAP auto-generated FKs avoid fighting the framework. Modular schema prevents a 1000+ line monolith. Entity-based annotations are easier to find and maintain — one file per entity is clearer than splitting by annotation type.

## D-64: TypeScript Strict Mode & tsconfig.json

- **Context:** Step 9 — setting TypeScript compiler strictness. Sandro is new to TypeScript (JavaScript expert); need to balance safety with learning curve.
- **Decision:** `strict: true` (all sub-flags enabled) plus `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`, `noFallthroughCasesInSwitch`. Target `ES2022`, module `Node16`. Not included: `noUncheckedIndexedAccess` (too noisy for app code) and `exactOptionalProperties` (overkill). Scope: `srv/` and `db/` only — `app/` is SAPUI5 JavaScript.
- **Rationale:** Full strict mode catches the bugs TypeScript is best at finding. Greenfield project with Claude Code writing code — no legacy to grandfather in. Any flag that causes friction can be revisited; none are irreversible.

## D-65: CDS Entity Type Patterns in TypeScript

- **Context:** Step 9 — how TypeScript handlers consume CDS entity types. CAP 8 with `@cap-js/cds-types` auto-generates types.
- **Decision:** Follow CAP standard patterns: import from `#cds-models/`, pass entity references (not strings) in handler registration for typed `req.data`, define computed shapes in `types.ts` per module.
- **Rationale:** Standard CAP approach. No custom patterns needed — the framework provides everything.

## D-66: Three-Layer Handler Pattern (Formalized)

- **Context:** Step 9 — formalizing the Facade → Service → Validator pattern from Enbridge for TypeScript. TECH_STACK.md named the layers; this defines the interfaces and rules.
- **Decision:** Every module has exactly three files — Facade, Service, Validator — no exceptions, even for trivial validation. `wrapHandler` in `BaseFacade.ts` wraps every handler (logs ENTRY/EXIT, catches errors). Facades contain no logic, no try/catch. Validators do input validation only, no DB calls.
- **Rationale:** Consistent structure across all modules. Small Validators are fine — keeping classes focused prevents them from becoming overwhelming. The three-file pattern is enforced by ESLint custom rules.

## D-67: Error Handling Patterns

- **Context:** Step 9 — formalizing `req.error()` vs `req.reject()` usage, HTTP status codes, and message format.
- **Decision:** `req.error()` for validation (accumulates, Validator only, status 400, with `target` for field-level errors). `req.reject()` for fatal (Service/Facade, status 404/409/500/502). All messages via i18n keys through `MessagingUtility` — never hardcoded strings.
- **Rationale:** Mirrors Enbridge's `MessagingUtility` pattern adapted to TypeScript. Accumulating validation errors gives better UX — user sees all problems at once instead of fixing one, submitting, finding the next.

## D-68: Logging Standards

- **Context:** Step 9 — formalizing logging for all backend code. Adapting Enbridge's Logger class to TypeScript.
- **Decision:** Five sub-decisions:
  - **Namespace:** Module name only (e.g., `TransactionFacade`), not two-part. Single-app project doesn't need an app prefix.
  - **Output:** Dual — console + rotating log files. `logs/app.log` for all entries, `logs/error.log` for ERROR only.
  - **Levels:** ERROR (failures needing attention), WARN (unexpected but handled), INFO (normal operations, handler ENTRY/EXIT), DEBUG (detailed internals). Default: INFO.
  - **Format:** Structured JSON with module, correlationId, type, timestamp, and handler-specific data.
  - **Sensitive data:** Never log decrypted card details, CVV, access URLs. `_redact()` utility strips known sensitive fields before DEBUG-level logging.
- **Rationale:** Dual output ensures errors are always captured even if console is missed. Dedicated `error.log` is the safety net. Structured JSON enables future log analysis. Correlation IDs from `req.id` tie all log entries for a request together.

## D-69: i18n Three-Tier Convention

- **Context:** Step 9 — formalizing the three-tier i18n pattern from TECH_STACK.md §7 with concrete naming patterns and examples.
- **Decision:** Tier 1: CDS labels in `srv/_i18n/i18n.properties` (PascalCase keys). Tier 2: Runtime messages in `srv/_i18n/messages.properties` (camelCase.dots keys). Tier 3: UI5 app text in `app/{name}/webapp/i18n/i18n.properties` (camelCase keys). No hardcoded strings anywhere — `MessagingUtility` enforces this for backend.
- **Rationale:** Formalizes existing Enbridge convention with project-specific examples. Three tiers match the three code layers (CDS models, TypeScript handlers, SAPUI5 views).

## D-70: Encryption Approach (Resolves OI-07)

- **Context:** OI-07 open since Step 0 — encryption for card details (card_number_enc, cvv_enc, expiry_date_enc) and SimpleFIN access URL (access_url_enc). D-48 chose Node.js `crypto` with AES-256-GCM. This resolves the implementation details.
- **Options:** A) Environment variable — key in `.env` (gitignored). B) OS keychain via `keytar`. C) Passphrase on every startup via PBKDF2.
- **Decision:** A — Environment variable. AES-256-GCM with 256-bit random key (hex-encoded) in `.env`. Random 12-byte IV per encryption call. Storage format: `{iv}:{authTag}:{ciphertext}` (hex). `EncryptionUtility.ts` with `encrypt()`/`decrypt()`. App refuses to start without `ENCRYPTION_KEY`. `npm run generate-key` for first-run setup.
- **Rationale:** Local single-user desktop app. Threat model is "someone with access to Sandro's machine" — at that point they have the browser, the DB, everything. OS keychain adds a native dependency for marginal gain. Passphrase breaks the quick weekly review workflow. `.env` is gitignored, key never enters version control.

## D-71: ESLint Configuration

- **Context:** Step 9 — defining linting rules. Adapted from Enbridge's `@enbridge/eslint-config` package (custom architectural rules, Hungarian notation, JSDoc, CDS linting) for TypeScript and this project's needs.
- **Decision:** Six sub-decisions:
  - **Preset:** `@typescript-eslint/recommended` + `@sap/eslint-plugin-cds`.
  - **Severity:** Errors for architectural, type safety, and style rules. Warnings for complexity (max-depth: 4, max-params: 5, complexity: 10).
  - **Custom rules from Enbridge (adapted):** `no-logic-in-facade`, `require-wrap-handler`, `no-try-catch-in-facade`, `require-facade-extends-base`, `require-service-extends-base`, `private-methods-at-bottom`.
  - **JSDoc:** Required on all methods (public and private). Descriptions only — no type annotations (TypeScript handles types).
  - **Hungarian notation:** Enforced in SAPUI5 controllers (`sName`, `oModel`, `aItems`, `bIsValid`, `iCount`, `fnCallback`).
  - **Dropped from Enbridge:** `no-db-queries-in-service` (no DataService layer), `no-external-calls-in-dataservice` (same), JSDoc type annotations (redundant with TypeScript).
- **Rationale:** Greenfield project — errors from day one keeps the codebase clean. Complexity stays as warning for genuine edge cases. Hungarian notation matches Sandro's Enbridge workflow. JSDoc descriptions add value even with TypeScript types.

## D-72: SAPUI5 Controller & View Conventions

- **Context:** Step 9 — frontend patterns for Fiori Elements (8 apps) and freestyle (14 apps).
- **Decision:** Five sub-decisions:
  - **Fiori Elements extensions:** `{ViewType}Ext` naming — `ListReportExt.js`, `ObjectPageExt.js`.
  - **Annotations:** Entity-based files in `app/{name}/annotations/` folder (replaces the three-file `annotations_ui/mf/se` split from Enbridge).
  - **Freestyle:** All controllers extend `BaseController.js` in `app/shared/`. XML views only. Named models. `formatter.js` per app. `on` prefix for event handlers.
  - **Custom controls:** `app/shared/controls/` — `VizFrameCard.js`, `ApexChartCard.js`. Extend `sap.ui.core.Control`.
  - **Max dependencies:** Warn at 10 imports per `sap.ui.define` call — code smell signal to refactor.
- **Rationale:** Consistent structure across 22 frontend apps. BaseController prevents duplication. Entity-based annotations are easier to navigate than type-based splits. 10-import limit catches controllers doing too much.

## D-73: Code Review Checklists

- **Context:** Step 9 — per-persona checklists for the sprint checkpoint meeting quality gate.
- **Decision:** Six checklists for review-oriented personas: Backend Developer (handler pattern, imports, layer separation), Frontend Developer (Hungarian, XML views, annotations, extensions), Security Reviewer (sensitive data, encryption, OData exposure), Test Captain (coverage, FUT traceability, test data safety), Documentation Guardian (JSDoc, i18n, change history, no duplication), UX/Design Reviewer (design system, table standards, status indicators, grid layout). Operational personas (PM, Integration, Migration, Defect Tracker) use PROJECT_MANAGEMENT.md checklists instead.
- **Rationale:** Turns technical standards into audit criteria. Each persona checks their domain at the sprint checkpoint. Prevents standards drift.

## D-74: Test Framework — Jest + ts-jest

- **Context:** Step 10 — choosing the test runner, assertion library, and mocking tools for the CAP TypeScript backend.
- **Options:** A) Jest + ts-jest (CAP-aligned, built-in mocking). B) Vitest (native TypeScript, faster, but Vite-based — CAP doesn't use Vite). C) Mocha + Chai + Sinon (flexible but three packages, no built-in mocking).
- **Decision:** A — Jest + ts-jest. CAP's official samples and documentation target Jest. `jest.fn()`, `jest.mock()`, `jest.spyOn()` cover all mocking needs for the three-layer pattern.
- **Rationale:** CAP community answers and examples are Jest-based — one less variable when debugging test issues. `ts-jest` config is a one-time cost. Frontend tests use QUnit + OPA5 (SAPUI5's built-in frameworks).

## D-75: Test Boundaries

- **Context:** Step 10 — defining what "unit test," "integration test," and "functional test" mean for this project.
- **Decision:** Three-tier pyramid:
  - **Unit:** Single class/method in isolation. No DB, no network. CDS queries mocked.
  - **Integration:** OData endpoint through the full CAP stack. SQLite via `cds.test()`. External APIs mocked.
  - **Functional:** Multi-step FUT scenarios as sequences of OData calls. Same `cds.test()` infrastructure as integration, organized by user journey. Nested under `test/integration/scenarios/`.
- **Rationale:** External APIs always mocked for determinism. SQLite instead of PostgreSQL is a pragmatic trade-off — `cds.test()` makes it zero-config, and PostgreSQL-specific edge cases are caught in manual testing. Functional tests at the API layer (not UI layer) avoids brittle UI automation for a solo project.

## D-76: Unit Test Standards

- **Context:** Step 10 — per-layer unit test rules aligned to the three-layer handler pattern (D-66).
- **Decision:** Five sub-decisions:
  - **Validators:** Fully tested — positive and negative cases for every rule. No mocking needed (pure functions). Mock `req` as a simple object with `error()` spy.
  - **Services:** Business logic tested with CDS queries mocked. Validator is NOT mocked — exercises real validation for free integration coverage. Every public and private method tested.
  - **Facades:** Not unit tested. Zero logic (ESLint-enforced). Wiring validated by integration tests.
  - **Private methods:** Tested directly via bracket notation (`service['_privateMethod']()`). Test files get ESLint overrides for `no-explicit-any` and `dot-notation`.
  - **Highest-value targets:** ENH engines (bonus progress, points balance, budget, eligibility, profitability, categorization), Utilities (EncryptionUtility, DateTimeUtility, CurrencyUtility).
- **Rationale:** Validators are the easiest to test thoroughly — no dependencies. Services are the highest value — where bugs live. Facades are pure wiring — integration tests cover them. Not mocking Validators catches integration bugs between layers for free.

## D-77: Integration Test Standards

- **Context:** Step 10 — how to test OData endpoints through the full CAP stack. Also establishes the test data rule.
- **Decision:** Four sub-decisions:
  - **Setup:** `cds.test()` boots CAP with SQLite. Canonical test world seeded in `beforeAll`. Bound `axios` client for OData calls.
  - **Per-service coverage:** CRUD operations, custom actions/functions, query options ($filter, $expand), error responses (400/404/409), sensitive field exclusion (_enc fields not in list queries).
  - **Scenario tests:** Under `test/integration/scenarios/` — multi-step OData call sequences matching FUT workflows (weekly review, card onboarding, CSV import, card lifecycle).
  - **Test data rule:** Tests never construct data inline. All data imported from `test/data/` with semantic constant names (e.g., `AMEX_COBALT_FOCUS_CARD`). Only exception: field-specific overrides directly relevant to the assertion.
- **Rationale:** `cds.test()` + SQLite is zero-config and fast. One file per CDS service keeps tests organized. Semantic naming keeps tests readable — the test body shows intent, not setup noise.

## D-78: Test Data Strategy

- **Context:** Step 10 — how to build and organize test data across unit and integration tests.
- **Decision:** Three sub-decisions:
  - **Hybrid pattern:** Factory functions build objects with defaults; named constants (UPPER_SNAKE_CASE) consume factories with semantic overrides. Tests import named constants. Factories available for one-off variants.
  - **Canonical test world:** Pre-built realistic dataset in `test/data/integration/seeds.ts` — 3 issuers, 3 market cards, 4 card instances (one per lifecycle state), ~20-30 transactions, budget data, provider connections, alerts. Shared across integration and scenario tests.
  - **Sensitive data:** Obviously fake values only (`4111111111111111`, `000` CVV, `12/99` expiry). Unit constants hold plaintext (encryption mocked). Integration seeds encrypt via `EncryptionUtility`. No real credentials ever in test files.
- **Rationale:** Factories prevent copy-paste drift when entity schemas change. Named constants keep tests self-documenting. Canonical test world prevents each test from inventing its own universe. Fake sensitive data enforced by Security Reviewer checklist (D-73).

## D-79: Coverage Targets

- **Context:** Step 10 — setting enforced coverage thresholds. Sandro's direction: "as high as possible."
- **Decision:** Enforced via `jest.config.ts` `coverageThreshold`:
  - **Validators:** 100% line, 100% branch.
  - **Utilities:** 100% line, 100% branch.
  - **Services (incl. ENH engines):** 90% line, 85% branch.
  - **Overall project:** 85% line, 80% branch.
  - **Facades:** Excluded from coverage measurement (`coveragePathIgnorePatterns`).
  - **Frontend:** No enforced thresholds (learning exercise).
- **Rationale:** Validators and Utilities are pure functions with no excuse for gaps. Services have the 10% gap for defensive catch blocks and hard-to-trigger edge paths. Facades have zero logic by design. Coverage runs on every `npm test`, not as a separate step.

## D-80: Frontend Testing

- **Context:** Step 10 — whether and how to test SAPUI5 apps. Sandro wants to learn QUnit and OPA5 as part of the project's learning goals.
- **Decision:** Three sub-decisions:
  - **QUnit:** Shared resources (formatter.js, BaseController.js, VizFrameCard.js, ApexChartCard.js) + 1-2 freestyle controller methods. Tests in `app/shared/test/unit/` and `app/{name}/webapp/test/unit/`.
  - **OPA5:** Journey tests on 2 apps — `transactions` (FRM-001, Fiori Elements pattern) and `csv-import` (FRM-003, freestyle pattern). Two apps, not twenty-two — enough to learn both patterns. Tests in `app/{name}/webapp/test/integration/`.
  - **Coverage:** No enforced thresholds. Frontend tests are a learning exercise, not a quality gate. Backend targets (D-79) remain the project's gatekeepers.
- **Rationale:** Including frontend tests despite being a solo project because learning QUnit/OPA5 is a stated project goal. Scoped to shared resources + 2 representative apps to keep it educational without becoming a maintenance burden. Easy to expand later — adding more OPA5 journeys is repetition once the pattern is learned.

## D-81: Repository Setup (.gitignore)

- **Context:** Step 11 — defining what gets tracked in Git vs ignored, tailored to the CAP + Node.js + TypeScript + PostgreSQL stack.
- **Decision:** Ignore: `node_modules/`, `gen/`, `@cds-models/`, `.cds-services.json`, `.env`, `logs/`, `coverage/`, `project/test-reports/`, `*.tsbuildinfo`, `default-env.json`, `.vscode/`, OS artifacts (`Thumbs.db`, `Desktop.ini`, `.DS_Store`). Track: `package-lock.json`, `db/seed/*.csv`, `project/sprints/`, `project/SPRINT_BOARD.md`, `project/DEFECT_LOG.md`, all `design/` content.
- **Rationale:** `.env` contains `ENCRYPTION_KEY` (D-70). `gen/` and `@cds-models/` are CAP auto-generated at build time. `coverage/` and `test-reports/` are regenerated each test run. `.vscode/` ignored — solo project, no benefit to tracking IDE preferences. Seed CSVs tracked because they're design artifacts (CNV-002), not generated output.

## D-82: Branching Strategy

- **Context:** Step 11 — how branches are organized for a solo developer + AI agents workflow across 4 waves / 10 sprints. No PRs, no CI/CD, local Git only.
- **Options:** A) Trunk-based — everything on `main`, tags at sprint boundaries. B) Sprint branches — one branch per sprint, merge to `main` at checkpoint. C) Feature branches — one per FRICEW object or story.
- **Decision:** B — Sprint branches. `main` is always stable, only moves forward at sprint checkpoints after multi-persona review (PM §5). Sprint branch is the working branch where all agents commit. One active sprint branch at a time. Merged to `main` at sprint end, then deleted.
- **Rationale:** Trunk-based leaves `main` potentially broken mid-sprint with no safe rollback. Feature branches create 30+ branches for a solo project — overkill without PR reviews. Sprint branches are the sweet spot: low overhead (10 branches over the whole project, each lasting 1 week), `main` always reflects a reviewed sprint, and the sprint branch can be reset without affecting prior work.

## D-83: Branch Naming Convention

- **Context:** Step 11 — naming pattern for sprint branches.
- **Options:** A) `sprint/W{wave}-S{sprint}` — prefixed, matches sprint IDs. B) `W1-S1` flat. C) `sprint/2026-03-01` date-based.
- **Decision:** A — `sprint/W1-S1` format. The `sprint/` prefix groups working branches in `git branch --list`. Wave-Sprint IDs reuse the exact identifiers from PROJECT_MANAGEMENT.md §3.
- **Rationale:** Zero translation between sprint board, sprint reports, defect log, and branch names. Sortable alphabetically = chronologically. Only `main` and the current sprint branch exist at any given time.

## D-84: Commit Conventions

- **Context:** Step 11 — commit message format and co-author attribution for Claude Code agents.
- **Options:** A) Conventional Commits — `type(scope): description`. B) Freeform. C) FRICEW-prefixed — `[ENH-001] description`.
- **Decision:** A — Conventional Commits. Seven types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `seed`. Scopes map to module names (`transaction`, `categorization`, `churning`, `budget`, `eligibility`, `recommendation`, `integration`, `admin`, `shared`, `db`, `ui`, `docs`, `config`). FRICEW IDs go in the commit body, not the subject line. All Claude Code agent commits include `Co-Authored-By: Claude Code <noreply@anthropic.com>`. Sandro's manual commits do not.
- **Rationale:** Conventional Commits give scannable, filterable history. FRICEW IDs in the body keep the subject clean while maintaining traceability. Co-author trailer clearly separates human vs AI contributions in the log.

## D-85: Merge Strategy

- **Context:** Step 11 — how sprint branches get merged into `main` at the sprint checkpoint.
- **Options:** A) Merge commit (`--no-ff`). B) Squash merge. C) Rebase + fast-forward.
- **Decision:** A — Merge commit with `--no-ff`. Merge message format: `merge: sprint W{n}-S{n} — {sprint goal}` with delivered FRICEW IDs listed. Individual commits within the sprint are preserved.
- **Rationale:** Each merge commit is a visible sprint boundary on `main`. Squash loses 10-20+ individual commits per sprint — throws away useful history for tracing when specific objects were built. Rebase gives linear history but sprint boundaries become invisible. The merge node is the sprint boundary marker.

## D-86: Tagging & Releases

- **Context:** Step 11 — version scheme and when tags are created. Local Git only, no GitHub releases, no package publishing.
- **Options:** A) Per-sprint tags — `v{wave}.{sprint}`. B) Per-wave tags only — `v{wave}.0`. C) SemVer — `v0.{n}.0`.
- **Decision:** A — Per-sprint annotated tags. Format: `v{wave}.{sprint}` (e.g., `v1.1` through `v4.1`). Final `v1.0.0` tag at go-live when all 43 FRICEW objects are delivered. Tags created immediately after the merge commit, before starting the next sprint branch. Tag message includes sprint goal and delivered FRICEW IDs.
- **Rationale:** 10 tags total — lightweight and meaningful. Wave and sprint identity baked into the version number (`v1.3` = Wave 1, Sprint 3). SemVer doesn't add value — no public API, no consumers, no breaking-change signaling needed. Per-wave tags miss sprint granularity.

## D-87: System Config Table (TVARVC)

- **Context:** SPEC-01 workshop — multiple ingestion pipeline parameters need to be configurable at runtime (sync time, lookback window, retry count, stale threshold) without code changes.
- **Options:** A) Hardcode defaults. B) Environment variables in `.env`. C) TVARVC-style key-value config table maintained via FRM-009.
- **Decision:** C — New System Config entity with key-value pairs (`key`, `value`, `description`). Maintained via FRM-009 (SM30-style CRUD). Initial parameters: `SIMPLEFIN_SYNC_TIME` (20:00), `SIMPLEFIN_LOOKBACK_DAYS` (7), `SIMPLEFIN_RETRY_ATTEMPTS` (3), `SIMPLEFIN_STALE_DAYS` (3).
- **Rationale:** SAP TVARVC pattern. Parameters adjustable without redeployment or code changes. Will serve other specs too (not just ingestion). DM-001 amendment — new entity.

## D-88: Two-Tier Deduplication Strategy

- **Context:** SPEC-01 workshop — ENH-008 needs to handle dedup across SimpleFIN and CSV sources. BA listed three categories (new/reconciliation/duplicate). Workshop revealed reconciliation adds complexity without value — user action is the same as duplicate (skip it).
- **Options:** A) Three categories (new/reconciliation/duplicate). B) Two categories (new/potential duplicate) with auto-skip via `external_id`.
- **Decision:** B — SimpleFIN uses `external_id` for definitive auto-skip (silent, no user review). All other matching uses fuzzy criteria (`raw_description` exact + `posted_at` date only + `amount` exact + `card_instance_id`) and flags as potential duplicate for user review. Reconciliation category dropped. Within-batch rows not deduplicated against each other.
- **Rationale:** `external_id` is SimpleFIN's stable identifier — no ambiguity. Cross-source fuzzy matching is inherently uncertain (identical charges are legitimate). Two categories simplify the FRM-003 wizard from four tabs to three.

## D-89: CSV Import Wizard Batch Categorization UX

- **Context:** SPEC-01 workshop — historical backfill will involve hundreds of transactions per issuer. Row-by-row review is impractical. Need an assembly-line approach for mass categorization.
- **Decision:** Batch workflow in FRM-003: (1) Clear/confirm individual rows → auto-propagate vendor, PT/subtype, EC to uncleared rows with same `raw_description`. (2) "Clear All Matching" for bulk confirm. (3) Undo clear with propagation revert. (4) Multi-select apply for different descriptions mapping to same vendor. (5) Running totals with earning yield. (6) Progress indicator. (7) Post-import summary. (8) Import history log (new entity). (9) Drag-and-drop upload. (10) Sort/group by description. (11) On-the-fly creation of Vendors, Purchase Types, Earning Categories via value help. (12) Only cleared rows submitted.
- **Rationale:** Categorize one Amazon row, clear it, 30 matching rows auto-fill — turns hundreds of transactions into a manageable workflow. Running totals with yield add motivation. Import history prevents "did I already import this?" confusion. DM-001 amendment — new Import Log entity.

## D-90: CSV Format Config Expansion

- **Context:** SPEC-01 workshop — analysis of actual CSV exports from 4 issuers (samples in `design/actual-csvs/`) revealed format variations not covered by the original entity. TD and CIBC use split debit/credit columns (no single amount). Scotia has a status column for posted/pending filtering. Amex has a cardmember column and 12 header rows to skip. Amex exports as `.xls` (user converts to CSV before upload).
- **Decision:** Expand CSV Format Config: add `debit_column` + `credit_column` (split amount pattern, optional), `status_column` + `status_posted_value` (posted filtering, optional), `cardmember_column` (supp card attribution, optional). Make `amount_column` and `amount_sign` optional (null when using split columns). Support column names (for files with headers) and column indices (for headerless files like TD/CIBC). Amount parsing strips `$` and `,` universally.
- **Rationale:** Four issuers, four different formats. The config entity must handle all without per-issuer code. Split debit/credit is common in Canadian bank exports. Status filtering prevents importing pending transactions from Scotia. DM-001 amendment — 5 new attributes on existing entity, 2 existing attributes made optional.

## D-91: Amex Supplementary Card Attribution in CSV Import

- **Context:** SPEC-01 workshop — Amex CSV exports include a "Cardmember" column identifying which cardholder (main or supplementary) made each transaction (e.g., "SANDRO SERYANI" vs "KARL SERYANI"). Other issuers don't provide this. Sandro has 3 Amex supplementary cards.
- **Decision:** When the selected card has supplementary cards and the CSV format has a `cardmember_column`, FRM-003's review step shows a "Card" column. System auto-assigns each row's card instance by matching the cardmember value to `Card Instance.cardholder_name` (new field). User can override via dropdown showing main card + supplementary cards. Unmatched cardmember names default to the main card.
- **Rationale:** Amex is the only issuer providing card-level attribution in exports. Leveraging this eliminates manual supp card tagging for Sandro's 3 Amex supplementary cards. D-33 noted the Amex exception for SimpleFIN; this extends it to CSV. DM-001 amendment — new `cardholder_name` attribute on Card Instance.

## D-92: FRM-009 Navigation Pattern

- **Context:** SPEC-06 workshop — FRM-009 manages ~20 entity types. Need a navigation pattern within the single app under Admin.
- **Options:** A) Tile-based landing page (~20 tiles). B) Master-detail with grouped entity list. C) Tabs. D) Flat list.
- **Decision:** B — Master-detail layout. Left panel: grouped `sap.m.List` with collapsible group headers (6 groups). Right panel: selected entity's table. One entry under "Admin" in the side nav.
- **Rationale:** Tiles would be overwhelming with 20 entity types. Master-detail is scannable, compact, and a standard SAP settings pattern. User can jump between entity types without navigating away.

## D-93: FRM-009 Inline Editing Default

- **Context:** SPEC-06 workshop — editing UX for ~20 entity types. Some are simple (name-only), others have complex relationships.
- **Options:** A) Object page for all entities. B) Inline editing for all. C) Inline default, object pages only for entities with composition children.
- **Decision:** C — Inline editing by default. Object pages for Purchase Type (subtypes), Rewards Program (Program Tiers), and Vendor (Merchant Patterns) only.
- **Rationale:** Sandro prefers inline editing whenever possible. Object pages add navigation overhead only justified when managing child entities.

## D-94: Budget Allocation 100% Constraint UX

- **Context:** SPEC-06 workshop — OI-03. Budget Allocations must sum to 100% for a given period, but the UX must not block the user during setup.
- **Options:** A) Block save when ≠ 100%. B) Allow save at any sum with warning. C) Auto-calculate last category.
- **Decision:** B — Running total displayed, save allowed at any sum, warning banner when ≠ 100%. Budget engine (ENH-007) treats ≠ 100% as "budget not configured" and skips calculations. Color-coded total: green (100%), orange (under), red (over).
- **Rationale:** Blocking during incremental setup would be frustrating. The user adds categories one by one. The warning gives clear feedback without being obstructive.
- **Resolves:** OI-03.

## D-95: View-Only Tables in FRM-009

- **Context:** SPEC-06 workshop — some config tables are tied to application logic. Adding new values without code changes wouldn't do anything.
- **Decision:** Five tables are view-only in FRM-009 (displayed, not editable): Alert Type, Alert Severity, Pattern Source, Confidence Level, Card Network. All others are fully editable.
- **Rationale:** These tables are logic-dependent (D-45 distinction). A new Alert Type without matching code wouldn't generate alerts. View-only display serves as reference without creating false configurability.

## D-96: Restrict Delete on Referenced Entities

- **Context:** SPEC-06 workshop — referential integrity when deleting reference data used by transactions or other entities.
- **Decision:** Any entity referenced by other records cannot be deleted. UI shows error with reference count (e.g., "Cannot delete — 42 transactions use this category"). Applies to all editable entity types in FRM-009.
- **Rationale:** Cascading deletes would destroy transaction history. Soft delete adds complexity for V1. Restrict-with-count is simple, safe, and informative.

## D-97: Reimbursable Purchase Type — excludes_from_budget Flag

- **Context:** SPEC-06 workshop — Sandro identified a spending pattern: purchases made on behalf of others (e.g., buying for a friend), reimbursed via e-transfer. These should count for churning (points, MSR) but not budget.
- **Decision:** New `excludes_from_budget` boolean on Purchase Type (default `false`). When `true`, budget engine skips. Seeded with "Reimbursable" as a top-level type. Subtypes inherit the flag. Budget Allocations cannot reference excluded types.
- **Rationale:** Explicit flag is cleaner than inferring from absence of Budget Allocation. Distinguishes "deliberately excluded" from "not yet configured." DM-001 amendment.

## D-98: Purchase Type Starter List

- **Context:** SPEC-06 workshop — OI-01. Need a starter set of Purchase Types for CNV-002 seed data.
- **Decision:** 13 top-level types: Groceries, Dining, Transportation, Shopping, Subscriptions, Bills & Utilities, Travel, Health, Entertainment, Personal, Credit Card Fees, Reimbursable, Other. ~30 subtypes across applicable parents. All user-editable after seed.
- **Rationale:** Covers typical Canadian personal spending categories. Reimbursable is churning-specific (D-97). Subtypes provide reporting granularity within parent budget buckets.
- **Resolves:** OI-01.

## D-99: Earning Category Starter List

- **Context:** SPEC-06 workshop — OI-02. Need starter Earning Categories matching credit card multiplier buckets.
- **Decision:** 14 categories: Groceries, Dining, Gas, Transit, Travel, Streaming, Recurring Bills, Drugstores, Entertainment, Air Canada, Marriott Hotels, EV Charging, Foreign Currency, Everything Else. All user-editable.
- **Rationale:** Derived from analysis of multiplier categories across major Canadian credit cards (Amex, TD, CIBC, Scotia, BMO, RBC, Tangerine, Rogers, Neo). Categories are granular enough to capture distinct multiplier tiers. Niche categories (Furniture, Fitness, E-Games) omitted — user can add as needed.
- **Resolves:** OI-02.

## D-100: Full Canadian Issuer and Rewards Program Seed

- **Context:** SPEC-06 workshop — scope of issuer and rewards program seed data. Originally scoped to Sandro's 4 active issuers.
- **Decision:** Seed all major Canadian issuers (12) and rewards programs (14) with CPP valuations. Sandro's valuations: Aeroplan 2.0, MR 2.0, Bonvoy 0.6, Scene+ 1.0, TD First Class 0.5, CIBC Aventura 1.0, RBC Avion 2.0. Community estimates for rest.
- **Rationale:** Broader seed supports future card acquisitions without needing to manually add issuers/programs. CPP valuations are user-adjustable (D-09).

## D-101: Issuer Application Rules Seed and Enum Changes

- **Context:** SPEC-06 workshop — defining the initial set of application rules. Research revealed `MIN_DAYS_BETWEEN` (1-in-5 Amex) does not apply in Canada, and Scotia's cooldown is issuer-wide (any card) not product-specific.
- **Decision:** 9 seed rules across 5 issuers + Aeroplan. DM amendments: add `ISSUER_COOLDOWN` to `rule_type` enum (for Scotia's issuer-wide cooldown); remove `MIN_DAYS_BETWEEN` (not used in Canada). Dropped: BMO anti-churning algorithm (informal), MBNA 5/6 inquiry rule (system can't track credit bureau inquiries).
- **Rationale:** Only rules the system can evaluate computationally are seeded. `ISSUER_COOLDOWN` is distinct from `PRODUCT_COOLDOWN` — different query scope (any card vs same product). DM-001 amendment.

## D-102: Redemption Type Entity

- **Context:** SPEC-06 workshop — BA description of FRM-009 mentions "redemption types" but no corresponding entity in DM-001. Useful for grouping redemptions in the trophy case (RPT-004).
- **Decision:** New Redemption Type entity (id, name, sort_order). `redemption_type_id` FK added to Redemption entity. Seed values: Flight, Hotel, Transfer to Partner, Cash Back, Gift Card, Merchandise. Fully editable in FRM-009.
- **Rationale:** Enables filtering and grouping in RPT-004 trophy case. DM-001 amendment.

## D-103: Budget Allocation Time-Bounding UX

- **Context:** SPEC-06 workshop — D-40 requires Budget Allocations to be time-bound for historical accuracy. UX must make this transparent.
- **Decision:** User edits ratios inline as a simple update. System auto-closes old row (`effective_to = yesterday`) and creates new row (`effective_from = today`). "Show History" toggle reveals closed rows (greyed out, read-only).
- **Rationale:** Time-bounding preserves what the budget WAS in a given month, but the user shouldn't have to think about effective dates. Transparent auto-close/create with optional history view balances accuracy and simplicity.

## D-104: CNV-003 Delivery via CDS Seed Files

- **Context:** SPEC-06 workshop — how to bootstrap Sandro's card portfolio. FRM-004 (card management UI) arrives in W1-S5 but portfolio data is needed from W1-S2 onward.
- **Options:** A) CDS seed files (auto-loaded by `cds deploy`). B) Manual entry via FRM-009/FRM-004 after UI is built.
- **Decision:** A — Seed files. One CSV per entity type under `db/data/`. Sandro fills actual card data. All future portfolio changes go through the app once FRM-004/WFL-001 are built in W1-S5.
- **Rationale:** Sprint dependency — ingestion pipeline (W1-S2), transaction processing (W1-S3), and computation engines (W1-S4) all need card data to be testable. Can't wait for W1-S5 UI.

## D-105: Vendor Merge Deferred to SPEC-04

- **Context:** SPEC-06 workshop — the categorization engine (ENH-001) auto-creates vendors. Duplicates are inevitable. Merge capability is needed but FRM-009 scope is basic CRUD.
- **Decision:** Vendor merge deferred to SPEC-04 (Transaction Categorization). FRM-009 provides view, edit, and delete for vendors + merchant pattern management on the object page.
- **Rationale:** Merge involves transaction reassignment and pattern consolidation — tightly coupled with the categorization engine, not the reference data screen.

## D-106: FRM-009 UX Enhancements

- **Context:** SPEC-06 workshop — quality-of-life improvements for the master data maintenance screen.
- **Decision:** Five enhancements: (1) Search box in entity type list panel. (2) `usage_count` column on Purchase Type, Earning Category, Vendor tables. (3) Color-coded Budget Allocation running total (green/orange/red). (4) Tooltips explaining `rule_type` enum values on Issuer Application Rules. (5) Recurrent Expense monthly total at top of table.
- **Rationale:** Each is low-effort, high-value. Search helps find entities quickly among 20 types. Usage counts inform delete decisions. Color reinforces budget status at a glance. Tooltips demystify technical enum values. Expense total gives "what are my fixed costs?" at a glance.

## D-107: CNV-001 Scripted Conversion

- **Context:** SPEC-14 workshop — how to execute the historical transaction backfill. FRM-003 wizard would require ~96 individual file imports (90 TD monthly files alone).
- **Options:** A) UI-driven via FRM-003 wizard. B) Scripted conversion run by Claude.
- **Decision:** B — Scripted conversion. Claude runs a TypeScript/CAP script that parses CSVs, filters, categorizes, and bulk-inserts. Interactive: script halts on errors for investigation.
- **Rationale:** CNV-001 is a one-time conversion, not an ongoing process. 96 files through the wizard would be tedious and error-prone. A script is faster, repeatable, and aligns with SAP conversion methodology (LSMW/BDC). Claude can also apply reasoning for categorization during the run.

## D-108: FRM-003 Multi-File Upload

- **Context:** SPEC-14 workshop — initially proposed as a backfill feature, but Sandro wants it for ongoing FRM-003 use (e.g., catching up on multiple months of Scotia CSVs).
- **Decision:** Add multi-file upload to FRM-003 with restriction that all files must be for the same card. Files processed sequentially using the same CSV Format Config. SPEC-01 amendment.
- **Rationale:** Useful for day-to-day operation, not just backfill. Same-card restriction ensures consistent format config resolution and card attribution.

## D-109: Historical Backfill — Purchases Only

- **Context:** SPEC-14 workshop — CSV exports contain purchases, payments, refunds, and pending transactions. Which to import?
- **Decision:** Import purchases only. Skip payments and refunds. Filter logic: Scotia Type="Debit" + status="posted", TD/CIBC debit column populated, Amex positive amounts.
- **Rationale:** Payments are cash flow between bank account and credit card — not spending data. Refunds would complicate budget and churning metrics for historical data. Ongoing ingestion via SimpleFIN may handle these differently.

## D-110: Categorization as Part of Conversion

- **Context:** SPEC-14 workshop — should historical transactions be categorized during the backfill or deferred to ENH-001 + FRM-001?
- **Options:** A) Import uncategorized, defer to ENH-001 + FRM-001. B) Categorize during conversion.
- **Decision:** B — Three-tier categorization during conversion: ENH-001 rules first, Claude reasoning for unmatched, Sandro manual review for remaining. No transaction saved without Purchase Type + Earning Category.
- **Rationale:** Sandro wants all fields populated post-conversion. Bootstraps ENH-001's learned patterns with 1,200+ real transactions, enabling strong day-one auto-categorization for ongoing imports. Claude reasoning bridges the cold-start gap.

## D-111: Date Cutoff Strategy

- **Context:** SPEC-14 workshop — SimpleFIN pulls ~90 days of history on first connection. CSV backfill could overlap with SimpleFIN data.
- **Options:** A) Rely on fuzzy dedup (D-88) to handle overlap. B) Date cutoff — CSV covers pre-SimpleFIN history only.
- **Decision:** B — Date cutoff. `SIMPLEFIN_CONNECTION_DATE` stored in System Config. TD/Amex/CIBC: import only transactions before this date. Scotiabank: no cutoff (not on SimpleFIN, always CSV).
- **Rationale:** Fuzzy dedup across different description formats (SimpleFIN vs CSV) is risky for 800+ rows. Clean date boundary eliminates overlap entirely. Pre-requisite: Sandro downloads all CSVs before connecting SimpleFIN.

## D-112: Halt on Parse Errors

- **Context:** SPEC-14 workshop — error handling strategy for the scripted conversion.
- **Options:** A) Skip bad rows, log, continue. B) Halt and investigate.
- **Decision:** B — Script halts on any parse error, logs file name + line number + raw row. All-or-nothing per file (no partial commits).
- **Rationale:** Interactive script run by Claude — halting is safe and ensures data quality. Better to investigate than silently skip potentially important transactions.

## D-113: Amex Cobalt Only Supp Cards for Backfill

- **Context:** SPEC-14 workshop — which cards have supplementary cardholders in the historical data?
- **Decision:** For the initial backfill, only Amex Cobalt has supplementary cardholders. All other cards (Amex Gold, Amex Bonvoy, TD, CIBC, Scotia) are single-cardholder for backfill purposes.
- **Rationale:** Simplifies card attribution logic. Supp card matching (Cardmember → cardholder_name per D-91) only needed for one card.

## D-114: ENH-001 Matching Algorithm

- **Context:** SPEC-02 workshop — defining the matching pipeline priority and tie-breaking rules for the Transaction Categorization Engine.
- **Options:** A) Weighted scoring across all match types. B) Strict priority order with cascading tie-breakers.
- **Decision:** B — Strict priority: exact > starts_with > contains (all case-insensitive, trimmed). Tie-breaking within same tier: amount-specific patterns preferred over amount-null → higher confidence level → longer pattern → higher vendor transaction count (computed). Only the top-scoring match is used.
- **Rationale:** Strict priority is predictable and debuggable. Exact matches should always win over partial matches. Amount-specific patterns enable same-description-different-vendor scenarios (e.g., APPLE.COM/BILL). Computed transaction count avoids stored counter drift.

## D-115: No Auto-Vendor Creation

- **Context:** SPEC-02 workshop — should ENH-001 auto-create Vendor records when encountering unknown merchant descriptions?
- **Options:** A) Auto-create vendor from raw description. B) Leave uncategorized, user creates vendors.
- **Decision:** B — ENH-001 is a matching engine only. It never creates Vendor or Merchant Pattern records. No match = transaction stays `uncategorized` with no vendor. Vendor creation is always a user action (FRM-001, FRM-003, or CNV-001).
- **Rationale:** Auto-creation from noisy bank descriptions (e.g., "AMZN MKTP US*2K4R7J3M") would create junk vendor records. User-driven creation keeps the vendor list clean and intentional.

## D-116: Learning Mechanism — Auto-Create Merchant Pattern on User Correction

- **Context:** SPEC-02 workshop — how does the system learn from user categorization corrections to improve future auto-matching?
- **Decision:** When a user assigns a vendor to an unmatched transaction, the system auto-creates a Merchant Pattern: `pattern` = full `raw_description` (trimmed), `match_type` = exact, `pattern_source` = learned, `confidence_level` = medium, `is_active` = true. When the description already matched a *different* vendor (user is correcting), the auto-created pattern includes the transaction's `amount` as a discriminator (D-118). No pattern created if an existing pattern on the assigned vendor already matches the description.
- **Rationale:** Exact patterns are conservative — only match identical bank descriptions. Users can manually generalize to `contains` or `starts_with` via FRM-009 if needed. Amount discriminator handles the APPLE.COM/BILL scenario (YouTube Premium vs iCloud at different price points).

## D-117: Computed Usage Counts — Drop Stored Counters

- **Context:** SPEC-02 workshop — Sandro questioned whether stored `usage_count` fields on Vendor, Purchase Type, and Earning Category are redundant since they can be computed from transactions.
- **Options:** A) Keep stored counters (O(1) read, risk of drift). B) Compute on the fly from transactions (always accurate, trivial query at this volume).
- **Decision:** B — Remove `usage_count` from Vendor (§4.8), Purchase Type (§3.3), and Earning Category (§3.4). Convert Vendor Category Stats (§4.15) from a stored entity to a CDS view computing `COUNT(*)` grouped by `(vendor_id, purchase_type_id, earning_category_id)` from Transaction. Dropdown ordering and ENH-001 category suggestions query the view directly.
- **Rationale:** Transaction volume is ~100-300/month (~5,000-10,000 total with backfill). COUNT queries are sub-millisecond at this scale. Stored counters risk drift if any code path modifies transactions without updating counters. Simpler learning mechanism — no explicit counter writes needed. DM-001 amendment.

## D-118: Amount Field on Merchant Pattern

- **Context:** SPEC-02 workshop — Sandro's YouTube Premium and iCloud both appear as "APPLE.COM/BILL" in bank descriptions. Only the transaction amount distinguishes them.
- **Options:** A) Drop amount-based matching for V1 (user corrects monthly). B) Add optional `amount` field to Merchant Pattern as a discriminator.
- **Decision:** B — Add `amount` (decimal, optional) to Merchant Pattern. When set, pattern only matches if both description AND amount match. Null = amount ignored. Amount-specific patterns are preferred over amount-null patterns in the matching pipeline (D-114). Auto-created by the learning mechanism (D-116) when a user corrects a transaction whose description already matched a different vendor.
- **Rationale:** Without this, Sandro would correct the same two Apple transactions every month — defeating the automation promise. The optional field keeps the simple case simple (most patterns have `amount = null`) while handling the multi-vendor-same-description edge case cleanly. DM-001 amendment.

## D-119: Split Remainder Implicitly Reimbursable

- **Context:** SPEC-02 workshop — when a $110 transaction is split with $22 as "my share," where does the remaining $88 go for budget purposes?
- **Options:** A) Remainder vanishes from budget (implicit). B) Remainder explicitly attributed to Reimbursable Purchase Type.
- **Decision:** B — The budget engine (ENH-007) attributes `my_share_amount` to the transaction's Purchase Type and `amount - my_share_amount` to Reimbursable (excluded from budget via D-97 `excludes_from_budget`). No extra storage or FK needed — the budget engine computes this implicitly.
- **Rationale:** Every dollar of every transaction is accounted for. The remainder is "money I spent on behalf of others" — that's exactly what Reimbursable means. Implicit computation avoids adding fields to Transaction Split.

## D-120: Recurring Split Suggestions Only — Never Auto-Apply

- **Context:** SPEC-02 workshop — when a transaction matches a vendor with a previous `is_recurring = true` split, should the split be auto-applied or suggested?
- **Options:** A) Auto-apply recurring splits silently. B) Suggest and require user confirmation.
- **Decision:** B — Suggest only. Split dialog pre-populates with previous split terms. Percentage-based recalculates on new amount; dollar-based keeps fixed amount. User confirms or dismisses during weekly review in FRM-001.
- **Rationale:** Auto-applying silently could hide errors (e.g., user went to padel solo one week, or the group size changed). The weekly review session is the right place to confirm splits — it's a 2-second confirmation for recurring cases.

## D-121: FRM-001 Inline Editing and List Actions

- **Context:** SPEC-02 workshop — defining the interaction model for the Transaction List & Review screen.
- **Decision:** Four sub-decisions:
  - **Inline editing on list:** Vendor (value help), Purchase Type (dropdown), Earning Category (dropdown), Notes (text). All other fields require object page navigation.
  - **Split action:** Button on list toolbar. Select row → popover/dialog with split fields. Pre-populated with recurring suggestion if applicable.
  - **Bulk apply:** Multi-select rows → "Apply Categories" → set vendor, PT, EC once → applied to all selected. Learning mechanism fires per unique `raw_description`.
  - **Re-categorize:** Action on list toolbar. Re-runs ENH-001 on selected rows. Skips `user_corrected` transactions to respect user intent.
- **Rationale:** Inline editing for the 4 most-changed fields keeps weekly review fast — no object page round-trip for simple categorization. Split as a toolbar action avoids navigating to the object page for a quick split. Bulk apply handles the "5 Shell Station variants" scenario. Re-categorize is useful after adding new patterns in FRM-009.

## D-122: Vendor Merge on FRM-009

- **Context:** SPEC-02 workshop — D-105 deferred vendor merge to this spec. Auto-created vendors from user corrections will inevitably create duplicates ("Amazon" vs "Amazon.ca" vs "AMZN").
- **Decision:** "Merge Into..." action on FRM-009 Vendor object page. User selects target vendor. Merge reassigns all transactions from source → target, moves Merchant Patterns to target, deletes source vendor. Vendor Category Stats CDS view auto-reflects merged data (computed, not stored). SPEC-06 amendment.
- **Rationale:** FRM-009's Vendor object page is where the user already manages Merchant Patterns — natural place for merge. Merge involves transaction reassignment and pattern consolidation, which is why D-105 deferred it from basic CRUD.

## D-123: Monthly Recurring MSR = Billing Periods

- **Context:** SPEC-04 workshop — defining how monthly recurring MSR tranches (e.g., Amex Cobalt "$500/month for 12 months") compute their monthly windows. Research confirmed Amex Canada uses "monthly billing period" (statement cycle), not calendar months.
- **Decision:** Monthly recurring MSR periods align to the cardholder's billing cycle (statement closing date), not calendar months. Posted date governs which period a transaction counts toward. Each period is independently evaluated — no carryover of excess spend between periods. Missing a period forfeits that period's bonus only; subsequent periods are unaffected. Transactions posting after the final period ends are lost entirely.
- **Rationale:** Matches Amex Canada's actual terms and conditions language ("for each monthly billing period"). Independent evaluation with no carryover reflects real issuer behavior confirmed across Prince of Travel, PointsWise, and Milesopedia.

## D-124: Statement Close Day on Card Instance

- **Context:** SPEC-04 workshop — D-123 requires knowing the card's billing cycle to compute monthly recurring MSR periods. No existing field captures this.
- **Decision:** Add `statement_close_day` (integer, 1–31, optional) to Card Instance. Required only for cards with monthly_recurring offer tranches. ENH-003 uses this to compute precise billing period boundaries.
- **Rationale:** The only way to accurately model monthly recurring MSR per issuer billing cycles. Optional field avoids forcing entry for cards with one-time-only tranches.

## D-125: Overlapping Tranches — Cumulative Spend Thresholds

- **Context:** SPEC-04 workshop — multi-tranche offers like "spend $1,000 → 10K pts, spend $3,000 → 20K pts" in the same window. Clarified that the $1,000 counts toward the $3,000 (not $1,000 + $3,000 = $4,000 total required).
- **Decision:** When multiple tranches share the same window (same `unlock_month` and `msr_window_months`), qualifying spend counts toward ALL overlapping tranches. Each tranche's `msr_amount` is a cumulative threshold, not an incremental one. Sequential tranches (different `unlock_month`, e.g., month 13 retention bonus) have separate windows where only that window's spend counts.
- **Rationale:** Matches real-world issuer behavior where multi-tier welcome bonuses use cumulative thresholds within a single spending period.

## D-126: Auto-Create Points Adjustment on Tranche Met

- **Context:** SPEC-04 workshop — when ENH-003 detects a tranche or monthly period is met, should bonus points automatically appear in ENH-006's balance or require manual entry?
- **Decision:** Automatic. When a tranche or monthly period flips to `met`, ENH-003 auto-creates a Points Adjustment record (type = signup_bonus, amount = tranche's bonus_amount). For monthly recurring, one adjustment per met period (up to N adjustments). Creation is idempotent — duplicate check prevents double-crediting.
- **Rationale:** Automation is the project's foundation principle. Manual entry of earned bonuses would be tedious and error-prone, especially for 12-period monthly recurring offers.

## D-127: MSR Deadline Alert Lead Time — Configurable

- **Context:** SPEC-04 workshop — `msr_deadline` alert should fire before a window/period closes. Discussed 7-day vs 14-day lead time.
- **Decision:** 14 days default, stored as System Config key `MSR_DEADLINE_ALERT_DAYS`. User can adjust via FRM-009.
- **Rationale:** 14 days gives enough time to redirect spending to the MSR card. Configurable via TVARVC (System Config) rather than hardcoded, per the project's pattern for runtime parameters (D-87).

## D-128: Dual-Trigger Evaluation for ENH-003

- **Context:** SPEC-04 workshop — ENH-003 needs to evaluate both when new transactions arrive (progress update) and when time passes (deadline/missed detection).
- **Decision:** Two triggers: (1) Transaction processing — after each new transaction is ingested/categorized, recalculate progress for the card's in-progress tranches. (2) Daily scheduled check via node-cron — evaluate time-based alerts (msr_deadline, bonus_missed) across all active cards.
- **Rationale:** Transaction-triggered evaluation gives immediate feedback on bonus progress. Daily check catches deadlines and missed bonuses that are time-driven, not transaction-driven.

## D-129: Points Computation Excludes Refund Transactions

- **Context:** SPEC-04 workshop — should refund transactions earn negative points (clawback)? In reality, issuers do claw back points on refunds.
- **Decision:** Refund transactions (positive amounts) are excluded from ENH-006 points computation. Points clawbacks handled manually via Points Adjustment (type = correction) when they occur.
- **Rationale:** User preference — manual handling is simpler and sufficient for the low frequency of refund-related point adjustments. Avoids complexity of automatic negative points computation.

## D-130: Points Balance Dual Aggregation

- **Context:** SPEC-04 workshop — should points balances be shown per-program only, or also per-card within a program?
- **Decision:** Both. Primary view is per-program (aggregated across all cards earning into that program). Per-card breakdown available as drill-down within each program. Program-level adjustments/redemptions (card_instance_id = null) included in program total but not attributed to any specific card.
- **Rationale:** Per-program is the natural unit for redemption decisions and valuation. Per-card breakdown feeds ENH-005 (Card Profitability) in Wave 2 and helps users understand which cards are earning the most.

## D-131: Simplified Budget Formula — Remove Recurrent Expenses

- **Context:** SPEC-05 workshop — the original budget formula (Income − Recurrent Expenses − Goal Allocations = Discretionary) causes double-counting. Recurrent expenses are pre-deducted from income, but the same transactions also appear as credit card charges and count toward their Purchase Type's spend.
- **Options:** A) Keep pre-deduction, exclude recurrent transactions from category spend (complex matching). B) Keep pre-deduction, create "Fixed Expenses" excluded Purchase Type (loses category granularity). C) Remove recurrent expenses from formula entirely, retain as forecasting data.
- **Decision:** C — Simplified formula: `Income − Goal Allocations = Total Budget`. Recurrent Expense entity remains for forecasting/planning (e.g., "I know $45 in subscriptions is coming this month") but does not participate in the budget math. ENH-007 reports `recurrentsExpected` per category as informational data.
- **Rationale:** Eliminates double-counting completely. All transactions — recurring or discretionary — flow through the same Purchase Type budget. Recurrent data is still visible for mid-month forecasting without complicating the core computation. DM-001 §8 amendment — Budget Status formula updated.

## D-132: Spending Goal Transactions Excluded from Purchase Type Budget

- **Context:** SPEC-05 workshop — spending goals (e.g., "Japan Vacation") deduct a monthly allocation from income. When the user eventually books the trip and links the transaction via `goal_id`, that spend should not also count against the Travel Purchase Type budget — the goal allocation already accounted for it.
- **Decision:** Transactions with `goal_id IS NOT NULL` (linked to a spending goal) are excluded from Purchase Type budget computation. The goal's `monthly_allocation` deduction already represents the budgeted saving for that expense. Goal-linked transactions still appear in goal progress views (SPEC-09).
- **Rationale:** Prevents penalizing the user twice — once via goal allocation reducing total budget, and again via the transaction reducing category remaining. The separation is clean: goals manage the saving phase, Purchase Type budgets manage unplanned spending.

## D-133: Goal Allocations Exceed Income — Alert and Continue

- **Context:** SPEC-05 workshop — edge case where total goal allocations exceed total income, producing a negative total budget.
- **Options:** A) Block goal activation when it would exceed income. B) Warn but still compute. C) Compute silently.
- **Decision:** B — Engine computes normally with negative total budget. Triggers a `budget_goals_exceed_income` alert notification. All category budgets will be negative, making the overspend visible.
- **Rationale:** The user may have temporary income dips or aggressive saving targets. Blocking would be frustrating. The alert ensures visibility without being obstructive.

## D-134: Budget Alert Types

- **Context:** SPEC-05 workshop — defining what budget-related alerts the system should generate.
- **Decision:** Four budget alert types, all triggered during transaction processing (except `budget_goals_exceed_income` which also triggers on Income Entry save and Goal save):
  1. `budget_category_warning` — category spend crosses `BUDGET_WARNING_THRESHOLD_PCT` (System Config, default 80%)
  2. `budget_category_overspend` — category actual exceeds budgeted amount
  3. `budget_overspend` — total actual spend exceeds total budget
  4. `budget_goals_exceed_income` — total goal allocations exceed total income
- **Rationale:** These four cover the meaningful budget breach scenarios. The configurable threshold (80% default) gives the user a heads-up before overspending. Alerts are idempotent per type + month + Purchase Type to prevent duplicates. DM-001 amendment — new System Config key, new Alert Type seed values.

## D-135: Mid-Month Allocation Change — Retroactive

- **Context:** SPEC-05 workshop — when Budget Allocation ratios change mid-month (D-103 auto-closes old row, creates new), should the new ratios apply retroactively to the entire month or should spend be pro-rated across old and new ratios?
- **Options:** A) Retroactive — new ratios apply to full month. B) Pro-rated — old ratios for days before change, new ratios after.
- **Decision:** A — Retroactive. The latest active Budget Allocation set applies to the entire calendar month. Since the engine computes on-the-fly, changing ratios mid-month simply recalculates with the new set.
- **Rationale:** Pro-rating adds date math complexity within the month for minimal benefit in a single-user system. Retroactive is simpler and matches the mental model: "my budget categories for this month are now X."

## D-136: Bonus Override Formula for Card Recommendation

- **Context:** SPEC-07 workshop — ENH-002 needs to determine when a card with an active MSR should override the highest-earning card for a given purchase category (D-06). Need a concrete formula for comparison.
- **Options:** A) Always recommend the MSR card when MSR is active. B) Compare bonus value per remaining dollar against the earning rate difference. C) Show both options side-by-side without making a recommendation.
- **Decision:** B — `bonus_value_per_dollar = (bonus_amount × cpp_valuation / 100) / remaining_msr`. Override the default recommendation when `bonus_value_per_dollar + card_earn_rate > best_card_earn_rate`. This adds the bonus incentive to the card's base earn rate and compares the total against the best alternative.
- **Rationale:** Captures the real decision Sandro makes manually — "is chasing this bonus worth giving up the better earn rate?" The formula makes it quantitative. Option A would over-recommend MSR cards when the remaining bonus value is negligible (e.g., $3,000 remaining for a 5,000 point bonus on a low-CPP program). Option C doesn't answer the question.

## D-137: Card Eligibility for Recommendations

- **Context:** SPEC-07 workshop — which card lifecycle states should ENH-002 include in its recommendations? Cards in "To Cancel" are still physically usable but the user intends to cancel them.
- **Options:** A) Focus + Active only. B) Focus + Active + To Cancel. C) All non-Closed.
- **Decision:** B — Include Focus, Active, and To Cancel. Exclude Closed. Additionally, cards must have `activation_date` set (cards without activation_date can't be used for purchases). Option B and C are equivalent since the only states are Focus/Active/To Cancel/Closed.
- **Rationale:** A card in "To Cancel" is still in the user's wallet and usable. Excluding it would mean the user misses optimal earning on a card they're still carrying. The user explicitly confirmed this behavior.

## D-138: Nearest Achievable Tranche for Multiple In-Progress

- **Context:** SPEC-07 workshop — when a card has multiple overlapping in-progress tranches (D-125), which tranche should drive the bonus override calculation?
- **Options:** A) Aggregate all in-progress tranches into a combined bonus-per-dollar figure. B) Use the nearest achievable tranche (lowest remaining MSR).
- **Decision:** B — Use the nearest achievable tranche. Once that tranche is met, the system recalculates and the next tranche becomes the new driver.
- **Rationale:** The nearest tranche gives the most compelling "use this card now" argument. Being $200 from a 25,000 point bonus is extremely high value per dollar. Aggregating would dilute this urgency — combining a near tranche with a far tranche produces a moderate average that understates the immediate value.

## D-139: Tie-Breaking Order for Equal Earn Rates

- **Context:** SPEC-07 workshop — when two cards have identical effective earn rates for a category (e.g., two Aeroplan cards at 1.5× with the same CPP), how should ENH-002 break the tie?
- **Decision:** Ordered tie-breaking: (1) prefer card with in-progress MSR, (2) prefer Focus over Active over To Cancel, (3) alphabetical by Market Card name.
- **Rationale:** MSR-first accelerates bonus completion — any spend on a card working toward MSR is more valuable than the same spend on a card with no active bonus. Focus over Active because Focus cards are the user's current priority. Alphabetical as a stable final tiebreaker.

## D-140: RPT-006 UX — Heat Map, Wallet Summary, and Matrix Enhancements

- **Context:** SPEC-07 workshop — UX enhancements for the card recommendation matrix beyond basic data display.
- **Decision:** Five enhancements:
  1. **Heat map gradient:** Cell background color intensity proportional to effective earn rate — provides instant visual read of value concentrations without reading numbers.
  2. **"Your Wallet" summary card:** Above the matrix, shows optimal card distribution with category counts (e.g., "Cobalt: 6 categories, TD Aeroplan: 5 categories").
  3. **Max Yield column:** Additional column showing the best earn rate per category row. Shown by default, toggleable via Fiori variant management.
  4. **Sticky column headers:** Card names remain visible when scrolling through categories.
  5. **Cell click popover:** Full calculation breakdown (multiplier, program, CPP, earn rate, bonus math if applicable).
  6. **Top 5 Yields section:** Ranked list of the 5 highest effective earn rate combinations (category × card), base rates only.
  7. **Inline MSR context:** Bonus override cells show remaining amount and days left directly in the cell (e.g., "$320 left · 18 days") rather than tooltip-only.
- **Rationale:** Heat map and wallet summary are the highest-impact additions — one gives instant visual analysis, the other answers "what do I carry?" Max Yield column, sticky headers, and cell popovers are standard data-dense table UX. Inline MSR context was preferred over tooltip to keep critical information immediately visible.

## D-141: Earning Category Object Page with Yield Table (SPEC-06 Amendment)

- **Context:** SPEC-07 workshop — Sandro requested a yield table on the Earning Category detail page in FRM-009, showing which cards earn the most for that category.
- **Decision:** Promote Earning Category in FRM-009 from inline-edit-only (D-93) to object page navigation. The object page includes: header with editable fields (name, sort order) + a read-only yield table showing all eligible cards ranked by effective earn rate for that category. Columns: card name, rewards program, multiplier, CPP, effective earn rate. Base rates only — no bonus override context. Powered by ENH-002's single-category query mode.
- **Rationale:** Natural place to see "which cards are best for Dining?" while maintaining reference data. Keeps the context close to the data being edited. Base rates only because the yield table is a reference view, not a real-time recommendation — bonus overrides are temporal and belong on RPT-006.

## D-142: Card Profitability Formula — No Redemption at Card Level

- **Context:** SPEC-08 workshop — ENH-005 profitability formula originally stated "Points earned ($) + Redemptions + realized Card Perks − fee Transactions" (DM-001 §8). This double-counts because redemptions are per-program, not per-card. Multiple cards can earn into the same Rewards Program, so a redemption can't be cleanly attributed to a specific card.
- **Options:** A) All-CPP valuation — value all points at CPP regardless of redemption status. No redemption line at card level. B) Pro-rata redemption attribution — distribute redemptions across cards proportional to each card's contribution to the program's total points. C) Let user manually attribute redemptions to cards.
- **Decision:** A — Formula: `Net Value = Spend-Based Value + Signup Bonus Value + Referral Bonus Value + Realized Perks − Fees Paid`. All points valued at current CPP. Five separate revenue lines (spend-based, signup bonus, referral bonus, realized perks, fees) displayed independently. Annual Fee subtype only for fees — FX Fee and Interest excluded.
- **Rationale:** Cleanest approach. CPP is already an estimate. The per-card question is "how much value does this card generate?" not "how did I spend those points." Redemption analysis belongs at the program level (trophy case / RPT-004). Pro-rata (B) is mathematically complex and potentially confusing. Manual attribution (C) is tedious. Separating signup and referral from spend-based earnings lets Sandro see ongoing card value vs one-time events.

## D-143: Anniversary-Based Card Years + Dual Time Scope

- **Context:** SPEC-08 workshop — ENH-005 needs a time period definition for per-year profitability. The renewal decision depends on "did this card earn more than its fee this year?"
- **Options:** A) Anniversary-based — activation_date to activation_date + 1 year. B) Calendar year — Jan to Dec. C) Both anniversary and calendar.
- **Decision:** A — Anniversary-based, 365-day periods from activation_date. Card Year N starts at `activation_date + ((N-1) × 365)`. Both all-time and per-card-year profitability computed. For closed cards, final card year ends at closed_date.
- **Rationale:** Fees hit on the anniversary, so the year should match the fee cycle. Calendar years would split a card's fee across two budget periods, making the "worth the fee?" question harder to answer. All-time gives lifetime ROI; per-card-year drives the renewal decision.

## D-144: RPT-005 Navigation and Card Scope

- **Context:** SPEC-08 workshop — RPT-005 needs a card selector and entry point.
- **Options:** A) Dropdown only — navigate to RPT-005 from side nav, pick a card. B) Navigate from FRM-004 — click through from My Cards to analytics, dropdown available for switching.
- **Decision:** B — Primary entry from FRM-004 (My Cards) card detail → "Analytics" link → RPT-005 pre-filtered. Dropdown on RPT-005 for switching without navigating back. All lifecycle states included (Focus, Active, To Cancel, Closed). Active cards grouped on top, Closed below in dropdown.
- **Rationale:** Natural flow: "I see my Cobalt in My Cards, let me dig into its performance." The dropdown allows quick switching once on the analytics page. Including closed cards preserves historical profitability data for "was that card worth it?" analysis.

## D-145: Breakeven Monitor

- **Context:** SPEC-08 workshop — cards with fees need a "is this card paying for itself?" indicator in the current fee period.
- **Decision:** Breakeven monitor shows fee target vs earned value for the current period. Fee target source: Market Card.fee_amount for current period (forward-looking), actual fee transactions for historical periods. FYF year 1 = $0 (auto-met). Period matches fee_structure: monthly periods for monthly-fee cards (statement_close_day boundaries), card-year periods for annual-fee cards. Hidden for closed cards and no-fee cards.
- **Rationale:** Using Market Card.fee_amount for the current period lets the breakeven work before the fee transaction posts. Matching the fee period to the fee structure ensures the comparison is meaningful — monthly fee cards show monthly progress, not an annualized figure that's hard to act on.

## D-146: RPT-005 Sections

- **Context:** SPEC-08 workshop — defining the content sections for the per-card analytics dashboard.
- **Decision:** Eight sections: (1) Profitability Breakdown — five-line table with net value, (2) Breakeven Monitor — progress bar with points needed, (3) Effective Earn Rate — blended rate with comparison to base, (4) Bonus Progress — active MSR tranche from ENH-003, (5) What to Use This Card On — earning multipliers sorted by value with ENH-002 best-card indicator, (6) Spend Trend — monthly spend chart with card year boundary markers, (7) Category Spend Breakdown — donut chart by Earning Category, (8) Year-over-Year Comparison — table across all card years.
- **Rationale:** Covers the full card analytics lifecycle: value extraction (profitability, breakeven), optimization (earn rate, what to use it on), progress tracking (bonus, spend trends), and historical comparison (YoY). "What to Use This Card On" addresses the practical question Sandro asks when choosing a card at checkout.

## D-147: RPT-005 Headline KPIs

- **Context:** SPEC-08 workshop — Sandro requested two prominent dollar figures on the card analytics page.
- **Decision:** Two ObjectNumber tiles at the top of RPT-005: "This Card Year" net value and "Lifetime" net value. Both use ENH-005 output. Semantic color: green (≥ 0), red (< 0). For closed cards, label changes to "Final Card Year".
- **Rationale:** Instant answer to "is this card paying for itself?" without scrolling. The card-year number drives the renewal decision; the lifetime number shows overall ROI. Both are needed — a card can have a poor current year but strong lifetime value (or vice versa).

## D-148: Goal Status Enum Replaces is_active

- **Context:** SPEC-09 workshop — Goal entity has `is_active` boolean, but manual completion (D-149) requires distinguishing completed goals from cancelled/abandoned ones for reporting on RPT-011.
- **Options:** A) Keep `is_active` boolean — infer completion by checking allocations vs target at deactivation. B) Replace with `status` enum (active/completed/cancelled).
- **Decision:** B — `status` enum with values `active`, `completed`, `cancelled` (default `active`). Enables explicit lifecycle tracking, distinct "Complete" and "Cancel" actions on FRM-008, and clear filtering on RPT-011.
- **Rationale:** Explicit status is cleaner than inference. Costs almost nothing and enables distinct UX for completed (achievement) vs cancelled (abandoned) goals. DM-001 amendment.

## D-149: Manual Goal Completion — No Auto-Status Change

- **Context:** SPEC-09 workshop — when a goal's cumulative allocations reach target_amount, should the system auto-complete the goal?
- **Options:** A) Auto-deactivate when allocations reach target. B) Show as "met" visually but keep active until user explicitly completes.
- **Decision:** B — System highlights that the target is reached (via `goal_completed` alert, D-155) but never changes status automatically. User clicks "Complete" when ready. For spending goals, there's often a gap between "saved enough" and "actually purchased."
- **Rationale:** Manual completion gives the user control. Saving goals may intentionally overshoot. Spending goals may not be purchased immediately upon reaching the target. The alert provides the nudge without forcing action.

## D-150: GoalForecastItem — Composition Entity for Target Breakdown

- **Context:** SPEC-09 workshop — Sandro requested a forecast feature to break down a goal's target amount into estimated line items (e.g., "Trip to Japan" → Flights $2,000, Hotels $1,500, Food $800).
- **Decision:** New GoalForecastItem composition entity (id, goal_id FK, description, estimated_amount). When items exist, `target_amount` auto-sums from `estimated_amount` and is read-only. When no items exist, `target_amount` is directly editable. Removing all items preserves the last computed sum but makes it editable again. Available for both saving and spending goals.
- **Rationale:** Planning tool that helps estimate realistic targets. Auto-sum prevents drift between line items and target. Direct entry path preserved for goals that don't need a breakdown. DM-001 amendment — new entity.

## D-151: Goal and Purchase Type Mutually Exclusive on Transaction

- **Context:** SPEC-09 workshop — spending goal transactions are excluded from PT budget (D-132). UX question: should a transaction have both a Purchase Type and a goal link, or is it one or the other?
- **Options:** A) Both — transaction has PT for analytics and goal_id for goal tracking. B) Mutually exclusive — selecting a goal clears PT and vice versa.
- **Decision:** B — Mutually exclusive. Setting `goal_id` clears `purchase_type_ID`. Setting `purchase_type_ID` clears `goal_id`. Goals appear in the same PT picker dropdown as a separate visual group, reinforcing "what is this purchase for?" as a single question.
- **Rationale:** Sandro's framing: "the goal would list under purchase types, because it's technically the same thing." Having both fields populated is redundant since goal transactions are already excluded from PT budget. Single picker with two groups is cleaner UX.

## D-152: Active Spending Goals in Purchase Type Picker

- **Context:** SPEC-09 workshop — how to surface goals in FRM-001's transaction categorization flow.
- **Decision:** FRM-001's Purchase Type dropdown (SPEC-02) displays two visual groups: (1) Purchase Types (standard categories) and (2) Goals (active spending goals only). Saving goals excluded — no transactions to link. Non-active goals excluded — completed/cancelled goals shouldn't receive new transactions. SPEC-02 amendment.
- **Rationale:** Natural UX — user is already in the PT picker when categorizing transactions. Adding goals as a second group answers "what is this purchase for?" in one interaction. No separate goal_id field needed on the form.

## D-153: Computed Goal Progress — No Contribution Ledger

- **Context:** SPEC-09 workshop — should the system track actual monthly contributions as records, or compute progress from `monthly_allocation × months_elapsed`?
- **Options:** A) Track monthly contribution records (accurate if allocation changes). B) Compute from current monthly_allocation × months elapsed (simpler, approximate if allocation changed).
- **Decision:** B — Computed progress. `monthly_allocation × months_since_start_date / target_amount × 100`. No contribution ledger. If the allocation changes mid-goal, the projection updates but historical accuracy is approximate. For spending goals, actual spend = sum of linked transaction amounts (separate from allocation progress).
- **Rationale:** A contribution ledger adds storage and write complexity for minimal benefit in a single-user system. The allocation rarely changes mid-goal. Sandro confirmed this is acceptable.

## D-154: On-Track Status — Target Date Required, 5% Tolerance

- **Context:** SPEC-09 workshop — defining on-track/behind/ahead status computation for RPT-011.
- **Decision:** On-track status only computed when `target_date` is set. Expected progress = `(months_elapsed / total_months) × target_amount`. Three statuses: Ahead (actual > expected), On Track (actual within 5% of expected), Behind (actual < 95% of expected). Goals without `target_date` show projected completion instead.
- **Rationale:** On-track requires a reference timeline — open-ended goals have no "expected" pace. 5% tolerance prevents flip-flopping between states due to rounding or minor timing differences.

## D-155: Four Goal Alert Types

- **Context:** SPEC-09 workshop — defining goal-related alerts for OI-06 (alert event types, partially open).
- **Decision:** Four alert types:
  1. `goal_deadline_approaching` — daily check, fires when active goal has target_date, is behind, and deadline within `GOAL_DEADLINE_ALERT_DAYS` (D-156)
  2. `goal_completed` — daily check, fires when cumulative allocations reach target_amount, informational only (does not change status, per D-149)
  3. `goal_spending_warning` — transaction processing trigger, fires when linked transaction sum reaches `GOAL_SPENDING_WARNING_PCT` of target_amount (spending goals only)
  4. `goal_spending_overspend` — transaction processing trigger, fires when linked transactions exceed target_amount (spending goals only)
  All alerts idempotent (goal_completed per goal, spending alerts per goal per month).
- **Rationale:** Mirrors the budget alert pattern (D-134). Deadline and completion alerts are time-driven (daily check). Spending alerts are event-driven (transaction processing). Idempotency prevents alert spam.

## D-156: Separate GOAL_SPENDING_WARNING_PCT System Config

- **Context:** SPEC-09 workshop — should goal spending warnings reuse `BUDGET_WARNING_THRESHOLD_PCT` (D-134) or have a separate config?
- **Options:** A) Reuse BUDGET_WARNING_THRESHOLD_PCT (simpler, one threshold for both). B) Separate GOAL_SPENDING_WARNING_PCT (independent tuning).
- **Decision:** B — Separate `GOAL_SPENDING_WARNING_PCT` (default 80%) and `GOAL_DEADLINE_ALERT_DAYS` (default 30). Both maintained via FRM-009 System Config.
- **Rationale:** Goals and budget categories may warrant different thresholds. Goal spending is tracked against a fixed target (finite), while budget categories reset monthly. Separate configs allow independent tuning without coupling the two systems.

## D-157: Dual Entry Workflow — Batch Primary + Individual

- **Context:** SPEC-10 workshop — how should users enter financial picture balance updates?
- **Options:** A) Individual only — navigate to each account's object page, add snapshot. B) Batch only — single screen for all accounts. C) Both — batch as primary, individual available on object page.
- **Decision:** C — Batch entry ("Update Balances" toolbar action on FRM-011 List Report) as the primary workflow. Individual snapshot entry also available on the Object Page. Batch pre-fills last known balance per account, date defaults to today, and only creates snapshots for accounts where the balance actually changed.
- **Rationale:** Monthly updates typically touch 6-8 accounts. Batch is far more efficient than navigating into each account individually. Pre-filling avoids retyping unchanged balances. Individual entry remains for ad-hoc updates (e.g., volatile assets like crypto checked mid-month).

## D-158: Flexible Snapshot Frequency — Enter Whenever, Display Monthly

- **Context:** SPEC-10 workshop — how often are snapshots entered? PSV says "monthly" but user noted wanting to track volatile assets more frequently.
- **Options:** A) Strictly monthly — one snapshot per account per month. B) Whenever — multiple snapshots per month allowed.
- **Decision:** B — Snapshots can be entered at any frequency. Dashboard resolves to monthly granularity (latest snapshot per month per account). Months with no snapshot carry forward the last known balance.
- **Rationale:** User is a long-term investor but wants flexibility for volatile assets (crypto). Monthly resolution on the dashboard keeps charts clean. Carry-forward prevents gaps in trend lines when accounts aren't updated every month.

## D-159: Expanded Financial Account Type Seed List — 12 Types

- **Context:** SPEC-10 workshop — original seed list (RRSP, TFSA, FHSA, RIF, Car Loan, Student Loan) missing crypto, vehicle, and other common account types.
- **Decision:** Expand to 12 types. Assets: RRSP, TFSA, FHSA, RIF, Crypto, Vehicle, Non-Registered, Savings Account. Liabilities: Car Loan, Student Loan, Mortgage, Line of Credit. All maintained via FRM-009 — users can add more at runtime.
- **Rationale:** Covers the common Canadian personal finance landscape. Vehicle is an asset (depreciating), separate from Car Loan (liability). Both sides needed for accurate net worth. Reference data, so easy to extend.

## D-160: Loan Metadata on Financial Account — 5 Optional Fields

- **Context:** SPEC-10 workshop — should loans track more than just balance snapshots? User wants amortization curves and payoff projections.
- **Options:** A) Balance snapshots only (simple, consistent). B) Add optional loan fields for payoff projections.
- **Decision:** B — Add 5 optional fields to Financial Account: `original_amount` (Decimal), `start_date` (Date), `interest_rate` (Decimal), `monthly_payment` (Decimal), `term_months` (Integer). First two apply to both assets and liabilities; last three are loan-specific. DM-001 amendment.
- **Rationale:** Small data model cost for high-value insight. Amortization curves and projected payoff dates are the most useful loan analytics. `original_amount` and `start_date` also serve assets (e.g., car purchase price for depreciation reference line). All fields optional — no impact on accounts that don't need them.

## D-161: Account-Type-Specific Object Pages — Conditional Sections

- **Context:** SPEC-10 workshop — loan accounts, vehicle/depreciating assets, and investment accounts each benefit from different visualizations on their Object Page.
- **Decision:** Object Page renders conditional sections based on account type and populated fields: (1) Loan accounts with all loan fields populated get an Amortization section with projected vs actual curve, "where are we now" marker, remaining balance, projected payoff, interest breakdown. (2) Vehicle/depreciating asset accounts show a balance trend with `original_amount` reference line (depreciation curve). (3) Investment accounts show Growth vs Contributions stacked area chart and True Return metrics. All accounts get Balance Trend and Monthly Changes charts.
- **Rationale:** A single object page template with conditional rendering avoids separate page types while giving each account class the most relevant visualizations. Conditions are simple: is_asset flag + which optional fields are populated.

## D-162: Financial Contribution — New Composition Entity

- **Context:** SPEC-10 workshop — without tracking contributions separately from balance changes, cannot compute true investment returns (market growth vs deposits).
- **Options:** A) No contribution tracking — just show total balance growth. B) Contribution field on Financial Snapshot — mixes concepts. C) Separate Financial Contribution entity — clean separation.
- **Decision:** C — New `FinancialContribution` composition entity under Financial Account. Fields: `id`, `financial_account_id` (FK), `amount` (positive = deposit, negative = withdrawal), `contribution_date`, `notes`. Entered on account Object Page, not part of batch entry. DM-001 amendment.
- **Rationale:** Contributions are events (you deposited $500), snapshots are observations (your balance is $52K). Different temporal patterns — contributions happen sporadically, balances are checked periodically. Separate entity enables: Market Growth = Balance Change − Net Contributions. True Return = Market Growth / Total Invested Capital.

## D-163: RPT-003 Dashboard Layout — 10 Cards, All Time Default

- **Context:** SPEC-10 workshop — what should the Financial Picture Dashboard show?
- **Decision:** 10 cards on GridContainer: (Row 1) 4 half-width KPI cards — Net Worth, Total Assets, Total Liabilities, Debt-to-Asset Ratio, all with MoM changes. (Row 2) Net Worth Trend line chart (full-width). (Row 3) Asset Allocation donut + MoM Changes bar chart (half-width each). (Row 4) Assets Trend multi-line (full-width). (Row 5) Liabilities Trend multi-line (full-width). (Row 6) Account Summary table (full-width). Default view: All Time. Year filter available.
- **Rationale:** Goes beyond PSV Problem 4 basics (net worth, debt trends, investment trends) with actionable additions: Asset Allocation donut shows concentration risk, MoM Changes bar chart highlights what moved, Debt-to-Asset ratio tracks leverage, Account Summary table gives a balance sheet at a glance. All Time default matches long-term investor perspective.

## D-164: Financial Picture Stale Alert — Single Alert Type

- **Context:** SPEC-10 workshop — does the financial picture feature generate any alerts? (OI-06 standing question)
- **Options:** Stale data reminder, net worth milestones, loan payoff milestones.
- **Decision:** One alert: `financial_picture_stale`. Triggered by daily scheduled check when any active account's latest snapshot is older than `FINANCIAL_PICTURE_STALE_DAYS` (System Config, default 45 days). Severity: Low. One alert per stale account. Idempotent.
- **Rationale:** Stale data is the only practical concern — if you forget to update, the dashboard becomes misleading. 45 days gives a 2-week grace past monthly. Milestones and payoff alerts are visible on the dashboard itself and don't warrant push notifications.

## D-165: RPT-008 Perk Tracker Dashboard Layout

- **Context:** SPEC-11 workshop — defining the Soft Perk Tracker dashboard structure, card eligibility, and time scope.
- **Decision:** Freestyle dashboard (GridContainer). Active cards only (Focus, Active, To Cancel) — Closed excluded. Current perk period only — historical periods visible on card object page (FRM-004). Grouped by perk type (one section per type). KPIs: total unrealized dollar value, perks expiring within 30 days. Display format: count-based (quantity), dollar-based (currency), binary (active/inactive) depending on perk type.
- **Rationale:** Centralized "use it or lose it" view across all cards. Active-only keeps it actionable — closed card perks are historical. Current period avoids clutter; history belongs on the card detail page. Grouping by perk type answers "how many lounge passes do I have left?" directly.

## D-166: RPT-009 Annual Summary — Calendar Year, Net Value Ranking, Earning Yield

- **Context:** SPEC-11 workshop — defining the Annual Churning Summary time scope, card ranking metric, and additional KPIs.
- **Decision:** Calendar year (Jan 1 – Dec 31) with year selector. Best/worst card by ENH-005 net value (top 3 / bottom 3). Average earning yield KPI (total value earned / total spend). Per-card earning yield in ranking table. Partial year shows data through today with no special indicator. Six sections: KPIs, best/worst, bonus scorecard, points summary, monthly trend, card ranking table.
- **Rationale:** Calendar year is the natural annual summary boundary. Net value is the most meaningful single metric for card comparison — includes fees, bonuses, and earn value. Earning yield adds the "efficiency" dimension that net value alone doesn't capture (a high-spend low-yield card vs low-spend high-yield).

## D-167: RPT-010 Fiori Elements Pattern — List Report + Object Page

- **Context:** SPEC-11 workshop — RPT-010 was originally planned as a freestyle dashboard, but the data is entity-centric (one row per rewards program) which fits Fiori Elements perfectly.
- **Options:** A) Freestyle dashboard as originally planned. B) Fiori Elements list report + object page.
- **Decision:** B — Fiori Elements list report (programs with balance, CPP, dollar value, contributing cards) + object page with four sections: Earning History (table + line chart), Redemption History (table + donut chart), Transfers & Adjustments (transfers table + manual adjustments table), Contributing Cards. Charts in custom sections. TECH_STACK.md amendment: `app/points-dashboard/` changes from freestyle to Fiori Elements.
- **Rationale:** The data is entity-centric — one row per program. Fiori Elements gives free list report features (sort, filter, variant management, search). Object page provides natural drill-down. Custom sections handle the chart requirements.

## D-168: Points Transfer Entity — Atomic Transfers with Ratio Support

- **Context:** SPEC-11 workshop — Sandro needs to track program-to-program point transfers (e.g., 20,000 MR → Aeroplan). Transfers aren't always 1:1 — ratios and promo bonuses exist.
- **Options:** A) Two independent Points Adjustments (manually linked). B) Linked adjustments with FK. C) New Points Transfer entity + auto-created adjustments.
- **Decision:** C — New `Points Transfer` transactional entity: from_program_id, to_program_id, from_amount, to_amount, transfer_date, notes. On save, atomically creates two Points Adjustments (transfer_out on source, transfer_in on destination). card_instance_id = null on both (program-level). Existing Adjustment Type seeds (transfer_in, transfer_out) already cover this — no new seeds needed. DM-001 amendment: entity count 41 → 42.
- **Rationale:** The Transfer entity is the user-facing record showing the full picture (source, destination, amounts, ratio). The paired adjustments are the accounting entries that feed ENH-006 balance computation. Separate entity avoids fragile manual pairing and cleanly captures the ratio.

## D-169: RPT-010 Actions — Transfer Points + Manual Adjustment

- **Context:** SPEC-11 workshop — entry points for point movements on the RPT-010 program object page.
- **Decision:** Two toolbar actions: (1) **Transfer Points** — dialog with destination program, from_amount, to_amount, date, notes. Creates Points Transfer per D-168. Source program = current page. (2) **Manual Adjustment** — dialog with signed amount, date, description (required). Creates standalone Points Adjustment with adjustment_type = correction. Covers promos, balance corrections, and other non-transfer movements. Existing `correction` Adjustment Type seed covers this — no new seeds needed.
- **Rationale:** Transfer is the most common point movement. Manual adjustment covers everything else without proliferating adjustment types. Both actions on the object page keep the context close to the data.

## D-170: Two Separate Pages for RPT-007 and RPT-012

- **Context:** SPEC-12 workshop — RPT-007 (Spending Trends) and RPT-012 (Income vs Expenses Trend) are both in the Finances nav group. Could be combined into one page or kept as separate nav items.
- **Options:** A) Two separate nav items (consistent with D-58 navigation structure). B) One combined "Budget Analytics" page with both views as sections.
- **Decision:** A — Two separate pages. Each gets its own freestyle dashboard under its own nav item, consistent with the Design System (D-58).
- **Rationale:** D-58 already defines them as separate nav items. They answer different questions — RPT-007 is "how has my spending shifted" and RPT-012 is "am I living within my means." Separate pages keep each focused.

## D-171: Year Dropdown Selector for Budget Analytics Dashboards

- **Context:** SPEC-12 workshop — both dashboards need a time scope selector. Options: year dropdown, rolling 12 months, or custom date range.
- **Options:** A) Year dropdown (consistent with SPEC-11 pattern). B) Rolling 12 months (no selector). C) Custom month-from / month-to range picker.
- **Decision:** A — Year dropdown, same pattern as SPEC-11 RPT-009. Lists calendar years with data, default = current year. Partial-year behavior: current year shows months through today, future months absent, no YTD indicator.
- **Rationale:** Simple, consistent with existing SPEC-11 pattern. Historical data back to 2023 needs year selection. Calendar year is the natural budget review boundary (D-12 no rollover).

## D-172: RPT-007 Spending Trends — 7-Section Dashboard Layout

- **Context:** SPEC-12 workshop — defining the section layout for the Spending Trends dashboard. BA description: "spend by category over time, month-over-month comparison, seasonal patterns, vendor concentration shifts."
- **Decision:** Seven sections: (1) KPI Row — Total Spend YTD, Avg Monthly Spend, Highest-Spend Month, Over-Budget Months. (2) Spend by Category Over Time — stacked bar. (3) Budget vs Actual Trend — dual-line chart. (4) Category Health Heatmap — table with status-colored cells. (5) Month-over-Month Comparison — table with delta columns. (6) Vendor Concentration — horizontal bar, top 10, with optional Purchase Type filter dropdown. (7) Uncategorized Spend Trend — combo chart (bars = amount, line = count).
- **Rationale:** Sections 1, 2, 5, 6 directly address the BA description. Section 3 (Budget vs Actual) answers the most natural budget question — "am I staying on track over time?" Section 4 (Heatmap) provides the persistent-problem-category view. Section 7 (Uncategorized) serves as a data quality indicator for the categorization engine. Vendor filter on section 6 lets Sandro drill into "where does my Dining Out money go?"

## D-173: RPT-012 Income vs Expenses — 5-Section Dashboard Layout

- **Context:** SPEC-12 workshop — defining the section layout for the Income vs Expenses dashboard. BA description: "income vs total outflow, savings rate over time, surplus vs deficit months."
- **Decision:** Five sections: (1) KPI Row — Total Income YTD, Total Expenses YTD, Net Surplus/Deficit YTD, Avg Savings Rate. (2) Income vs Expenses Trend — combination chart (clustered bars + net line). (3) Savings Rate Trend — single line chart. (4) Surplus/Deficit Summary — vertical bar, green/red by sign. (5) Income Breakdown — donut by Income Source Type (YTD).
- **Rationale:** Sections 2, 3, 4 directly address the BA description. Section 5 (Income Breakdown) shows income composition with only 3 source types — donut is cleaner than stacked bar for such a small set. KPI row provides the at-a-glance summary.

## D-174: Total Outflow = totalActualSpend (No Goal Allocations)

- **Context:** SPEC-12 workshop — defining "total outflow" for RPT-012. Goal allocations are deducted from income in the budget formula (ENH-007) but are not actual spending.
- **Options:** A) totalActualSpend only (budget spend). B) totalActualSpend + totalGoalAllocations (all committed money).
- **Decision:** A — Total outflow = `totalActualSpend` from ENH-007. Goal allocations are not included.
- **Rationale:** RPT-012 answers "how much of my income did I actually spend." Goal allocations are earmarked money, not spent money. They appear as part of the surplus in this view. Savings rate = (totalIncome − totalActualSpend) / totalIncome. This gives a cleaner answer to "am I living within my means."

## D-175: Savings Rate Formula with Zero-Income Guard

- **Context:** SPEC-12 workshop — defining the savings rate calculation and handling edge cases.
- **Decision:** Savings rate = `(totalIncome - totalActualSpend) / totalIncome × 100`. If totalIncome = 0 for a month, savings rate = 0% (avoid division by zero). Avg Savings Rate = mean of monthly rates including zero-income months.
- **Rationale:** Standard personal finance savings rate formula. Zero guard prevents NaN/Infinity. Including zero-income months in the average is conservative — it doesn't inflate the rate by excluding bad months.

## D-176: CDS Function for Single-Call Budget Trend Data Retrieval

- **Context:** SPEC-12 workshop — ENH-007 computes on-demand per month with no persisted snapshots. Rendering 12 months requires 12 engine calls.
- **Options:** A) Accept 12 separate OData calls from the UI. B) Add a batch mode to ENH-007 (amend SPEC-05). C) CDS function on BudgetService that iterates ENH-007 server-side and returns all months in one call.
- **Decision:** C — A CDS function (not action, since it's read-only) on BudgetService that accepts a year parameter, invokes ENH-007 per month server-side, and returns the complete dataset in a single HTTP round trip. Whether to use one shared function or two report-specific functions deferred to implementation.
- **Rationale:** Keeps the 12 iterations server-side, avoiding 12 OData round trips from the UI. No amendment to SPEC-05 needed — the function wraps existing ENH-007 logic. CDS function (GET) is correct over action (POST) since it's side-effect-free. Single user + local DB means 12 sequential queries are fast; no denormalized snapshot table needed.

## D-177: CNV-004 as First Bulk Run of INT-003

- **Context:** SPEC-13 workshop — CNV-004 (initial market card DB population) needs a mechanism. INT-003 (ongoing scraper) targets the same source (Prince of Travel).
- **Options:** A) CNV-004 = first bulk execution of INT-003, all data through WFL-003 approval. B) CNV-004 = separate one-time bulk load bypassing approval.
- **Decision:** A — CNV-004 is INT-003 executed in `bulk` mode. Same scraper code, same approval workflow. No separate code path.
- **Rationale:** Avoids maintaining two code paths for the same data source. Approval workflow ensures data quality even on initial load. Bulk approve capability makes the ~98 card review manageable.

## D-178: Prince of Travel as Sole V1 Scraping Source

- **Context:** SPEC-13 workshop — which websites to scrape for market card data.
- **Options:** Prince of Travel only, multiple sources (issuer sites, Reddit, PoT)
- **Decision:** Prince of Travel (`princeoftravel.com`) as the sole V1 source. Index page (`/credit-cards/`) for discovery, detail pages (`/credit-cards/{slug}/`) for extraction.
- **Rationale:** PoT has comprehensive Canadian credit card data including current offers, earning rates, perks, insurance, and historical offer archives. ~98 cards indexed. Single source simplifies parsing. Additional sources can be added later.

## D-179: Weekly Scheduled + On-Demand Manual Scraping

- **Context:** SPEC-13 workshop — how often should the scraper run.
- **Options:** Weekly only, on-demand only, both
- **Decision:** Both — weekly scheduled (default Sunday) plus on-demand manual trigger via UI action.
- **Rationale:** Card offers change infrequently (few times per month). Weekly is sufficient for routine monitoring. On-demand supports immediate refresh when user knows something changed.

## D-180: Content Hash for Change Detection

- **Context:** SPEC-13 workshop — how does the scraper detect changes vs unchanged cards.
- **Decision:** SHA-256 content hash stored per Market Card (`last_scrape_hash`). If hash unchanged → skip without field comparison. If hash changed → deep compare scraped fields vs DB to classify change type.
- **Rationale:** Hash comparison is fast and avoids unnecessary parsing. Only changed pages get full field extraction and comparison.

## D-181: Separate Staging Entities for Scrape Approval

- **Context:** SPEC-13 workshop — where to stage scraped data before approval.
- **Options:** A) New staging entities (ScrapeRun + ScrapeQueueItem). B) Draft status flag on target entities (Market Card, Offer, etc.).
- **Decision:** A — Separate ScrapeRun and ScrapeQueueItem entities. ScrapeRun tracks each execution. ScrapeQueueItem stages individual changes with proposed/existing data as JSON.
- **Rationale:** Keeps production data clean — no draft rows polluting Market Card/Offer entities that other specs query. Clean separation of concerns.

## D-182: Single ScrapeMapping Table for All Entity Types

- **Context:** SPEC-13 workshop — how to map PoT text labels (issuer names, earning categories, perk types) to internal FK IDs.
- **Options:** A) Fuzzy matching with a single mapping table using entity_type discriminator. B) Leave all mapping to manual approval. C) Separate mapping table per entity type.
- **Decision:** A — Single ScrapeMapping table with `entity_type` enum discriminator (`EarningCategory`, `Issuer`, `RewardsProgram`, `PerkType`, `CardNetwork`). Seeded with known mappings. Unresolved labels flagged during approval.
- **Rationale:** Reduces manual effort across ~98 cards. Single table avoids schema proliferation. Auto-learns new mappings when user resolves during approval.

## D-183: Standalone Approval View

- **Context:** SPEC-13 workshop — where does the WFL-003 approval UI live.
- **Options:** A) Inside FRM-005 (Market Cards) as a tab. B) Standalone nav entry.
- **Decision:** B — Standalone "Scraper Approvals" view in the main navigation under Churning—Analytics group.
- **Rationale:** Approval is a distinct workflow separate from market card browsing. Own nav entry makes it discoverable and avoids cluttering FRM-005.

## D-184: Bulk Approve with Mandatory card_segment

- **Context:** SPEC-13 workshop — approval UX for CNV-004 bulk load of ~98 cards.
- **Decision:** Approval view supports multi-select bulk approve. `card_segment` (personal/business) is mandatory — approve action blocked if null. PoT doesn't provide this classification, so user must set it during approval.
- **Rationale:** Bulk approve is essential for the initial ~98 card load. Mandatory card_segment ensures data quality since PoT doesn't classify cards this way.

## D-185: Offer Changes Preserve History via End-Dating

- **Context:** SPEC-13 workshop — when a scraped offer differs from the current DB offer, how to handle.
- **Options:** A) End-date existing offer, create new record (preserves history). B) Update existing offer in place (loses history).
- **Decision:** A — End-date the existing Offer (`offer_end_date = today`), create a new Offer record with scraped values. Same pattern for Earning Multiplier and Soft Perk Definition changes.
- **Rationale:** Historical offer tracking is explicitly in scope (D-14). End-dating preserves the full history for "is this a good offer?" comparisons.

## D-186: Historical Offer Cutoff at 2023

- **Context:** SPEC-13 workshop — PoT historical offers go back to 2020. How far back to import during CNV-004.
- **Decision:** Cutoff at 2023-01-01. Offers dated before 2023 are ignored during bulk import. Historical offers only imported during bulk mode, not subsequent scheduled/manual runs.
- **Rationale:** 2023 is "year 0" for the Financial Planner — all data (transactions, cards) starts from 2023. Consistent cutoff across the system.

## D-187: OFFERS_PENDING_APPROVAL Alert Type

- **Context:** SPEC-13 workshop — should market intelligence generate alerts.
- **Decision:** New alert type `offers_pending_approval`. Created when a ScrapeRun produces ≥1 queued item. Added to Alert Type seed values (OI-06, total now 11).
- **Rationale:** User should know when scraped data needs attention without having to check the approval queue manually.

## D-188: WFL-004 Absorbed by FRM-006

- **Context:** SPEC-03 workshop — WFL-004 (New Card Setup) was defined as end-to-end onboarding orchestration, but its functionality is fully covered by FRM-006 (wizard) + SPEC-01 (SimpleFIN linking) + SPEC-04 (bonus tracking).
- **Options:** A) Keep WFL-004 as separate spec object. B) Absorb into FRM-006.
- **Decision:** B — WFL-004 absorbed by FRM-006. No separate implementation. BA status updated to "Absorbed by FRM-006."
- **Rationale:** No unique logic in WFL-004 that isn't already orchestrated by FRM-006's wizard flow. Avoids redundant spec object.

## D-189: Card Lifecycle State Machine — 7 Transitions

- **Context:** SPEC-03 workshop — defining the complete state transition map for WFL-002.
- **Decision:** 4 states (Focus, Active, To Cancel, Closed), 7 valid transitions: Focus→Active (auto), Focus→To Cancel, Focus→Closed, Active→To Cancel, Active→Closed, To Cancel→Active (reversal), To Cancel→Closed. Closed is terminal. Resolves OI-04.
- **Rationale:** Covers all real-world card management scenarios. To Cancel→Active reversal supports retention offers. Direct close from Active/Focus avoids forcing users through To Cancel when they've already cancelled.

## D-190: CVV Split — cvv_front_enc + cvv_back_enc

- **Context:** SPEC-03 workshop — Amex cards have both a 4-digit CID on front and 3-digit CVV on back.
- **Options:** A) Single `cvv_enc` field. B) Split into `cvv_front_enc` + `cvv_back_enc`.
- **Decision:** B — Split into two separate encrypted fields.
- **Rationale:** Amex has two distinct CVV codes. Separate fields preserve the distinction without overloading a single field.

## D-191: fee_amount on Offer Entity

- **Context:** SPEC-03 workshop — annual fee should be visible and overridable during onboarding, like FYF.
- **Options:** A) Fee lives only on Market Card. B) Add `fee_amount` to Offer, defaulting from Market Card.
- **Decision:** B — Add `fee_amount` (Decimal, nullable) to Offer. Defaults from Market Card during onboarding. `fee_structure` stays on Market Card only (product characteristic, not offer-specific).
- **Rationale:** Specific offers can have different fees (retention offers, promotional pricing). Aligns with FYF already being on Offer.

## D-192: Instance-Level Earning Multiplier and Soft Perk Overrides

- **Context:** SPEC-03 workshop — earning multipliers and soft perks displayed on FRM-004 should be overridable per card instance.
- **Options:** A) Add optional `card_instance_id` to existing entities. B) Create separate instance-level entities. C) Copy on creation.
- **Decision:** A — Add optional `card_instance_id` FK to Earning Multiplier and Soft Perk Definition. Instance records (with `card_instance_id`) override market card defaults (without). No auto-copy on onboarding — overrides created only on explicit user edit.
- **Rationale:** Avoids unnecessary duplication. Single entity with optional FK is cleanest — no new tables, no wasted rows for cards that don't need overrides.

## D-193: Supplementary Card Independent Lifecycle

- **Context:** SPEC-03 workshop — do supp cards have their own lifecycle or follow parent?
- **Decision:** Independent lifecycle states. Supp cards can be closed without affecting parent. Closing parent cascades Closed to all supp cards. Supp cards can have their own offers and go through Focus → Active.
- **Rationale:** Supp cards are real cards with real bonuses (e.g., Amex Cobalt, Bonvoy). They need independent tracking. Parent cascade prevents orphaned active supp cards on a closed account.

## D-194: Card Instance Delete Rules

- **Context:** SPEC-03 workshop — can users delete a card instance?
- **Decision:** Delete allowed only if zero transactions assigned. Cascade deletes: Offer, Tranches, instance-level overrides, Card Perks, Alerts. Provider Account unlinked (not deleted). Parent delete blocked if any supp card has transactions.
- **Rationale:** Prevents orphaned transactions. Supp card check prevents data loss through parent deletion.

## D-195: af_approaching Alert Type

- **Context:** SPEC-03 workshop — card lifecycle alerts.
- **Decision:** Single `af_approaching` alert type for annual fee reminders. Created `AF_ALERT_DAYS` (default 30) before next AF date. Next AF date computed as `activation_date + N×12 months`. Covers both FYF first real AF and regular renewals — context is apparent from card data.
- **Rationale:** One alert type with contextual data is cleaner than separate types for first AF vs renewal. Alert Type seed total now 12.

## D-196: cancel_reminder Alert Type

- **Context:** SPEC-03 workshop — reminder for cards in To Cancel state.
- **Decision:** `cancel_reminder` alert created `CANCEL_REMINDER_DAYS` (default 2) before `tentative_cancel_date`. Persists until card leaves To Cancel state (either Closed or reversed to Active). Alert Type seed total now 13.
- **Rationale:** Users set a cancel date but may forget. Persistent reminder ensures follow-through.

## D-197: No-Offer Cards Start at Active

- **Context:** SPEC-03 workshop — cards onboarded without a signup bonus.
- **Decision:** Cards with no offer skip Focus and start directly at Active.
- **Rationale:** Focus state tracks bonus progress. No bonus means nothing to focus on.

## D-198: Auto-Transition to Active on bonus_missed

- **Context:** SPEC-03 workshop — card in Focus with all MSR windows expired.
- **Decision:** When ENH-003 reports all tranches as `missed` (all MSR windows expired), card auto-transitions from Focus to Active.
- **Rationale:** Nothing left to focus on. Leaving card in Focus with expired windows is misleading.

## D-199: Estimated First Year Value in Wizard

- **Context:** SPEC-03 workshop — show projected value during onboarding.
- **Decision:** Live-updating summary: SUM(tranche bonus_amounts) + SUM(soft perk dollar_values) − first year fee (0 if FYF). Displayed in FRM-006 wizard.
- **Rationale:** Motivational context during onboarding. Helps user assess the deal before committing.

## D-200: Estimated Value Gain — Lifetime Actual

- **Context:** SPEC-03 workshop — "Estimated Value Gain" on FRM-004 list and object page.
- **Decision:** Lifetime actual calculation: total points earned + perks realized − total fees paid. Different from wizard's projected first-year value.
- **Rationale:** List page shows reality (what you've gained), wizard shows projection (what you could gain).

## D-201: Fee History as Computed Timeline

- **Context:** SPEC-03 workshop — where does fee history data come from?
- **Decision:** Fee History section on FRM-004 is a computed timeline from `activation_date` + fee data (FYF, `fee_amount`). Not linked to transactions. Year 1: $0 if FYF, else `fee_amount`. Subsequent years: `fee_amount`.
- **Rationale:** Keeps fee tracking independent of transaction categorization. Clean computed view.

## D-202: Supplementary Card Points/Fees Roll Up to Parent

- **Context:** SPEC-03 workshop — how to display supp card contributions.
- **Decision:** Supp card points earned and fees paid roll up into the parent card's analytics, Estimated Value Gain, and Total Points Earned on FRM-004.
- **Rationale:** Parent card represents the "account" — total value should reflect the full card family.

## D-203: List Page Shows Primary Cards Only

- **Context:** SPEC-03 workshop — should supp cards appear in the FRM-004 list?
- **Decision:** List shows primary cards only (`parent_card_instance_id` is null). Supp cards displayed in parent's Supplementary Cards section on the object page.
- **Rationale:** Keeps list clean. Supp cards are managed through their parent.

## D-204: Card Lifecycle UX Enhancements

- **Context:** SPEC-03 workshop — UX suggestions after gap interview.
- **Decision:** Four UX enhancements: (1) Onboarding completion summary with quick-action links. (2) Lifecycle timeline showing state transitions with dates on object page. (3) AF countdown ("X days until next AF") in object page header. (4) Quick state actions (Mark To Cancel, Close) from list page inline actions.
- **Rationale:** Each enhancement reduces clicks and improves at-a-glance information. Completion summary guides next steps after onboarding.

## D-205: Card Instance Mutable Fields

- **Context:** SPEC-03 workshop — which fields are editable after creation?
- **Decision:** Mutable: Offer/Tranches, activation_date, credit_limit, statement_close_day, cardholder_name, all encrypted fields (card number, CVV1, CVV2, expiry). Immutable: Market Card (delete + re-create), lifecycle_state (actions only), parent_card_instance_id (structural).
- **Rationale:** Cards get renewed (new numbers), limits change, dates may need correction. Market Card is fundamental identity.

## D-206: Active → Closed Direct Transition

- **Context:** SPEC-03 workshop — should closing always go through To Cancel?
- **Decision:** Active → Closed is a valid direct transition. User doesn't have to go through To Cancel first.
- **Rationale:** If the user has already called and cancelled, forcing them through To Cancel is unnecessary friction.

## D-207: Every List Column Has a Filter — UX Rule

- **Context:** SPEC-03 workshop — FRM-004 list page filters.
- **Decision:** Every column in the FRM-004 list report has a corresponding filter. Default variant filters lifecycle_state to exclude Closed (Closed remains selectable). This is a general UX rule for all list reports.
- **Rationale:** Consistent filtering capability. Users expect to filter by any visible column.

## D-208: Supplementary Cards Can Have Offers

- **Context:** SPEC-03 workshop — supp card onboarding details.
- **Decision:** Supplementary cards can have their own signup offers (e.g., Amex Cobalt, Bonvoy supp card bonuses), their own fee_amount, and their own encrypted card details. Supp card creation reuses FRM-006 with Market Card locked.
- **Rationale:** Supp cards in Canadian churning frequently have their own signup bonuses. Must be tracked independently.

## D-209: Churnboard Section Layout

- **Context:** SPEC-19 workshop — how to arrange the 10 dashboard sections on RPT-001.
- **Decision:** 2-column GridContainer layout, 7 rows: (1) Net Value Hero KPI (full), (2) Bonus Progress (full), (3) CC Spend + Reward Yield (half/half), (4) Realized Value vs Fees + Points Balances (half/half), (5) Upcoming Fees + Issuer Eligibility (half/half), (6) Card Recommendation (full), (7) Alerts (full).
- **Rationale:** Ordering follows: headline → active work → analysis → decisions → actions. Full-width for tables/KPIs that need space, half-width for paired comparisons.

## D-210: Net Value Hero KPI Composition

- **Context:** SPEC-19 workshop — what the headline number should be and how to display it.
- **Decision:** Net Churning Value = Σ(rewards earned − annual fees paid) across all cards with activity in the year. Displayed with semantic color (green if ≥ 0, red if negative), subtitle showing rewards + fees breakdown, and YoY delta (hidden for earliest year).
- **Rationale:** Single number that captures the P&L of churning. All cards included regardless of lifecycle status — a closed card's fees and rewards still count for the year.

## D-211: Bonus Progress Section Design

- **Context:** SPEC-19 workshop — which tranches to show and how.
- **Decision:** Table showing only In Progress or Pending tranches. Focus cards grouped at top with separator, Active below. ProgressIndicator for visual progress. Days Left with urgency coloring: green >30d, orange 8–30d, red ≤7d.
- **Rationale:** Only actionable tranches shown — Met/Missed are historical and belong in profitability views. Focus cards get priority as active chases. Urgency coloring draws attention to deadlines.

## D-212: CC Spend by Card — Top 5 Horizontal Bar

- **Context:** SPEC-19 workshop — how to visualize spend distribution with 10-15 active cards.
- **Options:** A) Stacked monthly bar, B) Horizontal bar annual totals, C) Donut chart.
- **Decision:** B — Horizontal bar chart, top 5 cards by annual spend, sorted descending, issuer-colored.
- **Rationale:** 10-15 cards makes stacked bars unreadable. Top 5 keeps the card compact. Monthly time dimension covered by RPT-007 (Spending Trends).

## D-213: Reward Yield Trend — Per-Issuer Lines Plus Aggregate

- **Context:** SPEC-19 workshop — single portfolio line or per-issuer breakdown.
- **Decision:** Line chart with one line per issuer (domain-mapped color) plus one aggregate line (grey, dashed). Months with no spend show gaps, not zeros.
- **Rationale:** 4-6 issuer lines is readable. Per-issuer view reveals which relationships earn best. Aggregate gives the blended benchmark. Gaps prevent misleading zero-yield months.

## D-214: Realized Value vs Fees — Diverging Bar, All Cards

- **Context:** SPEC-19 workshop — how many cards to show in profitability view.
- **Options:** A) Top 5, B) All active cards.
- **Decision:** B — Diverging horizontal bar showing all cards with activity in the selected year. Positive right (green), negative left (red), sorted by net value descending.
- **Rationale:** Unlike spend distribution, profitability requires full visibility — hiding a money-losing card masks a problem.

## D-215: Points Balances — Current Snapshot, Year-Independent

- **Context:** SPEC-19 workshop — should points balances be scoped to the year selector?
- **Decision:** Points Balances shows current balances, unaffected by year selector. Table with Program, Balance, Value, sorted by dollar value descending.
- **Rationale:** Points balances are a point-in-time number, not a period aggregate. "Points earned this year" is a different metric that could live elsewhere.

## D-216: Upcoming Fees — 90-Day Window with Keep/Cancel Signal

- **Context:** SPEC-19 workshop — how far ahead to show upcoming fees, and how to support keep/cancel decisions.
- **Decision:** Table showing cards with AF within 90 days. Includes Keep/Cancel signal: green checkmark if card's YTD net value ≥ AF amount, red X if not. Year-independent.
- **Rationale:** Beyond 90 days isn't actionable yet. Keep/Cancel signal provides instant decision support without mental math. Full fee picture lives on RPT-005 (Card Analytics).

## D-217: Issuer Eligibility — Current State, Only Known Issuers

- **Context:** SPEC-19 workshop — which issuers to show and what detail level.
- **Decision:** Table with one row per issuer where user has/had at least one card. Columns: Issuer, Status (Eligible/Cooldown/At Limit with ObjectStatus), Active Cards count, Next Eligible date. Year-independent.
- **Rationale:** Dashboard summary level — detailed rules and history on Card Analytics. Only showing known issuers avoids empty rows for issuers the user has never used.

## D-218: Card Recommendation — Condensed Best-Per-Category with Wallet Gap

- **Context:** SPEC-19 workshop — how much of ENH-002's full matrix to show on the Churnboard.
- **Decision:** Condensed table showing best wallet card per earning category, runner-up, and Wallet Gap flag (Warning if market best yields >2x user's best). Full matrix on RPT-006.
- **Rationale:** Full N×M matrix is too dense for a dashboard card. Best-per-category answers the quick question "which card should I use for X?" Wallet Gap highlights upgrade opportunities.

## D-219: Alerts — Churning-Only with Contextual Actions

- **Context:** SPEC-19 workshop — which alert types appear on the Churnboard, and what actions are available.
- **Decision:** Only churning-related alert types (af_approaching, cancel_reminder, bonus_deadline_near, sync_error, offers_pending_approval). Budget alerts on RPT-002. Contextual actions per type: "Go to Card", "View Offers", "View Connection", "Dismiss" as default. All types also have Dismiss as secondary.
- **Rationale:** Domain separation — each dashboard shows its relevant alerts. Contextual actions reduce clicks vs. a generic "Dismiss" on everything.

## D-220: Issuer Color Assignments — Six Canadian Issuers

- **Context:** SPEC-19 workshop — defining fixed issuer colors for all charts per D-61 deferral.
- **Decision:** TD = Green, Amex = Blue, CIBC = Red, Scotia = Gold, BMO = Teal, RBC = Purple. Aggregate = Grey (dashed). Any unlisted issuer uses VizFrame auto-assigned palette.
- **Rationale:** Colors chosen to match brand identity while avoiding clashes. TD/Amex/CIBC use brand colors directly. Scotia, BMO, RBC use differentiated colors since their brand blues/reds would clash with Amex/CIBC.

## D-221: Cross-Navigation Targets

- **Context:** SPEC-19 workshop — where do clickable elements navigate?
- **Decision:** Card name → FRM-004 object page. Earning category → RPT-006 Recommendation Matrix. Points program → RPT-010 Points Dashboard. Alert contextual actions per type. No chart click-through per D-61.
- **Rationale:** Table cell links for drill-down. Charts remain tooltip-only per design system standard.

## D-222: Empty State with FRM-006 Link

- **Context:** SPEC-19 workshop — first-use experience when no cards exist.
- **Decision:** Single full-page message "Add your first card to get started" with navigation link to FRM-006. No dashboard sections rendered.
- **Rationale:** More helpful than 10 sections all showing "No data available". Guides the user to the first step.

## D-223: Cross-Spec — Centralized Alert List Report for SPEC-15

- **Context:** SPEC-19 workshop — Sandro requested a central place to see all alerts across all domains.
- **Decision:** A Fiori Elements list report showing all alerts (churning, budget, sync) with filters by type, status, date. To be designed in SPEC-15 (Alerts & Notifications).
- **Rationale:** Individual dashboards show domain-filtered subsets. One central list report provides full visibility and management. Natural fit for the Alerts & Notifications spec.

## D-224: RPT-002 Dashboard Layout — 6-Row Grid

- **Context:** SPEC-20 workshop — arranging the 8 dashboard sections for RPT-002 (Budget Dashboard).
- **Decision:** 2-column GridContainer layout, 6 rows: (1) Budget Overview Hero KPI (full), (2) Spending vs Budget by Category (full), (3) CC Spend by Card + Top Spending Subtypes (half/half), (4) Top Vendors + Uncategorized (half/half), (5) Goal Progress (full), (6) Alerts (full).
- **Rationale:** Ordering follows: headline → active work (category health) → analysis (spend distribution) → goals → actions (alerts). Mirrors SPEC-19 Churnboard pattern. Full-width for tables, half-width for charts and KPI cards.

## D-225: Hero KPI — Total Remaining with Burn Rate, Projection, Days Remaining

- **Context:** SPEC-20 workshop — what the headline number should be and what forward-looking intelligence to include.
- **Decision:** Primary number = Total Remaining (totalBudget − totalActualSpend). Additional elements: subtitle (budget/spent), secondary line (income − goals = budget formula), burn rate with daily pace comparison, projected month-end spend, days remaining counter, MoM trend indicator. Burn rate colors: green (under pace), orange (within 10%), red (over pace). Projection colors: green (within budget), red (over budget). Days remaining and projection hidden for past months.
- **Rationale:** "Remaining" answers the core question "am I on track?" Burn rate and projection add forward-looking intelligence — "remaining" alone doesn't tell you if your spending rate is sustainable. MoM trend gives context for whether this month is unusual. Formula line explains where the budget number comes from.

## D-226: No Wave Split Within Spec

- **Context:** SPEC-20 workshop — BA defines Wave 1 partial (budget overview, spending vs budget, on-track indicators) and Wave 2 additions (goal progress, top vendors). Sandro requested the spec describe the complete dashboard.
- **Decision:** Spec describes the full dashboard as one unit with no per-section wave labels. Sprint plan (PROJECT_MANAGEMENT.md) handles build sequencing.
- **Rationale:** Same approach as SPEC-19. The spec is the target state. Build order is a project management concern, not a functional specification concern.

## D-227: Budget-Eligible Filter Applied Consistently Across All Spend Sections

- **Context:** SPEC-20 workshop — CC Spend by Card, Top Spending Subtypes, and Top Vendors all show spend aggregations. Should they use all transactions or budget-eligible only?
- **Decision:** All three sections use budget-eligible transactions only (per SPEC-05 BR-09). The numbers in CC Spend + Uncategorized reconcile to the hero's "Spent" total.
- **Rationale:** Consistency. All spend figures on the budget dashboard use the same filter, making the numbers additive and reconcilable. Total card spend (regardless of budget filters) is available on the Churnboard (SPEC-19).

## D-228: Top Spending Subtypes Section Added to RPT-002

- **Context:** SPEC-20 workshop — the Spending vs Budget table shows top-level purchase type health, but Sandro wanted to see which specific subtypes drive spend. Not in the original BA description.
- **Decision:** Add a "Top Spending Subtypes" half-width horizontal bar chart. Top 10 subtypes by spend, budget-eligible only. Displayed as "Parent > Subtype" format. Transactions with no subtype show parent name alone.
- **Rationale:** Complements the category table — if Dining is at 92% warning, the subtypes chart shows "because Restaurants was $450." Granular view without overloading the main budget table.

## D-229: Five UX Enhancements for Budget Dashboard

- **Context:** SPEC-20 workshop — UX suggestions offered before spec production.
- **Decision:** Five enhancements adopted:
  1. **Burn rate/pace** — "Spending $X/day vs $X/day pace" on hero card with semantic coloring.
  2. **Days remaining** — "X days remaining" on hero card (current month only).
  3. **Previous month comparison** — "Prev Month" column in Spending vs Budget table showing last month's actual per category.
  4. **Projected month-end spend** — extrapolation on hero card with semantic coloring (current month only, shows actual for past months).
  5. **No-income warning banner** — conditional banner when selected month has no income entry. Distinct from empty state — spend data still renders, budget figures show "N/A".
- **Rationale:** Each enhancement provides forward-looking or contextual intelligence without adding interaction complexity. Burn rate and projection catch problems before month end. Prev Month column gives instant historical context. Days remaining contextualizes the remaining budget. No-income warning prevents confusion when budget figures can't be computed.

## D-230: Test-Driven Development

- **Context:** Establishing the development workflow for the build phase. Need to decide whether tests are written before, during, or after implementation.
- **Decision:** Follow test-driven development (TDD) — Red-Green-Refactor cycle. For every unit of work (Validator method, Service method, Utility function), write the failing test first, implement the minimum code to pass, then refactor. Integration tests may be written after unit-level TDD is complete for a module, since they require the full CDS stack.
- **Rationale:** TDD forces design-through-testing, catches regressions immediately, and naturally achieves the coverage targets already set (D-79). For a solo developer with no code reviewer catching mistakes in real time, the red-green-refactor loop acts as a continuous feedback mechanism. Writing tests first also prevents the common trap of writing tests that merely confirm existing implementation rather than verifying intended behavior.

## D-231: Eligibility Engine — Dual API (Per-Issuer + Per-Rule Detail)

- **Context:** SPEC-16 workshop — ENH-004 needs to serve the Churnboard (per-issuer summary) and future "why blocked?" drill-down.
- **Options:** A) Per-issuer summary only, B) Per-rule detail only, C) Both levels.
- **Decision:** C — Read-only CDS entity `IssuerEligibility` for per-issuer summary + CDS function `getEligibilityDetail(issuerId)` for per-rule breakdown.
- **Rationale:** Per-issuer for Churnboard binding; per-rule for "why blocked?" popover and card recommendation filtering. Detail is free since the engine evaluates each rule individually anyway.

## D-232: Add `reference_date` Enum to Issuer Application Rule

- **Context:** SPEC-16 workshop — TD uses different date fields for different product families (Aeroplan uses application_date, Cash Back uses max of activation/closed).
- **Options:** A) Hardcode date logic per issuer in engine, B) Add declarative `reference_date` field to rule entity.
- **Decision:** B — Add `reference_date` enum (`application` · `closure` · `latest_activity`), nullable, to Issuer Application Rule.
- **Rationale:** Keeps rules fully declarative and engine generic. No issuer-specific logic in the computation engine.

## D-233: Add `market_card_id` FK to Issuer Application Rule

- **Context:** SPEC-16 workshop — TD has product-specific cooldowns (FCT 180-day) alongside family-level cooldowns (Aeroplan 365-day). Need product-level rule scoping.
- **Decision:** Add optional `market_card_id` FK → Market Card. Scoping hierarchy: market_card_id set → specific product; rewards_program_id set → family; neither → per-product grouping.
- **Rationale:** Enables the TD FCT 180-day rule to target a specific product without affecting other TD cards.

## D-234: Add `eligibility_group` to Market Card

- **Context:** SPEC-16 workshop — Amex Green and Choice Card share ONCE_PER_LIFETIME eligibility (product rename). Need a way to group products.
- **Options:** A) Manual tracking (no system support), B) `eligibility_group` text field on Market Card.
- **Decision:** B — Add optional `eligibility_group` String. Cards sharing the same non-null value are treated as the same product for ONCE_PER_LIFETIME.
- **Rationale:** Nullable field — zero cost for ungrouped cards. Keeps engine generic for future product merges/renames.

## D-235: Add `ELIGIBILITY_ALERT_DAYS` System Config Parameter

- **Context:** SPEC-16 workshop — eligibility_window alerts need a configurable lookahead window.
- **Decision:** Add `ELIGIBILITY_ALERT_DAYS` Integer parameter to System Config, default 30.
- **Rationale:** Configurable per user preference. 30 days gives enough lead time to plan applications.

## D-236: Per-Issuer Summary Reflects Only Issuer-Level Rules

- **Context:** SPEC-16 workshop — not all 6 rule types answer "can I apply at this issuer?" Some are product/program-specific.
- **Decision:** Per-issuer summary evaluates only `MAX_CONCURRENT`, `APPS_IN_WINDOW`, `ISSUER_COOLDOWN`. Product-level rules (`PRODUCT_COOLDOWN`, `ONCE_PER_LIFETIME`, `TIER_LIFETIME_LIMIT`) appear only in `getEligibilityDetail`.
- **Rationale:** Issuer-level rules block all applications. Product/program rules only limit specific products — you could still apply for a different product at the same issuer.

## D-237: Supplementary Cards Excluded from Rule Evaluations

- **Context:** SPEC-16 workshop — should supplementary cards count toward MAX_CONCURRENT, APPS_IN_WINDOW, etc.?
- **Decision:** Exclude. Filter to `parent_card_instance_id IS NULL` for all rule evaluations.
- **Rationale:** Supplementary cards are sub-accounts — not independent applications or holdings from the issuer's rules perspective.

## D-238: ISSUER_COOLDOWN with Active Cards Uses Hypothetical Date

- **Context:** SPEC-16 workshop — Scotia ISSUER_COOLDOWN requires closure date, but user may still hold an active card.
- **Decision:** Use `today` as the reference date when any primary card is still held. Shows "if closed today, eligible on [date]."
- **Rationale:** Most useful information — tells the user the impact of closing now. Naturally transitions to actual closed_date once the card is closed.

## D-239: TIER_LIFETIME_LIMIT Counts Total Cards, Not Distinct Tiers

- **Context:** SPEC-16 workshop — Aeroplan 5-tier limit: is it 5 distinct tier types or 5 total cards with any tier?
- **Decision:** Total cards with a non-null program_tier_id linked to the rewards program. Two Core-tier cards = 2 of 5, not 1 of 5.
- **Rationale:** Matches real-world Aeroplan enforcement — each card application with a tier bonus counts as one use, regardless of which tier.

## D-240: Null Date Fields Exclude Card from Time-Based Evaluation

- **Context:** SPEC-16 workshop — historical cards may have null application_date or closed_date.
- **Decision:** Cards with null reference date are excluded from time-based rule evaluations. Non-date rules (MAX_CONCURRENT, ONCE_PER_LIFETIME, TIER_LIFETIME_LIMIT) are unaffected.
- **Rationale:** Can't evaluate a time-based rule without the date. User can backfill the date for more accurate results. Avoids guessing.

## D-241: Eligibility Alerts Evaluated During Weekly Review

- **Context:** SPEC-16 workshop — when should eligibility_window alerts be generated? Options: cron job, on Churnboard load, during weekly review.
- **Decision:** Evaluate during the weekly review session (WFL-001 / SPEC-15).
- **Rationale:** Weekly review is the natural time to surface "you're becoming eligible for X." Avoids needing a separate scheduler. Alert freshness is weekly, which matches the cadence of churning decisions.

## D-242: Four UX Enhancements for Eligibility Engine

- **Context:** SPEC-16 workshop — UX suggestions offered before spec production.
- **Decision:** Four enhancements adopted:
  1. **"Why blocked?" popover** — Clicking Cooldown/At Limit on Churnboard shows per-rule detail. Cross-spec: SPEC-19.
  2. **Tier usage indicator** — "3 / 5 used" display in detail view.
  3. **"Close to clear" hint** — At Limit detail suggests To Cancel cards as close candidates.
  4. **Hypothetical date clarification** — Italic *"If closed today"* before date when ISSUER_COOLDOWN has active cards.
- **Rationale:** Each enhancement improves eligibility comprehension without adding interaction complexity.

## D-243: WFL-001 Is a Launchpad with Checklist

- **Context:** SPEC-15 workshop — what form should the Weekly Review Session take? Options: guided wizard/stepper, launchpad with checklist, documentation-only.
- **Decision:** Launchpad page with a checklist of 6 items, each linking to the relevant component screen.
- **Rationale:** Gives a single entry point that shows "what needs attention" without being overly prescriptive about order. The wizard approach is too rigid for something done 52 times a year. Documentation-only misses the chance to surface actionable status.

## D-244: Weekly Review First in Transactions Nav Group

- **Context:** SPEC-15 workshop — where does the Weekly Review page sit in the side navigation?
- **Decision:** First item in the Transactions navigation group.
- **Rationale:** Most of the review work happens in the Transactions domain (categorization is the core weekly task). A standalone top-level item was considered but Transactions group is the natural home.

## D-245: Six Checklist Items in Fixed Order

- **Context:** SPEC-15 workshop — what items appear on the checklist and in what order?
- **Decision:** Fixed order: (1) Connection Health → FRM-010, (2) Import Scotia CSV → FRM-003, (3) Review Transactions → FRM-001, (4) Set Monthly Income → FRM-007, (5) Churnboard → RPT-001, (6) Budget Dashboard → RPT-002.
- **Rationale:** Logical flow: check data sources first, then process data, then set context (income), then review outcomes. Income entry was added as a checklist item (not just a dashboard banner) to catch missing income early in the flow.

## D-246: Hybrid Checklist Completion — Auto-Detected + Navigation Links

- **Context:** SPEC-15 workshop — should checklist items auto-detect completion or require manual checkoff?
- **Decision:** Items 1–4 use auto-detected status (green/warning based on system state). Items 5–6 (dashboards) are navigation links with alert counts — no completion tracking.
- **Rationale:** Items 1–4 have objectively measurable states. Dashboard "review" is subjective — you might glance for 10 seconds and be satisfied. The launchpad is a "what needs attention" surface, not a mandatory checklist.

## D-247: Session Tracking via LAST_REVIEW_DATE (Single Timestamp)

- **Context:** SPEC-15 workshop — should the system track when the last weekly review was done? Options: no tracking, single timestamp, full session history log.
- **Decision:** Single `LAST_REVIEW_DATE` datetime in System Config. Updated on explicit "Mark Review Complete" button click.
- **Rationale:** Shows "Last completed: N days ago" and can drive a reminder alert. Full session history is overhead — the value of the review is in the outcomes, not the session record itself.

## D-248: Explicit "Mark Review Complete" Button — Always Enabled

- **Context:** SPEC-15 workshop — how is the review timestamp recorded? Options: on page open, explicit button, auto when all items green. Should the button be blocked if items are outstanding?
- **Decision:** Explicit "Mark Review Complete" button, always enabled regardless of item status. No confirmation dialog.
- **Rationale:** Opening the page doesn't mean you did a review. Auto-threshold is fragile. Always-enabled matches Sandro's preference for explicit user actions. No guards because this is a personal tool — some weeks you might skip certain items.

## D-249: review_overdue Alert with Configurable Threshold

- **Context:** SPEC-15 workshop — should the system remind the user if a weekly review hasn't been done?
- **Decision:** Generate `review_overdue` alert when `(today - LAST_REVIEW_DATE) > REVIEW_REMINDER_DAYS`. Default threshold: 7 days. NOT generated if `LAST_REVIEW_DATE` is null (no nagging before first review).
- **Rationale:** Lightweight reminder that keeps the user honest about weekly cadence. Configurable for flexibility. Suppressed on first use to avoid nagging during initial setup.

## D-250: CSV_IMPORT_REMINDER_DAYS for Scotia Staleness

- **Context:** SPEC-15 workshop — how does the Scotia CSV checklist item determine if an import is overdue?
- **Decision:** `CSV_IMPORT_REMINDER_DAYS` System Config parameter, default 7. If last Scotia import exceeds threshold, checklist item shows warning status.
- **Rationale:** Independent of the review reminder — you might do a review but skip the CSV import if Scotia has no new transactions. Configurable threshold avoids hardcoding.

## D-251: UX Enhancements — Progress Counter and All Clear Banner

- **Context:** SPEC-15 workshop — UX suggestions offered before spec production.
- **Decision:** Two enhancements adopted:
  1. **Progress counter** — "{N} of 4 items clear" in header, based on green status of items 1–4.
  2. **"All clear" banner** — Shown when all 4 auto-detected items are green. Text: "All clear — just check your dashboards."
- **Rationale:** Progress counter gives instant read on how much attention is needed. All clear banner makes the difference between "nothing needs attention" and "things need attention" obvious at a glance.

## D-252: FRM-002 Is Fiori Elements Object Page

- **Context:** SPEC-17 workshop — Fiori Elements vs freestyle for the transaction entry form.
- **Options:** (a) Fiori Elements Object Page, (b) Freestyle form
- **Decision:** Fiori Elements Object Page in create/edit mode.
- **Rationale:** Standard single-entity form — date, amount, vendor, dropdowns. Fiori Elements provides form layout, validation, draft handling, and value helps out of the box. Only the card recommendation panel requires a custom section.

## D-253: Create Button on FRM-001 Only — No Side Nav Entry

- **Context:** SPEC-17 workshop — where does "Create Transaction" live in the navigation?
- **Options:** (a) Create button on FRM-001 toolbar only, (b) Also a dedicated side nav link
- **Decision:** Option (a) — FRM-001 toolbar only.
- **Rationale:** Standard Fiori List Report → Object Page pattern. A dedicated side nav entry for a single-entity create form adds clutter.

## D-254: ENH-001 Auto-Categorization on Vendor Selection

- **Context:** SPEC-17 workshop — should ENH-001 run on the manual entry form?
- **Options:** (a) Auto-suggest categories on vendor selection, (b) No auto-categorization on manual entry
- **Decision:** Option (a) — auto-suggest but overridable. All inputs defaulted by ENH-001, all overridable.
- **Rationale:** Keeps normalized vendor names and category consistency. Vendor field uses native Fiori SuggestionItems (not fuse.js — fuse.js is for ENH-001 matching on incoming SimpleFIN/CSV raw descriptions).

## D-255: Inline Entity Creation via + Create in Dropdowns

- **Context:** SPEC-17 workshop — how to create new vendors/categories without navigating away.
- **Decision:** Two entry points for Vendor, Purchase Type, Purchase Subtype, and Earning Category: (1) `+ Create [Entity]` with `+` icon at bottom of suggestion dropdown when no match, (2) "Create New" button in value help dialog footer. Both open a lightweight `sap.m.Dialog` with minimal fields. On save, entity created and auto-selected.
- **Rationale:** Keeps the user on the transaction form. Two entry points cover both the type-ahead and browse-then-create workflows.

## D-256: Card Recommendation Advisory Only

- **Context:** SPEC-17 workshop — should ENH-002 auto-select the recommended card?
- **Options:** (a) Auto-select top recommendation, (b) Advisory only — user picks
- **Decision:** Option (b) — advisory only. Card field stays blank.
- **Rationale:** If manually entering, the user probably knows which card was used. Recommendation is most useful for "I should have used this card" awareness.

## D-257: Live Point Calculation When EC + Amount Present

- **Context:** SPEC-17 workshop — when should the card recommendation panel show projected points?
- **Decision:** ENH-002 fires when Earning Category populated. When both EC and amount are present, projected points calculated per card (earn rate × amount). Panel shows top card with earn rate, points, bonus override info, and "See all cards" expandable list.
- **Rationale:** Transforms the recommendation from a suggestion into a concrete value comparison.

## D-258: Expense Split at Creation — Existing Transaction Split Entity

- **Context:** SPEC-17 workshop — should the form support splitting transactions into multiple category lines?
- **Options:** (a) New TransactionAllocation entity for multi-category splits, (b) Use existing Transaction Split entity for expense sharing
- **Decision:** Option (b) — expose existing Transaction Split fields (my_share_amount, my_share_pct, split_description, is_recurring) on the create/edit form. No multi-category allocation — transactions have one set of categories.
- **Rationale:** Sandro doesn't split by purchase type. The existing expense split model (my share vs. full amount, D-08) covers the real use case: shared expenses where churning counts full amount but budget counts personal share.

## D-259: Transaction Source Enum — Add 'manual'

- **Context:** SPEC-17 workshop — DM amendment needed for manual transaction creation.
- **Decision:** Add `manual` to Transaction.source enum (existing values: `simplefin`, `csv`).
- **Rationale:** Manual transactions need a distinct source for filtering and to prevent editing source on existing transactions.

## D-260: Purchase/Refund Toggle for Amount Sign

- **Context:** SPEC-17 workshop — UX for entering refunds.
- **Options:** (a) User types negative numbers, (b) Segmented button toggle
- **Decision:** Option (b) — Purchase/Refund segmented button. Amount field stays positive; Refund stores as negative.
- **Rationale:** Less error-prone than requiring users to type negative numbers.

## D-261: Card Picker Filtered by Active Date

- **Context:** SPEC-17 workshop — UX improvement to prevent impossible card/date combinations.
- **Decision:** Card picker shows only cards with active status on the transaction date. Changing the date refreshes the picker.
- **Rationale:** Prevents selecting a card that wasn't open yet (or was already closed) on the transaction date.

## D-262: Create Another with Pre-Fill

- **Context:** SPEC-17 workshop — UX for entering multiple transactions.
- **Decision:** "Create Another" action after save opens a fresh create form with date and card pre-filled from the last entry.
- **Rationale:** Useful when entering multiple transactions from the same shopping trip or statement period.

## D-263: Recent Vendors First in Suggestions

- **Context:** SPEC-17 workshop — UX improvement for vendor selection.
- **Decision:** Vendor suggestion list shows 5 most recently used vendors at the top, then alphabetical matches.
- **Rationale:** Users shop at the same places repeatedly.

## D-264: Backdated Budget Warning

- **Context:** SPEC-17 workshop — data integrity when entering/editing transactions in prior budget periods.
- **Decision:** Non-blocking warning on save if transaction date falls in a prior budget month: "This transaction falls in a closed budget period (X). Budget figures will be recalculated."
- **Rationale:** Awareness that budget reports for a closed month will change. Non-blocking because it's a valid action.

## D-265: Duplicate Detection on Save

- **Context:** SPEC-17 workshop — preventing accidental double-entry when SimpleFIN already captured a transaction.
- **Decision:** Soft duplicate detection on save: matches on date + amount ±10% + vendor (fuzzy) within a 3-day window. Non-blocking warning with details of the similar transaction. User can dismiss and proceed.
- **Rationale:** Easy to forget SimpleFIN already picked up a transaction. Non-blocking because legitimate duplicates exist (e.g., same store, same amount, different days).

## D-266: Object Page Editable for All Transaction Sources

- **Context:** SPEC-17 workshop — should only manual transactions be editable on the Object Page?
- **Options:** (a) Only source=manual editable, (b) All sources editable
- **Decision:** Option (b) — all transactions editable regardless of source. Source and import metadata remain read-only.
- **Rationale:** FRM-001 list contains all transactions. The Object Page is the detail/edit view for any transaction. Editing a SimpleFIN transaction's category triggers ENH-001 learning, same as inline edits on FRM-001.

## D-267: No Alerts Generated by FRM-002

- **Context:** SPEC-17 workshop — OI-06 alert question.
- **Decision:** FRM-002 does not generate alerts. Alert responsibility belongs to downstream engines: SPEC-05 (budget thresholds), SPEC-04 (bonus progress), SPEC-09 (goal milestones).
- **Rationale:** The form creates/edits data; other specs react to it.

## D-268: FRM-005 Full CRUD Fiori Elements

- **Context:** SPEC-18 workshop — BA describes FRM-005 as browse-only, but SPEC-03 FRM-006 says "No inline creation — use FRM-005 first."
- **Options:** A) Browse-only catalog, B) Full CRUD
- **Decision:** B — Full CRUD Fiori Elements List Report + Object Page.
- **Rationale:** Users need to manually create Market Cards not yet picked up by the scraper, edit scraped data, and delete duplicates. Two entry points (scraper + manual), one entity.

## D-269: No Alerts for FRM-005

- **Context:** SPEC-18 workshop — OI-06 alert question.
- **Decision:** FRM-005 does not generate alerts. Offer-related alerts handled by SPEC-13 (Market Intelligence), card-level alerts by SPEC-03 (Card Lifecycle).
- **Rationale:** FRM-005 is a maintenance form; alert responsibility belongs to downstream specs.

## D-270: Market Card Status Field

- **Context:** SPEC-18 workshop — "Mark as Discontinued" action requires a status field.
- **Options:** A) Soft delete (boolean), B) Status enum (active/discontinued)
- **Decision:** B — `status` enum (`active` · `discontinued`) on Market Card, required, default `active`.
- **Rationale:** Enum is extensible and semantically clear. Discontinued cards remain in catalog for historical reference but are excluded from value helps and engine inputs.

## D-271: Offer is_current Flag

- **Context:** SPEC-18 workshop — need to identify "current" offer for computed columns. Date-based logic has edge cases (same start date, null dates).
- **Options:** A) Derive from latest offer_start_date, B) Explicit is_current boolean
- **Decision:** B — `is_current` boolean on Offer, required, default `false`. Auto-toggle: setting true clears all others for the same Market Card.
- **Rationale:** Explicit flag is deterministic, no ambiguity from date logic, handles null dates gracefully.

## D-272: Offer URL Field

- **Context:** SPEC-18 workshop — Sandro wants to store the direct URL to where an offer is published, as a secondary source if scraping fails.
- **Decision:** Add `offer_url` (text, optional) to Offer entity. Separate from `source` (human-readable label).
- **Rationale:** Preserves a fallback application link per offer. Long-term resilience if Prince of Travel changes structure.

## D-273: Eligibility Group Hidden from FRM-005

- **Context:** SPEC-18 workshop — eligibility_group is used by SPEC-16 eligibility engine.
- **Decision:** `eligibility_group` is not exposed on FRM-005 UI. Backend-only field.
- **Rationale:** Purely computational field for ENH-004 cooldown rules; no user-facing value on the maintenance form.

## D-274: Offer History Chart — ApexCharts Stepped Area

- **Context:** SPEC-18 workshop — Sandro shared a reference screenshot of a stepped area offer history chart.
- **Options:** A) VizFrame bar chart, B) ApexCharts stepped area
- **Decision:** B — ApexCharts stepped area chart. FYV on Y-axis, time on X-axis, FYF hatched overlay, hover popover with spend/price/FYF/points.
- **Rationale:** Stepped area with mixed overlays is outside VizFrame's sweet spot. Matches the reference UI Sandro provided.

## D-275: "Best Ever" Indicator on Offer History Chart

- **Context:** SPEC-18 workshop — UX enhancement. Churners need to know if current offer is a historical high.
- **Decision:** Horizontal reference line at all-time highest FYV. "Best Offer Ever" badge on Current Offer section when current ≥ best.
- **Rationale:** Makes "is now the right time to apply?" an instant visual answer.

## D-276: Card Instance Bands on Offer History Chart

- **Context:** SPEC-18 workshop — UX enhancement. Show when user held the card relative to offer periods.
- **Decision:** Shaded bands overlaying Card Instance hold periods (activation_date → closed_date, or present if open) on the Offer History timeline.
- **Rationale:** Lets user see which offers they captured vs. missed at a glance.

## D-277: Quick-Compare from List

- **Context:** SPEC-18 workshop — UX enhancement. Comparing cards requires opening each one.
- **Decision:** Multi-select 2–3 Market Cards on list, "Compare" action opens side-by-side view of FYV, First Year Price, Required Spend, and Earning Multipliers.
- **Rationale:** Reduces friction when deciding between similar cards.

## D-278: No Current Offer Warning

- **Context:** SPEC-18 workshop — UX enhancement. Market Cards without a current offer have stale computed columns.
- **Decision:** ObjectStatus warning on list row + MessageStrip warning on object page when no Offer has `is_current = true`.
- **Rationale:** Prevents stale catalog entries from going unnoticed.

## D-279: Trophy Case as Analytical List Page

- **Context:** SPEC-21 workshop — RPT-004 page type. BA and TECH_STACK described Trophy Case as freestyle, but the data is tabular (redemption register) with aggregate KPIs.
- **Decision:** Fiori Elements Analytical List Page + Object Page. KPI tags, visual filters (donut/bar/line), horizontal bar chart (top 10 by CPP), full CRUD on Object Page.
- **Rationale:** ALP gives native sorting, filtering, variant management, and KPI aggregation — exactly what "sortable by CPP to highlight best burns" needs. Object Page provides natural create/edit home for Redemption records.

## D-280: Remove FRM-004 Section 4 (Redemptions)

- **Context:** SPEC-21 workshop — SPEC-03 defined FRM-004 Section 4 as "Redemption history for this card," but redemptions are program-level events (D-142), not card-level. Soft perk utilization is already tracked in Section 3 (Earning & Perks).
- **Decision:** Remove FRM-004 Section 4. Sections 5–8 renumber to 4–7. Trophy Case (RPT-004) is the sole home for points redemption CRUD.
- **Rationale:** A per-card redemptions section would be empty most of the time since redemptions are per-program. Soft perks are already covered in Section 3. Eliminates duplication with RPT-004.

## D-281: CPP Semantic Coloring Thresholds

- **Context:** SPEC-21 workshop — should effective CPP values be color-coded in the Trophy Case?
- **Decision:** Color relative to program's `cpp_valuation`: >= 2× → Positive/Green (exceptional), >= 1× → Information/Blue (above valuation), < 1× → Warning/Orange (below valuation). Applied to both table column and chart bars.
- **Rationale:** Makes best burns visually pop. Thresholds are relative to each program's valuation, so meaningful across programs. 2× for "exceptional" sets a high bar — genuinely outstanding redemptions.

## D-282: Effective CPP Auto-Calculated

- **Context:** SPEC-21 workshop — should effective CPP be manually entered or computed?
- **Decision:** Auto-calculated from `dollar_value / points_spent × 100`. Display-only on Object Page. Stored at save time per D-40.
- **Rationale:** Avoids rounding mismatches between user-entered CPP and the underlying values. Single source of truth.

## D-283: "Best Ever" Badge on Trophy Case

- **Context:** SPEC-21 workshop — UX enhancement. Highest CPP redemption should be instantly visible.
- **Decision:** The redemption with the highest `effective_cpp` displays a badge icon in the table row.
- **Rationale:** Reinforces the "trophy case" concept — your all-time best burn is celebrated.

## D-284: Program CPP Benchmark Line on Chart

- **Context:** SPEC-21 workshop — UX enhancement. Chart bars need context to understand if a CPP value is good or bad.
- **Decision:** Vertical reference line at program's `cpp_valuation` on the horizontal bar chart, visible only when filtered to a single program. Hidden for multi-program view.
- **Rationale:** Gives visual anchor — bars past the line are "above valuation" burns. Only meaningful for single-program view since programs have different valuations.

## D-285: CPP Rank Indicator on Object Page

- **Context:** SPEC-21 workshop — UX enhancement. When viewing a single redemption, show its ranking.
- **Decision:** Object page header displays the redemption's CPP rank among all redemptions (e.g., "#3 best burn").
- **Rationale:** Every redemption gets a ranking — reinforces the trophy case / personal achievement concept.

## D-286: Trophy Case Top 10 Chart Limit

- **Context:** SPEC-21 workshop — should the horizontal bar chart show all redemptions or a subset?
- **Decision:** Top 10 by `effective_cpp` descending. Full list remains in table below.
- **Rationale:** With 4–5 redemptions per year (~30–40 total over time), top 10 keeps the chart clean and focused on best burns while the table provides the complete register.

## D-287: No Alerts for Trophy Case

- **Context:** SPEC-21 workshop — OI-06 standing question. Does RPT-004 generate any alerts?
- **Decision:** No alerts. Trophy Case is a passive register — redemptions are user-logged events, not system-monitored.
- **Rationale:** No meaningful trigger condition exists. Unlike transaction ingestion or bonus tracking, there's nothing to alert on.

## D-288: Revised Side Nav Structure

- **Context:** Step 13 (Information Architecture) — reconcile DS-001 §4 nav structure against all 21 specs. Three changes emerged from functional specs.
- **Decision:** 23 nav entries across 5 groups. Added WFL-001 (Weekly Review) to Transactions. Removed FRM-002 (Transaction Entry) and FRM-006 (Card Onboarding) — accessed via parent list actions. Moved WFL-003 (Scraper Approvals) to Admin.
- **Rationale:** WFL-001 is the operational entry point (SPEC-15 D-244). FRM-002/FRM-006 follow Fiori list-report-in-nav, action-to-detail pattern (SPEC-17 D-253). WFL-003 is system management, not analytics.

## D-289: FRM-002 and FRM-006 Removed from Side Nav

- **Context:** SPEC-17 explicitly says "No dedicated side navigation entry" for FRM-002. FRM-006 is a wizard reached via FRM-004 Create, "Add Supplementary Card", or Churnboard empty state.
- **Decision:** Both removed from side nav. Accessed only via contextual actions on parent pages.
- **Rationale:** Standard Fiori pattern — list report in nav, create/edit form via action. Reduces nav clutter by 2 entries.

## D-290: Scraper Approvals Moved to Admin

- **Context:** SPEC-13 D-183 placed WFL-003 under Churning — Analytics. That group already has 7 items.
- **Decision:** Move Scraper Approvals to Admin group (alongside Master Data and SimpleFIN Connections).
- **Rationale:** Scraper Approvals is a system management function (reviewing/approving scraped data), not an analytics view. Admin group is the natural home.

## D-291: "Back to Weekly Review" Contextual Link

- **Context:** Weekly Review (WFL-001) links to 6 different pages. User bounces between WFL-001 and targets with no return mechanism.
- **Decision:** Target pages (FRM-010, FRM-003, FRM-001, FRM-007, RPT-001, RPT-002) show a contextual "Back to Weekly Review" link when navigated to from WFL-001.
- **Rationale:** Prevents reliance on browser back or side nav scanning. Reduces friction in the weekly review flow.

## D-292: FRM-006 → FRM-005 Create Market Card Shortcut

- **Context:** FRM-006 Step 1 requires Market Card to exist. SPEC-03 says "No inline creation — use FRM-005 first." If the card isn't in the database, user must abandon wizard.
- **Decision:** FRM-006 Step 1 adds a "Create Market Card" link in the value help that opens FRM-005 in create mode. On save, user returns to wizard with new card pre-selected.
- **Rationale:** Eliminates a dead-end where user abandons the onboarding wizard to create a prerequisite, then restarts.

## D-293: RPT-002 → FRM-009 Budget Allocations Link

- **Context:** Budget Dashboard shows per-category budget breakdown. If allocations are wrong, user must navigate to Admin → Master Data → Budget Allocations manually.
- **Decision:** RPT-002 Spending vs Budget category table adds an "Edit Allocations" action link navigating to FRM-009 with Budget Allocations pre-selected.
- **Rationale:** Direct path from problem (wrong allocation) to fix (edit allocation). Reduces unnecessary hops.

## D-294: RPT-011 Goal Cards → FRM-008 Navigation

- **Context:** RPT-011 (Goal Progress) shows goal cards but no click navigation to FRM-008 (Goals) for editing. RPT-002 has this link, but RPT-011 doesn't.
- **Decision:** Clicking a goal name on RPT-011 navigates to FRM-008 object page.
- **Rationale:** Consistent with RPT-002's goal name click behavior. Natural drill-down from progress view to detail/edit.

## D-295: Card Name Links on RPT-009, RPT-008, RPT-010

- **Context:** Several pages show card names in tables but lack click navigation to FRM-004. RPT-001 has this pattern — other pages should be consistent.
- **Decision:** Card name click → FRM-004 object page added to: RPT-009 Card Ranking table, RPT-008 perk tables, RPT-010 Contributing Cards table.
- **Rationale:** Consistent card name drill-down pattern across the entire application.

## D-296: RPT-002 → RPT-011 "View All Goals" Link

- **Context:** RPT-002 (Budget Dashboard) has a Goal Progress summary section. No link to RPT-011 (Goal Progress dashboard) for full visualization with timeline and completed goals.
- **Decision:** RPT-002 Goal Progress section adds "View All Goals" link navigating to RPT-011.
- **Rationale:** Bridges the summary view (RPT-002) and the detailed progress view (RPT-011).

## D-297: FRM-008 Linked Transactions → FRM-002 Navigation

- **Context:** FRM-008 (Goals) object page has a Linked Transactions section for spending goals showing transaction rows, but no click navigation.
- **Decision:** Clicking a transaction row in FRM-008 Linked Transactions navigates to FRM-002 (transaction object page).
- **Rationale:** Natural drill-down. User sees a linked transaction and may want to review or edit it.

## D-298: RPT-005 Section 5 → RPT-006 "View Full Matrix" Link

- **Context:** RPT-005 (Card Analytics) "What to Use This Card On" shows per-category earn rates and a "Best Card?" column. No link to RPT-006 for full cross-card comparison.
- **Decision:** Section 5 header adds "View Full Matrix" link navigating to RPT-006 (Recommendation Matrix).
- **Rationale:** Natural progression from single-card category view to full cross-card comparison.

## D-299: Default Landing Page — Weekly Review

- **Context:** App needs a default page on launch. Candidates: Weekly Review (WFL-001) or Churnboard (RPT-001).
- **Decision:** Weekly Review (WFL-001) is the default landing page on app launch.
- **Rationale:** It's the first nav item, surfaces what needs attention via auto-detected checklist status, and links to all operational pages. Churnboard is one click away.

## D-300: Alert Action Correction — offers_pending_approval

- **Context:** SPEC-19 §4.1.12 routes `offers_pending_approval` alert action to FRM-005 (Market Cards). But pending approvals live on WFL-003 (Scraper Approvals).
- **Decision:** `offers_pending_approval` alert action navigates to WFL-003 instead of FRM-005.
- **Rationale:** Pending scraper items are reviewed on the Scraper Approvals view, not the Market Cards browser. SPEC-19 §4.1.12 corrected.

## D-301: RPT-010 → RPT-004 "View All Redemptions" Link

- **Context:** RPT-010 (Points Dashboard) has a Redemption History section per program. No link to RPT-004 (Trophy Case) for the cross-program redemption view.
- **Decision:** RPT-010 redemption section adds "View All Redemptions" link navigating to RPT-004.
- **Rationale:** Bridges per-program redemption view and cross-program redemption register.

## D-302: FRM-004 → RPT-008 "View All Perks" Link

- **Context:** FRM-004 (My Cards) object page has an Earning & Perks section showing card-specific perks. No link to RPT-008 (Perk Tracker) for the cross-card perk view.
- **Decision:** FRM-004 Earning & Perks section adds "View All Perks" link navigating to RPT-008.
- **Rationale:** Natural progression from single-card perks to cross-card perk utilization view.

## D-303: RPT-002 → RPT-007 "View Trends" Link

- **Context:** RPT-002 (Budget Dashboard) shows single-month budget data. RPT-007 (Spending Trends) shows multi-month trends. No link between them.
- **Decision:** RPT-002 adds "View Trends" link navigating to RPT-007.
- **Rationale:** Bridges current-month view and historical trend analysis. Improves RPT-007 discoverability.

## D-304: RPT-002 → RPT-012 "Income vs Expenses" Link

- **Context:** RPT-002 (Budget Dashboard) hero KPI shows income vs spend for one month. RPT-012 (Income vs Expenses Trend) shows multi-month macro view. No link between them.
- **Decision:** RPT-002 hero KPI secondary line adds "Income vs Expenses" link navigating to RPT-012.
- **Rationale:** Bridges current-month snapshot and long-term financial trend. Improves RPT-012 discoverability.

## D-305: RPT-003 → FRM-011 "Update Balances" Link

- **Context:** RPT-003 (Financial Picture Dashboard) shows net worth and trends. FRM-011 (Financial Picture Entry) is where balances are updated. No link between them.
- **Decision:** RPT-003 adds "Update Balances" link navigating to FRM-011.
- **Rationale:** Dashboard consumer should link to the data entry form. Natural "data looks stale → update it" flow.

## D-306: FRM-011 → RPT-003 "View Dashboard" Link

- **Context:** FRM-011 (Financial Picture Entry) batch entry dialog — after saving updated balances, no link to see the impact on the dashboard.
- **Decision:** FRM-011 adds "View Dashboard" link to RPT-003 after batch entry save.
- **Rationale:** Natural "enter data → see results" flow. Closes the entry-to-visualization loop.

## D-307: Wave-Gating — Hidden Until Built

- **Context:** DS-001 §4 states "Wave-gated items appear in the nav structure from Wave 1 but are disabled until their wave is built." All 4 waves build before go-live — no phased release.
- **Decision:** Nav items are hidden until built. Each sprint adds its nav entries when corresponding pages are implemented. No disabled states or "coming soon" placeholders.
- **Rationale:** No end-user sees a partial app. Disabled nav items during development are visual noise for a single developer. Amends DS-001 §4.

## D-308: Brand Palette — Warm Charcoal

- **Context:** D-60 established "standard Horizon semantic colors only, no custom accent." Step 14 (Theme Build) replaces this constraint with a defined custom palette to give the app its own visual identity.
- **Options:** A) Dark teal/green (finance-app classic), B) Deep purple/indigo (modern, distinctive), C) Warm charcoal/slate (understated, premium), D) Keep Horizon blue
- **Decision:** C — Warm Charcoal (`#3D3A38`) as the primary brand color. Four-value palette: Primary (`#3D3A38`), Hover (`#2E2B29`), Active (`#252220`), Selected Background (`#EDECEB`). All values share a warm (slightly reddish-brown) undertone.
- **Rationale:** Neutral brand color recedes, letting semantic colors (green/red/orange/blue/grey) carry all meaning. No collision with any of the 5 semantic states or 6 issuer chart colors. WCAG AAA contrast against white (~10.2:1). Fits a data-dense financial app where chrome should stay quiet and data should speak. Amends D-60.

## D-309: Dark ShellBar

- **Context:** The ShellBar (top header bar) is the most visible brand surface. Horizon default is white. With a charcoal brand, the ShellBar can either stay light (charcoal as accent only) or go dark (charcoal as surface).
- **Options:** A) Dark ShellBar — charcoal background, white text/icons. B) Light ShellBar — white background, charcoal accents only.
- **Decision:** A — Dark ShellBar. Background `#3D3A38`, text/icons `#FFFFFF`. Subtle `box-shadow: 0 1px 4px rgba(0,0,0,0.15)` for separation from white content below.
- **Rationale:** Creates a strong visual anchor. Premium feel similar to VS Code, Slack, Bloomberg Terminal. App title and icons pop against the dark surface. Single most impactful visual differentiator from stock Horizon.

## D-310: Zero Border Radius

- **Context:** Step 14 specifies "0 border radius on buttons, inputs, cards, and interactive controls. Sharp edges throughout."
- **Decision:** All containers and interactive controls set to `border-radius: 0`. This includes buttons, inputs, cards, dialogs, popovers, panels, toolbars, tabs, and checkboxes. Five CSS custom properties overridden. Exceptions kept rounded: radio buttons (circle = universal radio affordance), avatars (circular by convention), switch tracks (pill = toggle affordance), progress indicator tracks.
- **Rationale:** Sharp edges create an architectural, grid-like feel that pairs with the understated charcoal palette. Exceptions preserve functional affordances where rounded shape carries meaning.

## D-311: Component Overrides

- **Context:** Beyond palette and border radius, specific components need targeted tweaks to complete the visual identity.
- **Decision:** Charcoal emphasized buttons (replacing Horizon blue). Charcoal default button text/border. Warm Mist (`#EDECEB`) hover and selection backgrounds on buttons, table rows, and list items. Charcoal side nav active indicator (left border + text + icon). Charcoal input focus borders. Card shadow retained (Horizon default — shadows provide functional separation on dashboards). Dialogs retain shadow for modality. Message strips unchanged (semantic colors only).
- **Rationale:** Every blue-tinted interactive element shifts to charcoal or warm grey. Semantic colors untouched. Card shadow kept because it provides functional depth on data-dense dashboards — removing it was considered but rejected as over-engineered.

## D-312: Override Strategy — Single CSS File

- **Context:** Need to apply theme overrides without introducing build tooling, SAP Theme Designer, or npm theming packages.
- **Options:** A) SAP Theme Designer (generates `.theming` packages), B) `@sap-theming/` npm build pipeline, C) Single CSS file loaded after Horizon, D) Runtime `applyTheme()` with custom theme ID
- **Decision:** C — Single CSS file at `app/shared/css/theme-overrides.css`, loaded via `<link>` tag in `index.html` after the SAPUI5 bootstrap. Two layers: CSS custom properties (`:root {}` block) for ~90% of overrides, targeted class selectors as fallback. `!important` banned.
- **Rationale:** Zero build tooling. One file to maintain. Works with CDN-loaded Horizon. SAPUI5 CSS custom property names are part of SAP's public API — stable across minor versions. Targeted selectors are the escape hatch, used sparingly with version-documenting comments. Survives SAPUI5 upgrades with minimal review effort.

## D-313: Color Mapping Table

- **Context:** Need a single source of truth listing every CSS custom property being overridden and its new value.
- **Decision:** 28 CSS custom properties overridden across 7 categories (brand, shell, emphasized buttons, default buttons, input fields, lists/tables, border radius). 8 properties explicitly documented as kept at Horizon defaults (link color, 5 semantic colors, background, text color, font family). ~2 Layer 2 targeted selectors identified as candidates, exact selectors to be verified during W1-S1 scaffold.
- **Rationale:** Documenting both overridden and explicitly-kept properties prevents ambiguity during build. Horizon default values listed are approximate (based on 1.120.x) and will be verified against the CDN-loaded theme. Override values are final.
