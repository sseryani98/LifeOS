/** The two sprints the stories sit in. */
const SPRINT_ID = {
  FIRST: "d6a3f5e4-3e91-4f88-a05d-4ca16ebf7a04",
  SECOND: "e7b4a6f5-4fa2-4a99-b16e-5db27fc08b05",
} as const;

/** The key the ordering assertion fails under. */
export const ORDERING_KEY = "cnv.reconcile.orderingMismatch";

/** Sprints, each carrying a position or having lost it. */
export const ORDERING_INITIATIVES = {
  POSITIONED: [
    { ID: SPRINT_ID.FIRST, name: "First sprint", position: 10 },
    { ID: SPRINT_ID.SECOND, name: "Second sprint", position: 20 },
  ],
  ONE_UNPOSITIONED: [
    { ID: SPRINT_ID.FIRST, name: "First sprint", position: 10 },
    { ID: SPRINT_ID.SECOND, name: "Second sprint", position: null },
  ],
} as const;

/** Stories in board order, one without a position, and a pair sharing one slot. */
export const ORDERING_STORIES = {
  POSITIONED: [
    {
      ID: "f8c5b7a6-50b3-4baa-827f-6ec38ad19c06",
      storyId: "first-story",
      fricewType_code: "Conversion",
      position: 10,
      initiative_ID: SPRINT_ID.FIRST,
    },
    {
      ID: "a9d6c8b7-61c4-4cbb-9380-7fd49be2ad07",
      storyId: "second-story",
      fricewType_code: "Report",
      position: 20,
      initiative_ID: SPRINT_ID.FIRST,
    },
  ],
  ONE_UNPOSITIONED: [
    {
      ID: "f8c5b7a6-50b3-4baa-827f-6ec38ad19c06",
      storyId: "first-story",
      fricewType_code: "Conversion",
      position: 10,
      initiative_ID: SPRINT_ID.FIRST,
    },
    {
      ID: "a9d6c8b7-61c4-4cbb-9380-7fd49be2ad07",
      storyId: "unpositioned-story",
      fricewType_code: "Report",
      position: null,
      initiative_ID: SPRINT_ID.FIRST,
    },
  ],
  // The third shares the pair's position in another sprint, which is no clash.
  SHARED_SLOT: [
    {
      ID: "f8c5b7a6-50b3-4baa-827f-6ec38ad19c06",
      storyId: "slot-holder-story",
      fricewType_code: "Conversion",
      position: 10,
      initiative_ID: SPRINT_ID.FIRST,
    },
    {
      ID: "a9d6c8b7-61c4-4cbb-9380-7fd49be2ad07",
      storyId: "slot-clash-story",
      fricewType_code: "Report",
      position: 10,
      initiative_ID: SPRINT_ID.FIRST,
    },
    {
      ID: "b0e7d9c8-72d5-4dcc-a491-80e5acf3be08",
      storyId: "other-sprint-story",
      fricewType_code: "Form",
      position: 10,
      initiative_ID: SPRINT_ID.SECOND,
    },
  ],
} as const;
