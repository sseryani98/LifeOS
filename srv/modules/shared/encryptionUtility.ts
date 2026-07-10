import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

/** AES-256-GCM storage-format spec — {iv}:{authTag}:{ciphertext}, hex-encoded. */
const ENCRYPTION = {
  ALGORITHM: "aes-256-gcm",
  IV_LENGTH: 12,
  AUTH_TAG_LENGTH: 16,
  KEY_LENGTH: 32,
  SEPARATOR: ":",
  ENCRYPTED_PARTS: 3,
} as const;

/**
 * AES-256-GCM encryption utility for sensitive fields.
 * Storage format: {iv}:{authTag}:{ciphertext} (all hex-encoded).
 * Key sourced from ENCRYPTION_KEY environment variable.
 */
export class EncryptionUtility {
  private readonly key: Buffer;

  /** Creates an EncryptionUtility instance, validating the encryption key. */
  constructor() {
    const keyHex = process.env["ENCRYPTION_KEY"];
    if (!keyHex) {
      throw new Error("ENCRYPTION_KEY environment variable is not set");
    }
    this.key = Buffer.from(keyHex, "hex");
    if (this.key.length !== ENCRYPTION.KEY_LENGTH) {
      throw new Error(
        `ENCRYPTION_KEY must be ${ENCRYPTION.KEY_LENGTH} bytes (${ENCRYPTION.KEY_LENGTH * 2} hex characters)`,
      );
    }
  }

  /**
   * Encrypts plaintext using AES-256-GCM.
   * Returns format: {iv}:{authTag}:{ciphertext} (hex-encoded).
   * @param plaintext The sensitive value to encrypt.
   * @returns The hex-encoded iv:authTag:ciphertext storage string.
   */
  encrypt(plaintext: string): string {
    const initVector = randomBytes(ENCRYPTION.IV_LENGTH);
    const cipher = createCipheriv(ENCRYPTION.ALGORITHM, this.key, initVector, {
      authTagLength: ENCRYPTION.AUTH_TAG_LENGTH,
    });
    const encrypted = Buffer.concat([
      cipher.update(plaintext, "utf-8"),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();
    return [
      initVector.toString("hex"),
      authTag.toString("hex"),
      encrypted.toString("hex"),
    ].join(ENCRYPTION.SEPARATOR);
  }

  /**
   * Decrypts a stored encrypted string back to plaintext.
   * Expects format: {iv}:{authTag}:{ciphertext} (hex-encoded).
   * @param stored The hex-encoded iv:authTag:ciphertext string produced by encrypt.
   * @returns The recovered plaintext value.
   */
  decrypt(stored: string): string {
    const parts = stored.split(ENCRYPTION.SEPARATOR);
    if (parts.length !== ENCRYPTION.ENCRYPTED_PARTS) {
      throw new Error(
        "Invalid encrypted format — expected iv:authTag:ciphertext",
      );
    }
    const initVector = Buffer.from(parts[0], "hex");
    const authTag = Buffer.from(parts[1], "hex");
    const ciphertext = Buffer.from(parts[2], "hex");
    const decipher = createDecipheriv(ENCRYPTION.ALGORITHM, this.key, initVector, {
      authTagLength: ENCRYPTION.AUTH_TAG_LENGTH,
    });
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);
    return decrypted.toString("utf-8");
  }
}
