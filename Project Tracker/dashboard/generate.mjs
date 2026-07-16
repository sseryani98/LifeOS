// Life OS — Project Tracker (PMO) dashboard generator (v1)
//
// Reads the markdown that is already the source of truth for a Life OS module
// (sprint board, defect log, design timeline, .claude/ tooling, lint suite) and
// emits a single self-contained dashboard.html. Read-only: never writes to the
// project's own files. Re-run whenever project state changes.
//
//   node "Project Tracker/dashboard/generate.mjs" [ModuleFolderName]
//
// Default module: "Financial Planner". The output lands next to this script.

import { readFileSync, existsSync, readdirSync, writeFileSync, statSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(SCRIPT_DIR, "..", ".."); // Life OS/
const MODULE = process.argv[2] || "Financial Planner";
const MODULE_DIR = join(REPO_ROOT, MODULE);

// ---------------------------------------------------------------------------
// tiny fs + markdown helpers
// ---------------------------------------------------------------------------

const read = (p) => (existsSync(p) ? readFileSync(p, "utf8") : "");
const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
// minimal inline-markdown: strip links to their text, drop backticks/asterisks
const inline = (s) =>
  esc(
    String(s ?? "")
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      .replace(/[`*]/g, "")
      .trim(),
  );

// Parse the FIRST markdown table found in a chunk of text into row objects.
function parseTable(md) {
  const lines = md.split("\n");
  let i = lines.findIndex((l) => /^\s*\|.*\|\s*$/.test(l) && lines[l] !== undefined);
  // find a header row followed by a separator row
  for (let k = 0; k < lines.length - 1; k++) {
    const isRow = /^\s*\|.*\|\s*$/.test(lines[k]);
    const isSep = /^\s*\|[\s:|-]+\|\s*$/.test(lines[k + 1]);
    if (isRow && isSep) {
      i = k;
      break;
    }
    if (k === lines.length - 2) i = -1;
  }
  if (i < 0) return { headers: [], rows: [] };
  const cells = (l) =>
    l
      .trim()
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((c) => c.trim());
  const headers = cells(lines[i]);
  const rows = [];
  for (let k = i + 2; k < lines.length; k++) {
    if (!/^\s*\|.*\|\s*$/.test(lines[k])) break;
    const c = cells(lines[k]);
    if (c.every((x) => /^:?-+:?$/.test(x) || x === "")) continue;
    const o = {};
    headers.forEach((h, idx) => (o[h] = c[idx] ?? ""));
    rows.push(o);
  }
  return { headers, rows };
}

// Split markdown into { headingText: bodyText } for a given heading level (## or ###).
function sections(md, marker) {
  const re = new RegExp(`^${marker}\\s+(.+)$`, "gm");
  const out = [];
  let m;
  const idxs = [];
  while ((m = re.exec(md))) idxs.push({ title: m[1].trim(), start: m.index, headEnd: re.lastIndex });
  idxs.forEach((s, n) => {
    const end = n + 1 < idxs.length ? idxs[n + 1].start : md.length;
    out.push({ title: s.title, body: md.slice(s.headEnd, end) });
  });
  return out;
}

function frontmatter(md) {
  const m = md.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return {};
  const fm = {};
  m[1].split("\n").forEach((line) => {
    const mm = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (mm) fm[mm[1].trim()] = mm[2].trim();
  });
  return fm;
}

// ---------------------------------------------------------------------------
// gather project state
// ---------------------------------------------------------------------------

function getSprintBoard() {
  const md = read(join(MODULE_DIR, "project", "SPRINT_BOARD.md"));
  const cur = md.match(/^##\s+Current Sprint:\s*(.+)$/m);
  const branch = md.match(/\*\*Branch:\*\*\s*(.+)/);
  const goal = md.match(/\*\*Goal:\*\*\s*(.+)/);
  const sync = md.match(/\*\*Sync point:\*\*\s*(.+)/);

  const level2 = sections(md, "##");
  const current = level2.find((s) => /^Current Sprint:/.test(s.title));
  const lanes = { Backlog: [], "In Progress": [], Done: [] };
  if (current) {
    for (const lane of ["Backlog", "In Progress", "Done"]) {
      const sub = sections(current.body, "###").find((s) => s.title === lane);
      if (sub) lanes[lane] = parseTable(sub.body).rows;
    }
  }

  // all stories across every sprint table (for the story list) + sprint history
  const allStories = new Map();
  const history = [];
  for (const s of level2) {
    const isSprint = /Sprint/i.test(s.title) || /^W\d/.test(s.title);
    const rows = parseTable(s.body).rows;
    if (!rows.length) continue;
    if (!/^Current Sprint:/.test(s.title))
      history.push({ title: s.title, count: rows.length });
    for (const r of rows) {
      const id = r.Story || r.ID;
      if (!id) continue;
      if (!allStories.has(id))
        allStories.set(id, {
          id,
          type: r.Type || "",
          description: r.Description || r.Summary || "",
          status: r.Status || "",
          sprint: s.title.replace(/^Current Sprint:\s*/, "").split("—")[0].trim(),
        });
    }
  }

  return {
    currentName: cur ? cur[1].trim() : "(unknown)",
    branch: branch ? branch[1].trim() : "",
    goal: goal ? goal[1].trim() : "",
    sync: sync ? sync[1].trim() : "",
    lanes,
    stories: [...allStories.values()],
    history,
  };
}

function getDefects() {
  const md = read(join(MODULE_DIR, "project", "DEFECT_LOG.md"));
  return parseTable(md).rows;
}

function getTimeline() {
  const md = read(join(MODULE_DIR, "design", "DESIGN_PHASE_TIMELINE.md"));
  const prog = sections(md, "##").find((s) => /^Progress/.test(s.title));
  const steps = prog ? parseTable(prog.body).rows : [];
  return steps.map((r) => ({
    step: r.Step,
    name: r.Name,
    status: r.Status,
    deliverable: r.Deliverable,
  }));
}

// PLAN = steps 0-4, DESIGN = 5-15 (per methodology blueprint §4)
function deriveStage(timeline, board) {
  const firstIncomplete = timeline.find((s) => !/complete/i.test(s.status));
  if (firstIncomplete) {
    const n = parseInt(firstIncomplete.step, 10);
    const phase = n <= 4 ? "Plan" : "Design";
    return {
      phase,
      substage: `${firstIncomplete.name} (step ${firstIncomplete.step})`,
      inFlight: `${firstIncomplete.name} — ${firstIncomplete.status}`,
      next: "Complete the current design step",
    };
  }
  // design complete -> build phase, driven by the sprint board
  const active = board.lanes["In Progress"][0];
  const backlog = board.lanes.Backlog;
  return {
    phase: "Build",
    substage: board.currentName,
    inFlight: active
      ? `${active.Story} — ${inline(active.Description).slice(0, 90)}`
      : backlog[0]
        ? `Idle — next up: ${backlog[0].Story}`
        : "Idle",
    next: backlog[0]
      ? `${backlog[0].Story} · ${inline(backlog[0].Description).slice(0, 90)}`
      : "Sprint backlog empty — plan next sprint",
  };
}

// Aggregate the most-recent Change History row from each design doc.
function getChangeLog() {
  const dir = join(MODULE_DIR, "design");
  if (!existsSync(dir)) return [];
  const feed = [];
  for (const f of readdirSync(dir).filter((f) => f.endsWith(".md"))) {
    const md = read(join(dir, f));
    const ch = sections(md, "##").find((s) => /Change History/i.test(s.title));
    if (!ch) continue;
    const rows = parseTable(ch.body).rows;
    for (const r of rows) {
      const date = r.Date || "";
      const desc = r.Description || "";
      if (date) feed.push({ date, doc: f.replace(".md", ""), author: r.Author || "", desc });
    }
  }
  feed.sort((a, b) => (a.date < b.date ? 1 : -1));
  return feed.slice(0, 16);
}

// Decisions: from the most recent sprint checkpoint's "Decisions" section, if present.
function getDecisions() {
  const dir = join(MODULE_DIR, "project", "sprints");
  if (!existsSync(dir)) return [];
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .sort()
    .reverse();
  const out = [];
  for (const f of files) {
    const md = read(join(dir, f));
    const sec = sections(md, "##").find((s) => /Decision/i.test(s.title));
    if (!sec) continue;
    // bullet or numbered lines
    sec.body.split("\n").forEach((l) => {
      const m = l.match(/^\s*[-*\d.]+\s+(.+)/);
      if (m && m[1].trim().length > 8)
        out.push({ sprint: f.replace("-checkpoint.md", ""), text: m[1].trim() });
    });
  }
  return out.slice(0, 20);
}

// ---------------------------------------------------------------------------
// gather tooling
// ---------------------------------------------------------------------------

function getTooling() {
  const cdir = join(REPO_ROOT, ".claude");
  const agents = [];
  const skills = [];
  const commands = [];
  const workflows = [];

  const adir = join(cdir, "agents");
  if (existsSync(adir))
    for (const f of readdirSync(adir).filter((f) => f.endsWith(".md"))) {
      const fm = frontmatter(read(join(adir, f)));
      agents.push({
        name: fm.name || f.replace(".md", ""),
        description: fm.description || "",
        model: fm.model || "",
        tools: fm.tools || "",
      });
    }

  const sdir = join(cdir, "skills");
  if (existsSync(sdir))
    for (const d of readdirSync(sdir)) {
      const p = join(sdir, d, "SKILL.md");
      if (!existsSync(p)) continue;
      const fm = frontmatter(read(p));
      skills.push({ name: fm.name || d, description: fm.description || "" });
    }

  const cmdir = join(cdir, "commands");
  if (existsSync(cmdir))
    for (const f of readdirSync(cmdir).filter((f) => f.endsWith(".md"))) {
      const fm = frontmatter(read(join(cmdir, f)));
      commands.push({
        name: "/" + f.replace(".md", ""),
        description: fm.description || "",
        argument: fm.argument || "",
      });
    }

  const wdir = join(cdir, "workflows");
  if (existsSync(wdir))
    for (const f of readdirSync(wdir).filter((f) => f.endsWith(".js"))) {
      const src = read(join(wdir, f));
      const desc = src.match(/description:\s*['"`](.+?)['"`]/);
      workflows.push({ name: f.replace(".js", ""), description: desc ? desc[1] : "" });
    }

  // lint suite
  const scriptsDir = join(REPO_ROOT, "Standards (Technical + Linting)", "scripts");
  const linters = existsSync(scriptsDir)
    ? readdirSync(scriptsDir).filter((f) => f.startsWith("lint") && f.endsWith(".ts"))
    : [];
  const eslintShared = existsSync(
    join(REPO_ROOT, "Standards (Technical + Linting)", "eslint.config.mjs"),
  );
  let lintScripts = [];
  const pkgPath = join(MODULE_DIR, "package.json");
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(read(pkgPath));
      lintScripts = Object.keys(pkg.scripts || {}).filter((k) => k.startsWith("lint"));
    } catch {}
  }

  return { agents, skills, commands, workflows, linters, eslintShared, lintScripts };
}

