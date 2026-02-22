# User Profile: Sandro

## Background
- SAP implementation consultant (full-time job - large enterprise implementations)
- Credit card churner in Canada (hobby, started ~2023)
- Comfortable with structured design methodologies (FRICEW, BBP, FS, TS)
- Prefers thorough planning before any code is written
- Thinks in terms of master data, transactional data, and reference data

## Working Style
- Likes structured, phased approaches
- Wants to validate problem statements before jumping to solutions
- Prefers guided conversations over being handed a finished document — **never dump a complete draft; interview topic by topic**
- Asks "do you see any gaps?" - values critical analysis over agreement
- Willing to challenge his own assumptions ("I am tempted to start clean")
- Wants one question at a time, not a wall of questions
- Appreciates when gaps are identified early rather than discovered during build
- Contributes creative ideas when invited — ask "any other ideas?" and he'll volunteer features (e.g., spending "blocks" for trip tagging)
- Likes reviewing related rules/items in batches by topic, not one at a time
- Says "approved!" explicitly when satisfied — wait for this clear signal

## Design Preferences
- SAP FRICEW object decomposition for tracking design artifacts
- Each object gets a unique ID for traceability
- Prefers diagrams and tables over walls of text
- Wants formal documents as deliverables (not just chat conversations)
- Likes decision logs with rationale (not just the decision)
- **No duplication across documents** - single source of truth per piece of information, reference from elsewhere
- Prefers config tables over enums for user-extendable vocabulary (D-45)
- Prefers explicit user actions over auto-magic (e.g., create vendors through value help, not auto-inferred from transaction patterns)
- Wants running totals and yield metrics visible during data entry — values immediate feedback on financial impact
- Provides real data samples to drive design (actual CSV exports from all issuers in `design/actual-csvs/`)

## Technical Preferences
- **Expert in SAP CAP + SAPUI5/Fiori** (JavaScript) — this is his day job on large enterprise implementations
- Knows Express decently
- TypeScript is new — this project is the learning opportunity (JavaScript background makes it a natural transition)
- Comfortable with PostgreSQL
- Follows Enbridge CAP conventions: Facade → Service → Validator pattern, wrapHandler, three-tier i18n, annotation file split
- Open to web scraping for automation
- Open to paid services (SimpleFIN $15/year) if they solve real problems
- Desktop-first - does financial work at a desk, not on phone
- **Next.js is permanently off the table** — personal choice, will not reconsider

## What Frustrates Sandro
- Manual effort that could be automated (killed his Excel approach)
- Tools that require too much upkeep to be useful
- Monolithic documents that mix concerns (spec was 1000 lines of everything)
- Being given the answer without being walked through the reasoning
- Solutions looking for problems (over-engineering)
- Being overwhelmed with a complete draft — wants to be walked through it conversationally
- Too many confidence/status indicators cluttering the UI ("too much")

## What Motivates Sandro
- Seeing churning performance in dollars ("is this hobby profitable?")
- Knowing exactly where money goes without manually tracking every transaction
- The "trophy case" of great redemptions (business class flights, hotel stays)
- Having a system that gets smarter over time (learns from corrections)
- Clean data models and well-structured systems

## Financial Context
- Currency: CAD
- Income: Mix of stable and variable
- Active churner: 13+ cards, 4 issuers, 6-8 new cards/year
- Tracks: credit cards, debit accounts, savings, car loan, student loan, RIF, RRSP, FHSA, TFSA
- Splits expenses with friends (padel, group activities)
- Supplementary cards used personally (not actually given to family to use independently)
- Weekly financial review session: 15-20 minutes

## Communication Preferences
- Direct and concise
- One topic at a time for complex decisions
- Prefers being asked questions over being told answers
- Values honest pushback ("your spec has gaps" not "looks great")
- Responds well to tables and structured comparisons
- SAP terminology is comfortable (SM30, BBP, FS, conversion objects)
- Wants Claude to be opinionated when asked "any recommendations?" — give a clear recommendation, not a menu
- Responds well to "any other ideas?" prompts — actively contributes creative features when invited
- Accepts/rejects UX suggestions quickly with numbered lists ("1. yes 2. no 3. too much")
