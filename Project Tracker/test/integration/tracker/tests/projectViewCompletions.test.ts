import type cds from "@sap/cds";

import { ReopenStageVerb } from "../../../../mcp/verbs/reopenStage.js";
import { ACTORS, STORY_REFERENCE } from "../../../shared/data/world.js";
import {
  readActivityLog,
  readTaskByCode,
} from "../../../shared/support/readTracker.js";
import {
  clearWorld,
  seedCanonicalWorld,
  setChainStates,
  setSubtasksComplete,
} from "../../../shared/support/seedWorld.js";
import {
  connectTrackerService,
  trackerServer,
} from "../../../shared/support/trackerHarness.js";
import {
  CODE_QUALITY_TARGET,
  REOPEN_REASON,
  STAGE,
} from "../data/chainStates.js";
import { BACKLOG_STORY_ID } from "../data/migrationStories.js";
import {
  MIGRATED_REFERENCE,
  SECTION_NAV,
  SECTION_QUERY,
  TIER,
} from "../data/nextActionWorld.js";
import {
  BACKEND_CHAIN,
  BACKLOG_BUILD_TARGET,
  BACKLOG_SPREAD_COMPLETIONS,
  BUILD_CLOSED_BY_IMPLEMENTER,
  BUILD_CLOSED_BY_SANDRO,
  BUILD_RECLOSED_BY_SANDRO,
  LATE_SUBTASK_COMPLETIONS,
  OTHER_WORKSPACE_COMPLETIONS,
  OTHER_WORKSPACE_REFERENCE,
  PLANNED_BACKEND_STORY_ID,
  PLANNED_SPREAD_COMPLETIONS,
  RECENT_FIVE,
  SECOND_STORY_REFERENCE,
  SUBTASK_CODES,
  THROUGH_CODE_QUALITY_SCRIPT,
  TWO_COMPLETIONS,
  TWO_COMPLETIONS_NEWEST_FIRST,
} from "../data/projectViewSections.js";
import { SECOND_STORY } from "../data/writePayloads.js";
import { driveChainScript } from "../support/driveChain.js";
import { readMilestoneIdOf } from "../support/readChain.js";
import {
  readProjectViewSections,
  readProjectViewSectionsOf,
  type CompletedRow,
} from "../support/readNextAction.js";
import {
  completedByOf,
  completionKeysOf,
  completionRowKeysOf,
  readSectionCount,
  readSectionPage,
  seedOtherWorkspaceStory,
} from "../support/readSections.js";
import { seedCandidateWorld, seedMigratedWorkspace } from "../support/seedCandidateWorld.js";
import { seedExtraStory } from "../support/seedExtraStory.js";
import { buildVerbContext, expectSuccess } from "../support/verbHarness.js";

const reopenStage = new ReopenStageVerb();

