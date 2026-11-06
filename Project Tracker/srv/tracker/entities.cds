using {TrackerService} from '../tracker-service';
using {com.lifeos.projecttracker as pt} from '../../db/hierarchy/schema';
using from '../../db/reference/schema';
using from '../../db/methodology/schema';
using from '../../db/registers/schema';

extend service TrackerService with {
  entity Areas              as projection on pt.Area;
  entity Engagements        as projection on pt.Engagement;

  @cds.redirection.target
  entity Workspaces         as projection on pt.Workspace;

  entity Initiatives        as projection on pt.Initiative;

  // `status` is derived from the chain and is not a column, so it is filled on
  // read: nothing can write it and nothing has to remember to recompute it.
  entity Milestones         as
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
  entity Tasks              as projection on pt.Task;

  entity Subtasks           as projection on pt.Subtask;
  entity Methodologies      as projection on pt.Methodology;
  entity MethodologySteps   as projection on pt.MethodologyStep;
  entity Defects            as projection on pt.Defect;
  entity Decisions          as projection on pt.Decision;
  entity Activities         as projection on pt.Activity;
  entity TestRuns           as projection on pt.TestRun;

  // Tier and blocker are computed over the whole chain, not the open rows
  // alone, so the read handler fills them and returns the rows in that order.
  @readonly
  entity TaskQueueItems     as
    projection on pt.TaskQueueItem {
      *,
      @Common.Label: '{i18n>TaskQueueItem.tier}'
      virtual null as tier            : Integer,

      @Common.Label: '{i18n>TaskQueueItem.blockerStepCode}'
      virtual null as blockerStepCode : String(30)
    };

  // The completer is read from the stage's latest completion event, never
  // stored on the Task.
  @readonly
  entity CompletedTaskItems as
    projection on pt.CompletedTaskItem {
      *,
      @Common.Label: '{i18n>CompletedTaskItem.completedBy}'
      virtual null as completedBy : String(30)
    };

  // The one-call read surface: the registers arrive as bindable collections.
  @readonly
  entity ProjectView        as
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
      recentCompletions,

      @Common.Label: '{i18n>ProjectView.health}'
      virtual null as health                  : String(30),

      @Common.Label: '{i18n>ProjectView.nextActionStory}'
      virtual null as nextActionStory         : String(61),

      @Common.Label: '{i18n>ProjectView.nextActionStepCode}'
      virtual null as nextActionStepCode      : String(30),

      @Common.Label: '{i18n>ProjectView.nextActionLabel}'
      virtual null as nextActionLabel         : String(60),

      @Common.Label: '{i18n>ProjectView.nextActionDescription}'
      virtual null as nextActionDescription   : String(200),

      @Common.Label: '{i18n>ProjectView.nextActionKind}'
      virtual null as nextActionKind          : String(30),

      @Common.Label: '{i18n>ProjectView.nextActionDriver}'
      virtual null as nextActionDriver        : String(30),

      @Common.Label: '{i18n>ProjectView.nextActionRequiresHuman}'
      virtual null as nextActionRequiresHuman : Boolean,

      @Common.Label: '{i18n>ProjectView.nextActionStatus}'
      virtual null as nextActionStatus        : String(30),

      @Common.Label: '{i18n>ProjectView.nextActionTier}'
      virtual null as nextActionTier          : Integer,

      @Common.Label: '{i18n>ProjectView.gateTotal}'
      virtual null as gateTotal               : Integer,

      @Common.Label: '{i18n>ProjectView.gatePassed}'
      virtual null as gatePassed              : Integer,

      @Common.Label: '{i18n>ProjectView.gateFailed}'
      virtual null as gateFailed              : Integer,

      @Common.Label: '{i18n>ProjectView.gateLinesPct}'
      virtual null as gateLinesPct            : Decimal(5, 2),

      @Common.Label: '{i18n>ProjectView.gateBranchesPct}'
      virtual null as gateBranchesPct         : Decimal(5, 2),

      @Common.Label: '{i18n>ProjectView.gateExecutedAt}'
      virtual null as gateExecutedAt          : DateTime
    };
}
