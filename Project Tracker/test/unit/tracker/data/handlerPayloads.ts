/** A sprint marked complete, with and without the facts a complete one records. */
export const COMPLETION_PAYLOADS = {
  ACTIVE: { status_code: "Active" },
  COMPLETE_WITH_BOTH: {
    status_code: "Complete",
    mergeCommit: "abc1234",
    tag: "v1.2",
  },
  COMPLETE_WITHOUT_TAG: { status_code: "Complete", mergeCommit: "abc1234" },
  COMPLETE_WITHOUT_COMMIT: { status_code: "Complete", tag: "v1.2" },
} as const;

/** A defect with each combination of the two links it may carry. */
export const DEFECT_SCOPES = {
  ON_STORY: { milestone_ID: "milestone-1", initiative_ID: null },
  ON_SPRINT: { milestone_ID: null, initiative_ID: "initiative-1" },
  ORPHAN: { milestone_ID: null, initiative_ID: null },
} as const;

/** A test run with each combination of the two links it may carry. */
export const TEST_RUN_SCOPES = {
  ON_STAGE: { task_ID: "task-1", initiative_ID: null },
  ON_SPRINT: { task_ID: null, initiative_ID: "initiative-1" },
  ORPHAN: { task_ID: null, initiative_ID: null },
} as const;

/** Chains a story's status is derived from. */
export const DERIVATION_CHAINS = {
  EMPTY: [],
  ALL_NOT_STARTED: [
    { status_code: "notStarted", stepKind: "Required" },
    { status_code: "notStarted", stepKind: "Recommended" },
  ],
  ONE_IN_PROGRESS: [
    { status_code: "complete", stepKind: "Required" },
    { status_code: "inProgress", stepKind: "Required" },
  ],
  BLOCKING_ALL_COMPLETE: [
    { status_code: "complete", stepKind: "Required" },
    { status_code: "notStarted", stepKind: "Recommended" },
  ],
} as const;

/** A read result with a tree hanging off it, and one with nothing. */
export const EXPANDED_READS = {
  WITH_TREE: [
    {
      ID: "workspace-1",
      initiatives: [
        { ID: "initiative-1", milestones: [{ ID: "milestone-1" }] },
        { ID: "initiative-2", milestones: [] },
      ],
    },
  ],
  WITHOUT_TREE: [{ ID: "workspace-1" }, { ID: "workspace-2", initiatives: [{}] }],
} as const;

/** Chain rows spread across two stories, for the grouping. */
export const CHAIN_ROWS = [
  {
    ID: "task-1",
    milestone_ID: "milestone-1",
    status_code: "complete",
    stepKind: "Required",
  },
  {
    ID: "task-2",
    milestone_ID: "milestone-1",
    status_code: "notStarted",
    stepKind: "Required",
  },
  {
    ID: "task-3",
    milestone_ID: "milestone-2",
    status_code: "notStarted",
    stepKind: "Required",
  },
];
