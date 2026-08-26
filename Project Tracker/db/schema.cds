namespace com.lifeos.projecttracker;

using {
  cuid,
  managed
} from '@sap/cds/common';

// A finite vocabulary is a table with rows, never a String enum. The aspect is
// local rather than sap.common.CodeList because that one carries `localized`
// elements, and localization would add a _texts table per list plus a Languages
// entity — tables the entity contract does not have and the exporter would find.
@cds.autoexpose
aspect CodeList {
  key code : String(30)  @Common: {
                           Text           : name,
                           TextArrangement: #TextOnly
                         }  @Common.Label: '{i18n>CodeList.code}';
      name : String(60) not null  @mandatory  @Common.Label: '{i18n>CodeList.name}';
}

/* ------------------------------------------------------------------------- */
/* Code lists                                                                */
/* ------------------------------------------------------------------------- */

@lifeos.sortKey: ['code']
entity ActivityKind : CodeList {}

@lifeos.sortKey: ['code']
entity ActorKind : CodeList {}

@lifeos.sortKey: ['code']
entity Actor : CodeList {
  kind : Association to ActorKind not null  @mandatory  @Common.Label: '{i18n>Actor.kind}';
}

@lifeos.sortKey: ['code']
entity DefectSeverity : CodeList {}

@lifeos.sortKey: ['code']
entity DefectStatus : CodeList {}

@lifeos.sortKey: ['code']
entity FricewType : CodeList {}

// Backs a virtual element and carries no stored foreign key anywhere. It is a
// table with rows all the same, because the exporter reads tables.
@lifeos.sortKey: ['code']
entity HealthState : CodeList {}

@lifeos.sortKey: ['code']
entity InitiativeStatus : CodeList {}

// Backs a virtual element too — a Milestone's status is derived from its chain.
@lifeos.sortKey: ['code']
entity MilestoneStatus : CodeList {}

@lifeos.sortKey: ['code']
entity StepKind : CodeList {}

@lifeos.sortKey: ['code']
entity SubtaskStatus : CodeList {}

@lifeos.sortKey: ['code']
entity TaskStatus : CodeList {}

/* ------------------------------------------------------------------------- */
/* Hierarchy                                                                 */
/* ------------------------------------------------------------------------- */

@lifeos.sortKey: [
  'name',
  'ID'
]
entity Area : cuid, managed {
  name        : String(60) not null                 @mandatory  @Common.Label: '{i18n>Area.name}';
  engagements : Association to many Engagement
                  on engagements.area = $self       @Common.Label: '{i18n>Area.engagements}';
}

@lifeos.sortKey: [
  'area_ID',
  'name',
  'ID'
]
entity Engagement : cuid, managed {
  name       : String(60) not null                 @mandatory  @Common.Label: '{i18n>Engagement.name}';
  area       : Association to Area not null        @mandatory  @Common.Label: '{i18n>Engagement.area}';
  workspaces : Association to many Workspace
                 on workspaces.engagement = $self  @Common.Label: '{i18n>Engagement.workspaces}';
}

