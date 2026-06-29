import { EncryptionUtility } from "../../../srv/modules/shared/encryptionUtility.js";

/** A valid 256-bit (32-byte) key as 64 hex characters. */
const VALID_KEY = "0".repeat(64);
/** An invalid key — too short to be 32 bytes. */
const SHORT_KEY = "0".repeat(30);
/** A representative sensitive value (not a real card number). */
const PLAINTEXT = "4111111111111111";

describe("EncryptionUtility", () => {
  const ORIGINAL_KEY = process.env["ENCRYPTION_KEY"];

  afterEach(() => {
    if (ORIGINAL_KEY === undefined) {
      delete process.env["ENCRYPTION_KEY"];
    } else {
      process.env["ENCRYPTION_KEY"] = ORIGINAL_KEY;
    }
  });

  it("round-trips plaintext through encrypt then decrypt", () => {
    process.env["ENCRYPTION_KEY"] = VALID_KEY;
    const util = new EncryptionUtility();

    const cipher = util.encrypt(PLAINTEXT);

    expect(cipher).not.toContain(PLAINTEXT);
    expect(cipher.split(":")).toHaveLength(3);
    expect(util.decrypt(cipher)).toBe(PLAINTEXT);
  });

  it("throws when ENCRYPTION_KEY is not set", () => {
    delete process.env["ENCRYPTION_KEY"];
    expect(() => new EncryptionUtility()).toThrow(
      "ENCRYPTION_KEY environment variable is not set",
    );
  });

  it("throws when ENCRYPTION_KEY is the wrong length", () => {
    process.env["ENCRYPTION_KEY"] = SHORT_KEY;
    expect(() => new EncryptionUtility()).toThrow(/32 bytes/);
  });

  it("throws on a malformed encrypted string", () => {
    process.env["ENCRYPTION_KEY"] = VALID_KEY;
    const util = new EncryptionUtility();
    expect(() => util.decrypt("not-a-valid-format")).toThrow(
      "Invalid encrypted format",
    );
  });
});
