namespace com.lifeos.projecttracker;

using {com.lifeos.projecttracker.CodeList} from '../common/common';

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

// No stored foreign key points here; it is a table because the exporter reads tables.
@lifeos.sortKey: ['code']
entity HealthState : CodeList {}

@lifeos.sortKey: ['code']
entity InitiativeStatus : CodeList {}

// A Milestone's status is derived from its chain, never stored.
@lifeos.sortKey: ['code']
entity MilestoneStatus : CodeList {}

@lifeos.sortKey: ['code']
entity StepKind : CodeList {}

@lifeos.sortKey: ['code']
entity SubtaskStatus : CodeList {}

@lifeos.sortKey: ['code']
entity TaskStatus : CodeList {}
