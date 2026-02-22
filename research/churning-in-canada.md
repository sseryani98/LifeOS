# Credit Card Churning in Canada: Complete Reference for Application Development

Credit card churning — the practice of repeatedly opening cards to capture welcome bonuses, then cancelling or product-switching before annual fees renew — is a well-established strategy among Canadian travel hackers. This document provides a comprehensive reference covering every major issuer, rewards program, tool, and strategy relevant to Canadian churning, structured to serve as a context document for building a churning management application.

---

## How churning works in the Canadian context

Churning in Canada revolves around a smaller ecosystem than the United States: **five major banks** (TD, RBC, CIBC, BMO, Scotiabank), **American Express Canada**, and a handful of secondary issuers. The smaller market means fewer card products but also historically less aggressive anti-churning enforcement — though this is rapidly changing as of 2024-2026.

The lifecycle of every churn follows the same pattern: **apply** for a card (through a cashback portal like GCR when possible) → **meet the minimum spend requirement** within the specified window → **collect the welcome bonus** → **decide** whether to keep, cancel, or product-switch the card before the annual fee renews. Experienced churners layer additional value through referral bonuses, household coordination (P1/P2 strategy), and strategic timing across issuers.

Canada's two credit bureaus — **Equifax** and **TransUnion** — both factor into churning strategy, since different banks pull from different bureaus. This allows churners to distribute hard inquiries across bureaus to minimize the appearance of excessive applications at any single bureau. The Canadian churning community is centered around **r/churningcanada** (~100K members), **Prince of Travel** (princeoftravel.com), **Frugal Flyer** (frugalflyer.ca), and **Milesopedia** (milesopedia.com).

### Key terminology

| Term | Definition |
|------|-----------|
| **SUB / WB** | Signup Bonus / Welcome Bonus — points received for opening a card and meeting minimum spend |
| **MSR / MS** | Minimum Spending Requirement — the dollar amount that must be spent to unlock the bonus (typically $1,000–$15,000 within 3–6 months) |
| **AF** | Annual Fee — yearly card fee ($0 to $799) |
| **FYF** | First Year Free — annual fee waived in year one |
| **PS** | Product Switch — changing a card to a different product within the same bank without a new credit application |
| **P1 / P2 / P3** | Player 1, 2, 3 — the primary churner, their partner/spouse, and sometimes other family members |
| **DP** | Data Point — an anecdotal report of an outcome (e.g., "PS'd to Avion, received full bonus") |
| **HUCA** | Hang Up, Call Again — try a different customer service agent |
| **EQ / TU** | Equifax / TransUnion — Canada's two credit bureaus |
| **Hard Pull / Soft Pull** | Hard inquiry (affects credit score) vs. soft inquiry (no score impact) |
| **MR** | Membership Rewards — Amex's transferable points currency |
| **AP** | Aeroplan — Air Canada's loyalty program |
| **GCR** | Great Canadian Rebates — cashback portal for card applications |
| **CPP** | Cents Per Point — metric for valuing redemptions |
| **AAoA** | Average Age of Accounts — a credit score factor |
| **FTF** | Foreign Transaction Fee — typically 2.5% in Canada |
| **Amexiled** | Being banned by American Express for churning behavior |
| **NLL** | No Lifetime Language — an Amex offer that omits the once-per-lifetime restriction |
| **Recon** | Reconsideration — calling an issuer to argue for approval after denial |

### Ethical and legal considerations

Credit card churning is **legal in Canada**. Card issuers design products with awareness that some customers will primarily seek welcome bonuses. However, there are meaningful risks:

- **Credit score impact**: Each application triggers a hard pull, temporarily reducing the score by a few points. Multiple pulls compound. Churners typically report **20–50 point drops** during active periods, recovering within 6–12 months of pausing. Hard inquiries remain visible for 3–6 years depending on bureau.
- **Issuer blacklisting**: Amex Canada has increasingly "Amexiled" churners — banning them from all Amex products permanently. Aeroplan has conducted **clawbacks** of welcome bonus points from members who violated cross-issuer rules (as of October 2024).
- **Mortgage/loan impact**: Churners should pause activity **6–12 months** before applying for a mortgage or major loan.

---

## Financial providers and card issuers

### American Express Canada

Amex is the **single most important issuer for Canadian churners** due to the sheer number of products (10+), massive welcome bonuses, the flexible MR currency, and the referral ecosystem.

#### Card portfolio

**Membership Rewards (MR) earning cards:**

| Card | Type | AF | Welcome Bonus | MSR | Key Earn Rate |
|------|------|-----|---------------|-----|---------------|
| **Platinum Card** | Charge | $799 | Up to 110,000 MR (80K after $10K/3mo + 30K in months 15–17) | $10,000/3 months | 2x dining & travel, 1x other |
| **Gold Rewards** | Charge | $250 | Up to 70,000 MR (monthly earning structure: $1K/mo × 12 + $4K/3mo) | $1,000/month | 2x gas/grocery/drugstore/travel |
| **Cobalt** | Credit | $15.99/mo ($191.88/yr) | Up to 15,000 MR (1,250/mo × 12 months at $750/mo spend) | $750/month | **5x food & drink** (capped $2,500/mo), 3x streaming, 2x gas/transit |
| **Green** | Credit | $0 | 10,000 MR after $1,000/3mo | $1,000/3 months | 1x all purchases |
| **Business Platinum** | Charge | $799 | Up to 130,000 MR (90K after $15K/3mo + 40K months 15–17) | $15,000/3 months | 1.25x all purchases |
| **Business Gold Rewards** | Charge | $199 | Up to 70,000 MR (50K after $7.5K/3mo + 20K after $30K/12mo) | $7,500/3 months | 1x all purchases |

