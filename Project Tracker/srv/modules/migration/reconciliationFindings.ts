import { CODES } from "../shared/constants.js";

import { EXPECTED_CHAIN, MIGRATION, MIGRATION_KEYS } from "./constants.js";
import type {
  ChainFacts,
  CreatorFacts,
  FinancialPlannerSnapshot,
  InitiativeRef,
  ReconcileFinding,
  ReconciledCount,
  StoryFacts,
} from "./types.js";

/**
 * The tie-out's assertions, each turning stored rows into what it found wrong.
 * An assertion with no offenders passed; reporting is the validator's.
 */
export class ReconciliationFindings {
  /**
   * The counts the source implies: one hierarchy path, one row per ledger
   * entry, and the load's two events.
   * @param snapshot The embedded ledgers.
   * @returns The expected count per reconciled entity.
   */
  static buildExpectedCounts(
    snapshot: FinancialPlannerSnapshot,
  ): Record<string, number> {
    return {
      Area: 1,
      Engagement: 1,
      Workspace: 1,
      Initiative: snapshot.initiatives.length,
      Milestone: snapshot.stories.length,
      Defect: snapshot.defects.length,
      Decision: snapshot.checkpoint.decisions.length,
      TestRun: 1,
      Activity: Object.keys(MIGRATION.ACTIVITY_KIND).length,
    };
  }

  /**
   * The one chain must be the open story's backend chain, untouched. When it is
   * not, every chained story is named, and the expected one too if it lost its chain.
   * @param tasks Every stored Task.
   * @param subtasks Every stored Subtask.
   * @param openStoryIds The stories created in Backlog.
   * @returns The chain finding.
   */
  static findChainOffenders(
    tasks: ChainFacts[],
    subtasks: ChainFacts[],
    openStoryIds: string[],
  ): ReconcileFinding {
    const chained = [...new Set(tasks.map(row => row.storyId))];
    const absentSteps: readonly string[] = EXPECTED_CHAIN.ABSENT_STEPS;
    const intact =
      chained.length === openStoryIds.length &&
      chained.every(storyId => openStoryIds.includes(storyId)) &&
      tasks.length === EXPECTED_CHAIN.TASKS &&
      subtasks.length === EXPECTED_CHAIN.SUBTASKS &&
      tasks.every(row => row.status_code === EXPECTED_CHAIN.TASK_STATUS) &&
      subtasks.every(
        row => row.status_code === EXPECTED_CHAIN.SUBTASK_STATUS,
      ) &&
      [...tasks, ...subtasks].every(
        row => !absentSteps.includes(row.step_code),
      );
    return {
      key: MIGRATION_KEYS.CHAIN_MISMATCH,
      offenders: intact ? [] : [...new Set([...chained, ...openStoryIds])],
    };
  }

  /**
   * Every entity's count must equal the source's.
   * @param counts The tie-out lines.
   * @returns The count finding, one offender per short or long entity.
   */
  static findCountOffenders(counts: ReconciledCount[]): ReconcileFinding {
    return {
      key: MIGRATION_KEYS.COUNT_MISMATCH,
      offenders: counts
        .filter(line => line.actual !== line.expected)
        .map(
          line =>
            `${line.entity}: expected ${line.expected}, actual ${line.actual}`,
        ),
    };
  }

  /**
   * Every sprint and story carries a position, and no two stories in a sprint
   * share one, or the next-story order is ambiguous.
   * @param initiatives Every stored Initiative.
   * @param stories Every stored Milestone.
   * @returns The ordering finding.
   */
  static findOrderingOffenders(
    initiatives: InitiativeRef[],
    stories: StoryFacts[],
  ): ReconcileFinding {
    const slots = stories.map(
      story => `${story.initiative_ID}:${story.position}`,
    );
    return {
      key: MIGRATION_KEYS.ORDERING_MISMATCH,
      offenders: [
        ...initiatives
          .filter(row => row.position === null)
          .map(row => row.name),
        ...stories.filter(row => row.position === null).map(row => row.storyId),
        ...stories
          .filter((_story, index) => slots.indexOf(slots[index]) !== index)
          .map(row => row.storyId),
      ],
    };
  }

  /**
   * Every row the load left behind is the migration's.
   * @param creators Each written entity's rows and their creators, by entity name.
   * @returns The provenance finding, one offender per foreign row.
   */
  static findProvenanceOffenders(
    creators: Record<string, CreatorFacts[]>,
  ): ReconcileFinding {
    return {
      key: MIGRATION_KEYS.PROVENANCE_MISMATCH,
      offenders: Object.entries(creators).flatMap(([entity, rows]) =>
        rows
          .filter(row => row.createdBy !== MIGRATION.ACTOR)
          .map(row => `${entity} ${row.ID} (${row.createdBy})`),
      ),
    };
  }

  /**
   * No story may carry a type outside the six singular values — above all the
   * retired plural the board used for its interfaces.
   * @param stories Every stored Milestone.
   * @returns The type finding.
   */
  static findTypeOffenders(stories: StoryFacts[]): ReconcileFinding {
    const types: readonly string[] = CODES.FRICEW_TYPES;
    return {
      key: MIGRATION_KEYS.TYPE_MISMATCH,
      offenders: stories
        .filter(row => !types.includes(row.fricewType_code))
        .map(row => `${row.storyId}: ${row.fricewType_code}`),
    };
  }
}
