namespace com.lifeos.projecttracker;

using {cuid, managed} from '@sap/cds/common';
using {
  com.lifeos.projecttracker.FricewType,
  com.lifeos.projecttracker.InitiativeStatus,
  com.lifeos.projecttracker.StepKind,
  com.lifeos.projecttracker.SubtaskStatus,
  com.lifeos.projecttracker.TaskStatus
} from '../reference/schema';
using {com.lifeos.projecttracker.MethodologyStep} from '../methodology/schema';
using {
  com.lifeos.projecttracker.Activity,
  com.lifeos.projecttracker.Decision,
  com.lifeos.projecttracker.Defect,
  com.lifeos.projecttracker.TestRun
} from '../registers/schema';

@lifeos.sortKey: [
  'name',
  'ID'
]
entity Area : cuid, managed {
  name        : String(60) not null  @mandatory  @Common.Label: '{i18n>Area.name}';
  engagements : Association to many Engagement
                  on engagements.area = $self
                                     @Common.Label: '{i18n>Area.engagements}';
}

@lifeos.sortKey: [
  'area_ID',
  'name',
  'ID'
]
entity Engagement : cuid, managed {
  name       : String(60) not null           @mandatory  @Common.Label: '{i18n>Engagement.name}';
  area       : Association to Area not null  @mandatory  @Common.Label: '{i18n>Engagement.area}';
  workspaces : Association to many Workspace
                 on workspaces.engagement = $self
                                             @Common.Label: '{i18n>Engagement.workspaces}';
}

@assert.unique : {slug: [slug]}
@lifeos.sortKey: [
  'slug',
  'ID'
]
entity Workspace : cuid, managed {
  slug              : String(30) not null                 @mandatory  @Common.Label: '{i18n>Workspace.slug}';
  name              : String(60) not null                 @mandatory  @Common.Label: '{i18n>Workspace.name}';
  currentFocus      : LargeString                         @Common.Label: '{i18n>Workspace.currentFocus}';
  engagement        : Association to Engagement not null  @mandatory  @Common.Label: '{i18n>Workspace.engagement}';
  initiatives       : Association to many Initiative
                        on initiatives.workspace = $self
                                                          @Common.Label: '{i18n>Workspace.initiatives}';
  defects           : Association to many Defect
                        on defects.workspace = $self
                                                          @Common.Label: '{i18n>Workspace.defects}';
  decisions         : Association to many Decision
                        on decisions.workspace = $self
                                                          @Common.Label: '{i18n>Workspace.decisions}';
  activities        : Association to many Activity
                        on activities.workspace = $self
                                                          @Common.Label: '{i18n>Workspace.activities}';
  testRuns          : Association to many TestRun
                        on testRuns.workspace = $self
                                                          @Common.Label: '{i18n>Workspace.testRuns}';
  taskQueue         : Association to many TaskQueueItem
                        on taskQueue.workspaceId = ID
                                                          @Common.Label: '{i18n>Workspace.taskQueue}';
  recentCompletions : Association to many CompletedTaskItem
                        on recentCompletions.workspaceId = ID
                                                          @Common.Label: '{i18n>Workspace.recentCompletions}';
}

@assert.unique : {
  position       : [
    workspace,
    position
  ],
  nameInWorkspace: [
    workspace,
    name
  ]
}
@lifeos.sortKey: [
  'workspace_ID',
  'position',
  'ID'
]
entity Initiative : cuid, managed {
  name        : String(60) not null                       @mandatory  @Common.Label: '{i18n>Initiative.name}';
  goal        : LargeString                               @Common.Label: '{i18n>Initiative.goal}';
  branch      : String(60) not null                       @mandatory  @Common.Label: '{i18n>Initiative.branch}';
  status      : Association to InitiativeStatus not null  @mandatory  @Common.Label: '{i18n>Initiative.status}';
  mergeCommit : String(60)                                @Common.Label: '{i18n>Initiative.mergeCommit}';
  tag         : String(30)                                @Common.Label: '{i18n>Initiative.tag}';
  position    : Integer not null                          @mandatory  @Common.Label: '{i18n>Initiative.position}';
  workspace   : Association to Workspace not null         @mandatory  @Common.Label: '{i18n>Initiative.workspace}';
  milestones  : Association to many Milestone
                  on milestones.initiative = $self
                                                          @Common.Label: '{i18n>Initiative.milestones}';
}

@assert.unique : {
  position: [
    initiative,
    position
  ],
  storyId : [
    initiative,
    storyId
  ]
}
@lifeos.sortKey: [
  'initiative_ID',
  'position',
  'ID'
]
entity Milestone : cuid, managed {
  storyId     : String(30) not null                 @mandatory  @Common.Label: '{i18n>Milestone.storyId}';
  fricewType  : Association to FricewType not null  @mandatory  @Common.Label: '{i18n>Milestone.fricewType}';
  description : LargeString not null                @mandatory  @Common.Label: '{i18n>Milestone.description}';
  shipsUi     : Boolean not null                    @mandatory  @Common.Label: '{i18n>Milestone.shipsUi}';
  position    : Integer not null                    @mandatory  @Common.Label: '{i18n>Milestone.position}';
  initiative  : Association to Initiative not null  @mandatory  @Common.Label: '{i18n>Milestone.initiative}';
  tasks       : Association to many Task
                  on tasks.milestone = $self
                                                    @Common.Label: '{i18n>Milestone.tasks}';
}

