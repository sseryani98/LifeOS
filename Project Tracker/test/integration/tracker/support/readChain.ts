/** Database-level entity name, so the count reads the stored chain, not a view. */
const TASK_TABLE = "com.lifeos.projecttracker.Task";

/**
 * Counts the stages a story's chain materialised, so a queue assertion can say
 * exactly how many of them should still be on it.
 * @param milestoneId The story whose chain is counted.
 * @returns How many stages the chain holds.
 */
export const countStagesOf = async (milestoneId: string): Promise<number> => {
  const rows = (await SELECT.from(TASK_TABLE)
    .columns("ID")
    .where({ milestone_ID: milestoneId })) as unknown[];
  return rows.length;
};
