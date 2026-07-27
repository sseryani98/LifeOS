# PreToolUse Hooks: A Hook Can Hard-Deny a Write and the Denial Reason Reaches the Model

**Document ID:** RSH-004
**Version:** 1.0
**Date:** 2026-07-26
**Status:** Draft

---

## 1. Change History

| Date       | Author          | Description                               |
| ---------- | --------------- | ----------------------------------------- |
| 2026-07-26 | Sandro & Claude | Initial creation from the Research stage. |

---

## 2. The grounding, in one paragraph

**A `PreToolUse` hook can hard-deny a `Write` or `Edit` tool call and deliver an explanatory
string that Claude — not just Sandro — reads, and it fires for tool calls made inside subagents.**
The mechanism `INT-006(a)` needs exists and is documented. Three details in the prior assumption
are wrong or stale: `MultiEdit` is not a tool in the installed Claude Code (v2.1.90), so that
alternative in the matcher matches nothing; `NotebookEdit` is a live file-writing tool whose input
field is `notebook_path`, not `file_path`; and `.claude/settings.json` is **gitignored in this
repo**, so a project-scoped hook is not a committed artifact the way BA-001 assumes. The `Bash`
carve-out in D-07 is factually sound as stated but understates the loophole: `Bash`, `NotebookEdit`,
and any MCP server with a file-write verb all bypass a `Write|Edit`-only matcher.

**Mode:** Ground · **Feeds:** INT-006(a), D-07, PLAN §6 "Rewire tooling" · **Researched:**
2026-07-26

**Source and version caveat.** Every contract claim below is dated **2026-07-26** and read from
`https://code.claude.com/docs/en/hooks` (the `docs.claude.com/en/docs/claude-code/hooks` URL now
301-redirects there) and `https://code.claude.com/docs/en/hooks-guide`. The published reference
documents features up to **v2.1.218**; the Claude Code installed on this machine is **v2.1.90**
(`claude --version`, Verified). Where a documented behaviour is version-gated above 2.1.90 it is
flagged inline. Core contract fields were cross-checked against the installed bundle at
`C:\Users\sandr\AppData\Roaming\npm\node_modules\@anthropic-ai\claude-code\cli.js` and its shipped
typings `sdk-tools.d.ts`.

---

## 3. The input contract: a flat JSON object on stdin, with the tool arguments nested under `tool_input`

**Documented** — hooks reference, "Common input fields" and "PreToolUse input", read 2026-07-26.

Fields common to every event: `session_id`, `prompt_id` (UUID, _requires v2.1.196+ — absent on this
machine's 2.1.90_), `transcript_path`, `cwd`, `permission_mode` (`"default"` | `"plan"` |
`"acceptEdits"` | `"auto"` | `"dontAsk"` | `"bypassPermissions"`), `effort` (object with `level`),
and `hook_event_name`. `PreToolUse` adds `tool_name`, `tool_input`, and `tool_use_id`. Inside a
subagent, two more appear: `agent_id` and `agent_type` (see §7).

The documented literal example, verbatim:

```json
{
  "session_id": "abc123",
  "prompt_id": "550e8400-e29b-41d4-a716-446655440000",
  "transcript_path": "/home/user/.claude/projects/.../transcript.jsonl",
  "cwd": "/home/user/my-project",
  "permission_mode": "default",
  "hook_event_name": "PreToolUse",
  "tool_name": "Bash",
  "tool_input": {
    "command": "npm test",
    "description": "Run test suite",
    "timeout": 120000,
    "run_in_background": false
  },
  "tool_use_id": "toolu_01ABC123..."
}
```

### `tool_input.file_path` is correct for `Write` and `Edit`, and for nothing else that writes

**Documented** — hooks reference "PreToolUse input" tables, plus the installed typings at
`C:\Users\sandr\AppData\Roaming\npm\node_modules\@anthropic-ai\claude-code\sdk-tools.d.ts`
lines 358–410 and 491–512, which are the shipped schema for v2.1.90.

