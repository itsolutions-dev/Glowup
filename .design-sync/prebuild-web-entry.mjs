// Pre-resolve the RN design system into ONE browser-safe ESM module so the
// design-sync converter's esbuild has no react-native resolution left to do.
// react-native -> react-native-web, web-first extension resolution, JSX in
// .js allowed (expo ships untranspiled JSX), fonts/images inlined.
import * as esbuild from "esbuild";

const rnwAlias = {
  name: "rnw-alias",
  setup(b) {
    b.onResolve({ filter: /^react-native$/ }, (a) =>
      b.resolve("react-native-web", {
        kind: "import-statement",
        resolveDir: a.resolveDir,
      }),
    );
    b.onResolve({ filter: /^react-native\// }, (a) =>
      b.resolve(a.path.replace(/^react-native\//, "react-native-web/dist/"), {
        kind: "import-statement",
        resolveDir: a.resolveDir,
      }),
    );
  },
};

// expo-font's SSR path imports node:async_hooks; unreachable in a browser.
const STUB = [
  "export class AsyncLocalStorage { getStore() {} run(_s, f) { return f(); } }",
  "export default { AsyncLocalStorage };",
].join("\n");

const nodeStubs = {
  name: "node-stubs",
  setup(b) {
    b.onResolve({ filter: /^node:async_hooks$/ }, (a) => ({
      path: a.path,
      namespace: "stub",
    }));
    b.onLoad({ filter: /.*/, namespace: "stub" }, () => ({
      contents: STUB,
      loader: "js",
    }));
  },
};

// expo-modules-core / expo-asset read `process.*` beyond NODE_ENV at module
// scope; the design-preview page has no node globals.
const PROCESS_SHIM = [
  "var process = globalThis.process || (globalThis.process = {",
  '  env: { NODE_ENV: "development" }, platform: "web", browser: true, version: "",',
  '  argv: [], cwd: function () { return "/"; },',
  "  nextTick: function (f) { var a = [].slice.call(arguments, 1);",
  "    Promise.resolve().then(function () { f.apply(null, a); }); },",
  "});",
].join("\n");

const r = await esbuild.build({
  entryPoints: [".design-sync/web-barrel.mjs"],
  outfile: "packages/ui/.design-sync-entry.mjs",
  bundle: true,
  format: "esm",
  platform: "browser",
  target: "es2020",
  external: ["react", "react-dom", "react-dom/client", "react-is"],
  plugins: [rnwAlias, nodeStubs],
  resolveExtensions: [
    ".web.mjs",
    ".web.js",
    ".web.jsx",
    ".web.ts",
    ".web.tsx",
    ".mjs",
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
    ".json",
  ],
  loader: {
    ".js": "jsx",
    ".ttf": "dataurl",
    ".otf": "dataurl",
    ".woff": "dataurl",
    ".woff2": "dataurl",
    ".png": "dataurl",
    ".jpg": "dataurl",
    ".gif": "dataurl",
    ".svg": "dataurl",
  },
  define: { "process.env.NODE_ENV": '"development"', __DEV__: "true" },
  banner: { js: PROCESS_SHIM },
  metafile: true,
  logLevel: "warning",
});
const pkgs = [
  ...new Set(
    Object.keys(r.metafile.inputs)
      .filter((k) => k.includes("node_modules/"))
      .map((k) => {
        const p = k.split("node_modules/").pop().split("/");
        return p[0].startsWith("@") ? p.slice(0, 2).join("/") : p[0];
      }),
  ),
];
console.log("bundled deps:", pkgs.sort().join(", "));
