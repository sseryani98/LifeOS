import {
  EXPECTED_CHAIN,
  EXPECTED_HIERARCHY,
  EXPECTED_INITIATIVES,
  EXPECTED_MILESTONES,
  ACTIVITY_KIND,
  MIGRATION_ACTOR,
  MIGRATION_KEYS,
  MIGRATION_STATUS,
  RETIRED_FRICEW_TYPE,
} from "../data/financialPlannerSnapshot.js";
import {
  connectTrackerService,
  trackerServer,
} from "../../../shared/support/trackerHarness.js";
import {
  arrangeHierarchyLoaded,
  captureMigrationRefusal,
  runLoadHierarchy,
} from "../support/migrationHarness.js";
import {
  readMigratedChain,
  readMigratedStories,
  readStatusesByReference,
} from "../support/readMigratedStories.js";
import {
  countRowsByEntity,
  readCreatedByByEntity,
  readMigratedActivities,
  readMigratedHierarchy,
  readMigratedInitiatives,
} from "../support/readMigration.js";

/**
 * The hierarchy-and-story load, run once against a store holding only the
 * deployed library, then read back level by level.
 */
describe("loading the planner's hierarchy and stories", () => {
  beforeAll(async () => {
    await trackerServer;
    await arrangeHierarchyLoaded();
  });

  /** The planner's work must hang off one Area → Engagement → Workspace path, or every read by slug resolves nothing or twice. */
  it("builds one area, engagement and workspace chain named for the planner", async () => {
    const { areas, engagements, workspaces } = await readMigratedHierarchy();

    expect(areas.map(area => area.name)).toEqual([
      EXPECTED_HIERARCHY.AREA.name,
    ]);
    expect(engagements.map(row => row.name)).toEqual([
      EXPECTED_HIERARCHY.ENGAGEMENT.name,
    ]);
    expect(engagements[0].area_ID).toBe(areas[0].ID);
    expect(workspaces.map(({ slug, name }) => ({ slug, name }))).toEqual([
      {
        slug: EXPECTED_HIERARCHY.WORKSPACE.slug,
        name: EXPECTED_HIERARCHY.WORKSPACE.name,
      },
    ]);
  });

  /** A focus nobody set would be invented state; the first human focus change must start from nothing. */
  it("leaves the workspace with no current focus", async () => {
    const { workspaces } = await readMigratedHierarchy();

    expect(workspaces[0].currentFocus).toBeNull();
  });

  /** Two finished sprints and one in flight is the planner's real state; any other status mix misreports where the build is. */
  it("creates the three sprints under the workspace, the first two Complete and the last Active", async () => {
    const { workspaces } = await readMigratedHierarchy();
    const initiatives = await readMigratedInitiatives();

    expect(
      initiatives.map(({ name, status_code }) => ({ name, status_code })),
    ).toEqual(
      EXPECTED_INITIATIVES.map(({ name, status_code }) => ({
        name,
        status_code,
      })),
    );
    expect(new Set(initiatives.map(row => row.workspace_ID))).toEqual(
      new Set([workspaces[0].ID]),
    );
  });

  /** The register must name the commits and tags git actually holds, and nothing for a sprint not yet merged. */
  it("records each sprint's merge commit, tag and branch as git holds them", async () => {
    const initiatives = await readMigratedInitiatives();

    expect(
      initiatives.map(({ name, mergeCommit, tag, branch }) => ({
        name,
        mergeCommit,
        tag,
        branch,
      })),
    ).toEqual(
      EXPECTED_INITIATIVES.map(({ name, mergeCommit, tag, branch }) => ({
        name,
        mergeCommit,
        tag,
        branch,
      })),
    );
  });

  /** A goal is quoted from its source or left empty; one written for the first sprint would be fabricated history. */
  it("takes each sprint's goal from its source, leaving the first sprint's null", async () => {
    const initiatives = await readMigratedInitiatives();

    expect(initiatives.map(({ name, goal }) => ({ name, goal }))).toEqual(
      EXPECTED_INITIATIVES.map(({ name, goal }) => ({ name, goal })),
    );
  });

  /** Every migrated row shares one createdAt, so only position gives the sprints a total order. */
  it("positions the sprints 10, 20 and 30", async () => {
    const initiatives = await readMigratedInitiatives();

    expect(
      initiatives.map(({ name, position }) => ({ name, position })),
    ).toEqual(
      EXPECTED_INITIATIVES.map(({ name, position }) => ({ name, position })),
    );
  });

  /** Each board row must become one story in its own sprint, addressable as the verbs address it, in board order. */
  it("creates the twelve board stories, each under its sprint in board order", async () => {
    const stories = await readMigratedStories();

    expect(
      stories.map(({ reference, initiativeName }) => ({
        reference,
        initiativeName,
      })),
    ).toEqual(
      EXPECTED_MILESTONES.map(({ reference, initiative }) => ({
        reference,
        initiativeName: initiative,
      })),
    );
  });

  /** The register is trusted only if a description reads exactly as the board printed it. */
  it("stores each story's description verbatim from the board", async () => {
    const stories = await readMigratedStories();

    expect(
      Object.fromEntries(stories.map(row => [row.reference, row.description])),
    ).toEqual(
      Object.fromEntries(
        EXPECTED_MILESTONES.map(row => [row.reference, row.description]),
      ),
    );
  });

  /** Next-story ordering reads position, so it must restart per sprint in steps of ten and never repeat within one. */
  it("positions each story by board order, gapped by ten and restarting per sprint", async () => {
    const stories = await readMigratedStories();

    expect(
      Object.fromEntries(stories.map(row => [row.reference, row.position])),
    ).toEqual(
      Object.fromEntries(
        EXPECTED_MILESTONES.map(row => [row.reference, row.position]),
      ),
    );
  });

  /** The creation flag is the only thing that makes a finished story Done; without it all twelve would read Backlog. */
  it("derives Done for the eleven finished stories and Backlog for the one still open", async () => {
    const service = await connectTrackerService();

    const statuses = await readStatusesByReference(service);

    expect(statuses).toEqual(
      Object.fromEntries(
        EXPECTED_MILESTONES.map(row => [row.reference, row.derivedStatus]),
      ),
    );
  });

  /** A null shipsUi leaves the chain's UI steps undecidable, so every story must carry the value its description implies. */
  it("sets shipsUi on every story, true only for the four that ship a screen", async () => {
    const stories = await readMigratedStories();

    expect(
      Object.fromEntries(stories.map(row => [row.reference, row.shipsUi])),
    ).toEqual(
      Object.fromEntries(
        EXPECTED_MILESTONES.map(row => [row.reference, row.shipsUi]),
      ),
    );
  });

  /** The plural board type is retired; storing it would split one story kind across two codes. */
  it("stores Interface for the board's two Integration stories and passes the other types through", async () => {
    const stories = await readMigratedStories();

    expect(
      Object.fromEntries(
        stories.map(row => [row.reference, row.fricewType_code]),
      ),
    ).toEqual(
      Object.fromEntries(
        EXPECTED_MILESTONES.map(row => [row.reference, row.fricewType_code]),
      ),
    );
    expect(stories.map(row => row.fricewType_code)).not.toContain(
      RETIRED_FRICEW_TYPE,
    );
  });

  /** The chain comes from the create-handler, not the load: only the one story created in Backlog may get one. */
  it("ends with exactly one chain, on the Backlog story", async () => {
    const { tasks, subtasks } = await readMigratedChain();

    expect([...new Set(tasks.map(row => row.reference))]).toEqual([
      EXPECTED_CHAIN.REFERENCE,
    ]);
    expect(tasks).toHaveLength(EXPECTED_CHAIN.TASK_COUNT);
    expect([...new Set(subtasks.map(row => row.reference))]).toEqual([
      EXPECTED_CHAIN.REFERENCE,
    ]);
    expect(subtasks).toHaveLength(EXPECTED_CHAIN.SUBTASK_COUNT);
  });

  /** Stage history the planner never recorded would be invented evidence in the register meant to be trustworthy. */
  it("backfills no stage history, for the finished stories or the open one", async () => {
    const stories = await readMigratedStories();
    const { tasks, subtasks } = await readMigratedChain();
    const doneReferences: string[] = EXPECTED_MILESTONES.filter(
      row => row.derivedStatus === "done",
    ).map(row => row.reference);

    expect(
      stories.filter(row => doneReferences.includes(row.reference)),
    ).toHaveLength(doneReferences.length);
    expect(
      [...tasks, ...subtasks].filter(row =>
        doneReferences.includes(row.reference),
      ),
    ).toEqual([]);
    expect([...new Set(tasks.map(row => row.status_code))]).toEqual([
      EXPECTED_CHAIN.TASK_STATUS,
    ]);
    expect([...new Set(subtasks.map(row => row.status_code))]).toEqual([
      EXPECTED_CHAIN.SUBTASK_STATUS,
    ]);
  });

  /** A row the load wrote under any other identity, chain rows included, is indistinguishable from a human or agent write. */
  it("writes every row it creates, chain rows included, as the migration", async () => {
    const createdBy = await readCreatedByByEntity();

    expect(
      Object.fromEntries(
        Object.entries(createdBy).map(([entity, values]) => [
          entity,
          [...new Set(values)],
        ]),
      ),
    ).toEqual({
      Area: [MIGRATION_ACTOR],
      Engagement: [MIGRATION_ACTOR],
      Workspace: [MIGRATION_ACTOR],
      Initiative: [MIGRATION_ACTOR],
      Milestone: [MIGRATION_ACTOR],
      Task: [MIGRATION_ACTOR],
      Subtask: [MIGRATION_ACTOR],
      Defect: [],
      Decision: [],
      TestRun: [],
      Activity: [MIGRATION_ACTOR],
    });
  });

  /** The load is recorded by one migration event rather than one per row; the checkpoint event is the register seed's. */
  it("records exactly one migration Activity against the workspace, written by the migration", async () => {
    const { workspaces } = await readMigratedHierarchy();

    const activities = await readMigratedActivities();

    expect(
      activities.map(({ kind_code, actor_code, workspace_ID, createdBy }) => ({
        kind_code,
        actor_code,
        workspace_ID,
        createdBy,
      })),
    ).toEqual([
      {
        kind_code: ACTIVITY_KIND.MIGRATION,
        actor_code: MIGRATION_ACTOR,
        workspace_ID: workspaces[0].ID,
        createdBy: MIGRATION_ACTOR,
      },
    ]);
  });

  /** A second load would duplicate the workspace, its twelve stories and its chain; it must refuse, name the workspace, and write nothing. */
  it("refuses a second load with a conflict naming the workspace, changing no row", async () => {
    const before = await countRowsByEntity();

    const refusal = await captureMigrationRefusal(runLoadHierarchy);

    expect(refusal.status).toBe(MIGRATION_STATUS.CONFLICT);
    expect(refusal.key).toBe(MIGRATION_KEYS.ALREADY_LOADED);
    expect(refusal.args).toContain(EXPECTED_HIERARCHY.WORKSPACE.slug);
    expect(await countRowsByEntity()).toEqual(before);
  });
});