// ---------------------------------------------------------------------------
// methodology model (from METHODOLOGY_BLUEPRINT.md §5) — drives the infographic
// ---------------------------------------------------------------------------

const METHODOLOGY = [
  {
    phase: "Plan",
    stages: [
      { stage: "Ideate", artifact: "Problem Statement & Vision", tool: "/generate-problem-statement-vision", status: "New" },
      { stage: "Scope", artifact: "Business Architecture", tool: "/generate-business-architecture", status: "New" },
      { stage: "Research", artifact: "Research pack", tool: "/gather-research", status: "New" },
      { stage: "Scaffold", artifact: "Module skeleton", tool: "/scaffold-module", status: "New" },
    ],
  },
  {
    phase: "Design",
    stages: [
      { stage: "Workshops", artifact: "Lean Specs", tool: "design-workshop workflow (/workshop + spec-writer)", status: "Extend" },
      { stage: "Information Arch.", artifact: "Information Architecture", tool: "/generate-information-architecture", status: "New" },
      { stage: "Design System", artifact: "Design System", tool: "/generate-design-system", status: "New" },
      { stage: "Theme", artifact: "Theme", tool: "/generate-theme", status: "New" },
      { stage: "Data Model", artifact: "Data Model", tool: "/generate-data-model", status: "New" },
      { stage: "Tech Stack", artifact: "Tech Stack", tool: "/generate-tech-stack", status: "New" },
      { stage: "Test Strategy", artifact: "Test Strategy", tool: "/generate-test-strategy", status: "New" },
      { stage: "Project Planning", artifact: "Build Plan + Project Mgmt", tool: "/generate-build-plan", status: "New" },
    ],
  },
  {
    phase: "Build",
    stages: [
      { stage: "Sprint Build", artifact: "Green, reviewed story", tool: "/build → build.js", status: "Have" },
      { stage: "Code Quality", artifact: "Consensus findings applied", tool: "/code-quality", status: "Have" },
      { stage: "Test Quality", artifact: "Test gaps implemented", tool: "/test-quality", status: "Have" },
      { stage: "Functional Test", artifact: "Pass/fail matrix", tool: "functional-tester agent", status: "New" },
      { stage: "UX Test", artifact: "UX/theme report", tool: "ux-tester agent", status: "New" },
      { stage: "Human Review", artifact: "Feedback → prevention", tool: "/human-review-loop", status: "Have" },
      { stage: "Documentation", artifact: "Fresh tech docs", tool: "/refresh-docs", status: "New" },
      { stage: "PM Update", artifact: "Board / defect update", tool: "/pm-update", status: "New" },
      { stage: "Commit", artifact: "Conventional commit", tool: "/commit-diff", status: "Have" },
    ],
  },
];