@lifeos.sortKey: [
  'milestone_ID',
  'step_code',
  'ID'
]
entity Task : cuid, managed {
  step          : Association to MethodologyStep not null  @mandatory  @Common.Label: '{i18n>Task.step}';
  // The three guard inputs, copied from the step at instantiation and never
  // refreshed: read live, a library edit would re-derive a Done story's status
  // and move its guards. The driver stays live on purpose.
  kind          : Association to StepKind not null         @mandatory  @Common.Label: '{i18n>Task.kind}';
  position      : Integer not null                         @mandatory  @Common.Label: '{i18n>Task.position}';
  requiresHuman : Boolean not null                         @mandatory  @Common.Label: '{i18n>Task.requiresHuman}';
  status        : Association to TaskStatus not null       @mandatory  @Common.Label: '{i18n>Task.status}';
  startedAt     : DateTime                                 @Common.Label: '{i18n>Task.startedAt}';
  completedAt   : DateTime                                 @Common.Label: '{i18n>Task.completedAt}';
  notes         : LargeString                              @Common.Label: '{i18n>Task.notes}';
  milestone     : Association to Milestone not null        @mandatory  @Common.Label: '{i18n>Task.milestone}';
  subtasks      : Association to many Subtask
                    on subtasks.task = $self
                                                           @Common.Label: '{i18n>Task.subtasks}';
  testRuns      : Association to many TestRun
                    on testRuns.task = $self
                                                           @Common.Label: '{i18n>Task.testRuns}';
}

@lifeos.sortKey: [
  'task_ID',
  'step_code',
  'ID'
]
entity Subtask : cuid, managed {
  step          : Association to MethodologyStep not null  @mandatory  @Common.Label: '{i18n>Subtask.step}';
  // Frozen at instantiation for the same reason as on Task.
  kind          : Association to StepKind not null         @mandatory  @Common.Label: '{i18n>Subtask.kind}';
  position      : Integer not null                         @mandatory  @Common.Label: '{i18n>Subtask.position}';
  requiresHuman : Boolean not null                         @mandatory  @Common.Label: '{i18n>Subtask.requiresHuman}';
  status        : Association to SubtaskStatus not null    @mandatory  @Common.Label: '{i18n>Subtask.status}';
  completedAt   : DateTime                                 @Common.Label: '{i18n>Subtask.completedAt}';
  task          : Association to Task not null             @mandatory  @Common.Label: '{i18n>Subtask.task}';
}

// The queue the browser binds: incomplete Tasks with the owning workspace
// flattened onto the row, so the collection hangs off a Workspace in one hop
// rather than through a four-level path no `on` condition can express.
entity TaskQueueItem     as
  select from Task {
    key ID,

        @Common.Label: '{i18n>TaskQueueItem.stepCode}'
        step.code                                                       as stepCode           : String(30),

        @Common.Label: '{i18n>TaskQueueItem.stepName}'
        step.name                                                       as stepName           : String(60),

        @Common.Label: '{i18n>TaskQueueItem.stepPosition}'
        position                                                        as stepPosition       : Integer,

        @Common.Label: '{i18n>TaskQueueItem.driver}'
        step.driver                                                     as driver             : String(30),

        @Common.Label: '{i18n>TaskQueueItem.kindCode}'
        kind.code                                                       as kindCode           : String(30),

        @Common.Label: '{i18n>TaskQueueItem.requiresHuman}'
        requiresHuman,

        @Common.Label: '{i18n>TaskQueueItem.statusCode}'
        status.code                                                     as statusCode         : String(30),

        startedAt,

        @Common.Label: '{i18n>TaskQueueItem.milestoneId}'
        milestone.ID                                                    as milestoneId        : UUID,

        @Common.Label: '{i18n>TaskQueueItem.storyId}'
        milestone.storyId                                               as storyId            : String(30),

        // '/' must match REFERENCE.STORY_SEPARATOR in srv/modules/shared/constants.ts.
        @Common.Label: '{i18n>TaskQueueItem.story}'
        milestone.initiative.workspace.slug || '/' || milestone.storyId as story              : String(61),

        @Common.Label: '{i18n>TaskQueueItem.milestonePosition}'
        milestone.position                                              as milestonePosition  : Integer,

        @Common.Label: '{i18n>TaskQueueItem.initiativeId}'
        milestone.initiative.ID                                         as initiativeId       : UUID,

        @Common.Label: '{i18n>TaskQueueItem.initiativePosition}'
        milestone.initiative.position                                   as initiativePosition : Integer,

        @Common.Label: '{i18n>TaskQueueItem.workspaceId}'
        milestone.initiative.workspace.ID                               as workspaceId        : UUID
  }
  where
    status.code <> 'complete';

entity CompletedTaskItem as
  select from Task {
    key ID,

        // '/' must match REFERENCE.STORY_SEPARATOR in srv/modules/shared/constants.ts.
        @Common.Label: '{i18n>CompletedTaskItem.story}'
        milestone.initiative.workspace.slug || '/' || milestone.storyId as story       : String(61),

        @Common.Label: '{i18n>CompletedTaskItem.stepCode}'
        step.code                                                       as stepCode    : String(30),

        @Common.Label: '{i18n>CompletedTaskItem.stepName}'
        step.name                                                       as stepName    : String(60),

        @Common.Label: '{i18n>CompletedTaskItem.completedAt}'
        completedAt,

        @Common.Label: '{i18n>CompletedTaskItem.workspaceId}'
        milestone.initiative.workspace.ID                               as workspaceId : UUID
  }
  where
    completedAt is not null;
