import type cds from "@sap/cds";

/** A request double that records what a validator accumulated on it. */
export interface RequestDouble {
  request: cds.Request;
  errors: { code?: string; target?: string }[];
}

/**
 * Builds a request double carrying a payload and an error spy, which is all a
 * validator ever touches.
 * @param data The payload the request carries.
 * @param event The event name, for the guards that branch on it.
 * @returns The double and the errors it accumulated.
 */
export function buildRequestDouble(
  data: unknown,
  event = "CREATE",
): RequestDouble {
  const errors: { code?: string; target?: string }[] = [];
  const request = {
    data,
    event,
    error: (detail: { code?: string; target?: string }) => {
      errors.push(detail);
    },
  } as unknown as cds.Request;
  return { request, errors };
}