function listProjects() {
  return readdirSync(REPO_ROOT)
    .filter((d) => {
      const p = join(REPO_ROOT, d);
      try {
        return (
          statSync(p).isDirectory() &&
          existsSync(join(p, "design")) &&
          existsSync(join(p, "project"))
        );
      } catch {
        return false;
      }
    });
}

// ---------------------------------------------------------------------------
// render
// ---------------------------------------------------------------------------

const board = getSprintBoard();
const defects = getDefects();
const timeline = getTimeline();
const stage = deriveStage(timeline, board);
const changelog = getChangeLog();
const decisions = getDecisions();
const tooling = getTooling();
const projects = listProjects();
const now = new Date();

const statusPill = (s) => {
  const k = String(s).toLowerCase();
  let cls = "n";
  if (/done|closed|complete/.test(k)) cls = "g";
  else if (/progress/.test(k)) cls = "b";
  else if (/backlog|open/.test(k)) cls = "a";
  return `<span class="pill ${cls}">${esc(s)}</span>`;
};
const sevPill = (s) => {
  const k = String(s).toLowerCase();
  let cls = "n";
  if (/critical/.test(k)) cls = "r";
  else if (/high/.test(k)) cls = "o";
  else if (/medium/.test(k)) cls = "a";
  else if (/low/.test(k)) cls = "b";
  return `<span class="pill ${cls}">${esc(s)}</span>`;
};
const toolPill = (s) => {
  const cls = s === "Have" ? "g" : s === "Extend" ? "a" : "o";
  return `<span class="pill ${cls}">${esc(s)}</span>`;
};