@assert.unique : {slug: [slug]}
@lifeos.sortKey: [
  'slug',
  'ID'
]
entity Workspace : cuid, managed {
  slug         : String(30) not null                  @mandatory  @Common.Label: '{i18n>Workspace.slug}';
  name         : String(60) not null                  @mandatory  @Common.Label: '{i18n>Workspace.name}';
  currentFocus : LargeString                          @Common.Label: '{i18n>Workspace.currentFocus}';
  engagement   : Association to Engagement not null   @mandatory  @Common.Label: '{i18n>Workspace.engagement}';
  initiatives  : Association to many Initiative
                   on initiatives.workspace = $self   @Common.Label: '{i18n>Workspace.initiatives}';
  defects      : Association to many Defect
                   on defects.workspace = $self       @Common.Label: '{i18n>Workspace.defects}';
  decisions    : Association to many Decision
                   on decisions.workspace = $self     @Common.Label: '{i18n>Workspace.decisions}';
  activities   : Association to many Activity
                   on activities.workspace = $self    @Common.Label: '{i18n>Workspace.activities}';
  testRuns     : Association to many TestRun
                   on testRuns.workspace = $self      @Common.Label: '{i18n>Workspace.testRuns}';
  taskQueue    : Association to many TaskQueueItem
                   on taskQueue.workspaceId = ID      @Common.Label: '{i18n>Workspace.taskQueue}';
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
                  on milestones.initiative = $self        @Common.Label: '{i18n>Initiative.milestones}';
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
  storyId     : String(30) not null                  @mandatory  @Common.Label: '{i18n>Milestone.storyId}';
  fricewType  : Association to FricewType not null   @mandatory  @Common.Label: '{i18n>Milestone.fricewType}';
  description : LargeString not null                 @mandatory  @Common.Label: '{i18n>Milestone.description}';
  shipsUi     : Boolean not null                     @mandatory  @Common.Label: '{i18n>Milestone.shipsUi}';
  position    : Integer not null                     @mandatory  @Common.Label: '{i18n>Milestone.position}';
  initiative  : Association to Initiative not null   @mandatory  @Common.Label: '{i18n>Milestone.initiative}';
  tasks       : Association to many Task
                  on tasks.milestone = $self         @Common.Label: '{i18n>Milestone.tasks}';
}

@lifeos.sortKey: [
  'milestone_ID',
  'step_code',
  'ID'
]
entity Task : cuid, managed {
  step        : Association to MethodologyStep not null  @mandatory  @Common.Label: '{i18n>Task.step}';
  status      : Association to TaskStatus not null       @mandatory  @Common.Label: '{i18n>Task.status}';
  startedAt   : DateTime                                 @Common.Label: '{i18n>Task.startedAt}';
  completedAt : DateTime                                 @Common.Label: '{i18n>Task.completedAt}';
  notes       : LargeString                              @Common.Label: '{i18n>Task.notes}';
  milestone   : Association to Milestone not null        @mandatory  @Common.Label: '{i18n>Task.milestone}';
  subtasks    : Association to many Subtask
                  on subtasks.task = $self               @Common.Label: '{i18n>Task.subtasks}';
  testRuns    : Association to many TestRun
                  on testRuns.task = $self               @Common.Label: '{i18n>Task.testRuns}';
}

@lifeos.sortKey: [
  'task_ID',
  'step_code',
  'ID'
]
entity Subtask : cuid, managed {
  step        : Association to MethodologyStep not null  @mandatory  @Common.Label: '{i18n>Subtask.step}';
  status      : Association to SubtaskStatus not null    @mandatory  @Common.Label: '{i18n>Subtask.status}';
  completedAt : DateTime                                 @Common.Label: '{i18n>Subtask.completedAt}';
  task        : Association to Task not null             @mandatory  @Common.Label: '{i18n>Subtask.task}';
}

/* ------------------------------------------------------------------------- */
/* Methodology                                                               */
/* ------------------------------------------------------------------------- */

// Keyed by code rather than cuid, because every verb addresses a step by its
// slug. Structurally generic, functionally singular: a second methodology is
// one row plus its steps, and nothing anywhere selects between them.
@lifeos.sortKey: ['code']
entity Methodology : managed {
  key code  : String(30)               @Common.Label: '{i18n>Methodology.code}';
      name  : String(60) not null      @mandatory  @Common.Label: '{i18n>Methodology.name}';
      steps : Composition of many MethodologyStep
                on steps.methodology = $self  @Common.Label: '{i18n>Methodology.steps}';
}

