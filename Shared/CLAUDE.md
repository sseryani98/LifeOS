# Life OS — Shared Library

Runtime code more than one module runs. Not a module: no CDS model, no database, no process of its
own. The shared standards (`Standards (Documents)/CODING_STANDARDS.md`) apply in full.

## Layout

```text
Shared/
  package.json      `lifeos-shared` — a module lists it in devDependencies
  ui5.yaml          Served by the consuming module's cds-plugin-ui5 at /lifeos-shared
  ui5-test.yaml     Test-run copy: instruments app/ for the consumer's UI5 coverage gate
  tsconfig.json     At the root, not in app/: ui5-tooling-transpile only turns on TypeScript from here
  app/              UI5 helpers, namespace com.lifeos.shared
    DialogManager.ts  Fragment loading, a dialog's model from an event
    Messaging.ts      Toasts and message boxes, by i18n key
    I18n.ts           The one resource-bundle lookup
    test/             QUnit suite, run inside the consuming module's UI5 gate
```

## Consuming it

A module with UI5 apps adds `"lifeos-shared": "*"` to `devDependencies`, maps
`"com.lifeos.shared": "./lifeos-shared/"` in its `index.html` resource roots and every test suite's
loader paths, and points each app `tsconfig.json` at `../../../Shared/app/*`. Financial Planner's
`ui5-test-runner.json` runs this package's suite and its `test:ui5` holds the
`--row "../Shared/app/**:100:100"` threshold; the package has no gate of its own because it has no
server to run one. Instrumentation needs `coverage.cwd` in `ui5-test.yaml` (babel-plugin-istanbul
skips files outside the consumer's folder) and the exclusions in `package.json` `nyc`, not the yaml.
`lint:ui-helpers` keeps dialog and messaging work funnelled through here.

## Not yet here

Financial Planner's `app/shared/` still holds `BaseController`, `BasePageController`, `formatter`,
controls and CSS that Project Tracker's UI also needs (Project Tracker D-147). They move when that UI
is built.
