# CAP Declarative Annotations — A Reference for Replacing Imperative Handler Code

Companion reference for the `cap-annotation-hunter` skill. Read the section for a candidate
before proposing its annotation — the per-annotation **Justified** notes are what keep the audit
honest.

**Scope:** annotations in `srv/` and `db/` that drive *behavior, validation, authorization,
persistence, and lifecycle*. Pure Fiori rendering annotations are excluded except where
runtime-enforced.

**Verification standard:** every annotation below is confirmed against capire (cap.cloud.sap)
plus at least one second source. **Names that sound plausible but do not exist** are quarantined
in [§10](#10-fabrication-guard) rather than silently dropped — read that section before emitting
any annotation you have not personally seen in the docs. Freshness: docs current as of
**July 2026** (CAP Node `cds@10`, Java `4.9`). Re-check maturity before relying on it.

---

## 1. Status-Transition Flows (`@flow`)

**It exists, under exactly that name.** It is not a plugin, not Java-only, and not vaporware.

| Fact | Value |
|---|---|
| **Annotations** | `@flow.status` (entity), `@from` / `@to` (bound actions), `$flow.previous` (special `@to` value) |
| **Introduced** | **Beta** — November 2025 (`@sap/cds` 9.5.0+, `cds.java` 4.5.0+) |
| **Current maturity** | **Gamma** — December 2025 (`@sap/cds` 9.6.0+, `@sap/cds-compiler` 6.6.0+, `@sap/cds-mtxs` 3.6.0+, `cds.java` 4.6.0+) |
| **GA?** | **No — still Gamma as of July 2026.** Gamma = "finalized, ready to use, stable, and supported long term in the documented feature set" — but explicitly *not yet GA*. |
| **Runtime** | **Both.** Node.js: built-in, out of the box. Java: requires `cds-feature-flow` in `srv/pom.xml`. |

> **Correction worth flagging:** a WebFetch summary of the 2026 changelog asserted `@flow` "transitioned from experimental to GA". The underlying changelog entries say no such thing (they cover compile-time validation and UI-annotation generation only), and capire's own guide still states Gamma. **`@flow` is Gamma. Do not let the skill claim GA.**

### Syntax

```cds
type Status : String enum { Open; InReview; Accepted; Rejected; Blocked; }

entity Travels {
  key ID : UUID;
      status : Status default #Open;   // default required — element becomes read-only to clients
}

service TravelService {
  entity Travels as projection on my.Travels actions {
    action acceptTravel();
    action rejectTravel();
    action blockTravel();
    action unblockTravel();
  };
}

// the flow itself
annotate TravelService.Travels with @flow.status: status actions {
  reviewTravel    @from: #Open               @to: #InReview;
  acceptTravel    @from: #InReview           @to: #Accepted;
  rejectTravel    @from: #InReview           @to: #Rejected;
  reopenTravel    @from: #InReview           @to: #Open;
  blockTravel     @from: [#Open, #InReview]  @to: #Blocked;   // array = multiple entry states
  unblockTravel   @from: #Blocked            @to: $flow.previous;  // restores prior state
  deductDiscount  @from: #Open;              // guard only, no transition
};
```

`@from: #Open` and `@from: [#Open]` are equivalent. The decomposed form (`annotate X with @flow.status: status;` + a separate `annotate X actions {...}`) is also valid.

- **`@flow.status`** — entity-level; names the status element. Must be an **enum**, or an association to a code list with a single `code` enum element. (Since `cds@9.7.1`, compile-time validation "strictly follows the documentation: only enum status values are allowed".)
- **`@from`** — valid entry states. A generic **before** handler rejects with **409 Conflict** if the current state doesn't match: `Action "flipDown" requires "status" to be "["Up"]"`.
- **`@to`** — target state. A generic **after** handler writes it.
- **`$flow.previous`** — CAP tracks the sequence of entered states so a state reachable by several routes can be unwound.

### The imperative code it replaces

```js
// srv/travel-service.js — ALL OF THIS COLLAPSES INTO THE ANNOTATION
module.exports = class TravelService extends cds.ApplicationService { init() {
  const { Travels } = this.entities

  this.before('acceptTravel', Travels, async req => {
    const [t] = await SELECT.from(Travels).where({ ID: req.params[0].ID })
    if (t.status !== 'InReview')
      return req.reject(409, `Cannot accept a travel in status ${t.status}`)
  })
  this.on('acceptTravel', Travels, async req =>
    UPDATE(Travels).set({ status: 'Accepted' }).where({ ID: req.params[0].ID }))

  this.before('blockTravel', Travels, async req => {
    const [t] = await SELECT.from(Travels).where({ ID: req.params[0].ID })
    if (!['Open','InReview'].includes(t.status)) return req.reject(409, 'Cannot block')
    await UPDATE(Travels).set({ previousStatus: t.status }).where({ ID: t.ID })  // hand-rolled $flow.previous
  })
  this.on('unblockTravel', Travels, async req => {
    const [t] = await SELECT.from(Travels).where({ ID: req.params[0].ID })
    return UPDATE(Travels).set({ status: t.previousStatus }).where({ ID: t.ID })
  })
  // ...× every action, plus @readonly on status, plus Fiori button-enablement annotations
  return super.init()
}}
```

### Detection heuristic

- `req.reject(409` / `req.error(409` inside a handler bound to an **action**
- `.includes(` or `!==` comparing a fetched row's `status` field against string literals, inside `before('<actionName>')`
- `UPDATE(X).set({ status: '...' })` inside `on('<actionName>')` — a status write that is a constant
- A hand-rolled `previousStatus` / `priorStatus` / `lastStatus` column → `$flow.previous`
- Error strings: `invalid status`, `cannot be .* in status`, `wrong state`, `not allowed in state`
- **Model-side:** an enum-typed `status` element + 2+ bound actions on the same entity, with **no** `@flow.status` → prime candidate

### Caveats / when custom code IS justified

- **Drafts:** status transitions are **disabled while the entity is in draft state**.
- **Bound actions only.** CRUD operations cannot be flow-restricted — a transition triggered by a plain `UPDATE` still needs custom code.
- Generated handlers **can be overridden** when needed; the framework registers them, you can supersede.
- Side effects on transition (send mail, emit event, post to ERP) still belong in `on`/`after` handlers — `@flow` governs the *guard and the write*, not the consequences.
- Transitions whose validity depends on **data other than the status element** (e.g. "can only accept if budget approved") need an added `@assert:` constraint or custom code.
- Fiori elements auto-recognize flows and manage button enablement — so hand-written `@Core.OperationAvailable` for these actions is also redundant.

---

## 2. Validation & Constraints

### `@assert: (<constraint>)` — CXL declarative constraints ⭐

The single highest-leverage annotation in modern CAP, and the newest of the validation family.

```cds
annotate TravelService.Travels with {
  Description @assert: (case
    when Description is null      then 'Description must be specified'
    when length(Description) < 3  then 'Description too short'
  end);

  Agency @mandatory @assert: (case
    when not exists Agency then 'Agency does not exist'
  end);

  BeginDate @mandatory @assert: (case
    when BeginDate > EndDate then 'ASSERT_BEGINDATE_BEFORE_ENDDATE'      // ← cross-field
    when exists Bookings [Flight.date < Travel.BeginDate]                // ← cross-entity + infix filter
      then 'ASSERT_BOOKINGS_IN_TRAVEL_PERIOD'
  end);

  BookingFee @assert: (case when BookingFee < 0 then 'ASSERT_BOOKING_FEE_NON_NEGATIVE' end);
}
```

**What it does** — expresses arbitrary validity conditions in CDS Expression Language, enforced on every write. A `case` returns an **error message string** on violation, `null` on pass. Supports comparison to **other fields of the same entity**, **path expressions** into associated entities, and the **`exists` quantifier with infix filters**. Constraints are collected into a query and **pushed down to the database**, checked in an after-phase handler inside the transaction; violation rolls back. `then` strings are looked up in the service's **i18n bundle** (hence `ASSERT_*` keys).

**Runtime** — Node.js + Java. **GA as of April 2026** (promoted from Gamma; Dec 2025 release notes had it at Gamma). April 2026 (`cds.java@4.9.0`) added **aggregate function support** in `@assert`. Error codes are now taken from the constraint's own `then` string rather than a generic `ASSERT` code.

**Propagation:** declare on **base entities**; inherited and enforced on all projections/interface views above. Caveat: only add invariant constraints to base entities if they **don't refer to other elements** — views on top may not expose those fields, which is a compiler error.

**Replaces**

```ts
this.before(['CREATE','UPDATE'], 'Travels', async req => {
  const { BeginDate, EndDate, BookingFee, Description } = req.data
  if (Description && Description.length < 3) req.error({ message: 'Description too short', target: 'Description' })
  if (BeginDate && EndDate && BeginDate > EndDate) req.error({ message: req.t('ASSERT_BEGINDATE_BEFORE_ENDDATE'), target: 'BeginDate' })
  if (BookingFee < 0) req.error({ message: req.t('ASSERT_BOOKING_FEE_NON_NEGATIVE'), target: 'BookingFee' })
  const stray = await SELECT.one.from('Bookings').where({ travel_ID: req.data.ID }).and(`Flight.date <`, BeginDate)
  if (stray) req.error({ message: req.t('ASSERT_BOOKINGS_IN_TRAVEL_PERIOD') })
})
```

**Detection** — `req\.data\.\w+\s*[<>]=?\s*req\.data\.\w+` (cross-field compare — near-certain hit); `.length <`; `req.t(` next to `req.error` in a `before`; an `async before('CREATE'|'UPDATE')` awaiting a `SELECT` purely to decide whether to error → `exists` + infix filter; `.some(` / `.every(` / `.filter(...).length`.

**Justified custom code** — validation needing **external/remote service** calls or non-DB state (CXL is pushed to the DB); validation depending on **request context** (`req.user`, headers, tenant) rather than data; checks needing **side effects** alongside rejection; fine-grained control of the error object shape.

---

### `@mandatory`

```cds
entity Books { title : String @mandatory; }
```

Rejects `null` **and** empty string `''` with a 400 — distinct from `not null` (a DB constraint). Also emits `Common.FieldControl/Mandatory` so Fiori renders the field required, saving a roundtrip. **GA, both runtimes.** Docs note only *static* `@mandatory` drives Fiori field control.

**Replaces** — `if (!req.data.title) req.error(...)` in a `before(['CREATE','UPDATE'])`.

**Detection** — `if (!req.data.<field>)`, `=== undefined`, `=== null`, `?.trim() === ''`, `isEmpty(` inside `before\((\[)?['"](CREATE|UPDATE)` within ~15 lines of `req.error|req.reject`.

**Also works on action / function parameters** — undocumented on capire's constraints page, but
**verified empirically** against `@sap/cds` 9.8.4 (Node):

```cds
action correctCategorization(transactionId : UUID @mandatory, vendor_ID : UUID @mandatory);
```

Fires as `ASSERT_MANDATORY` with `target` = the parameter name, rejecting omitted, `null`, `''`
**and whitespace-only**. This matters more than it looks: services whose validation surface is
action params match *none* of the `before('CREATE'|'UPDATE')` detection heuristics above, so a
grep-only sweep scores them zero. Detect instead on **Validator classes and action handlers**:
`if (!command.<param>)` / `!request.<param>` / `.trim() === ''` accumulating into an errors array.

⚠️ **Two verified traps — both look like safe drop-ins:**

1. **`@mandatory.message` is silently ignored.** Per-field messages collapse into one global
   `ASSERT_MANDATORY` key in `messages.properties`. `target` still identifies the field, but two
   distinct per-field strings become one generic message — a real tradeoff to surface, not a
   silent regression to inflict.
2. **`@mandatory` on a `many` parameter passes `[]`.** It rejects an *omitted* value but accepts
   the empty array. So `if (ids.length === 0) error(...)` is **Justified, not Missed** — the
   annotation does not replace it. Use `@assert: (case ...)` or keep the guard.

**Justified** — *conditional* requiredness (A required only when B = 'X') → use `@assert: (case ...)` first, custom code only if the condition needs data outside the entity. On draft entities `@mandatory` fires at activation, not on every draft patch. Empty-collection guards on `many` params (see trap 2).

---

### `@assert.range`

```cds
bar    : Integer  @assert.range: [0, 3];              // closed: min ≤ x ≤ max
price  : Decimal  @assert.range: [(0), _];            // open bound + infinity: x > 0
window : DateTime @assert.range: ['2018-10-31', '2019-01-15'];
zoo    : String   @assert.range enum { high; medium; low; };   // enum form
rating : bookshop.Rating @assert.range;               // named enum type
age    : Int16 @assert.range: [(0),_] @assert.range.message: '{i18n>person-age}';
```

Restricts ordinal types to an interval; for **enum** elements, restricts input to declared values. **GA, both runtimes.** ⚠️ **Open intervals `(x)` and infinity `_` are version-gated: Node `@sap/cds` ≥ 8.5, Java ≥ 3.5.0** — a real upgrade trap.

**Detection** — `req\.data\.\w+\s*[<>]=?` against a literal; `.includes(` / `Object.values(` against `ALLOWED_*` / `VALID_*` / `*_VALUES` arrays; strings `must be between`, `out of range`, `must be one of`.

**Justified** — dynamic bounds (max depends on another field/config/lookup) → `@assert: (case ...)`; cross-field ranges (`BeginDate < EndDate`) → `@assert:`, not `@assert.range`.

---

### `@assert.format`

```cds
@assert.format: '/^\S+@\S+\.\S+$/'
@assert.format.message: 'Provide a valid email address'
email : String;
```

**GA, both runtimes** — but ⚠️ **the regex dialect differs**: **ECMA 262** on Node.js vs **`java.util.regex.Pattern`** on Java. Lookbehind, named groups, and `\p{...}` classes may not port.

**Detection** — `.test(`, `.match(`, `new RegExp(`; module-level `const *_PATTERN = /^...$/`; `validator` / `isEmail` imports; regex `\/\^.*\$\/` under `srv/`.

**Justified** — validation needing **normalization** (trim/lowercase then store) — `@assert.format` validates, it does not transform; semantic checks a regex can't do (IBAN mod-97, checksum digits). A `null` value is not a format violation — pair with `@mandatory` if presence is also required.

---

### `@assert.target`

```cds
entity Books { author : Association to Authors @assert.target; }
```

Validates that a **managed to-one** association's target exists, with an **end-user-tailored** message (`{"code":"400","message":"Value doesn't exist","target":"author_ID"}`). Docs call it the **recommended application-level alternative** to DB constraints. **GA, both runtimes.** Fires on **CREATE and UPDATE only — not DELETE**.

**Detection** — `SELECT.one.from(<Target>).where({ ID: req.data.<assoc>_ID })`; strings `does not exist`, `not found`, `Invalid reference`; any `before` resolving a `*_ID` purely to test existence.

**Justified** — **cross-service checks unsupported**; **deep create unsupported** (dependent values must pre-exist); relies on **DB locks**, so it can fail on HANA views with joins; doesn't cover DELETE, so "can't delete an Author that still has Books" remains `@assert.integrity` or custom code.

---

### `@assert.unique.<name>`

```cds
annotate OrderItems with @assert.unique.product: [ order, product ];
```
→ `CONSTRAINT OrderItems_product UNIQUE (order_ID, product_ID)` in the DDL.

A **database** constraint emitted by the compiler — runtime-agnostic, but requires a **redeploy**. Allowed: scalars, structured types (flattened), managed associations (all FK columns). Not allowed: elements *within* structs, unmanaged associations. Keys need no `@assert.unique`.

**Replaces** a `SELECT`-then-`req.error(409)` pre-check — which is also **racy** (two concurrent requests both pass the SELECT). The DB constraint is not.

**Detection** — `SELECT\.one` near `req.error|req.reject`; strings `already exists`, `duplicate`, `is taken`, `must be unique`; status `409`; `if (existing)` guards after a SELECT.

**Justified** — ⚠️ **error message quality**: docs warn DB constraint violations "aren't standardized by the runtimes but presented as-is" — the raw DB error reaches the user. A friendly pre-check handler *in addition* is legitimate. Case-insensitive or filtered uniqueness (unique among non-deleted rows) is not expressible.

---

### `@assert.integrity`

```cds
entity Books { author : Association to Authors @assert.integrity: false; }  // opt OUT
```
```jsonc
{ "cds": { "features": { "assert_integrity": "db" } } }   // opt IN globally
```

Generates native `FOREIGN KEY` constraints (`ON DELETE RESTRICT`; composition backlinks get `ON DELETE CASCADE`). **Timeline:** introduced Mar 2022 with `'db'`/`'app'`/`false`; **June 2022 made DB-level GA and deprecated the Node.js app-level checks**; today's docs document only `= db` and no longer mention `'app'`. **Net for a scanner: FK constraints are OFF unless the project explicitly sets `assert_integrity: db`.** Constraints are **deferred to commit** — supported by most RDBMS **except H2**, a common CAP Java test DB.

**Justified** — same as `@assert.unique`: DB constraints are explicitly **not for end-user validation**. Delete-guards legitimately remain custom code since `@assert.target` doesn't cover DELETE.

---

### `@assert.enum` — ⚠️ DEPRECATED

`@assert.enum: { high; medium; low; }` was deprecated in **April 2020**: *"The usage of `@assert.enum` is deprecated and should be replaced with `@assert.range enum`."* Absent from the current constraints page. There are community reports of it **silently not firing** on OData V4 — so any hit is a genuine correctness bug, not a style nit. **Any occurrence of `@assert.enum` is a finding.**

### `@assert.notNull` — ⚠️ opt-out ONLY

**The only documented form is `@assert.notNull: false`** — it *skips* the server-side check of an element marked `not null`. Confirmed verbatim in the **October 2020 release notes, under the Java SDK section**. **Node.js support is unconfirmed.** There is **no positive form**. To require a value use `not null` and/or `@mandatory`. A skill that suggests `@assert.notNull` as the way to make a field required would be **wrong**. Legit use: a `not null` field filled by an `on`-handler or DB default, where the runtime check would wrongly reject the payload.

---

## 3. Authorization

### `@requires`

```cds
service BrowseBooksService @(requires: 'authenticated-user') { ... }
annotate ShopService.Books with @(requires: ['Vendor', 'ProcurementManager']);  // list = OR
```

Role gate on service / entity / action / function. Exactly equivalent to `@restrict: [{ grant: '*', to: <roles> }]`. **Not supported on element/field level.** GA, both runtimes.

**Detection** — `req.user.is(` in a `before` whose body only rejects; `req.reject(403|401` with no data-dependent condition; `req.user.id === 'anonymous'`; `!req.user`. **Any predicate reading only from `req.user`, never from entity data, is a pure role check → `@requires`.**

---

### `@restrict` — grant / to / where

> ⚠️ **`for:` does not exist.** The brief listed `grant/to/where/for`. The valid key set is **exactly `grant`, `to`, `where`** — confirmed three ways: cds-lint `auth-valid-restrict-keys` ("must not have properties besides to, grant, where"), the supported-combinations table, and zero occurrences of `for:` in the docs corpus. A `for:` key would be **silently ignored at runtime**.

```cds
entity Orders @(restrict: [
    { grant: ['READ','WRITE'], to: 'Admin' },
    { grant: 'READ', where: (buyer = $user) }
  ]) {/*...*/}
```

**`grant` values:** all standard CDS events (`READ`, `CREATE`, `UPDATE`, `DELETE`, `UPSERT`), plus action/function names, plus **`WRITE`** (virtual = CREATE+DELETE+UPDATE+UPSERT) and **`*`** (wildcard).

**How privileges combine — the part most often gotten wrong:**

| Scope | Combinator |
|---|---|
| Multiple entries in the `@restrict` array | **OR** |
| `grant` + `to` + `where` within one entry | **AND** |
| Multiple events in one `grant` / roles in one `to` | **OR** |
| `where` of several *matched* privileges | **OR** |
| Across model hierarchy (service → entity → action) | **AND** |

That last row is subtle: service `@requires` and entity `@restrict` are **cumulative (AND)** — but an entity-level restriction **replaces** the one inherited from the underlying DB entity via projection.

**Supported combinations:**

| Resource | `grant` | `to` | `where` |
|---|:---:|:---:|:---:|
| service | n/a | ✓ | n/a |
| entity | ✓ | ✓ | ✓¹ |
| action/function | n/a | ✓ | n/a² |

¹ Bound actions not bound against a collection support model references in Node.js; all bound actions support static expressions (`where: $user.level = 2`). ² Unbound actions: static expressions only.

> 🔥 **"Unsupported privilege properties are ignored by the runtime."** A `grant` on a service- or action-level `@restrict` is **silently dropped** → effectively `grant: '*'`. **Wrong auth annotations fail *open*, silently.** This is why lint matters more here than anywhere else. cds-lint `auth-restrict-grant-service` catches it.

**Detection** — `req.query.where(` inside `before('READ')`; `SELECT.from(...).where({...req.user.id...})` guarding access; `req.user.is('` + early return that mutates the query; a `before` on a bound action doing only a role check; `if (req.event === 'CREATE' || req.event === 'UPDATE')` role ladders → that's `grant: 'WRITE'`.

---

### `@restrict.where` — instance-based auth

```cds
annotate Orders with @(restrict: [{ grant: ['READ','UPDATE','DELETE'], where: (CreatedBy = $user) }]);
```

**Documented model references:** `$user` (logon name), `$user.<attribute>`, `$tenant`; `<role>` in `@requires`/`@restrict.to`. `$self` is used in association `on`-conditions (`on producers.product = $self`).

⚠️ **`$user.<attribute>` is a LIST.** Verbatim: *"`$user.<attribute>` contains a **list of attribute values**"*. A predicate is true if **one** matches. And critically: *"the user has no access to any entity instances if the value list is empty or the attribute is not available at all."* **Absent attribute = fully denied, by design** (a changelog entry records `$user.<attr> === undefined` being *fixed* from `true` to `false`). To model "unrestricted", opt in explicitly:

```cds
where: ($user.country = countryCode or $user.country is null)
```

**`exists` predicate** — auth derived from business data, supports recursion, target paths, infix filters, and user attributes:

```cds
entity Projects @(restrict: [
  { grant: ['READ','WRITE'], where: (exists members[userId = $user and role = 'Editor']) }]) {
  members : Association to many Members;
}
entity Products @(restrict: [
  { grant: '*', where: (exists producers.division[$user.division = name]) }]) : cuid { ... }
```

**Java extras (both default-on since CAP Java 4.0):** *Checking Input Data* — CREATE/UPDATE payloads validated against the condition → **400** (`cds.security.authorization.instanceBased.checkInputData: false` disables). *Rejected Entity Selection* — Java adds the filter to the query, so an invisible single entity returns **404** not 403; UPDATE/DELETE can be rejected with **403** instead.

**Replaces**

```js
this.before('READ', 'Projects', async req => {
  const rows = await SELECT.from('Members').where({ userId: req.user.id, role: 'Editor' })
  req.query.where({ ID: { in: rows.map(r => r.project_ID) } })   // N+1, and leaks on expand
})
this.before('READ', 'Orders', req => {
  req.query.where({ countryCode: { in: req.user.attr.country ?? [] } })
})
```

**Detection** — **`req.user.attr`** (almost always `$user.<attr>`); `req.query.where({...in:...})` preceded by a SELECT of a membership table → `exists`; `req.tenant` in a `where` (CAP already isolates tenants — manual tenant filtering is a smell); `createdBy`/`owner`/`buyer` compared to `req.user.id`; `.map(r => r.<x>_ID)` feeding an `in:`.

**The core mapping for the skill:** `req.user.id` → `$user` · `req.user.attr.X` → `$user.X` · `req.user.is('R')` → `to: 'R'`.

---

### `@readonly` / `@insertonly` / `@Capabilities.*Restrictions`

```cds
service BookshopService {
  @readonly   entity Books  {...}   // ≡ @restrict: [{ grant: 'READ' }]
  @insertonly entity Orders {...}   // CREATE only
}
entity Foo { @readonly bar : String }   // element level: input SILENTLY IGNORED
```

**Note the overload:** entity-level `@readonly` is *access control*; element-level `@readonly` is *input validation* (silently ignored, not rejected). Don't conflate them. **Never put `@readonly` on keys** — capire is explicit.

**`@Capabilities` is runtime-enforced, contrary to common belief.** Verbatim from the authorization guide: *"annotation `@Capabilities` from standard OData vocabulary is **enforced by the runtimes** analogously."* Independently corroborated via Context7 ("Enforce OData Capabilities for Access Control").

```cds
@Capabilities: { InsertRestrictions.Insertable: true,
                 UpdateRestrictions.Updatable: true,
                 DeleteRestrictions.Deletable: false }
entity Foo { key ID : UUID }
```

> **Scope that claim carefully.** Runtime enforcement is asserted for `Insert`/`Update`/`DeleteRestrictions`. I found **no** statement that the *whole* `@Capabilities` vocabulary is enforced — `FilterRestrictions`, `SortRestrictions`, `ExpandRestrictions`, `CountRestrictions` surface in OpenAPI/EDMX generation and are **unconfirmed** as runtime-enforced. Don't generalize. Likewise, the docs state `@readonly` ≡ `@restrict: [{grant:'READ'}]`; the claim that `@readonly` *desugars into* `@Capabilities` in CSN is **unconfirmed**.

**Detection** — `req.reject(405`; a `before` listing all write events for one entity that unconditionally rejects; `if (req.event !== 'READ') req.reject(`; `delete req.data.<field>` in before-CREATE/UPDATE → element-level `@readonly`.

**Justified** — all of these are **static, for all users**. The moment the rule is user-, role-, or state-dependent → `@restrict`. Genuinely dynamic rules (readonly only when `status = 'closed'`) → `@assert:` or custom code.

---

### `@protocol: 'none'`

```cds
@protocol: 'none'
service InternalService { ... }
```

Removes the endpoint entirely rather than guarding it; the service still receives in-process events. GA, both runtimes. **Detection** — hooks inspecting `req.headers` to infer "is this external"; `req.user.is('internal-user')` as the *only* protection. **Caveat:** docs warn that **any** client with access to the app's XSUAA/IAS service instance can call as `internal-user` — don't share service keys.

---

### Pseudo-roles

| Pseudo Role | Technical Indicator | `$user` |
|---|---|---|
| `authenticated-user` | successful authentication | derived from token |
| `any` | – | token if available, else `anonymous` |
| `system-user` | grant type client credential | `system` |
| `internal-user` | client credential + shared identity instance | **Java:** `system-internal` · **Node.js:** `system` |

That last cell is a real, easily-missed **Java/Node divergence**. `any` is the **default** for `to` when omitted, and is how you make an endpoint public.

**Detection** — `req.user.is('system-user')`, `req.user.id === 'system'`, `cds.User.privileged` / `new cds.User.Privileged` in a request handler (legitimate for internal service-to-service calls, suspicious inside a handler).

---

### `@ams.attributes` (SAP Authorization Management Service)

```cds
annotate AdminService.Books with @ams.attributes: { Genre: (genre.name) };
```

Exposes a domain field as an AMS attribute so admins can define DCL policy filters. **Complementary to, not a replacement for, `@restrict`** — the AMS plugin injects roles and filters into the request context, then CAP authorizes normally. Verbatim: *"You can simply reuse existing CAP roles for AMS. There is no need to modify the CDS model."* Both runtimes (`cds add ams`; Java `cap-ams-support`, Node `@sap/ams`). **Status ambiguous:** the `cap-users` AMS section carries no beta marker, while `cap.cloud.sap/docs/java/ams` is titled "IAS Authorization via AMS **beta**" — **unreconciled**. IAS only (not XSUAA); technical users not yet addressable.

> **`@ams.publicFields` does not exist.** A web-search summary asserted it confidently; it has **0 occurrences** in the entire docs corpus, and the SAP Cloud Identity guide confirms only `@ams.attributes`. The `@ams` family is **one** annotation.

---

### Auth limitations — a major Node/Java asymmetry

**Node.js** (`## Limitations {.node}`, verbatim): *"security annotations are only evaluated on the target entity of the request. Restrictions on associated entities touched by the operation are not regarded."* — Restrictions of expanded/inlined entities in a READ **aren't checked**; deep inserts/updates checked on the **root only**.

**Java** (`## Deep Authorizations {.java}`): Java **does** perform deep authorization over **associations** — but *"Restrictions on compositions are not checked by the runtime"* (rationale: composition children are part of the document, so the root governs).

**⇒ Expand-leak protection exists in Java (associations) and does not exist in Node.js at all.** Encode this.

**Drafts:** CREATE ⇒ also create/update/delete/activate a new draft. UPDATE ⇒ also put into draft mode and edit/activate. Drafts are editable only by the **creator**. Verbatim: *"you don't need to take care of draft events when designing the CDS authorization model."* **⇒ any handler gating `draftActivate`/`draftEdit`/`draftPrepare` on roles or ownership is near-certainly redundant** — a high-value detection target.

**cds-lint auth rules** (defer to these rather than reimplementing): `auth-no-empty-restrictions`, `auth-restrict-grant-service`, `auth-use-requires`, `auth-valid-restrict-grant`, `auth-valid-restrict-keys`, `auth-valid-restrict-to`, `auth-valid-restrict-where` (e.g. `=` not `===`).

---

## 4. Persistence & Data Lifecycle

### `@cds.on.insert` / `@cds.on.update` + `managed` / `cuid` ⭐ highest hit rate

```cds
entity Foo {
  createdAt  : Timestamp @cds.on.insert: $now;
  createdBy  : User      @cds.on.insert: $user;
  modifiedAt : Timestamp @cds.on.insert: $now  @cds.on.update: $now;
  modifiedBy : User      @cds.on.insert: $user @cds.on.update: $user;
}
// or simply:
using { managed, cuid } from '@sap/cds/common';
entity Foo : cuid, managed { ... }
```

**Confirmed pseudo-variables:** `$now`, `$user`, `$user.<attr>` (`$user.id`, `$user.locale`, `$user.tenant`), **`$uuid`** (confirmed two ways; appears both bare and quoted).

Elements are **write-protected for external clients** — payload values are ignored. Custom handlers and CSV seeds can still write them.

> 🔥 **`@cds.on.insert` vs `default` — a security-relevant distinction.** Verbatim: *"While both behave identical for database-level INSERTs, they differ for CREATE requests on higher-level service providers: Values for `managed` in the request payload will be ignored, while provided values for `default` will be written to the database."* So **`createdAt : Timestamp default $now` lets a client POST `{"createdAt":"1999-01-01"}` and have it persisted.** Encode `default $now` on an audit field as its own rule.

**`managed` subtlety:** `modifiedAt`/`modifiedBy` are set **on CREATE too** — so `modifiedAt` is never null and `createdAt == modifiedAt` on a fresh row. Don't write code treating non-null `modifiedAt` as "has been edited".

**`cuid` precision note:** `cuid` is **not** `@cds.on.insert: $uuid`. It is a plain `key ID : UUID`, and auto-fill comes from the runtime's generic handling of **UUID-typed keys**. `@cds.on.insert: $uuid` is the separate mechanism for `String`-typed or non-key elements. Encoding "cuid == $uuid" would be wrong.

**Replaces**

```ts
this.before('CREATE', 'Books', req => {
  req.data.createdAt = new Date().toISOString()
  req.data.createdBy = req.user.id
  req.data.ID = cds.utils.uuid()
  req.data.tenant = req.user.tenant
})
this.before('UPDATE', 'Books', req => {
  delete req.data.createdAt; delete req.data.createdBy   // hand-rolled write protection
  req.data.modifiedAt = new Date().toISOString()
  req.data.modifiedBy = req.user.id
})
```

**Detection** — `req\.data\.(createdAt|createdBy|modifiedAt|modifiedBy|changedAt|changedBy)\s*=`; `req\.data\.\w+\s*=\s*(new Date\(\)|Date\.now\(\))`; `req\.data\.\w+\s*=\s*req\.user(\.id)?`; `req\.data\.\w+\s*=\s*.*uuid\(\)`; `delete req.data.`; model-side `(createdAt|modifiedAt).*default \$now`.

**Justified** — ⚠️ **UPSERT asymmetry (confirmed):** on UPSERT, `@cds.on.update` handlers run but **`@cds.on.insert` handlers do not** — `createdAt`/`createdBy` end up null. If you ingest via UPSERT, custom code is justified. Values derived from *business* data (`approvedBy` set on a status transition) are not managed data.

---

### `@Core.Computed` / `@Core.Immutable`

```cds
entity Orders {
  total   : Decimal @Core.Computed;    // never client-settable
  orderNo : String  @Core.Immutable;   // settable on CREATE, protected on UPDATE
}
```

Both **silently ignore** client input (same as `@readonly`, static `@FieldControl.ReadOnly`). `virtual` elements are calculated by default and likewise protected. GA, both runtimes.

**Replaces** — `delete req.data.total` in before-CREATE/UPDATE (`@Core.Computed`); `if ('orderNo' in req.data) delete req.data.orderNo` in before-UPDATE (`@Core.Immutable`).

**Detection** — **`grep -rn "delete req.data." srv/`** is the single highest-signal grep in this whole reference; strings `cannot be changed`, `is immutable`, `once created`.

**Justified** — "silently ignored" is the trap: if your API contract requires a **400** when a client sends a computed field, the annotation won't do it. Conditional immutability ("immutable *once released*") is state-dependent → handler or `@assert:`.

---

### `@odata.etag` — optimistic concurrency

```cds
using { managed } from '@sap/cds/common';
entity Foo : managed { ... }
annotate Foo with { modifiedAt @odata.etag }
```

⚠️ **The annotated element must actually change on write** — pair with `@cds.on.update: $now`. **`@odata.etag` on a static field yields a permanently matching ETag, i.e. no concurrency control at all while looking like it.** Encode as its own rule.

**Replaces** — manual `if-match` header parsing + `SELECT` + `req.reject(412)`.

**Detection** — `if-match`, `precondition`, `412`, `concurren`, `optimistic lock`, `stale`; model-side: `managed` present but no `@odata.etag` in an app with concurrent editors.

**Justified** — protocol-bound: does nothing for non-OData entry points (custom REST, messaging, direct CQL); background jobs can still clobber. Pessimistic locking (`SELECT ... FOR UPDATE` / `Select.lock()`) is right when conflicts are common — not supported on SQLite, and not on projections/views.

---

### `temporal` + `@cds.valid.from` / `@cds.valid.to`

```cds
using { temporal } from '@sap/cds/common';
entity WorkAssignments : temporal { ... }
// aspect temporal { validFrom : Timestamp @cds.valid.from; validTo : Timestamp @cds.valid.to; }
```

**The annotation pair is what triggers the mechanism** — the aspect is just a wrapper. Time slices are keyed by *conceptual key + `validFrom`* (DDL `PRIMARY KEY (ID, validFrom)`), but the **exposed API stays "timeless"**. Time travel: `?sap-valid-at=date'2021-04-13'`; period: `?sap-valid-from=...&sap-valid-to=...`. GA, both runtimes.

⚠️ **Time-travel and time-period queries are not supported on SQLite** (no session context variables) — so temporal integration tests won't run on CAP's default test DB.

**Replaces** — hand-rolled validity filtering in `before('READ')` plus the slice-closing logic on UPDATE (close current slice, open new one) that everyone gets wrong.

**Detection** — `validFrom|validTo|effectiveDate|expiryDate` in `db/` without `@cds.valid.from/to`; `\.where\(.*valid(From|To)`; `set({ validTo` / `INSERT.into.*validFrom`.

**Justified** — temporal is *application time*, not *system/audit time*. If you need "what did the DB think on date X" (transaction time), temporal is the wrong tool.

---

### `@cds.persistence.*`

| Annotation | Effect |
|---|---|
| `@cds.persistence.skip` | No DDL for the entity **or any view on it** (cascades — the usual surprise) |
| `@cds.persistence.exists` | Artifact already exists externally; **views on it are still generated** |
| `@cds.persistence.table` | Materialize a *view* as a real table using its signature; `where`/`group by`/`order by` **ignored** |
| `@cds.persistence.journal` | `.hdbmigrationtable` instead of `.hdbtable` — HDI schema evolution. **HANA only** |
| `@cds.persistence.mock: false` | Exclude from automatic mocking (Node; low-confidence — reference page only, no worked example) |
| `@cds.persistence.udf` / `.calcview` | HANA user-defined functions / calculation views |

**`skip` vs `exists`** is the distinction to encode: `skip` removes dependent views too; `exists` keeps them.

**`@cds.persistence.table` trap:** you get the signature but **not** the filtering semantics — a `where`-filtered view materialized this way will hold rows the view would have excluded.

**`@cds.persistence.journal` blocker:** ⚠️ **no tenant extensibility** — `cds-mtxs` extensions cannot be activated on journaled entities. Hard stop for SaaS/MTX apps. Config `cds.hana.journal`: `enable-drop` (default `false`), `change-mode` (default `"alter"`). Cascades to generated `.texts`/child entities — opt out with `: false`.

**Detection** — raw SQL (`db.run(\`SELECT`, schema-qualified `SCHEMA.TABLE` literals) → `exists`; an `on('READ')` that never touches the entity's own table → `skip`; hand-written `.hdbmigrationtable` files → `journal`; `*Cache`/`*Replica` entities duplicating a view's columns → `table`.

---

### `@sql.prepend` / `@sql.append`

```cds
annotate Books:title with @sql.append: 'FUZZY SEARCH INDEX ON';
```

Injects native SQL into generated DDL. `@sql.prepend` works on **table entities only**; `@sql.append` works on elements too. Content is inserted **without validation** — invalid SQL is a deploy failure, not a compile error. ⚠️ On HANA, `@sql.prepend: 'COLUMN'` is implicit; supplying your own **overrides that default**, silently losing columnar storage.

**Justified** — genuinely dangerous; database-specific (breaks SQLite tests for a HANA app). Flag hand-written DDL as *a candidate*, never assert it as a fix.

### `@cds.java.version` (Java only)

```cds
entity Order : cuid { @odata.etag @cds.java.version version : Int32; ... }
```
Runtime-managed integer version for CQL-layer conflict detection. **The only `@cds.java.*` annotation I could confirm — do not generalize the family.** Should not fire on a Node project.

---

## 5. Service & Entity Behavior

### `@odata.draft.enabled`

```cds
annotate TravelService.Travels with @odata.draft.enabled;
```

Serves the full Fiori draft choreography: shadow `.drafts` entity, `draftEdit`/`draftActivate`, PATCH-series editing, discard, draft locks. Both runtimes, GA. Node `@sap/cds` v10 adds draft-bypassing CREATE/UPDATE on active data **by default** (`cds.fiori.bypass_draft: false` disables) and draft-agnostic requests (`cds.fiori.draft_new_action: true`). **Java does not yet support draft-agnostic requests** (Olingo-bound; requires explicit `IsActiveEntity=true`). Lock timeout: `cds.fiori.draft_lock_timeout` / `cds.drafts.cancellationTimeout`, default 15 min.

**Detection** — `'draftActivate'`, `'draftEdit'`, `'draftNew'`, `'draftPrepare'` in `.on(`/`@On(`; `IsActiveEntity` in hand-written CQL; a hand-defined `*Drafts` entity or `DraftAdministrativeData`; manual `lockedBy`/`lockedAt`/`draftUUID` columns.

**Justified** — validations must run on **active** entities too, since active data can be updated directly. `before('draftActivate')` for cross-entity validation is legitimate. Note the compiler auto-sets `@odata.draft.enabled: false` on generated `.texts` entities — seeing that in CSN is normal.

### `@cds.autoexpose` / `@cds.autoexposed`

```cds
@cds.autoexpose entity SomeCodeList { key code : String; name : localized String; }
```

Auto-includes an entity in any service with an association to it. Entities inheriting `sap.common.CodeList` get it free. **Two flavours:** *explicitly* auto-exposed → directly readable but **`@readonly`**; *implicitly* (composition targets) → **not directly accessible**, navigation only.

⚠️ **`@cds.autoexposed` is compiler-generated — you never write it.** Verified empirically by compiling a model: the compiler stamps `{"@cds.autoexposed":true}` on the generated projection. **A hand-written `@cds.autoexposed` in source is a bug.** Also verified: the CSN carries **no** `@readonly` on the projection — the restriction is applied by the *runtime*, so don't grep CSN for it.

**Detection** — repeated `@readonly entity <X> as projection on <CodeList>` across services; manual projection of `sap.common.Currencies|Languages|Countries`.

### `@cds.redirection.target`

```cds
service AdminService {
  @cds.redirection.target: true
  entity ListOfBooks as projection on my.Books;
  entity Books       as projection on my.Books;
  entity Authors     as projection on my.Authors;   //> Authors.books → ListOfBooks
}
```
Disambiguates auto-redirected associations when a service exposes 2+ projections of the same entity. Compiler error to recognize: *"Add `@cds.redirection.target` to either … can't auto-redirect …"*. **Detection** — multiple `redirected to` clauses.

### `@cds.query.limit`

```cds
@cds.query.limit.default: 20
service CatalogService {
  @cds.query.limit.max: 100
  entity Books as projection on my.Books;      //> default 20, max 100
  @cds.query.limit: 0                          //> 0 disables at this level
  entity Authors as projection on my.Authors;  //> max 1,000 from environment
}
```
Precedence: entity > service > global env. Default truncation is **1,000** records with an `@odata.nextLink`. Both runtimes, GA. Reliable paging (skip token from last row values) is **OData V4 only**, opt-in via `cds.query.limit.reliablePaging`.

**Detection** — `req.query.SELECT.limit` mutation; `q.limit.rows`; literals `1000`/`$skiptoken`/`nextLink` in handlers.

**Justified** — reliable paging forbids functions/arithmetic in `$orderby`; don't enable it when sorting by sensitive fields (the skip token leaks values).

### `@cds.search`

```cds
@cds.search: { element1, element2: true, element3: false, assoc1, assoc2.elementA }
entity E { }
```
**Default:** all `String` elements that aren't calculated or virtual. Both runtimes, GA. Fuzzy search is HANA Cloud only (Java: `HEX` mode + `cds.sql.hana.search.fuzzy`; Node: `cds.hana.fuzzy = 0.7`).

⚠️ **Precedence gotcha:** `@cds.search` **takes precedence over `@Common.Text`**. `@cds.search: { title: false }` (exclude mode) keeps `author.name` searchable; `@cds.search: { title }` (include mode) **silently stops** searching `author.name` unless you add it. **An include-mode `@cds.search` on an entity with a `@Common.Text` association is probably a bug** — high-value lint.

**Detection** — `$search` read from `req._queryOptions`; `like '%` or `` `%${ `` string-built predicates (also an **SQL injection** risk); `.or(` chains over text columns in before-READ.

### Implicit sorting — there is **no** `@cds.default.order`

Use a plain `order by` in the projection: `entity Books as projection on my.Books order by title asc;`. Default is primary-key order; request `$orderby` takes precedence and the key order is *still appended*. **Detection** — `SELECT.orderBy` assignment in `before('READ')`.

### `@path`, `@protocol`/`@protocols`, `@impl`, `@open`

- **`@path: 'browse'`** — override the derived endpoint. Replaces `cds.serve(...).at('/browse')` in a custom `server.js`.
- **`@protocol` / `@protocols: ['odata-v4','odata-v2']`** — choose adapters. Documented under **CAP Java**; **Node.js support for the plural/array form is unconfirmed** (Node docs describe the fluent `.to('rest'|'odata'|'fiori')` API instead). `@protocol: 'none'` is documented runtime-agnostically. Explicit alternatives: `@odata`, `@odata-v4`, `@odata-v2`, `@rest`, `@graphql`, `@hcql`, `@mcp`. Since **April 2026**, inline path shorthand: `@odata: 'browse'` ≡ `@odata @path: 'browse'`.
- **`@impl: 'srv/my-impl'`** — point a service at its implementation (Node). Mainly for reuse packages where filename-adjacency isn't enough. Replaces `.with(...)` wiring in `server.js`.
- **`@open`** — OData open types. ⚠️ **This one *requires* custom code rather than replacing it**: *"Dynamic properties are not persisted in the underlying data source automatically and must be handled completely by custom code."*
- **`@cds.api.ignore`** — omit an element from the generated API. Replaces `delete row.secretField` loops in after-READ.
- **`@odata.singleton`** — keyless single-instance entity at the service root. Replaces custom unbound functions returning "the current X".
- **`@cds.minify: false`** — new in `cds@10.0.0`; avoids minification of definitions.

---

## 6. Messaging & Events

### `@topic`

```cds
service ReviewService {
  @topic: 'sap.cap.reviews.v1.ReviewService.changed.v1'
  event reviewed : { subject : String; rating : Decimal; }
}
```
Overrides the broker topic (default = fully qualified event name), decoupling the wire contract from internal CDS naming. Both runtimes, GA.

**Replaces** — dropping to `cds.connect.to('messaging')` + `.emit('<dotted.FQN>')` just to control the topic string. The docs are explicit that low-level messaging **loses**: service-local event names, event declarations, and generated typed API classes.

**Detection** — `cds.connect.to('messaging')` followed by `.emit('<dotted.name>'`; version-segmented string literals (`.v1`); the same topic string duplicated across emitter and receiver files.

**Justified** — separate channels per emitter/broker. But prefer `composite-messaging` with `routes` (glob `**`, `*`, `?`). ⚠️ **Footgun:** routes can reference declared events by FQN *"unless annotation `@topic` is used on them"* — if you set `@topic`, route on the topic, not the FQN.

### Outbox / event queues — **no annotations exist**

**There is no `@cds.outbox`, no `@cds.persistent.outbox`, no `@queue`.** This is **config + API only**:

```jsonc
{ "requires": { "yourService": { "kind": "odata", "outboxed": true } } }  // Node.js only
```
```js
const xflights = cds.queued(await cds.connect.to('XFlightsService'))   // Node
// Java: OutboxService.outboxed(srv) / .unboxed(srv)
```

Messaging and audit-log services are **auto-outboxed by default** and use the persistent queue; event queues are enabled by default (`cds.requires.queue: false` disables). Failed messages remain in the `cds.outbox.Messages` **table** (a table name, not an annotation) — a DLQ service can project on it via `using from '@sap/cds/srv/outbox'`.

**Replaces** — emitting inside the transaction (`await xflights.send('notify', data)` in an `after` handler), where recipients get messages even on rollback.

**Detection** — a remote `.send(`/`.emit(` inside an `after`/`before` handler on a non-outboxed service; hand-rolled "pending messages" tables with a poller; try/catch-retry loops around remote sends.

**Justified** — a class-level `outboxed: true` is **too coarse for business services**, which typically need *some* calls deferred and others synchronous. Prefer `cds.queued()` per call site there; config-level outboxing is right for **technical** services.

---

## 7. Localization & Misc

### `localized` keyword + `@cds.localized: false`

```cds
entity Books { key ID : UUID; title : localized String; }
service CatalogService {
  @cds.localized: false        //> direct base-entity access, non-localized defaults
  entity BooksDetails as projection on Books;
}
```

`localized` makes the compiler unfold a `.texts` entity, add a `texts` composition + a `localized` association narrowed to `$user.locale`, and generate `localized.` views with `coalesce(localized.title, title)` fallback. The runtime **auto-redirects READs** to those views. Both runtimes, GA.

`$user.locale` propagates as `session_context('locale')`; **SQLite lacks session variables**, so CAP generates stand-in views per language (`"i18n": { "for_sqlite": ["en", ...] }`). `localized.` entities are **SQL-only** — not in CSN, not exposed via OData.

**Replaces** — `after('READ')` loops joining `.texts` per row (N+1, no fallback, no nested handling). CAP does it in one SQL statement with per-row fallback, including nested code lists.

**Detection** — `.texts` / `_texts` in hand-written CQL; `req.locale` used to branch or filter data reads; `locale:` in a `where`; a manually declared `entity XTexts { key locale ... }`; after-READ loops overwriting text fields.

**Caveats** — `localized` is **not supported on sub-elements** (silently ignored) and keys **must not be associations**. Views must preserve the `localized` association (`select from Books {*} excluding {...}` beats an explicit column list that drops it) — otherwise search over localized text falls back to a slow path (a real HANA performance issue at scale).

### `@fiori.draft.enabled`

Distinct from `@odata.draft.enabled`. Applied to the **base entity in the base model** to support drafts for **localized data** — Fiori drafts need single UUID keys, which `.texts` entities lack, so the compiler adds a technical `ID_texts : UUID` key. ⚠️ **Gotcha:** initial-data CSVs must then manually carry an `ID_texts` column, or the HANA deploy breaks.

### Dynamic field control (CXL in annotations — GA)

```cds
@Common.FieldControl: (status = #Accepted ? #ReadOnly : #Mandatory)
bookingFee : Decimal(16,3) default 0;
```
Enum symbols are now usable directly in annotation expressions (previously magic numbers `1`/`7`). `@UI.Hidden` also supports expressions for dynamic visibility. Borderline UI, but it replaces handler-computed field control.

---

## 8. Plugin-Provided Annotations

### `@PersonalData.*` + `@cap-js/audit-logging`

```cds
annotate my.Customers with @PersonalData : {
  EntitySemantics : 'DataSubject',    // | 'DataSubjectDetails' | 'Other'
  DataSubjectRole : 'Customer'
} {
  ID           @PersonalData.FieldSemantics: 'DataSubjectID';
  name         @PersonalData.IsPotentiallyPersonal;    // → audit-logged on WRITE
  creditCardNo @PersonalData.IsPotentiallySensitive;   // → audit-logged on READ
}
```
**That WRITE/READ asymmetry is the most useful fact for the skill.** The plugin intercepts the ops, determines affected fields, and constructs the log message; routed through the transactional outbox. Node `@cap-js/audit-logging` (GA); Java `cds-feature-auditlog-v2` (GA).

**Detection** — `cds.connect.to('audit-log')`; **`.log('PersonalDataModified'` / `'SensitiveDataRead'`** — hand-emitting these two events is the strongest signal, as they're exactly what the annotations generate; Java `logDataAccess(`/`logDataModification(`.

**Justified** — **`ConfigurationModified` and `SecurityEvent`** (Java: `logConfigChange`, `logSecurityEvent`) have **no annotation equivalent**. Only flag the first two.

### `@changelog` + `@cap-js/change-tracking`

```cds
using { sap.changelog as changelog } from 'com.sap.cds/change-tracking';
extend my.Orders with changelog.changeTracked;                          // aspect
annotate AdminService.Orders { total @changelog; status @changelog; };  // element level
annotate AdminService.Incidents with @changelog: [ title, customer.name ];  // array = label
annotate AdminService.Books { author @changelog: (author.firstName || ' ' || author.lastName) };  // CXL
@changelog: false entity SomeEntity { ... }                            // disable
```
Node `@cap-js/change-tracking` (GA); Java `cds-feature-change-tracking`. **v2.0 moved tracking from the application layer to database triggers** (HANA Cloud, SQLite, PostgreSQL), so it captures modifications regardless of query shape. The **CXL expression form is from the April 2026 release** — requires a current plugin version.

**Detection** — a local `ChangeLog`/`ChangeHistory`/`AuditTrail` entity + `INSERT.into(...)` in an after-UPDATE; fields `valueOld`/`valueNew`; **`req._beforeImage`** or a before-UPDATE `SELECT.one` stashed for diffing — the classic before-image hand-roll.

**Justified** — 🔥 **`@PersonalData` data is deliberately NOT change-tracked**, to prevent circumventing audit logging. **A skill that suggests `@changelog` for a hand-rolled history table over personal fields gives wrong advice — route those to audit-logging instead.** Also: don't annotate `Association to many` or unmanaged associations. MTX needs CDS > 8.6 + MTX > 2.5, with the plugin in the sidecar's `package.json`.

### `@cap-js/attachments`

**Aspect, not annotation — there are no `@attachments.*` annotations** (confirmed on two sources).

```cds
using { Attachments } from '@cap-js/attachments';
entity Incidents { attachments : Composition of many Attachments; }
```
Provides upload/download/streaming, S3/Azure/GCP backends, **SAP Malware Scanning Service** integration, multitenancy, draft support, Fiori upload table, auto-integration with audit-logging. Node (GA; CAP ≥ 8.0.0, UI5 ≥ 1.136.0); Java `cds-feature-attachments`. Uses standard annotations alongside: `@Validation.Maximum` (size), `@Core.AcceptableMediaTypes` (MIME allow-list), `@Capabilities.UpdateRestrictions.NonUpdateableProperties`.

**Detection** — `@aws-sdk/client-s3`, `PutObjectCommand`, `@azure/storage-blob`; `on('READ'|'UPDATE', '*.attachments')`; hand-modeled `LargeBinary` + `@Core.MediaType`; custom MIME/size validation; any hand-rolled malware-scan call.

### `@notification` + `@cap-js/notifications`

```cds
@notification: { template: { title: 'Book {{title}} Ordered', publicTitle: 'Book Ordered',
                             subtitle: '{{buyer}} ordered {{title}}', groupedTitle: 'Bookshop Updates' } }
event BookOrdered { title : String; buyer : String; }
```
Any CDS `event` with `@notification.*` becomes a notification type; the build merges annotation-derived types with hand-written JSON into `notification-types.json`. **The plugin auto-injects a `recipients` element — don't declare it.** **Node.js only**, GA (SAP Build WorkZone).

> Source conflict resolved: capire's plugin index describes notifications as "a simple programmatic API" with no annotations. That's outdated — the README confirms `@notification` via exact-quote extraction.

**Detection** — `.notify({` with an **inline `title:`/`description:` object literal** (low-level form) rather than `.notify('TypeKey', { data })`; a hand-maintained `notification-types.json` with `TemplatePublic`/`TemplateGrouped` and no `@notification`-annotated events.

### `@hierarchy` — **core CDS, not a plugin** (verified)

```cds
annotate AdminService.Genres with @hierarchy;           // recursive assoc auto-detected
annotate AdminService.Genres with @hierarchy: parent;   // disambiguate multiple parent assocs
```
Shortcut on entities with recursive parent-child associations → Fiori Tree View. The compiler **expands it into** `@Aggregation.RecursiveHierarchy` + `@Hierarchy.RecursiveHierarchy` (computed `LimitedDescendantCount`, `DistanceFromRoot`, `DrillState`, `LimitedRank`, plus filter/sort restrictions). Supports create-as-root/child, modify, delete, re-parent. **Both runtimes, GA.** HANA + **SQLite/PostgreSQL via the new major `@cap-js/sqlite` / `@cap-js/postgres`**. 2026 additions: managed associations with explicit foreign keys (`cds-compiler@6.7.0`/`6.9.0`); fuzzy search in hierarchy queries (Java).

**Detection** — hand-written `@Aggregation.RecursiveHierarchy` blocks → collapse to `@hierarchy`; `DrillState`/`DistanceFromRoot` computed in JS; a recursive `parent` association + a custom `on('READ')` that builds or flattens a tree.

### Other plugins

| Plugin | Annotation-driven? | Status |
|---|---|---|
| `@cap-js/data-privacy` | `@PersonalData`, `@ILM` | **Beta**, Node only — keep out of a lint-style skill |
| `@cap-js/graphql` | `@graphql` | GA, Node only |
| `@cap-js/sdm` | uses `Attachments` aspect | GA, Node + Java |
| `@cap-js/telemetry` | **No — config-driven.** No annotation found | GA |
| `@cap-js/ai` | auto-detects draft Fiori fields | GA Node / **Alpha Java** |

---

## 9. Recently Added (last ~2 years)

| Feature | Annotation | Maturity | Runtimes | When |
|---|---|---|---|---|
| **Status-Transition Flows** | `@flow.status`, `@from`, `@to`, `$flow.previous` | **Gamma** (not GA) | Node built-in; Java needs `cds-feature-flow` | Beta Nov 2025 → Gamma Dec 2025 |
| **Declarative Constraints** | `@assert: (case…end)` | **GA** | both | Gamma Dec 2025 → **GA Apr 2026** |
| **Hierarchies** | `@hierarchy` | GA | both | Dec 2025; enhanced Jan/Apr 2026 |
| **Change Tracking v2** | `@changelog` + CXL form | GA | both | CXL form Apr 2026; v2 moved to DB triggers |
| **HCQL protocol** | `@hcql` | **Beta** | both (read/SELECT; write stability not guaranteed) | Jun 2026 (`cds@10`) |
| **MCP protocol** | `@mcp` | **Beta** | **Node only** (Java internal) | Jun 2026 (`cds@10`) |
| **Expressions in annotations** | `@Common.FieldControl: (x ? #ReadOnly : #Mandatory)` | GA | both | enum symbols replace magic numbers |
| **Minification opt-out** | `@cds.minify: false` | — | Node | `cds@10.0.0` |
| **Vector embeddings** | `vector_embedding()` CQL fn + on-write calculated elements | — | HANA | Apr 2026 |

`@mcp` note: CAP deliberately **did not invent a new vocabulary** — MCP reuses `/** doc comments */`, `@title`, `@description` to give the LLM context. Tailored interfaces = ordinary services with projections.

---

## 10. Fabrication Guard

**Names that do not exist.** Each is a plausible-sounding name that surfaced during research and
was then checked against primary sources and found to be fiction. Unknown annotations **do not error in CDS — they are silently ignored**, so emitting any of these would produce inert code that looks correct. This is the highest-risk failure mode for the downstream skill.

| Name | Verdict | What's real instead |
|---|---|---|
| `@restrict … for:` | ❌ **Does not exist** | Keys are exactly `grant`, `to`, `where`. A `for:` key is silently ignored → **fails open** |
| `@assert.constraint` | ❌ **Does not exist** | The feature is the **unsuffixed** `@assert: (...)`. `.<name>` suffixing applies only to `@assert.unique.<name>` |
| `@cds.map` / `@cds.map.*` | ❌ **Does not exist** | `cds.Map` is a **built-in type** (schemaless JSON → NCLOB on HANA), not an annotation |
| `@cds.etag` | ❌ **Does not exist** | It is **`@odata.etag`** |
| `@odata.draft.bypass` | ❌ **Does not exist** | Config `cds.fiori.bypass_draft: false` + the `IsActiveEntity=true` key |
| `@cds.outbox` / `@cds.persistent.outbox` / `@queue` | ❌ **Do not exist** | Config (`outboxed: true`, `kind: 'persistent-outbox'`, `queue.name`) + APIs (`cds.queued()`, `OutboxService.outboxed()`) |
| `@cds.default.order` | ❌ **Does not exist** | Plain `order by` in the projection |
| `@cds.tx.*` | ❌ **Does not exist** | `cds.tx()` (Node) / `ChangeSetContext` (Java). **No declarative transaction signal exists** |
| `@ams.publicFields` | ❌ **Does not exist** | The `@ams` family is **one** annotation: `@ams.attributes` |
| `@AuditLog.Operation` | ❌ **Believed not to exist** | Checked 4 sources, found in none. Audit logging is driven by `@PersonalData.*` + `handle` config |
| `@attachments.*` | ❌ **Does not exist** | The plugin ships **aspects** (`Attachments`/`Attachment`) and reuses `@Validation.*`/`@Core.*` |
| `@assert.notNull: true` | ❌ **No positive form** | Only `: false` (opt-out) is documented. Use `@mandatory` / `not null` |
| `@cds.autoexposed` (hand-written) | ⚠️ **Compiler-owned** | You write `@cds.autoexpose`; the compiler stamps `@cds.autoexposed` |

---

## 11. Confidence & Gaps

**Resolved by runtime probe** (`@sap/cds` 9.8.4, Node — see the skill's Phase 2.5). These began as
doc gaps and were settled empirically against a control; where a probe and capire disagree, the
probe wins:

- **`@mandatory` on action/function parameters** — *works*. Rejects omitted/`null`/`''`/whitespace,
  `target` = param name. Capire's constraints page is silent on this. Now documented in §2.
- **`@mandatory.message`** — *silently ignored*. Collapses to a global `ASSERT_MANDATORY` key.
- **`@mandatory` on a `many` param** — *passes `[]`*. Empty-collection guards stay Justified.

**Could not verify — do not let the skill assert these:**

1. **`@inapplicable`** — appears **only** in the 2026 changelog (`cds.java@4.8.0`: "Improved handling of `@assert` and dynamic `@mandatory`/`@inapplicable`"). **Not on the constraints page, not in the annotations reference, no syntax anywhere.** It probably relates to Fiori field control (`FieldControlType/Inapplicable`), but I will not assert that. **Real but undocumented — flag as "exists, syntax unknown."** This is the biggest open gap.
2. **Dynamic `@mandatory`** — the changelog references it and `@Common.FieldControl: (expr)` demonstrably takes CXL, but the constraints page still says `@mandatory` drives field control in its **static form only**. The dynamic form's exact syntax is unconfirmed.
3. **`@cds.valid.key`** — The annotations reference documents only `@cds.valid.from`/`.to`, and the temporal page does **not** contain the string. Capire says the conceptual key is *derived* ("key + validFrom"), needing no annotation. There is a vague recollection of it existing in the compiler for disambiguation — **verify against `@sap/cds-compiler` source or `cds compile --to json` before encoding.**
4. **`@assert.notNull` on Node.js** — confirmed for **Java only** (Oct 2020 release note, Java SDK section).
5. **Null-handling of `@assert.range`** on nullable elements — not documented. Don't claim null passes *or* fails; pair with `@mandatory` when presence matters.
6. **Current default of `cds.features.assert_integrity`** — "off unless `db`" is strongly implied by the Jun 2022 deprecation note + present docs' silence, but no current verbatim statement of the default exists.
7. **`@Capabilities.*` beyond Insert/Update/DeleteRestrictions** — `Filter`/`Sort`/`Expand`/`CountRestrictions` are **unconfirmed** as runtime-enforced. Don't generalize from the three that are.
8. **`@readonly` → `@Capabilities` desugaring in CSN** — the docs state runtime enforcement "analogously" and `@readonly ≡ @restrict:[{grant:'READ'}]`, but **not** that it materializes as `@Capabilities` in CSN.
9. **`@protocol`/`@protocols` on Node.js** — documented under CAP **Java**; Node docs describe the fluent API instead. Treat Node support as unconfirmed, not absent. (`@protocol: 'none'` is runtime-agnostic.)
10. **`@ams` maturity** — `cap-users.md` shows no beta marker; `docs/java/ams` is titled "beta". Unreconciled.
11. **`@cds.persistence.mock`** — exists per the annotations reference (`false` excludes from auto-mocking), but no worked example. Low confidence.
12. **`@cds.java.*`** — only `@cds.java.version` confirmed. **Do not generalize the family.**
13. **`@cap-js/data-privacy` `@ILM`** and **`@graphql`'s annotation form** — each rests on a **single source** (capire's plugin index). `data-privacy` is **Beta**.
14. **Version floor for `@assert: (case…end)`** — the docs page gives no per-runtime version matrix.

**Doc URL drift** (worth encoding, several old paths 404): `guides/providing-services#input-validation` → **`guides/services/constraints`**; `guides/providing-services` → `guides/services/providing-services.md` + `guides/services/served-ootb.md`; messaging → `guides/events/`; DB constraints live separately at `guides/databases/cdl-to-ddl`.

**Suspected but unpinned:** given the Gamma→GA cadence of `@assert` (Dec 2025 → Apr 2026), `@flow` is plausibly a GA candidate in a late-2026 release — but **it is Gamma today** and the skill should re-check rather than assume.

**Grounding check against Life OS** (CAP Node/TS): the detection patterns fire on real code — 22 hits across 8 files for `req.data.<x> =` / `delete req.data.` / `req.user.is(` / `new Date()` / `SELECT.one` / `.test(`. The model uses `@mandatory`, `@assert.unique`, `@assert.range`, `@assert.format`, `@cds.autoexpose`, `@odata.draft.enabled`, `@readonly`, `@Capabilities.*Restrictions` — but **no** `@flow.status`, `@assert: (case…)`, `@assert.target`, `@restrict`, `@requires`, or `@odata.etag`, despite an enum `status` field with bound actions. ⚠️ **Important false-positive caveat this surfaced:** most `SELECT.one` hits live in `*DataService.ts` files, which are a deliberate data-access layer, not handlers. **The skill must distinguish handler code from a DataService/repository layer** — a `SELECT.one` in a DataService is architecture, not a missed annotation.

---

## 12. Quick Detection Table

Ranked by expected hit rate. **The single highest-yield grep across the entire reference is `delete req.data\.|req\.data\.\w+\s*=` in `srv/`** — nearly every annotation here exists to remove a line of that shape.

| Imperative pattern (grep in `srv/`) | Replace with | Confidence |
|---|---|---|
| `req.data.createdAt = new Date()` / `= req.user.id` | `managed` aspect / `@cds.on.insert: $now`\|`$user` | ★★★ |
| `req.data.ID = cds.utils.uuid()` / `uuidv4()` / `randomUUID()` | `cuid` aspect (UUID keys auto-fill) | ★★★ |
| `delete req.data.<field>` in before-UPDATE | `@Core.Immutable` | ★★★ |
| `delete req.data.<field>` in before-CREATE **and** UPDATE | `@Core.Computed` / element `@readonly` | ★★★ |
| `if (!req.data.x) req.error(...)` | `@mandatory` | ★★★ |
| **`if (!command.x)` / `!request.x` in a `*Validator.ts`, errors array** | `@mandatory` **on the action param** (verified; undocumented) | ★★★ |
| `if (x.length === 0)` on a `many` param | **nothing — `@mandatory` passes `[]`.** Justified, or `@assert: (case…)` | ★★★ |
| Two validators for one entity; only one is called | **Dead code** — delete; check drift first | ★★☆ |
| `req.data.a > req.data.b` (cross-field compare) | `@assert: (case…end)` | ★★★ |
| `.test(` / `new RegExp(` / `*_PATTERN` on `req.data` | `@assert.format` | ★★★ |
| `req.data.x < 0` / `> 100` vs a literal | `@assert.range` | ★★★ |
| `.includes(` against `ALLOWED_*`/`VALID_*` array | `@assert.range enum` | ★★★ |
| `req.user.is('X')` + `req.reject(403)`, no data predicate | `@requires` / `@restrict.to` | ★★★ |
| `req.query.where({ buyer: req.user.id })` in before-READ | `@restrict: [{ where: (buyer = $user) }]` | ★★★ |
| **`req.user.attr`** used to filter | `@restrict: [{ where: ($user.attr = field) }]` | ★★★ |
| `SELECT` membership table → `.map(r => r.x_ID)` → `in:` | `@restrict: [{ where: (exists members[...]) }]` | ★★★ |
| `SELECT.one` + `req.error(409, 'already exists')` | `@assert.unique.<name>` (+ keep a friendly pre-check) | ★★☆ |
| `SELECT.one.from(T).where({ ID: req.data.x_ID })` + not-found error | `@assert.target` | ★★★ |
| before-DELETE + child SELECT + "cannot delete" | `assert_integrity: db` (**@assert.target doesn't cover DELETE**) | ★★☆ |
| `req.reject(405)` on all write events, unconditional | `@readonly` / `@insertonly` / `@Capabilities.*` | ★★★ |
| `req.reject(409)` in before-`<actionName>` comparing `status` | **`@flow.status` + `@from`/`@to`** | ★★★ |
| `UPDATE(X).set({ status: 'Const' })` in on-`<action>` | **`@to: #Const`** | ★★★ |
| Hand-rolled `previousStatus` column | **`@to: $flow.previous`** | ★★☆ |
| `if-match` / `412` / manual version compare | `@odata.etag` (+ `@cds.on.update: $now`) | ★★★ |
| `'draftActivate'` / `'draftEdit'` / `IsActiveEntity` in handlers | `@odata.draft.enabled` | ★★★ |
| Role/ownership gate on `draftActivate`/`draftEdit` | **nothing — draft auth is derived** | ★★★ |
| `req.query.SELECT.limit` mutation / `1000` literal | `@cds.query.limit(.default/.max)` | ★★★ |
| `SELECT.orderBy` assignment in before-READ | `order by` in the projection | ★★★ |
| `$search` + `like '%${...}%'` (also SQL-injection risk) | `@cds.search` | ★★★ |
| `.texts` join / `req.locale` filtering / after-READ text loop | `localized` keyword | ★★★ |
| `after('READ')` loop doing `delete row.secret` | `@cds.api.ignore` | ★★☆ |
| `.log('PersonalDataModified'` / `'SensitiveDataRead'` | `@PersonalData.IsPotentiallyPersonal`\|`IsPotentiallySensitive` | ★★★ |
| `INSERT.into(ChangeLog)` w/ `valueOld`/`valueNew`; `req._beforeImage` | `@changelog` (**unless fields are `@PersonalData` → audit-log**) | ★★★ |
| `@aws-sdk/client-s3` / `on('UPDATE','*.attachments')` | `Attachments` aspect | ★★☆ |
| `.notify({ title, description })` inline | `@notification.template.*` on an event | ★★☆ |
| Recursive `parent` assoc + tree-building `on('READ')`; `DrillState` in JS | `@hierarchy` | ★★☆ |
| `messaging.emit('<dotted.FQN>')` hard-coded | `@topic` + `this.emit('<localName>')` | ★★☆ |
| Remote `.send()` in an `after` handler (lost on rollback) | `outboxed: true` config / `cds.queued()` (**not an annotation**) | ★★☆ |
| `db.run(\`SELECT … FROM SCHEMA.TABLE\`)` | `@cds.persistence.exists` | ★★☆ |
| `on('READ')` never touching the entity's own table | `@cds.persistence.skip` | ★★☆ |
| Hand-written `.hdbmigrationtable` | `@cds.persistence.journal` (⚠️ **breaks MTX extensibility**) | ★☆☆ |
| Hand-written `@Aggregation.RecursiveHierarchy` block | `@hierarchy` | ★★☆ |
| `cds.serve(...).at('/x')` / `.with(...)` in `server.js` | `@path` / `@impl` | ★★☆ |
| **Model smells (grep `db/`)** | | |
| `createdAt : Timestamp default $now` | **`@cds.on.insert: $now`** — `default` lets clients forge it | ★★★ |
| `@odata.etag` with no `@cds.on.update` on that field | broken concurrency that *looks* fine | ★★★ |
| `@assert.enum` anywhere | `@assert.range enum` (deprecated 2020; **silently doesn't fire**) | ★★★ |
| `@assert.notNull` not followed by `: false` | author meant `@mandatory` | ★★★ |
| `@cds.search: { onlyField }` on an entity with `@Common.Text` | include-mode drops `@Common.Text` from search | ★★☆ |
| `$user.<attr> = field` with no `or $user.<attr> is null` | absent attribute ⇒ **fully denied** (may be intended) | ★★☆ |
| Hand-written `@cds.autoexposed` | compiler-owned — a bug | ★★☆ |
| `@fiori.draft.enabled` + `_texts.csv` lacking `ID_texts` | broken HANA deploy | ★★☆ |
| enum `status` + 2+ bound actions, no `@flow.status` | **`@flow` candidate** | ★★☆ |

**Cross-cutting rules for the downstream skill:**

1. **Distinguish handler code from a data-access layer.** A `SELECT.one` in a `*DataService.ts`/repository is architecture; the same call in a `before('CREATE')` is a missed annotation. (Learned from the local project.)
2. **Wrong auth annotations fail *open*, silently** — unsupported `@restrict` properties are ignored, not rejected. Auth findings deserve higher severity than validation findings.
3. **Unknown annotations are silently ignored by CDS** — a fabricated suggestion produces inert code that reviews as correct. Prefer omitting an uncertain rule over guessing.
4. **Node vs Java diverge materially**: deep/expand authorization, regex dialect, `internal-user` naming, draft-agnostic requests, `@protocol` support, `@assert.notNull`. Gate rules on the project's runtime.
5. **SQLite gaps** matter because it's CAP's default test DB: no temporal time-travel, no session variables for localized data, no `FOR UPDATE` locking. A rule that's right in production may be untestable locally.
6. **`@PersonalData` × `@changelog`**: change tracking deliberately refuses personal data so it can't bypass audit logging. Never suggest `@changelog` for personal fields.