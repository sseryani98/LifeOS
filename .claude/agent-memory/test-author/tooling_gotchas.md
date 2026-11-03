---
name: tooling-gotchas
description: Shell/tooling traps hit while editing specs in this repo (Git Bash on Windows)
metadata:
  type: feedback
---

- **A Bash heredoc feeding a Python edit script that contains `'''` and apostrophes fails** with `unexpected EOF while looking for matching ''` and writes nothing, even with a quoted `'EOF'` delimiter. Use the Edit tool (several parallel Edits) for multi-hunk spec changes instead.
  The same failure hits JS template literals (`${...}`) inside the heredoc.
  **Why:** lost one round-trip on 2026-11-02 editing readPath.test.ts.
- **`prettier --check` is not a gate**: untouched specs (harnessLever, registers) already fail it. Gate is eslint + `lint:test-*` + tsc + jest; do not "fix" formatting in files outside the item.