| Tool           | Path field      | Other `tool_input` fields                                   | Source                                |
| -------------- | --------------- | ----------------------------------------------------------- | ------------------------------------- |
| `Write`        | `file_path`     | `content`                                                   | `FileWriteInput`, `sdk-tools.d.ts`    |
| `Edit`         | `file_path`     | `old_string`, `new_string`, `replace_all?`                  | `FileEditInput`, `sdk-tools.d.ts`     |
| `NotebookEdit` | `notebook_path` | `cell_id?`, `new_source`, `cell_type?`, `edit_mode?`        | `NotebookEditInput`, `sdk-tools.d.ts` |
| `Bash`         | none            | `command`, `description?`, `timeout?`, `run_in_background?` | `BashInput`, hooks reference          |
| `MultiEdit`    | **n/a**         | **tool does not exist**                                     | see below                             |

**`MultiEdit` is a dead name.** The string does not appear anywhere in the hooks reference, the
hooks guide, or the settings doc (`grep -c MultiEdit` over all three raw pages: **0**). In the
installed `cli.js` it appears exactly once, in a spinner-label lookup table alongside other retired
tool names:

```js
{Read:"Reading",Write:"Writing",Edit:"Editing",MultiEdit:"Editing",Bash:"Running",
 Glob:"Searching",Grep:"Searching",WebFetch:"Fetching",WebSearch:"Searching",
 Task:"Running task",FileReadTool:"Reading",FileWriteTool:"Writing",FileEditToo…
```

It is absent from `ToolInputSchemas`, the union that enumerates every real tool in
`sdk-tools.d.ts`. The documented `PreToolUse` tool list is: `Bash`, `Edit`, `Write`, `Read`, `Glob`,
`Grep`, `Agent`, `WebFetch`, `WebSearch`, `AskUserQuestion`, `ExitPlanMode`, and MCP tool names.
`MultiEdit` in a matcher is harmless — it is one alternative in an exact-match list that never
matches — but it is dead text. The same applies to `Task`: the subagent-spawning tool is now named
`Agent`.

---

## 4. Two ways to deny, and both reach the model — but only one carries a structured reason

**Documented** — hooks reference "Exit code output", "JSON output", and "PreToolUse decision
control", read 2026-07-26.

| Mechanism                                  | Blocks? | Where the message goes                                                                                     |
| ------------------------------------------ | ------- | ---------------------------------------------------------------------------------------------------------- |
| Exit 0, no stdout                          | No      | "no decision"; the normal permission flow applies                                                          |
| Exit 0 + JSON `permissionDecision: "deny"` | **Yes** | `permissionDecisionReason` is **shown to Claude**                                                          |
| Exit 2                                     | **Yes** | **stderr is fed back to Claude as an error message**; stdout and any JSON in it are ignored                |
| Exit 1, or any other non-zero              | **No**  | Non-blocking error. Transcript shows `<hook name> hook error` + first stderr line; execution **continues** |

The two load-bearing quotations, verbatim:

> **Exit 2** means a blocking error. Claude Code ignores stdout and any JSON in it. Instead, stderr
> text is fed back to Claude as an error message. The effect depends on the event: `PreToolUse`
> blocks the tool call […]

> `permissionDecisionReason` — For `"allow"` and `"ask"`, shown to the user but not Claude. For
> `"deny"`, shown to Claude. For `"defer"`, ignored

That second line is the direct answer to the kill criterion: on a `deny`, the reason string is
delivered to the model. The requirement in `INT-006(a)` — _deny, and tell the agent which MCP verb
to call instead_ — is met by the documented contract, twice over.

**Exit 1 is a trap.** The reference carries an explicit warning:

> For most hook events, only exit code 2 blocks the action. Claude Code treats exit code 1 as a
> non-blocking error and proceeds with the action, even though 1 is the conventional Unix failure
> code. If your hook is meant to enforce a policy, use `exit 2`.

**The two mechanisms are mutually exclusive per hook.** "You must choose one approach per hook, not
both: either use exit codes alone for signaling, or exit 0 and print JSON for structured control.
Claude Code only processes JSON on exit 0. If you exit 2, any JSON is ignored." The JSON form is the
richer and current one for `PreToolUse` — it is what the reference's own worked example uses, and it
is the only form that can also carry `additionalContext` or `updatedInput`.

**The deprecated form.** Verbatim from the reference:

> PreToolUse previously used top-level `decision` and `reason` fields, but these are deprecated for
> this event. Use `hookSpecificOutput.permissionDecision` and
> `hookSpecificOutput.permissionDecisionReason` instead. The deprecated values `"approve"` and
> `"block"` map to `"allow"` and `"deny"` respectively. Other events like PostToolUse and Stop
> continue to use top-level `decision` and `reason` as their current format.

