import { readdirSync, readFileSync } from "fs";
import { join, relative } from "path";

const ROOT_DIR = process.cwd();

/** Event-handler bindings only exist in UI5 views/fragments. */
const SOURCE_DIRS = [join(ROOT_DIR, "app")];

const SKIP_SEGMENTS = new Set(["node_modules", "gen", "dist", "coverage", ".git"]);

/**
 * An opening tag: optional `ns:` prefix + the control class (local) name, up to
 * the first whitespace/`>`/`/`. Comments (`<!--`) and close tags (`</`) don't
 * start with a letter after `<`, so they never match.
 */
const OPEN_TAG = /<(?:[A-Za-z][\w.]*:)?([A-Za-z]\w*)(?=[\s/>])/g;

/**
 * An event-handler attribute: `event=".methodName"`. A bare `.method` value is
 * always a handler reference — property bindings start with `{`, formatter refs
 * live inside `{…}`, so this never collides with them.
 */
const HANDLER_ATTR = /(\b[A-Za-z]\w*)\s*=\s*"(\.[A-Za-z_$][\w$]*)"/g;

interface Violation {
  filePath: string;
  line: number;
  control: string;
  event: string;
  handler: string;
  expected: string;
}

function collectXmlFiles(dir: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_SEGMENTS.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      found.push(...collectXmlFiles(full));
    } else if (entry.name.endsWith(".xml")) {
      found.push(full);
    }
  }
  return found;
}

/**
 * Locates the control that owns an attribute — the nearest opening tag before
 * the attribute's position (no `<` appears between a tag and its attributes).
 * @param tags opening tags with their positions, in document order
 * @param position character offset of the handler attribute
 * @returns the owning control's local name, or null if none precedes it
 */
function ownerControl(
  tags: Array<{ name: string; index: number }>,
  position: number,
): string | null {
  let owner: string | null = null;
  for (const tag of tags) {
    if (tag.index < position) owner = tag.name;
    else break;
  }
  return owner;
}

function scanFile(filePath: string): Violation[] {
  const content = readFileSync(filePath, "utf8");
  const tags = [...content.matchAll(OPEN_TAG)].map(match => ({
    name: match[1],
    index: match.index ?? 0,
  }));

  const violations: Violation[] = [];
  for (const match of content.matchAll(HANDLER_ATTR)) {
    const event = match[1];
    const handler = match[2].slice(1);
    const control = ownerControl(tags, match.index ?? 0);
    if (!control) continue;

    const suffix = event.charAt(0).toUpperCase() + event.slice(1);
    const shape = new RegExp(`^on.*?${control}.*?${suffix}$`);
    if (shape.test(handler)) continue;

    violations.push({
      filePath: relative(ROOT_DIR, filePath),
      line: content.slice(0, match.index).split(/\r?\n/).length,
      control,
      event,
      handler,
      expected: `on…${control}…${suffix}`,
    });
  }
  return violations;
}

function main(): void {
  const files = SOURCE_DIRS.flatMap(collectXmlFiles);
  const violations = files.flatMap(scanFile);

  console.log(`Scanning ${files.length} UI5 view(s) for event-handler naming...`);

  if (violations.length === 0) {
    console.log("All event handlers match the on{ControlName}…{EventName} shape.");
    process.exit(0);
  }

  console.log();
  for (const violation of violations) {
    console.log(
      `${violation.filePath}:${violation.line}  "${violation.handler}"  ` +
        `(${violation.control}.${violation.event})  →  expected ${violation.expected}`,
    );
  }
  console.log(
    `\nFound ${violations.length} misnamed event handler(s). Names must include ` +
      `the control class and end with the capitalised event, per the ui5plugin ` +
      `TagAttributeLinter (e.g. a Button press → onButtonSyncNowPress). The ` +
      `meaning-prefix (onCardInstances…) is enforced in-editor by the plugin.`,
  );
  process.exit(1);
}

main();