**Aeroplan co-branded cards:**

| Card | AF | Welcome Bonus | MSR |
|------|-----|---------------|-----|
| **Aeroplan Reserve** | $599 | Up to 85,000 AP (60K after $10.5K/3mo + 25K in month 13) | $10,500/3 months |
| **Aeroplan Business Reserve** | $599 | Up to 90,000 AP (65K after $10.5K/3mo + 25K in month 13) | $10,500/3 months |

**Marriott Bonvoy co-branded cards:**

| Card | AF | Welcome Bonus | MSR |
|------|-----|---------------|-----|
| **Bonvoy Personal** | $120 | Up to 110,000 Bonvoy (80K after $6K/6mo + 30K month 15) | $6,000/6 months |
| **Bonvoy Business** | $150 | Up to 110,000 Bonvoy (80K after $10K/6mo + 30K month 15) | $10,000/6 months |

**Cash back cards** (SimplyCash at $0 AF, SimplyCash Preferred) have minimal churning value but serve as holding cards.

#### The "once per lifetime" rule

Amex Canada's terms state: *"These offers are only available to new [Card] Cardmembers. For current or former [Card] Cardmembers, we may approve your application, but you will not be eligible for these offers."*

Key facts about this rule:
- **Each card product is treated separately.** Having the Platinum does not block the Gold welcome bonus.
- **Personal and business versions are separate products.**
- The **practical reset period is approximately 7 years** after closing a card (anecdotal, based on US and Canadian data points).
- Enforcement was historically inconsistent in Canada but has been **tightening significantly** since 2024.
- **Business card applications** historically did not include anti-churning language, making them more reliably churnable.
- Unlike the US, Canada does **not** have "family rules" where holding one card blocks bonuses on related products.
- Churners work around this by: collecting all different product bonuses first, using P2 referrals, watching for NLL (No Lifetime Language) targeted offers, and waiting for the ~7-year reset.

#### Application rules

- **Credit cards**: Maximum **4 credit cards** simultaneously. Charge cards are **unlimited**.
- **1-in-5 rule**: Only one credit card approval every 5 days. Charge cards exempt.
- **2-in-90 rule**: Maximum 2 credit cards every 90 days. Third application auto-rejected. Charge cards exempt.
- **Business Platinum/Gold 90-day rule**: Cannot apply for both within 90 days of each other.
- **Credit bureau**: Typically **TransUnion** for first Amex card (hard pull). Existing cardholders often get **soft pull only** for subsequent applications.
- **Product switching**: Amex Canada does **not support traditional product switches** like the Big 5 banks. You must apply for a new card and cancel the old one.
- **Minimum hold period**: Cancel before 12 months = red flag for clawback.

#### Self-referral and referral bonuses

Self-referral is now **explicitly prohibited** in Amex's terms. Violations can result in point clawbacks and account closure. However, **P2 cross-referrals** (referring a partner/spouse) are widely accepted.

| Referring Card | Referral Bonus | Annual Cap |
|----------------|---------------|------------|
| Platinum | 15,000 MR | 300,000 MR (20 referrals) |
| Business Platinum | 15,000–20,000 MR | 225,000–300,000 MR |
| Gold Rewards | 10,000 MR | 200,000 MR |
| Cobalt | ~2,500 MR | Varies |
| Bonvoy cards | 10,000 Bonvoy | 150,000 Bonvoy/year |

Amex periodically runs **double referral promotions** that double all referral bonus amounts.

---

### TD Bank

TD is the **most product-switch-friendly** bank in Canada, making it a core pillar of churning strategy.

| Card | AF | Welcome Bonus | MSR |
|------|-----|---------------|-----|
| **Aeroplan Visa Infinite** | $139 (FYF) | Up to 40,000–45,000 Aeroplan | $7,500/180 days |
| **Aeroplan Visa Infinite Privilege** | $599 | Up to 60,000+ Aeroplan | Higher thresholds |
| **First Class Travel Visa Infinite** | $139 (FYF) | Up to 165,000 TD Rewards (all-time high, Sep 2025) | $7,500/180 days |
| **Platinum Travel Visa** | $89 (FYF) | Lower TD Rewards bonus | Lower threshold |

**Application rules**: TD uses a **12-month rule per product** — you're ineligible for the same card's bonus if you opened that product in the last 12 months. Different TD products don't affect each other. The TD First Class Travel card uses a **6-month rule** based on when you last *closed* the card. Aeroplan cards use the date you last *opened* the card.

**Product switch strategy**: Done via phone only (1-800-983-8472). No hard credit pull. Full welcome bonuses are sometimes awarded when switching between different card families (e.g., Aeroplan → First Class Travel). Recommended cadence: switch every **6 months** per tradeline. Visa Infinite requires $5,000 minimum credit limit; Visa Infinite Privilege requires $10,000.

**Credit bureau**: **Equifax**.

**TD Rewards valuation**: ~0.5 cpp. Best redeemed via Expedia for TD (200 points = $1). Far less valuable per point than Aeroplan (~2.5 cpp).

