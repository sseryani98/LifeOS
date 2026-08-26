import type cds from "@sap/cds";

import { logDefect } from "../../../../mcp/verbs/logDefect.js";
import { nextAction } from "../../../../mcp/verbs/nextAction.js";
import { projectView } from "../../../../mcp/verbs/projectView.js";
import { recordDecision } from "../../../../mcp/verbs/recordDecision.js";
import {
  ACTORS,
  DECISION_INPUT,
  DEFECT_INPUT,
  STORY_REFERENCE,
  UNRESOLVABLE,
  WORLD,
} from "../../../shared/data/world.js";
import { readActivityLog } from "../../../shared/support/readTracker.js";
import {
  clearWorld,
  seedCanonicalWorld,
  seedSecondWorkspace,
  setChainStates,
  type SeededWorld,
} from "../../../shared/support/seedWorld.js";
import {
  connectTrackerService,
  trackerServer,
} from "../../../shared/support/trackerHarness.js";
import {
  CODE_QUALITY_IN_PROGRESS,
  STAGE,
  WHOLE_CHAIN_COMPLETE,
} from "../data/chainStates.js";
import {
  buildVerbContext,
  expectFailure,
  expectSuccess,
} from "../support/verbHarness.js";

/** The composed view, as the read verb hands it back. */
interface ComposedView {
  header: { slug: string; health: null };
  nextAction: { stepCode: string } | null;
  taskQueue: unknown[];
  initiatives: { milestones: { status: string; chain: unknown[] }[] }[];
  defects: unknown[];
  decisions: unknown[];
  activities: unknown[];
}

describe("the read verbs", () => {
  let service: cds.Service;
  let world: SeededWorld;
  let context: ReturnType<typeof buildVerbContext>;

  beforeAll(async () => {
    await trackerServer;
    service = await connectTrackerService();
  });

  beforeEach(async () => {
    await clearWorld();
    world = await seedCanonicalWorld();
    context = buildVerbContext(service, ACTORS.IMPLEMENTER);
  });

  /** One call has to carry the whole page, or every report needs a second round trip to render. */
  it("answers header, next action, queue, chain and all three registers in one call", async () => {
    await setChainStates(world.milestoneId, CODE_QUALITY_IN_PROGRESS);
    expectSuccess(
      await logDefect(context, { story: STORY_REFERENCE, ...DEFECT_INPUT }),
    );
    expectSuccess(
      await recordDecision(context, {
        target: WORLD.WORKSPACE.slug,
        ...DECISION_INPUT,
      }),
    );

    const result = expectSuccess(await projectView(context, {}));
    const view = result.view as ComposedView;

    expect(view.header.slug).toBe(WORLD.WORKSPACE.slug);
    expect(view.header.health).toBeNull();
    expect(view.nextAction?.stepCode).toBe(STAGE.CODE_QUALITY);
    expect(view.taskQueue.length).toBeGreaterThan(0);
    expect(view.initiatives[0].milestones[0].chain.length).toBeGreaterThan(0);
    expect(view.defects).toHaveLength(1);
    expect(view.decisions).toHaveLength(1);
    expect(view.activities).toHaveLength(2);
  });

  /** The derived status has to reach the payload, or nothing on the page can say a story is done. */
  it("carries each story's derived status on the composed view", async () => {
    await setChainStates(world.milestoneId, WHOLE_CHAIN_COMPLETE);

    const result = expectSuccess(
      await projectView(context, { workspace: WORLD.WORKSPACE.slug }),
    );
    const view = result.view as ComposedView;

    expect(view.initiatives[0].milestones[0].status).toBe("done");
    expect(view.nextAction).toBeNull();
  });

  /** A workspace that is not there must be refused, not answered with the first one found. */
  it("refuses a project view for a workspace that does not exist", async () => {
    const result = expectFailure(
      await projectView(context, { workspace: UNRESOLVABLE.MISSING_WORKSPACE_SLUG }),
    );

    expect(result.status).toBe(404);
    expect(result.code).toBe("verb.target.notFound");
  });

  /** Several workspaces with no slug is an ambiguity the verb names, never resolves alphabetically. */
  it("refuses an unscoped project view when several workspaces exist", async () => {
    await seedSecondWorkspace();

    const result = expectFailure(await projectView(context, {}));

    expect(result.status).toBe(400);
    expect(result.code).toBe("verb.workspace.ambiguous");
    expect(result.message).toContain(WORLD.WORKSPACE.slug);
  });

  /** An empty store must say so rather than answer for a workspace that is not there. */
  it("refuses a project view when the store holds no workspace at all", async () => {
    await clearWorld();

    const result = expectFailure(await projectView(context, {}));

    expect(result.status).toBe(404);
    expect(result.code).toBe("verb.target.notFound");
  });

  /** Story mode and candidate mode must agree, or the answer depends on how it was asked. */
  it("resolves the next action for a named story and for the store as a whole", async () => {
    await setChainStates(world.milestoneId, CODE_QUALITY_IN_PROGRESS);

    const scoped = expectSuccess(
      await nextAction(context, { story: STORY_REFERENCE }),
    );
    const overall = expectSuccess(await nextAction(context, {}));

    expect(scoped.nextAction?.stepCode).toBe(STAGE.CODE_QUALITY);
    expect(scoped.nextAction?.driver).toBe("/code-quality");
    expect(overall.nextAction?.stepCode).toBe(STAGE.CODE_QUALITY);
  });

  /** A read verb records no state change, or every page render floods the register the timeline is drawn from. */
  it("writes no activity event for either read verb", async () => {
    expectSuccess(await projectView(context, {}));
    expectSuccess(await nextAction(context, {}));

    expect(await readActivityLog(world.workspaceId)).toHaveLength(0);
  });

  /** A finished chain answers null, and null is a success rather than an error. */
  it("answers null when nothing is incomplete", async () => {
    await setChainStates(world.milestoneId, WHOLE_CHAIN_COMPLETE);

    const scoped = expectSuccess(
      await nextAction(context, { story: STORY_REFERENCE }),
    );
    const overall = expectSuccess(await nextAction(context, {}));

    expect(scoped.ok).toBe(true);
    expect(scoped.nextAction).toBeNull();
    expect(overall.nextAction).toBeNull();
  });
});
