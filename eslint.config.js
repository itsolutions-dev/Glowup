const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");
const eslintPluginPrettierRecommended = require("eslint-plugin-prettier/recommended");

module.exports = defineConfig([
  expoConfig,
  eslintPluginPrettierRecommended,
  {
    // Build output, not source. `bob build` writes packages/ui/lib and CI runs it
    // before the lint step, so without these the linter reports thousands of
    // errors in generated CommonJS.
    ignores: [
      "**/dist/**",
      "**/lib/**",
      "**/.expo/**",
      "**/web-build/**",
      "**/coverage/**",
      // design-sync generated artifacts, all gitignored and all rebuilt by the
      // committed scripts (see .design-sync/NOTES.md for the build order). CI
      // never runs those scripts, but anyone who does would otherwise turn
      // `npm run lint` into thousands of errors — the 3 MB pre-bundled entry
      // alone accounts for most of them.
      ".design-sync/web-barrel.mjs",
      ".design-sync/docs/**",
      ".design-sync/guidelines/**",
      "**/.design-sync-entry.mjs",
    ],
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    // eslint-config-expo's TypeScript override replaces the base config's
    // `typescript: true` resolver with a node-only one, which cannot follow the
    // workspaces' `baseUrl` — so root-relative imports like "screens/Playground"
    // were all reported as unresolved. Put the resolver back, pointed at the
    // tsconfigs that declare baseUrl. (eslint-import-resolver-typescript already
    // ships with eslint-config-expo; no extra dependency.)
    settings: {
      "import/resolver": {
        typescript: {
          project: [
            "tsconfig.json",
            "apps/*/tsconfig.json",
            "packages/*/tsconfig.json",
          ],
        },
      },
    },
  },
  {
    // The two design-sync lib forks import `ts-morph` and `../../.ds-sync/lib/*`.
    // Both are supplied by the design-sync tooling at run time and neither is
    // resolvable from a clone: `.ds-sync/` and `.design-sync/node_modules` are
    // gitignored (the latter is a per-clone symlink, see .design-sync/NOTES.md)
    // and `ts-morph` is not a repo dependency. The resolver is therefore always
    // right and always useless here.
    files: [".design-sync/overrides/*.mjs"],
    rules: {
      "import/no-unresolved": "off",
    },
  },
  {
    rules: {
      "linebreak-style": ["error", "unix"],
    },
  },
]);