---

### CIBC

CIBC is among the **most churning-friendly** Big 5 banks — no official cooldown period.

| Card | AF | Welcome Bonus | MSR |
|------|-----|---------------|-----|
| **Aventura Visa Infinite** | $120 (FYF) | Up to 60,000 Aventura | $6,000/4 months |
| **Aventura Visa Infinite Privilege** | $499 | Up to 80,000 Aventura | $6,000/4 months + $25K/12mo for anniversary |
| **Aeroplan Visa Infinite** | $139 (FYF) | Up to 40,000–45,000 Aeroplan | $6,000/6 months |
| **Aeroplan Visa Infinite Privilege** | $599 | Up to 100,000 Aeroplan | Higher thresholds |

**Application rules**: No official cooldown. Can sometimes open **multiple cards on a single credit inquiry** if approved for a high credit limit. CIBC rotates "global migration offers" — non-public product switch bonuses accessible via phone reps.

**Aventura points**: ~1 cpp for travel via CIBC Rewards Centre, up to 2.29 cpp using the Aventura Flight Rewards Chart. **No transfer partners** — purely in-house redemption. Points don't expire while holding the card.

**Credit bureau**: **Equifax** (primary).

---

### RBC (Royal Bank of Canada)

RBC is notable for being the only Big 5 bank that primarily pulls **TransUnion**, and for its valuable Avion transfer partners.

| Card | AF | Welcome Bonus | MSR |
|------|-----|---------------|-----|
| **Avion Visa Infinite** | $120 | Up to 55,000 Avion (all-time high, Aug 2025) | Multi-tier spend thresholds |
| **Avion Visa Infinite Privilege** | $399 | Up to 70,000 Avion | Multi-tier thresholds |
| **WestJet RBC World Elite MC** | $139 | Up to 70,000 WestJet points + companion voucher | Varies |
| **British Airways Visa Infinite** | $165 | 25,000–35,000 Avios | Varies |

**Application rules**: **1/90 rule** — RBC only approves one new credit card application every 90 days. Automatic rejection if applied sooner. Firmly enforced but not officially stated. Does not apply to product switches. RBC provides **pro-rated annual fee refunds** when you cancel.

**Product switch**: Available via phone or online banking dashboard. Welcome bonuses on PS are YMMV and RBC has been cracking down. Best results switching between card families (Avion → WestJet → British Airways).

**Credit bureau**: **TransUnion** — strategically valuable since most other Big 5 banks pull Equifax.

**RBC Avion transfer partners** (Elite tier required):
- British Airways Avios: **1:1** (with regular 30% transfer bonuses 1–2x per year)
- Cathay Pacific Asia Miles: **1:1** (occasional 15% bonuses)
- American Airlines AAdvantage: **10:7**
- WestJet Rewards: **1:1**

---

### BMO (Bank of Montreal)

BMO has the **weakest churning bonuses** among the Big 5, but the eclipse card family has been improving.

| Card | AF | Welcome Bonus | MSR |
|------|-----|---------------|-----|
| **eclipse Visa Infinite** | $120 (FYF) | Up to 70,000 BMO Rewards | $12,000/365 days (tiered) |
| **eclipse Visa Infinite Privilege** | $599 | Up to 200,000 BMO Rewards (all-time high) | $75,000/365 days (tiered) |
| **Ascend World Elite MC** | $150 | Up to 100,000–115,000 BMO Rewards | $20,000/365 days (tiered) |
| **Air Miles World Elite MC** | $120 | Up to 7,000 Air Miles | $4,500/110 days |
| **eclipse rise Visa** | $0 | Up to 25,000 BMO Rewards | $1,500/3 months |

**Application rules**: No firm cooldown. T&Cs restrict bonuses for customers who cancelled "during the Offer Period" — partially enforced. Product switches rarely yield bonuses. The $0-AF eclipse rise Visa serves as the ideal "parking" card for maintaining a BMO tradeline.

**BMO Rewards valuation**: ~0.67 cpp when redeemed for travel (150 points = $1). No transfer partners — redeem through BMO portal or against any travel purchase.

**Credit bureau**: **Equifax** primarily (some reports of TransUnion).

**Note**: BMO is launching **Blue Rewards** in Summer 2026 to replace Air Miles on BMO credit cards.

---

### Scotiabank

Scotiabank has strong everyday earning cards but a restrictive 2-year churning rule.

| Card | AF | Welcome Bonus | MSR |
|------|-----|---------------|-----|
| **Gold American Express** | $120 (FYF) | Up to 45,000–50,000 Scene+ | $2,000/3 months + $7,500/12 months |
| **Passport Visa Infinite** | $150 | Up to 60,000 Scene+ | $2,000/3 months + $10,000/14 months |
| **Platinum American Express** | $399 | Up to 80,000 Scene+ | $3,000/3 months |
| **Scene+ Visa (No Fee)** | $0 | Minimal | — |

**Application rules**: T&Cs state a **2-year rule** — ineligible for a welcome bonus if you've held any Scotiabank personal credit card in the past 2 years. **Partially enforced**: you'll likely get the points but may not get the annual fee waiver. The Gold Amex has a remarkably low **$12,000 household** income requirement.

