import type { EncryptionUtility } from "./encryptionUtility.js";

/** Factory for an EncryptionUtility — injectable so construction can be deferred or stubbed. */
export type EncryptionFactory = () => EncryptionUtility;

/** Minimal HTTP response shape — structurally compatible with axios. */
export interface HttpResponse<T> {
  status: number;
  data: T;
}

/** HTTP client abstraction so callers can be tested without network. */
export interface HttpClient {
  get<T>(url: string): Promise<HttpResponse<T>>;
  post<T>(url: string, body?: unknown): Promise<HttpResponse<T>>;
}

/** Async delay, injectable so retry backoff is instant under test. */
export type SleepFn = (ms: number) => Promise<void>;

/** Valid log entry types for structured logging. */
export type LogType =
  | "ENTRY"
  | "EXIT"
  | "EXTERNAL_CALL"
  | "STATE_CHANGE"
  | "BATCH_RESULT"
  | "ERROR";
