# Financial Tracker System - Consolidated Specification

## 1. Overview

A comprehensive personal financial tracking system that integrates manual transaction entry, credit card churning management, and bulk CSV import capabilities. The system runs locally on a single user's machine with no deployment requirements, featuring a web interface for complete financial management.

**Currency:** CAD  
**User Base:** Single user (local machine)  
**Authentication:** None required (local deployment)  
**Integration:** Unified system combining transaction tracking, credit card optimization, and bulk data import

---

## 2. System Architecture

### Core Components

1. **Financial Tracker Core** - Manual transaction entry, budget management, and expense tracking
2. **Credit Card Churning System** - Comprehensive credit card management with signup bonuses and points optimization
3. **CSV Import System** - Bulk transaction import with intelligent mapping and duplicate detection
4. **Amount-Based Mapping Enhancement** - Advanced transaction categorization using both description and amount patterns

### Integration Points

- All components share the same PostgreSQL database with `ft_` namespace
- Unified transaction model supports all entry methods (Web, CSV)
- Shared master data (vendors, purchase types, earning categories) across all components
- Consistent points calculation and signup bonus tracking

---

## 3. User Stories

### Manual Transaction Entry

- As a user, I want to enter and manage transactions from a web application so that I can handle transaction entry through my computer
- As a user, I want to view a dashboard for the month, so that I can check my spending against my budget
- As a user, I want to maintain a list of recurrent purchases (e.g., rent, loans, investments, savings), so that I can budget effectively
- As a user, I want to maintain a list of planned expenses (e.g., trips, gifts), so that I can budget effectively, including yearly recurrent planned expenses
- As a user, I want the system to generate a monthly budget that takes expected income, subtracts recurrent + planned expenses, to get a discretionary budget
- As a user, I want the generated discretionary budget to be split into specific purchase types based on user-defined ratios (totaling 100%), so that I get a discretionary budget per category

### Credit Card Churning Management

- As a user, I want a dedicated churning dashboard (Churnboard) so that I have a central point to view all high-level churning metrics
- As a user, I want to see net value for the year (points earned + redemptions - fees) prominently displayed so that I know my overall profitability
- As a user, I want to see signup bonus progress automatically calculated so that I know where I stand without manual tracking
- As a user, I want to maintain earning multipliers per credit card so that transactions automatically calculate points earned
- As a user, I want cards to automatically transition from Focus to Active when signup bonuses complete
- As a user, I want to maintain redemptions per card so that I track realized value (rebates, statement credits, etc.)

### Bulk CSV Import

- As a user, I want to import historical transactions from CSV files so that I can bulk load months or years of data
- As a user, I want the system to automatically map CSV descriptions to vendors and categories so that future imports require less manual work
- As a user, I want to review transactions in organized tabs (New, Reconciliation, Duplicates, Excluded) so that I can efficiently process different scenarios
- As a user, I want to create vendors, purchase types, and earning categories on-the-fly during import so that I don't have to leave the import screen
- As a user, I want the system to learn from my categorization decisions so that future imports are more accurate

### Advanced Mapping

- As a user, I want the system to learn fixed-amount patterns automatically so that recurring subscriptions are categorized correctly
- As a user, I want the system to distinguish between different transaction types at the same vendor based on amount so that Netflix subscriptions vs gift cards are categorized differently

---

## 4. Core Concepts & Budget Logic

### Budget Calculation Formula

```
Monthly Income (varies by month)
- Recurrent Expenses (monthly: rent, loans, investments, savings)
- Planned Expenses (yearly expenses, trips, gifts allocated to specific months)
= Total Discretionary Budget

Total Discretionary Budget
× Purchase Type Ratios (must total 100%)
= Per-Category Discretionary Budgets
```

### Credit Card Churning Philosophy

Credit card churning is the practice of opening and closing credit cards strategically to maximize value through:

- **Sign-up bonuses:** Meeting minimum spending requirements to earn large point bonuses
- **Earning multipliers:** Using the right card for each purchase category to maximize points
- **Soft perks:** Leveraging annual benefits like lounge passes, credits, and rebates
- **Application rebates:** Earning cash back from referral programs when applying

### Key Terminology

- **CPP (Cents Per Point):** Redemption value of points/miles (e.g., 2 CPP = each point worth 2 cents)
- **FYF (First Year Free):** Annual fee waived in first year
- **Market Card:** A credit card product available on the market
- **Sandro's Card:** A personal instance of a credit card that you own
- **Supplementary Card:** Additional card under a main credit card account
- **Earning Category:** Spending category with specific point multipliers (e.g., Food & Drinks 5x)
- **Realized Value:** Actual value received from a card (points + redemptions - fees)

---

## 5. Data Model

### Master Data Tables

#### 5.1 Vendors

Table: `ft_vendors`

- `id` (Primary Key)
- `name` (String, unique)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

#### 5.2 Purchase Types

Table: `ft_purchase_types`

