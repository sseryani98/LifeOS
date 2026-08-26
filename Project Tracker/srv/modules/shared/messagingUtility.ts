import type { CdsWithI18n, MessageBundle } from "./types.js";

/**
 * Resolves runtime messages through CAP's own message bundle, which loads the
 * same srv/_i18n/messages.properties the framework resolves reject keys from —
 * one loader, one cache, one parse behaviour. Bundle paths resolve from
 * cds.root (the working directory unless a cds command set it), so a process
 * started outside the module root falls back to raw keys.
 */
export class MessagingUtility {
  /**
   * Resolves a runtime message, substituting ordered placeholders. The bundle
   * is asked for the bare template and the substitution stays here: CAP's own
   * replacer consumes every braced token, and the catalogue uses named ones
   * like {workspace} as literal text.
   * @param key Message key in camelCase.dots format.
   * @param params Ordered values substituted into {0}, {1}, ... placeholders.
   * @returns The resolved message, or the key itself when no entry matches.
   */
  static getText(key: string, params?: string[]): string {
    const template = MessagingUtility._resolveBundle()?.at(key);
    if (!template) return key;
    let result = template;
    for (let index = 0; index < (params?.length ?? 0); index++) {
      result = result.split(`{${index}}`).join((params as string[])[index]);
    }
    return result;
  }

  /**
   * Hands back the runtime's message bundle without importing "@sap/cds" at
   * module load: the MCP server sets CDS_TYPESCRIPT before its own dynamic
   * import of the runtime, and a static import here would run ahead of that.
   * @returns The bundle, or undefined when the runtime is not loaded yet.
   */
  private static _resolveBundle(): MessageBundle | undefined {
    const loaded = (globalThis as { cds?: CdsWithI18n }).cds;
    if (loaded?.i18n) return loaded.i18n.messages;
    // Under Jest the modules are CommonJS, so the runtime is loadable here
    // without disturbing any boot ordering.
    if (typeof require === "function") {
      return (require("@sap/cds") as CdsWithI18n).i18n?.messages;
    }
    return undefined;
  }
}
