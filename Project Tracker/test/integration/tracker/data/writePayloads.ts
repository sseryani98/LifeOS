import { WORLD } from "../../../shared/data/world.js";

/** The service paths the read-path suite writes to and reads from. */
export const PATHS = {
  DECISIONS: "/service/trackerSvcs/Decisions",
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

/** A story that ships UI, so its chain materialises the one Conditional stage. */
export const UI_STORY = {
  storyId: "RPT-010",
  fricewType_code: "Report",
  description: "Valuation report page",
  shipsUi: true,
  position: 30,
} as const;

/** The qualified reference the verbs address that story by. */
export const UI_STORY_REFERENCE = `${WORLD.WORKSPACE.slug}/${UI_STORY.storyId}`;

/** A sprint completed properly, for patching one of its facts away afterwards. */
export const COMPLETE_INITIATIVE_WITH_FACTS = {
  name: "W1-S8",
  goal: "Closed and recorded",
  branch: "sprint/W1-S8",
  position: 80,
  status_code: "Complete",
  mergeCommit: "abc1234",
  tag: "v0.8",
} as const;

/** The two git facts a sprint records before being marked complete. */
export const COMPLETION_FACTS_PATCH = {
  mergeCommit: "def5678",
  tag: "v0.9",
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

/** A patch that clears the sprint link, which a story-scoped defect never had. */
export const CLEAR_SPRINT_LINK_PATCH = { initiative_ID: null } as const;

/** A patch that clears the sprint link a sprint-scoped test run hangs off. */
export const ORPHANING_TEST_RUN_PATCH = { initiative_ID: null } as const;

/** A new goal for a sprint, sent beside its own unchanged name. */
export const UNCHANGED_NAME_GOAL_EDIT = "Points valuation, rescoped";

/** A new description for a story, sent beside its own unchanged identifier. */
export const UNCHANGED_STORY_ID_DESCRIPTION_EDIT = "Categorization rules, rescoped";

/** A sprint claiming the position the canonical sprint already holds. */
export const POSITION_CLASH_INITIATIVE = {
  ...SECOND_INITIATIVE,
  position: WORLD.INITIATIVE.position,
} as const;

/** A story claiming the position the canonical story already holds. */
export const POSITION_CLASH_STORY = {
  ...SECOND_STORY,
  position: WORLD.STORY.position,
} as const;

/** A sprint with every mandatory field but its branch. */
export const INITIATIVE_WITHOUT_BRANCH = {
  name: "W1-S5",
  goal: "Rewards ledger",
  position: 50,
  status_code: "Active",
} as const;

/** A test run scoped to a sprint, but with no time it ran at. */
export const TEST_RUN_WITHOUT_EXECUTED_AT = {
  total: 1,
  passed: 1,
  failed: 0,
} as const;

/** A decision against the workspace, but with no time it was taken. */
export const DECISION_WITHOUT_DECIDED_AT = {
  decision: "Copy on write",
  rationale: "The read path is on the dashboard's critical path",
} as const;
