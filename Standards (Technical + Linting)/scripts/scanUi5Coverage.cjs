// ui5-test-runner remote coverage scanner (`coverageRemoteScanner` in a module's
// ui5-test-runner.json). The runner's default scanner walks a UI5 directory listing, which
// cds-serve never renders, so files no test loads would drop out of the denominator and the
// UI5 thresholds would pass on partial coverage. This walks every app under cwd's app/ on
// disk instead and hands the runner each source as served (instrumented) by its mountPath.

const { existsSync, readdirSync, readFileSync, statSync } = require("fs");
const { join, relative, sep } = require("path");

class Ui5CoverageScanner {
  /**
   * Feeds the runner one served module per TypeScript source of every UI5 app under app/.
   * @param origin the server origin the runner tests against
   * @param onFolder runner callback, told how many entries the next scan step holds
   * @param onFile runner callback, given a file URL and its served source
   */
  static async scanApps(origin, onFolder, onFile) {
    const appRoot = join(process.cwd(), "app");
    if (!existsSync(appRoot)) {
      return;
    }
    const apps = readdirSync(appRoot)
      .map(name => join(appRoot, name))
      .filter(dir => existsSync(join(dir, "ui5.yaml")));
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
