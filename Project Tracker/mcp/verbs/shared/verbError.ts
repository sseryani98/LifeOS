/**
 * A rejection a verb raises deliberately. It carries the status the caller sees
 * and the i18n key it was rejected under, so the envelope can be built from the
 * throw site rather than reconstructed from a message.
 */
export class VerbError extends Error {
  readonly status: number;
  readonly code: string;
  readonly target?: string;
  readonly remediation?: string;
  readonly rule?: string;

  /**
   * Creates a rejection.
   * @param status HTTP status the caller sees.
   * @param code Runtime message key the rejection is raised under.
   * @param message Resolved, human-readable message.
   * @param detail Optional target, remediation and the guard rule that fired.
   */
  constructor(
    status: number,
    code: string,
    message: string,
    detail?: { target?: string; remediation?: string; rule?: string },
  ) {
    super(message);
    this.name = "VerbError";
    this.status = status;
    this.code = code;
    this.target = detail?.target;
    this.remediation = detail?.remediation;
    this.rule = detail?.rule;
  }
}
