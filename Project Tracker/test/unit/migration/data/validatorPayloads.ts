/** The links a register row may carry, by the sprint or story they point at. */
const LINK = {
  MILESTONE: "a3f0c2d1-0b6e-4c55-9d2a-1f7e3b8c4d01",
  INITIATIVE: "b4e1d3c2-1c7f-4d66-8e3b-2a8f4c9d5e02",
  TASK: "c5f2e4d3-2d80-4e77-9f4c-3b905dae6f03",
} as const;

/** A seeded Defect with each combination of the two links it may carry. */
export const DEFECT_TARGETS = {
  ON_MILESTONE: { milestone_ID: LINK.MILESTONE, initiative_ID: null },
  ON_INITIATIVE: { milestone_ID: null, initiative_ID: LINK.INITIATIVE },
  ON_BOTH: { milestone_ID: LINK.MILESTONE, initiative_ID: LINK.INITIATIVE },
  ON_NOTHING: { milestone_ID: null, initiative_ID: null },
} as const;

/** A seeded Defect's status beside each resolution it may arrive with. */
export const DEFECT_RESOLUTIONS = {
  OPEN_WITHOUT: { status_code: "Open", resolution: null },
  CLOSED_WITH: {
    status_code: "Closed",
    resolution: "Restored the junction by re-running the postinstall.",
  },
  OPEN_WITH: {
    status_code: "Open",
    resolution: "Fixed by repointing the threshold globs.",
  },
  // The log's own placeholder for an empty Resolution cell.
  OPEN_WITH_PLACEHOLDER: { status_code: "Open", resolution: "—" },
  CLOSED_WITHOUT: { status_code: "Closed", resolution: null },
  CLOSED_WITH_EMPTY: { status_code: "Closed", resolution: "" },
} as const;

/** A seeded TestRun with each combination of the two links it may carry. */
export const TEST_RUN_TARGETS = {
  ON_TASK: { task_ID: LINK.TASK, initiative_ID: null },
  ON_INITIATIVE: { task_ID: null, initiative_ID: LINK.INITIATIVE },
  ON_NOTHING: { task_ID: null, initiative_ID: null },
} as const;

/** Mapped stories: all six types, and a batch with two strays the remap missed. */
export const STORY_TYPES = {
  ALL_SIX: [
    { storyId: "conversion-story", fricewType_code: "Conversion" },
    { storyId: "enhancement-story", fricewType_code: "Enhancement" },
    { storyId: "form-story", fricewType_code: "Form" },
    { storyId: "interface-story", fricewType_code: "Interface" },
    { storyId: "report-story", fricewType_code: "Report" },
    { storyId: "workflow-story", fricewType_code: "Workflow" },
  ],
  TWO_STRAYS: [
    { storyId: "interface-story", fricewType_code: "Integration" },
    { storyId: "form-story", fricewType_code: "Form" },
    { storyId: "second-interface-story", fricewType_code: "Integrations" },
  ],
} as const;

/** The keys and status the register rules refuse under. */
export const REGISTER_RULE = {
  DEFECT_TARGET_MISSING: "cnv.defect.targetMissing",
  TEST_RUN_TARGET_MISSING: "cnv.testrun.targetMissing",
  RESOLUTION_ON_OPEN: "cnv.defect.resolutionOnOpen",
  RESOLUTION_MISSING: "cnv.defect.resolutionMissing",
  TYPE_NOT_IN_CODE_LIST: "verb.value.notInCodeList",
  BAD_INPUT: 400,
} as const;
