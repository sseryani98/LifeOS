/**
 * A single side-navigation entry: which component to load, the inner route to
 * navigate to, the URL hash fragment that deep-links to it, and the i18n key
 * of the page name the shell header shows.
 */
export interface NavEntry {
  component: string;
  route: string;
  hash: string;
  label: string;
}
