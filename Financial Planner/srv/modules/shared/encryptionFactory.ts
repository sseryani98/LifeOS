import { EncryptionUtility } from "./encryptionUtility.js";

/**
 * Production factory for the encryption utility. Construction is deferred so
 * ENCRYPTION_KEY is only required when a sensitive field is actually read.
 */
export class DefaultEncryptionFactory {
  /**
   * Builds a real EncryptionUtility on first use.
   * @returns A new EncryptionUtility instance.
   */
  static createEncryptionUtility(): EncryptionUtility {
    return new EncryptionUtility();
  }
}
