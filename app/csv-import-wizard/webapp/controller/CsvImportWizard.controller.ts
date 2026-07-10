import BaseController from "com/financialplanner/shared/BaseController";
import CsvImportWizardService from "com/financialplanner/csvimportwizard/model/CsvImportWizardService";
import DialogManager from "com/financialplanner/shared/DialogManager";
import Messaging from "com/financialplanner/shared/Messaging";
import JSONModel from "sap/ui/model/json/JSONModel";
import {
  CONTROL_ID,
  CREATE_DIALOG,
  CREATE_DIALOG_FRAGMENT,
  DEDUP_OUTCOME,
  DUPLICATE_DECISION,
  PERCENT_MAX,
} from "com/financialplanner/csvimportwizard/model/constants";
import type { Button$PressEvent } from "sap/m/Button";
import type Table from "sap/m/Table";
import type Wizard from "sap/m/Wizard";
import type View from "sap/ui/core/mvc/View";
import type UIComponent from "sap/ui/core/UIComponent";
import type Context from "sap/ui/model/Context";
import type ODataModel from "sap/ui/model/odata/v4/ODataModel";
import type { FileUploader$ChangeEvent } from "sap/ui/unified/FileUploader";
import type {
  ClassifiedRow,
  DuplicateRow,
  ExcludedEditRow,
  ExcludedRow,
  ImportSummary,
  NewRow,
  ParseResult,
  ParsedFile,
  SaveRow,
} from "com/financialplanner/csvimportwizard/model/types";

/**
 * CSV Import Wizard controller. Drives the three-step flow: upload + card
 * selection, tabbed review (New / Potential Duplicates / Excluded) with batch
 * categorization, and confirm + save. All backend calls go through
 * CsvImportWizardService; UI state lives in the "ui" JSON model.
 *
 * @namespace com.financialplanner.csvimportwizard.controller
 */
export default class CsvImportWizard extends BaseController {
  private _service!: CsvImportWizardService;
  private _createEntitySet = "";
  private readonly _dialogs = new DialogManager(this);
  private readonly _messages = new Messaging(this);

  /**
   * Initialises the UI-state model and the data-access service.
   */
  public onInit(): void {
    const view = this.getView() as View;
    view.setModel(this._buildInitialState(), "ui");
    const model = (this.getOwnerComponent() as UIComponent).getModel() as ODataModel;
    this._service = new CsvImportWizardService(model);
    this._setupDropZone();
  }

  /**
   * Reads files chosen through the file picker into the pending upload set.
   * @param event the FileUploader change event carrying the chosen files
   */
  public onFileUploaderChange(event: FileUploader$ChangeEvent): void {
    const files = (event.getParameter("files") ?? []) as unknown as File[];
    if (files.length > 0) {
      void this._addFiles([...files]);
    }
  }

  /**
   * Parses every pending file against the selected card and opens the review
   * step, blocking when no format config resolves for the card's issuer.
   */
  public onButtonParseFilesPress(): void {
    const state = this._getState();
    const card = state.getProperty("/selectedCard") as string;
    const files = state.getProperty("/files") as ParsedFile[];
    if (!card || files.length === 0) {
      this._messages.showWarning("msgSelectFileAndCard");
      return;
    }
    void this._parseAndReview(card, files);
  }

  /**
   * Clears one New-tab row and propagates its categorization to still-uncleared
   * rows that share the same description.
   * @param event the press event from the row's Clear button
   */
  public onButtonClearRowPress(event: Button$PressEvent): void {
    const row = this._getRowContext(event).getObject() as NewRow;
    this._applyCategorization(row);
    row.cleared = true;
    this._refreshNewRows();
  }

  /**
   * Reverts a cleared New-tab row back to editable.
   * @param event the press event from the row's Undo button
   */
  public onButtonUndoRowPress(event: Button$PressEvent): void {
    const row = this._getRowContext(event).getObject() as NewRow;
    row.cleared = false;
    this._refreshNewRows();
  }