const storyRows = (rows) =>
  rows.length
    ? rows
        .map(
          (r) =>
            `<tr><td class="mono">${esc(r.Story || r.ID || "")}</td><td>${esc(r.Type || "")}</td><td>${inline(r.Description || r.Summary || "")}</td><td>${statusPill(r.Status || "")}</td></tr>`,
        )
        .join("")
    : `<tr><td colspan="4" class="muted">— none —</td></tr>`;

const openDefects = defects.filter((d) => /open/i.test(d.Status)).length;
const doneStories = board.stories.filter((s) => /done/i.test(s.status)).length;
const totalStories = board.stories.length;

// section builders --------------------------------------------------------

const secOverview = `
<div class="grid4">
  <div class="stat"><div class="stat-l">Phase</div><div class="stat-v">${esc(stage.phase)}</div></div>
  <div class="stat"><div class="stat-l">Current stage</div><div class="stat-v sm">${esc(stage.substage)}</div></div>
  <div class="stat"><div class="stat-l">Stories done</div><div class="stat-v">${doneStories}<span class="stat-sub">/ ${totalStories}</span></div></div>
  <div class="stat"><div class="stat-l">Open defects</div><div class="stat-v">${openDefects}<span class="stat-sub">/ ${defects.length}</span></div></div>
</div>

<div class="card">
  <h3>Where the project is</h3>
  <table class="kv">
    <tr><th>Phase</th><td>${statusPill(stage.phase)} &nbsp; ${esc(stage.phase === "Build" ? "Design complete — building" : "In progress")}</td></tr>
    <tr><th>Current sprint / substage</th><td>${esc(stage.substage)}</td></tr>
    <tr><th>In flight now</th><td>${esc(stage.inFlight)}</td></tr>
    <tr><th>Next step</th><td>${esc(stage.next)}</td></tr>
    <tr><th>Branch</th><td class="mono">${esc(board.branch)}</td></tr>
    <tr><th>Sprint goal</th><td>${esc(board.goal)}</td></tr>
    <tr><th>Sync point</th><td>${esc(board.sync)}</td></tr>
  </table>
</div>

<div class="card">
  <h3>Design phase timeline</h3>
  <div class="timeline">
    ${timeline
      .map(
        (t) =>
          `<div class="tl-item ${/complete/i.test(t.status) ? "done" : "todo"}"><span class="tl-n">${esc(t.step)}</span><span class="tl-name">${esc(t.name)}</span></div>`,
      )
      .join("")}
  </div>
</div>`;

