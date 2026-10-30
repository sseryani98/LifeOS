// Shared type contracts for the shell app.

/**
 * A single side-navigation entry: which component to load, the inner route to
 * navigate to, and the URL hash fragment that deep-links to it.
 */
export interface NavEntry {
  component: string;
  route: string;
  hash: string;
}