- `id` (Primary Key)
- `name` (String, unique)
- `budget_ratio` (Decimal - percentage, sum must equal 100 for eligible types)
- `budget_eligible` (Boolean - whether included in discretionary budget split)
- `is_deleted` (Boolean - soft delete flag)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

#### 5.3 Purchase Subtypes

Table: `ft_purchase_subtypes`

- `id` (Primary Key)
- `name` (String, unique per purchase type)
- `purchase_type_id` (Foreign Key → ft_purchase_types)
- `is_deleted` (Boolean - soft delete flag)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

**Special Subtypes:**

- "Card Fee" subtype under "Subscriptions" purchase type (system-protected, cannot be deleted)

#### 5.4 Recurrent Expenses

Table: `ft_recurrent_expenses`

- `id` (Primary Key)
- `name` (String)
- `amount` (Decimal)
- `is_deleted` (Boolean - soft delete flag)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

#### 5.5 Planned Expenses

Table: `ft_planned_expenses`

- `id` (Primary Key)
- `name` (String)
- `planned_amount` (Decimal)
- `start_date` (Date - Start of planned expense period)
- `end_date` (Date - End of planned expense period)
- `is_yearly_recurrent` (Boolean)
- `is_deleted` (Boolean - soft delete flag)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

**Business Logic:**

- **Single day expenses:** `start_date` = `end_date`
- **Date range expenses:** `end_date` > `start_date`
- **Transaction matching:** If transaction date falls between `start_date` and `end_date` (inclusive), suggest this planned expense
- **Priority:** If multiple planned expenses match, prioritize single-day over ranges

### Credit Card Churning Tables

#### 5.6 Rewards Programs

Table: `ft_rewards_programs`

- `id` (Primary Key)
- `name` (String, unique) - e.g., "Amex MR", "TD Rewards"
- `provider` (String) - e.g., "Amex", "TD"
- `cpp_value` (Decimal) - Current cents per point value (e.g., 2.0, 0.5)
- `is_deleted` (Boolean - soft delete flag)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

#### 5.7 Earning Categories

Table: `ft_earning_categories`

- `id` (Primary Key)
- `name` (String, unique) - e.g., "Food & Drinks", "Streaming", "Gas/Transit/Rideshare", "General"
- `purchase_type_id` (Foreign Key → ft_purchase_types, nullable) - Optional link to auto-fill earning category
- `is_base_category` (Boolean) - True for "General" category (cannot be deleted)
- `is_deleted` (Boolean - soft delete flag)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

**Special Rules:**

- One category (typically "General") must have `is_base_category = true`
- Base category cannot be deleted
- All cards must have a multiplier for the base category (defaults to 1x)

#### 5.8 Redemption Types

Table: `ft_redemption_types`

- `id` (Primary Key)
- `name` (String, unique) - e.g., "Application Rebate", "Referral Bonus", "Statement Credit", "Points Redemption"
- `is_deleted` (Boolean - soft delete flag)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

#### 5.9 Market Credit Cards

Table: `ft_market_credit_cards`

- `id` (Primary Key)
- `issuer` (String) - e.g., "Amex", "TD", "CIBC"
- `card_name` (String) - e.g., "Cobalt", "First Class Travel Infinite Privilege"
- `card_type` (Enum: Visa, Mastercard, Amex)
- `annual_fee` (Decimal, nullable)
- `monthly_fee` (Decimal, nullable)
- `rewards_program_id` (Foreign Key → Rewards Programs)
- `offer_expiry_date` (Date, nullable) - When current offer expires
- `is_deleted` (Boolean - soft delete flag)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

**Validation:**

- `issuer` + `card_name` combination must be unique
- Cannot have both `annual_fee` and `monthly_fee` (one or the other)

#### 5.10 Sandro's Credit Cards

Table: `ft_sandro_credit_cards`

