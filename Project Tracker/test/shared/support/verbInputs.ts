import {
  MINIMAL_TEST_RUN_METRICS,
  SPRINT_PLAN,
  TEST_RUN_EXECUTED_AT,
  TEST_RUN_METRICS,
  WORLD,
} from "../data/world.js";

/**
 * Builds the sprint-plan input, optionally with a different story list, so the
 * three shapes the suites need share one assembly.
 * @param stories The stories to plan; the standard three when omitted.
 * @returns The verb input.
 */
export function buildSprintPlanInput(
  stories: {
    id: string;
    type: string;
    description: string;
    shipsUi: boolean;
  }[] = [...SPRINT_PLAN.stories],
): Record<string, unknown> {
  return {
    workspace: WORLD.WORKSPACE.slug,
    name: SPRINT_PLAN.name,
    goal: SPRINT_PLAN.goal,
    branch: SPRINT_PLAN.branch,
    stories,
  };
}

/**
 * Builds a test-run input scoped to one stage of a story.
 * @param story The story reference.
 * @param stage The stage code the run belongs to.
 * @returns The verb input.
 */
export function buildStoryTestRunInput(
  story: string,
  stage: string,
): {
  story: string;
  stage: string;
  metrics: typeof TEST_RUN_METRICS;
  executedAt: string;
} {
  return {
    story,
    stage,
    metrics: { ...TEST_RUN_METRICS },
    executedAt: TEST_RUN_EXECUTED_AT,
  };
}

/**
 * Builds the mirror-case input a scope guard must refuse: a stage named with
 * no story alongside it, riding on an otherwise valid workspace scope.
 * @param stage The stage code named without its story.
 * @returns The verb input.
 */
export function buildStageWithoutStoryTestRunInput(stage: string): {
  stage: string;
  workspace: string;
  metrics: typeof TEST_RUN_METRICS;
  executedAt: string;
} {
  return {
    stage,
    workspace: WORLD.WORKSPACE.slug,
    metrics: { ...TEST_RUN_METRICS },
    executedAt: TEST_RUN_EXECUTED_AT,
  };
}

/**
 * Builds a test-run input scoped to the workspace, with the full metrics or the
 * bare ones a run without coverage produces.
 * @param minimal Whether to carry only the counts a bare invocation produces.
 * @returns The verb input.
 */
export function buildWorkspaceTestRunInput(minimal = false): {
  workspace: string;
  metrics: Record<string, unknown>;
  executedAt: string;
} {
  const metrics = minimal
    ? {
        ...MINIMAL_TEST_RUN_METRICS,
        failures: [...MINIMAL_TEST_RUN_METRICS.failures],
      }
    : { ...TEST_RUN_METRICS };
  return {
    workspace: WORLD.WORKSPACE.slug,
    metrics,
    executedAt: TEST_RUN_EXECUTED_AT,
  };
}
