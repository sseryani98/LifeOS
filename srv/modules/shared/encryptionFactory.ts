// Production factory for the encryption utility. Construction is deferred so
// ENCRYPTION_KEY is only required when a sensitive field is actually read.

import { EncryptionUtility } from "./encryptionUtility.js";
import type { EncryptionFactory } from "./types.js";

/**
 * Default factory — builds a real EncryptionUtility on first use.
 * @returns A new EncryptionUtility instance.
 */
export const defaultEncryptionFactory: EncryptionFactory = () =>
  new EncryptionUtility();
