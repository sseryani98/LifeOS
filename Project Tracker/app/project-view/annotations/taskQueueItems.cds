using TrackerService as svc from '../../../srv/tracker-service';

annotate svc.TaskQueueItems:ID with @UI.Hidden;

annotate svc.TaskQueueItems with {
  milestoneId        @UI.Hidden;
  initiativeId       @UI.Hidden;
  workspaceId        @UI.Hidden;
  storyId            @UI.Hidden;
  stepCode           @UI.Hidden;
  stepPosition       @UI.Hidden;
  milestonePosition  @UI.Hidden;
  initiativePosition @UI.Hidden;
  tier               @UI.Hidden;
};

// No SortOrder: the queue's order leads with the story's tier, computed on read
// and no column, so the read handler sorts the rows. It sorts only the page it
// gets, so the view's table threshold keeps the whole queue on one page.
annotate svc.TaskQueueItems with @UI: {
  LineItem           : [
    {
      $Type                : 'UI.DataField',
      Value                : story,
      ![@HTML5.CssDefaults]: {width: '30%'}
    },
    {
      $Type                : 'UI.DataField',
      Value                : stepName,
      ![@HTML5.CssDefaults]: {width: '40%'}
    },
    {
      $Type                : 'UI.DataField',
      Value                : driver,
      ![@HTML5.CssDefaults]: {width: '30%'}
    }
  ],
  PresentationVariant: {Visualizations: ['@UI.LineItem']}
};
