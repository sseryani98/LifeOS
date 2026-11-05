// Plain OPA5 page object for the Transactions ListReport, reached through the
// shell. The page enters through the shell, which sap.fe.test's app-id-keyed page
// objects cannot address, so controls are found by the ids FE derives.

import type DynamicPage from "sap/f/DynamicPage";
import type Dialog from "sap/m/Dialog";
import type Label from "sap/m/Label";
import type ListItemBase from "sap/m/ListItemBase";
import type ObjectNumber from "sap/m/ObjectNumber";
import type ObjectStatus from "sap/m/ObjectStatus";
import type Icon from "sap/ui/core/Icon";
import type Form from "sap/ui/layout/form/Form";
import type FormContainer from "sap/ui/layout/form/FormContainer";
import type FormElement from "sap/ui/layout/form/FormElement";
import type Input from "sap/m/Input";
import type CheckBox from "sap/m/CheckBox";
import type Table from "sap/m/Table";
import type ObjectPageSection from "sap/uxap/ObjectPageSection";
import type Token from "sap/m/Token";
import type UI5Element from "sap/ui/core/Element";
import type MdcTable from "sap/ui/mdc/Table";
import Opa5 from "sap/ui/test/Opa5";
import EnterText from "sap/ui/test/actions/EnterText";
import Press from "sap/ui/test/actions/Press";
import {
  buildControlWait,
  buildControlsWait,
} from "com/financialplanner/shared/test/support/opaWaitFor";

import {
  JOURNEY_ANCHOR_BAR,
  JOURNEY_DETAILS_GROUPS,
  JOURNEY_DIALOG,
  JOURNEY_HEADER_STATUS,
  JOURNEY_LABEL,
  JOURNEY_OBJECT_PAGE_EDGE,
  JOURNEY_PAGE,
  JOURNEY_RECURRING,
} from "../../data/constants";
import type {
  DetailsGroup,
  DetailsGroupLayout,
  DialogInputLook,
  HeaderStatusLook,
  ShareInputLook,
  SplitDialogValues,
} from "../../support/types";

/**
 * Reads the inner responsive table FE renders inside the mdc Table.
 * @param table the FE table
 * @returns the inner sap.m.Table
 */
const readInnerTable = (table: MdcTable): Table =>
  (table as unknown as { _oTable: Table })._oTable;

/**
 * Finds the list row showing the given bank description.
 * @param table the FE table
 * @param description the row's raw description
 * @returns the row, or undefined when the list does not show it
 */
const findRow = (
  table: MdcTable,
  description: string,
): ListItemBase | undefined =>
  readInnerTable(table)
    .getItems()
    .find(
      item =>
        item.getBindingContext()?.getProperty("rawDescription") === description,
    );

/**
 * Reads the split icon a row's icon column renders.
 * @param row the list row
 * @returns the icon, or undefined when the row has none
 */
const findSplitIcon = (row: ListItemBase): Icon | undefined =>
  row.findAggregatedObjects(
    true,
    control =>
      control.isA("sap.ui.core.Icon") &&
      (control as Icon).getSrc() === JOURNEY_LABEL.SPLIT_ICON,
  )[0] as Icon | undefined;

/**
 * Finds the object page's editable My Share % input.
 * @param controls the visible sap.m.Input controls
 * @returns the input, or undefined before the draft renders it
 */
const findSharePercentInput = (controls: UI5Element[]): Input | undefined =>
  controls.find(
    control =>
      control.getBinding("value")?.getPath() === "mySharePct" &&
      control.getBindingContext()?.getProperty("IsActiveEntity") === false,
  ) as Input | undefined;

/**
 * Reads the frame's hash as its router sees it, without a leading slash. OPA's
 * frame replaces history.back with a hasher replay, so `location` never moves.
 * @returns the bare hash
 */