**Scene+ program**: ~1 cpp. Owned jointly by Scotiabank, Cineplex, and Empire Company. **No transfer partners.** Redemption options include travel booking (100 pts = $1), grocery discounts at Empire stores (Sobeys/IGA/Safeway), Cineplex movies, gift cards, and statement credits. Shell Canada joining Scene+ in 2026. Points don't expire while holding a Scene+ product.

The **Scotiabank Gold Amex** earns **6x at Empire grocery stores** — unmatched in Canada for grocery spending.

**Credit bureau**: **Equifax** primarily.

---

### MBNA (Division of TD)

The MBNA Alaska Airlines Mastercard was **discontinued September 1, 2023** — historically the most churnable card in Canada. It offered 25,000–30,000 Alaska Miles with a $1,000 MSR and could be churned every 3–6 months.

**Current state**: All Alaska cards were converted to **MBNA Rewards cards**:
- **MBNA Rewards World Elite MC**: 30,000 points bonus (20K after $2K/90 days + 10K for paperless). $99/year. Points worth ~1 cpp for travel.
- Product switching remains available between MBNA products.
- A promised permanent transfer to Alaska Airlines Mileage Plan **never materialized** — only a one-time legacy transfer window was offered.

---

### National Bank of Canada

| Card | AF | Welcome Bonus | MSR |
|------|-----|---------------|-----|
| **World Elite MC** | $150 (FYF via promotions) | Up to 50,000 points (via partner offers) | $5,000/3 months + $20,000/12 months |

Features a **$150 annual travel credit** and free unlimited access to the **National Bank Lounge at Montreal-Trudeau (YUL)**. Earns up to 5 pts/$ on groceries & restaurants. Named Best Travel Credit Card by Milesopedia 2023–2026. Must not have held a National Bank MC in the past 12–24 months to qualify for welcome bonus. **Credit bureau**: Equifax.

### Other issuers of note

- **Rogers World Elite MC**: No AF, 1.5% cashback all purchases (3% on USD). No significant welcome bonus. Low churning value but excellent as a daily driver.
- **Brim World Elite MC**: No FTF on Mastercard (unique), 0% FX fees. FYF available. Moderate churning value.
- **Neo Financial**: Up to 5% cashback via partner network. No major SUB to churn.
- **Canadian Tire Triangle World Elite MC**: No AF, strong CT Money earn. Not a churning target.
- **Desjardins**: Competitive cashback cards, more popular in Quebec. Moderate churning value.
- **HSBC Canada**: **Ceased to exist April 1, 2024** — acquired by RBC for $13.5 billion. All cards converted to RBC Avion products.

### Credit bureau pull summary

| Issuer | Primary Bureau |
|--------|---------------|
| TD | Equifax |
| CIBC | Equifax |
| RBC | **TransUnion** |
| BMO | Equifax |
| Scotiabank | Equifax |
| Amex | TransUnion (first card hard pull; soft for existing) |
| MBNA | TransUnion |
| National Bank | Equifax |

---

## Third-party tools and referral programs

### Great Canadian Rebates (GCR)

**GCR** (greatcanadianrebates.ca) is Canada's premier cashback affiliate portal and a cornerstone of churning strategy. It pays cash rebates when users apply for credit cards through its links — **completely separate from** the card's own welcome bonus, enabling stacking.

**How it works**: Register for free → log in → find desired card → click through to issuer → complete application in same browser session → if approved, rebate posts to GCR account within 48–72 hours (up to 21 days) → payout via direct deposit, PayPal, or eGift card when balance exceeds ~$12 for 58+ days.

**Typical rebate ranges**:
- Amex Cobalt: ~$120
- Amex premium cards: ~$100
- Scotiabank cards: ~$50–$100
- MBNA cards: ~$60 (historically)
- General range: **$50–$230 per application**

**Critical rules**: Turn off adblockers. Complete application in same session. GCR may **claw back cashback** if card cancelled within ~2.5–3 months. Rebate amounts fluctuate — GCR periodically "boosts" specific cards.

### Other cashback portals

- **FlyerFunds** (by Frugal Flyer): Newer competitor, pays via PayPal on rolling basis. Has a **Rebate Comparison Tool** comparing FlyerFunds vs. GCR vs. creditcardGenius rates.
- **creditcardGenius (CCG)**: Third major rebate portal alongside GCR and FlyerFunds.
- **Rakuten Canada**: Primarily for retail shopping cashback, **not** credit card applications. Complementary to GCR.

### Example stacking on a single application

Apply for TD Aeroplan Visa Infinite through GCR:
- **Welcome bonus**: 40,000 Aeroplan points (~$1,000 value)
- **GCR cashback**: ~$100
- **FYF**: saves $139 annual fee
- **Total first-year value**: ~$1,239

If using a P2 referral instead of GCR (where available), the referrer earns additional points on top.

---

## Rewards programs

### Aeroplan (Air Canada) — The #1 Canadian churning target

Aeroplan is the dominant loyalty program in Canada, earning points via **11 co-branded cards** across TD, CIBC, and Amex, plus receiving **1:1 transfers** from Amex Membership Rewards.

**Point valuation**: **~2.5 cpp CAD** (Prince of Travel benchmark). Economy redemptions typically yield 1.2–1.6 cpp; business/first class partner redemptions routinely yield **3–7+ cpp**.

