import { CsvImportValidator } from "../../../../srv/modules/ingestion/csvImportValidator.js";

import {
  REQUEST_EMPTY_CONTENT,
  REQUEST_MISSING_CARD,
  REQUEST_MISSING_FILE,
  VALID_PARSE_REQUEST,
} from "../../../shared/data/ingestion/csv.js";

describe("CsvImportValidator", () => {
  /** A complete request must pass so the wizard can proceed to review — over-strict validation would block a legitimate import. */
  it("accepts a complete parse request", () => {
    expect(CsvImportValidator.validateParseRequest(VALID_PARSE_REQUEST)).toEqual(
      [],
    );
  });

  /** Without a card there is no issuer to resolve the format config from — the parse cannot proceed. */
  it("flags a missing card", () => {
    expect(
      CsvImportValidator.validateParseRequest(REQUEST_MISSING_CARD),
    ).toContainEqual({ field: "cardInstance_ID", messageKey: "csv.cardRequired" });
  });

  /** The file name anchors the import-log entry; requiring it prevents an unlabelled import history row. */
  it("flags a missing file name", () => {
    expect(
      CsvImportValidator.validateParseRequest(REQUEST_MISSING_FILE),
    ).toContainEqual({ field: "fileName", messageKey: "csv.fileRequired" });
  });

  /** A whitespace-only body is effectively an empty/unreadable file and must abort the import rather than parse to zero rows silently. */
  it("flags empty file content", () => {
    expect(
      CsvImportValidator.validateParseRequest(REQUEST_EMPTY_CONTENT),
    ).toContainEqual({ field: "fileContent", messageKey: "csv.fileEmpty" });
  });

  /** Errors must accumulate so the user fixes every problem in one pass instead of one at a time. */
  it("accumulates all errors when the request is entirely empty", () => {
    const errors = CsvImportValidator.validateParseRequest({
      cardInstance_ID: null,
      fileName: null,
      fileContent: null,
    });
    expect(errors).toHaveLength(3);
  });
});