  /**
   * Clears every categorized row sharing the pressed row's description.
   * @param event the press event from the row's Clear-Matching button
   */
  public onButtonClearMatchingPress(event: Button$PressEvent): void {
    const row = this._getRowContext(event).getObject() as NewRow;
    const rows = this._getState().getProperty("/newRows") as NewRow[];
    rows
      .filter(
        candidate =>
          candidate.rawDescription === row.rawDescription &&
          this._isCategorized(candidate),
      )
      .forEach(candidate => {
        candidate.cleared = true;
      });
    this._refreshNewRows();
  }

  /**
   * Applies the first selected row's categorization to all selected rows.
   */
  public onButtonApplySelectedPress(): void {
    const table = this.byId(CONTROL_ID.NEW_TABLE) as Table;
    const contexts = table.getSelectedContexts(true) as Context[];
    if (contexts.length < 2) {
      this._messages.showWarning("msgSelectAtLeastTwo");
      return;
    }
    const source = contexts[0].getObject() as NewRow;
    contexts.slice(1).forEach(context => {
      const target = context.getObject() as NewRow;
      target.vendor_ID = source.vendor_ID;
      target.purchaseType_ID = source.purchaseType_ID;
      target.earningCategory_ID = source.earningCategory_ID;
    });
    this._refreshNewRows();
  }

  /**
   * Opens the create-vendor dialog for on-the-fly vendor creation.
   */
  public onButtonNewVendorPress(): void {
    this._openCreateDialog(
      CREATE_DIALOG.VENDOR.ENTITY_SET,
      CREATE_DIALOG.VENDOR.TITLE_KEY,
    );
  }

  /**
   * Opens the create-earning-category dialog for on-the-fly creation.
   */
  public onButtonNewEarningCategoryPress(): void {
    this._openCreateDialog(
      CREATE_DIALOG.EARNING_CATEGORY.ENTITY_SET,
      CREATE_DIALOG.EARNING_CATEGORY.TITLE_KEY,
    );
  }

  /**
   * Creates the typed reference entity, refreshes the value-help lists, and
   * closes the dialog.
   */
  public onButtonConfirmCreatePress(): void {
    const name = ((this._getState().getProperty("/newRefName") as string) || "").trim();
    if (!name) {
      this._messages.showWarning("msgNameRequired");
      return;
    }
    void this._service
      .createReference(this._createEntitySet, name)
      .then(() => {
        (this.getView() as View).getModel()?.refresh();
        this._messages.showToast("msgReferenceCreated");
        this._dialogs.close(CONTROL_ID.CREATE_DIALOG);
      })
      .catch(() => this._messages.showError("msgReferenceCreateFailed"));
  }

  /**
   * Closes the create-reference dialog without saving.
   */
  public onButtonCancelCreatePress(): void {
    this._dialogs.close(CONTROL_ID.CREATE_DIALOG);
  }

  /**
   * Marks a potential duplicate to be skipped (not imported).
   * @param event the press event from the duplicate's Skip button
   */
  public onButtonSkipDuplicatePress(event: Button$PressEvent): void {
    this._setDuplicateDecision(event, DUPLICATE_DECISION.SKIP);
  }

  /**
   * Marks a potential duplicate to be imported anyway (override).
   * @param event the press event from the duplicate's Import button
   */
  public onButtonImportDuplicatePress(event: Button$PressEvent): void {
    this._setDuplicateDecision(event, DUPLICATE_DECISION.IMPORT);
  }

  /**
   * Moves a corrected Excluded row into the New tab, using the edited value for
   * the field that failed to parse.
   * @param event the press event from the Excluded row's Move button
   */
  public onButtonMoveToNewPress(event: Button$PressEvent): void {
    const context = this._getRowContext(event);
    const excluded = context.getObject() as ExcludedEditRow;
    if (!excluded.editedValue || excluded.editedValue.trim() === "") {
      this._messages.showWarning("msgCorrectionRequired");
      return;
    }
    this._moveExcludedRow(excluded);
  }

