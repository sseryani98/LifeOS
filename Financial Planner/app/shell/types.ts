/**
 * A single side-navigation entry: which component to load, the inner route to
 * navigate to, the URL hash fragment that deep-links to it, the entity set its
 * record hashes start with (FE lists only), and the i18n key of the page name.
 */
export interface NavEntry {
  component: string;
  route: string;
  hash: string;
  recordHash?: string;
  label: string;
}
