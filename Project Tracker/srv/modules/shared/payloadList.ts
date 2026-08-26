/**
 * Normalises a request payload into a list. A statement built with `entries`
 * hands the handler an array even for one row, so a guard reading the object
 * directly would silently pass on every verb-issued write.
 * @param data The payload the request carries.
 * @returns One entry per row being written.
 */
export function toPayloadList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  return data ? [data as T] : [];
}
