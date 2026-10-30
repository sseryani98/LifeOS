/** Where the local encryption key is written, and how long the key is. */
export const KEY_FILE = {
  ENV_FILE_NAME: ".env",
  KEY_BYTES: 32, // 256 bits
} as const;