**Transfer partners into Aeroplan**:
- Amex MR (Canada): **1:1**
- Amex MR (US): 1:1
- Chase Ultimate Rewards (US): 1:1
- Capital One (US): 1:1
- Bilt Rewards (US): 1:1
- Marriott Bonvoy: 3:1 (60K Bonvoy = 25K Aeroplan with 5K bonus)

**Redemption structure**: Air Canada flights use **dynamic pricing** (variable points cost, any purchasable seat bookable). Most Star Alliance partners use a **fixed distance-based award chart** with predictable pricing. No carrier surcharges on partner awards — a massive advantage.

**Sweet spot redemptions**:
- **Short-haul under 500 mi**: 6,000 points economy (e.g., Montreal–NYC, Toronto–Chicago)
- **ANA Business Class** (West Coast–Tokyo): ~55,000 points one-way; cash fares $3,000+ = 5+ cpp
- **Lufthansa First Class**: ~100,000 points one-way; cash fares $7,000+ = 7+ cpp
- **EVA Air Royal Laurel Business**: Fixed partner rates, world-class product
- **Mini-RTW itineraries**: Up to 16 segments on partner-only bookings. One stopover outside US/Canada for +5,000 points. Example: Toronto → Frankfurt → Bangkok → Sydney → Vancouver for ~167,500 points in business class.
- **Turkish Airlines via Istanbul**: No carrier surcharges, great for Europe/Middle East/Africa routing

**Cross-issuer 5-tier rule (February 2024)**: Aeroplan limits welcome bonuses to **once per card tier, per lifetime, regardless of issuer**:

| Tier | Example Cards |
|------|--------------|
| Entry | TD Aeroplan Platinum, CIBC Aeroplan Visa Card |
| Core | TD Aeroplan VI, CIBC Aeroplan VI, Amex Aeroplan Card |
| Premium | TD Aeroplan VIP, CIBC Aeroplan VIP, Amex Aeroplan Reserve |
| Core Business | CIBC Aeroplan Visa Business |
| Premium Business | Amex Aeroplan Business Reserve |

Getting a TD Aeroplan VI bonus means you **cannot** also get the CIBC Aeroplan VI bonus. Maximum 5 Aeroplan card welcome bonuses lifetime. Aeroplan has conducted clawbacks for violations.

**Churner strategy**: Collect one bonus per tier, then supplement with **Amex MR cards** (Cobalt, Gold, Platinum, Business variants) which transfer 1:1 to Aeroplan but are **not subject** to the 5-tier rule.

### Amex Membership Rewards (MR)

MR is the **most flexible points currency** in Canada. Points pool across all MR-earning cards into a single balance. You **must maintain at least one active MR-earning card** or lose all points.

**Transfer partners (Canada)**:

| Partner | Ratio | Alliance/Type |
|---------|-------|---------------|
| Air Canada Aeroplan | 1:1 | Star Alliance |
| British Airways Avios | 1:1 | oneworld |
| Air France/KLM Flying Blue | 1:0.75 | SkyTeam |
| Cathay Pacific Asia Miles | 1:0.75 | oneworld |
| Delta SkyMiles | 1:0.75 | SkyTeam |
| Etihad Guest | 1:1 | Independent |
| Marriott Bonvoy | 1:1.2 | Hotel |
| Hilton Honors | 1:1 (or 1:2) | Hotel |

Canadian MR has significantly **fewer partners** than US MR (~8 vs. ~20+). Amex runs periodic **transfer bonuses** (most commonly 30% to Marriott Bonvoy, occurring 1–3x/year).

**Best practice**: Transfer to Aeroplan (1:1) for premium cabin flights yielding 2–5+ cpp. Never cash out at 1 cpp (1,000 points = $10 statement credit) unless absolutely necessary.

### RBC Avion Rewards

**Valuation**: ~2.0 cpp. Transfer partners require **Elite tier** (Avion credit card holders):

| Partner | Ratio |
|---------|-------|
| British Airways Avios | 1:1 (30% bonuses 1–2x/year) |
| Cathay Pacific Asia Miles | 1:1 (occasional 15% bonuses) |
| American Airlines AAdvantage | 10:7 |
| WestJet Rewards | 1:1 |

The **30% Avios transfer bonus** (occurring roughly twice yearly) is the best time to convert Avion points. RBC also offers a fixed Air Travel Redemption Schedule at up to 2.3 cpp. RBC Avion is the **only Canadian bank program** that transfers to American Airlines.

### TD Rewards / First Class Travel

**Valuation**: ~0.5 cpp. Redeemed via Expedia for TD portal (200 points = $1) or as "Book Any Way" statement credits (250 points = $1). No airline transfer partners. The TD First Class Travel Visa Infinite's 165,000-point welcome bonus (at ~0.5 cpp) equates to about **$825 in travel credit** — still valuable despite the low per-point valuation.

### CIBC Aventura

**Valuation**: ~1 cpp via Rewards Centre; up to 2.29 cpp via Aventura Flight Rewards Chart. **No transfer partners** — redemptions only through CIBC's own portal for flights, hotels, car rentals, vacation packages, or payment toward credit card balance. Points don't expire while holding the card. Underrated for covering hotels and non-flight travel.

### Scene+ (Scotiabank)

