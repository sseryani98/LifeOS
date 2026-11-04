import { DEFECT_TITLE } from "./constants.js";

/**
 * Derives a Defect's title from its description's leading clause. The log has
 * no title column, and a title is what a register list shows, so it is plain
 * prose: code and emphasis markers are dropped, the words are kept.
 */
export class DefectTitle {
  /**
   * Cuts the description at its first clause end outside a code span, and caps
   * the result at the column's length.
   * @param description The description, verbatim from the log.
   * @returns The title.
   */
  static deriveFromDescription(description: string): string {
    const clause = description
      .slice(0, DefectTitle._findClauseEnd(description))
      .replace(DEFECT_TITLE.TRAILING_STOP, "")
      .replace(DEFECT_TITLE.MARKUP, "")
      .trim();
    if (clause.length <= DEFECT_TITLE.MAX_LENGTH) return clause;
    const room = clause.slice(
      0,
      DEFECT_TITLE.MAX_LENGTH - DEFECT_TITLE.ELLIPSIS.length,
    );
    return `${room.slice(0, room.lastIndexOf(" "))}${DEFECT_TITLE.ELLIPSIS}`;
  }

  /**
   * Finds where the leading clause ends. A clause end inside backticks is code,
   * not prose, so it never ends the clause.
   * @param description The description to scan.
   * @returns The index the clause ends at, or the description's length.
   */
  private static _findClauseEnd(description: string): number {
    let inCode = false;
    for (let index = 0; index < description.length; index++) {
      if (description[index] === DEFECT_TITLE.CODE_MARK) inCode = !inCode;
      if (inCode) continue;
      if (
        DEFECT_TITLE.CLAUSE_ENDS.some(end => description.startsWith(end, index))
      )
        return index;
    }
    return description.length;
  }
}
