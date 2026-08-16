/** Reference forms the addressing rules accept and refuse. */
export const REFERENCES = {
  QUALIFIED: "financial-planner/CNV-001",
  BARE: "CNV-001",
  EMPTY_WORKSPACE: "/CNV-001",
  EMPTY_STORY: "financial-planner/",
  THREE_SEGMENTS: "financial-planner/CNV-001/extra",
  WORKSPACE_ONLY: "financial-planner",
} as const;

/** The shapes a parsed reference and a built target take. */
export const EXPECTED = {
  PARSED_STORY: { workspaceSlug: "financial-planner", storyId: "CNV-001" },
  PARSED_INNER: { workspaceSlug: "financial-planner", innerName: "CNV-001" },
  PARSED_WORKSPACE: { workspaceSlug: "financial-planner", innerName: null },
  TARGET_WORKSPACE: "financial-planner",
  TARGET_STORY: "financial-planner/CNV-001",
  TARGET_STAGE: "financial-planner/CNV-001#code-quality",
} as const;

/** The pieces an activity target is assembled from. */
export const TARGET_PARTS = {
  WORKSPACE: "financial-planner",
  STORY: "CNV-001",
  STAGE: "code-quality",
} as const;

/** A chain, in library position order, with one stage of each state that matters. */
export const CHAIN_FIXTURE = [
  {
    ID: "task-build",
    status_code: "complete",
    startedAt: null,
    completedAt: "2026-08-10T09:00:00Z",
    notes: null,
    step_code: "sprint-build",
    stepName: "Sprint Build",
    stepPosition: 10,
    stepKind: "Required",
    driver: "/build",
  },
  {
    ID: "task-human-review",
    status_code: "notStarted",
    startedAt: null,
    completedAt: null,
    notes: null,
    step_code: "human-review",
    stepName: "Human Review",
    stepPosition: 60,
    stepKind: "Required",
    driver: "/human-review-loop",
  },
  {
    ID: "task-documentation",
    status_code: "notStarted",
    startedAt: null,
    completedAt: null,
    notes: null,
    step_code: "documentation",
    stepName: "Documentation",
    stepPosition: 70,
    stepKind: "Recommended",
    driver: "/refresh-docs",
  },
  {
    ID: "task-commit",
    status_code: "notStarted",
    startedAt: null,
    completedAt: null,
    notes: null,
    step_code: "commit",
    stepName: "Commit",
    stepPosition: 90,
    stepKind: "Required",
    driver: "/commit-diff",
  },
];

/** A chain whose every stage is closed. */
export const FINISHED_CHAIN = CHAIN_FIXTURE.map(row => ({
  ...row,
  status_code: "complete",
}));

/** Steps under a stage, one closed and one still open. */
export const SUBTASK_FIXTURE = [
  {
    ID: "sub-brief",
    status_code: "complete",
    completedAt: "2026-08-10T09:00:00Z",
    step_code: "brief",
    stepName: "Brief",
    stepPosition: 10,
  },
  {
    ID: "sub-handoff",
    status_code: "notStarted",
    completedAt: null,
    step_code: "handoff",
    stepName: "Handoff",
    stepPosition: 70,
  },
];

/** The story identifier the resolver stamps onto a next action. */
export const FIXTURE_STORY_ID = "CNV-001";

/** Message keys the envelope suite resolves and rejects under. */
export const ENVELOPE_KEYS = {
  KNOWN: "verb.identity.missing",
  UNKNOWN: "verb.no.such.key",
  BLOCKED: "verb.stage.blocked",
} as const;

/** Detail an envelope carries when a guard supplies one. */
export const ENVELOPE_DETAIL = {
  target: "commit",
  remediation: "Complete human-review first.",
  rule: "wfl.stage.predecessorOpen",
} as const;

/** An activity event with no payload, and one with. */
export const ACTIVITY_EVENTS = {
  BARE: {
    kind: "stageStarted",
    target: "financial-planner/CNV-001",
    workspaceId: "workspace-1",
  },
  WITH_PAYLOAD: {
    kind: "stageReopened",
    target: "financial-planner/CNV-001#code-quality",
    workspaceId: "workspace-1",
    payload: { reason: "defect found at commit" },
  },
} as const;

/** Queue rows out of order, so a sort has something to do. */
export const QUEUE_ROWS = [
  {
    ID: "queue-b",
    initiativePosition: 20,
    milestonePosition: 10,
    stepPosition: 10,
  },
  {
    ID: "queue-c",
    initiativePosition: 10,
    milestonePosition: 20,
    stepPosition: 10,
  },
  {
    ID: "queue-a",
    initiativePosition: 10,
    milestonePosition: 10,
    stepPosition: 20,
  },
];

/** Workspaces out of slug order. */
export const WORKSPACE_ROWS = [
  { ID: "ws-2", slug: "project-tracker", name: "Project Tracker", currentFocus: null },
  { ID: "ws-1", slug: "financial-planner", name: "Financial Planner", currentFocus: null },
];

/** Sprints out of position order. */
export const INITIATIVE_ROWS = [
  {
    ID: "init-2",
    name: "W1-S4",
    goal: null,
    branch: "sprint/W1-S4",
    status_code: "Active",
    mergeCommit: null,
    tag: null,
    position: 20,
  },
  {
    ID: "init-1",
    name: "W1-S3",
    goal: null,
    branch: "sprint/W1-S3",
    status_code: "Complete",
    mergeCommit: "abc1234",
    tag: "v1.2",
    position: 10,
  },
];
