import { readFileSync } from "fs";
import { join } from "path";

/** Path to the runtime messages properties file. */
const MESSAGES_PATH = join(
  process.cwd(),
  "srv",
  "_i18n",
  "messages.properties",
);

/**
 * Utility for retrieving i18n runtime messages.
 * Reads from srv/_i18n/messages.properties (camelCase.dots key format).
 */
export class MessagingUtility {
  private static messages: Map<string, string> | null = null;

  /**
   * Retrieves a localized message by key, with optional parameter substitution.
   * Parameters replace {0}, {1}, etc. placeholders in the message template.
   * @param key Message key in camelCase.dots format.
   * @param params Ordered values substituted into {0}, {1}, ... placeholders.
   * @returns The resolved message, or the key itself when no matching entry exists.
   */
  static getText(key: string, params?: string[]): string {
    const messages = MessagingUtility._loadMessages();
    const template = messages.get(key);
    if (!template) {
      return key;
    }
    if (!params || params.length === 0) {
      return template;
    }
    let result = template;
    for (let index = 0; index < params.length; index++) {
      result = result.replace(`{${index}}`, params[index]);
    }
    return result;
  }

  /**
   * Loads and caches messages from the properties file.
   * Parses key=value pairs, ignoring comments and blank lines.
   * @returns The cached key-to-message map (empty if the file is absent).
   */
  private static _loadMessages(): Map<string, string> {
    if (MessagingUtility.messages) {
      return MessagingUtility.messages;
    }
    MessagingUtility.messages = new Map();
    try {
      const content = readFileSync(MESSAGES_PATH, "utf-8");
      const lines = content.split("\n");
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#")) {
          const separatorIndex = trimmed.indexOf("=");
          if (separatorIndex > 0) {
            const messageKey = trimmed.substring(0, separatorIndex).trim();
            const messageValue = trimmed.substring(separatorIndex + 1).trim();
            MessagingUtility.messages.set(messageKey, messageValue);
          }
        }
      }
    } catch {
      // File not found — return empty map, keys will be returned as-is
    }
    return MessagingUtility.messages;
  }
}
