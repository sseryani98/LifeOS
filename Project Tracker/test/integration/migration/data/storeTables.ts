/**
 * Database-level names the migration specs read and tamper with directly. The
 * entity map is keyed by the names the tie-out reports in, so a row read here
 * lines up with a reconciliation line by name.
 */
export const STORE_TABLES = {
  ENTITY: {
    Area: "com.lifeos.projecttracker.Area",
    Engagement: "com.lifeos.projecttracker.Engagement",
    Workspace: "com.lifeos.projecttracker.Workspace",
    Initiative: "com.lifeos.projecttracker.Initiative",
    Milestone: "com.lifeos.projecttracker.Milestone",
    Task: "com.lifeos.projecttracker.Task",
    Subtask: "com.lifeos.projecttracker.Subtask",
    Defect: "com.lifeos.projecttracker.Defect",
    Decision: "com.lifeos.projecttracker.Decision",
    TestRun: "com.lifeos.projecttracker.TestRun",
    Activity: "com.lifeos.projecttracker.Activity",
  },
  // The story type code list, which a mis-seed would widen.
  FRICEW_TYPE: "com.lifeos.projecttracker.FricewType",
} as const;
