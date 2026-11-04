namespace com.lifeos.projecttracker;

using {managed} from '@sap/cds/common';
using {com.lifeos.projecttracker.StepKind} from '../reference/schema';

// Keyed by code rather than cuid, because every verb addresses a step by its
// slug. Structurally generic, functionally singular: a second methodology is
// one row plus its steps, and nothing anywhere selects between them.
@lifeos.sortKey: ['code']
entity Methodology : managed {
  key code  : String(30)           @Common.Label: '{i18n>Methodology.code}';
      name  : String(60) not null  @mandatory  @Common.Label: '{i18n>Methodology.name}';
      steps : Composition of many MethodologyStep
                on steps.methodology = $self
                                   @Common.Label: '{i18n>Methodology.steps}';
}

@lifeos.sortKey: [
  'methodology_code',
  'parent_code',
  'position',
  'code'
]
entity MethodologyStep : managed {
  key code          : String(30)                           @Common.Label: '{i18n>MethodologyStep.code}';
      name          : String(60) not null                  @mandatory  @Common.Label: '{i18n>MethodologyStep.name}';
      description   : String(200) not null                 @mandatory  @Common.Label: '{i18n>MethodologyStep.description}';
      kind          : Association to StepKind not null     @mandatory  @Common.Label: '{i18n>MethodologyStep.kind}';
      position      : Integer not null                     @mandatory  @Common.Label: '{i18n>MethodologyStep.position}';
      conditional   : String(30)                           @Common.Label: '{i18n>MethodologyStep.conditional}';
      requiresHuman : Boolean not null                     @mandatory  @Common.Label: '{i18n>MethodologyStep.requiresHuman}';
      driver        : String(30) not null                  @mandatory  @Common.Label: '{i18n>MethodologyStep.driver}';
      parent        : Association to MethodologyStep       @Common.Label: '{i18n>MethodologyStep.parent}';
      methodology   : Association to Methodology not null  @mandatory  @Common.Label: '{i18n>MethodologyStep.methodology}';
      children      : Association to many MethodologyStep
                        on children.parent = $self
                                                           @Common.Label: '{i18n>MethodologyStep.children}';
}
