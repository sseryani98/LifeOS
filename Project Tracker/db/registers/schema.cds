namespace com.lifeos.projecttracker;

using {cuid, managed} from '@sap/cds/common';
using {
  com.lifeos.projecttracker.ActivityKind,
  com.lifeos.projecttracker.Actor,
  com.lifeos.projecttracker.DefectSeverity,
  com.lifeos.projecttracker.DefectStatus
} from '../reference/schema';
using {
  com.lifeos.projecttracker.Initiative,
  com.lifeos.projecttracker.Milestone,
  com.lifeos.projecttracker.Task,
  com.lifeos.projecttracker.Workspace
} from '../hierarchy/schema';

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
  decision   : LargeString not null               @mandatory  @Common.Label: '{i18n>Decision.decision}';
  rationale  : LargeString                        @Common.Label: '{i18n>Decision.rationale}';
  context    : LargeString                        @Common.Label: '{i18n>Decision.context}';
  options    : LargeString                        @Common.Label: '{i18n>Decision.options}';
  decidedAt  : DateTime not null                  @mandatory  @Common.Label: '{i18n>Decision.decidedAt}';
  initiative : Association to Initiative          @Common.Label: '{i18n>Decision.initiative}';
  milestone  : Association to Milestone           @Common.Label: '{i18n>Decision.milestone}';
  workspace  : Association to Workspace not null  @mandatory  @Common.Label: '{i18n>Decision.workspace}';
}

// `target` is a qualified reference string, not a foreign key: sixteen kinds point
// at eight entity types, and an append-only history must survive as written rather
// than be held to referential integrity.
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