@lifeos.sortKey: [
  'methodology_code',
  'parent_code',
  'position',
  'code'
]
entity MethodologyStep : managed {
  key code          : String(30)                              @Common.Label: '{i18n>MethodologyStep.code}';
      name          : String(60) not null                     @mandatory  @Common.Label: '{i18n>MethodologyStep.name}';
      description   : String(200) not null                    @mandatory  @Common.Label: '{i18n>MethodologyStep.description}';
      kind          : Association to StepKind not null        @mandatory  @Common.Label: '{i18n>MethodologyStep.kind}';
      position      : Integer not null                        @mandatory  @Common.Label: '{i18n>MethodologyStep.position}';
      conditional   : String(30)                              @Common.Label: '{i18n>MethodologyStep.conditional}';
      requiresHuman : Boolean not null                        @mandatory  @Common.Label: '{i18n>MethodologyStep.requiresHuman}';
      driver        : String(30) not null                     @mandatory  @Common.Label: '{i18n>MethodologyStep.driver}';
      parent        : Association to MethodologyStep          @Common.Label: '{i18n>MethodologyStep.parent}';
      methodology   : Association to Methodology not null     @mandatory  @Common.Label: '{i18n>MethodologyStep.methodology}';
      children      : Association to many MethodologyStep
                        on children.parent = $self            @Common.Label: '{i18n>MethodologyStep.children}';
}

/* ------------------------------------------------------------------------- */
/* Registers                                                                 */
/* ------------------------------------------------------------------------- */

@lifeos.sortKey: [
  'createdAt',
  'ID'
]
entity Defect : cuid, managed {
  severity    : Association to DefectSeverity not null  @mandatory  @Common.Label: '{i18n>Defect.severity}';
  status      : Association to DefectStatus not null    @mandatory  @Common.Label: '{i18n>Defect.status}';
  title       : String(200) not null                    @mandatory  @Common.Label: '{i18n>Defect.title}';
  description : LargeString not null                    @mandatory  @Common.Label: '{i18n>Defect.description}';
  references  : LargeString                             @Common.Label: '{i18n>Defect.references}';
  resolution  : LargeString                             @Common.Label: '{i18n>Defect.resolution}';
  milestone   : Association to Milestone                @Common.Label: '{i18n>Defect.milestone}';
  initiative  : Association to Initiative               @Common.Label: '{i18n>Defect.initiative}';
  workspace   : Association to Workspace not null       @mandatory  @Common.Label: '{i18n>Defect.workspace}';
}

// The Workspace | Initiative | Milestone target is two nullable links plus the
// mandatory scope: a Decision with both links null targets its Workspace.
@lifeos.sortKey: [
  'decidedAt',
  'ID'
]
entity Decision : cuid, managed {
  decision   : LargeString not null                @mandatory  @Common.Label: '{i18n>Decision.decision}';
  rationale  : LargeString                         @Common.Label: '{i18n>Decision.rationale}';
  context    : LargeString                         @Common.Label: '{i18n>Decision.context}';
  options    : LargeString                         @Common.Label: '{i18n>Decision.options}';
  // No @cds.on.insert stamp: the verb layer is the only writer and always
  // supplies the envelope's own timestamp, which a managed stamp would discard.
  decidedAt  : DateTime not null                   @mandatory  @Common.Label: '{i18n>Decision.decidedAt}';
  initiative : Association to Initiative           @Common.Label: '{i18n>Decision.initiative}';
  milestone  : Association to Milestone            @Common.Label: '{i18n>Decision.milestone}';
  workspace  : Association to Workspace not null   @mandatory  @Common.Label: '{i18n>Decision.workspace}';
}

