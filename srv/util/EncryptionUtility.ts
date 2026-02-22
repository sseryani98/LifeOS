import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

/** Encryption algorithm — AES-256-GCM (authenticated encryption). */
const ALGORITHM = 'aes-256-gcm';

/** IV length in bytes for AES-GCM. */
const IV_LENGTH = 12;

/** Authentication tag length in bytes. */
const AUTH_TAG_LENGTH = 16;

/** Required key length in bytes (256 bits). */
const KEY_LENGTH = 32;

/** Separator between IV, auth tag, and ciphertext in stored format. */
const SEPARATOR = ':';

/** Number of parts in the encrypted string format (iv:authTag:ciphertext). */
const ENCRYPTED_PARTS = 3;

/**
 * AES-256-GCM encryption utility for sensitive fields.
 * Storage format: {iv}:{authTag}:{ciphertext} (all hex-encoded).
 * Key sourced from ENCRYPTION_KEY environment variable.
 */
export class EncryptionUtility {
  private readonly key: Buffer;

  /** Creates an EncryptionUtility instance, validating the encryption key. */
  constructor() {
    const keyHex = process.env['ENCRYPTION_KEY'];
    if (!keyHex) {
      throw new Error('ENCRYPTION_KEY environment variable is not set');
    }
    this.key = Buffer.from(keyHex, 'hex');
    if (this.key.length !== KEY_LENGTH) {
      throw new Error(`ENCRYPTION_KEY must be ${KEY_LENGTH} bytes (${KEY_LENGTH * 2} hex characters)`);
    }
  }

  /**
   * Encrypts plaintext using AES-256-GCM.
   * Returns format: {iv}:{authTag}:{ciphertext} (hex-encoded).
   */
  encrypt(plaintext: string): string {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, this.key, iv, { authTagLength: AUTH_TAG_LENGTH });
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf-8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return [iv.toString('hex'), authTag.toString('hex'), encrypted.toString('hex')].join(SEPARATOR);
  }

  /**
   * Decrypts a stored encrypted string back to plaintext.
   * Expects format: {iv}:{authTag}:{ciphertext} (hex-encoded).
   */
  decrypt(stored: string): string {
    const parts = stored.split(SEPARATOR);
    if (parts.length !== ENCRYPTED_PARTS) {
      throw new Error('Invalid encrypted format — expected iv:authTag:ciphertext');
    }
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const ciphertext = Buffer.from(parts[2], 'hex');
    const decipher = createDecipheriv(ALGORITHM, this.key, iv, { authTagLength: AUTH_TAG_LENGTH });
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return decrypted.toString('utf-8');
  }
}
