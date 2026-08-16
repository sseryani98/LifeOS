import { ADDRESSING, PLANNING, VERB_KEYS } from "./constants.js";
import { rejectVerb } from "./envelope.js";

/**
 * Splits a qualified story reference. A bare story ID is rejected rather than
 * resolved: the same ID is live on more than one workspace's board, so silent
 * resolution would write to the wrong story.
 * @param reference The reference the caller supplied.
 * @returns The workspace slug and the story ID.
 */
export function parseStoryReference(reference: string): {
  workspaceSlug: string;
  storyId: string;
} {
  const parts = (reference ?? "").split(ADDRESSING.STORY_SEPARATOR);
  if (parts.length !== 2 || !parts[0].trim() || !parts[1].trim()) {
    rejectVerb(PLANNING.HTTP_BAD_REQUEST, VERB_KEYS.STORY_UNQUALIFIED, [
      reference,
    ]);
  }
  return { workspaceSlug: parts[0].trim(), storyId: parts[1].trim() };
}

/**
 * Splits a decision target. One segment addresses the workspace itself; two
 * address something inside it, resolved as a story first and a sprint second.
 * @param target The reference the caller supplied.
 * @returns The workspace slug and the optional inner name.
 */
export function parseDecisionTarget(target: string): {
  workspaceSlug: string;
  innerName: string | null;
} {
  const parts = (target ?? "").split(ADDRESSING.STORY_SEPARATOR);
  if (parts.length > 2 || !parts[0].trim()) {
    rejectVerb(PLANNING.HTTP_BAD_REQUEST, VERB_KEYS.STORY_UNQUALIFIED, [
      target,
    ]);
  }
  const inner = parts.length === 2 ? parts[1].trim() : "";
  return { workspaceSlug: parts[0].trim(), innerName: inner || null };
}

/**
 * Builds the reference string an activity event points at.
 * @param workspaceSlug The workspace the target lives in.
 * @param storyId The story, when the target is inside one.
 * @param stepCode The stage or step, when the target is one.
 * @returns The qualified reference.
 */
export function buildActivityTarget(
  workspaceSlug: string,
  storyId?: string,
  stepCode?: string,
): string {
  if (!storyId) return workspaceSlug;
  const story = `${workspaceSlug}${ADDRESSING.STORY_SEPARATOR}${storyId}`;
  return stepCode ? `${story}${ADDRESSING.STAGE_SEPARATOR}${stepCode}` : story;
}