const readFrameHash = (): string =>
  Opa5.getHashChanger().getHash().replace(/^\//, "");

/**
 * Reads the rendered width of FE's My Share Amount edit field.
 * @returns the width in px, or undefined before the draft renders it
 */
const readAmountInputWidth = (): number | undefined => {
  const frame = Opa5.getWindow() as unknown as Window;
  const input = frame.document.querySelector(
    `[id$="${JOURNEY_PAGE.AMOUNT_EDIT_INPUT_SUFFIX}"]`,
  );
  return input ? Math.round(input.getBoundingClientRect().width) : undefined;
};

/**
 * Reads the computed text alignment of FE's My Share Amount edit input.
 * @returns the CSS text-align, or undefined before the draft renders it
 */
const readAmountInputAlign = (): string | undefined => {
  const frame = Opa5.getWindow() as unknown as Window;
  const input = frame.document.querySelector(
    `[id$="${JOURNEY_PAGE.AMOUNT_EDIT_INPUT_SUFFIX}"]`,
  );
  return input ? frame.getComputedStyle(input).textAlign : undefined;
};

/**
 * Tells whether a control sits inside the object page header's status facet.
 * @param control the control to test
 * @returns true when an ancestor is the status header facet
 */
const isInHeaderStatusFacet = (control: UI5Element): boolean => {
  let parent = control.getParent() as UI5Element | null;
  while (parent) {
    if (parent.getId().includes(JOURNEY_HEADER_STATUS.FACET_ID_PART)) {
      return true;
    }
    parent = parent.getParent() as UI5Element | null;
  }
  return false;
};

/**
 * Finds the object page header's categorization status, which FE gives a generated id.
 * @param controls the sap.m.ObjectStatus controls
 * @returns the header status, or undefined before the header builds it
 */
const findHeaderStatus = (controls: UI5Element[]): ObjectStatus | undefined =>
  controls.find(control => isInHeaderStatusFacet(control)) as
    ObjectStatus | undefined;

/**
 * Reads where a form element's first rendered field sits in the frame.
 * @param element the form element
 * @returns its bounding box
 */
const readFormElementBox = (element: FormElement): DOMRect =>
  (element.getFields()[0].getDomRef() as HTMLElement).getBoundingClientRect();

/**
 * Reads a form element's label text, whether FE set it as text or as a Label control.
 * @param element the form element
 * @returns the label text
 */
const readFormLabel = (element: FormElement): string => {
  const label = element.getLabel() as string | { getText(): string } | null;
  return typeof label === "string" ? label : (label?.getText() ?? "");
};

/**
 * Finds the editable control bound to Recurring: the dialog's own, or the object page draft's.
 * @param controls the visible controls searched
 * @param inDialog whether the controls come from the open Split dialog
 * @returns the control, or undefined before it renders
 */
const findRecurringControl = (
  controls: UI5Element[],
  inDialog: boolean,
): UI5Element | undefined =>
  controls.find(
    control =>
      ["state", "selected"].some(property =>
        Boolean(
          control
            .getBinding(property)
            ?.getPath()
            ?.endsWith(JOURNEY_RECURRING.PROPERTY),
        ),
      ) &&
      (inDialog ||
        control.getBindingContext()?.getProperty("IsActiveEntity") === false),
  );

/**
 * Reads a form container's heading, whether FE set it as text or as a Title control.
 * @param container the form container
 * @returns the heading text, empty when it has none
 */
const readContainerTitle = (container: FormContainer): string => {
  const title = container.getTitle() as string | { getText(): string } | null;
  return typeof title === "string" ? title : (title?.getText() ?? "");
};

/**
 * Reads the Transaction Details groups beside a field: one per subsection, or one per
 * container where a subsection's form holds several, each with its heading's top.
 * @param anchor a form element inside the Details section
 * @returns each group's heading, heading top and form elements
 */
const readDetailsGroups = (anchor: FormElement): DetailsGroup[] => {
  let section = anchor.getParent() as UI5Element | null;
  // FE subclasses the section, so match by type, not by class name.
  const isSection = (control: UI5Element): boolean =>
    control.isA(JOURNEY_DETAILS_GROUPS.SECTION_TYPE);
  while (section && !isSection(section)) {
    section = section.getParent() as UI5Element | null;
  }
  const readTop = (control: UI5Element): number =>
    Math.round(
      (control.getDomRef() as HTMLElement).getBoundingClientRect().top,
    );
  return (section as ObjectPageSection)
    .getSubSections()
    .filter(subSection => subSection.getVisible())
    .flatMap(subSection => {
      const containers = subSection.findAggregatedObjects(true, control =>
        control.isA("sap.ui.layout.form.FormContainer"),
      ) as FormContainer[];
      return containers.length > 1
        ? containers.map(container => ({
            heading: readContainerTitle(container),
            top: readTop(container),
            elements: container.getFormElements(),
          }))
        : [
            {
              heading: subSection.getTitle(),
              top: readTop(subSection),
              elements: containers.flatMap(container =>
                container.getFormElements(),
              ),
            },
          ];
    });
};

/**
 * Reads how a Details group lays out: the rows its fields take, and whether all sit below its heading.
 * @param group the group's heading, heading top and form elements
 * @returns the group's layout
 */
const readGroupLayout = (group: DetailsGroup): DetailsGroupLayout => {
  const tops = group.elements
    .filter(element => element.getVisible() && element.getDomRef())
    .map(element => Math.round(readFormElementBox(element).top));
  return {
    heading: group.heading,
    rows: new Set(tops).size,
    underHeading: tops.every(top => top > group.top),
  };
};

/**
 * Finds the form element carrying a label among the matched form elements.
 * @param controls the sap.ui.layout.form.FormElement controls
 * @param label the label text
 * @returns the element, or undefined before it renders
 */
const findFormElement = (
  controls: UI5Element[],
  label: string,
): FormElement | undefined =>
  controls.find(control => readFormLabel(control as FormElement) === label) as
    FormElement | undefined;

/**
 * Reads the colour of a field's visible border line: Horizon paints an input's as a gradient, a checkbox's as a border.
 * @param element the DOM node carrying the line
 * @param fromGradient whether the line is the background gradient rather than the border
 * @returns the CSS colour
 */
const readFieldLineColor = (
  element: Element,
  fromGradient: boolean,
): string => {
  const style = (Opa5.getWindow() as unknown as Window).getComputedStyle(
    element,
  );
  return fromGradient
    ? (/rgba?\([^)]*\)/.exec(style.backgroundImage)?.[0] ?? "")
    : style.borderTopColor;
};

