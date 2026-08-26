import type cds from "@sap/cds";

/** A request double that records what a validator or guard put on it. */
export interface RequestDouble {
  request: cds.Request;
  errors: { code?: string; target?: string }[];
  rejections: { status: number; key: string }[];
}

/**
 * Builds a request double carrying a payload, an error spy and a reject spy -
 * a validator accumulates errors, a write guard rejects outright.
 * @param data The payload the request carries.
 * @param event The event name, for the guards that branch on it.
 * @returns The double and what it accumulated.
 */
export function buildRequestDouble(
  data: unknown,
  event = "CREATE",
): RequestDouble {
  const errors: { code?: string; target?: string }[] = [];
  const rejections: { status: number; key: string }[] = [];
  const request = {
    data,
    event,
    error: (detail: { code?: string; target?: string }) => {
      errors.push(detail);
    },
    reject: (status: number, key: string) => {
      rejections.push({ status, key });
    },
  } as unknown as cds.Request;
  return { request, errors, rejections };
}
