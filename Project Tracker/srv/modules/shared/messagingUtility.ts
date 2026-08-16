import { readFileSync } from "fs";
import { join } from "path";

/** Path to the runtime messages properties file. */
const MESSAGES_PATH = join(
  process.cwd(),
  "srv",
  "_i18n",
  "messages.properties",
);

/** Reads runtime messages from the module's i18n folder. */
export class MessagingUtility {
  private static messages: Map<string, string> | null = null;

  /**
   * Resolves a runtime message, substituting ordered placeholders.
   * @param key Message key in camelCase.dots format.
   * @param params Ordered values substituted into {0}, {1}, ... placeholders.
   * @returns The resolved message, or the key itself when no entry matches.
   */
  static getText(key: string, params?: string[]): string {
    const template = MessagingUtility._loadMessages().get(key);
    if (!template) return key;
    if (!params || params.length === 0) return template;
    let result = template;
    for (let index = 0; index < params.length; index++) {
      result = result.split(`{${index}}`).join(params[index]);
    }
    return result;
  }

  /**
   * Loads and caches the properties file.
   * @returns The key-to-message map, empty when the file is absent.
   */
  private static _loadMessages(): Map<string, string> {
    if (MessagingUtility.messages) return MessagingUtility.messages;
    const messages = new Map<string, string>();
    try {
      const content = readFileSync(MESSAGES_PATH, "utf8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const separator = trimmed.indexOf("=");
        if (separator < 1) continue;
        messages.set(
          trimmed.slice(0, separator).trim(),
          trimmed.slice(separator + 1).trim(),
        );
      }
    } catch {
      // An absent file is a deployment fault, not a request fault: getText then
      // returns the key, which is still a usable identifier for the caller.
    }
    MessagingUtility.messages = messages;
    return messages;
  }
}
