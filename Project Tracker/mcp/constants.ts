/** What the process needs to know before it can serve anything. */
export const BOOTSTRAP = {
  /** The one CAP service every verb connects to. */
  SERVICE_NAME: "TrackerService",
  /** CAP's primary datasource, which has to be connected before anything is served. */
  DATABASE_SERVICE: "db",
  /** Where the calling agent declares who it is. */
  ACTOR_VARIABLE: "PROJECT_TRACKER_ACTOR",
  /**
   * Logged once the transport is live. The stdout-purity test
   * (test/protocol/tests/stdoutGuard.test.ts) asserts this exact line lands on
   * stderr, which is what makes the redirection in server.ts load-bearing.
   */
  READY_MESSAGE: "project tracker verb server ready",
  /**
   * Server identity advertised to a client. The version tracks package.json;
   * test/protocol/tests/toolSurface.test.ts asserts the two have not drifted,
   * because nothing else would ever notice.
   */
  SERVER_INFO: { name: "project-tracker", version: "0.0.1" },
  /**
   * Returned in the initialize result, which is the only place a client is told
   * how the server as a whole works rather than what one tool does. It carries
   * the premise the eleven tools cannot state individually: they are not a
   * convenience over the store, they are the only way into it.
   */
  INSTRUCTIONS: [
    "This server is the only write path into Project Tracker's project state.",
    "There is no query, CRUD or raw-SQL tool, and none will be added: the",
    "eleven verbs are what enforce the methodology, so a bypass would make",
    "them advisory.",
    "",
    "Read with next_action or project_view before writing. next_action answers",
    "what to do next; project_view answers a whole workspace in one call.",
    "",
    "Stories are addressed as {workspace-slug}/{story-id} — a bare story id is",
    "refused rather than guessed at. Stages are addressed by their code.",
    "",
    "A refused call is an answer, not a fault: it carries a status, a message",
    "and often a remediation naming the verb to call first. Act on it rather",
    "than retrying the same call.",
  ].join("\n"),
} as const;
