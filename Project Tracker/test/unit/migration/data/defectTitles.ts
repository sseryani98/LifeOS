/** Eight-letter words, so a 200-character cap falls inside a word, never on a space. */
const OVERLONG_WORDS = [
  "absolute",
  "backfill",
  "calendar",
  "dividend",
  "estimate",
  "forecast",
  "guidance",
  "headroom",
  "interest",
  "judgment",
  "keyboard",
  "landmark",
  "merchant",
  "notebook",
  "overview",
  "purchase",
  "quarters",
  "receipts",
  "spending",
  "transfer",
  "upstream",
  "variance",
  "workflow",
  "yearbook",
  "balances",
  "accounts",
] as const;

/** The column's length, and the mark a cut title ends in. */
export const TITLE_CAP = { MAX_LENGTH: 200, ELLIPSIS: "…" } as const;

/** A description per clause rule, beside the exact title each must derive. */
export const DEFECT_TITLE_CASES = [
  {
    rule: "a clause end inside backticks is code and does not cut",
    description:
      "`tsc` failed with `TS2688: Cannot find type definition file for 'sap__cds'` — the postinstall had not run.",
    title: "tsc failed with TS2688: Cannot find type definition file for 'sap__cds'",
  },
  {
    rule: "a colon outside code ends the clause",
    description: "Coverage harness never ran: the globs were read as regex.",
    title: "Coverage harness never ran",
  },
  {
    rule: "a semicolon ends the clause",
    description: "The seed set the wrong column; every import parsed the date.",
    title: "The seed set the wrong column",
  },
  {
    rule: "a sentence stop ends the clause",
    description: "The count reports requested rows. Unknown ones are skipped.",
    title: "The count reports requested rows",
  },
  {
    rule: "a spaced em dash ends the clause",
    description: "The page header is static — only the table names the page.",
    title: "The page header is static",
  },
  {
    rule: "a lone trailing stop is dropped",
    description: "The header title shows the raw description.",
    title: "The header title shows the raw description",
  },
  {
    rule: "with no clause end the whole description is the title, minus markup",
    description: "Filter bar opens with **no** default `status` value",
    title: "Filter bar opens with no default status value",
  },
] as const;

/** A leading clause longer than the column, with no clause end to cut it short. */
export const OVERLONG_CLAUSE = {
  description: OVERLONG_WORDS.join(" "),
  // 22 words and their spaces fill 197 characters; the 23rd would cross the cap.
  title: `${OVERLONG_WORDS.slice(0, 22).join(" ")}${TITLE_CAP.ELLIPSIS}`,
} as const;
