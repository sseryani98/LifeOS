# MCP TypeScript SDK — Capability Catalogue

**Written against:** `@modelcontextprotocol/sdk` **1.30.0**
**Declared floor in `Project Tracker/package.json`:** `^1.29.0`
**Protocol era:** legacy (2025 revisions). The current spec revision is `2026-07-28`.
**Derived from:** `research/mcp-sdk-typescript-surface.md` (RSH-006), 2026-08-27

> **Phase 0 refuses this reference if `node_modules/@modelcontextprotocol/sdk/package.json` does not
> say `1.30.0`.** Do not "adjust for" a version drift — re-derive by probe, or stop. A catalogue
> quietly applied to the wrong version is the failure this header exists to prevent.

Navigate by section. Three sections carry every run: **§13 Quick Detection**, **§11 Fabrication
Guard**, **§12 Confidence & Gaps**.

---

## 1. The version rule

The **declared floor binds a fresh clone**, not the resolved version. `npm ci` on another machine
installs 1.29.0. Anything proposed must exist at **1.29.0**, or the proposal breaks a clone while
working on this laptop. Same hazard class as R11 (the unpinned global `@sap/cds-dk`).

`^1.29.0` is a floating range on the **wire contract** — see R12 and D-239.

---

## 2. `McpServer` construction

```ts
new McpServer(serverInfo, serverOptions?)
```

- `serverInfo`: `{ name, version, title? }`.
- `serverOptions`: `{ capabilities?, instructions? }`.

**A bare constructor declares no `logging` capability**, so `sendLoggingMessage` is unreachable.
`instructions` — "optional instructions describing how to use the server and its features" — is
returned in the initialize result and is the one place to state a server's operating rules once,
rather than repeating them across every tool description.

`INT-001` passes no `serverOptions`. Both consequences are deliberate-by-omission, not chosen; see
`contract-map.md` and RSH-007 §5 finding 8.

---

## 3. Tools

`registerTool(name, config, handler)` is the modern API. `server.tool(...)` overloads remain in the
`.d.ts` and are **deprecated**. Raw `setRequestHandler(ListToolsRequestSchema, …)` is the low-level
escape hatch, not the recommended path.

`config` keys at 1.30.0: `title`, `description`, `inputSchema`, `outputSchema`, `annotations`,
`_meta`.

- `title` belongs at the **top level** (modern), not in `annotations.title` (legacy). `INT-001` gets
  this right.
- `description` must be given explicitly — **JSDoc is not extracted**.
- `inputSchema` accepts a Zod raw shape (`{ a: z.string() }`) or a full `z.object(...)`.
- A tool with no parameters should advertise `{ type: "object", additionalProperties: false }`, not a
  bare `{}`.

**Naming:** 1–128 chars from `A-Za-z0-9_-.`, no spaces, unique per server. Vendor guidance is
snake_case, action-oriented, **service-prefixed** (`slack_send_message`), because servers are loaded
alongside each other and `serverInfo.name` is explicitly _not_ reliable for disambiguation.

**Ordering must be deterministic** — the spec ties it to prompt-cache hit rates. A source-order array
satisfies this by construction.

`tools/list` is paginated (`cursor` / `nextCursor`). The tool set MUST NOT vary per connection,
though it MAY vary by authorization.

**Description quality** is the highest-leverage lever on the whole surface — vendor guidance credits
description refinement as a material contributor to a SWE-bench result. The reference format carries
named sections: summary, what it does _not_ do, `Args:`, `Returns:` with schema inline, `Examples:`
with both "use when" and "don't use when", and `Error Handling:` with literal error strings.

---

## 4. Tool annotations — read §11 before proposing any of these

| Annotation        | Default **when the key is absent** |
| ----------------- | ---------------------------------- |
| `readOnlyHint`    | `false`                            |
| `destructiveHint` | **`true`**                         |
| `idempotentHint`  | `false`                            |
| `openWorldHint`   | **`true`**                         |

