using TrackerService as svc from '../../../srv/tracker-service';

annotate svc.ProjectView : ID with @UI.Hidden;

annotate svc.ProjectView with @UI.HeaderInfo: {
  TypeName      : '{i18n>ProjectView.typeName}',
  TypeNamePlural: '{i18n>ProjectView.typeNamePlural}',
  Title         : {Value: name}
};