const secBoard = `
<div class="card">
  <h3>${esc(board.currentName)}</h3>
  <p class="muted">${esc(board.goal)}</p>
  <div class="lanes">
    ${["Backlog", "In Progress", "Done"]
      .map(
        (lane) => `
      <div class="lane">
        <div class="lane-h">${lane} <span class="count">${board.lanes[lane].length}</span></div>
        ${
          board.lanes[lane].length
            ? board.lanes[lane]
                .map(
                  (c) =>
                    `<div class="ticket"><div class="t-id mono">${esc(c.Story)}</div><div class="t-type">${esc(c.Type)}</div><div class="t-desc">${inline(c.Description).slice(0, 160)}${inline(c.Description).length > 160 ? "…" : ""}</div></div>`,
                )
                .join("")
            : `<div class="ticket empty">—</div>`
        }
      </div>`,
      )
      .join("")}
  </div>
</div>
<div class="card">
  <h3>Sprint history</h3>
  <table><thead><tr><th>Sprint</th><th>Stories</th></tr></thead><tbody>
  ${board.history.map((h) => `<tr><td>${inline(h.title)}</td><td>${h.count}</td></tr>`).join("")}
  </tbody></table>
</div>`;

const secStories = `
<div class="card">
  <h3>User story list <span class="count">${board.stories.length}</span></h3>
  <table><thead><tr><th>ID</th><th>Type</th><th>Description</th><th>Status</th><th>Sprint</th></tr></thead><tbody>
  ${board.stories
    .map(
      (s) =>
        `<tr><td class="mono">${esc(s.id)}</td><td>${esc(s.type)}</td><td>${inline(s.description)}</td><td>${statusPill(s.status)}</td><td>${esc(s.sprint)}</td></tr>`,
    )
    .join("")}
  </tbody></table>
</div>`;

const secDecisions = `
<div class="card">
  <h3>Decisions</h3>
  ${
    decisions.length
      ? `<table><thead><tr><th>Sprint</th><th>Decision</th></tr></thead><tbody>${decisions.map((d) => `<tr><td>${esc(d.sprint)}</td><td>${inline(d.text)}</td></tr>`).join("")}</tbody></table>`
      : `<p class="muted">No decisions extracted from sprint checkpoints yet. Decision IDs (D-nnn) are logged across the design docs.</p>`
  }
</div>`;

const secDefects = `
<div class="card">
  <h3>Defect log <span class="count">${openDefects} open</span></h3>
  <table><thead><tr><th>ID</th><th>Sprint</th><th>Severity</th><th>Description</th><th>Status</th></tr></thead><tbody>
  ${defects
    .map(
      (d) =>
        `<tr><td class="mono">${esc(d.ID)}</td><td>${esc(d.Sprint)}</td><td>${sevPill(d.Severity)}</td><td>${inline(d.Description).slice(0, 240)}${inline(d.Description).length > 240 ? "…" : ""}</td><td>${statusPill(d.Status)}</td></tr>`,
    )
    .join("")}
  </tbody></table>
</div>`;

