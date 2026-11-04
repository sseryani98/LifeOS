import { DERIVED_SCALARS } from "../../../../srv/modules/shared/constants.js";
import {
  OVER_TOTAL_TEST_RUN_MESSAGE,
  WORLD,
} from "../../../shared/data/world.js";
import {
  clearWorld,
  seedCanonicalWorld,
  seedSecondWorkspace,
  setChainStates,
  type SeededWorld,
} from "../../../shared/support/seedWorld.js";
import { trackerServer } from "../../../shared/support/trackerHarness.js";
import {
  CODE_QUALITY_IN_PROGRESS,
  STAGE,
  WHOLE_CHAIN_COMPLETE,
} from "../data/chainStates.js";
import {
  DUPLICATE_OF_CANONICAL,
  DUPLICATE_STORY_MESSAGE,
} from "../data/migrationStories.js";
import {
  CLEAR_SPRINT_LINK_PATCH,
  COMPLETE_INITIATIVE_MISSING_FACTS,
  COMPLETE_INITIATIVE_WITH_FACTS,
  COMPLETION_FACTS_PATCH,
  DECISION_WITHOUT_DECIDED_AT,
  DUPLICATE_SLUG_WORKSPACE,
  INITIATIVE_WITHOUT_BRANCH,
  NEGATIVE_COUNT_TEST_RUN,
  ORPHAN_DEFECT,
  ORPHAN_TEST_RUN,
  ORPHANING_TEST_RUN_PATCH,
  OVER_TOTAL_TEST_RUN,
  OVER_TOTAL_TEST_RUN_PATCH,
  PATHS,
  POSITION_CLASH_INITIATIVE,
  POSITION_CLASH_STORY,
  PROJECT_VIEW_EXPAND,
  SECOND_INITIATIVE,
  SECOND_STORY,
  TEST_RUN_WITHOUT_EXECUTED_AT,
  UNCHANGED_NAME_GOAL_EDIT,
  UNCHANGED_STORY_ID_DESCRIPTION_EDIT,
} from "../data/writePayloads.js";
import {
  patchExpectingRejection,
  patchExpectingSuccess,
  postExpectingRejection,
  postExpectingSuccess,
  readCollection,
  readEntity,
} from "../support/odataHarness.js";
import { countStagesOf } from "../support/readChain.js";
import { seedExtraStory } from "../support/seedExtraStory.js";

/** The read projection, as the browser read path returns it. */
interface ProjectViewRow {
  slug: string;
  health: string | null;
  nextActionStoryId: string | null;
  gateTotal: number | null;
  initiatives: { milestones: { status: string }[] }[];
  defects: unknown[];
  taskQueue: { stepCode: string }[];
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
    const queued = rows[0].taskQueue.map(item => item.stepCode);
    const chainLength = await countStagesOf(world.milestoneId);

