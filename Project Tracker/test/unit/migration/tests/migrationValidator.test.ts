import {
  DEFECT_RESOLUTIONS,
  DEFECT_TARGETS,
  REGISTER_RULE,
  STORY_TYPES,
  TEST_RUN_TARGETS,
} from "../data/validatorPayloads.js";
import {
  buildRegisterValidator,
  buildValidatorRequest,
} from "../support/registerValidator.js";

describe("the register rules the migration seeds against", () => {
  /** A defect on a story, a sprint or both is visible in some register, so none of them may be refused. */
  it("accepts a defect linked to a story, to a sprint, or to both", () => {
    const validator = buildRegisterValidator();
    const onMilestone = buildValidatorRequest();
    const onInitiative = buildValidatorRequest();
    const onBoth = buildValidatorRequest();

    validator.validateDefectTarget(
      onMilestone.request,
      DEFECT_TARGETS.ON_MILESTONE,
    );
    validator.validateDefectTarget(
      onInitiative.request,
      DEFECT_TARGETS.ON_INITIATIVE,
    );
    validator.validateDefectTarget(onBoth.request, DEFECT_TARGETS.ON_BOTH);

    expect(onMilestone.errors).toHaveLength(0);
    expect(onInitiative.errors).toHaveLength(0);
    expect(onBoth.errors).toHaveLength(0);
  });

  /** A defect linked to nothing is one no sprint or story would ever show, so the seed must stop on it. */
  it("refuses a defect linked to neither a story nor a sprint", () => {
    const validator = buildRegisterValidator();
    const orphan = buildValidatorRequest();

    validator.validateDefectTarget(orphan.request, DEFECT_TARGETS.ON_NOTHING);

    expect(orphan.errors).toHaveLength(1);
    expect(orphan.errors[0]).toMatchObject({
      code: REGISTER_RULE.DEFECT_TARGET_MISSING,
      status: REGISTER_RULE.BAD_INPUT,
    });
  });

  /** An open defect with no fix and a closed one with its fix are the two shapes the log is allowed to hold. */
  it("accepts an open defect without a resolution and a closed one with it", () => {
    const validator = buildRegisterValidator();
    const open = buildValidatorRequest();
    const closed = buildValidatorRequest();

    validator.validateDefectResolution(
      open.request,
      DEFECT_RESOLUTIONS.OPEN_WITHOUT,
    );
    validator.validateDefectResolution(
      closed.request,
      DEFECT_RESOLUTIONS.CLOSED_WITH,
    );

    expect(open.errors).toHaveLength(0);
    expect(closed.errors).toHaveLength(0);
  });

  /** An open defect carrying a fix reads as resolved while it is still open. */
  it("refuses an open defect that carries a resolution", () => {
    const validator = buildRegisterValidator();
    const open = buildValidatorRequest();

    validator.validateDefectResolution(
      open.request,
      DEFECT_RESOLUTIONS.OPEN_WITH,
    );

    expect(open.errors).toHaveLength(1);
    expect(open.errors[0]).toMatchObject({
      code: REGISTER_RULE.RESOLUTION_ON_OPEN,
      status: REGISTER_RULE.BAD_INPUT,
    });
  });

  /** The log's dash means "none"; stored as text it would make an open defect look resolved. */
  it("refuses an open defect whose resolution is the log's placeholder", () => {
    const validator = buildRegisterValidator();
    const open = buildValidatorRequest();

    validator.validateDefectResolution(
      open.request,
      DEFECT_RESOLUTIONS.OPEN_WITH_PLACEHOLDER,
    );

    expect(open.errors).toHaveLength(1);
    expect(open.errors[0]).toMatchObject({
      code: REGISTER_RULE.RESOLUTION_ON_OPEN,
      status: REGISTER_RULE.BAD_INPUT,
    });
  });

  /** A closed defect without its fix loses the one fact that explains why it is closed. */
  it("refuses a closed defect with no resolution, null or empty", () => {
    const validator = buildRegisterValidator();
    const withoutResolution = buildValidatorRequest();
    const withEmptyResolution = buildValidatorRequest();

    validator.validateDefectResolution(
      withoutResolution.request,
      DEFECT_RESOLUTIONS.CLOSED_WITHOUT,
    );
    validator.validateDefectResolution(
      withEmptyResolution.request,
      DEFECT_RESOLUTIONS.CLOSED_WITH_EMPTY,
    );

    expect(withoutResolution.errors).toHaveLength(1);
    expect(withoutResolution.errors[0]).toMatchObject({
      code: REGISTER_RULE.RESOLUTION_MISSING,
      status: REGISTER_RULE.BAD_INPUT,
    });
    expect(withEmptyResolution.errors).toHaveLength(1);
    expect(withEmptyResolution.errors[0]).toMatchObject({
      code: REGISTER_RULE.RESOLUTION_MISSING,
      status: REGISTER_RULE.BAD_INPUT,
    });
  });

  /** A run on a task or on a sprint is gate evidence something can show, so neither may be refused. */
  it("accepts a test run linked to a task or to a sprint", () => {
    const validator = buildRegisterValidator();
    const onTask = buildValidatorRequest();
    const onInitiative = buildValidatorRequest();

    validator.validateTestRunTarget(onTask.request, TEST_RUN_TARGETS.ON_TASK);
    validator.validateTestRunTarget(
      onInitiative.request,
      TEST_RUN_TARGETS.ON_INITIATIVE,
    );

    expect(onTask.errors).toHaveLength(0);
    expect(onInitiative.errors).toHaveLength(0);
  });

  /** A run linked to nothing is a result about no work, so the seed must stop on it. */
  it("refuses a test run linked to neither a task nor a sprint", () => {
    const validator = buildRegisterValidator();
    const orphan = buildValidatorRequest();

    validator.validateTestRunTarget(
      orphan.request,
      TEST_RUN_TARGETS.ON_NOTHING,
    );

    expect(orphan.errors).toHaveLength(1);
    expect(orphan.errors[0]).toMatchObject({
      code: REGISTER_RULE.TEST_RUN_TARGET_MISSING,
      status: REGISTER_RULE.BAD_INPUT,
    });
  });

  /** A story already on one of the six codes must load untouched, or the whole hierarchy load is blocked. */
  it("accepts stories whose type is one of the six FRICEW codes", () => {
    const validator = buildRegisterValidator();
    const batch = buildValidatorRequest();

    validator.validateFricewTypes(batch.request, [...STORY_TYPES.ALL_SIX]);

    expect(batch.errors).toHaveLength(0);
  });

  /** Every stray type must be reported in one run, or each rerun surfaces only the next bad story. */
  it("refuses every story whose type is outside the six, naming each", () => {
    const validator = buildRegisterValidator();
    const batch = buildValidatorRequest();

    validator.validateFricewTypes(batch.request, [...STORY_TYPES.TWO_STRAYS]);

    expect(batch.errors).toHaveLength(2);
    expect(batch.errors).toEqual([
      expect.objectContaining({
        code: REGISTER_RULE.TYPE_NOT_IN_CODE_LIST,
        status: REGISTER_RULE.BAD_INPUT,
        args: expect.arrayContaining(["Integration", "interface-story"]),
      }),
      expect.objectContaining({
        code: REGISTER_RULE.TYPE_NOT_IN_CODE_LIST,
        args: expect.arrayContaining(["Integrations", "second-interface-story"]),
      }),
    ]);
  });

  /** The shared message renders the first arg as the bad value, and the last arg is the only pointer to the story to fix. */
  it("refuses a stray type on the type field, with the value first and the story last", () => {
    const validator = buildRegisterValidator();
    const batch = buildValidatorRequest();

    validator.validateFricewTypes(batch.request, [STORY_TYPES.TWO_STRAYS[0]]);

    expect(batch.errors).toHaveLength(1);
    expect(batch.errors[0]).toMatchObject({
      code: REGISTER_RULE.TYPE_NOT_IN_CODE_LIST,
      status: REGISTER_RULE.BAD_INPUT,
      target: "fricewType_code",
    });
    expect(batch.errors[0].args?.[0]).toBe("Integration");
    expect(batch.errors[0].args?.[2]).toBe("interface-story");
  });
});