  /**
   * Persists the cleared New rows and imported duplicates, then shows the
   * post-import summary.
   */
  public onButtonSaveImportPress(): void {
    const state = this._getState();
    const rows = this._buildSaveRows();
    if (rows.length === 0) {
      this._messages.showWarning("msgNothingToImport");
      return;
    }
    state.setProperty("/saving", true);
    void this._service
      .saveImport(
        state.getProperty("/selectedCard") as string,
        state.getProperty("/fileNames") as string,
        state.getProperty("/skippedCount") as number,
        rows,
      )
      .then(summary => this._showSummary(summary))
      .catch(() => this._messages.showError("msgSaveFailed"))
      .finally(() => state.setProperty("/saving", false));
  }

  /**
   * Reads dropped OS files into the pending upload set.
   * @param files the files dropped onto the drop zone
   */
  private async _addFiles(files: File[]): Promise<void> {
    const parsed = await Promise.all(files.map(file => this._readFile(file)));
    const state = this._getState();
    const existing = state.getProperty("/files") as ParsedFile[];
    const merged = [...existing, ...parsed];
    state.setProperty("/files", merged);
    state.setProperty("/fileNames", merged.map(file => file.name).join(", "));
    state.setProperty("/canParse", merged.length > 0);
  }

  /**
   * Builds the initial UI-state model with empty review buckets.
   * @returns the seeded "ui" JSON model
   */
  private _buildInitialState(): JSONModel {
    return new JSONModel({
      selectedCard: "",
      hasSuppCards: false,
      files: [],
      fileNames: "",
      canParse: false,
      parsed: false,
      configName: "",
      newRows: [],
      duplicateRows: [],
      excludedRows: [],
      newCount: 0,
      duplicateCount: 0,
      excludedCount: 0,
      clearedCount: 0,
      skippedCount: 0,
      totalAmount: 0,
      progressPercent: 0,
      newRefName: "",
      saving: false,
      summary: null,
    });
  }

  /**
   * Gathers every cleared New row and every duplicate marked for import into the
   * save payload.
   * @returns the rows to persist
   */
  private _buildSaveRows(): SaveRow[] {
    const state = this._getState();
    const newRows = (state.getProperty("/newRows") as NewRow[])
      .filter(row => row.cleared)
      .map(row => this._toSaveRow(row));
    const overrides = (state.getProperty("/duplicateRows") as DuplicateRow[])
      .filter(row => row.decision === DUPLICATE_DECISION.IMPORT)
      .map(row => this._toSaveRow(this._toNewRow(row.csv)));
    return [...newRows, ...overrides];
  }

  /**
   * Opens the shared create-reference dialog for the given entity set.
   * @param entitySet the OData entity-set path to create into
   * @param titleKey the i18n key for the dialog title
   */
  private _openCreateDialog(entitySet: string, titleKey: string): void {
    this._createEntitySet = entitySet;
    const state = this._getState();
    state.setProperty("/newRefName", "");
    state.setProperty("/createDialogTitle", this.getText(titleKey));
    void this._dialogs.open(CREATE_DIALOG_FRAGMENT);
  }

  /**
   * Parses the files, maps the result into review buckets, and advances the
   * wizard — or blocks when the card's issuer has no format config.
   * @param card the selected card instance id
   * @param files the pending files to parse
   */
  private async _parseAndReview(
    card: string,
    files: ParsedFile[],
  ): Promise<void> {
    try {
      const result = await this._service.parseFiles(card, files);
      if (!result.configResolved) {
        this._messages.showWarning("msgNoFormatConfig");
        return;
      }
      await this._applyParseResult(result);
      this._getState().setProperty("/parsed", true);
      (this.byId(CONTROL_ID.WIZARD) as Wizard).nextStep();
    } catch {
      this._messages.showError("msgParseFailed");
    }
  }

