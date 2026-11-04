import type cds from "@sap/cds";

import { LogDefectVerb } from "../../../../mcp/verbs/logDefect.js";
import { StartStageVerb } from "../../../../mcp/verbs/startStage.js";
import {
  ACTORS,
  BARE_STORY_REFERENCE,
  DEFECT_INPUT,
  STORY_REFERENCE,
  UNRESOLVABLE,
  WORLD,
} from "../../../shared/data/world.js";
import {
  readActivityLog,
  readDefectById,
  readTaskByCode,
} from "../../../shared/support/readTracker.js";
import {
  clearWorld,
  seedCanonicalWorld,
  type SeededWorld,
} from "../../../shared/support/seedWorld.js";
import {
  connectTrackerService,
  trackerServer,
} from "../../../shared/support/trackerHarness.js";
import { STAGE } from "../data/chainStates.js";
import { UNSEEDED_ACTOR } from "../data/seededLibrary.js";
import {
  buildVerbContext,
  expectFailure,
  expectSuccess,
} from "../support/verbHarness.js";

const logDefect = new LogDefectVerb();
const startStage = new StartStageVerb();

describe("addressing and identity", () => {
  let service: cds.Service;
  let world: SeededWorld;

  beforeAll(async () => {
    await trackerServer;
    service = await connectTrackerService();
  });

  beforeEach(async () => {
    await clearWorld();
    world = await seedCanonicalWorld();
  });

  /** The same story ID is live on more than one board, so resolving a bare one writes to the wrong story. */
  it("rejects a bare story ID rather than resolving it", async () => {
    const context = buildVerbContext(service, ACTORS.IMPLEMENTER);

    const result = expectFailure(
      await startStage.run(context, {
        story: BARE_STORY_REFERENCE,
        stage: STAGE.CODE_QUALITY,
      }),
    );
    const task = await readTaskByCode(world.milestoneId, STAGE.CODE_QUALITY);

    expect(result.status).toBe(400);
    expect(result.code).toBe("verb.story.unqualified");
    expect(result.message).toContain("{workspace}/{story}");
    expect(task.status_code).toBe("notStarted");
    expect(await readActivityLog(world.workspaceId)).toHaveLength(0);
  });

  /** Without the caller's own identity on the row, the register cannot say who did anything. */
  it("carries the calling agent's identity onto the row and the event", async () => {
    const context = buildVerbContext(service, ACTORS.IMPLEMENTER);

    const result = expectSuccess(
      await logDefect.run(context, { story: STORY_REFERENCE, ...DEFECT_INPUT }),
    );
    const defect = await readDefectById(result.defectId as string);
    const events = await readActivityLog(world.workspaceId);

    expect(defect.createdBy).toBe(ACTORS.IMPLEMENTER);
    expect(events[0].actor).toBe(ACTORS.IMPLEMENTER);
    expect(events[0].createdBy).toBe(ACTORS.IMPLEMENTER);
  });

  /** A call with no declared caller must be refused, or the log records writes nobody owns. */
  it("refuses a call that declares no identity", async () => {
    const context = buildVerbContext(service, "");

    const result = expectFailure(
      await startStage.run(context, {
        story: STORY_REFERENCE,
        stage: STAGE.BUILD,
      }),
    );

    expect(result.status).toBe(400);
    expect(result.code).toBe("verb.identity.missing");
  });

  /** An unseeded caller otherwise trips the activity foreign key as an unnamed 500, and only on a database that enforces it. */
  it("refuses a write from an identity the actor list does not carry, naming the valid ones", async () => {
    const context = buildVerbContext(service, UNSEEDED_ACTOR);

    const result = expectFailure(
      await startStage.run(context, {
        story: STORY_REFERENCE,
        stage: STAGE.BUILD,
      }),
    );

    expect(result.status).toBe(400);
    expect(result.code).toBe("verb.identity.unknown");
    expect(result.message).toContain("PROJECT_TRACKER_ACTOR");
    expect(result.message).toContain(ACTORS.IMPLEMENTER);
    expect(await readActivityLog(world.workspaceId)).toHaveLength(0);
  });

  /** An unknown stage must list the chain's codes, or the caller guesses at the next call. */
  it("lists the chain's codes when a stage does not resolve", async () => {
    const context = buildVerbContext(service, ACTORS.IMPLEMENTER);

    const result = expectFailure(
      await startStage.run(context, {
        story: STORY_REFERENCE,
        stage: UNRESOLVABLE.STAGE,
      }),
    );

    expect(result.status).toBe(404);
    expect(result.code).toBe("verb.target.notFound");
    expect(result.message).toContain(STAGE.CODE_QUALITY);
  });

  /** An unknown story must be refused rather than created, and the codes it lists must be stories, not the workspace slug. */
  it("refuses a story that does not exist in the workspace, listing the stories it holds", async () => {
    const context = buildVerbContext(service, ACTORS.IMPLEMENTER);

    const result = expectFailure(
      await startStage.run(context, {
        story: UNRESOLVABLE.STORY,
        stage: STAGE.BUILD,
      }),
    );

    expect(result.status).toBe(404);
    expect(result.code).toBe("verb.target.notFound");
    expect(result.message).toContain(`Valid codes: ${WORLD.STORY.storyId}.`);
  });

  /** An unknown workspace must not fall back to the only one there is, but it must name it as the valid choice. */
  it("refuses a workspace slug that does not exist, listing the slugs that do", async () => {
    const context = buildVerbContext(service, ACTORS.IMPLEMENTER);

    const result = expectFailure(
      await startStage.run(context, {
        story: UNRESOLVABLE.WORKSPACE,
        stage: STAGE.BUILD,
      }),
    );

    expect(result.status).toBe(404);
    expect(result.code).toBe("verb.target.notFound");
    expect(result.message).toContain(`Valid codes: ${WORLD.WORKSPACE.slug}.`);
  });
});
