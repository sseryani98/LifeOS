import { DefectTitle } from "../../../../srv/modules/migration/defectTitle.js";
import {
  DEFECT_TITLE_CASES,
  OVERLONG_CLAUSE,
  TITLE_CAP,
} from "../data/defectTitles.js";

describe("deriving a defect's title from its description", () => {
  /** The log has no title column, so a rule cutting too early or too late mislabels the row in every register list. */
  it.each(DEFECT_TITLE_CASES)("$rule", ({ description, title }) => {
    expect(DefectTitle.deriveFromDescription(description)).toBe(title);
  });

  /** The title column holds 200 characters; a longer one fails the Postgres insert on cutover day, which SQLite never shows. */
  it("cuts an overlong clause at a word inside the column's length and marks the cut", () => {
    const title = DefectTitle.deriveFromDescription(
      OVERLONG_CLAUSE.description,
    );

    expect(title).toBe(OVERLONG_CLAUSE.title);
    expect(title.length).toBeLessThanOrEqual(TITLE_CAP.MAX_LENGTH);
    expect(title.endsWith(TITLE_CAP.ELLIPSIS)).toBe(true);
  });
});