  /**
   * Maps a parse result into the New / Potential-Duplicates / Excluded buckets,
   * loading the matched existing transactions for the side-by-side view.
   * @param result the merged parse result
   */
  private async _applyParseResult(result: ParseResult): Promise<void> {
    const state = this._getState();
    const newRows = result.newRows.map(row => this._toNewRow(row));
    const duplicateRows = await this._buildDuplicateRows(
      result.potentialDuplicates,
    );
    const excludedRows = result.excludedRows.map(row => this._toExcludedRow(row));
    state.setProperty("/newRows", newRows);
    state.setProperty("/duplicateRows", duplicateRows);
    state.setProperty("/excludedRows", excludedRows);
    state.setProperty("/configName", result.configName ?? "");
    state.setProperty("/skippedCount", result.skippedCount);
    state.setProperty(
      "/hasSuppCards",
      newRows.some(row => row.cardholderName !== null),
    );
    this._refreshNewRows();
  }

  /**
   * Pairs each potential duplicate with the existing transaction it matched.
   * @param duplicates the potential-duplicate classified rows
   * @returns the paired duplicate rows for review
   */
  private async _buildDuplicateRows(
    duplicates: ClassifiedRow[],
  ): Promise<DuplicateRow[]> {
    const ids = duplicates.map(row => row.matchedTransactionId ?? "");
    const matches = await this._service.loadMatchedTransactions(ids);
    return duplicates.map(row => {
      const existing = matches[row.matchedTransactionId ?? ""] ?? null;
      return {
        csv: row,
        existingPostedAt: existing?.postedAt ?? "",
        existingAmount: existing?.amount ?? 0,
        existingDescription: existing?.rawDescription ?? "",
        decision: "",
      };
    });
  }

  /**
   * Promotes a corrected Excluded row into the New tab, placing the edited value
   * into the field that had failed to parse.
   * @param excluded the corrected excluded row
   */
  private _moveExcludedRow(excluded: ExcludedEditRow): void {
    const state = this._getState();
    const card = state.getProperty("/selectedCard") as string;
    const newRow = this._toNewRow({
      rowNumber: excluded.rowNumber,
      postedAt: excluded.errorField === "date" ? excluded.editedValue : "",
      amount:
        excluded.errorField === "amount" ? Number(excluded.editedValue) : 0,
      rawDescription: excluded.rawJoined,
      cardInstance_ID: card,
      cardholderName: null,
      dedupOutcome: DEDUP_OUTCOME.NEW,
      matchedTransactionId: null,
    });
    const remaining = (state.getProperty("/excludedRows") as ExcludedEditRow[]).filter(
      row => row.rowNumber !== excluded.rowNumber,
    );
    state.setProperty("/newRows", [
      ...(state.getProperty("/newRows") as NewRow[]),
      newRow,
    ]);
    state.setProperty("/excludedRows", remaining);
    this._refreshNewRows();
  }

  /**
   * Propagates a row's categorization to still-uncleared rows with the same
   * description, matching the Clear-propagation behaviour.
   * @param source the row whose categorization is propagated
   */
  private _applyCategorization(source: NewRow): void {
    if (!this._isCategorized(source)) {
      return;
    }
    (this._getState().getProperty("/newRows") as NewRow[])
      .filter(
        row =>
          !row.cleared &&
          row !== source &&
          row.rawDescription === source.rawDescription &&
          !this._isCategorized(row),
      )
      .forEach(row => {
        row.vendor_ID = source.vendor_ID;
        row.purchaseType_ID = source.purchaseType_ID;
        row.earningCategory_ID = source.earningCategory_ID;
      });
  }