`destructiveHint` and `idempotentHint` are meaningful **only** when `readOnlyHint` is false.

**Two defaults are pessimistic.** A tool that sets only `readOnlyHint: false` is advertising itself
as potentially irreversible _and_ reaching external systems. Set all four explicitly even where the
value matches the default — a client cannot distinguish "unset" from "deliberately false."

**Probe-VERIFIED, 2026-08-27 (§12 #7):** omitted annotations are **absent from the wire, not
materialised**. A tool with no annotations advertises no `annotations` key at all; a tool setting one
advertises exactly one. **The pessimistic default is therefore applied by the _client_, from
nothing** — the server never gets a chance to be read as "deliberately false." That is the whole
argument for setting all four, and it is measured rather than reasoned.

There is active spec work on a fifth, `unsafeOutputHint` (SEP-1561). **Not adopted — do not use.**

---

## 5. Structured output

`outputSchema` on the config; the handler returns `{ content: [...], structuredContent: output }`.

- Spec: if `outputSchema` is provided, servers **MUST** return conforming structured results, and
  clients **SHOULD** validate.
- For backwards compatibility a tool returning structured content **SHOULD** also return the
  serialized JSON in a text block.
- Output schemas may be objects **or** arrays.

**The historical trap is gone.** SDK issue #654 — output validated _before_ the `isError` check, so a
tool with an `outputSchema` could not report an error at all — is **fixed at 1.30.0**:
`validateToolOutput` short-circuits on `if (result.isError) { return; }`. The client mirrors it.

Consequence for a discriminated envelope: the success arm can declare an `outputSchema` while the
failure arm rides `isError` untouched.

**Probe-VERIFIED, 2026-08-27 (§12 #1).** A deliberately non-conforming `{ok:false, …}` envelope
returned with `isError: true` from a tool that declares an `outputSchema` **does not throw** — it
arrives with `isError: true` and `structuredContent: undefined`. The success arm returns
`structuredContent` parsed, with `isError` **`undefined`, not `false`**. So this is a measured fact,
not a source reading — which matters, because it is the fact D-241 rests on.

---

## 6. Errors

The spec's dividing line, which is also the right mental model for review:

- **Protocol error** (JSON-RPC `error`): a problem with the request _structure_ "that models are less
  likely to be able to fix" — unknown tool, malformed request.
- **Tool execution error** (`isError: true` in the result): "actionable feedback that language models
  can use to self-correct and retry." Clients **SHOULD** pass these to the model.

A thrown exception inside a handler is caught by `McpServer` and converted to an `isError` result via
`createToolError` — so throwing "works," but it discards structure and leaks `error.message`.
Returning an explicit envelope is the documented path.

Model error message, from the spec itself — note it supplies the fact needed to fix it:
`"Invalid departure date: must be in the future. Current date is 08/08/2025."`

Remediation text guiding the model to a next step is established practice. Remediation as a
**separate structured field** is not documented, but is a strict superset **provided the field
reaches the text the model actually reads**.

Servers **MUST** sanitize tool outputs. Do not leak stack traces, SQL, or internal paths.

---

## 7. Resources

`registerResource(name, uriOrTemplate, config, handler)`; `ResourceTemplate` for parameterised URIs;
`sendResourceListChanged()`; completions.

Resources are **application-controlled** and read-only. They "should not perform heavy computation or
side-effects. They are ideal for configuration, documents, or other reference data."

A tool MAY return a `resource_link` instead of an inlined payload — the middle path for a tool that
currently returns a large composed tree.

**Tools-only is the modal case, not a smell.** Anthropic's own `mcp-builder` skill never instructs
you to add resources or prompts. Client support for resources is materially thinner than for tools.

**But note the control axis** — Tools are model-controlled, Resources application-controlled, Prompts
user-controlled. A resource cannot mutate state, so adding one does not reopen a no-write-escape-hatch
ruling. Treat "should this be a resource" as a **fork**, never as a fix and never as a violation.

---

## 8. Prompts

`registerPrompt(name, config, handler)`; `sendPromptListChanged()`. User-controlled, surfaced as slash
commands or a command palette. Their documented purpose includes "showcase how to best use the MCP
server."

---

## 9. Logging

`server.sendLoggingMessage(...)` requires the `logging` capability to have been declared in
`ServerOptions`. Without it the call is unreachable.

**`2026-07-28` deprecates `notifications/message` logging** — clients opt in per request via
`_meta.io.modelcontextprotocol/logLevel`. **stderr remains the recommended approach for stdio
servers and is unaffected**, so a stderr redirect is the mechanism, not a workaround.

---

## 10. Transports

| Transport                              | Status                                        |
| -------------------------------------- | --------------------------------------------- |
| stdio                                  | For local, process-spawned integrations       |
| Streamable HTTP                        | Recommended for remote; use stateless JSON    |
| HTTP + SSE                             | **Deprecated** — backwards compatibility only |
| `InMemoryTransport.createLinkedPair()` | Testing                                       |

**stdout purity is normative and absolute.** The server MUST NOT write anything to stdout that is not
a valid MCP message; messages are newline-delimited and MUST NOT contain embedded newlines; stderr is
free for logging, and clients SHOULD NOT read stderr as indicating errors.

**Shutdown:** _"Servers SHOULD exit promptly when their standard input is closed or reads return
end-of-file. This is the primary graceful-shutdown signal and the only portable one."_ On Windows,
POSIX signals are unavailable — clients use `TerminateProcess` or Job Objects.

**Cancellation:** client sends `notifications/cancelled`; the server SHOULD stop work promptly and
MUST NOT send further messages for that request.

**`InMemoryTransport` passes messages by reference — no `JSON.stringify`, no `structuredClone`.**
It therefore cannot catch: non-serializable payloads (`Date`, `undefined`, `BigInt`, `Map`, circular
refs), newline framing, stdout purity, process bootstrap, env/cwd, shutdown, or backpressure.

---

## 11. Fabrication Guard

**Never propose an API from this section. Never propose one absent from §2–§10 without a §Phase 2.5
probe.**

### Names that sound right and are wrong at 1.30.0

| Fabrication                                                          | Reality                                                                   |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `server.addTool(...)`                                                | Does not exist. It is `registerTool`.                                     |
| `server.tool(...)`                                                   | Exists but is **deprecated**. Not a fabrication — a wrong recommendation. |
| `annotations.title`                                                  | Legacy location. Top-level `title` is correct.                            |
| `server.sendLoggingMessage(...)` with no declared capability         | Unreachable, not merely unused.                                           |
| `unsafeOutputHint`                                                   | SEP-1561, **not adopted**.                                                |
| `@modelcontextprotocol/server` / `/client` / `/core` imports         | **v2.0.0 packages.** Correct for v2, non-existent on our v1 line.         |
| `serveStdio(factory)`, `createMcpHandler`                            | v2 APIs.                                                                  |
| `server/discover`, `resultType`, per-request `_meta` protocol fields | **`2026-07-28` protocol.** Our SDK speaks the legacy era.                 |

### The two silent traps — the reason this guard exists at all

These compile, ship, pass review, and do nothing. They are this SDK's analogue of a fictional CDS
annotation.

1. **`ToolAnnotations` are hints, not enforcement.** The SDK's own type definitions say it: _all
   properties in `ToolAnnotations` are **hints**… Clients should never make tool use decisions based
   on `ToolAnnotations`._ The spec adds that clients **MUST** treat annotations from untrusted
   servers as untrusted.
   **So: propose annotations as honest metadata — they drive confirmation prompts, auto-approval and
   UI. Never propose one as a safety mechanism or a control.** A finding row that says
   "`destructiveHint: false` prevents a host from running this without asking" is wrong in the way
   that matters, and the row must say which of the two it means.
2. **`_meta?: Record<string, unknown>` is untyped** and swallows anything. TypeScript will not catch a
   misspelled or invented `_meta` key.

### Version-floor guard

A proposal valid at 1.30.0 but absent at **1.29.0** breaks `npm ci` on a fresh clone. When a §2–§10
capability is near the floor, say so in the row's note or verify it.

### If a candidate is not in this reference

Either probe it (Phase 2.5) and add it, or **report the finding with no suggested API**. _"The server
does this by hand and I believe the SDK covers it; I could not confirm which call"_ is an honest,
useful row. A fabricated API is not.

---

## 12. Confidence & Gaps

Everything in §2–§11 is documentation- and source-reading **except the seven questions below**, five
of which were settled by probe on 2026-08-27 against the installed 1.30.0, with a control twin.

### Settled by probe — **VERIFIED**, 2026-08-27

| #     | Question                                                               | Result                                                                                                                                                                                                                                                                                                                                           |
| ----- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **1** | Does declaring `outputSchema` reject an `{ok:false}` failure envelope? | **No — no throw.** A deliberately non-conforming failure envelope returned with `isError: true` passes through untouched; `structuredContent` is `undefined`. **This is what makes a discriminated envelope safe to adopt `outputSchema` on the success arm alone.**                                                                             |
| **5** | Does `title` reach the client distinctly from `name`?                  | **Yes.** `{ name: "with_schema", title: "With schema" }` — separate fields on the wire.                                                                                                                                                                                                                                                          |
| **6** | What does a client see for a success with `structuredContent`?         | `isError` is **`undefined`, not `false`**, and `structuredContent` arrives parsed. Assert on absence, not on `=== false`.                                                                                                                                                                                                                        |
| **7** | Are omitted annotation defaults materialised on the wire?              | **Absent, not materialised.** A tool with no annotations advertises **no `annotations` key at all**; a tool setting only `readOnlyHint` advertises only that one. So **the pessimistic default is applied by the _client_, from nothing** — which is precisely why setting all four explicitly is the fix, and why §4's warning is not pedantry. |
| **3** | What does `tools/list` emit for a zod-4 `.describe()`?                 | It survives as JSON Schema `description`, draft-07. **But note the asymmetry:** the emitter adds `additionalProperties: false` to an **`outputSchema`** and **not** to an `inputSchema`.                                                                                                                                                         |

### Settled by probe — a finding the documentation did not predict

**4 · An unknown key in `arguments` is silently ACCEPTED** — not stripped with a warning, not
rejected. `{ fail: false, bogus: 1 }` returned a normal success. Combined with the asymmetry above,
this means **an input surface built from a bare Zod raw shape is accidentally permissive**: a client
sending a misspelled or stale parameter gets a successful call that ignored it, with no signal.
`.strict()` on the shape closes it. Treat this as a live checklist item, not a curiosity.

**4a · The `.strict()` fix is itself now probe-VERIFIED, 2026-08-27** — it was inference when 4 was
written. Three tools on one server, one handler, same call `{ a: "ok", bogus: 1 }`:

| `inputSchema` passed as                | Emitted `inputSchema`             | Call with an unknown key                                                                   |
| -------------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------ |
| `{ a: z.string() }` (raw shape)        | no `additionalProperties`         | **accepted** — handler saw `["a"]`, `isError` undefined                                    |
| `z.object({ a: z.string() })`          | no `additionalProperties`         | **accepted** — the object form alone changes nothing                                       |
| `z.object({ a: z.string() }).strict()` | **`additionalProperties: false`** | **rejected** — `isError: true`, `-32602 Input validation error: Unrecognized key: "bogus"` |

Two consequences the earlier one-liner did not state. **The object form is not the fix — `.strict()`
is**, and the middle row is the control that proves it. And `.strict()` requires passing a **full
`ZodObject`**, not a raw shape, so any codebase typing its config field as `ZodRawShape` must widen
that type before the fix is even expressible.

**Rejection happens SDK-side, before the handler runs**, and surfaces as an `isError` result carrying
a JSON-RPC `-32602` string — _not_ as the server's own error envelope. A server with a discriminated
result envelope gains a second, differently-shaped failure form on the wire at the same time.

### Still unprobed — do not assert

**2 · Does `sendLoggingMessage` throw, or silently no-op, with no `logging` capability declared?**
The distinction matters: a throw is a bug a test would catch, a silent no-op is a capability that
looks present and is not.

**Zod 4 is not the wire.** `zod@^4.4.3` sits behind the SDK's own compat emitter. What reaches
`tools/list` is what _that emitter_ produces, not what zod means. **No zod construct should be
assumed to survive to the wire without a probe.**

**Not covered:** MCP Extensions (Tasks — async long-running calls with durable handles; MCP Apps;
Skills-over-MCP). Tasks would matter if a verb ever became long-running. The 2026-08-22 MCP roadmap
post was not read.

**Vendor docs are themselves slightly stale on versions** — the `mcp-builder` skill's example
manifest pins `sdk ^1.6.1` and `zod ^3`. Its design guidance is unaffected; its version numbers are
not quotable.

---

## 13. Quick Detection Table

_The code does X by hand → the SDK offers Y._ Ranked by hit rate. **Start here.**

| Look for                                               | Points at                                          | Section | Note                                                                                                                                                             |
| ------------------------------------------------------ | -------------------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `JSON.stringify(result)` into a text block, every tool | `outputSchema` + `structuredContent`               | §5      | Largest available improvement. Check the failure arm rides `isError`.                                                                                            |
| `annotations: { readOnlyHint: … }` and nothing else    | The other three annotations                        | §4      | Two defaults are `true`. **Read §11 first** — metadata, not enforcement.                                                                                         |
| `new McpServer(info)` with one argument                | `ServerOptions.instructions`                       | §2      | Cheapest win for a workflow-enforcing server.                                                                                                                    |
| One-line tool descriptions                             | The sectioned description format                   | §3      | Highest-leverage per vendor evidence.                                                                                                                            |
| An input field with no `.describe()`                   | Per-parameter documentation                        | §3      | The only per-parameter doc a client ever sees.                                                                                                                   |
| An `inputSchema` from a bare raw shape, no `.strict()` | `.strict()` on the shape                           | §12 #4  | **Probe-VERIFIED:** an unknown argument key is silently accepted. The emitter adds `additionalProperties: false` to `outputSchema` and **not** to `inputSchema`. |
| A tool returning an unbounded collection               | Pagination / a character ceiling / `resource_link` | §3, §7  | Scaling cliff. `CHARACTER_LIMIT = 25000` is the reference pattern.                                                                                               |
| Generic tool names without a service prefix            | Collision risk when co-loaded                      | §3      | Renaming breaks callers — usually record, don't propose.                                                                                                         |
| An error string that is a bare code                    | Actionable remediation                             | §6      | Give the model the fact it needs to retry.                                                                                                                       |
| A `throw` inside a tool handler                        | An explicit `isError` envelope                     | §6      | Throwing works but discards structure.                                                                                                                           |
| Reference data re-fetched per tool call                | A resource                                         | §7      | A **fork**, not a fix. Never a violation.                                                                                                                        |
| `server.tool(`                                         | `registerTool`                                     | §3      | Deprecated overload.                                                                                                                                             |
| Anything imported from `@modelcontextprotocol/server`  | Wrong major                                        | §11     | v2 package on a v1 line.                                                                                                                                         |
| Free text stored then returned into model context      | Output sanitization                                | §6      | A spec-level MUST.                                                                                                                                               |