/**
 * Reads the distinct left edges of the rendered, on-screen nodes a selector matches.
 * @param selector the CSS selector
 * @returns the left edges in px, ascending
 */
const readVisibleLefts = (selector: string): number[] => {
  const frame = Opa5.getWindow() as unknown as Window;
  const lefts = [...frame.document.querySelectorAll(selector)]
    .map(node => node.getBoundingClientRect())
    .filter(box => box.width > 0 && box.left >= 0)
    .map(box => Math.round(box.left));
  return [...new Set(lefts)].sort((left, right) => left - right);
};

/**
 * Lists every rounded corner inside a node, its ::before and ::after included.
 * @param root the node searched
 * @returns one "class pseudo: radius" entry per rounded box
 */
const readRoundedCorners = (root: Element): string[] => {
  const frame = Opa5.getWindow() as unknown as Window;
  return [...root.querySelectorAll("*")].flatMap(node =>
    [null, ...JOURNEY_ANCHOR_BAR.PSEUDOS]
      .map(pseudo => ({ pseudo, style: frame.getComputedStyle(node, pseudo) }))
      .filter(
        ({ pseudo, style }) =>
          (pseudo === null || style.content !== "none") &&
          style.borderRadius !== "0px",
      )
      .map(
        ({ pseudo, style }) =>
          `${node.className.toString()} ${pseudo ?? ""}: ${style.borderRadius}`,
      ),
  );
};

