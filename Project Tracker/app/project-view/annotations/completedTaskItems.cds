using TrackerService as svc from '../../../srv/tracker-service';

annotate svc.CompletedTaskItems : ID with @UI.Hidden;

annotate svc.CompletedTaskItems with {
  workspaceId @UI.Hidden;
  stepCode    @UI.Hidden;
};

annotate svc.CompletedTaskItems with @UI: {
  LineItem           : [
    {
      $Type                : 'UI.DataField',
      Value                : story,
      ![@HTML5.CssDefaults]: {width: '25%'}
    },
    {
      $Type                : 'UI.DataField',
      Value                : stepName,
      ![@HTML5.CssDefaults]: {width: '25%'}
    },
    {
      $Type                : 'UI.DataField',
      Value                : completedAt,
      ![@HTML5.CssDefaults]: {width: '25%'}
    },
    {
      $Type                : 'UI.DataField',
      Value                : completedBy,
      ![@HTML5.CssDefaults]: {width: '25%'}
    }
  ],
  PresentationVariant: {
    SortOrder     : [{
      Property  : completedAt,
      Descending: true
    }],
    Visualizations: ['@UI.LineItem']
  }
};
