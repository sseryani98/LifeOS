import BaseController from "com/financialplanner/shared/BaseController";
import CsvImportWizardService from "com/financialplanner/csvimportwizard/model/CsvImportWizardService";
import ReviewState from "com/financialplanner/csvimportwizard/model/ReviewState";
import DialogManager from "com/lifeos/shared/DialogManager";
import Messaging from "com/lifeos/shared/Messaging";
import {
  CONTROL_ID,
  CREATE_DIALOG,
  CREATE_DIALOG_FRAGMENT,
  DUPLICATE_DECISION,
} from "com/financialplanner/csvimportwizard/model/constants";
import type { Button$PressEvent } from "sap/m/Button";
import type Table from "sap/m/Table";
import type Wizard from "sap/m/Wizard";
import type View from "sap/ui/core/mvc/View";
import type UIComponent from "sap/ui/core/UIComponent";
import type Context from "sap/ui/model/Context";
import type JSONModel from "sap/ui/model/json/JSONModel";
import type ODataModel from "sap/ui/model/odata/v4/ODataModel";
import type { FileUploader$ChangeEvent } from "sap/ui/unified/FileUploader";
import type {
  ClassifiedRow,
  DuplicateRow,
  ExcludedEditRow,
  ImportSummary,
  NewRow,
  ParsedFile,
} from "com/financialplanner/csvimportwizard/model/types";

/**
 * CSV Import Wizard controller. Drives the three-step flow: upload + card
 * selection, tabbed review (New / Potential Duplicates / Excluded) with batch
 * categorization, and confirm + save. The review buckets themselves live in
 * ReviewState; this controller routes events to it.
 *
 * @namespace com.financialplanner.csvimportwizard.controller
 */
export default class CsvImportWizard extends BaseController {
  private _review!: ReviewState;
  private _service!: CsvImportWizardService;
  private _createEntitySet = "";
  private readonly _dialogs = new DialogManager(this);
  private readonly _messages = new Messaging(this);

  /**
   * Initialises the UI-state model and the data-access service.
   */
  public onInit(): void {
    const view = this.getView() as View;
    const state = ReviewState.buildInitialModel();
    view.setModel(state, "ui");
    const model = (this.getOwnerComponent() as UIComponent).getModel() as ODataModel;
    this._service = new CsvImportWizardService(model);
    this._review = new ReviewState(state, this._service);
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
    this._review.clearRow(this._getRowContext(event).getObject() as NewRow);
  }

  /**
   * Reverts a cleared New-tab row back to editable, restoring the rows its
   * Clear propagated to.
   * @param event the press event from the row's Undo button
   */
  public onButtonUndoRowPress(event: Button$PressEvent): void {
    this._review.restoreRow(this._getRowContext(event).getObject() as NewRow);
  }

  /**
   * Clears every categorized row sharing the pressed row's description.
   * @param event the press event from the row's Clear-Matching button
   */
  public onButtonClearMatchingPress(event: Button$PressEvent): void {
    this._review.clearMatchingRows(this._getRowContext(event).getObject() as NewRow);
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
    this._review.copyCategorization(
      contexts[0].getObject() as NewRow,
      contexts.slice(1).map(context => context.getObject() as NewRow),
    );
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
        this.getModel().refresh();
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
    void this._moveExcludedRow(excluded);
  }

  /**
   * Persists the cleared New rows and imported duplicates, then shows the
   * post-import summary.
   */
  public onButtonSaveImportPress(): void {
    const state = this._getState();
    const rows = this._review.buildSaveRows();
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
   * Reads picked or dropped OS files into the pending upload set. One unreadable
   * file aborts the whole pick, so no partial set lands.
   * @param files the files dropped onto the drop zone
   */
  private async _addFiles(files: File[]): Promise<void> {
    let parsed: ParsedFile[];
    try {
      parsed = await Promise.all(files.map(file => this._readFile(file)));
    } catch {
      this._messages.showError("msgFileUnreadable");
      return;
    }
    const state = this._getState();
    const existing = state.getProperty("/files") as ParsedFile[];
    const merged = [...existing, ...parsed];
    state.setProperty("/files", merged);
    state.setProperty("/fileNames", merged.map(file => file.name).join(", "));
    state.setProperty("/canParse", merged.length > 0);
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
      await this._review.applyParseResult(result);
      this._getState().setProperty("/parsed", true);
      (this.byId(CONTROL_ID.WIZARD) as Wizard).nextStep();
    } catch {
      this._messages.showError("msgParseFailed");
    }
  }

  /**
   * Re-decodes a corrected Excluded row on the server and hands it to the review
   * buckets. A correction that still fails to parse stays in the Excluded tab.
   * @param excluded the corrected excluded row
   */
  private async _moveExcludedRow(excluded: ExcludedEditRow): Promise<void> {
    const state = this._getState();
    const card = state.getProperty("/selectedCard") as string;
    const file = (state.getProperty("/files") as ParsedFile[]).find(
      candidate => candidate.name === excluded.fileName,
    );
    if (!file || excluded.sourceRowNumber === undefined) {
      this._messages.showError("msgCorrectionFailed");
      return;
    }
    let classified: ClassifiedRow;
    try {
      const row = await this._service.reclassifyRow(
        card,
        file,
        excluded.sourceRowNumber,
        excluded.editedValue,
      );
      classified = { ...row, rowNumber: excluded.rowNumber };
    } catch {
      this._messages.showError("msgCorrectionFailed");
      return;
    }
    await this._review.moveCorrectedRow(classified);
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
   * Records the user's decision on the potential duplicate under the event.
   * @param event the press event from a duplicate action button
   * @param decision the decision to record ("skip" or "import")
   */
  private _setDuplicateDecision(event: Button$PressEvent, decision: string): void {
    const row = this._getRowContext(event).getObject() as DuplicateRow;
    this._review.setDuplicateDecision(row, decision);
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
    return this.getModel("ui") as JSONModel;
  }
}