describe("the report's recently completed section", () => {
  let service: cds.Service;

  beforeAll(async () => {
    await trackerServer;
    service = await connectTrackerService();
  });

  beforeEach(async () => {
    await clearWorld();
  });

  describe("from the cutover state", () => {
    /** The migration closes no stage, so a populated list at cutover would be invented history. */
    it("is empty at cutover while the queue holds the backlog story's whole chain", async () => {
      await seedMigratedWorkspace();

      const sections = await readProjectViewSections();

      expect(sections.recentCompletions).toEqual([]);
      expect(sections.taskQueue.map(row => row.stepCode)).toEqual([...BACKEND_CHAIN]);
    });

    /** The first completion after cutover must appear with its time and the identity that closed it, not the one that started it. */
    it("fills from the first completion, naming the actor from its completion event", async () => {
      const world = await seedMigratedWorkspace();
      await driveChainScript(service, MIGRATED_REFERENCE.BACKLOG, BUILD_CLOSED_BY_SANDRO);
      const stored = await readTaskByCode(world.storyIds[BACKLOG_STORY_ID], STAGE.BUILD);

      const sections = await readProjectViewSections();
      const [row] = sections.recentCompletions;

      expect(sections.recentCompletions).toHaveLength(1);
      expect(row.story).toBe(MIGRATED_REFERENCE.BACKLOG);
      expect(row.stepCode).toBe(STAGE.BUILD);
      expect(Date.parse(row.completedAt)).toBe(Date.parse(String(stored.completedAt)));
      expect(row.completedBy).toBe(ACTORS.SANDRO);
    });
  });

  describe("after a reopen", () => {
    /** A reopened stage is no longer complete, yet its completion is history the register must still hold. */
    it("drops a reopened stage from the list and keeps its completion event beside the reopen", async () => {
      const world = await seedCanonicalWorld();
      await driveChainScript(service, STORY_REFERENCE, THROUGH_CODE_QUALITY_SCRIPT);
      const before = await readProjectViewSections();

      expectSuccess(
        await reopenStage.run(buildVerbContext(service, ACTORS.SANDRO), {
          story: STORY_REFERENCE,
          stage: STAGE.CODE_QUALITY,
          reason: REOPEN_REASON,
        }),
      );
      const after = await readProjectViewSections();
      const history = (await readActivityLog(world.workspaceId)).filter(
        event =>
          event.target === CODE_QUALITY_TARGET &&
          ["stageCompleted", "stageReopened"].includes(event.kind_code),
      );

      expect(before.recentCompletions.map(row => row.stepCode)).toEqual([
        STAGE.CODE_QUALITY,
        STAGE.BUILD,
      ]);
      expect(after.recentCompletions.map(row => row.stepCode)).toEqual([STAGE.BUILD]);
      expect(history.map(event => event.kind_code)).toEqual(["stageCompleted", "stageReopened"]);
      expect(history[0].actor).toBe(ACTORS.IMPLEMENTER);
    });

    /** Two closures inside one second tie on the stored time; only the completion events still know which came last. */
    it("lists the later of two stages closed within the same second first", async () => {
      await seedCanonicalWorld();
      await driveChainScript(service, STORY_REFERENCE, THROUGH_CODE_QUALITY_SCRIPT);

      const sections = await readProjectViewSections();

      expect(sections.recentCompletions.map(row => row.stepCode)).toEqual([
        STAGE.CODE_QUALITY,
        STAGE.BUILD,
      ]);
    });

    /** A stage closed twice was last closed by whoever closed it second; naming the first closer misattributes the work. */
    it("names the identity of the latest completion when a stage was closed, reopened and closed again", async () => {
      const world = await seedMigratedWorkspace();
      await driveChainScript(service, MIGRATED_REFERENCE.BACKLOG, BUILD_CLOSED_BY_IMPLEMENTER);
      expectSuccess(
        await reopenStage.run(buildVerbContext(service, ACTORS.IMPLEMENTER), {
          story: MIGRATED_REFERENCE.BACKLOG,
          stage: STAGE.BUILD,
          reason: REOPEN_REASON,
        }),
      );
      await driveChainScript(service, MIGRATED_REFERENCE.BACKLOG, BUILD_RECLOSED_BY_SANDRO);

      const sections = await readProjectViewSections();
      const completions = (await readActivityLog(world.workspaceId)).filter(
        event => event.target === BACKLOG_BUILD_TARGET && event.kind_code === "stageCompleted",
      );

      expect(completions.map(event => event.actor)).toEqual([ACTORS.IMPLEMENTER, ACTORS.SANDRO]);
      expect(sections.recentCompletions).toHaveLength(1);
      expect(sections.recentCompletions[0].completedBy).toBe(ACTORS.SANDRO);
    });
  });

  describe("across stories and workspaces", () => {
    /** The list is the five newest stage closures anywhere in the workspace; steps and a single story's view both misreport it. */
    it("caps at the five most recent stages, newest first, across both stories and with no step", async () => {
      const world = await seedCandidateWorld(service);
      const backlogId = world.storyIds[BACKLOG_STORY_ID];
      await setChainStates(backlogId, BACKLOG_SPREAD_COMPLETIONS);
      await setChainStates(
        await readMilestoneIdOf(world.workspaceId, PLANNED_BACKEND_STORY_ID),
        PLANNED_SPREAD_COMPLETIONS,
      );
      const build = await readTaskByCode(backlogId, STAGE.BUILD);
      await setSubtasksComplete(build.ID, LATE_SUBTASK_COMPLETIONS);

      const sections = await readProjectViewSections();
      const codes = sections.recentCompletions.map(row => row.stepCode);

      expect(completionKeysOf(sections)).toEqual(RECENT_FIVE);
      for (const code of SUBTASK_CODES) expect(codes).not.toContain(code);
    });

    /** The page reads the section on its own counted request, so that read must sort, cap and clamp the count to the cap. */
    it("caps, orders and counts the section when read on its own, as the page table reads it", async () => {
      const world = await seedCandidateWorld(service);
      await setChainStates(world.storyIds[BACKLOG_STORY_ID], BACKLOG_SPREAD_COMPLETIONS);
      await setChainStates(
        await readMilestoneIdOf(world.workspaceId, PLANNED_BACKEND_STORY_ID),
        PLANNED_SPREAD_COMPLETIONS,
      );

      const page = await readSectionPage<CompletedRow>(
        world.workspaceId,
        SECTION_NAV.COMPLETIONS,
        SECTION_QUERY.COUNTED,
      );

      expect(completionRowKeysOf(page.rows)).toEqual(RECENT_FIVE);
      expect(page.count).toBe(5);
    });

    /** A bare count must agree with the counted read's clamp, or a table offers to load rows past the cap. */
    it("answers a bare count of the section clamped to the cap", async () => {
      const world = await seedCandidateWorld(service);
      await setChainStates(world.storyIds[BACKLOG_STORY_ID], BACKLOG_SPREAD_COMPLETIONS);
      await setChainStates(
        await readMilestoneIdOf(world.workspaceId, PLANNED_BACKEND_STORY_ID),
        PLANNED_SPREAD_COMPLETIONS,
      );

      const count = await readSectionCount(world.workspaceId, SECTION_NAV.COMPLETIONS);

      expect(count).toBe(RECENT_FIVE.length);
    });

    /** The completer is filled by the section's own read handler; a page table reading the section alone must still be told who closed it. */
    it("names the completer when the section is read on its own", async () => {
      const world = await seedMigratedWorkspace();
      await driveChainScript(service, MIGRATED_REFERENCE.BACKLOG, BUILD_CLOSED_BY_SANDRO);

      const page = await readSectionPage<CompletedRow>(
        world.workspaceId,
        SECTION_NAV.COMPLETIONS,
        SECTION_QUERY.COUNTED,
      );

      expect(page.rows.map(row => row.completedBy)).toEqual([ACTORS.SANDRO]);
      expect(page.count).toBe(1);
    });

    /** A table always pages; a first page drawn before the sort would show older closures than the five newest. */
    it("answers the five newest completions on a paged read of the section", async () => {
      const world = await seedCandidateWorld(service);
      await setChainStates(world.storyIds[BACKLOG_STORY_ID], BACKLOG_SPREAD_COMPLETIONS);
      await setChainStates(
        await readMilestoneIdOf(world.workspaceId, PLANNED_BACKEND_STORY_ID),
        PLANNED_SPREAD_COMPLETIONS,
      );

      const page = await readSectionPage<CompletedRow>(
        world.workspaceId,
        SECTION_NAV.COMPLETIONS,
        SECTION_QUERY.FIRST_PAGE,
      );

      expect(completionRowKeysOf(page.rows)).toEqual(RECENT_FIVE);
    });

    /** Fewer completions than the cap is a short list, never padded or refused. */
    it("answers fewer than five rows when fewer stages are complete", async () => {
      const world = await seedCanonicalWorld();
      await setChainStates(world.milestoneId, TWO_COMPLETIONS);

      const sections = await readProjectViewSections();

      expect(sections.recentCompletions.map(row => row.stepCode)).toEqual([
        ...TWO_COMPLETIONS_NEWEST_FIRST,
      ]);
    });

    /** The cap is per workspace: another workspace's newer closures must neither appear nor crowd this one's out. */
    it("answers only the workspace's own completions when another workspace has newer ones", async () => {
      const world = await seedCanonicalWorld();
      await setChainStates(world.milestoneId, TWO_COMPLETIONS);
      const other = await seedOtherWorkspaceStory();
      await setChainStates(other.milestoneId, OTHER_WORKSPACE_COMPLETIONS);

      const sections = await readProjectViewSectionsOf(world.workspaceId);
      const stories = sections.recentCompletions.map(row => row.story);

      expect(sections.recentCompletions.map(row => row.stepCode)).toEqual([
        ...TWO_COMPLETIONS_NEWEST_FIRST,
      ]);
      expect(stories).not.toContain(OTHER_WORKSPACE_REFERENCE);
    });

    /** The next action ranks only this workspace's stories; another workspace's started story must not become this page's headline. */
    it("names this workspace's own next action when another workspace holds a higher-tier story", async () => {
      const world = await seedCanonicalWorld();
      const other = await seedOtherWorkspaceStory();
      await setChainStates(other.milestoneId, OTHER_WORKSPACE_COMPLETIONS);

      const sections = await readProjectViewSectionsOf(world.workspaceId);

      expect(sections.nextActionStory).toBe(STORY_REFERENCE);
      expect(sections.nextActionTier).toBe(TIER.FRESH);
    });

    /** The actor is read from that stage's own completion event; matching on stage code alone would cross two stories' records. */
    it("names each row's own completer when two stories closed the same stage under different identities", async () => {
      const world = await seedCanonicalWorld();
      await seedExtraStory(world.initiativeId, { ...SECOND_STORY });
      await driveChainScript(service, STORY_REFERENCE, BUILD_CLOSED_BY_IMPLEMENTER);
      await driveChainScript(service, SECOND_STORY_REFERENCE, BUILD_CLOSED_BY_SANDRO);

      const sections = await readProjectViewSections();

      expect(completedByOf(sections)).toStrictEqual({
        [`${STORY_REFERENCE}#${STAGE.BUILD}`]: ACTORS.IMPLEMENTER,
        [`${SECOND_STORY_REFERENCE}#${STAGE.BUILD}`]: ACTORS.SANDRO,
      });
    });
  });
});
