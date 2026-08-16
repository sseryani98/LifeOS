/** The service paths the read-path suite writes to and reads from. */
export const PATHS = {
  DEFECTS: "/service/trackerSvcs/Defects",
  INITIATIVES: "/service/trackerSvcs/Initiatives",
  MILESTONES: "/service/trackerSvcs/Milestones",
  PROJECT_VIEW: "/service/trackerSvcs/ProjectView",
  TEST_RUNS: "/service/trackerSvcs/TestRuns",
  WORKSPACES: "/service/trackerSvcs/Workspaces",
} as const;

/** The expand that pulls the whole tree onto one read of the view. */
export const PROJECT_VIEW_EXPAND =
  "?$expand=initiatives($expand=milestones),defects,decisions,activities,taskQueue";

/** A second sprint in the same workspace, which is legal on its own. */
export const SECOND_INITIATIVE = {
  name: "W1-S4",
  goal: "Points valuation",
  branch: "sprint/W1-S4",
  position: 20,
  status_code: "Active",
} as const;

/** A sprint marked complete without either of the git facts a complete one records. */
export const COMPLETE_INITIATIVE_MISSING_FACTS = {
  name: "W1-S9",
  goal: "Closed without recording how",
  branch: "sprint/W1-S9",
  position: 90,
  status_code: "Complete",
} as const;

/** A second story, legal on its own. */
export const SECOND_STORY = {
  storyId: "ENH-009",
  fricewType_code: "Enhancement",
  description: "Categorization rules",
  shipsUi: false,
  position: 20,
} as const;

/** A defect with neither of the two links a defect must carry one of. */
export const ORPHAN_DEFECT = {
  severity_code: "Low",
  status_code: "Open",
  title: "Belongs to nothing",
  description: "No story and no sprint carries it.",
} as const;

/** A test run with neither of the two links a run must carry one of. */
export const ORPHAN_TEST_RUN = {
  total: 1,
  passed: 1,
  failed: 0,
  executedAt: "2026-08-16T10:00:00Z",
} as const;

/** A second workspace claiming a slug that is already taken. */
export const DUPLICATE_SLUG_WORKSPACE = {
  slug: "financial-planner",
  name: "A second workspace with the first one's slug",
} as const;