`permissionDecision` accepts `"allow"`, `"deny"`, `"ask"`, `"defer"`. When several hooks disagree,
precedence is **`deny` > `defer` > `ask` > `allow`**. All matching hooks run in parallel and every
one runs to completion — "One hook returning `deny` doesn't stop sibling hooks from executing."

### The deny is genuinely hard

**Documented** — hooks-guide, "Hooks and permission modes":

> `PreToolUse` hooks fire before any permission-mode check, in every permission mode, including
> `dontAsk`. A hook that returns `permissionDecision: "deny"` blocks the tool even in
> `bypassPermissions` mode or with `--dangerously-skip-permissions`. This lets you enforce policy
> that users can't bypass by changing their permission mode.

The permissions reference adds that an exit-2 block "stops the tool call before permission rules are
evaluated, so the block applies even when an allow rule would otherwise let the call proceed." This
is the property PLAN §6 claims for the hook — "guarantees the property regardless of what any
agent's prompt says" — and it holds, with the scope limits in §7 and §8.

### The copy-pasteable deny payload

Exactly this on stdout, then exit 0. Nothing else may be on stdout — the reference is explicit that
"your hook's stdout must contain only the JSON object", and stray output from a shell profile is a
documented failure mode.

```json
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "deny",
    "permissionDecisionReason": "Project state is owned by Project Tracker. project/SPRINT_BOARD.md is retired — call the MCP verb complete_stage instead of editing this file."
  }
}
```

Output strings are capped at 10,000 characters; longer output is spilled to a file and replaced with
a preview.

---

## 5. Config lives in a settings file, the matcher is not always a regex, and this repo gitignores the obvious location

### Locations and precedence

**Documented** — hooks reference "Hook locations", settings reference "Settings precedence", read
2026-07-26.

| Location                        | Scope             | Doc's shareability note                    |
| ------------------------------- | ----------------- | ------------------------------------------ |
| `~/.claude/settings.json`       | All projects      | No, local to your machine                  |
| `.claude/settings.json`         | Single project    | Yes, can be committed to the repo          |
| `.claude/settings.local.json`   | Single project    | No, gitignored when Claude Code creates it |
| Managed policy settings         | Organization-wide | Admin-controlled                           |
| Plugin `hooks/hooks.json`       | Plugin enabled    | Bundled with the plugin                    |
| Skill or agent YAML frontmatter | Component active  | Defined in the component file              |

Settings precedence, highest first: managed → CLI `--settings` → `.claude/settings.local.json` →
`.claude/settings.json` → `~/.claude/settings.json`. Precedence governs _scalar_ keys. Hooks are not
overridden by precedence — every configured hook from every source runs, and the `/hooks` menu
labels each with its source (`User`, `Project`, `Local`, `Plugin`, `Session`, `Built-in`). There is
no way to disable one hook while keeping it; `"disableAllHooks": true` disables all of them.

**Repo-local, and it changes the delivery shape of `INT-006(a)`.** `Verified`:

```
$ git check-ignore -v .claude/settings.json .claude/settings.local.json
.gitignore:8:.claude/settings.json	.claude/settings.json
.gitignore:9:.claude/settings.local.json	.claude/settings.local.json
```

Both project settings files are gitignored in Life OS. A hook registered in `.claude/settings.json`
is therefore **not a committed artifact** — it lives on one machine and is lost on a fresh clone,
unlike the `lintNoMarkdownState.ts` half of `INT-006`, which is a tracked file in
`Standards (Technical + Linting)/scripts/`. The two halves of `INT-006` do not have the same
durability. BA-001's framing ("`.claude/settings.json` currently holds permissions only and no
hooks, so this establishes a new repo pattern") is correct on the facts but does not account for the
file being untracked. Note also that the _hook script_ can be a tracked file even when its
registration is not.

**A precedent already exists on this machine.** `~/.claude/settings.json` — the user scope, not this
repo — already registers a `PreToolUse` hook with `"matcher": "Write|Edit"` running
`node "%USERPROFILE%/.claude/hooks/block-resources-edit.js"`, plus two `PostToolUse` hooks. That
script (`C:\Users\sandr\.claude\hooks\block-resources-edit.js`) reads stdin, takes
`hookData?.tool_input?.file_path`, normalizes backslashes, tests two regexes, prints a reason and
`process.exit(2)`. It is the exact shape `INT-006(a)` needs, already working on Windows, in Node,
with a `%USERPROFILE%` path. It uses the exit-2 form rather than the JSON form.

