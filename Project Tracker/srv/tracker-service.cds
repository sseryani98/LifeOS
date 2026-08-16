using {com.lifeos.projecttracker as pt} from '../db/schema';

service TrackerService @(path: '/service/trackerSvcs') {

  entity Areas            as projection on pt.Area;
  entity Engagements      as projection on pt.Engagement;

  // The writable entity wins the redirection contest against its own read-only
  // projection, and the annotation belongs on the service entity rather than on
  // the database one: annotations propagate into every projection, so at the
  // database level both candidates would carry it and the tie would remain.
  @cds.redirection.target
  entity Workspaces       as projection on pt.Workspace;

  entity Initiatives      as projection on pt.Initiative;

  // `status` is derived from the chain and is not a column, so it is filled on
  // read: nothing can write it and nothing has to remember to recompute it.
  entity Milestones       as
    projection on pt.Milestone {
      *,
      @Common.Label: '{i18n>Milestone.status}'
      virtual null as status : String(30)
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

  // The one-call read surface. A projection rather than a view, because a view
  // flattens into rows and the registers have to arrive as bindable collections;
  // rather than a function, because an opaque result cannot be bound at all.
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
