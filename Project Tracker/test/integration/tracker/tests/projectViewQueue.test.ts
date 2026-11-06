import type cds from "@sap/cds";

import {
  clearWorld,
  seedCanonicalWorld,
  setChainStates,
  type SeededWorld,
} from "../../../shared/support/seedWorld.js";
import {
  connectTrackerService,
  trackerServer,
} from "../../../shared/support/trackerHarness.js";
import {
  BLOCKING_CHAIN_COMPLETE,
  BUILD_COMPLETE,
  CODE_QUALITY_AND_TEST_QUALITY_IN_PROGRESS,
  CODE_QUALITY_IN_PROGRESS,
  STAGE,
  THROUGH_FUNCTIONAL_TEST_COMPLETE,
  TWO_STAGES_STARTABLE,
} from "../data/chainStates.js";
import { STEP_FACTS } from "../data/nextActionCases.js";
import { BACKLOG_STORY_ID } from "../data/migrationStories.js";
import {
  MIGRATED_REFERENCE,
  SECTION_NAV,
  SECTION_QUERY,
  STEP_KIND,
  TASK_STATUS,
  TIER,
} from "../data/nextActionWorld.js";
import {
  BLOCKERS_PAST_RECOMMENDED,
  BLOCKERS_WITH_CODE_QUALITY_OPEN,
  CANDIDATE_STORIES,
  OPTIONAL_LAST_QUEUE,
  PLANNED_BACKEND_RESUMED,
  PLANNED_BACKEND_STORY_ID,
  QUALIFIED_STORY_PATTERN,
  RESUMED_FIRST_QUEUE,
  RESUMED_FIRST_TIERS,
  SUBTASK_CODES,
  UNTOUCHED_CANDIDATE_QUEUE,
} from "../data/projectViewSections.js";
import { readMilestoneIdOf } from "../support/readChain.js";
import { readProjectViewSections, type QueueRow } from "../support/readNextAction.js";
import {
  blockersOf,
  queueKeysOf,
  readSectionCount,
  readSectionPage,
  rowKeysOf,
  tiersByStoryOf,
} from "../support/readSections.js";
import { seedCandidateWorld, type CandidateWorld } from "../support/seedCandidateWorld.js";

