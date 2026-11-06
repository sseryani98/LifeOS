import { MilestoneStatus } from "../../../../srv/modules/tracker/milestoneStatus.js";
import { NextActionResolver } from "../../../../srv/modules/tracker/nextActionResolver.js";
import {
  BUILD_COMPLETE_REVERSED,
  CHAINS,
  COMMIT_POSITION,
  EXPECTED_RANKS,
  EXPECTED_TIER_STATUS_PAIRS,
  REACHABLE_CANDIDATE_CHAINS,
  STAGE_CODE,
  STORY_SETS,
} from "../data/nextActionChains.js";

describe("the next-action tier", () => {
  /** Resuming started work must outrank starting fresh, so a started story with blocking work left is the top tier. */
  it("ranks a story with blocking work left and something started at tier 1", () => {
    expect(NextActionResolver.deriveTier([...CHAINS.BUILD_IN_PROGRESS])).toBe(1);
  });

  /** "Started" is anything not Not Started, so a closed stage counts as much as a running one. */
  it("counts a closed stage as started work", () => {
    expect(NextActionResolver.deriveTier([...CHAINS.BUILD_COMPLETE])).toBe(1);
  });

  /** A story nobody has touched is fresh work, below resumable work and above optional work. */
  it("ranks an untouched story at tier 2", () => {
    expect(NextActionResolver.deriveTier([...CHAINS.UNTOUCHED])).toBe(2);
  });

  /** Optional work must never outrank blocking work, so a story whose only open stage is Recommended sits at the bottom. */
  it("ranks a story whose only open stage is Recommended at tier 3, running or not", () => {
    expect(NextActionResolver.deriveTier([...CHAINS.BLOCKING_COMPLETE])).toBe(3);
    expect(NextActionResolver.deriveTier([...CHAINS.RECOMMENDED_RUNNING_ONLY])).toBe(3);
  });

  /** A materialised Conditional stage blocks like a Required one, or a UI story drops to optional before its UX test. */
  it("treats an open Conditional stage as blocking work", () => {
    expect(NextActionResolver.deriveTier([...CHAINS.CONDITIONAL_LEFT_OPEN])).toBe(1);
  });

  /** The started test spans every stage, so a running Recommended stage lifts an otherwise untouched story out of tier 2. */
  it("counts a started Recommended stage as started work", () => {
    expect(
      NextActionResolver.deriveTier([...CHAINS.RECOMMENDED_STARTED_FIRST]),
    ).toBe(1);
  });

  /** A story with nothing open, or with no chain at all, is no candidate, so it must have no tier rather than a vacuous one. */
  it("gives no tier to a finished story or a chainless one", () => {
    expect(NextActionResolver.deriveTier([...CHAINS.ALL_COMPLETE])).toBeNull();
    expect(NextActionResolver.deriveTier([...CHAINS.EMPTY])).toBeNull();
  });

  /** The tier is read from stages instead of the story's status only because the two agree on every candidate; drift breaks that. */
  it("agrees with the derived story status on every reachable candidate", () => {
    const pairs = REACHABLE_CANDIDATE_CHAINS.map(chain => [
      NextActionResolver.deriveTier([...chain]),
      MilestoneStatus.deriveFromChain([...chain]),
    ]);

    expect(pairs).toEqual(EXPECTED_TIER_STATUS_PAIRS);
  });
});

describe("the next-action walk within a story", () => {
  /** The first open stage by position is the next action, or a caller is sent past work a guard will make them come back for. */
  it("resolves to the first open stage in position order", () => {
    expect(
      NextActionResolver.resolveWithinStory([...CHAINS.BUILD_COMPLETE])?.step_code,
    ).toBe(STAGE_CODE.CODE_QUALITY);
  });

  /** Kind is not a filter: skipping a Recommended stage would hide it until the story is otherwise finished. */
  it("resolves to a Recommended stage when it is the first open one", () => {
    expect(
      NextActionResolver.resolveWithinStory([...CHAINS.THROUGH_REVIEW_COMPLETE])
        ?.step_code,
    ).toBe(STAGE_CODE.DOCUMENTATION);
  });

  /** A running stage is still open, so the walk stops at it rather than moving to the next untouched one. */
  it("resolves to a stage already in progress", () => {
    expect(
      NextActionResolver.resolveWithinStory([...CHAINS.BUILD_IN_PROGRESS])?.step_code,
    ).toBe(STAGE_CODE.BUILD);
  });

  /** A reopen sends work back; the walk follows position, not which stage changed last. */
  it("resolves to a reopened stage ahead of a later one closed before it", () => {
    expect(
      NextActionResolver.resolveWithinStory([...CHAINS.REOPENED_BEHIND_LATER_WORK])
        ?.step_code,
    ).toBe(STAGE_CODE.CODE_QUALITY);
  });

  /** Rows reach the engine from more than one reader, so the walk must order by position itself rather than trust arrival order. */
  it("walks by position even when the rows arrive out of order", () => {
    expect(
      NextActionResolver.resolveWithinStory([...BUILD_COMPLETE_REVERSED])?.step_code,
    ).toBe(STAGE_CODE.CODE_QUALITY);
  });

  /** Nothing open is an answer, not a fault, so the walk returns empty instead of throwing. */
  it("resolves to nothing when every stage is closed or there is no chain", () => {
    expect(NextActionResolver.resolveWithinStory([...CHAINS.ALL_COMPLETE])).toBeNull();
    expect(NextActionResolver.resolveWithinStory([...CHAINS.EMPTY])).toBeNull();
  });
});

