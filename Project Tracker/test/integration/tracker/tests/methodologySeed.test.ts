import { CODES } from "../../../../srv/modules/shared/constants.js";
import { trackerServer } from "../../../shared/support/trackerHarness.js";
import {
  CODE_LIST_ROW_TOTAL,
  EXPECTED_ACTOR_KINDS,
  EXPECTED_CODE_LISTS,
  EXPECTED_METHODOLOGY,
  EXPECTED_STAGE_STEPS,
  EXPECTED_SUBTASK_STEPS,
  LIBRARY_FACTS,
} from "../data/seededLibrary.js";
import {
  buildKebabCode,
  readCodeList,
  readLibrarySteps,
  readMethodologies,
} from "../support/libraryAccess.js";

/**
 * The deployed seed, read as deployed: nothing in this file inserts a row, so
 * every assertion is about the db/data CSVs and not about a fixture copy.
 */
describe("the seeded methodology library and code lists", () => {
  beforeAll(async () => {
    await trackerServer;
  });

  /** One methodology is the whole library; a second would leave every chain ambiguous about its source. */
  it("seeds exactly one methodology, the sprint build", async () => {
    expect(await readMethodologies()).toEqual([{ ...EXPECTED_METHODOLOGY }]);
  });

  /** The stages are the methodology as data, so a wrong code, kind or driver is a wrong methodology. */
  it("seeds the nine stages with their codes, names, kinds and drivers at gapped positions", async () => {
    const stages = (await readLibrarySteps()).filter(step => step.parent_code === null);

    expect(stages).toHaveLength(EXPECTED_STAGE_STEPS.length);
    expect(stages).toMatchObject([...EXPECTED_STAGE_STEPS]);
  });

  /** Only the build stage runs workflow steps; a step under any other stage would be materialised nowhere sensible. */
  it("seeds seven workflow steps under the first stage and none under any other", async () => {
    const children = (await readLibrarySteps()).filter(step => step.parent_code !== null);
    const parents = [...new Set(children.map(step => step.parent_code))];

    expect(parents).toEqual([EXPECTED_METHODOLOGY.code]);
    expect(children).toHaveLength(EXPECTED_SUBTASK_STEPS.length);
    expect(children).toMatchObject([...EXPECTED_SUBTASK_STEPS]);
  });

  /** A remediation is generated from the driver and a display from the description, so neither may be blank. */
  it("gives every step a description and a driver, and every workflow step the build command", async () => {
    const steps = await readLibrarySteps();
    const children = steps.filter(step => step.parent_code !== null);

    expect(steps).toHaveLength(LIBRARY_FACTS.STEP_TOTAL);
    for (const step of steps) {
      expect(step.description.trim()).not.toBe("");
      expect(step.driver.trim()).not.toBe("");
    }
    for (const step of children) {
      expect(step.driver).toBe(LIBRARY_FACTS.SUBTASK_DRIVER);
      expect(step.requiresHuman).toBe(false);
    }
  });

  /** Every step hangs off the one methodology, or a chain could be instantiated from a library nobody seeded. */
  it("files every step under the one methodology", async () => {
    const owners = [...new Set((await readLibrarySteps()).map(step => step.methodology_code))];

    expect(owners).toEqual([EXPECTED_METHODOLOGY.code]);
  });

  /** The code is the key every verb addresses, and it is the name kebab-cased so a person can type it from the label. */
  it("derives every step's code from its name", async () => {
    for (const step of await readLibrarySteps()) {
      expect(step.code).toBe(buildKebabCode(step.name));
    }
  });

  /** Exactly one step is human-only; a second would strand every story behind a person for no reason. */
  it("marks human review as the only step a human must close", async () => {
    const human = (await readLibrarySteps()).filter(step => step.requiresHuman);

    expect(human.map(step => step.code)).toEqual([...LIBRARY_FACTS.HUMAN_STEPS]);
  });

  /** The one Recommended step is the one that never blocks, so a second would silently unblock a stage. */
  it("marks documentation as the only recommended step", async () => {
    const recommended = (await readLibrarySteps()).filter(
      step => step.kind_code === "Recommended",
    );

    expect(recommended.map(step => step.code)).toEqual([
      ...LIBRARY_FACTS.RECOMMENDED_STEPS,
    ]);
  });

  /** A Conditional step names exactly one predicate, and only the two UI steps are conditional on shipping UI. */
  it("marks the two UI steps as the only conditional ones, both naming the UI predicate", async () => {
    const steps = await readLibrarySteps();
    const conditionalKind = steps.filter(step => step.kind_code === "Conditional");
    const withPredicate = steps.filter(step => step.conditional !== null);

    expect(conditionalKind.map(step => step.code)).toEqual([
      ...LIBRARY_FACTS.CONDITIONAL_STEPS,
    ]);
    expect(withPredicate.map(step => step.code)).toEqual([
      ...LIBRARY_FACTS.CONDITIONAL_STEPS,
    ]);
    for (const step of withPredicate) {
      expect(step.conditional).toBe(LIBRARY_FACTS.PREDICATE);
    }
  });

  /** Every other step blocks as Required; a kind outside the three would match no blocking rule at all. */
  it("marks every remaining step Required and uses no kind outside the three", async () => {
    const steps = await readLibrarySteps();
    const special: string[] = [
      ...LIBRARY_FACTS.RECOMMENDED_STEPS,
      ...LIBRARY_FACTS.CONDITIONAL_STEPS,
    ];

    for (const step of steps) {
      expect(LIBRARY_FACTS.STEP_KINDS).toContain(step.kind_code);
      if (!special.includes(step.code)) expect(step.kind_code).toBe("Required");
    }
  });

  /** Code-list integrity is enforced at the database, so a missing code is a write that can never happen. */
  it("seeds exactly the codes the data model lists for each of the twelve lists", async () => {
    let total = 0;
    for (const [list, expected] of Object.entries(EXPECTED_CODE_LISTS)) {
      const rows = await readCodeList(list);
      total += rows.length;

      expect(rows.map(row => row.code).sort()).toEqual([...expected.CODES].sort());
    }

    expect(Object.keys(EXPECTED_CODE_LISTS)).toHaveLength(12);
    expect(total).toBe(CODE_LIST_ROW_TOTAL);
  });

  /** The constant is the only allow-list plan_sprint and the migration check against, so a drift from the CSV refuses a valid type. */
  it("allows exactly the FRICEW types the code list seeds", async () => {
    const seeded = (await readCodeList("FricewType")).map(row => row.code);

    expect([...CODES.FRICEW_TYPES].sort()).toEqual(seeded.sort());
  });

  /** The name is what every dropdown and register shows, so the phrases the data model fixes must be the ones seeded. */
  it("seeds the names the data model gives, and a non-empty name everywhere else", async () => {
    for (const [list, expected] of Object.entries(EXPECTED_CODE_LISTS)) {
      for (const row of await readCodeList(list)) {
        expect(row.name.trim()).not.toBe("");
        if (expected.NAMES) {
          expect(row.name).toBe((expected.NAMES as Record<string, string>)[row.code]);
        }
      }
    }
  });

  /** The human-only guard reads an actor's kind, so an actor with no resolvable kind can neither pass nor fail it honestly. */
  it("gives every actor a kind that resolves to an actor kind row", async () => {
    const kinds = (await readCodeList("ActorKind")).map(row => row.code);
    const actors = await readCodeList("Actor");

    for (const actor of actors) {
      expect(kinds).toContain(actor.kind_code);
      expect(actor.kind_code).toBe(
        EXPECTED_ACTOR_KINDS[actor.code as keyof typeof EXPECTED_ACTOR_KINDS],
      );
    }
  });
});