**That precedent also carries a bug worth not copying.** Its handler sets `"timeout": 5000`.
`timeout` is in **seconds**, not milliseconds — the reference says "Seconds before canceling", and
the installed `cli.js` computes `q.timeout ? q.timeout*1000 : yA` (`Verified` by inspection of the
2.1.90 bundle). `5000` is 83 minutes, not 5 seconds. Defaults are 600 s for `command` hooks.

### Matcher syntax

**Documented** — hooks reference "Matcher patterns", read 2026-07-26.

| Matcher value                                         | Evaluated as                                   |
| ----------------------------------------------------- | ---------------------------------------------- |
| `"*"`, `""`, or omitted                               | Match all                                      |
| Only letters, digits, `_`, `-`, spaces, `,`, and `\|` | Exact string, or `\|`/`,`-separated exact list |
| Contains any other character                          | JavaScript regex, **unanchored**               |

So `Write|Edit|MultiEdit` is a valid **exact-match list**, not a regex — it does not silently match
`NotebookEdit`. Had it been written `Edit.*`, it would: "`Edit.*` matches both `Edit` and
`NotebookEdit`; wrap the pattern in `^` and `$`, as in `^Edit$`, when you need a whole-string
match." **Matchers are case-sensitive** (hooks-guide, "Hook not firing"). Comma separators require
v2.1.191+ and hyphens in the exact-match set require v2.1.195+ — both **above the installed 2.1.90**,
so on this machine only `|` is safe as a separator.

There is also an optional per-handler `if` field taking permission-rule syntax (`"Edit(**/project/**)"`)
that pre-filters before the process is spawned. Its own documentation warns it "fails open, running
your hook regardless of pattern, when the Bash command can't be parsed" and that "because the `if`
filter is best-effort, use the permission system rather than a hook to enforce a hard allow or
deny." Treat `if` as a spawn-cost optimisation, never as the check itself.

### The full config block, copy-pasteable

