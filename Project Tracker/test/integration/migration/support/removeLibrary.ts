/** Database-level names of the methodology library, steps before their parent. */
const LIBRARY_TABLES = [
  "com.lifeos.projecttracker.MethodologyStep",
  "com.lifeos.projecttracker.Methodology",
] as const;

/**
 * Empties the methodology library, putting the store in the state it holds
 * before the library seed has run. Only a suite with its own database may call this:
 * nothing restores the library afterwards.
 * @returns Resolves once both tables are empty.
 */
export const removeMethodologyLibrary = async (): Promise<void> => {
  for (const table of LIBRARY_TABLES) await DELETE.from(table);
};
