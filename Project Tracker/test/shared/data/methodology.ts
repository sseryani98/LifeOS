/** The one methodology every story in this fixture is instantiated from. */
export const METHODOLOGY = { code: "sprint-build", name: "Sprint Build" } as const;

/** The nine stage steps, in library position order. */
export const STAGE_STEPS = [
  {
    code: "sprint-build",
    name: "Sprint Build",
    position: 10,
    kind: "Required",
    conditional: null,
    requiresHuman: false,
    driver: "/build",
  },
  {
    code: "code-quality",
    name: "Code Quality",
    position: 20,
    kind: "Required",
    conditional: null,
    requiresHuman: false,
    driver: "/code-quality",
  },
  {
    code: "test-quality",
    name: "Test Quality",
    position: 30,
    kind: "Required",
    conditional: null,
    requiresHuman: false,
    driver: "/test-quality",
  },
  {
    code: "functional-test",
    name: "Functional Test",
    position: 40,
    kind: "Required",
    conditional: null,
    requiresHuman: false,
    driver: "/functional-test",
  },
  {
    code: "ux-test",
    name: "UX Test",
    position: 50,
    kind: "Conditional",
    conditional: "shipsUi",
    requiresHuman: false,
    driver: "/ux-test",
  },
  {
    code: "human-review",
    name: "Human Review",
    position: 60,
    kind: "Required",
    conditional: null,
    requiresHuman: true,
    driver: "/human-review-loop",
  },
  {
    code: "documentation",
    name: "Documentation",
    position: 70,
    kind: "Recommended",
    conditional: null,
    requiresHuman: false,
    driver: "/refresh-docs",
  },
  {
    code: "pm-update",
    name: "PM Update",
    position: 80,
    kind: "Required",
    conditional: null,
    requiresHuman: false,
    driver: "/pm-update",
  },
  {
    code: "commit",
    name: "Commit",
    position: 90,
    kind: "Required",
    conditional: null,
    requiresHuman: false,
    driver: "/commit-diff",
  },
] as const;

/** The seven workflow steps under the first stage, in library position order. */
export const SUBTASK_STEPS = [
  { code: "brief", name: "Brief", position: 10, kind: "Required", conditional: null },
  { code: "red", name: "Red", position: 20, kind: "Required", conditional: null },
  {
    code: "implement",
    name: "Implement",
    position: 30,
    kind: "Required",
    conditional: null,
  },
  { code: "gate", name: "Gate", position: 40, kind: "Required", conditional: null },
  {
    code: "coverage",
    name: "Coverage",
    position: 50,
    kind: "Required",
    conditional: null,
  },
  {
    code: "smoke",
    name: "Smoke",
    position: 60,
    kind: "Conditional",
    conditional: "shipsUi",
  },
  {
    code: "handoff",
    name: "Handoff",
    position: 70,
    kind: "Required",
    conditional: null,
  },
] as const;

/** The stage codes a backend story materialises — every step but the UI one. */
export const BACKEND_STAGE_CODES = [
  "sprint-build",
  "code-quality",
  "test-quality",
  "functional-test",
  "human-review",
  "documentation",
  "pm-update",
  "commit",
] as const;

/** The step codes a backend story materialises under its first stage. */
export const BACKEND_SUBTASK_CODES = [
  "brief",
  "red",
  "implement",
  "gate",
  "coverage",
  "handoff",
] as const;
