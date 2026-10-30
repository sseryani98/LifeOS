import { ADDRESSING, HTTP, VERB_KEYS } from "./constants.js";
import { Envelope } from "./envelope.js";

/** The reference forms a caller addresses stories, stages and targets with. */
export class Addressing {
  /**
   * Builds the reference string an activity event points at.
   * @param workspaceSlug The workspace the target lives in.
   * @param storyId The story, when the target is inside one.
   * @param stepCode The stage or step, when the target is one.
   * @returns The qualified reference.
   */
  static buildActivityTarget(
    workspaceSlug: string,
    storyId?: string,
    stepCode?: string,
  ): string {
    if (!storyId) return workspaceSlug;
    const story = `${workspaceSlug}${ADDRESSING.STORY_SEPARATOR}${storyId}`;
    return stepCode ? `${story}${ADDRESSING.STAGE_SEPARATOR}${stepCode}` : story;
  }

  /**
   * Splits a decision target. One segment addresses the workspace itself; two
   * carry an inner name this method does not interpret — the decision verb
   * owns how it is resolved.
   * @param target The reference the caller supplied.
   * @returns The workspace slug and the optional inner name.
   */
  static parseDecisionTarget(target: string): {
    workspaceSlug: string;
    innerName: string | null;
  } {
    const parts = (target ?? "").split(ADDRESSING.STORY_SEPARATOR);
    if (parts.length > 2 || !parts[0].trim()) {
      Envelope.rejectVerb(HTTP.BAD_REQUEST, VERB_KEYS.STORY_UNQUALIFIED, [
        target,
      ]);
    }
    const inner = parts.length === 2 ? parts[1].trim() : "";
    return { workspaceSlug: parts[0].trim(), innerName: inner || null };
  }

  /**
   * Splits a qualified story reference. A bare story ID is rejected rather than
   * resolved: the same ID is live on more than one workspace's board, so silent
   * resolution would write to the wrong story.
   * @param reference The reference the caller supplied.
   * @returns The workspace slug and the story ID.
   */
  static parseStoryReference(reference: string): {
    workspaceSlug: string;
    storyId: string;
  } {
    const parts = (reference ?? "").split(ADDRESSING.STORY_SEPARATOR);
    if (parts.length !== 2 || !parts[0].trim() || !parts[1].trim()) {
      Envelope.rejectVerb(HTTP.BAD_REQUEST, VERB_KEYS.STORY_UNQUALIFIED, [
        reference,
      ]);
    }
    return { workspaceSlug: parts[0].trim(), storyId: parts[1].trim() };
  }
}