  /**
   * Reads the FileReader text of one file into a ParsedFile.
   * @param file the file to read
   * @returns the file name and its text content
   */
  private _readFile(file: File): Promise<ParsedFile> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () =>
        resolve({ name: file.name, content: String(reader.result ?? "") });
      reader.onerror = () => reject(new Error("read failed"));
      reader.readAsText(file);
    });
  }

  /**
   * Recomputes counts, cleared totals, and the progress percentage after any
   * change to the review buckets, then refreshes the bound model.
   */
  private _refreshNewRows(): void {
    const state = this._getState();
    const newRows = state.getProperty("/newRows") as NewRow[];
    const cleared = newRows.filter(row => row.cleared);
    const total = cleared.reduce((sum, row) => sum + Number(row.amount), 0);
    state.setProperty("/newCount", newRows.length);
    state.setProperty("/clearedCount", cleared.length);
    state.setProperty("/totalAmount", Math.round(total * 100) / 100);
    state.setProperty(
      "/duplicateCount",
      (state.getProperty("/duplicateRows") as DuplicateRow[]).length,
    );
    state.setProperty(
      "/excludedCount",
      (state.getProperty("/excludedRows") as ExcludedEditRow[]).length,
    );
    state.setProperty(
      "/progressPercent",
      newRows.length ? (cleared.length / newRows.length) * PERCENT_MAX : 0,
    );
    state.refresh(true);
  }

  /**
   * Records the user's decision on the potential duplicate under the event.
   * @param event the press event from a duplicate action button
   * @param decision the decision to record ("skip" or "import")
   */
  private _setDuplicateDecision(event: Button$PressEvent, decision: string): void {
    const context = this._getRowContext(event);
    (context.getObject() as DuplicateRow).decision = decision;
    this._getState().refresh(true);
  }

  /**
   * Renders the post-import summary and completes the wizard.
   * @param summary the summary returned by the save action
   */
  private _showSummary(summary: ImportSummary): void {
    this._getState().setProperty("/summary", summary);
    this._messages.showToast("msgImportComplete");
  }

  /**
   * Maps a classified row to a New-tab row with empty categorization.
   * @param row the classified row from the parse result
   * @returns the New-tab row
   */
  private _toNewRow(row: ClassifiedRow): NewRow {
    return {
      ...row,
      vendor_ID: null,
      purchaseType_ID: null,
      earningCategory_ID: null,
      cleared: false,
    };
  }

  /**
   * Maps an excluded row to an editable Excluded-tab row.
   * @param row the excluded row from the parse result
   * @returns the editable excluded row
   */
  private _toExcludedRow(row: ExcludedRow): ExcludedEditRow {
    return {
      ...row,
      editedValue: row.errorValue,
      rawJoined: row.rawCells.join(", "),
    };
  }

  /**
   * Maps a reviewed New row to the save payload shape.
   * @param row the reviewed New row
   * @returns the save-row payload
   */
  private _toSaveRow(row: NewRow): SaveRow {
    return {
      postedAt: row.postedAt,
      amount: Number(row.amount),
      rawDescription: row.rawDescription,
      cardInstance_ID: row.cardInstance_ID,
      vendor_ID: row.vendor_ID,
      purchaseType_ID: row.purchaseType_ID,
      earningCategory_ID: row.earningCategory_ID,
    };
  }

  /**
   * True when the row carries any vendor or category assignment.
   * @param row the New-tab row
   * @returns whether the row has been categorized
   */
  private _isCategorized(row: NewRow): boolean {
    return Boolean(row.vendor_ID || row.purchaseType_ID || row.earningCategory_ID);
  }

  /**
   * Resolves the "ui" model binding context of the row under an event.
   * @param event the row action event
   * @returns the row's binding context
   */
  private _getRowContext(event: Button$PressEvent): Context {
    return event.getSource().getBindingContext("ui") as Context;
  }

  /**
   * Attaches native drag-and-drop listeners to the upload drop zone.
   */
  private _setupDropZone(): void {
    const view = this.getView() as View;
    view.addEventDelegate({
      onAfterRendering: () => {
        const zone = (this.byId(CONTROL_ID.DROP_ZONE) as { getDomRef(): HTMLElement | null }).getDomRef();
        if (!zone || zone.dataset.dropWired === "1") {
          return;
        }
        zone.dataset.dropWired = "1";
        zone.addEventListener("dragover", event => event.preventDefault());
        zone.addEventListener("drop", event => this._onZoneDrop(event));
      },
    });
  }

  /**
   * Handles a native file drop on the drop zone.
   * @param event the browser drop event
   */
  private _onZoneDrop(event: DragEvent): void {
    event.preventDefault();
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      void this._addFiles(Array.from(files));
    }
  }

  /**
   * Returns the UI-state JSON model.
   * @returns the "ui" model
   */
  private _getState(): JSONModel {
    return (this.getView() as View).getModel("ui") as JSONModel;
  }
}
