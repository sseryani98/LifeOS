import { SPRINT_PLAN } from "../../../shared/data/world.js";

import { PLANNED_REFERENCES } from "./nextActionWorld.js";
import { EXPECTED_STAGE_STEPS } from "./seededLibrary.js";

/** The seeded facts of the stages a next action is asserted against. */
export const STEP_FACTS = {
  BUILD: EXPECTED_STAGE_STEPS[0],
  HUMAN_REVIEW: EXPECTED_STAGE_STEPS[5],
  DOCUMENTATION: EXPECTED_STAGE_STEPS[6],
} as const;

/** A plan holding only the UI story, so the one fresh candidate it adds is a UI story. */
export const UI_ONLY_PLAN_STORIES = [{ ...SPRINT_PLAN.stories[1] }];

/** The planned sprint's stories, by bare identifier, in the order the plan supplied them. */
export const PLANNED_STORY_ID = {
  FIRST: SPRINT_PLAN.stories[0].id,
  LAST: SPRINT_PLAN.stories[2].id,
} as const;

/** The planned sprint's first and last stories, qualified. */
export const PLANNED_REFERENCE = {
  FIRST: PLANNED_REFERENCES[0],
  LAST: PLANNED_REFERENCES[2],
} as const;

/** Every sprint's position once the plan lands on the migrated workspace: the maximum plus 10. */
export const EXPECTED_SPRINT_POSITIONS = [
  { name: "W1-S1", position: 10 },
  { name: "W1-S2", position: 20 },
  { name: "W1-S3", position: 30 },
  { name: SPRINT_PLAN.name, position: 40 },
] as const;

/** The planned stories' positions, from their index in the plan's array. */
export const EXPECTED_PLANNED_STORY_POSITIONS = {
  [SPRINT_PLAN.stories[0].id]: 10,
  [SPRINT_PLAN.stories[1].id]: 20,
  [SPRINT_PLAN.stories[2].id]: 30,
} as const;
