#!/usr/bin/env node
// Driver for the /commit-diff skill. Three subcommands:
//   context        collect the staged diff + exemplar commits into one Haiku-ready bundle
//   check <file>   validate a candidate message against the repo's commit conventions
//   commit <file>  check, then commit
//
// Repo conventions come from Financial Planner/design/VERSION_CONTROL.md §6 and from
// the real history, which has drifted from the doc — history wins on the trailer.

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const DIFF_BUDGET = 90_000; // chars of diff before truncation; keeps the bundle inside a Haiku turn
const PER_FILE_BUDGET = 12_000;
const EXEMPLAR_COUNT = 8;
const SUBJECT_SOFT_CAP = 72;
const SUBJECT_HARD_CAP = 100;
const BODY_SOFT_CAP = 80;

// §6.2 plus the types history actually uses (merge, seed, init) that the doc's table omits.
const TYPES = [
  "feat",
  "fix",
  "refactor",
  "test",
  "docs",
  "chore",
  "seed",
  "merge",
  "perf",
  "style",
  "revert",
];

// CLAUDE.md "Do NOT commit" list. These are errors, not warnings.
const FORBIDDEN = [
  { re: /(^|\/)\.env$/, why: ".env holds ENCRYPTION_KEY" },
  { re: /(^|\/)node_modules\//, why: "dependencies are not tracked" },
  { re: /(^|\/)gen\//, why: "CAP generated output" },
  { re: /(^|\/)logs\//, why: "runtime logs" },
  { re: /(^|\/)@cds-models\//, why: "CAP generated types" },
  { re: /(^|\/)coverage\//, why: "test artifact" },
];

const TRAILER_RE = /^Co-Authored-By: .+ <.+@.+>$/m;
const SUBJECT_RE = /^([a-z]+)(?:\(([^)]+)\))?: (.+)$/;
// Past-tense / third-person openers that read as a changelog rather than an instruction.
const NON_IMPERATIVE_RE = /^(added|adds|adding|fixed|fixes|fixing|updated|updates|updating|removed|removes|removing|changed|changes|changing|implemented|implements|created|creates)\b/i;

function git(args, opts = {}) {
  return execFileSync("git", args, {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    ...opts,
  });
}

function repoRoot() {
  return git(["rev-parse", "--show-toplevel"]).trim();
}

/** Split a unified diff into per-file chunks so each can be truncated independently. */
function splitDiffByFile(diff) {
  const chunks = [];
  let current = null;
  for (const line of diff.split("\n")) {
    if (line.startsWith("diff --git ")) {
      if (current) chunks.push(current);
      current = { header: line, lines: [line] };
    } else if (current) {
      current.lines.push(line);
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

function budgetDiff(diff) {
  const chunks = splitDiffByFile(diff);
  const notes = [];
  let total = 0;
  const out = [];
  for (const chunk of chunks) {
    let text = chunk.lines.join("\n");
    if (text.length > PER_FILE_BUDGET) {
      const kept = text.slice(0, PER_FILE_BUDGET);
      const dropped = text.slice(PER_FILE_BUDGET).split("\n").length;
      text = `${kept}\n... [${dropped} more diff lines in this file — truncated]`;
      notes.push(`${chunk.header.replace("diff --git ", "")}: truncated`);
    }
    if (total + text.length > DIFF_BUDGET) {
      notes.push(`${chunks.length - out.length} file(s) omitted entirely — diff budget exhausted`);
      break;
    }
    total += text.length;
    out.push(text);
  }
  return { text: out.join("\n"), notes };
}

function cmdContext(argv) {
  const root = repoRoot();
  const useWorktree = argv.includes("--worktree");
  const diffArgs = useWorktree ? ["diff"] : ["diff", "--cached"];

  const stat = git([...diffArgs, "--stat"], { cwd: root }).trim();
  if (!stat) {
    const hint = useWorktree
      ? "No unstaged changes to tracked files."
      : "Nothing staged. Stage the intended files with `git add`, or pass --worktree to inspect unstaged changes.";
    process.stderr.write(`${hint}\n`);
    process.exit(2);
  }

  const names = git([...diffArgs, "--name-only"], { cwd: root }).trim().split("\n");
  const blocked = [];
  for (const name of names) {
    for (const rule of FORBIDDEN) {
      if (rule.re.test(name)) blocked.push(`${name} — ${rule.why}`);
    }
  }

  const diff = git([...diffArgs, "-M"], { cwd: root });
  const { text, notes } = budgetDiff(diff);
  const branch = git(["rev-parse", "--abbrev-ref", "HEAD"], { cwd: root }).trim();
  const exemplars = git(
    ["log", `-${EXEMPLAR_COUNT}`, "--no-merges", "--format=%n===%n%B"],
    { cwd: root }
  ).trim();
  const untracked = git(["ls-files", "--others", "--exclude-standard"], { cwd: root }).trim();

  const parts = [];
  parts.push("# Commit context bundle");
  parts.push(`Branch: ${branch}`);
  parts.push(`Source: ${useWorktree ? "unstaged worktree changes" : "staged changes (git diff --cached)"}`);
  if (blocked.length) {
    parts.push(`\n## BLOCKED PATHS — do not commit these\n${blocked.map(b => `- ${b}`).join("\n")}`);
  }
  if (untracked) {
    parts.push(`\n## Untracked (not in this diff — mention only if clearly part of the change)\n${untracked}`);
  }
  parts.push(`\n## Diffstat\n${stat}`);
  if (notes.length) parts.push(`\n## Truncation notes\n${notes.map(n => `- ${n}`).join("\n")}`);
  parts.push(`\n## Exemplar commit messages (this repo's real style — imitate these)\n${exemplars}`);
  parts.push(`\n## Diff\n\`\`\`diff\n${text}\n\`\`\``);

  process.stdout.write(parts.join("\n"));
}

function checkMessage(raw) {
  const errors = [];
  const warnings = [];
  const text = raw.replace(/\r\n/g, "\n").replace(/\s+$/, "");
  const lines = text.split("\n");
  const subject = lines[0] ?? "";

  const match = SUBJECT_RE.exec(subject);
  if (!match) {
    errors.push(`Subject does not match "type(scope): description": ${JSON.stringify(subject)}`);
  } else {
    const [, type, , description] = match;
    if (!TYPES.includes(type)) {
      errors.push(`Unknown type "${type}". Allowed: ${TYPES.join(", ")} (VERSION_CONTROL.md §6.2)`);
    }
    if (/\.$/.test(description)) warnings.push("Subject ends with a period — drop it.");
    if (NON_IMPERATIVE_RE.test(description)) {
      warnings.push(`Subject opens with "${description.split(/\s/)[0]}" — use the imperative ("add", not "added").`);
    }
  }

  if (subject.length > SUBJECT_HARD_CAP) {
    errors.push(`Subject is ${subject.length} chars (hard cap ${SUBJECT_HARD_CAP}).`);
  } else if (subject.length > SUBJECT_SOFT_CAP) {
    warnings.push(`Subject is ${subject.length} chars; aim for <=${SUBJECT_SOFT_CAP}.`);
  }

  if (lines.length > 1 && lines[1].trim() !== "") {
    errors.push("Line 2 must be blank — subject, blank line, then body.");
  }

  if (!TRAILER_RE.test(text)) {
    errors.push("Missing Co-Authored-By trailer (VERSION_CONTROL.md §6.5 — required on agent commits).");
  }

  const body = lines.slice(2);
  const longBody = body.filter(
    line => line.length > BODY_SOFT_CAP && !/^(Co-Authored-By|https?:\/\/|\s*\|)/.test(line) && !line.includes("://")
  );
  if (longBody.length) {
    warnings.push(`${longBody.length} body line(s) exceed ${BODY_SOFT_CAP} cols — wrap them.`);
  }

  if (body.every(line => line.trim() === "")) {
    warnings.push("No body. Every non-trivial commit here explains why, not just what.");
  }

  return { errors, warnings };
}

function reportCheck(file) {
  const raw = readFileSync(file, "utf8");
  const { errors, warnings } = checkMessage(raw);
  for (const warn of warnings) process.stderr.write(`warn:  ${warn}\n`);
  for (const err of errors) process.stderr.write(`ERROR: ${err}\n`);
  if (!errors.length && !warnings.length) process.stderr.write("ok: message passes all checks\n");
  return errors.length === 0;
}

function cmdCheck(argv) {
  const file = argv[0];
  if (!file) {
    process.stderr.write("usage: driver.mjs check <message-file>\n");
    process.exit(2);
  }
  process.exit(reportCheck(file) ? 0 : 1);
}

function cmdCommit(argv) {
  const file = argv[0];
  if (!file) {
    process.stderr.write("usage: driver.mjs commit <message-file>\n");
    process.exit(2);
  }
  if (!reportCheck(file)) {
    process.stderr.write("\nRefusing to commit: fix the ERROR lines above.\n");
    process.exit(1);
  }
  const root = repoRoot();
  const names = git(["diff", "--cached", "--name-only"], { cwd: root }).trim();
  if (!names) {
    process.stderr.write("Nothing staged.\n");
    process.exit(2);
  }
  for (const name of names.split("\n")) {
    for (const rule of FORBIDDEN) {
      if (rule.re.test(name)) {
        process.stderr.write(`Refusing to commit ${name} — ${rule.why}.\n`);
        process.exit(1);
      }
    }
  }
  // Normalise CRLF: git keeps the message verbatim and stray \r ends up in the log.
  const normalised = readFileSync(file, "utf8").replace(/\r\n/g, "\n");
  writeFileSync(file, normalised);
  process.stdout.write(git(["commit", "-F", file], { cwd: root }));
}

const [sub, ...rest] = process.argv.slice(2);
const commands = { context: cmdContext, check: cmdCheck, commit: cmdCommit };
if (!commands[sub]) {
  process.stderr.write("usage: driver.mjs <context [--worktree] | check <file> | commit <file>>\n");
  process.exit(2);
}
commands[sub](rest);