describe("the report's open task queue", () => {
  let service: cds.Service;

  beforeAll(async () => {
    await trackerServer;
    service = await connectTrackerService();
  });

  beforeEach(async () => {
    await clearWorld();
  });

  describe("across the candidate stories", () => {
    let world: CandidateWorld;

    beforeEach(async () => {
      world = await seedCandidateWorld(service);
    });

    /** One ordering, two renderings: a headline that disagrees with the queue's top row sends the reader to two different places. */
    it("heads the queue with the very row the next-action section names, from one read", async () => {
      const sections = await readProjectViewSections();
      const head = sections.taskQueue[0];

      expect(sections.nextActionStory).toBe(MIGRATED_REFERENCE.BACKLOG);
      expect(sections.nextActionStepCode).toBe(STAGE.BUILD);
      expect(head.story).toBe(sections.nextActionStory);
      expect(head.stepCode).toBe(sections.nextActionStepCode);
    });

    /** The queue is every open stage in resolution order; one missing or misplaced row and the page lies about what comes next. */
    it("lists every open stage of every candidate story, earlier sprint first and chain order within each", async () => {
      const sections = await readProjectViewSections();

      expect(queueKeysOf(sections)).toEqual(UNTOUCHED_CANDIDATE_QUEUE);
    });

    /** Workflow steps belong to the story page; a step in the queue renders the same row on two reports. */
    it("carries no workflow step, only stages", async () => {
      const sections = await readProjectViewSections();
      const codes = sections.taskQueue.map(row => row.stepCode);

      for (const code of SUBTASK_CODES) expect(codes).not.toContain(code);
    });

    /** Started work outranks an earlier sprint; a queue in plain position order would bury the story already under way. */
    it("puts a resumed story's stages ahead of an earlier sprint's untouched story", async () => {
      const resumedId = await readMilestoneIdOf(world.workspaceId, PLANNED_BACKEND_STORY_ID);
      await setChainStates(resumedId, PLANNED_BACKEND_RESUMED);

      const sections = await readProjectViewSections();

      expect(queueKeysOf(sections)).toEqual(RESUMED_FIRST_QUEUE);
      expect(tiersByStoryOf(sections.taskQueue)).toEqual(RESUMED_FIRST_TIERS);
      expect(sections.nextActionStory).toBe(sections.taskQueue[0].story);
    });

    /** A story with only its optional stage left must not hold the top of the queue over required work elsewhere. */
    it("sinks a story whose only open stage is optional below every story with required work", async () => {
      await setChainStates(world.storyIds[BACKLOG_STORY_ID], BLOCKING_CHAIN_COMPLETE);

      const sections = await readProjectViewSections();

      expect(queueKeysOf(sections)).toEqual(OPTIONAL_LAST_QUEUE);
    });

    /** The blocker is the story's own: a walk across the whole queue would name another story's stage as the blocker. */
    it("names no blocker on any story's first stage, even behind another story's open stages", async () => {
      const sections = await readProjectViewSections();
      const firstStages = sections.taskQueue.filter(row => row.stepCode === STAGE.BUILD);
      const laterStages = sections.taskQueue.filter(row => row.stepCode !== STAGE.BUILD);

      expect(firstStages.map(row => row.blockerStepCode)).toStrictEqual([null, null, null, null]);
      expect(new Set(laterStages.map(row => row.blockerStepCode))).toEqual(
        new Set([STAGE.BUILD]),
      );
    });

    /** A table always pages; sorting only the page the read returned heads it with whatever row the database gave first. */
    it("heads a paged read of the queue with the next action and the queue's own first rows", async () => {
      const sections = await readProjectViewSections();

      const page = await readSectionPage<QueueRow>(
        world.workspaceId,
        SECTION_NAV.QUEUE,
        SECTION_QUERY.FIRST_PAGE,
      );

      expect(rowKeysOf(page.rows)).toEqual(UNTOUCHED_CANDIDATE_QUEUE.slice(0, 5));
      expect(page.rows[0].story).toBe(sections.nextActionStory);
      expect(page.rows[0].stepCode).toBe(sections.nextActionStepCode);
    });

    /** A table asks for the count alone before it pages; a 500 there leaves the queue without a row count. */
    it("answers a bare count of the queue with the number of open stages", async () => {
      const count = await readSectionCount(world.workspaceId, SECTION_NAV.QUEUE);

      expect(count).toBe(UNTOUCHED_CANDIDATE_QUEUE.length);
    });
  });

  describe("on one story's chain", () => {
    let world: SeededWorld;

    beforeEach(async () => {
      world = await seedCanonicalWorld();
    });

    /** The headline renders every next-action field from its own mapping; a swapped or dropped one shows the wrong tag or hides the human-only warning. */
    it("fills every headline field and the head queue row's kind, status and human flag for the stage to run", async () => {
      await setChainStates(world.milestoneId, THROUGH_FUNCTIONAL_TEST_COMPLETE);

      const sections = await readProjectViewSections();
      const head = sections.taskQueue[0];

      expect(sections).toMatchObject({
        nextActionStepCode: STEP_FACTS.HUMAN_REVIEW.code,
        nextActionLabel: STEP_FACTS.HUMAN_REVIEW.name,
        nextActionDescription: STEP_FACTS.HUMAN_REVIEW.description,
        nextActionDriver: STEP_FACTS.HUMAN_REVIEW.driver,
        nextActionKind: STEP_KIND.REQUIRED,
        nextActionRequiresHuman: true,
        nextActionStatus: TASK_STATUS.NOT_STARTED,
        nextActionTier: TIER.RESUMING,
      });
      expect(head).toMatchObject({
        stepCode: STEP_FACTS.HUMAN_REVIEW.code,
        kindCode: STEP_KIND.REQUIRED,
        statusCode: TASK_STATUS.NOT_STARTED,
        requiresHuman: true,
      });
    });

    /** The blocker is what start_stage would refuse on, and that is the earliest open blocking stage, not the one just before. */
    it("names the earliest open blocking stage on every row once the first stage closed", async () => {
      await setChainStates(world.milestoneId, BUILD_COMPLETE);

      const sections = await readProjectViewSections();

      expect(sections.taskQueue[0].stepCode).toBe(STAGE.CODE_QUALITY);
      expect(blockersOf(sections.taskQueue)).toStrictEqual(BLOCKERS_WITH_CODE_QUALITY_OPEN);
    });

    /** A running stage is still incomplete, so it still blocks; counting only untouched stages would free work too early. */
    it("names a running stage as the blocker of everything after it", async () => {
      await setChainStates(world.milestoneId, CODE_QUALITY_IN_PROGRESS);

      const sections = await readProjectViewSections();

      expect(blockersOf(sections.taskQueue)).toStrictEqual(BLOCKERS_WITH_CODE_QUALITY_OPEN);
    });

    /** Two stages running at once must both still name the earliest, or the second's blocker reads as itself or its neighbour. */
    it("names the earliest of two running stages as the later one's blocker", async () => {
      await setChainStates(world.milestoneId, CODE_QUALITY_AND_TEST_QUALITY_IN_PROGRESS);

      const sections = await readProjectViewSections();
      const blockers = blockersOf(sections.taskQueue);

      expect(blockers[STAGE.CODE_QUALITY]).toBeNull();
      expect(blockers[STAGE.TEST_QUALITY]).toBe(STAGE.CODE_QUALITY);
      expect(blockers[STAGE.HUMAN_REVIEW]).toBe(STAGE.CODE_QUALITY);
    });

    /** An optional stage never blocks, so the stage after an open one is free and only the last stage waits. */
    it("lets an open optional stage block nothing after it", async () => {
      await setChainStates(world.milestoneId, TWO_STAGES_STARTABLE);

      const sections = await readProjectViewSections();

      expect(blockersOf(sections.taskQueue)).toStrictEqual(BLOCKERS_PAST_RECOMMENDED);
    });
  });
});

describe("every section's story reference", () => {
  let service: cds.Service;

  beforeAll(async () => {
    await trackerServer;
    service = await connectTrackerService();
  });

  beforeEach(async () => {
    await clearWorld();
  });

  /** A bare story identifier is ambiguous once a second workspace exists, in every section and the headline alike. */
  it("qualifies every story reference with its workspace, across all three sections", async () => {
    const world = await seedCandidateWorld(service);
    await setChainStates(world.storyIds[BACKLOG_STORY_ID], BUILD_COMPLETE);

    const sections = await readProjectViewSections();
    const references = [
      sections.nextActionStory,
      ...sections.taskQueue.map(row => row.story),
      ...sections.recentCompletions.map(row => row.story),
    ];

    expect(sections.recentCompletions.length).toBeGreaterThan(0);
    for (const reference of references) expect(reference).toMatch(QUALIFIED_STORY_PATTERN);
    expect(new Set(sections.taskQueue.map(row => row.story))).toEqual(
      new Set(CANDIDATE_STORIES),
    );
    expect(sections.recentCompletions[0].story).toBe(MIGRATED_REFERENCE.BACKLOG);
  });
});
