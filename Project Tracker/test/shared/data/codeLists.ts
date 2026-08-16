/**
 * Every code list, fully populated. Referential integrity is enforced at the
 * database, so a missing row is not a thinner fixture — it is a write that
 * cannot happen.
 */
export const CODE_LISTS = {
  ActivityKind: [
    { code: "migration", name: "Migration" },
    { code: "checkpoint", name: "Checkpoint" },
    { code: "statusUpdate", name: "Status Update" },
    { code: "focusChange", name: "Focus Change" },
    { code: "initiativeStatus", name: "Sprint Status" },
    { code: "lesson", name: "Lesson" },
    { code: "sprintPlanned", name: "Sprint Planned" },
    { code: "storyAdded", name: "Story Added" },
    { code: "stageStarted", name: "Stage Started" },
    { code: "stageCompleted", name: "Stage Completed" },
    { code: "subtaskCompleted", name: "Step Completed" },
    { code: "stageReopened", name: "Stage Reopened" },
    { code: "defectLogged", name: "Defect Logged" },
    { code: "defectResolved", name: "Defect Resolved" },
    { code: "decisionRecorded", name: "Decision Recorded" },
    { code: "testRunRecorded", name: "Test Run Recorded" },
  ],
  ActorKind: [
    { code: "human", name: "Human" },
    { code: "agent", name: "Agent" },
    { code: "system", name: "System" },
  ],
  Actor: [
    { code: "sandro", name: "Sandro", kind_code: "human" },
    { code: "implementer", name: "Implementer", kind_code: "agent" },
    { code: "test-author", name: "Test Author", kind_code: "agent" },
    { code: "gate-runner", name: "Gate Runner", kind_code: "agent" },
    { code: "build-briefer", name: "Build Briefer", kind_code: "agent" },
    { code: "pm-update", name: "PM Update", kind_code: "agent" },
    { code: "test-report", name: "Test Report", kind_code: "system" },
    { code: "migration", name: "Migration", kind_code: "system" },
  ],
  DefectSeverity: [
    { code: "Critical", name: "Critical" },
    { code: "High", name: "High" },
    { code: "Medium", name: "Medium" },
    { code: "Low", name: "Low" },
  ],
  DefectStatus: [
    { code: "Open", name: "Open" },
    { code: "Closed", name: "Closed" },
  ],
  FricewType: [
    { code: "Interface", name: "Interface" },
    { code: "Conversion", name: "Conversion" },
    { code: "Enhancement", name: "Enhancement" },
    { code: "Form", name: "Form" },
    { code: "Report", name: "Report" },
    { code: "Workflow", name: "Workflow" },
  ],
  HealthState: [
    { code: "Healthy", name: "Healthy" },
    { code: "NeedsAttention", name: "Needs Attention" },
    { code: "Struggling", name: "Struggling" },
  ],
  InitiativeStatus: [
    { code: "Active", name: "Active" },
    { code: "Complete", name: "Complete" },
  ],
  MilestoneStatus: [
    { code: "backlog", name: "Backlog" },
    { code: "inProgress", name: "In Progress" },
    { code: "done", name: "Done" },
  ],
  StepKind: [
    { code: "Required", name: "Required" },
    { code: "Conditional", name: "Conditional" },
    { code: "Recommended", name: "Recommended" },
  ],
  SubtaskStatus: [
    { code: "notStarted", name: "Not Started" },
    { code: "complete", name: "Complete" },
  ],
  TaskStatus: [
    { code: "notStarted", name: "Not Started" },
    { code: "inProgress", name: "In Progress" },
    { code: "complete", name: "Complete" },
  ],
} as const;