- `id` (Primary Key)
- `market_card_id` (Foreign Key → Market Credit Cards)
- `offer_id` (Foreign Key → Market Card Offers) - Which offer signed up for
- `activation_date` (Date)
- `credit_limit` (Decimal, nullable)
- `status` (Enum: Active, Focus, To Cancel, Closed)
- `tentative_cancel_date` (Date, nullable)
- `annual_fee` (Decimal, nullable) - Copied from market card, editable
- `monthly_fee` (Decimal, nullable)
- `first_fee_date` (Date) - First fee charge date, used to calculate future fees
- `parent_card_id` (Foreign Key → Sandro's Credit Cards, nullable) - Null for main cards, set for supplementary cards
- `cardholder_name` (String, nullable) - For supplementary cards
- `is_deleted` (Boolean - soft delete flag)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

**Business Rules:**

- Main cards: `parent_card_id = null`
- Supplementary cards: `parent_card_id` points to main card
- Supplementary cards do not have `credit_limit`
- When status = "Closed", do not show in transaction entry dropdowns

**Earning Multiplier Inheritance:**

- **Main cards** (`parent_card_id IS NULL`): Automatically inherit all earning multipliers from the associated market card upon creation. If multipliers are explicitly provided during creation, those are used instead.
- **Supplementary cards** (`parent_card_id IS NOT NULL`): Automatically inherit all earning multipliers from their parent card upon creation. If multipliers are explicitly provided during creation, those are used instead.
- Multipliers can be modified after card creation through the card management interface.
- If a source (market card for main cards, parent card for supplementary) has no multipliers, the new card will be created without multipliers (warning logged).

### Transactional Data Tables

#### 5.11 Income

Table: `ft_income`

- `id` (Primary Key)
- `month` (Date - YYYY-MM-01 format)
- `amount` (Decimal)
- `source` (Enum: Income, Bonus, Churn Reward, Other)
- `entry_method` (Enum: Web, CSV)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

#### 5.12 Transactions

Table: `ft_transactions`

- `id` (Primary Key)
- `transaction_date` (Date)
- `vendor_id` (Foreign Key → ft_vendors)
- `amount` (Decimal)
- `purchase_type_id` (Foreign Key → ft_purchase_types)
- `purchase_subtype_id` (Foreign Key → ft_purchase_subtypes, nullable)
- `charge_type` (Enum: Cash, Credit Card)
- `credit_card_id` (Foreign Key → ft_sandro_credit_cards, nullable)
- `planned_expense_id` (Foreign Key → ft_planned_expenses, nullable)
- `earning_category_id` (Foreign Key → ft_earning_categories, nullable)
- `points_earned` (Decimal, nullable) - Calculated and stored: `amount × card_multiplier`
- `cpp_value_snapshot` (Decimal, nullable)
- `notes` (Text, nullable)
- `entry_method` (Enum: Web, CSV)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

**Business Logic:**

- When `charge_type = "Cash"`: `earning_category_id = null`, `points_earned = null`
- When `charge_type = "Credit Card"`: `earning_category_id` required
- Points calculation: Look up card → get multiplier for earning category → `points_earned = amount × multiplier`
- Auto-fill `earning_category_id` based on `purchase_type_id → earning_category` mapping (if exists), else default to card's base category
- User can override auto-filled earning category
- Supplementary card transactions count toward parent card's signup bonus progress

### CSV Import Tables

#### 5.13 CSV Format Configurations

Table: `ft_csv_format_configs`

- `id` (Primary Key)
- `issuer` (String) - e.g., "Amex", "CIBC", "TD"
- `date_column_name` (String) - Expected column name for transaction date
- `date_format_pattern` (String) - Date parsing pattern (e.g., "DD MMM. YYYY")
- `description_column_name` (String) - Merchant/description column
- `amount_column_name` (String) - Transaction amount column
- `cardmember_column_name` (String, nullable) - Cardholder name column (for supp cards)
- `posting_date_column_name` (String, nullable) - Posting date column (not used, but tracked)
- `foreign_amount_column_name` (String, nullable) - Foreign currency amount column
- `is_active` (Boolean) - Whether this config is currently used
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

#### 5.14 Mapping Tables

**Transaction Description to Vendor Mappings**
Table: `ft_description_vendor_mappings`

- `id` (Primary Key)
- `transaction_description` (String) - Raw CSV description text
- `vendor_id` (Foreign Key → ft_vendors)
- `amount` (Decimal, nullable) - Amount-based matching
- `times_used` (Integer) - Tracking frequency for confidence
- `last_used_at` (Timestamp)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

**Transaction Description to Purchase Type Mappings**
Table: `ft_description_purchase_type_mappings`

- `id` (Primary Key)
- `transaction_description` (String)
- `purchase_type_id` (Foreign Key → ft_purchase_types)
- `amount` (Decimal, nullable) - Amount-based matching
- `times_used` (Integer)
- `last_used_at` (Timestamp)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

**Transaction Description to Purchase Subtype Mappings**
Table: `ft_description_purchase_subtype_mappings`

- `id` (Primary Key)
- `transaction_description` (String)
- `purchase_subtype_id` (Foreign Key → ft_purchase_subtypes)
- `amount` (Decimal, nullable) - Amount-based matching
- `times_used` (Integer)
- `last_used_at` (Timestamp)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

**Transaction Description to Earning Category Mappings**
Table: `ft_description_earning_category_mappings`

- `id` (Primary Key)
- `transaction_description` (String)
- `rewards_program_id` (Foreign Key → ft_rewards_programs)
- `vendor_id` (Foreign Key → ft_vendors, nullable)
- `earning_category_id` (Foreign Key → ft_earning_categories)
- `amount` (Decimal, nullable) - Amount-based matching
- `times_used` (Integer)
- `last_used_at` (Timestamp)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

**Composite Index:** `(transaction_description, rewards_program_id, vendor_id)`

### Credit Card Churning Detail Tables

#### 5.15 Market Card Offers

Table: `ft_market_card_offers`

- `id` (Primary Key)
- `market_card_id` (Foreign Key → Market Credit Cards)
- `start_date` (Date)
- `end_date` (Date, nullable) - Null for current offer
- `is_fyf` (Boolean) - First Year Free flag
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

#### 5.16 Market Card Offer Tiers

Table: `ft_market_card_offer_tiers`

- `id` (Primary Key)
- `offer_id` (Foreign Key → Market Card Offers)
- `points_amount` (Integer) - Points/miles for this tier
- `spending_requirement` (Decimal) - Spending needed (can be 0 for "first purchase")
- `days_to_complete` (Integer) - Time period for this tier
- `tier_order` (Integer) - Display order
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

#### 5.17 Sandro's Card Signup Bonus Tiers

Table: `ft_sandro_card_signup_bonus_tiers`

- `id` (Primary Key)
- `sandro_card_id` (Foreign Key → Sandro's Credit Cards)
- `points_amount` (Integer)
- `spending_requirement` (Decimal)
- `days_to_complete` (Integer)
- `tier_order` (Integer)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

**Computed Fields (for display):**

- `deadline_date`: `sandro_card.activation_date + days_to_complete`
- `current_spend`: Sum of transactions on this card between activation_date and deadline_date (including refundable expenses)
- `status`: Calculated based on:
  - "Completed": `current_spend >= spending_requirement`
  - "Expired": `deadline_date < today AND current_spend < spending_requirement`
  - "In Progress": `deadline_date >= today AND current_spend < spending_requirement`

#### 5.18 Sandro's Card Earning Multipliers

Table: `ft_sandro_card_earning_multipliers`

- `id` (Primary Key)
- `sandro_card_id` (Foreign Key → Sandro's Credit Cards)
- `earning_category_id` (Foreign Key → Earning Categories)
- `multiplier` (Decimal)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

#### 5.19 Sandro's Card Redemptions

Table: `ft_sandro_card_redemptions`

- `id` (Primary Key)
- `sandro_card_id` (Foreign Key → Sandro's Credit Cards)
- `redemption_type_id` (Foreign Key → Redemption Types)
- `redemption_date` (Date)
- `description` (Text)
- `amount` (Decimal) - Dollar value
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

---

## 6. Functional Requirements

### 6.1 Transaction Entry (Web)

**Features:**

- Single transaction entry form
- Full CRUD operations (Create, Read, Update, Delete)
- Vendor fuzzy matching for preventing duplicates
- Date picker (allow future dates)
- Dropdown selections for Purchase Types, Charge Types, Cards, Planned Expenses
- Optional notes field

**Vendor Fuzzy Matching:**

- Accept free text input
- Check for exact match first
- If no exact match, perform fuzzy search
- Show highest scoring match for confirmation
- If confirmed, use existing vendor
- If not confirmed, validate new vendor name against fuzziness threshold
- If too similar to existing (e.g., "Ubereats" vs "UberEATS"), ask user to confirm it's different
- Create new vendor with user confirmation

### 6.2 CSV Import Workflow

#### Step 1: Upload Page

**UI Elements:**

1. **Card Selection:**
   - Dropdown: "Select card to import for"
   - Shows all Sandro's Credit Cards (main + supplementary)
   - Required field

2. **File Upload:**
   - File input: Accept `.csv` files only
   - Drag-and-drop support
   - "Upload & Process" button

3. **Year Specification (Conditional):**
   - If CSV date format lacks year (e.g., TD "MAY 27"), prompt user:
   - Input: "Specify year for these transactions"
   - Defaults to current year

#### Step 2: CSV Processing (Backend)

**Processing Steps:**

1. **Column Detection:**
   - Lookup card's issuer from selected Sandro's card → market card → issuer
   - Retrieve CSV format config for issuer
   - Attempt to map CSV columns to expected columns
   - If columns don't match exactly, use smart detection

2. **Row Parsing:**
   - Parse each CSV row
   - Extract: transaction_date, description, amount, cardmember (if applicable)
   - Apply year if specified by user
   - Skip header rows

3. **Filtering & Exclusion:**
   - **Exclude all negative amounts:**
     - Payments (e.g., "PAYMENT RECEIVED")
     - Credits
     - Refunds
     - Annual fee rebates
   - **Match refund pairs:**
     - For each negative transaction, find positive transaction where:
       - Fuzzy match on description (≥70% similarity)
       - Within 14 days (before or after)
       - Amount matches (exact or within threshold)
     - If match found, exclude BOTH transactions (original + refund)

4. **Vendor Mapping:**
   - **Step 1:** Check `ft_description_vendor_mappings` for exact match (with amount)
   - **Step 2:** If no mapping, fuzzy search `ft_vendors`:
     - Score ≥90%: Auto-accept vendor match
     - Score 70-89%: Mark as "suggested vendor" (needs user review)
     - Score <70%: Mark as "no match" (needs user input)

5. **Purchase Type Mapping:**
   - Check `ft_description_purchase_type_mappings` for exact description + amount match
   - If found: Use mapped purchase_type_id
   - If not found: Leave null (user must select)

6. **Earning Category Mapping:**
   - Get rewards_program_id from selected card
   - Check `ft_description_earning_category_mappings` where:
     - transaction_description matches
     - rewards_program_id matches
     - vendor_id matches (if vendor was mapped)
     - amount matches (if available)
   - If found: Use mapped earning_category_id
   - If not found: Default to card's base earning category

7. **Duplicate Detection:**
   - For each transaction, query `ft_transactions` where:
     - vendor_id matches (if vendor was mapped)
     - transaction_date matches exactly
     - credit_card_id matches (card or its parent)
     - amount matches within threshold
   - **Categorize based on match:**
     - **Duplicate:** All fields match
     - **Reconciliation:** Vendor + date match, but amount/category differs
     - **New:** No match found

#### Step 3: Review Screen (Frontend)

**Layout:**

- Tabs: New Transactions | Reconciliation | Duplicates | Excluded
- Badge showing count on each tab
- Progress indicator: "X of Y transactions cleared"
- "Save All" button (disabled until all tabs cleared)

**Tab 1: New Transactions**

- Table with columns: Clear checkbox, Date, Description, Vendor, Amount, Purchase Type, Purchase Subtype, Earning Category, Planned Expense, Points Earned, Actions
- Pagination: 10 per page
- Sorting: Click column headers
- Filtering: Search box filters across all fields
- Inline editing for all fields
- Vendor selection modal with fuzzy match suggestions

**Tab 2: Reconciliation**

- Side-by-side comparison of CSV vs DB data
- Action radio buttons: Skip | Update Existing
- Highlight fields that differ between CSV and DB
- Default action: "Skip" (no changes)

**Tab 3: Duplicates**

- Read-only by default (exact matches, will be skipped)
- "Move to New" button if user determines it's not actually a duplicate

**Tab 4: Excluded**

- Show exclusion reason (Payment, Credit, Refund Pair, etc.)
- "Edit" button to make row editable
- "Move to New" button to move edited transaction to New Transactions tab

### 6.3 Credit Card Management

#### Market Credit Cards Management

**List View:**

- Columns: Issuer, Card Name, Card Type, Rewards Program, Current Signup Bonus Value, Rebate/Referral Total, Annual/Monthly Fee, Offer Expiry Date
- Sortable, filterable, searchable by all columns
- Click row → navigate to detail page

**Detail Page (Tabs):**

1. **Overview:** Basic card information, fees, offer expiry
2. **Current Offer:** Signup bonus tiers, FYF flag, rebates/referrals
3. **Earning & Perks:** Earning multipliers table, soft perks table
4. **Offer History:** Line graph over time with drill-down popover
5. **My Cards:** List of Sandro's Cards based on this Market Card

#### Sandro's Credit Cards Management

**List View:**

- Columns: Issuer, Card Name, Card Type, Status, Activation Date, Credit Limit, Next Fee Date
- Filter by status (Active, Focus, To Cancel, Closed)
- Click row → navigate to detail page

**Main Card Detail Page (Tabs):**

1. **Overview:** Market card reference, offer details, activation info, status, fees
2. **Signup Bonuses:** Bonus tiers with progress tracking and status calculation
3. **Earning & Perks:** Multipliers and perks (editable for this instance)
4. **Redemptions:** Redemption history with CRUD operations
5. **Fee Payments:** Fee payment history (now tracked via transactions with "Card Fee" subtype)
6. **Supplementary Cards:** List of supplementary cards
7. **Analytics:** Spend vs value graphs, points earned over time

### 6.4 Churnboard (Dashboard)

**Year Selector:**

- Current year + 3 years back
- Default: Current year

**Cards/Sections:**

1. **Net Value for Year** (Prominent hero card)
   - Large number: (Total Points Earned in $ + Total Redemptions) - Total Fees Paid
   - Color-coded: Green if positive, Red if negative

2. **CC Spend in Current Month**
   - Month navigation (within selected year)
   - Pie chart: Spend by card (%)
   - Bar chart: Spend by card ($)

3. **Next Fees**
   - Split into Monthly Fees and Annual Fees tables
   - Columns: Card Name, Fee Amount, Next 3 Dates
   - Calculated from transaction patterns (Card Fee subtype)

4. **Realized Value vs Fees per Card (Current Year)**
   - Table with columns: Card Name, Total Fees Paid, Points Earned ($), Redemptions ($), Net Value
   - Color-coded Net Value: Green if positive, Red if negative

5. **Focus Cards Signup Bonus Progress**
   - Only shows cards with status = "Focus"
   - Each bonus tier with progress bars and status

6. **Reward Performance (Current Year)**
   - Formula: (Points Earned $ + Redemptions) / Total CC Expenditure × 100 = Percentage
   - Monthly trend graph

### 6.5 Monthly Dashboard (Financial Tracker)

**Key Metrics:**

1. **Budget Overview:**
   - Total Income for the month
   - Total Recurrent Expenses
   - Total Planned Expenses
   - Total Discretionary Budget Available
   - Remaining Discretionary Budget (show in red if negative)

2. **Spending by Purchase Type:**
   - For each budget-eligible purchase type:
     - Budget allocated (based on ratio)
     - Amount spent
     - Remaining (green if under, red if over)

3. **Credit Card Spend:**
   - Total spend per credit card for the month

4. **Top 5 Vendors:**
   - Highest spend by vendor for the month

5. **Alerts:**
   - Credit cards with tentative cancel date within 1 month

---

## 7. Business Rules & Validations

### 7.1 Transactions

- Future-dated transactions allowed
- Large transaction warning (threshold: $500 CAD)
- Refundable expenses:
  - Do NOT count against budget
  - Do NOT appear in discretionary calculations
  - Tracked for credit card spend visibility only
- Points calculation for credit card transactions (based on earning category multipliers)
- Purchase subtypes provide granular categorization within purchase types

### 7.2 Credit Cards

- Status options: Active, Closed, Focus, To Cancel
- If status = "To Cancel" and tentative_cancel_date is set:
  - Show alert on dashboard 1 month before
- Fee can be monthly OR annual (not both)
- Integration with signup bonus tracking and earning multipliers
- Supplementary cards inherit parent card properties
  - Earning multipliers are automatically copied from parent card upon creation
  - Main cards automatically inherit earning multipliers from market card upon creation

### 7.3 Signup Bonuses

**Spending Calculation:**

- Includes ALL transactions (including refundable expenses) on the card
- Only count transactions between activation_date and deadline_date for each tier
- Spending is cumulative across all tiers
- Supplementary card spending counts separately for supp card bonuses
- Fee transactions (Card Fee subtype) excluded from signup bonus progress

**Status Calculation (Computed):**

- **Completed:** `current_spend >= spending_requirement` (regardless of deadline)
- **Expired:** `deadline_date < today AND current_spend < spending_requirement`
- **In Progress:** `deadline_date >= today AND current_spend < spending_requirement`

### 7.4 CSV Import Rules

**File Validation:**

- Must be .csv format
- Maximum file size: 10 MB
- Maximum rows: 10,000 per import

**Duplicate Detection:**

- Amount match threshold: Exact OR within $0.50 OR within 1% of amount
- vendor_id + transaction_date + amount (within threshold) + credit_card_id = duplicate check

**Refund Pair Matching:**

- Description fuzzy match ≥70%
- Within 14 days (before or after)
- Amount can differ (partial refunds)
- Both transactions excluded if matched

### 7.5 Amount-Based Mapping

**Two-Tier Matching Strategy:**

**Tier 1: Exact Match (Description + Amount)**

- Check mapping table for exact description AND amount match
- If found → High confidence match (source: `mapping_exact`)

**Tier 2: Description-Only Match (Fallback)**

- Check mapping table for description match only
- Priority: Mappings with specific amounts (more precise) > Most frequently used > Most recently used
- If found → Moderate confidence match (source: `mapping_description`)

**Backward Compatibility:**

- Existing mappings without amounts (amount = NULL) continue to work
- They will be used as fallbacks when no exact amount match exists

### 7.6 Purchase Types & Subtypes

- Budget ratios of budget-eligible types must total 100%
- Soft delete only (is_deleted flag) if historical transactions exist
- Names must be unique
- Purchase subtype names must be unique within the same purchase type
- Special subtype "Card Fee" under "Subscriptions" is system-protected

### 7.7 Vendors

- Names must be unique
- Fuzzy matching threshold to prevent near-duplicates
- Auto-created during transaction entry with user confirmation

---

## 8. Technical Requirements

### 8.1 Tech Stack

**Backend:**

- Node.js with Express.js
- PostgreSQL database
- RESTful API endpoints for all CRUD operations

**Frontend:**

- React (with Hooks)
- Bootstrap or similar UI library (Material-UI, Ant Design acceptable)
- React Router for navigation
- Chart library: Chart.js, Recharts, or Victory
- Axios for API calls

**Database:**

- PostgreSQL (existing instance)
- `ft_` prefix for all tables
- Migration scripts for schema changes

### 8.2 Database Naming Conventions

**Prefix:** `ft_` (financial tracker)

**Core Financial Tables:**

- `ft_vendors`
- `ft_purchase_types`
- `ft_purchase_subtypes`
- `ft_recurrent_expenses`
- `ft_planned_expenses`
- `ft_income`
- `ft_transactions`

**Credit Card Churning Tables:**

- `ft_rewards_programs`
- `ft_earning_categories`
- `ft_redemption_types`
- `ft_market_credit_cards`
- `ft_market_card_offers`
- `ft_market_card_offer_tiers`
- `ft_market_card_offer_rebates`
- `ft_market_card_earning_multipliers`
- `ft_market_card_soft_perks`
- `ft_sandro_credit_cards`
- `ft_sandro_card_signup_bonus_tiers`
- `ft_sandro_card_earning_multipliers`
- `ft_sandro_card_soft_perks`
- `ft_sandro_card_redemptions`

**CSV Import Tables:**

- `ft_csv_format_configs`
- `ft_description_vendor_mappings`
- `ft_description_purchase_type_mappings`
- `ft_description_purchase_subtype_mappings`
- `ft_description_earning_category_mappings`

### 8.3 API Endpoints Structure

**Core Financial:**

- `GET /api/transactions` - List transactions
- `POST /api/transactions` - Create transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction
- `GET /api/vendors` - List vendors
- `POST /api/vendors` - Create vendor
- `GET /api/purchase-types` - List purchase types
- `POST /api/purchase-types` - Create purchase type
- `GET /api/purchase-subtypes` - List purchase subtypes
- `POST /api/purchase-subtypes` - Create purchase subtype

**Credit Card Churning:**

- `GET /api/rewards-programs` - List rewards programs
- `GET /api/earning-categories` - List earning categories
- `GET /api/market-cards` - List market cards
- `GET /api/market-cards/:id` - Get market card details
- `GET /api/sandro-cards` - List Sandro's cards
- `GET /api/sandro-cards/:id` - Get Sandro's card details
- `GET /api/churnboard/net-value?year=2025` - Net value for year
- `GET /api/churnboard/monthly-spend?year=2025&month=10` - Spend by card for month
- `GET /api/churnboard/upcoming-fees` - Next fees
- `GET /api/churnboard/focus-cards-progress` - Focus cards with bonus progress

**CSV Import:**

- `POST /api/import/upload` - Upload CSV file, select card, start processing
- `POST /api/import/process/:sessionId` - Process CSV with confirmed column mapping
- `POST /api/import/save/:sessionId` - Save cleared transactions
- `POST /api/import/retry-failed/:sessionId` - Retry failed transactions after fixes
- `DELETE /api/import/cancel/:sessionId` - Cancel import session

### 8.4 Computed Fields & Calculations

**Performed on Backend:**

- Signup bonus status (Completed/In Progress/Expired)
- Signup bonus current spend (sum transactions)
- Points monetary value (points × CPP)
- Earning category yield % (multiplier × CPP)
- Next fee dates (calculate from transaction patterns)
- Realized value (points $ + redemptions - fees)
- Reward performance % ((points $ + redemptions) / total spend)

### 8.5 Performance Considerations

- Index foreign keys and frequently queried fields
- Cache CPP values for point calculations (refresh on Rewards Program update)
- Aggregate queries for dashboard metrics (consider materialized views if needed)
- Pagination for list views (default 50 items per page)
- Lazy load tabs on detail pages (fetch data when tab activated)
- Bulk insert transactions (batch INSERT statements)
- Use prepared statements for mapping table updates

---

## 9. UI/UX Requirements

### 9.1 Navigation Structure

**Main Navigation:**

- **Dashboards**
  - Financial Dashboard (existing)
  - Churnboard (new)
- **Transactions** (existing, enhanced)
- **Income** (existing)
- **Credit Cards** (new section)
  - My Cards
  - Market Cards
- **Import** (new section)
  - CSV Import
- **Master Data**
  - **Financial**
    - Purchase Types
    - Purchase Subtypes
    - Recurrent Expenses
    - Planned Expenses
    - Vendors
  - **Churning**
    - Rewards Programs
    - Earning Categories
    - Redemption Types
  - **System**
    - CSV Format Configs

### 9.2 Design Guidelines

**Visual Design:**

- Clean, modern UI using Bootstrap components
- Responsive design (desktop-first, mobile-friendly)
- Consistent color scheme:
  - Primary: Blue (actions, links)
  - Success: Green (positive values, under budget, completed)
  - Danger: Red (negative values, over budget, expired)
  - Warning: Yellow/Orange (warnings, approaching deadlines)
  - Info: Light blue (informational)
- Card-based layouts for dashboards
- Tabbed interfaces for detail pages

**Color Coding:**

- Green: Positive net value, signup bonus completed, under budget
- Red: Negative net value, signup bonus expired, over budget
- Yellow: Warnings, approaching deadlines
- Gray: Deleted items, inactive status

**Data Tables:**

- Sortable columns (click header, show sort direction icon)
- Filterable columns (click column menu → filter options)
- Searchable columns (click column menu → search input)
- Pagination (50 items per page default)
- Row hover effects
- Click row → navigate to detail (where applicable)

---

## 10. Implementation Phases

### Phase 1: Database & Backend Foundation

1. Create database migrations for all new tables
2. Add fields to existing tables (`ft_transactions`, `ft_planned_expenses`)
3. Build API endpoints for master data (Rewards Programs, Earning Categories, Redemption Types)
4. Build API endpoints for Market Credit Cards and Sandro's Credit Cards
5. Implement computed field logic (signup bonus status, points calculations, etc.)
6. Build Churnboard API endpoints with aggregation queries
7. Enhance transaction API to handle earning categories and points calculation

### Phase 2: Web UI - Master Data

1. Create Rewards Programs CRUD pages
2. Create Earning Categories CRUD pages (with Purchase Type linking)
3. Create Redemption Types CRUD pages
4. Create Purchase Subtypes CRUD pages
5. Update navigation structure (Master Data → Financial / Churning submenus)
6. Implement sortable/filterable/searchable tables component (reusable)

### Phase 3: Web UI - Credit Card Management

1. Create Market Cards list view and detail page with tabs
2. Create Sandro's Cards list view and detail page with tabs
3. Implement onboarding flows (main cards and supp cards)
4. Implement redemptions CRUD
5. Implement analytics graphs (spend vs value, points over time)
6. Create supplementary card detail page

### Phase 4: Web UI - Churnboard

1. Create Churnboard page layout
2. Implement year selector
3. Build all dashboard cards:
   - Net value for year
   - Monthly spend (pie + bar chart)
   - Next fees (two tables)
   - Realized value vs fees table
   - Focus cards progress
   - Reward performance (number + trend graph)

### Phase 5: CSV Import System

1. Create CSV upload endpoint with file handling
2. Build CSV parser with column detection (config-based + smart detection)
3. Implement filtering logic (negative amounts, refund pair matching)
4. Build vendor fuzzy matching service with tiered thresholds
5. Implement mapping table lookup services
6. Build duplicate detection logic
7. Create import review screen with tabs
8. Implement save endpoint with transaction creation/update

### Phase 6: Amount-Based Mapping Enhancement

1. Add amount columns to mapping tables
2. Implement two-tier matching strategy
3. Update mapping lookup services
4. Test backward compatibility

### Phase 7: Transaction Entry Enhancement

1. Update web transaction form to include earning category field
2. Implement auto-fill logic based on Purchase Type mapping
3. Implement points calculation display
4. Update transaction list view to show earning category and points
5. Test edit/delete impact on signup bonus progress

### Phase 8: Testing & Refinement

1. Test all CRUD operations
2. Test all computed fields and calculations
3. Test soft delete functionality
4. Test validations and error handling
5. Test signup bonus status transitions
6. Test sorting/filtering/searching on all list views
7. Performance testing for dashboard aggregations
8. Cross-browser testing
9. Bug fixes and refinements

---

## 11. Success Criteria

**MVP is successful when:**

1. ✅ User can enter transactions via web UI with full CRUD and vendor fuzzy matching
2. ✅ User can maintain all master data (cards, purchase types, purchase subtypes, recurrent expenses, planned expenses)
3. ✅ Dashboard displays accurate budget calculations and all required metrics
4. ✅ Month-to-month navigation works seamlessly
5. ✅ Credit card cancellation alerts appear on dashboard
6. ✅ Budget calculations follow the defined formula correctly
7. ✅ Overspending and negative balances are clearly indicated
8. ✅ System runs locally without issues
9. ✅ CSV bulk import works with intelligent mapping and duplicate detection
10. ✅ Credit card churning features are fully functional
11. ✅ Purchase subtypes provide granular categorization
12. ✅ Amount-based mapping improves categorization accuracy
13. ✅ Churnboard displays all required metrics with accurate calculations
14. ✅ Signup bonus progress is automatically calculated and displayed
15. ✅ Cards automatically transition from Focus to Active when bonuses complete
16. ✅ All list views support sorting, filtering, and searching by column
17. ✅ Card detail pages display comprehensive information across organized tabs
18. ✅ Redemptions and fee payments can be managed with CRUD operations
19. ✅ Soft deletes work across all entities with show/hide toggle
20. ✅ All validations are enforced (uniqueness, references, etc.)
21. ✅ Analytics graphs display correctly (spend vs value, points over time, offer history)
22. ✅ System integrates seamlessly with existing Financial Tracker

---

## 12. Future Considerations (Out of Scope for V1)

- Export capabilities (CSV, PDF reports)
- Multi-currency support
- Multi-user support
- Authentication
- Advanced analytics and reporting
- Mobile app
- Cloud deployment
- Historical trend analysis beyond month-to-month switching
- Integration with bank feeds for automatic transaction import
- Credit score tracking
- Card recommendation engine based on spending patterns
- Points transfer/pooling strategies
- Award booking tracking (flights/hotels booked with points)

---

**Document Version:** 1.0  
**Created:** December 19, 2024  
**Status:** ✅ IMPLEMENTED - Consolidated specification  
**Based On:** Financial Tracker Specification v2.0, Credit Card Churning Specification v1.0, Migration Specification v1.0, Amount-Based Mapping Enhancement v1.0

---

This consolidated specification provides a comprehensive blueprint for the complete Financial Tracker system, integrating manual transaction entry, credit card churning management, bulk CSV import, and advanced mapping capabilities into a unified, coherent system.