const secChangelog = `
<div class="card">
  <h3>Change log <span class="muted">(most recent across design docs)</span></h3>
  <table><thead><tr><th>Date</th><th>Doc</th><th>Change</th></tr></thead><tbody>
  ${changelog
    .map(
      (c) =>
        `<tr><td class="mono nowrap">${esc(c.date)}</td><td class="mono">${esc(c.doc)}</td><td>${inline(c.desc).slice(0, 220)}${inline(c.desc).length > 220 ? "…" : ""}</td></tr>`,
    )
    .join("")}
  </tbody></table>
</div>`;

const secTooling = `
<div class="grid4">
  <div class="stat"><div class="stat-l">Agents</div><div class="stat-v">${tooling.agents.length}</div></div>
  <div class="stat"><div class="stat-l">Skills</div><div class="stat-v">${tooling.skills.length}</div></div>
  <div class="stat"><div class="stat-l">Workflows</div><div class="stat-v">${tooling.workflows.length}</div></div>
  <div class="stat"><div class="stat-l">Linters</div><div class="stat-v">${tooling.linters.length}</div></div>
</div>

<div class="card">
  <h3>Custom agents</h3>
  <table><thead><tr><th>Name</th><th>Model</th><th>Purpose</th></tr></thead><tbody>
  ${tooling.agents.map((a) => `<tr><td class="mono">${esc(a.name)}</td><td>${a.model ? `<span class="pill n">${esc(a.model)}</span>` : ""}</td><td>${inline(a.description)}</td></tr>`).join("")}
  </tbody></table>
</div>

<div class="card">
  <h3>Custom skills</h3>
  <table><thead><tr><th>Name</th><th>Purpose</th></tr></thead><tbody>
  ${tooling.skills.map((s) => `<tr><td class="mono">/${esc(s.name)}</td><td>${inline(s.description).slice(0, 200)}</td></tr>`).join("")}
  </tbody></table>
</div>

<div class="card">
  <h3>Commands &amp; workflows</h3>
  <table><thead><tr><th>Command</th><th>Purpose</th></tr></thead><tbody>
  ${tooling.commands.map((c) => `<tr><td class="mono">${esc(c.name)}</td><td>${inline(c.description)}</td></tr>`).join("")}
  </tbody></table>
  <table style="margin-top:12px"><thead><tr><th>Workflow (.js)</th><th>Purpose</th></tr></thead><tbody>
  ${tooling.workflows.map((w) => `<tr><td class="mono">${esc(w.name)}</td><td>${inline(w.description)}</td></tr>`).join("")}
  </tbody></table>
</div>

<div class="card">
  <h3>ESLint &amp; lint suite</h3>
  <p>Shared flat config: ${tooling.eslintShared ? '<span class="pill g">present</span>' : '<span class="pill r">missing</span>'} &nbsp;·&nbsp; ${tooling.lintScripts.length} <span class="muted">lint:* scripts wired in ${esc(MODULE)}</span> &nbsp;·&nbsp; ${tooling.linters.length} <span class="muted">custom architectural linters</span></p>
  <div class="chips">
    ${tooling.linters.map((l) => `<span class="chip mono">${esc(l.replace(/\.ts$/, ""))}</span>`).join("")}
  </div>
</div>`;

const secMethod = `
<div class="card">
  <h3>Build methodology <span class="muted">(Plan → Design → Build)</span></h3>
  <p class="muted">Every stage maps to a skill, workflow, or agent. ${toolPill("Have")} exists · ${toolPill("Extend")} needs a change · ${toolPill("New")} to author. Full detail in <span class="mono">Standards (Documents)/METHODOLOGY_BLUEPRINT.md</span>.</p>
  ${METHODOLOGY.map(
    (p) => `
    <div class="phase">
      <div class="phase-h">${esc(p.phase)}</div>
      <table><thead><tr><th>Stage</th><th>Artifact</th><th>Tooling</th><th>Status</th></tr></thead><tbody>
      ${p.stages.map((s) => `<tr><td>${esc(s.stage)}</td><td>${esc(s.artifact)}</td><td class="mono sm">${esc(s.tool)}</td><td>${toolPill(s.status)}</td></tr>`).join("")}
      </tbody></table>
    </div>`,
  ).join("")}
</div>`;

