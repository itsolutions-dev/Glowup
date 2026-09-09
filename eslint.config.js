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
    rules: {
      "linebreak-style": ["error", "unix"],
    },
  },
]);