**Valuation**: ~1 cpp (consistent across redemption types). Joint venture of Scotiabank, Cineplex, and Empire Company. **No airline/hotel transfer partners.** Redemptions include: Apply Points to Travel (100 pts = $1), grocery discounts at Empire stores (1,000 pts = $10), Cineplex movies (1,250 pts = 1 ticket), gift cards, and statement credits. Shell Canada joining in 2026. Fixed-value program — simpler but less potential for outsized value on premium travel.

### BMO Rewards

**Valuation**: ~0.67 cpp (150 points = $1 travel). No transfer partners. Redeem through BMO portal or against any travel merchant purchase. Being replaced by **Blue Rewards** (Summer 2026) which will convert Air Miles to "Blue Points."

### Air Miles

**Valuation**: Cash Miles ~10.5 cpp (95 Cash Miles = $10); Dream Miles 9–20 cpp depending on redemption. **Major change January 25, 2026**: Cash Miles and Dream Miles **merging into one unified balance**. The program has experienced **significant ongoing devaluation** and is not a primary churning target. Earned via BMO cards and 300+ shopping partners (Shell, Sobeys, Metro, Rexall, LCBO). Tiers: Blue, Gold (500+ Miles/year), Onyx (6,000+ Miles/year).

### Avios (British Airways Executive Club)

Canadians earn Avios via **Amex MR transfers (1:1)**, **RBC Avion transfers (1:1, with frequent 30% bonuses)**, and the **RBC British Airways Visa Infinite**.

Avios uses an **additive, distance-based award chart** — you pay per segment. Key sweet spots for Canadians:

