import {
  EXPECTED_CHAIN,
  EXPECTED_HIERARCHY,
  EXPECTED_INITIATIVES,
  EXPECTED_MILESTONES,
  MIGRATION_ACTOR,
  MIGRATION_KEYS,
  MIGRATION_STATUS,
  RETIRED_FRICEW_TYPE,
} from "../migration/data/financialPlannerSnapshot.js";
import {
  arrangeFullLoad,
  arrangeHierarchyLoaded,
  captureMigrationRefusal,
  runLoadHierarchy,
} from "../migration/support/migrationHarness.js";
import {
  readMigratedChain,
  readMigratedStories,
} from "../migration/support/readMigratedStories.js";
import {
  countRowsByEntity,
  readCreatedByByEntity,
  readMigratedHierarchy,
  readMigratedInitiatives,
} from "../migration/support/readMigration.js";
import { clearWorld } from "../../shared/support/seedWorld.js";
import { trackerServer } from "../../shared/support/trackerHarness.js";
import { MIGRATION_FUT } from "./data/functionalUnits.js";

/**
 * The migration load's hierarchy units, executed at the migration's service
 * methods: it ships no tool and no screen, so this is its outermost surface.
 */
describe("the migration load's hierarchy functional units", () => {
  beforeAll(async () => {
    await trackerServer;
  });

  beforeEach(async () => {
    await clearWorld();
  });

  /** The hierarchy and the sprints' git facts are what every later read of the planner hangs off. */
  it(`${MIGRATION_FUT.HIERARCHY_WITH_GIT_FACTS} loads the hierarchy and three sprints with their real git facts`, async () => {
    await runLoadHierarchy();

    const { areas, engagements, workspaces } = await readMigratedHierarchy();
    const initiatives = await readMigratedInitiatives();

    expect(areas.map(row => row.name)).toEqual([EXPECTED_HIERARCHY.AREA.name]);
    expect(engagements.map(row => row.name)).toEqual([
      EXPECTED_HIERARCHY.ENGAGEMENT.name,
    ]);
    expect(
      workspaces.map(({ slug, name, currentFocus }) => ({
        slug,
        name,
        currentFocus,
      })),
    ).toEqual([EXPECTED_HIERARCHY.WORKSPACE]);
    expect(
      initiatives.map(
        ({ name, goal, branch, status_code, mergeCommit, tag, position }) => ({
          name,
          goal,
          branch,
          status_code,
          mergeCommit,
          tag,
          position,
        }),
      ),
    ).toEqual(EXPECTED_INITIATIVES);
  });

  /** Twelve verbatim stories with one chain is the whole contract between the board and the register. */
  it(`${MIGRATION_FUT.TWELVE_STORIES_ONE_CHAIN} loads twelve stories, and only the Backlog one gets a chain`, async () => {
    await runLoadHierarchy();

    const stories = await readMigratedStories();
    const { tasks, subtasks } = await readMigratedChain();

    expect(
      stories.map(({ reference, initiativeName, description, position }) => ({
        reference,
        initiativeName,
        description,
        position,
      })),
    ).toEqual(
      EXPECTED_MILESTONES.map(
        ({ reference, initiative, description, position }) => ({
          reference,
          initiativeName: initiative,
          description,
          position,
        }),
      ),
    );
    expect([
      ...new Set([...tasks, ...subtasks].map(row => row.reference)),
    ]).toEqual([EXPECTED_CHAIN.REFERENCE]);
    expect(tasks).toHaveLength(EXPECTED_CHAIN.TASK_COUNT);
    expect(subtasks).toHaveLength(EXPECTED_CHAIN.SUBTASK_COUNT);
  });

  /** Every story must say whether it ships a screen, or its chain's UI steps cannot be decided. */
  it(`${MIGRATION_FUT.SHIPS_UI_ON_ALL} sets shipsUi on all twelve stories`, async () => {
    await arrangeHierarchyLoaded();

    const stories = await readMigratedStories();

    expect(stories.filter(row => row.shipsUi === null)).toEqual([]);
    expect(
      stories.filter(row => row.shipsUi === true).map(row => row.reference),
    ).toEqual(
      EXPECTED_MILESTONES.filter(row => row.shipsUi).map(row => row.reference),
    );
    expect(stories.filter(row => row.shipsUi === false)).toHaveLength(8);
  });

  /** The retired plural type must not reach the data, or one story kind lives under two codes. */
  it(`${MIGRATION_FUT.TYPE_REMAP_REACHES_DATA} stores the remapped type on every story`, async () => {
    await arrangeHierarchyLoaded();

    const stories = await readMigratedStories();
    const perType: Record<string, number> = {};
    for (const row of stories)
      perType[row.fricewType_code] = (perType[row.fricewType_code] ?? 0) + 1;

    expect(
      stories
        .filter(row => row.fricewType_code === "Interface")
        .map(row => row.reference),
    ).toEqual(
      EXPECTED_MILESTONES.filter(
        row => row.boardType === RETIRED_FRICEW_TYPE,
      ).map(row => row.reference),
    );
    expect(
      stories.filter(row => row.fricewType_code === RETIRED_FRICEW_TYPE),
    ).toEqual([]);
    expect(perType).toEqual({
      Interface: 2,
      Conversion: 3,
      Enhancement: 3,
      Form: 4,
    });
  });

  /** A migrated row under any other identity, chain rows included, would pass for a human or agent write. */
  it(`${MIGRATION_FUT.ROWS_ATTRIBUTABLE} attributes every migrated row to the migration`, async () => {
    await arrangeFullLoad();

    const createdBy = await readCreatedByByEntity();

    expect(
      Object.entries(createdBy)
        .filter(([, values]) => values.length === 0)
        .map(([entity]) => entity),
    ).toEqual([]);
    expect(
      Object.entries(createdBy).flatMap(([entity, values]) =>
        values
          .filter(value => value !== MIGRATION_ACTOR)
          .map(value => `${entity}: ${value}`),
      ),
    ).toEqual([]);
    expect(createdBy.Task).toHaveLength(EXPECTED_CHAIN.TASK_COUNT);
    expect(createdBy.Subtask).toHaveLength(EXPECTED_CHAIN.SUBTASK_COUNT);
  });

  /** A second run would duplicate the workspace, its stories and its chain, so it must be refused before writing anything. */
  it(`${MIGRATION_FUT.RERUN_REFUSED} refuses to run the load again`, async () => {
    await arrangeHierarchyLoaded();
    const before = await countRowsByEntity();

    const refusal = await captureMigrationRefusal(runLoadHierarchy);

    expect(refusal.status).toBe(MIGRATION_STATUS.CONFLICT);
    expect(refusal.key).toBe(MIGRATION_KEYS.ALREADY_LOADED);
    expect(await countRowsByEntity()).toEqual(before);
  });
});