describe("the open blockers ahead of a stage", () => {
  /** The guard refuses on every open blocking stage ahead, earliest first; a Recommended or closed one in the list would refuse wrongly. */
  it("lists every open blocking stage ahead in position order, skipping closed and Recommended ones", () => {
    const blockers = NextActionResolver.listOpenBlockers(
      [...CHAINS.REOPENED_BEHIND_LATER_WORK],
      COMMIT_POSITION,
    );

    expect(blockers.map(stage => stage.step_code)).toEqual([
      STAGE_CODE.CODE_QUALITY,
      STAGE_CODE.FUNCTIONAL_TEST,
      STAGE_CODE.HUMAN_REVIEW,
      STAGE_CODE.PM_UPDATE,
    ]);
  });
});

describe("the candidate order", () => {
  /** Tier is the first key: position must never lift fresh or optional work above work already started. */
  it("orders by tier before either position", () => {
    const ranked = NextActionResolver.sortCandidates([
      ...STORY_SETS.TIER_AGAINST_POSITION,
    ]);

    expect(ranked.map(story => story.storyId)).toEqual(EXPECTED_RANKS.TIER_AGAINST_POSITION);
  });

  /** Within a tier the sprint decides first, so an earlier sprint's last story beats a later sprint's first. */
  it("orders by sprint position before story position within a tier", () => {
    const ranked = NextActionResolver.sortCandidates([
      ...STORY_SETS.SPRINT_AGAINST_STORY,
    ]);

    expect(ranked.map(story => story.storyId)).toEqual(EXPECTED_RANKS.SPRINT_AGAINST_STORY);
  });

  /** Story position is the last key, which is what makes the order total inside one sprint. */
  it("orders by story position within one sprint and tier", () => {
    const ranked = NextActionResolver.sortCandidates([...STORY_SETS.ONE_SPRINT]);

    expect(ranked.map(story => story.storyId)).toEqual(EXPECTED_RANKS.ONE_SPRINT);
  });

  /** Only a story with an open stage is a candidate, so finished and chainless stories never appear in the order. */
  it("admits only stories holding an open stage", () => {
    const ranked = NextActionResolver.sortCandidates([
      ...STORY_SETS.WITH_NON_CANDIDATES,
    ]);

    expect(ranked.map(story => story.storyId)).toEqual(EXPECTED_RANKS.WITH_NON_CANDIDATES);
  });

  /** An empty candidate set is the "nothing left" state, which must be a value and not a fault. */
  it("returns no candidates when nothing is open", () => {
    expect(NextActionResolver.sortCandidates([...STORY_SETS.NOTHING_OPEN])).toEqual([]);
  });
});

describe("the workspace-wide next action", () => {
  /** One selector then one walk: the top candidate's own first open stage is the answer, carried with its tier. */
  it("walks the top-ranked story, not the earliest one", () => {
    const resolved = NextActionResolver.resolveAcrossStories([
      ...STORY_SETS.RESUMABLE_LATE,
    ]);

    expect(resolved).toMatchObject({
      story: { storyId: "RUN-001" },
      task: { step_code: STAGE_CODE.CODE_QUALITY },
      tier: 1,
    });
  });

  /** Optional work is still work: a workspace whose only open stage is Recommended resolves to it, at tier 3. */
  it("resolves to a residual Recommended stage at tier 3", () => {
    const resolved = NextActionResolver.resolveAcrossStories([
      ...STORY_SETS.OPTIONAL_ONLY,
    ]);

    expect(resolved).toMatchObject({
      story: { storyId: "OPT-001" },
      task: { step_code: STAGE_CODE.DOCUMENTATION },
      tier: 3,
    });
  });

  /** Nothing open anywhere is a fourth state, distinct from a tier-3 answer, so it is empty rather than an error. */
  it("resolves to nothing when no story holds an open stage", () => {
    expect(
      NextActionResolver.resolveAcrossStories([...STORY_SETS.NOTHING_OPEN]),
    ).toBeNull();
  });
});