const NAV = [
  ["overview", "Overview"],
  ["board", "Sprint Board"],
  ["stories", "User Stories"],
  ["decisions", "Decisions"],
  ["defects", "Defects"],
  ["changelog", "Change Log"],
  ["tooling", "Tooling"],
  ["method", "Methodology"],
];
const SECTIONS = {
  overview: secOverview,
  board: secBoard,
  stories: secStories,
  decisions: secDecisions,
  defects: secDefects,
  changelog: secChangelog,
  tooling: secTooling,
  method: secMethod,
};

const html = `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(MODULE)} — Project Tracker</title>
<style>
  :root{
    --charcoal:#3D3A38; --charcoal2:#2E2B29; --ink:#1c1a19; --paper:#f4f2ef; --card:#ffffff;
    --line:#e2ddd6; --muted:#8a827a; --text:#26221f; --accent:#b8703a; --accent2:#7a6a58;
    --g:#3f7d54; --gb:#e2efe6; --b:#3a6ea5; --bb:#e2ecf6; --a:#b8863a; --ab:#f6eede;
    --o:#c1622e; --ob:#f7e6da; --r:#b23a3a; --rb:#f6e0e0; --n:#6b625a; --nb:#ece7e1;
  }
  *{box-sizing:border-box}
  body{margin:0;background:var(--paper);color:var(--text);font:14px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}
  .mono{font-family:"SF Mono",ui-monospace,"Cascadia Code",Menlo,Consolas,monospace;font-size:12.5px}
  .sm{font-size:12px}
  header{background:var(--charcoal);color:#f4f2ef;padding:14px 24px;display:flex;align-items:center;gap:20px;border-bottom:3px solid var(--accent)}
  header .brand{font-weight:700;letter-spacing:.3px}
  header .sub{color:#c9c1b8;font-size:12.5px}
  header .spacer{flex:1}
  header select{background:var(--charcoal2);color:#f4f2ef;border:1px solid #55504c;padding:6px 10px;font-size:13px}
  header .gen{color:#a89f95;font-size:12px}
  .wrap{display:flex;min-height:calc(100vh - 55px)}
  nav{width:190px;background:#ece7e1;border-right:1px solid var(--line);padding:14px 0;flex-shrink:0}
  nav a{display:block;padding:9px 22px;color:var(--text);text-decoration:none;font-weight:500;border-left:3px solid transparent;cursor:pointer}
  nav a:hover{background:#e2ddd6}
  nav a.active{border-left-color:var(--accent);background:#fff;color:var(--accent)}
  main{flex:1;padding:24px 28px;max-width:1180px}
  h3{margin:0 0 12px;font-size:15px}
  .card{background:var(--card);border:1px solid var(--line);padding:18px 20px;margin-bottom:20px}
  .grid4{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:20px}
  .stat{background:var(--card);border:1px solid var(--line);padding:14px 16px}
  .stat-l{color:var(--muted);font-size:11.5px;text-transform:uppercase;letter-spacing:.6px}
  .stat-v{font-size:26px;font-weight:700;margin-top:4px}
  .stat-v.sm{font-size:15px;font-weight:600;line-height:1.3}
  .stat-sub{font-size:14px;color:var(--muted);font-weight:400;margin-left:4px}
  table{width:100%;border-collapse:collapse}
  th,td{text-align:left;padding:8px 10px;border-bottom:1px solid var(--line);vertical-align:top}
  th{font-size:11.5px;text-transform:uppercase;letter-spacing:.5px;color:var(--muted);font-weight:600}
  table.kv th{width:190px;text-transform:none;font-size:13px;color:var(--n)}
  .muted{color:var(--muted)}
  .nowrap{white-space:nowrap}
  .pill{display:inline-block;padding:2px 9px;font-size:11.5px;font-weight:600;border:1px solid}
  .pill.g{background:var(--gb);color:var(--g);border-color:#bcd9c6}
  .pill.b{background:var(--bb);color:var(--b);border-color:#c3d6e8}
  .pill.a{background:var(--ab);color:var(--a);border-color:#e8d6b3}
  .pill.o{background:var(--ob);color:var(--o);border-color:#eccbb0}
  .pill.r{background:var(--rb);color:var(--r);border-color:#e6bcbc}
  .pill.n{background:var(--nb);color:var(--n);border-color:#d8d0c8}
  .count{display:inline-block;background:var(--nb);color:var(--n);font-size:12px;padding:1px 8px;font-weight:600;margin-left:4px}
  .lanes{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
  .lane-h{font-weight:700;font-size:13px;padding:6px 0;border-bottom:2px solid var(--charcoal);margin-bottom:10px}
  .ticket{background:#faf8f5;border:1px solid var(--line);border-left:3px solid var(--accent2);padding:10px 12px;margin-bottom:10px}
  .ticket.empty{border-left-color:var(--line);color:var(--muted);text-align:center}
  .t-id{font-weight:700;color:var(--charcoal)}
  .t-type{font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;margin:2px 0 6px}
  .t-desc{font-size:12.5px;color:var(--text)}
  .timeline{display:flex;flex-wrap:wrap;gap:6px}
  .tl-item{display:flex;align-items:center;gap:7px;padding:6px 11px;border:1px solid var(--line);font-size:12px}
  .tl-item.done{background:var(--gb);border-color:#bcd9c6}
  .tl-item.todo{background:#fff}
  .tl-n{font-weight:700;color:var(--charcoal);font-family:ui-monospace,monospace}
  .tl-name{color:var(--text)}
  .chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}
  .chip{background:var(--nb);border:1px solid #d8d0c8;padding:3px 9px;font-size:11.5px}
  .phase{margin-bottom:18px}
  .phase-h{font-weight:700;background:var(--charcoal);color:#f4f2ef;padding:6px 12px;display:inline-block;margin-bottom:8px;font-size:13px}
  footer{padding:16px 28px;color:var(--muted);font-size:12px;border-top:1px solid var(--line)}
</style></head>
<body>
<header>
  <div>
    <div class="brand">Life OS · Project Tracker</div>
    <div class="sub">Read-only PMO view · generated from project markdown</div>
  </div>
  <div class="spacer"></div>
  <label class="gen">Project&nbsp;
    <select onchange="return false" title="Only Financial Planner qualifies today (has design/ + project/)">
      ${projects.map((p) => `<option ${p === MODULE ? "selected" : ""}>${esc(p)}</option>`).join("")}
    </select>
  </label>
  <div class="gen">Generated ${now.toISOString().slice(0, 16).replace("T", " ")}</div>
</header>
<div class="wrap">
  <nav id="nav">
    ${NAV.map(([id, label], i) => `<a data-sec="${id}" class="${i === 0 ? "active" : ""}" onclick="showSec('${id}',this)">${label}</a>`).join("")}
  </nav>
  <main>
    ${Object.entries(SECTIONS)
      .map(
        ([id, html], i) =>
          `<section id="sec-${id}" style="display:${i === 0 ? "block" : "none"}">${html}</section>`,
      )
      .join("")}
  </main>
</div>
<footer>Life OS Project Tracker v1 · source: ${esc(MODULE)}/project + design + .claude · re-run <span class="mono">node "Project Tracker/dashboard/generate.mjs"</span> to refresh.</footer>
<script>
function showSec(id, el){
  document.querySelectorAll('main section').forEach(s=>s.style.display='none');
  document.getElementById('sec-'+id).style.display='block';
  document.querySelectorAll('#nav a').forEach(a=>a.classList.remove('active'));
  el.classList.add('active');
  window.scrollTo(0,0);
}
</script>
</body></html>`;

const outPath = join(SCRIPT_DIR, "dashboard.html");
writeFileSync(outPath, html, "utf8");
console.log(`Dashboard written: ${outPath}`);
console.log(
  `  module=${MODULE}  phase=${stage.phase}  stories=${totalStories} (${doneStories} done)  defects=${defects.length} (${openDefects} open)`,
);
console.log(
  `  tooling: ${tooling.agents.length} agents, ${tooling.skills.length} skills, ${tooling.commands.length} commands, ${tooling.workflows.length} workflows, ${tooling.linters.length} linters`,
);
