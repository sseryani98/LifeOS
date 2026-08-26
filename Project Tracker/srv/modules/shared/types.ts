/** The one method of CAP's message bundle the messaging utility reads. */
export interface MessageBundle {
  at(key: string): string | undefined;
}

/** The slice of the CAP runtime that carries the i18n bundles. */
export interface CdsWithI18n {
  i18n?: { messages: MessageBundle };
}
