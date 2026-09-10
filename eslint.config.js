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
    // `packages/ui` is a published package with a public API: `src/index.ts`.
    // A deep import would resolve inside this repo (Metro watches the whole
    // workspace) and break for every npm consumer, so the app is only allowed
    // to reach the library through its package name.
    files: ["apps/**/*.ts", "apps/**/*.tsx"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@its/glowup-ui/*"],
              message:
                "Import from the '@its/glowup-ui' barrel — deep imports are not part of the package's public API.",
            },
            {
              group: ["**/packages/ui/**", "packages/ui/**"],
              message:
                "Reach the library through the '@its/glowup-ui' package name, not through a path into packages/ui.",
            },
          ],
        },
      ],
    },
  },
  {
    // The dependency arrow points one way: the demo app may depend on the
    // library, never the reverse.
    files: ["packages/ui/**/*.ts", "packages/ui/**/*.tsx"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["**/apps/**", "apps/**", "@its/glowup-playground*"],
              message:
                "The library cannot depend on the playground app; move the shared code into packages/ui.",
            },
            {
              // 0.5.0 removed DrawerNavigation/StackNavigation: the library ships
              // navigation widgets but no navigator, and has no @react-navigation
              // peers left. Importing one here would put them back.
              group: ["@react-navigation/*"],
              message:
                "The library is navigation-agnostic. Navigators live in the app (apps/playground/navigation).",
            },
          ],
        },
      ],
    },
  },
  {
    // examples/consumer is outside the npm workspaces on purpose (it installs the
    // published package), so it has its own node_modules that the root `npm
    // install` never creates. Style and correctness rules still apply here; only
    // module resolution cannot work from the root.
    files: ["examples/**/*.ts", "examples/**/*.tsx"],
    rules: {
      "import/no-unresolved": "off",
      "no-restricted-imports": "off",
    },
  },
  {
    rules: {
      "linebreak-style": ["error", "unix"],
    },
  },
]);