The shape is `hooks` → event → array of matcher groups → `hooks` array of handlers:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "node",
            "args": [
              "${CLAUDE_PROJECT_DIR}/.claude/hooks/blockRetiredStatePaths.js"
            ],
            "timeout": 10,
            "statusMessage": "Checking retired state paths..."
          }
        ]
      }
    ]
  }
}
```

---

## 6. On Windows with spaces in the path, exec form removes the quoting problem entirely

**Documented** — hooks reference "Exec form and shell form", "Windows PowerShell tool", read
2026-07-26.

A command hook runs in **exec form** when `args` is present and **shell form** when it is absent.

- **Exec form** (`args` set): `command` is resolved as an executable and spawned directly. "There is
  no shell, so each `args` element is one argument exactly as written, and path placeholders like
  `${CLAUDE_PLUGIN_ROOT}` are substituted into `command` and into each `args` element as plain
  strings." This is the documented recommendation whenever a path placeholder is involved — and
  `c:\Projects\Life OS\` has a space in it, so it is the form that matters here.
- **Shell form** (`args` absent): the string goes to `sh -c` on macOS/Linux, **Git Bash on Windows**,
  or **PowerShell when Git Bash isn't installed**. The `shell` field takes `"bash"` or
  `"powershell"` to choose explicitly. Both Git Bash and PowerShell are present on this machine.

Windows-specific documented constraint: "On Windows, exec form requires `command` to resolve to a
real executable such as a `.exe`. The `.cmd` and `.bat` shims that npm, npx, eslint, and other tools
install in `node_modules/.bin` are not executables and can't be spawned without a shell." The
documented workaround is `"command": "node", "args": ["<path to script.js>"]`. **This rules out
`tsx` in exec form** — `node_modules/.bin/tsx.cmd` is a shim (`Verified`: the root `node_modules/.bin`
holds `tsx`, `tsx.cmd`, `tsx.ps1`). A `.ts` hook would need either shell form or
`node <path>/node_modules/tsx/dist/cli.mjs`.

`${CLAUDE_PROJECT_DIR}` resolves to the project root and is **also exported into the hook process
environment**, so a script can read `process.env.CLAUDE_PROJECT_DIR` regardless of launch form.
`Verified` on the installed 2.1.90 bundle, which builds the child environment as
`R={...Sm(),CLAUDE_PROJECT_DIR:Z(v)}`. For PowerShell shell form, the `${CLAUDE_PROJECT_DIR}`
placeholder rewrite only applies from **v2.1.198** — below that, and therefore on this machine,
`$env:CLAUDE_PROJECT_DIR` or exec form is required. The bare `$CLAUDE_PROJECT_DIR` spelling in
PowerShell is documented as always wrong: it parses as an undefined local and resolves to `$null`.

**`jq` is not installed on this machine.** `Verified`: `which jq` → `which: no jq in (…)`. Every
Bash example in the official hook documentation parses stdin with `jq`. Node 22.19.0 is on PATH.
The existing `~/.claude/hooks/*.js` precedent is plain Node with `JSON.parse` and no dependencies.

---

## 7. `PreToolUse` fires inside subagents — documented, and with a field to prove it

This is the sub-question the topic brief singles out, and the documentation answers it directly
rather than by inference.

**Documented** — hooks reference "Hook lifecycle", read 2026-07-26. Events are grouped into three
cadences, and `PreToolUse` is in the third:

> on every tool call inside the agentic loop: `PreToolUse` and `PostToolUse`, except
> `EndConversation` calls, which skip both

**Documented** — hooks reference "Common input fields", the subagent field table:

> `agent_id` — Unique identifier for the subagent. **Present only when the hook fires inside a
> subagent call. Use this to distinguish subagent hook calls from main-thread calls.**

A field whose stated purpose is telling subagent hook invocations apart from main-thread ones is
only meaningful if subagent invocations happen. `agent_type` carries the agent's frontmatter `name`
— so a hook can see that the caller was `implementer` or `test-author`. Both fields exist in the
installed 2.1.90 bundle (`agent_id` appears 21 times in `cli.js`).

This matters because Life OS's entire build workflow runs through subagents (`/build` →
`workflows/build.js` → `build-briefer`, `test-author`, `implementer`, `gate-runner`,
`smoke-tester`). A guard that stopped at the main thread would guard nothing. It does not stop
there.

**Two documented gaps in coverage that are not about subagents:**

- **`@`-references bypass `PreToolUse` entirely.** "Files you reference with `@` in your prompt are
  added without any tool call: Claude Code inserts their contents while building the prompt, so no
  PreToolUse hook fires for them." This concerns reads, not writes, so it does not affect
  `INT-006(a)` — but it is the general shape of "the hook only sees tool calls."
- **`EndConversation`** skips both `PreToolUse` and `PostToolUse`. Not a file-writing tool.

---

## 8. The D-07 `Bash` carve-out: the stated reason is sound, the stated residual is understated

D-07 says the hook deliberately does not parse `Bash` "because command regexing is fuzzy and the
false positives outweigh the residual shell loophole." Three factual findings.

### (a) A `Bash` hook can read `tool_input.command` — yes, unambiguously

**Documented.** The hooks reference's own headline `PreToolUse` example is a `Bash` hook reading
`.tool_input.command`, and `BashInput` in the installed typings confirms the field. The capability
is not in question; only its reliability is.

### (b) Anthropic's own guidance on command matching is cautionary, not prohibitive

**Documented**, but indirect — there is no sentence in the hook documentation saying "don't regex
Bash commands." What exists is a cluster of documented statements about how hard command matching
is, all read 2026-07-26:

- The `if` filter, which uses permission-rule syntax against Bash commands, "also fails open,
  running your hook regardless of pattern, when the Bash command can't be parsed. Because the `if`
  filter is best-effort, use the permission system rather than a hook to enforce a hard allow or
  deny."
- The permissions reference devotes a full subsection to the ways Bash prefix matching breaks:
  wrappers (`timeout`, `nice`, `nohup`, `xargs`) are stripped from a fixed built-in list, while
  environment runners (`npx`, `devbox run`, `docker exec`) are not, so "a rule like
  `Bash(devbox run *)` matches whatever comes after `run`, including `devbox run rm -rf .`."
  Compound commands are split on `&&`, `||`, `;`, `|`, `|&`, `&`, and newlines and each subcommand
  matched independently. Exec wrappers such as `watch`, `setsid`, `flock`, and `find -exec` cannot
  be covered by a prefix rule at all.
- Anthropic ships a reference `PreToolUse` Bash hook — `examples/hooks/bash_command_validator_example.py`
  in the `anthropics/claude-code` repo (`Verified`: fetched 2026-07-26, HTTP 200, 2078 bytes). It is
  a **style nudge**, not a guard: its two rules rewrite `grep` to `rg` and `find -name` to `rg`. It
  carries no warning, and it does not attempt to be exhaustive.

**Verdict on (b):** the difficulty is documented; the advisability is not adjudicated by Anthropic.
D-07's reasoning is consistent with the documented behaviour of every command-matching surface
Claude Code exposes. Nothing found contradicts it.

### (c) Four other write paths bypass a `Write|Edit` matcher

**Documented / Inferred, as marked.**

| Path                         | Bypasses `Write\|Edit`? | Evidence                                                                                                                                                                                             |
| ---------------------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Bash` redirect / heredoc    | **Yes**                 | `Documented` — `Bash` is a distinct `tool_name`; the matcher never fires. The acknowledged carve-out.                                                                                                |
| `NotebookEdit`               | **Yes**                 | `Documented` — live tool in `sdk-tools.d.ts` v2.1.90; input is `notebook_path`, so even a `NotebookEdit` matcher needs a different field read. Cannot write `.md`, so the practical risk is nil.     |
| MCP filesystem-style servers | **Yes**                 | `Documented` — MCP tools are named `mcp__<server>__<tool>` and require their own matcher (`mcp__.*`). This repo runs Playwright MCP today and will run the Project Tracker MCP server after cutover. |
| Subagent (`Agent` tool)      | **No**                  | `Documented` — see §7. Subagent tool calls fire `PreToolUse` normally.                                                                                                                               |

**Inferred, and marked as such:** a competing mechanism exists that closes part of the `Bash` gap.
The permissions reference states that "Read and Edit deny rules apply to Claude's built-in file
tools **and to file commands Claude Code recognizes in Bash, such as `cat`, `head`, `tail`, and
`sed`**. They don't apply to arbitrary subprocesses that read or write files indirectly, like a
Python or Node script that opens files itself." So an `Edit(...)` **deny permission rule** — not a
hook — reaches further into `Bash` than the hook does. It cannot substitute for the hook, because a
permission deny produces a rule-citing refusal, not a message naming `complete_stage`; and
`Edit(path)` is the only spelling the file-permission checks match (from v2.1.210 a
`Write(path)`/`NotebookEdit(path)` rule is accepted but never matched, and warns at startup). The
interaction between the two is documented: "Hook decisions don't bypass permission rules. Claude
Code evaluates deny and ask rules regardless of what a PreToolUse hook returns." They compose;
neither cancels the other.

**Where that leaves D-07:** sound as a decision, incomplete as an inventory. The carve-out is
`Bash` _plus_ MCP file-write verbs, and the MCP one is the sharper edge because after cutover this
repo will be running its own MCP server by design.

---

## 9. Testing a hook is a pipe, and the debug channel is a file, not the terminal

**Documented** — hooks-guide "Hook error in output" and "Debug techniques", hooks reference "Debug
hooks", read 2026-07-26.

The documented manual-test recipe is exactly synthetic stdin:

```bash
echo '{"tool_name":"Bash","tool_input":{"command":"ls"}}' | ./my-hook.sh
echo $?  # Check the exit code
```

For `INT-006(a)` the equivalent payload is
`{"hook_event_name":"PreToolUse","tool_name":"Write","tool_input":{"file_path":"…/project/SPRINT_BOARD.md","content":"x"}}`,
asserting exit 0 plus the deny JSON on stdout. This is an ordinary process-level test — the hook
script is a plain Node module reading stdin, so it is testable by the module's existing Jest setup
without Claude Code running.

Other documented surfaces:

- **`/hooks`** — a read-only browser showing every event, its matchers, each handler's full command,
  and which settings file it came from. The verification step for "is the hook registered."
- **`claude --debug-file <path>`**, or `claude --debug` writing to `~/.claude/debug/<session-id>.txt`
  — which hooks matched, exit codes, full stdout and stderr. "The `--debug` flag doesn't print to the
  terminal." `CLAUDE_CODE_DEBUG_LOG_LEVEL=verbose` adds matcher-count detail.
- **Ctrl+O transcript view** — one line per hook that fired; success is silent.

**Gotchas, all documented:**

- Hooks are **not** snapshotted at session start in the current version: "Direct edits to hooks in
  settings files are normally picked up automatically by the file watcher." If a change does not
  appear within seconds, "restart your session to force a reload." (This differs from older Claude
  Code behaviour, which did snapshot; do not carry a stale mental model in.)
- All matching hooks **run in parallel**; identical handlers are deduplicated by command string and
  `args`.
- Shell form on Windows uses Git Bash, which may source a profile; unconditional `echo` in a profile
  corrupts the hook's JSON stdout. The documented fix is guarding profile output with `[[ $- == *i* ]]`.
- On macOS/Linux the script must be `chmod +x`. Not applicable on Windows when invoked via `node`.
- Where a hook script should live: the documentation's own examples consistently use
  **`.claude/hooks/`** referenced via `${CLAUDE_PROJECT_DIR}`. There is no stronger convention than
  that, but every worked example in both the reference and the guide uses that directory.

---

## 10. Security: hooks run as you, with your full permissions

**Documented** — hooks reference "Security considerations", read 2026-07-26, verbatim:

> Command hooks execute shell commands with your full user permissions. They can modify, delete, or
> access any files your user account can access. Review and test all hook commands before adding
> them to your configuration.

Documented best practices: validate and sanitise inputs, always quote shell variables, block path
traversal (check for `..`), use absolute paths, skip sensitive files. Two are directly load-bearing
for a path-matching guard: the hook's own comparison must normalise `..` and separators before
matching, or a retired path reached via `project/../project/SPRINT_BOARD.md` slips through; and the
absolute-path rule is why exec form with `${CLAUDE_PROJECT_DIR}` is the documented shape.

---

## 11. Grading the prior assumption

| Clause of the prior assumption                             | Grade       | Why                                                                                                                     |
| ---------------------------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------- |
| A `PreToolUse` hook can match `Write\|Edit\|MultiEdit`     | **Partial** | The matcher form is valid and is an exact-match list, not a regex. `MultiEdit` is not a tool in v2.1.90 — dead text.    |
| …inspect `tool_input.file_path`                            | **Holds**   | Correct field name for both `Write` and `Edit`, confirmed in the shipped typings on disk.                               |
| …against a retired-path list                               | **Holds**   | Nothing in the contract constrains what the script does with the path.                                                  |
| …and **hard-deny**                                         | **Holds**   | And harder than assumed: it beats `bypassPermissions` and `--dangerously-skip-permissions`.                             |
| …with a message naming the MCP verb the agent should use   | **Holds**   | `permissionDecisionReason` on a `deny` is "shown to Claude"; exit-2 stderr is "fed back to Claude as an error message". |
| (implicit) the guard reaches subagents                     | **Holds**   | `PreToolUse` fires "on every tool call inside the agentic loop"; `agent_id` exists to distinguish those calls.          |
| (implicit) `.claude/settings.json` is a shareable artifact | **Refuted** | Gitignored in this repo at `.gitignore:8`.                                                                              |

**The kill criterion is not tripped.** `PreToolUse` can hard-deny a tool call with an
agent-visible explanatory message. `INT-006(a)` is buildable as specified, and D-07 does not need
rethinking on that ground.

---

## 12. What we could not establish

- **Whether the current hook contract behaves identically on the installed v2.1.90.** The published
  reference documents up to v2.1.218 and annotates only _some_ behaviours with a minimum version.
  `permissionDecision`, `permissionDecisionReason`, `hookSpecificOutput`, `agent_id`, `tool_use_id`,
  `statusMessage`, `defer`, and `CLAUDE_PROJECT_DIR` are all present as literals in the 2.1.90
  bundle, which is strong but not conclusive — a minified bundle proves the string exists, not that
  the semantics match today's docs. **Settled by**: one hook run under `claude --debug-file`, or
  upgrading to a version at or above the docs. No spike was authorized here.
- **Whether an unanchored regex matcher is case-insensitive.** The hooks-guide states flatly
  "Matchers are case-sensitive"; the reference does not repeat this for the regex path, and no
  documented flag controls it. Searched: hooks reference, hooks-guide, settings reference.
- **Whether `${CLAUDE_PROJECT_DIR}` placeholder _substitution_ (as opposed to the exported env var)
  works in shell form on 2.1.90.** The env-var export is `Verified` in the bundle. The placeholder
  rewrite is documented with version gates for PowerShell (v2.1.198) but not for Git Bash. Reading
  `process.env.CLAUDE_PROJECT_DIR` inside the script sidesteps the question entirely.
- **Whether a Cowork/remote session can register a hook.** PLAN §9 records that the Cowork bridge
  refuses writes into `.claude/`. Nothing in the hook documentation addresses remote-session hook
  authoring beyond `$CLAUDE_CODE_REMOTE` being set to `"true"`. Not searched further — it is a repo
  operations question, not a contract question.
- **Whether `TodoWrite`, `EnterWorktree`, or any other tool in `ToolInputSchemas` can write an
  arbitrary file.** Only their input shapes were read, not their implementations. `TodoWrite` writes
  session todo state, not repo files, by name and by every documented description — but that is
  `Inferred`, not confirmed.
- **No community sources were used.** The official reference answered every sub-question except the
  three above; nothing here rests on a blog post, forum thread, or issue tracker.

---

## 13. Implications for design

1. **`INT-006(a)` is buildable as written; the mechanism is documented, not speculative.** The
   design stages can plan against `hookSpecificOutput.permissionDecision: "deny"` with
   `permissionDecisionReason` as the message channel to the agent, and should treat exit 2 as the
   fallback form rather than the primary — the JSON form is the current one for this event, and the
   exit-2 form silently loses any JSON it prints.
2. **The matcher should be reconsidered as `Write|Edit`, and the `MultiEdit` alternative dropped.**
   Nothing breaks if it stays, but it is a name no version of Claude Code in this documentation
   recognises. Whether to add `NotebookEdit` (different field: `notebook_path`) and an `mcp__.*`
   matcher is a design question, not a research finding — but the MCP one is the live gap, because
   this repo will be running its own MCP server after cutover.
3. **Exit code 1 must never be used to deny.** It is a non-blocking error and the write proceeds.
   Any test for `INT-006(a)` should assert the exit code and the stdout payload, not merely
   "non-zero."
4. **The two halves of `INT-006` have different durability, and design should decide whether that
   is acceptable.** `lintNoMarkdownState.ts` is a tracked file under
   `Standards (Technical + Linting)/scripts/`; the hook's _registration_ in `.claude/settings.json`
   is gitignored. The hook _script_ can be tracked. Options the design stage owns: keep the script
   tracked at `.claude/hooks/` and document the registration as a manual per-machine step; move the
   registration to skill or agent frontmatter (which is tracked, but scopes the hook to when that
   component is active — a narrower guarantee than PLAN §6 claims); or un-ignore
   `.claude/settings.json`. Each is a real trade, and none is settled here.
5. **The `timeout` unit is seconds.** The existing `~/.claude/hooks` precedent has it wrong by a
   factor of 1000. Any new handler should carry a small explicit value.
6. **Windows shape is already proven on this machine, in Node, with no `jq`.** `jq` is not
   installed; every official Bash example depends on it. The existing `block-resources-edit.js`
   precedent — plain Node, `JSON.parse` on stdin, zero dependencies — is the shape that runs here.
   Exec form (`"command": "node", "args": ["${CLAUDE_PROJECT_DIR}/.claude/hooks/…"]`) removes the
   path-with-spaces problem that `c:\Projects\Life OS\` otherwise creates. A `.ts` hook run through
   `tsx` cannot use exec form, because `tsx.cmd` is a shim rather than an executable — which puts
   this hook script outside the repo's normal TypeScript-everywhere convention unless it is invoked
   through shell form or a direct `node …/tsx/dist/cli.mjs` path.
7. **The subagent question is closed, and it closes it favourably.** Because `PreToolUse` fires on
   every tool call in the agentic loop, the guard reaches `implementer`, `test-author`,
   `smoke-tester` and every future subagent without per-agent configuration. `agent_type` is
   available in the payload, so the deny reason can name the calling agent if the design wants a
   more specific message.
8. **A permission `deny` rule is a separate, composable instrument that reaches further into
   `Bash`** — it covers file commands Claude Code recognises in `Bash` (`cat`, `sed`, `tail`) that
   the hook cannot see, but it cannot carry the "call `complete_stage` instead" message and it must
   be spelled `Edit(path)`, never `Write(path)`. Whether `INT-006` uses one, the other, or both is a
   design decision this research does not pre-empt.
9. **Testing convention is unforced by the tooling.** The hook is a stdin→stdout process, so the
   established repo test strategy applies unchanged: synthetic payload in `test/data/`, assert exit
   code and parsed stdout. `/hooks` and `claude --debug-file` verify registration and live firing,
   which is a separate manual check from the unit test.
