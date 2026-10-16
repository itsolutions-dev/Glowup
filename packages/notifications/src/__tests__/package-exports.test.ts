/**
 * Every resolver must land on one build, `lib/commonjs`. Metro resolves
 * `/testing` through its node10 fallback folder's own `package.json` (the
 * nearest one, which has no `exports`), and the root through the export map:
 * a `react-native` field (native: `src`) or a `module` field (the web:
 * `lib/module`) in either bundles the package twice, and `/testing`'s
 * `resetSeenResponses` would clear a copy the root's hooks never read.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(__dirname, "..", "..");
const read = (path: string) =>
  JSON.parse(readFileSync(join(root, path), "utf8"));
const manifest = read("package.json");

describe("package exports", () => {
  it("resolves the root to lib/commonjs whether or not exports are read", () => {
    expect(manifest.exports["."].default).toBe("./lib/commonjs/index.js");
    expect(manifest.main).toBe("lib/commonjs/index.js");
    expect(manifest["react-native"]).toBeUndefined();
    expect(manifest.module).toBeUndefined();
    expect(manifest.browser).toBeUndefined();
  });

  it("resolves /testing to lib/commonjs through either path", () => {
    expect(manifest.exports["./testing"]).toEqual({
      source: "./src/testing/index.ts",
      types: "./lib/typescript/testing/index.d.ts",
      default: "./lib/commonjs/testing/index.js",
    });
    expect(manifest.files).toContain("testing");
    expect(read("testing/package.json")).toEqual({
      main: "../lib/commonjs/testing/index.js",
      types: "../lib/typescript/testing/index.d.ts",
      source: "../src/testing/index.ts",
    });
  });
});