- **Qatar Airways Qsuites**: Montreal/Toronto → Doha at ~70,000 Avios one-way (world's best business class)
- **Iberia Business Class** (via Iberia Plus transfer): NYC/Boston/Chicago → Madrid for 34,000 Avios off-peak
- **Toronto–Dublin on Aer Lingus**: ~13,000 Avios economy off-peak
- **Short-haul European flights**: London–Rome for ~11,750 Avios

Avios are **freely transferable** between 6 programs (BA, Qatar, Iberia, Aer Lingus, Finnair, Vueling) at 1:1. Each has its own sweet spots.

### WestJet Rewards / WestJet Points

Underwent a **major overhaul April 30, 2025**: WestJet Dollars became WestJet Points at 1:100 conversion. **Dollar-value program**: 100 WestJet points = $1. Points never expire. No blackout dates. Earned via RBC WestJet cards and WestJet flights.

The **companion voucher** is the primary churning draw:
- World Elite: companion round-trip for **$119** (domestic/US) or **$399** (international) after first purchase and annually with $5,000 spend
- Average savings: **$480 per voucher**
- New options: can exchange voucher for 25% flight discount, WestJet Vacations credit, or points

### Marriott Bonvoy

**Valuation**: ~0.8 cpp CAD (direct hotel), higher via strategic use. Earned via Amex Bonvoy cards in Canada. Both personal ($120 AF) and business ($150 AF) cards provide an **Annual Free Night Award worth 35,000 points** (top-uppable to 50,000). Two cards = two free nights annually for $270 in fees.

**Transfer to airlines**: 3:1 base ratio. **Always transfer in multiples of 60,000** for the 5K bonus (60K Bonvoy = 25K airline miles). 38+ airline partners including Aeroplan, United, BA, Singapore, ANA, Emirates. United gets a special 2:1 ratio.

**5th Night Free**: On 5+ consecutive point nights, the 5th night is free (pay for 4). Does not work with Free Night Certificates.

---

## Key strategies and patterns

### Optimal churning cadence

| Issuer | Cooldown Rule | Recommendation |
|--------|--------------|----------------|
| Amex | Once per lifetime per product (~7yr reset) | Cycle through all unique products |
| TD | 12 months per product (6 months for FCT from close date) | PS every 6 months between families |
| CIBC | No official cooldown | Apply freely; use migration offers |
| RBC | 1 application per 90 days | Space 90+ days apart |
| BMO | No firm rule | Apply as desired |
| Scotiabank | 2-year rule (partially enforced) | Wait 24 months between cards |
| Aeroplan | Once per tier, per lifetime, across issuers | Max 5 Aeroplan card bonuses ever |

**Beginners**: 2–4 new cards per year. **Experienced churners**: 5–10+ cards per year across P1/P2.

### Product switch vs. cancel and reapply

Product switching **preserves the account open date** (helping AAoA), avoids a hard pull, and is guaranteed to process. It's best for downgrades (avoiding AF) and when exploring the same bank's lineup without new inquiries. Cancel and reapply is better when an elevated public offer exists, when a GCR rebate is available, or when the cooldown period has passed and you want the full welcome bonus.

**Minimum credit limits for PS**: Visa Infinite requires $5,000; Visa Infinite Privilege requires $10,000.

### Household strategies (P1/P2)

A dedicated P1/P2 household can earn **250,000+ Aeroplan points per year** — enough for roundtrip business class anywhere in the world. Core strategies:

- **Maximize Amex cross-referrals**: P1 refers P2 (or vice versa) from highest-value referring card
- **Coordinate application timing**: Stagger applications so one person is always meeting MSR
- **Pool points**: Aeroplan Family Sharing pools points within a household
- **Split large expenses**: Major purchases across both players' cards for meeting multiple MSRs
- **Higher threshold for P2/P3**: Only apply for the best offers through secondary players

### Meeting minimum spend efficiently

- **Chexy** (preferred): Pay rent, taxes, bills via credit card at **1.75% fee** (Visa/Amex only). Example: $2,000/month rent × 3 months = $6,000 toward MSR for $105 in fees.
- **Plastiq**: 2.85–2.99% fee, accepts Mastercard. Filed Chapter 11 in May 2023, since resumed.
- **PaySimply**: 2.5% fee, specifically for CRA taxes and municipal payments.
- **Prepay bills**: Overpay phone/internet/insurance for several months.
- **Gift cards at grocery stores**: Buy retailer gift cards at grocery stores to earn multiplied points (especially with Cobalt's 5x or Scotia Gold's 6x).
- **Time major expenses**: Align card applications with weddings, renovations, tuition, moving costs.

### Managing credit score impact

Five core tactics: (1) Space applications 30+ days apart, (2) leverage product switches for no hard pull, (3) batch same-bank applications where possible (CIBC, Amex), (4) keep oldest cards open to preserve AAoA, (5) monitor both bureaus via **Borrowell** (Equifax) and **Credit Karma** (TransUnion).

---

## Data model considerations for a churning management app

### Core entities and their attributes

**Card (credit card product definition)**
- `card_id` (unique identifier)
- `card_name` (e.g., "TD Aeroplan Visa Infinite")
- `issuer_id` (FK to Issuer)
- `rewards_program_id` (FK to RewardsProgram)
- `card_type` (credit_card | charge_card)
- `network` (Visa | Mastercard | Amex)
- `annual_fee` (decimal, in CAD)
- `monthly_fee` (decimal, nullable — for Cobalt-style cards)
- `income_requirement_personal` (integer, nullable)
- `income_requirement_household` (integer, nullable)
- `credit_limit_minimum` (integer — e.g., $5,000 for Visa Infinite)
- `card_tier` (for Aeroplan: Entry | Core | Premium | Core_Business | Premium_Business; null for non-Aeroplan)
- `earn_rates` (JSON — category-based earn rates)
- `is_discontinued` (boolean)
- `key_benefits` (text — lounge access, insurance, etc.)

**Issuer**
- `issuer_id`
- `issuer_name` (e.g., "American Express", "TD Bank", "CIBC")
- `credit_bureau_primary` (Equifax | TransUnion)
- `credit_bureau_secondary` (nullable)
- `cooldown_rule_description` (text — human-readable rule)
- `cooldown_days` (integer, nullable — e.g., 90 for RBC)
- `max_cards_simultaneous` (integer, nullable — e.g., 4 for Amex credit cards)
- `product_switch_supported` (boolean)
- `product_switch_method` (phone | online | both | none)
- `product_switch_phone_number` (string, nullable)
- `anti_churning_notes` (text)

**CardApplication (a specific instance of a user applying for/holding a card)**
- `application_id`
- `user_id` (FK — P1 or P2)
- `card_id` (FK)
- `application_date` (date)
- `approval_date` (date, nullable)
- `approval_status` (approved | denied | pending)
- `credit_limit_approved` (integer, nullable)
- `annual_fee_amount` (decimal — actual fee charged, may differ from standard if FYF)
- `is_first_year_free` (boolean)
- `annual_fee_date` (date — when AF renews)
- `minimum_spend_amount` (decimal)
- `minimum_spend_deadline` (date)
- `minimum_spend_met` (boolean)
- `minimum_spend_met_date` (date, nullable)
- `welcome_bonus_amount` (integer — points/miles earned)
- `welcome_bonus_currency` (FK to RewardsProgram)
- `welcome_bonus_received` (boolean)
- `welcome_bonus_received_date` (date, nullable)
- `referral_source` (self | P2 | friend | none)
- `referral_bonus_amount` (integer, nullable — points earned by referrer)
- `gcr_rebate_claimed` (boolean)
- `gcr_rebate_amount` (decimal, nullable)
- `gcr_rebate_portal` (GCR | FlyerFunds | CCG | none)
- `gcr_holdback_end_date` (date, nullable — ~60 days after rebate posts)
- `credit_bureau_pulled` (Equifax | TransUnion | both | soft_pull)
- `card_status` (active | cancelled | product_switched)
- `cancel_date` (date, nullable)
- `product_switch_date` (date, nullable)
- `product_switched_to_card_id` (FK, nullable)
- `notes` (text)

**User (churner profile — P1 and P2)**
- `user_id`
- `name`
- `player_designation` (P1 | P2 | P3)
- `household_id` (FK — links P1/P2 together)
- `personal_income` (integer)
- `household_income` (integer)
- `equifax_score` (integer, nullable)
- `transunion_score` (integer, nullable)
- `score_last_updated` (date)

**RewardsProgram**
- `program_id`
- `program_name` (e.g., "Aeroplan", "Amex MR", "Scene+")
- `program_type` (transferable_currency | airline_miles | hotel_points | fixed_value | cashback)
- `point_valuation_cpp` (decimal — cents per point benchmark, e.g., 2.5 for Aeroplan)
- `points_expire` (boolean)
- `expiry_rules` (text, nullable)

**TransferPartner**
- `transfer_id`
- `source_program_id` (FK — e.g., Amex MR)
- `destination_program_id` (FK — e.g., Aeroplan)
- `transfer_ratio_source` (integer — e.g., 1)
- `transfer_ratio_destination` (integer — e.g., 1)
- `transfer_speed` (instant | 1-2_days | up_to_48_hours)
- `periodic_bonus_typical` (text, nullable — e.g., "30% bonus 1-2x/year")

**PointsBalance (current balance tracking per program per user)**
- `balance_id`
- `user_id` (FK)
- `program_id` (FK)
- `current_balance` (integer)
- `last_updated` (date)

**BonusEligibility (tracks whether a user is eligible for a specific card's bonus)**
- `eligibility_id`
- `user_id` (FK)
- `card_id` (FK)
- `is_eligible` (boolean)
- `reason_ineligible` (text, nullable — e.g., "Held within 12 months", "Aeroplan Core tier used")
- `cooldown_end_date` (date, nullable)
- `last_held_date` (date, nullable)
- `aeroplan_tier_used` (boolean, nullable — for Aeroplan cross-issuer tracking)

### Key date-driven reminders the app should generate

| Reminder Type | Trigger | Priority |
|--------------|---------|----------|
| **Minimum spend deadline approaching** | 14 days, 7 days, 3 days before MSR deadline | Critical |
| **Annual fee renewal approaching** | 30 days before AF date — decide: keep, cancel, or PS | High |
| **GCR holdback ending** | When safe to cancel without losing cashback (~90 days) | Medium |
| **Cooldown period ending** | When eligible to reapply at a specific issuer | Medium |
| **12-month card anniversary** | Minimum hold period to avoid Amex clawback | High |
| **Product switch window** | 6 months after last PS (TD) or 90 days (RBC) | Medium |
| **Transfer bonus alert** | When a periodic transfer bonus is active (e.g., 30% Avion→Avios) | High |
| **Companion voucher expiry** | WestJet voucher approaching expiration | Medium |
| **Free night certificate expiry** | Marriott Bonvoy FNA approaching 12-month expiry | Medium |
| **Credit score check** | Monthly reminder to check both bureaus | Low |
| **Welcome bonus second tranche** | Cards with month 13/15 bonuses (Amex Platinum, Bonvoy) | High |

### Entity relationship summary

```
Household (1) ──── has many ───→ Users/Players (P1, P2, P3)
User (1) ──── has many ───→ CardApplications
User (1) ──── has many ───→ PointsBalances
CardApplication (1) ──── references ───→ Card (1)
Card (1) ──── belongs to ───→ Issuer (1)
Card (1) ──── earns into ───→ RewardsProgram (1)
RewardsProgram (1) ──── has many ───→ TransferPartners
User (1) ──── has many ───→ BonusEligibilities
BonusEligibility (1) ──── references ───→ Card (1)
CardApplication ──── can PS to ───→ CardApplication (self-referential)
```

### Derived/computed fields the app should calculate

- **Net cost of a churn**: AF (minus FYF savings) minus GCR rebate minus value of welcome bonus
- **Current MSR progress**: Sum of spend on card vs. MSR target, with days remaining
- **Annualized points earning rate**: Total points earned across all active cards per month/year
- **Credit bureau inquiry count**: Count of hard pulls per bureau in last 6/12 months
- **Issuer-specific cooldown status**: Whether each card at each issuer is within cooldown
- **Aeroplan tier usage tracker**: Which of the 5 Aeroplan tiers have been used by each player
- **Amex credit card count**: Current count vs. maximum 4 credit cards (charge cards excluded)
- **Household total points by program**: Aggregated across P1/P2 balances
- **Upcoming AF liability**: Sum of all annual fees due in next 30/60/90 days
- **ROI per card**: (Points value + GCR rebate + referral bonus value − AF − MS fees) per card

### Suggested seed data priorities

The app should ship with pre-populated reference data for:
1. All current card products from the 8+ issuers documented above, with current welcome bonuses, AFs, MSRs, and earn rates
2. Issuer rules (cooldown periods, credit bureau, max cards, PS support)
3. All rewards programs with point valuations and transfer partner maps
4. Aeroplan 5-tier card classification
5. Amex charge vs. credit card classification (for the 4-card limit)

This data will need a mechanism for periodic updates, as welcome bonuses change frequently (often quarterly) and program rules evolve. Consider integrating with community sources like the r/churningcanada "Best Current Offers" thread or Prince of Travel card pages for update triggers.

---

## Recent shifts reshaping the Canadian churning landscape

Several developments from 2024–2026 are fundamentally changing Canadian churning strategy. **Aeroplan's cross-issuer 5-tier lifetime rule** (February 2024) eliminated the most lucrative Aeroplan churning path — cycling the same tier card across TD and CIBC. **Amex's tightening enforcement** of once-per-lifetime rules and crackdown on self-referrals has reduced the total MR earning potential per person. **Prince of Travel's Ricky Zhang** has publicly stated he no longer enthusiastically recommends the traditional cancel-and-reapply approach, citing increasing restrictions. Product switch bonuses at RBC and other banks have become more "YMMV." The MBNA Alaska Airlines card's discontinuation removed one of the easiest churning targets. Meanwhile, **BMO's Blue Rewards replacing Air Miles** in Summer 2026 will create an entirely new program to evaluate. Bill payment via **Chexy** at 1.75% has emerged as the dominant minimum-spend strategy after older methods (PayTM, various PBP routes) were shut down. The overall trend is clear: issuers are tightening rules, making **tracking, timing, and strategic planning** — exactly what a churning management app enables — more valuable than ever.