/**
 * The export map, the node10 fallback folders and `files` must agree, or a
 * subpath works in this repo (Metro reads `src`) and breaks for a consumer.
 * attw catches a broken map only after a build; this catches it in `npm test`.
 *
 * Every resolver must also land on the same build, `lib/commonjs`: Metro
 * resolves a subpath through its fallback folder's own `package.json` (the
 * nearest one, which has no `exports`), and the root through the export map.
 * A `react-native` field (native: `src`) or a `module` field (the web:
 * `lib/module`) there bundled `core/` twice, so the root's
 * `DeviceAdaptersProvider` and the subpaths' hooks held two different
 * contexts.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(__dirname, "..", "..");
const manifest = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));

const subpaths = Object.keys(manifest.exports)
  .filter((key) => key.startsWith("./") && !key.slice(2).includes("."))
  .map((key) => key.slice(2));

describe("package exports", () => {
  it("ships the config plugin where Expo looks for it", () => {
    expect(manifest.exports["./app.plugin.js"]).toBe("./app.plugin.js");
    expect(manifest.files).toContain("app.plugin.js");
    expect(existsSync(join(root, "app.plugin.js"))).toBe(true);
  });

  it("lists the capability subpaths", () => {
    expect(subpaths).toEqual([
      "info",
      "location",
      "camera",
      "network",
      "battery",
      "keep-awake",
      "orientation",
      "haptics",
      "biometrics",
      "secure-store",
      "sensors",
      "media-picker",
      "media-library",
      "background-location",
      "bluetooth",
      "rfid",
      "scanner",
      "testing",
    ]);
  });

  it("resolves the root to lib/commonjs whether or not exports are read", () => {
    expect(manifest.exports["."].default).toBe("./lib/commonjs/index.js");
    expect(manifest.main).toBe("lib/commonjs/index.js");
    expect(manifest["react-native"]).toBeUndefined();
    expect(manifest.module).toBeUndefined();
    expect(manifest.browser).toBeUndefined();
  });

  it.each(subpaths)("./%s points at its source and build output", (name) => {
    expect(manifest.exports[`./${name}`]).toEqual({
      source: `./src/${name}/index.ts`,
      types: `./lib/typescript/${name}/index.d.ts`,
      default: `./lib/commonjs/${name}/index.js`,
    });
    expect(existsSync(join(root, "src", name, "index.ts"))).toBe(true);
  });

  it.each(subpaths)("./%s has a node10 fallback folder in files", (name) => {
    expect(manifest.files).toContain(name);
    const fallback = JSON.parse(
      readFileSync(join(root, name, "package.json"), "utf8"),
    );
    expect(fallback).toEqual({
      main: `../lib/commonjs/${name}/index.js`,
      types: `../lib/typescript/${name}/index.d.ts`,
      source: `../src/${name}/index.ts`,
    });
  });
});
