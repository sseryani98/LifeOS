import { WORLD } from "../../../shared/data/world.js";
import {
  clearWorld,
  seedCanonicalWorld,
  setChainStates,
  type SeededWorld,
} from "../../../shared/support/seedWorld.js";
import { trackerServer } from "../../../shared/support/trackerHarness.js";
import {
  CODE_QUALITY_IN_PROGRESS,
  WHOLE_CHAIN_COMPLETE,
} from "../data/chainStates.js";
import {
  COMPLETE_INITIATIVE_MISSING_FACTS,
  DUPLICATE_SLUG_WORKSPACE,
  ORPHAN_DEFECT,
  ORPHAN_TEST_RUN,
  PATHS,
  PROJECT_VIEW_EXPAND,
  SECOND_INITIATIVE,
  SECOND_STORY,
} from "../data/writePayloads.js";
import {
  postExpectingRejection,
  postExpectingSuccess,
  readCollection,
} from "../support/odataHarness.js";

/** The read projection, as the browser read path returns it. */
interface ProjectViewRow {
  slug: string;
  health: string | null;
  nextActionStoryId: string | null;
  gateTotal: number | null;
  initiatives: { milestones: { status: string }[] }[];
  defects: unknown[];
  taskQueue: unknown[];
}

describe("the browser read path", () => {
  let world: SeededWorld;

  beforeAll(async () => {
    await trackerServer;
  });

  beforeEach(async () => {
    await clearWorld();
    world = await seedCanonicalWorld();
  });

  /** The registers have to arrive as bindable collections, or the page cannot render from one read. */
  it("returns the whole tree as navigation properties on one read", async () => {
    await setChainStates(world.milestoneId, CODE_QUALITY_IN_PROGRESS);

    const rows = (await readCollection(
      `${PATHS.PROJECT_VIEW}${PROJECT_VIEW_EXPAND}`,
    )) as unknown as ProjectViewRow[];

    expect(rows).toHaveLength(1);
    expect(rows[0].slug).toBe(WORLD.WORKSPACE.slug);
    expect(rows[0].initiatives[0].milestones).toHaveLength(1);
    expect(rows[0].taskQueue.length).toBeGreaterThan(0);
    expect(rows[0].defects).toHaveLength(0);
  });

  /** The scalars the later engines fill must exist and be empty, not be absent from the shape. */
  it("carries the derived scalars as empty rather than missing", async () => {
    const rows = (await readCollection(
      PATHS.PROJECT_VIEW,
    )) as unknown as ProjectViewRow[];

    expect(rows[0].health).toBeNull();
    expect(rows[0].nextActionStoryId).toBeNull();
    expect(rows[0].gateTotal).toBeNull();
  });

  /** The status is filled on read wherever a story is read, or it is only true on one path. */
  it("fills a story's derived status on a direct read and through the view", async () => {
    await setChainStates(world.milestoneId, WHOLE_CHAIN_COMPLETE);

    const direct = await readCollection(PATHS.MILESTONES);
    const expanded = (await readCollection(
      `${PATHS.PROJECT_VIEW}${PROJECT_VIEW_EXPAND}`,
    )) as unknown as ProjectViewRow[];

    expect(direct[0].status).toBe("done");
    expect(expanded[0].initiatives[0].milestones[0].status).toBe("done");
  });

  /** A duplicate sprint name inside one workspace has to reject with a named key, not a driver error. */
  it("refuses a second sprint with the same name in one workspace", async () => {
    const accepted = await postExpectingSuccess(PATHS.INITIATIVES, {
      ...SECOND_INITIATIVE,
      workspace_ID: world.workspaceId,
    });
    const rejected = await postExpectingRejection(PATHS.INITIATIVES, {
      ...SECOND_INITIATIVE,
      position: SECOND_INITIATIVE.position + 10,
      workspace_ID: world.workspaceId,
    });

    expect(accepted.name).toBe(SECOND_INITIATIVE.name);
    expect(rejected.status).toBe(409);
    expect(rejected.code).toBe("verb.initiative.duplicate");
  });

  /** A duplicate story ID inside one sprint has to reject with the key the verb layer already names. */
  it("refuses a second story with the same identifier in one sprint", async () => {
    const accepted = await postExpectingSuccess(PATHS.MILESTONES, {
      ...SECOND_STORY,
      initiative_ID: world.initiativeId,
    });
    const rejected = await postExpectingRejection(PATHS.MILESTONES, {
      ...SECOND_STORY,
      position: SECOND_STORY.position + 10,
      initiative_ID: world.initiativeId,
    });

    expect(accepted.storyId).toBe(SECOND_STORY.storyId);
    expect(rejected.status).toBe(409);
    expect(rejected.code).toBe("verb.story.duplicate");
  });

  /** A complete sprint records how it landed; the annotation that would have said so does not exist. */
  it("refuses a complete sprint that records neither its merge commit nor its tag", async () => {
    const rejected = await postExpectingRejection(PATHS.INITIATIVES, {
      ...COMPLETE_INITIATIVE_MISSING_FACTS,
      workspace_ID: world.workspaceId,
    });

    expect(rejected.status).toBe(400);
    expect(rejected.code).toBe("tracker.initiative.completionFieldsRequired");
  });

  /** A defect linked to nothing cannot be shown under any workspace, so the write is refused. */
  it("refuses a defect that links to neither a story nor a sprint", async () => {
    const rejected = await postExpectingRejection(PATHS.DEFECTS, {
      ...ORPHAN_DEFECT,
      workspace_ID: world.workspaceId,
    });

    expect(rejected.status).toBe(400);
    expect(rejected.code).toBe("tracker.defect.scopeRequired");
  });

  /** A test run linked to nothing is a fact about no sprint and no stage. */
  it("refuses a test run that links to neither a stage nor a sprint", async () => {
    const rejected = await postExpectingRejection(PATHS.TEST_RUNS, {
      ...ORPHAN_TEST_RUN,
      workspace_ID: world.workspaceId,
    });

    expect(rejected.status).toBe(400);
    expect(rejected.code).toBe("tracker.testrun.scopeRequired");
  });

  /** The slug is half of every story reference, so two workspaces sharing one is unaddressable state. */
  it("refuses a second workspace claiming a slug that is taken", async () => {
    const engagements = await readCollection(
      "/service/trackerSvcs/Engagements",
    );

    const rejected = await postExpectingRejection(PATHS.WORKSPACES, {
      ...DUPLICATE_SLUG_WORKSPACE,
      engagement_ID: engagements[0].ID,
    });

    expect(rejected.status).toBeGreaterThanOrEqual(400);
  });
});