// `target` is a qualified reference string and not a foreign key. Sixteen kinds
// point at eight entity types, so explicit links would be eight columns with
// seven null on every row — and referential integrity is the wrong behaviour on
// an append-only historical record that must survive as written.
@lifeos.sortKey: [
  'occurredAt',
  'ID'
]
entity Activity : cuid, managed {
  kind       : Association to ActivityKind not null  @mandatory  @Common.Label: '{i18n>Activity.kind}';
  actor      : Association to Actor not null         @mandatory  @Common.Label: '{i18n>Activity.actor}';
  target     : String(120) not null                  @mandatory  @Common.Label: '{i18n>Activity.target}';
  payload    : LargeString                           @Common.Label: '{i18n>Activity.payload}';
  // Timestamp, not DateTime: both drivers render a DateTime to whole seconds on
  // read, so two events written inside one second come back tied — and this is
  // the column the register orders by, on an append-only log.
  occurredAt : Timestamp not null                    @mandatory  @Common.Label: '{i18n>Activity.occurredAt}';
  workspace  : Association to Workspace not null     @mandatory  @Common.Label: '{i18n>Activity.workspace}';
}

// `failures` is a JSON-encoded LargeString rather than a CDS `array of`: it is
// byte-stable across a CSV export and reload, and maps identically on both
// engines the module runs on.
@lifeos.sortKey: [
  'executedAt',
  'ID'
]
entity TestRun : cuid, managed {
  total       : Integer not null                   @mandatory  @Common.Label: '{i18n>TestRun.total}';
  passed      : Integer not null                   @mandatory  @Common.Label: '{i18n>TestRun.passed}';
  failed      : Integer not null                   @mandatory  @Common.Label: '{i18n>TestRun.failed}';
  pending     : Integer                            @Common.Label: '{i18n>TestRun.pending}';
  durationMs  : Integer                            @Common.Label: '{i18n>TestRun.durationMs}';
  linesPct    : Decimal(5, 2)                      @Common.Label: '{i18n>TestRun.linesPct}';
  branchesPct : Decimal(5, 2)                      @Common.Label: '{i18n>TestRun.branchesPct}';
  failures    : LargeString                        @Common.Label: '{i18n>TestRun.failures}';
  executedAt  : DateTime not null                  @mandatory  @Common.Label: '{i18n>TestRun.executedAt}';
  task        : Association to Task                @Common.Label: '{i18n>TestRun.task}';
  initiative  : Association to Initiative          @Common.Label: '{i18n>TestRun.initiative}';
  workspace   : Association to Workspace not null  @mandatory  @Common.Label: '{i18n>TestRun.workspace}';
}

/* ------------------------------------------------------------------------- */
/* Read view — no table behind it                                            */
/* ------------------------------------------------------------------------- */

// The queue the browser binds: incomplete Tasks with the owning workspace
// flattened onto the row, so the collection hangs off a Workspace in one hop
// rather than through a four-level path no `on` condition can express.
entity TaskQueueItem  as
  select from Task {
    key ID,

        @Common.Label: '{i18n>TaskQueueItem.stepCode}'
        step.code                         as stepCode           : String(30),

        @Common.Label: '{i18n>TaskQueueItem.stepName}'
        step.name                         as stepName           : String(60),

        @Common.Label: '{i18n>TaskQueueItem.stepPosition}'
        step.position                     as stepPosition       : Integer,

        @Common.Label: '{i18n>TaskQueueItem.driver}'
        step.driver                       as driver             : String(30),

        @Common.Label: '{i18n>TaskQueueItem.statusCode}'
        status.code                       as statusCode         : String(30),

        startedAt,

        @Common.Label: '{i18n>TaskQueueItem.milestoneId}'
        milestone.ID                      as milestoneId        : UUID,

        @Common.Label: '{i18n>TaskQueueItem.storyId}'
        milestone.storyId                 as storyId            : String(30),

        @Common.Label: '{i18n>TaskQueueItem.milestonePosition}'
        milestone.position                as milestonePosition  : Integer,

        @Common.Label: '{i18n>TaskQueueItem.initiativeId}'
        milestone.initiative.ID           as initiativeId       : UUID,

        @Common.Label: '{i18n>TaskQueueItem.initiativePosition}'
        milestone.initiative.position     as initiativePosition : Integer,

        @Common.Label: '{i18n>TaskQueueItem.workspaceId}'
        milestone.initiative.workspace.ID as workspaceId        : UUID
  }
  where
    status.code <> 'complete';
