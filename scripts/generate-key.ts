import { randomBytes } from 'crypto';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

const ENV_PATH = join(process.cwd(), '.env');
const KEY_BYTES = 32; // 256 bits

/**
 * Generates a random 256-bit hex encryption key and writes it to .env.
 * If .env already exists and contains ENCRYPTION_KEY, skips generation.
 */
function generateKey(): void {
  if (existsSync(ENV_PATH)) {
    const content = readFileSync(ENV_PATH, 'utf8');
    if (content.includes('ENCRYPTION_KEY=') && !content.includes('ENCRYPTION_KEY=\n')) {
      console.log('ENCRYPTION_KEY already exists in .env — skipping.');
      return;
    }
  }

  const key = randomBytes(KEY_BYTES).toString('hex');
  const envContent = `# Financial Planner — Local Environment
# This file is gitignored. Do not commit.

# AES-256-GCM encryption key (256-bit, hex-encoded)
# Used by EncryptionUtility for card_number_enc, cvv_enc, expiry_date_enc, access_url_enc
ENCRYPTION_KEY=${key}
`;

  writeFileSync(ENV_PATH, envContent);
  console.log(`Generated new ENCRYPTION_KEY and wrote to .env`);
}

generateKey();
