import { REFERENCE } from "../shared/constants.js";

import type { NextActionFields, StageFactRow, StoryStages } from "./types.js";

/** Shape translation between stage facts and the project view's sections. */
export class ProjectViewMapper {
  /**
   * Buckets a workspace's stages into stories, each carrying the positions the
   * candidate order ranks by.
   * @param stages The stages read, across any number of stories.
   * @returns One entry per story.
   */
  static groupStories(stages: StageFactRow[]): StoryStages[] {
    const stories = new Map<string, StoryStages>();
    for (const stage of stages) {
      const story = stories.get(stage.milestone_ID);
      if (story) story.tasks.push(stage);
      else stories.set(stage.milestone_ID, ProjectViewMapper._toStory(stage));
    }
    return [...stories.values()];
  }

  /**
   * Shapes a resolved stage into the view's flat next-action elements.
   * @param task The resolved stage.
   * @param tier Its story's tier.
   * @returns The elements to set on the view row.
   */
  static toNextActionFields(
    task: StageFactRow,
    tier: number,
  ): NextActionFields {
    return {
      nextActionStory: ProjectViewMapper.toStoryReference(task),
      nextActionStepCode: task.step_code,
      nextActionLabel: task.stepName,
      nextActionDescription: task.stepDescription,
      nextActionKind: task.stepKind,
      nextActionDriver: task.driver,
      nextActionRequiresHuman: task.requiresHuman,
      nextActionStatus: task.status_code,
      nextActionTier: tier,
    };
  }

  /**
   * Builds the target a stage's events are filed under.
   * @param stage The stage.
   * @returns The `{workspace}/{story}#{stage}` target.
   */
  static toStageTarget(stage: StageFactRow): string {
    return `${ProjectViewMapper.toStoryReference(stage)}${REFERENCE.STAGE_SEPARATOR}${stage.step_code}`;
  }

  /**
   * Builds the workspace-qualified reference of a stage's story.
   * @param stage The stage.
   * @returns The `{workspace}/{story}` reference.
   */
  static toStoryReference(stage: StageFactRow): string {
    return `${stage.workspaceSlug}${REFERENCE.STORY_SEPARATOR}${stage.storyId}`;
  }

  /**
   * Opens a story bucket from its first stage.
   * @param stage The first stage read for the story.
   * @returns The story, holding that one stage.
   */
  private static _toStory(stage: StageFactRow): StoryStages {
    return {
      milestoneId: stage.milestone_ID,
      initiativePosition: stage.initiativePosition,
      milestonePosition: stage.milestonePosition,
      tasks: [stage],
    };
  }
}
