using {com.lifeos.projecttracker as pt} from '../db/hierarchy/schema';
using from '../db/reference/schema';
using from '../db/methodology/schema';
using from '../db/registers/schema';

service TrackerService @(path: '/service/trackerSvcs') {

  entity Areas            as projection on pt.Area;
  entity Engagements      as projection on pt.Engagement;

  @cds.redirection.target
  entity Workspaces       as projection on pt.Workspace;

  entity Initiatives      as projection on pt.Initiative;

  // `status` is derived from the chain and is not a column, so it is filled on
  // read: nothing can write it and nothing has to remember to recompute it.
  entity Milestones       as
    projection on pt.Milestone {
      *,
      @Common.Label: '{i18n>Milestone.status}'
      virtual null as status : String(30),

      // Create-only input: the create-handler reads it to decide whether a chain
      // is materialised, and nothing stores it.
      @UI.Hidden
      @Core.Computed: false
      @Common.Label : '{i18n>Milestone.createdDone}'
      virtual createdDone    : Boolean
    };

  // Same tie as Workspaces, between a Task and the queue view built over it.
  @cds.redirection.target
  entity Tasks            as projection on pt.Task;

  entity Subtasks         as projection on pt.Subtask;
  entity Methodologies    as projection on pt.Methodology;
  entity MethodologySteps as projection on pt.MethodologyStep;
  entity Defects          as projection on pt.Defect;
  entity Decisions        as projection on pt.Decision;
  entity Activities       as projection on pt.Activity;
  entity TestRuns         as projection on pt.TestRun;

  @readonly
  entity TaskQueueItems   as projection on pt.TaskQueueItem;

  // The one-call read surface: the registers arrive as bindable collections.
  @readonly
  entity ProjectView      as
    projection on pt.Workspace {
      ID,
      slug,
      name,
      currentFocus,
      initiatives,
      defects,
      decisions,
      activities,
      taskQueue,

      @Common.Label: '{i18n>ProjectView.health}'
      virtual null as health             : String(30),

      @Common.Label: '{i18n>ProjectView.nextActionStoryId}'
      virtual null as nextActionStoryId  : String(30),

      @Common.Label: '{i18n>ProjectView.nextActionStepCode}'
      virtual null as nextActionStepCode : String(30),

      @Common.Label: '{i18n>ProjectView.nextActionLabel}'
      virtual null as nextActionLabel    : String(60),

      @Common.Label: '{i18n>ProjectView.nextActionDriver}'
      virtual null as nextActionDriver   : String(30),

      @Common.Label: '{i18n>ProjectView.gateTotal}'
      virtual null as gateTotal          : Integer,

      @Common.Label: '{i18n>ProjectView.gatePassed}'
      virtual null as gatePassed         : Integer,

      @Common.Label: '{i18n>ProjectView.gateFailed}'
      virtual null as gateFailed         : Integer,

      @Common.Label: '{i18n>ProjectView.gateLinesPct}'
      virtual null as gateLinesPct       : Decimal(5, 2),

      @Common.Label: '{i18n>ProjectView.gateBranchesPct}'
      virtual null as gateBranchesPct    : Decimal(5, 2),

      @Common.Label: '{i18n>ProjectView.gateExecutedAt}'
      virtual null as gateExecutedAt     : DateTime
    };
}

// The floor is what makes the handler's sum rule sound: a negative count could
// otherwise balance an over-total one.
annotate TrackerService.TestRuns with {
  total   @assert.range: [
    0,
    _
  ];
  passed  @assert.range: [
    0,
    _
  ];
  failed  @assert.range: [
    0,
    _
  ];
  pending @assert.range: [
    0,
    _
  ];
};