Opa5.createPageObjects({
  onTheTransactionsList: {
    actions: {
      clearFilters(this: Opa5): void {
        this.waitFor(
          buildControlWait(
            {
              id: JOURNEY_PAGE.FILTER_BAR_ID,
              // The list opens with its filter bar collapsed, so it is not rendered.
              visible: false,
              errorMessage: "The Transaction List filter bar did not render",
            },
            (control: UI5Element) => {
              const filterBar = control as unknown as {
                setFilterConditions(conditions: object): void;
                triggerSearch(): Promise<void>;
              };
              filterBar.setFilterConditions({});
              void filterBar.triggerSearch();
            },
          ),
        );
      },
      selectRowByDescription(this: Opa5, description: string): void {
        this.waitFor(
          buildControlWait(
            {
              id: JOURNEY_PAGE.TABLE_ID,
              check: (control: UI5Element) =>
                readInnerTable(control as MdcTable)
                  .getItems()
                  .some(
                    item =>
                      item
                        .getBindingContext()
                        ?.getProperty("rawDescription") === description,
                  ),
              errorMessage: `No "${description}" row in the Transaction List`,
            },
            (control: UI5Element) => {
              const row = readInnerTable(control as MdcTable)
                .getItems()
                .find(
                  item =>
                    item.getBindingContext()?.getProperty("rawDescription") ===
                    description,
                ) as unknown as { getMultiSelectControl(): UI5Element };
              this.waitFor({
                id: row.getMultiSelectControl().getId(),
                actions: new Press(),
                errorMessage: `Could not select the "${description}" row`,
              });
            },
          ),
        );
      },
      runToolbarAction(this: Opa5, actionId: string): void {
        this.waitFor({
          id: actionId,
          actions: new Press(),
          errorMessage: `The toolbar action ${actionId} is not pressable`,
        });
      },
      openRowByDescription(this: Opa5, description: string): void {
        this.waitFor(
          buildControlWait(
            {
              id: JOURNEY_PAGE.TABLE_ID,
              check: (control: UI5Element) =>
                findRow(control as MdcTable, description) !== undefined,
              errorMessage: `No "${description}" row to open`,
            },
            (control: UI5Element) => {
              const row = findRow(
                control as MdcTable,
                description,
              ) as ListItemBase;
              this.waitFor({
                id: row.getId(),
                actions: new Press(),
                errorMessage: `Could not open the "${description}" row`,
              });
            },
          ),
        );
      },
      startObjectPageEdit(this: Opa5): void {
        this.waitFor({
          id: JOURNEY_PAGE.EDIT_ACTION_ID,
          actions: new Press(),
          errorMessage: "The object page Edit action is not pressable",
        });
      },
      navigateToHash(this: Opa5, hash: string): void {
        // Queued, so the hash moves only once the steps before it have settled.
        const moveHash = (): void => Opa5.getHashChanger().setHash(hash);
        this.waitFor({ success: moveHash });
      },
      writeAddressHash(this: Opa5, hash: string): void {
        // The frame's own location, not a HashChanger: on the welcome page no router has started one.
        const enterHash = (): void => {
          (Opa5.getWindow() as unknown as Window).location.hash = hash;
        };
        this.waitFor({ success: enterHash });
      },
      navigateBackInBrowser(this: Opa5): void {
        // Queued, so Back runs only once the steps before it have settled. OPA's frame
        // replays its recorded hashes here, where FE's replaced entries are missing.
        const goBack = (): void => {
          (Opa5.getWindow() as unknown as Window).history.back();
        };
        this.waitFor({ success: goBack });
      },
      writeDialogInputText(this: Opa5, inputId: string, text: string): void {
        this.waitFor({
          id: inputId,
          searchOpenDialogs: true,
          actions: new EnterText({ text, pressEnterKey: true }),
          errorMessage: `Could not type into the dialog input ${inputId}`,
        });
      },
      selectDialogButton(this: Opa5, buttonId: string): void {
        this.waitFor({
          id: buttonId,
          searchOpenDialogs: true,
          actions: new Press(),
          errorMessage: `The dialog button ${buttonId} is not pressable`,
        });
      },
    },
    assertions: {
      checkFilterBarCollapsed(this: Opa5): void {
        this.waitFor(
          buildControlWait(
            {
              id: JOURNEY_PAGE.LIST_PAGE_ID,
              check: (control: UI5Element) =>
                !(control as DynamicPage).getHeaderExpanded(),
              errorMessage:
                "The Transaction List opened with its filter bar expanded",
            },
            (control: UI5Element) => {
              Opa5.assert.strictEqual(
                (control as DynamicPage).getHeaderExpanded(),
                false,
                "The filter bar opens collapsed",
              );
            },
          ),
        );
      },
      checkFilterTokenText(this: Opa5, text: string): void {
        this.waitFor(
          buildControlsWait(
            {
              controlType: "sap.m.Token",
              // The collapsed header leaves its tokens unrendered.
              visible: false,
              check: (controls: UI5Element[]) =>
                controls.some(control => (control as Token).getText() === text),
              errorMessage: `No "${text}" filter token on the Transaction List`,
            },
            () => {
              Opa5.assert.ok(true, `The default filter token reads "${text}"`);
            },
          ),
        );
      },
      checkColumnHeader(this: Opa5, header: string): void {
        this.waitFor(
          buildControlWait(
            {
              id: JOURNEY_PAGE.TABLE_ID,
              check: (control: UI5Element) =>
                (control as MdcTable)
                  .getColumns()
                  .some(column => column.getHeader() === header),
              errorMessage: `No "${header}" column on the Transaction List`,
            },
            () => {
              Opa5.assert.ok(true, `The list has a "${header}" column`);
            },
          ),
        );
      },
      checkSplitIcon(this: Opa5, description: string, shown: boolean): void {
        this.waitFor(
          buildControlWait(
            {
              id: JOURNEY_PAGE.TABLE_ID,
              check: (control: UI5Element) => {
                const row = findRow(control as MdcTable, description);
                return row !== undefined && findSplitIcon(row) !== undefined;
              },
              errorMessage: `The "${description}" row renders no split icon`,
            },
            (control: UI5Element) => {
              const icon = findSplitIcon(
                findRow(control as MdcTable, description) as ListItemBase,
              ) as Icon;
              Opa5.assert.strictEqual(
                icon.getVisible(),
                shown,
                `The "${description}" split icon shows: ${String(shown)}`,
              );
            },
          ),
        );
      },
      checkSplitSharePercent(this: Opa5, percent: string): void {
        this.waitFor(
          buildControlsWait(
            {
              controlType: "sap.m.ObjectNumber",
              check: (controls: UI5Element[]) =>
                controls.some(
                  control => (control as ObjectNumber).getNumber() === percent,
                ),
              errorMessage: `The split section shows no ${percent}% share`,
            },
            () => {
              Opa5.assert.ok(
                true,
                `The split section shows a ${percent}% share`,
              );
            },
          ),
        );
      },
      checkSplitSharePercentEmpty(this: Opa5): void {
        this.waitFor(
          buildControlsWait(
            {
              controlType: "sap.m.ObjectNumber",
              check: (controls: UI5Element[]) =>
                controls.some(
                  control =>
                    control.getBinding("number")?.getPath() === "mySharePct" &&
                    // A share not yet read also renders empty; wait for the loaded amount.
                    ![null, undefined].includes(
                      control.getBindingContext()?.getProperty("myShareAmount"),
                    ) &&
                    Boolean(
                      control
                        .getDomRef()
                        ?.textContent?.startsWith(
                          JOURNEY_LABEL.EMPTY_INDICATOR,
                        ),
                    ),
                ),
              errorMessage:
                "The split section's empty percentage does not read as a dash",
            },
            (controls: UI5Element[]) => {
              const shown = controls.find(
                control =>
                  control.getBinding("number")?.getPath() === "mySharePct",
              );
              Opa5.assert.notOk(
                shown
                  ?.getDomRef()
                  ?.textContent?.includes(JOURNEY_LABEL.PERCENT_UNIT),
                "An empty percentage shows a dash, not a bare %",
              );
            },
          ),
        );
      },
      checkLabelRequired(this: Opa5, text: string): void {
        this.waitFor(
          buildControlsWait(
            {
              controlType: "sap.m.Label",
              searchOpenDialogs: true,
              check: (controls: UI5Element[]) =>
                controls.some(control => (control as Label).getText() === text),
              errorMessage: `No "${text}" label in the open dialog`,
            },
            (controls: UI5Element[]) => {
              const label = controls.find(
                control => (control as Label).getText() === text,
              ) as Label;
              Opa5.assert.strictEqual(
                label.getRequired(),
                true,
                `The "${text}" label is marked required`,
              );
            },
          ),
        );
      },
      checkFieldHidden(this: Opa5, label: string): void {
        this.waitFor(
          buildControlsWait(
            {
              controlType: "sap.ui.layout.form.FormElement",
              visible: false,
              check: (controls: UI5Element[]) =>
                controls.some(
                  control =>
                    readFormLabel(control as FormElement) === label &&
                    Boolean(control.getBindingContext()) &&
                    !(control as FormElement).getVisible(),
                ),
              errorMessage: `The object page shows an empty "${label}"`,
            },
            () => {
              Opa5.assert.ok(
                true,
                `The object page hides the empty "${label}"`,
              );
            },
          ),
        );
      },
      checkDialogText(this: Opa5, controlType: string, text: string): void {
        this.waitFor(
          buildControlsWait(
            {
              controlType,
              searchOpenDialogs: true,
              check: (controls: UI5Element[]) =>
                controls.some(
                  control =>
                    (control as unknown as { getText(): string }).getText() ===
                    text,
                ),
              errorMessage: `No ${controlType} reading "${text}" in the open dialog`,
            },
            () => {
              Opa5.assert.ok(true, `The open dialog shows "${text}"`);
            },
          ),
        );
      },
      checkSplitDialogValues(this: Opa5, values: SplitDialogValues): void {
        this.waitFor(
          buildControlWait(
            {
              id: JOURNEY_DIALOG.SPLIT_PCT,
              searchOpenDialogs: true,
              check: (control: UI5Element) =>
                (control as Input).getValue() !== "",
              errorMessage:
                "The Split dialog opened without its recurring suggestion",
            },
            (control: UI5Element) => {
              const frame = Opa5.getWindow() as unknown as {
                sap: {
                  ui: {
                    core: {
                      Element: { getElementById(id: string): UI5Element };
                    };
                  };
                };
              };
              const byId = (id: string): UI5Element =>
                frame.sap.ui.core.Element.getElementById(id);
              Opa5.assert.deepEqual(
                {
                  pct: (control as Input).getValue(),
                  amount: (
                    byId(JOURNEY_DIALOG.SPLIT_AMOUNT) as Input
                  ).getValue(),
                  description: (
                    byId(JOURNEY_DIALOG.SPLIT_DESCRIPTION) as Input
                  ).getValue(),
                  recurring: (
                    byId(JOURNEY_DIALOG.SPLIT_RECURRING) as CheckBox
                  ).getSelected(),
                },
                values,
                "The Split dialog is pre-filled with the vendor's recurring split",
              );
            },
          ),
        );
      },
      checkDialogInputValue(this: Opa5, inputId: string, value: string): void {
        this.waitFor(
          buildControlWait(
            {
              id: inputId,
              searchOpenDialogs: true,
              check: (control: UI5Element) =>
                (control as Input).getValue() === value,
              errorMessage: `The dialog input ${inputId} does not read "${value}"`,
            },
            (control: UI5Element) => {
              Opa5.assert.strictEqual(
                (control as Input).getValue(),
                value,
                `${inputId} reads "${value}"`,
              );
            },
          ),
        );
      },
      checkDialogInputState(this: Opa5, inputId: string, state: string): void {
        this.waitFor(
          buildControlWait(
            {
              id: inputId,
              searchOpenDialogs: true,
              check: (control: UI5Element) =>
                (control as Input).getValueState() === state,
              errorMessage: `The dialog input ${inputId} never shows valueState ${state}`,
            },
            (control: UI5Element) => {
              Opa5.assert.ok(
                (control as Input).getValueStateText() !== "",
                `${inputId} shows ${state} with its reason`,
              );
            },
          ),
        );
      },
      checkSplitShareInputsSameWidth(this: Opa5): void {
        this.waitFor(
          buildControlsWait(
            {
              controlType: "sap.m.Input",
              check: (controls: UI5Element[]) =>
                findSharePercentInput(controls) !== undefined &&
                readAmountInputWidth() !== undefined,
              errorMessage: "The object page draft renders no My Share % input",
            },
            (controls: UI5Element[]) => {
              const input = findSharePercentInput(controls) as Input;
              Opa5.assert.strictEqual(
                Math.round(
                  (input.getFocusDomRef() as Element).getBoundingClientRect()
                    .width,
                ),
                readAmountInputWidth(),
                "My Share % is as wide as My Share Amount",
              );
            },
          ),
        );
      },
      checkDialogInputAlign(
        this: Opa5,
        inputId: string,
        textAlign: string,
      ): void {
        this.waitFor(
          buildControlWait(
            {
              id: inputId,
              searchOpenDialogs: true,
              errorMessage: `The dialog input ${inputId} did not render`,
            },
            (control: UI5Element) => {
              Opa5.assert.strictEqual(
                (control as Input).getTextAlign(),
                textAlign,
                `${inputId} aligns ${textAlign}`,
              );
            },
          ),
        );
      },
      checkDialogInputLook(
        this: Opa5,
        inputId: string,
        look: DialogInputLook,
      ): void {
        this.waitFor(
          buildControlWait(
            {
              id: inputId,
              searchOpenDialogs: true,
              errorMessage: `The dialog input ${inputId} did not render`,
            },
            (control: UI5Element) => {
              const input = control as Input;
              Opa5.assert.deepEqual(
                {
                  description: input.getDescription(),
                  placeholder: input.getPlaceholder(),
                },
                look,
                `${inputId} carries the object page's affix and empty state`,
              );
            },
          ),
        );
      },
      checkDialogInputsSameWidth(
        this: Opa5,
        firstId: string,
        secondId: string,
      ): void {
        this.waitFor(
          buildControlWait(
            {
              id: firstId,
              searchOpenDialogs: true,
              errorMessage: `The dialog input ${firstId} did not render`,
            },
            (control: UI5Element) => {
              const frame = Opa5.getWindow() as unknown as {
                sap: {
                  ui: {
                    core: {
                      Element: { getElementById(id: string): UI5Element };
                    };
                  };
                };
              };
              const second = frame.sap.ui.core.Element.getElementById(
                secondId,
              ) as Input;
              const readWidth = (input: Input): number =>
                Math.round(
                  (input.getFocusDomRef() as Element).getBoundingClientRect()
                    .width,
                );
              Opa5.assert.strictEqual(
                readWidth(control as Input),
                readWidth(second),
                `${firstId} is as wide as ${secondId}`,
              );
            },
          ),
        );
      },
      checkHeaderStatus(this: Opa5, look: HeaderStatusLook): void {
        this.waitFor(
          buildControlsWait(
            {
              controlType: "sap.m.ObjectStatus",
              // A small test frame snaps the header, which leaves its content unrendered.
              visible: false,
              check: (controls: UI5Element[]) =>
                findHeaderStatus(controls)?.getText() === look.text,
              errorMessage: `The object page header shows no "${look.text}" status`,
            },
            (controls: UI5Element[]) => {
              const status = findHeaderStatus(controls) as ObjectStatus;
              Opa5.assert.deepEqual(
                {
                  text: status.getText(),
                  state: status.getState(),
                  icon: status.getIcon(),
                },
                look,
                `The header status reads "${look.text}" in ${look.state} with ${look.icon}`,
              );
            },
          ),
        );
      },
      checkRecordHeaderStatus(
        this: Opa5,
        transactionId: string,
        look: HeaderStatusLook,
      ): void {
        this.waitFor(
          buildControlsWait(
            {
              controlType: "sap.m.ObjectStatus",
              visible: false,
              // The state is waited for too: FE writes it after the read, so a lost state can only time out.
              check: (controls: UI5Element[]) => {
                const status = findHeaderStatus(controls);
                return (
                  status
                    ?.getBindingContext()
                    ?.getPath()
                    .includes(transactionId) === true &&
                  status.getText() === look.text &&
                  status.getState() === look.state
                );
              },
              errorMessage: `The header of ${transactionId} never reads "${look.text}" in ${look.state}`,
            },
            (controls: UI5Element[]) => {
              const status = findHeaderStatus(controls) as ObjectStatus;
              Opa5.assert.deepEqual(
                {
                  text: status.getText(),
                  state: status.getState(),
                  icon: status.getIcon(),
                },
                look,
                `The header of ${transactionId} reads "${look.text}" in ${look.state} with ${look.icon}`,
              );
            },
          ),
        );
      },
      checkSplitSharePercentInput(this: Opa5, look: ShareInputLook): void {
        this.waitFor(
          buildControlsWait(
            {
              controlType: "sap.m.Input",
              check: (controls: UI5Element[]) =>
                findSharePercentInput(controls) !== undefined &&
                readAmountInputAlign() !== undefined,
              errorMessage: "The object page draft renders no My Share % input",
            },
            (controls: UI5Element[]) => {
              const input = findSharePercentInput(controls) as Input;
              const frame = Opa5.getWindow() as unknown as Window;
              const inner = input.getFocusDomRef() as Element;
              Opa5.assert.deepEqual(
                {
                  textAlign: input.getTextAlign(),
                  placeholder: input.getPlaceholder(),
                },
                look,
                "The empty My Share % input is end-aligned and shows a dash",
              );
              Opa5.assert.strictEqual(
                frame.getComputedStyle(inner).textAlign,
                readAmountInputAlign(),
                "My Share % aligns as My Share Amount does",
              );
            },
          ),
        );
      },
      checkRecurringControl(
        this: Opa5,
        controlType: string,
        inDialog: boolean,
      ): void {
        this.waitFor(
          buildControlsWait(
            {
              controlType: "sap.ui.core.Control",
              searchOpenDialogs: inDialog,
              check: (controls: UI5Element[]) =>
                findRecurringControl(controls, inDialog) !== undefined,
              errorMessage: "No editable Recurring control rendered",
            },
            (controls: UI5Element[]) => {
              Opa5.assert.strictEqual(
                (findRecurringControl(controls, inDialog) as UI5Element)
                  .getMetadata()
                  .getName(),
                controlType,
                `Recurring renders as ${controlType}`,
              );
            },
          ),
        );
      },
      checkDetailsGroupTitles(
        this: Opa5,
        anchorLabel: string,
        titles: readonly string[],
      ): void {
        this.waitFor(
          buildControlsWait(
            {
              controlType: "sap.ui.layout.form.FormElement",
              check: (controls: UI5Element[]) =>
                findFormElement(controls, anchorLabel) !== undefined,
              errorMessage: `The object page does not show ${anchorLabel}`,
            },
            (controls: UI5Element[]) => {
              Opa5.assert.deepEqual(
                readDetailsGroups(
                  findFormElement(controls, anchorLabel) as FormElement,
                ).map(group => group.heading),
                titles,
                `The section holding ${anchorLabel} heads each of its groups`,
              );
            },
          ),
        );
      },
      checkDetailsGroupsIntact(
        this: Opa5,
        anchorLabel: string,
        titles: readonly string[],
      ): void {
        this.waitFor(
          buildControlsWait(
            {
              controlType: "sap.ui.layout.form.FormElement",
              check: (controls: UI5Element[]) =>
                findFormElement(controls, anchorLabel) !== undefined,
              errorMessage: `The object page does not show ${anchorLabel}`,
            },
            (controls: UI5Element[]) => {
              const frame = Opa5.getWindow() as unknown as Window;
              Opa5.assert.deepEqual(
                readDetailsGroups(
                  findFormElement(controls, anchorLabel) as FormElement,
                ).map(readGroupLayout),
                titles.map(heading => ({
                  heading,
                  rows: 1,
                  underHeading: true,
                })),
                `At ${frame.innerWidth}px each Details group keeps its fields on one row under its heading`,
              );
            },
          ),
        );
      },
      checkObjectPageEdgesAligned(this: Opa5): void {
        this.waitFor(
          buildControlsWait(
            {
              controlType: "sap.uxap.ObjectPageSubSection",
              check: () =>
                readVisibleLefts(JOURNEY_OBJECT_PAGE_EDGE.CARDS).length > 0 &&
                readVisibleLefts(JOURNEY_OBJECT_PAGE_EDGE.HEADINGS).length > 0,
              errorMessage: "The object page rendered no headed section cards",
            },
            () => {
              const frame = Opa5.getWindow() as unknown as Window;
              Opa5.assert.deepEqual(
                readVisibleLefts(JOURNEY_OBJECT_PAGE_EDGE.CARDS),
                readVisibleLefts(JOURNEY_OBJECT_PAGE_EDGE.HEADINGS),
                `At ${frame.innerWidth}px the section cards start where the page, section and group headings do`,
              );
            },
          ),
        );
      },
      checkAnchorBarSquare(this: Opa5): void {
        this.waitFor(
          buildControlsWait(
            {
              id: new RegExp(`${JOURNEY_ANCHOR_BAR.ID_SUFFIX}$`),
              check: (controls: UI5Element[]) =>
                Boolean(
                  controls[0]
                    ?.getDomRef()
                    ?.querySelector(JOURNEY_ANCHOR_BAR.EXPAND_ICON),
                ),
              errorMessage: "The object page anchor bar has no expand icon",
            },
            (controls: UI5Element[]) => {
              Opa5.assert.deepEqual(
                readRoundedCorners(controls[0].getDomRef() as HTMLElement),
                [],
                "The anchor bar's items, overflow buttons and expand icons are square",
              );
            },
          ),
        );
      },
      checkDialogWidth(this: Opa5, dialogId: string, width: number): void {
        this.waitFor(
          buildControlWait(
            {
              id: dialogId,
              searchOpenDialogs: true,
              errorMessage: `The dialog ${dialogId} did not open`,
            },
            (control: UI5Element) => {
              Opa5.assert.strictEqual(
                Math.round(
                  (control.getDomRef() as HTMLElement).getBoundingClientRect()
                    .width,
                ),
                width,
                `${dialogId} opens ${width}px wide`,
              );
            },
          ),
        );
      },
      checkCheckBoxBorderMatchesInput(
        this: Opa5,
        checkBoxId: string,
        inputId: string,
      ): void {
        this.waitFor(
          buildControlWait(
            {
              id: checkBoxId,
              searchOpenDialogs: true,
              errorMessage: `The checkbox ${checkBoxId} did not render`,
            },
            (control: UI5Element) => {
              const frame = Opa5.getWindow() as unknown as {
                sap: {
                  ui: {
                    core: {
                      Element: { getElementById(id: string): UI5Element };
                    };
                  };
                };
              };
              const input = frame.sap.ui.core.Element.getElementById(inputId);
              Opa5.assert.strictEqual(
                readFieldLineColor(
                  (control.getDomRef() as HTMLElement).querySelector(
                    ".sapMCbBg",
                  ) as Element,
                  false,
                ),
                readFieldLineColor(
                  (input.getDomRef() as HTMLElement).querySelector(
                    ".sapMInputBaseContentWrapper",
                  ) as Element,
                  true,
                ),
                `${checkBoxId} draws its border in the colour of ${inputId}'s`,
              );
            },
          ),
        );
      },
      checkNoLogEntry(this: Opa5, text: string): void {
        this.waitFor(
          buildControlWait(
            {
              id: JOURNEY_DIALOG.SPLIT_PCT,
              searchOpenDialogs: true,
              errorMessage: "The Split dialog did not open",
            },
            () => {
              const frame = Opa5.getWindow() as unknown as {
                sap: {
                  ui: {
                    require(name: string): {
                      getLogEntries(): { message: string }[];
                    };
                  };
                };
              };
              const logged = frame.sap.ui
                .require("sap/base/Log")
                .getLogEntries()
                .map(entry => entry.message)
                .filter(message => message.includes(text));
              Opa5.assert.deepEqual(
                logged,
                [],
                `Opening the Split dialog logs no "${text}"`,
              );
            },
          ),
        );
      },
      checkListShownAtHash(this: Opa5, listHash: string): void {
        this.waitFor(
          buildControlWait(
            {
              id: JOURNEY_PAGE.LIST_PAGE_ID,
              check: () => readFrameHash() === listHash,
              errorMessage: `Back never returned to the list at #${listHash}`,
            },
            () => {
              Opa5.assert.strictEqual(
                readFrameHash(),
                listHash,
                `Back returned to the list at #${listHash}`,
              );
            },
          ),
        );
      },
      checkDialogOpen(this: Opa5, dialogId: string): void {
        this.waitFor(
          buildControlWait(
            {
              id: dialogId,
              searchOpenDialogs: true,
              errorMessage: `The dialog ${dialogId} did not open`,
            },
            (control: UI5Element) => {
              Opa5.assert.strictEqual(
                (control as Dialog).isOpen(),
                true,
                `${dialogId} is open`,
              );
            },
          ),
        );
      },
      checkDialogClosed(this: Opa5, dialogId: string): void {
        this.waitFor(
          buildControlWait(
            {
              id: dialogId,
              visible: false,
              check: (control: UI5Element) => !(control as Dialog).isOpen(),
              errorMessage: `The dialog ${dialogId} stayed open`,
            },
            (control: UI5Element) => {
              Opa5.assert.strictEqual(
                (control as Dialog).isOpen(),
                false,
                `${dialogId} closed`,
              );
            },
          ),
        );
      },
    },
  },
});
