import { randomUUID } from "crypto";
import { appendFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

import cds from "@sap/cds";

import type { LogType } from "./types.js";

/** Fields that must be redacted before DEBUG-level logging. */
const SENSITIVE_FIELDS = [
  "card_number_enc",
  "cvv_enc",
  "expiry_date_enc",
  "access_url_enc",
  "password",
  "token",
];

/** Directory for log file output. */
const LOG_DIR = join(process.cwd(), "logs");

/** Path to the application log file. */
const APP_LOG = join(LOG_DIR, "app.log");

/** Path to the error-only log file. */
const ERROR_LOG = join(LOG_DIR, "error.log");

/**
 * Structured JSON logger with dual file output and correlation ID tracking.
 * Wraps cds.log() with additional structured context.
 */
export class Logger {
  private readonly moduleName: string;
  private readonly cdsLogger: ReturnType<typeof cds.log>;
  private correlationId: string;

  /**
   * Creates a logger for the given module namespace.
   * @param moduleName - Namespace tagged on every entry and passed to cds.log
   */
  constructor(moduleName: string) {
    this.moduleName = moduleName;
    this.cdsLogger = cds.log(moduleName);
    this.correlationId = randomUUID();
    this._ensureLogDir();
  }

  /**
   * Sets the correlation ID from a CDS request.
   * @param requestId - Request-scoped ID that ties log entries to one request
   */
  setCorrelationId(requestId: string): void {
    this.correlationId = requestId;
  }

  /**
   * Logs an INFO-level structured entry.
   * @param type - Category of the log event
   * @param message - Human-readable description of the event
   * @param data - Optional structured context to attach to the entry
   */
  info(type: LogType, message: string, data?: Record<string, unknown>): void {
    const entry = this._createEntry("INFO", type, message, data);
    this.cdsLogger.info(JSON.stringify(entry));
    this._writeToFile(APP_LOG, entry);
  }

  /**
   * Logs a WARN-level structured entry.
   * @param type - Category of the log event
   * @param message - Human-readable description of the event
   * @param data - Optional structured context to attach to the entry
   */
  warn(type: LogType, message: string, data?: Record<string, unknown>): void {
    const entry = this._createEntry("WARN", type, message, data);
    this.cdsLogger.warn(JSON.stringify(entry));
    this._writeToFile(APP_LOG, entry);
  }

  /**
   * Logs an ERROR-level structured entry to both app.log and error.log.
   * @param type - Category of the log event
   * @param message - Human-readable description of the event
   * @param data - Optional structured context to attach to the entry
   */
  error(type: LogType, message: string, data?: Record<string, unknown>): void {
    const entry = this._createEntry("ERROR", type, message, data);
    this.cdsLogger.error(JSON.stringify(entry));
    this._writeToFile(APP_LOG, entry);
    this._writeToFile(ERROR_LOG, entry);
  }

  /**
   * Logs a DEBUG-level structured entry. Data is redacted before output.
   * @param type - Category of the log event
   * @param message - Human-readable description of the event
   * @param data - Optional structured context, redacted before it is written
   */
  debug(type: LogType, message: string, data?: Record<string, unknown>): void {
    const redactedData = data ? this._redact(data) : undefined;
    const entry = this._createEntry("DEBUG", type, message, redactedData);
    this.cdsLogger.debug(JSON.stringify(entry));
    this._writeToFile(APP_LOG, entry);
  }

  /**
   * Creates a structured log entry object.
   * @param level - Severity label (INFO, WARN, ERROR, DEBUG)
   * @param type - Category of the log event
   * @param message - Human-readable description of the event
   * @param data - Optional structured context to attach to the entry
   * @returns The assembled log entry with timestamp and correlation metadata
   */
  private _createEntry(
    level: string,
    type: LogType,
    message: string,
    data?: Record<string, unknown>,
  ): Record<string, unknown> {
    const entry: Record<string, unknown> = {
      timestamp: new Date().toISOString(),
      level,
      type,
      module: this.moduleName,
      correlationId: this.correlationId,
      message,
    };
    if (data) {
      entry["data"] = data;
    }
    return entry;
  }

  /**
   * Redacts sensitive fields from data before logging.
   * Replaces values of sensitive keys with '[REDACTED]'.
   * @param data - Structured context that may contain sensitive keys
   * @returns A deep copy with sensitive values replaced by '[REDACTED]'
   */
  private _redact(data: Record<string, unknown>): Record<string, unknown> {
    const redacted: Record<string, unknown> = {};
    for (const key of Object.keys(data)) {
      if (SENSITIVE_FIELDS.includes(key.toLowerCase())) {
        redacted[key] = "[REDACTED]";
      } else if (typeof data[key] === "object" && data[key] !== null) {
        redacted[key] = this._redact(data[key] as Record<string, unknown>);
      } else {
        redacted[key] = data[key];
      }
    }
    return redacted;
  }

  /** Ensures the logs directory exists. */
  private _ensureLogDir(): void {
    if (!existsSync(LOG_DIR)) {
      mkdirSync(LOG_DIR, { recursive: true });
    }
  }

  /**
   * Appends a JSON log entry to a file.
   * @param filePath - Absolute path of the log file to append to
   * @param entry - The structured log entry to serialize and write
   */
  private _writeToFile(filePath: string, entry: Record<string, unknown>): void {
    try {
      appendFileSync(filePath, `${JSON.stringify(entry)}\n`, "utf-8");
    } catch {
      // Silently fail file writes — console output via cds.log is primary
    }
  }
}
