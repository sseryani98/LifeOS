---
name: tooling-gotchas
description: Shell/tooling traps hit while editing specs in this repo (Git Bash on Windows)
metadata:
  type: feedback
---

- **A Bash heredoc feeding a Python edit script that contains `'''` and apostrophes fails** with `unexpected EOF while looking for matching ''` and writes nothing, even with a quoted `'EOF'` delimiter. Use the Edit tool (several parallel Edits) for multi-hunk spec changes instead.
  The same failure hits JS template literals (`${...}`) inside the heredoc.
  **Why:** lost one round-trip on 2026-11-02 editing readPath.test.ts.
- **Never call `python` from Bash here**: it resolves to the Windows Store/VS Code launcher, opens a REPL and hangs the 120s timeout (2026-11-03). Use `perl -0pi -e` for a multi-line source mutation in a prototype.
- **Prototype mutation, fast path**: `tar --exclude=coverage --exclude=design --exclude=research -cf - . | (cd ../.proto-pt && tar -xf -)`, `sed`/`perl` the mutation, run one spec, `rm -rf`. Under a minute for a pure verb guard.
- **`prettier --check` is not a gate**: untouched specs (harnessLever, registers) already fail it. Gate is eslint + `lint:test-*` + tsc + jest; do not "fix" formatting in files outside the item.
