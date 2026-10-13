/**
 * The export map, the node10 fallback folders and `files` must agree, or a
 * subpath works in this repo (Metro reads `src`) and breaks for a consumer.
 * attw catches a broken map only after a build; this catches it in `npm test`.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(__dirname, "..", "..");
const manifest = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));

const subpaths = Object.keys(manifest.exports)
  .filter((key) => key !== "." && key !== "./package.json")
  .map((key) => key.slice(2));

describe("package exports", () => {
  it("lists the capability subpaths", () => {
    expect(subpaths).toEqual(["info", "location", "camera", "testing"]);
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
      module: `../lib/module/${name}/index.js`,
      types: `../lib/typescript/${name}/index.d.ts`,
      "react-native": `../src/${name}/index.ts`,
      source: `../src/${name}/index.ts`,
    });
  });
});
