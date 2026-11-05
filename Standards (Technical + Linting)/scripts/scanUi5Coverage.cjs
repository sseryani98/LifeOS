// ui5-test-runner remote coverage scanner (`coverageRemoteScanner` in a module's
// ui5-test-runner.json). The runner's default scanner walks a UI5 directory listing, which
// cds-serve never renders, so files no test loads would drop out of the denominator and the
// UI5 thresholds would pass on partial coverage. This walks every app under cwd's app/ on
// disk, plus every UI5 package the module depends on (cds-plugin-ui5 serves those too), and
// hands the runner each source as served (instrumented) by its mountPath.

const { existsSync, readdirSync, readFileSync, realpathSync, statSync } = require("fs");
const { dirname, join, relative, sep } = require("path");

class Ui5CoverageScanner {
  /**
   * Feeds the runner one served module per TypeScript source under app/ plus every UI5 package the module depends on.
   * @param origin the server origin the runner tests against
   * @param onFolder runner callback, told how many entries the next scan step holds
   * @param onFile runner callback, given a file URL and its served source
   */
  static async scanApps(origin, onFolder, onFile) {
    const appRoot = join(process.cwd(), "app");
    const localApps = existsSync(appRoot)
      ? readdirSync(appRoot)
          .map(name => join(appRoot, name))
          .filter(dir => existsSync(join(dir, "ui5.yaml")))
      : [];
    const apps = [...localApps, ...Ui5CoverageScanner._listUi5Dependencies()];
    await onFolder(apps.length);
    for (const appDir of apps) {
      await Ui5CoverageScanner._scanApp(origin, appDir, onFolder, onFile);
    }
  }

  /**
   * Scans one app's served source tree.
   * @param origin the server origin
   * @param appDir the app folder holding ui5.yaml
   * @param onFolder runner folder callback
   * @param onFile runner file callback
   */
  static async _scanApp(origin, appDir, onFolder, onFile) {
    const yaml = readFileSync(join(appDir, "ui5.yaml"), "utf8");
    const mountPath = /mountPath:\s*(\S+)/.exec(yaml)?.[1];
    const webapp = /webapp:\s*"?([^"\s]+)"?/.exec(yaml)?.[1] ?? "webapp";
    const sourceRoot = join(appDir, webapp);
    if (!mountPath || !existsSync(sourceRoot)) {
      return;
    }
    const sources = Ui5CoverageScanner._listSources(sourceRoot);
    await onFolder(sources.length);
    for (const file of sources) {
      const servedPath = relative(sourceRoot, file).split(sep).join("/").replace(/\.ts$/, ".js");
      const url = `${origin}${mountPath.replace(/\/$/, "")}/${servedPath}`;
      await onFile(url, await (await fetch(url)).text());
    }
  }

  /**
   * Lists the module's npm dependencies that are UI5 apps, resolved the way cds-plugin-ui5
   * resolves them, so a shared package's sources count toward the consumer's gate.
   * @returns the real folder of every dependency whose ui5.yaml declares an application
   */
  static _listUi5Dependencies() {
    const pkg = JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf8"));
    const deps = [...Object.keys(pkg.dependencies ?? {}), ...Object.keys(pkg.devDependencies ?? {})];
    return deps.flatMap(dep => {
      let yamlPath;
      try {
        yamlPath = realpathSync(require.resolve(`${dep}/ui5.yaml`, { paths: [process.cwd()] }));
      } catch {
        return [];
      }
      const type = /^type:\s*(\S+)/m.exec(readFileSync(yamlPath, "utf8"))?.[1];
      return type === "application" || type === "component" ? [dirname(yamlPath)] : [];
    });
  }

  /**
   * Lists the TypeScript sources under a folder; tests and declarations never count.
   * @param dir the folder to walk
   * @returns absolute paths of every countable .ts file
   */
  static _listSources(dir) {
    return readdirSync(dir).flatMap(name => {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) {
        return name === "test" || name === "node_modules" ? [] : Ui5CoverageScanner._listSources(path);
      }
      return name.endsWith(".ts") && !name.endsWith(".d.ts") ? [path] : [];
    });
  }
}

module.exports = Ui5CoverageScanner.scanApps;