    expect(rows).toHaveLength(1);
    expect(rows[0].slug).toBe(WORLD.WORKSPACE.slug);
    expect(rows[0].initiatives[0].milestones).toHaveLength(1);
    expect(queued).not.toContain(STAGE.BUILD);
    expect(queued).toContain(STAGE.CODE_QUALITY);
    expect(queued).toHaveLength(chainLength - 1);
    expect(rows[0].defects).toHaveLength(0);
  });

  /** The list is a hand-kept mirror of the view's virtuals, so the read itself has to hold it honest. */
  it("carries every derived scalar the constant names as empty rather than missing", async () => {
    const rows = await readCollection(PATHS.PROJECT_VIEW);

    for (const key of DERIVED_SCALARS) {
      expect(rows[0]).toHaveProperty(key);
      expect(rows[0][key]).toBeNull();
    }
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

  /** A by-key read hands the handler one object, not a list, and the object page reads that way. */
  it("fills the derived values on a read by key as well as on a collection", async () => {
    await setChainStates(world.milestoneId, WHOLE_CHAIN_COMPLETE);

    const story = await readEntity(`${PATHS.MILESTONES}(${world.milestoneId})`);
    const view = (await readEntity(
      `${PATHS.PROJECT_VIEW}(${world.workspaceId})${PROJECT_VIEW_EXPAND}`,
    )) as unknown as ProjectViewRow;

    expect(story.status).toBe("done");
    expect(view.initiatives[0].milestones[0].status).toBe("done");
    expect(view.health).toBeNull();
  });

  /** Each story derives from its own chain, or one finished story paints its neighbours done. */
  it("derives each story's status from that story's chain alone", async () => {
    const secondId = await seedExtraStory(world.initiativeId, SECOND_STORY);
    await setChainStates(world.milestoneId, WHOLE_CHAIN_COMPLETE);

    const rows = await readCollection(PATHS.MILESTONES);
    const finished = rows.find(row => row.ID === world.milestoneId);
    const untouched = rows.find(row => row.ID === secondId);

    expect(finished?.status).toBe("done");
    expect(untouched?.status).toBe("backlog");
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
    expect(rejected.message).toContain(`"${SECOND_INITIATIVE.name}"`);
  });

  /** Sprint names are unique per workspace, so a second board may reuse one the first already holds. */
  it("accepts a sprint name another workspace already uses", async () => {
    const secondWorkspaceId = await seedSecondWorkspace();

    const accepted = await postExpectingSuccess(PATHS.INITIATIVES, {
      ...SECOND_INITIATIVE,
      name: WORLD.INITIATIVE.name,
      workspace_ID: secondWorkspaceId,
    });

    expect(accepted.name).toBe(WORLD.INITIATIVE.name);
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

  /** A story exists once per workspace, so a second sprint is no escape, and the message must not blame the sprint. */
  it("refuses a story whose identifier another sprint of the workspace holds, naming it", async () => {
    const secondSprint = await postExpectingSuccess(PATHS.INITIATIVES, {
      ...SECOND_INITIATIVE,
      workspace_ID: world.workspaceId,
    });

    const rejected = await postExpectingRejection(PATHS.MILESTONES, {
      ...DUPLICATE_OF_CANONICAL,
      initiative_ID: secondSprint.ID as string,
    });

    expect(rejected.status).toBe(409);
    expect(rejected.code).toBe("verb.story.duplicate");
    expect(rejected.message).toBe(DUPLICATE_STORY_MESSAGE);
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

  /** The rule judges the state a patch produces, not the fields it happens to carry. */
  it("accepts completing a sprint whose facts were recorded by an earlier patch", async () => {
    const created = await postExpectingSuccess(PATHS.INITIATIVES, {
      ...SECOND_INITIATIVE,
      workspace_ID: world.workspaceId,
    });

    await patchExpectingSuccess(
      `${PATHS.INITIATIVES}(${created.ID as string})`,
      { ...COMPLETION_FACTS_PATCH },
    );
    const completed = await patchExpectingSuccess(
      `${PATHS.INITIATIVES}(${created.ID as string})`,
      { status_code: "Complete" },
    );

    expect(completed.status_code).toBe("Complete");
  });

  /** Patching a fact away from a complete sprint recreates the state the rule forbids. */
  it("refuses patching a completion fact off an already complete sprint", async () => {
    const created = await postExpectingSuccess(PATHS.INITIATIVES, {
      ...COMPLETE_INITIATIVE_WITH_FACTS,
      workspace_ID: world.workspaceId,
    });

    const rejected = await patchExpectingRejection(
      `${PATHS.INITIATIVES}(${created.ID as string})`,
      { mergeCommit: null },
    );

    expect(rejected.status).toBe(400);
    expect(rejected.code).toBe("tracker.initiative.completionFieldsRequired");
  });

  /** A rename carries only half the unique pair, so the guard has to read the other half off the stored row. */
  it("refuses renaming a sprint onto a sibling's name with the named 409", async () => {
    const created = await postExpectingSuccess(PATHS.INITIATIVES, {
      ...SECOND_INITIATIVE,
      workspace_ID: world.workspaceId,
    });

    const rejected = await patchExpectingRejection(
      `${PATHS.INITIATIVES}(${created.ID as string})`,
      { name: WORLD.INITIATIVE.name },
    );

    expect(rejected.status).toBe(409);
    expect(rejected.code).toBe("verb.initiative.duplicate");
  });

  /** The same half-a-pair rename on a story, judged on the merged row rather than left to the constraint. */
  it("refuses renaming a story onto a sibling's identifier with the named 409", async () => {
    const created = await postExpectingSuccess(PATHS.MILESTONES, {
      ...SECOND_STORY,
      initiative_ID: world.initiativeId,
    });

    const rejected = await patchExpectingRejection(
      `${PATHS.MILESTONES}(${created.ID as string})`,
      { storyId: WORLD.STORY.storyId },
    );

    expect(rejected.status).toBe(409);
    expect(rejected.code).toBe("verb.story.duplicate");
  });

  /** A row is not its own sibling, or a full-row save of an unchanged name is refused as a duplicate. */
  it("accepts a sprint edit that re-sends its own unchanged name", async () => {
    const created = await postExpectingSuccess(PATHS.INITIATIVES, {
      ...SECOND_INITIATIVE,
      workspace_ID: world.workspaceId,
    });

    const updated = await patchExpectingSuccess(
      `${PATHS.INITIATIVES}(${created.ID as string})`,
      { name: SECOND_INITIATIVE.name, goal: UNCHANGED_NAME_GOAL_EDIT },
    );

    expect(updated.goal).toBe(UNCHANGED_NAME_GOAL_EDIT);
  });

  /** The same self-exclusion on a story, or re-saving a story's unchanged identifier is a 409. */
  it("accepts a story edit that re-sends its own unchanged identifier", async () => {
    const created = await postExpectingSuccess(PATHS.MILESTONES, {
      ...SECOND_STORY,
      initiative_ID: world.initiativeId,
    });

    const updated = await patchExpectingSuccess(
      `${PATHS.MILESTONES}(${created.ID as string})`,
      {
        storyId: SECOND_STORY.storyId,
        description: UNCHANGED_STORY_ID_DESCRIPTION_EDIT,
      },
    );

    expect(updated.description).toBe(UNCHANGED_STORY_ID_DESCRIPTION_EDIT);
  });

  /** A move carries the sprint half only, so the guard has to read the identifier off the stored row and the workspace off the target sprint. */
  it("refuses moving a story into a workspace that already holds its identifier", async () => {
    const otherWorkspaceId = await seedSecondWorkspace();
    const otherSprint = await postExpectingSuccess(PATHS.INITIATIVES, {
      ...SECOND_INITIATIVE,
      workspace_ID: otherWorkspaceId,
    });
    const emptySprint = await postExpectingSuccess(PATHS.INITIATIVES, {
      ...SECOND_INITIATIVE,
      workspace_ID: world.workspaceId,
    });
    const moving = await postExpectingSuccess(PATHS.MILESTONES, {
      ...SECOND_STORY,
      storyId: WORLD.STORY.storyId,
      initiative_ID: otherSprint.ID as string,
    });

    const rejected = await patchExpectingRejection(
      `${PATHS.MILESTONES}(${moving.ID as string})`,
      { initiative_ID: emptySprint.ID as string },
    );

    expect(rejected.status).toBe(409);
    expect(rejected.code).toBe("verb.story.duplicate");
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

  /** Patching both links off a live defect orphans it out of every register, through the other verb. */
  it("refuses a patch that nulls the only link a defect is scoped by", async () => {
    const created = await postExpectingSuccess(PATHS.DEFECTS, {
      ...ORPHAN_DEFECT,
      milestone_ID: world.milestoneId,
      workspace_ID: world.workspaceId,
    });

    const rejected = await patchExpectingRejection(
      `${PATHS.DEFECTS}(${created.ID as string})`,
      { milestone_ID: null },
    );

    expect(rejected.status).toBe(400);
    expect(rejected.code).toBe("tracker.defect.scopeRequired");
  });

  /** The scope rule judges the row a patch leaves, so clearing a link the defect never used leaves it scoped. */
  it("accepts clearing the unused link of a defect still scoped by the other", async () => {
    const created = await postExpectingSuccess(PATHS.DEFECTS, {
      ...ORPHAN_DEFECT,
      milestone_ID: world.milestoneId,
      workspace_ID: world.workspaceId,
    });

    const updated = await patchExpectingSuccess(
      `${PATHS.DEFECTS}(${created.ID as string})`,
      { ...CLEAR_SPRINT_LINK_PATCH },
    );

    expect(updated.milestone_ID).toBe(world.milestoneId);
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

  /** A patch can orphan a run as surely as a create can, and the rule is about the row, not the verb. */
  it("refuses a patch that nulls the only link a test run is scoped by", async () => {
    const created = await postExpectingSuccess(PATHS.TEST_RUNS, {
      ...ORPHAN_TEST_RUN,
      initiative_ID: world.initiativeId,
      workspace_ID: world.workspaceId,
    });

    const rejected = await patchExpectingRejection(
      `${PATHS.TEST_RUNS}(${created.ID as string})`,
      { ...ORPHANING_TEST_RUN_PATCH },
    );

    expect(rejected.status).toBe(400);
    expect(rejected.code).toBe("tracker.testrun.scopeRequired");
  });

  /** The sum rule is about the row, so an OData client must meet it as surely as the verb does. */
  it("refuses a test run whose counts exceed its total, on create and on a count-only patch", async () => {
    const created = await postExpectingRejection(PATHS.TEST_RUNS, {
      ...OVER_TOTAL_TEST_RUN,
      initiative_ID: world.initiativeId,
      workspace_ID: world.workspaceId,
    });
    const stored = await postExpectingSuccess(PATHS.TEST_RUNS, {
      ...ORPHAN_TEST_RUN,
      initiative_ID: world.initiativeId,
      workspace_ID: world.workspaceId,
    });
    const patched = await patchExpectingRejection(
      `${PATHS.TEST_RUNS}(${stored.ID as string})`,
      { ...OVER_TOTAL_TEST_RUN_PATCH },
    );

    expect(created.status).toBe(400);
    expect(created.code).toBe("verb.testrun.countsExceedTotal");
    expect(created.message).toBe(OVER_TOTAL_TEST_RUN_MESSAGE);
    expect(patched.status).toBe(400);
    expect(patched.code).toBe("verb.testrun.countsExceedTotal");
  });

  /** A negative count can balance an over-total one, so without a floor the sum rule is bypassable. */
  it("refuses a test run carrying a negative count", async () => {
    const rejected = await postExpectingRejection(PATHS.TEST_RUNS, {
      ...NEGATIVE_COUNT_TEST_RUN,
      initiative_ID: world.initiativeId,
      workspace_ID: world.workspaceId,
    });

    expect(rejected.status).toBe(400);
    expect(rejected.code).toBe("ASSERT_RANGE");
    expect(rejected.target).toBe("failed");
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

    expect(rejected.status).toBe(500);
    expect(rejected.code).toBe("SQLITE_CONSTRAINT_UNIQUE");
    expect(rejected.message).toContain("Workspace.slug");
  });

  /** The sort key orders sprints by position, so two sprints on one position make the board's order ambiguous. */
  it("refuses a second sprint on a position the workspace already holds", async () => {
    const rejected = await postExpectingRejection(PATHS.INITIATIVES, {
      ...POSITION_CLASH_INITIATIVE,
      workspace_ID: world.workspaceId,
    });

    expect(rejected.status).toBe(500);
    expect(rejected.code).toBe("SQLITE_CONSTRAINT_UNIQUE");
    expect(rejected.message).toContain("Initiative.position");
  });

  /** The same ordering contract inside a sprint, where story order is the order the board draws. */
  it("refuses a second story on a position the sprint already holds", async () => {
    const rejected = await postExpectingRejection(PATHS.MILESTONES, {
      ...POSITION_CLASH_STORY,
      initiative_ID: world.initiativeId,
    });

    expect(rejected.status).toBe(500);
    expect(rejected.code).toBe("SQLITE_CONSTRAINT_UNIQUE");
    expect(rejected.message).toContain("Milestone.position");
  });

  /** The verbs always fill the branch, so only the model stops an OData client writing a sprint without one. */
  it("refuses a sprint that names no branch", async () => {
    const rejected = await postExpectingRejection(PATHS.INITIATIVES, {
      ...INITIATIVE_WITHOUT_BRANCH,
      workspace_ID: world.workspaceId,
    });

    expect(rejected.status).toBe(400);
    expect(rejected.code).toBe("ASSERT_MANDATORY");
    expect(rejected.target).toBe("branch");
  });

  /** A run with no time cannot be ordered on its register, which is sorted by when it ran. */
  it("refuses a test run that records no time it ran at", async () => {
    const rejected = await postExpectingRejection(PATHS.TEST_RUNS, {
      ...TEST_RUN_WITHOUT_EXECUTED_AT,
      initiative_ID: world.initiativeId,
      workspace_ID: world.workspaceId,
    });

    expect(rejected.status).toBe(400);
    expect(rejected.code).toBe("ASSERT_MANDATORY");
    expect(rejected.target).toBe("executedAt");
  });

  /** A decision with no time has no place in its register, which is sorted by when it was taken. */
  it("refuses a decision that records no time it was taken", async () => {
    const rejected = await postExpectingRejection(PATHS.DECISIONS, {
      ...DECISION_WITHOUT_DECIDED_AT,
      workspace_ID: world.workspaceId,
    });

    expect(rejected.status).toBe(400);
    expect(rejected.code).toBe("ASSERT_MANDATORY");
    expect(rejected.target).toBe("decidedAt");
  });
});
