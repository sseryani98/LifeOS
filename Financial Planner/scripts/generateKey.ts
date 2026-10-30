import { randomBytes } from "crypto";
import { writeFileSync, readFileSync, existsSync } from "fs";
import { join } from "path";

import { KEY_FILE } from "./constants.js";

/** CLI entry for `npm run generate-key` — the static block runs on load. */
export class KeyGenerator {
  static {
    KeyGenerator.generateKey();
  }

  /**
   * Generates a random 256-bit hex encryption key and writes it to .env.
   * If .env already exists and contains ENCRYPTION_KEY, skips generation.
   */
  static generateKey(): void {
    const envPath = join(process.cwd(), KEY_FILE.ENV_FILE_NAME);
    if (existsSync(envPath)) {
      const content = readFileSync(envPath, "utf8");
      if (
        content.includes("ENCRYPTION_KEY=") &&
        !content.includes("ENCRYPTION_KEY=\n")
      ) {
        console.log("ENCRYPTION_KEY already exists in .env — skipping.");
        return;
      }
    }

    const key = randomBytes(KEY_FILE.KEY_BYTES).toString("hex");
    const envContent = `# Financial Planner — Local Environment
# This file is gitignored. Do not commit.

# AES-256-GCM encryption key (256-bit, hex-encoded)
# Used by EncryptionUtility for card_number_enc, cvv_enc, expiry_date_enc, access_url_enc
ENCRYPTION_KEY=${key}
`;

    writeFileSync(envPath, envContent);
    console.log(`Generated new ENCRYPTION_KEY and wrote to .env`);
  }
}
