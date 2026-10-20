const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");
const eslintPluginPrettierRecommended = require("eslint-plugin-prettier/recommended");

// `packages/device` ships one subpath per capability, and each capability owns
// its Expo modules. Metro resolves every static import reachable from an entry
// point, so a native import outside its capability's folder would make that
// module a required peer of every app importing the other entry points.
const DEVICE_CAPABILITIES = {
  info: ["expo-device", "expo-application"],
  location: ["expo-location"],
  camera: ["expo-camera"],
  network: ["@react-native-community/netinfo"],
  battery: ["expo-battery"],
  "keep-awake": ["expo-keep-awake"],
  orientation: ["expo-screen-orientation"],
  haptics: ["expo-haptics"],
  biometrics: ["expo-local-authentication"],
  "secure-store": ["expo-secure-store"],
  sensors: ["expo-sensors"],
  "media-picker": ["expo-image-picker"],
  "media-library": ["expo-media-library"],
  // Starts expo-location's updates, so it shares that module with /location.
  "background-location": ["expo-location", "expo-task-manager"],
  bluetooth: ["react-native-ble-manager"],
  // The contract and its engine: the vendors' native code is in @its/rfid-*.
  rfid: [],
  // Likewise: the vendors' native code is in @its/scanner-*.
  scanner: [],
};
const DEVICE_SUBPATHS = [...Object.keys(DEVICE_CAPABILITIES), "testing"];

// The import-boundary patterns every workspace rule below is built from.
const noPlayground = (message) => ({
  group: ["**/apps/**", "apps/**", "@its/glowup-playground*"],
  message,
});
// Neither the package name, a deep import nor a path into the folder.
const noPackages = (names, message) => ({
  group: names.flatMap((n) => [
    `@its/glowup-${n}`,
    `@its/glowup-${n}/*`,
    `**/packages/${n}/**`,
  ]),
  message,
});
// The app reaches a package only through its name and its public subpaths.
const publicOnly = (name, subpaths = []) => [
  {
    group: [
      `@its/glowup-${name}/*`,
      ...subpaths.map((s) => `!@its/glowup-${name}/${s}`),
    ],
    message: `Import from the '@its/glowup-${name}' barrel${subpaths.length ? ` or one of its public subpaths (${subpaths.join(", ")})` : ""} — other deep imports are not part of the package's public API.`,
  },
  {
    group: [`**/packages/${name}/**`, `packages/${name}/**`],
    message: `Reach the package through the '@its/glowup-${name}' name, not through a path into packages/${name}.`,
  },
];

// What no file of packages/device may import, whatever folder it is in.
const DEVICE_BASE_PATTERNS = [
  noPlayground("The device package cannot depend on the playground app."),
  {
    group: ["@its/rfid-*", "**/packages/rfid-*/**"],
    message:
      "The device package holds the RFID contract; vendor packages (@its/rfid-*) implement it and the app chooses one. The arrow never points back.",
  },
  {
    group: ["@its/scanner-*", "**/packages/scanner-*/**"],
    message:
      "The device package holds the barcode scanner contract; vendor packages (@its/scanner-*) implement it and the app chooses one. The arrow never points back.",
  },
  noPackages(
    ["ui", "notifications"],
    "The device package is headless and stands alone: compose it with @its/glowup-ui or @its/glowup-notifications in the app.",
  ),
  {
    group: ["@react-navigation/*", "expo-router", "expo-router/*"],
    message: "The device package is navigation-agnostic.",
  },
];

// Every module but the capability's own: two capabilities may share one
// (location and background-location both use expo-location).
const deviceNativePatterns = (except) => {
  const own = new Set(DEVICE_CAPABILITIES[except] ?? []);
  const owners = new Map();
  for (const [capability, modules] of Object.entries(DEVICE_CAPABILITIES)) {
    for (const m of modules) {
      if (!own.has(m)) owners.set(m, [...(owners.get(m) ?? []), capability]);
    }
  }
  return [...owners].map(([m, capabilities]) => ({
    group: [m, `${m}/*`],
    message: `Only ${capabilities.map((c) => `packages/device/src/${c}`).join(" and ")} may import ${m}: anywhere else it becomes a required peer of every other entry point.`,
  }));
};

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
      ".design-sync/docs/**",
      ".design-sync/guidelines/**",
      "**/.design-sync-entry.mjs",
      ".design-sync/web-barrel.mjs",
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
    // The design-sync lib overrides import `ts-morph` and `../../.ds-sync/lib/*`.
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
            ...publicOnly("ui"),
            // "/testing" is the one public subpath (the Jest mock).
            ...publicOnly("notifications", ["testing"]),
            ...publicOnly("device", DEVICE_SUBPATHS),
            {
              group: [
                "@its/rfid-*/*",
                "**/packages/rfid-*/**",
                "packages/rfid-*/**",
              ],
              message:
                "Import a vendor package through its name only (@its/rfid-honeywell).",
            },
            {
              group: [
                "@its/scanner-*/*",
                "**/packages/scanner-*/**",
                "packages/scanner-*/**",
              ],
              message:
                "Import a vendor package through its name only (@its/scanner-honeywell).",
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
            noPlayground(
              "The library cannot depend on the playground app; move the shared code into packages/ui.",
            ),
            {
              // 0.5.0 removed DrawerNavigation/StackNavigation: the library ships
              // navigation widgets but no navigator, and has no @react-navigation
              // peers left. Importing one here would put them back.
              group: ["@react-navigation/*"],
              message:
                "The library is navigation-agnostic. Navigators live in the app (apps/playground/navigation).",
            },
            noPackages(
              ["device"],
              "The library cannot depend on @its/glowup-device: compose hardware and UI in the app.",
            ),
          ],
        },
      ],
    },
  },
  {
    // `packages/notifications` is headless and stands alone: it knows no app,
    // no navigator and no UI kit. Showing a notification with Glowup components
    // is wiring the consuming app does, so either package can ship without the
    // other.
    files: [
      "packages/notifications/**/*.ts",
      "packages/notifications/**/*.tsx",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            noPlayground(
              "The notifications package cannot depend on the playground app.",
            ),
            noPackages(
              ["ui"],
              "The notifications package is headless. Render notifications with @its/glowup-ui in the app, not here.",
            ),
            {
              group: ["@react-navigation/*", "expo-router", "expo-router/*"],
              message:
                "The notifications package is navigation-agnostic: route from the app's onResponse callback.",
            },
            noPackages(
              ["device"],
              "The notifications package stands alone and cannot depend on @its/glowup-device.",
            ),
          ],
        },
      ],
    },
  },
  {
    // `packages/device` is headless and standalone, like notifications. Tests
    // may reach any Expo module (to drive its jest-expo mock).
    files: ["packages/device/**/*.ts", "packages/device/**/*.tsx"],
    rules: {
      "no-restricted-imports": ["error", { patterns: DEVICE_BASE_PATTERNS }],
    },
  },
  {
    // The root entry, core/ and testing/ import no native module at all.
    files: ["packages/device/src/**/*.ts", "packages/device/src/**/*.tsx"],
    ignores: ["packages/device/src/**/__tests__/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        { patterns: [...DEVICE_BASE_PATTERNS, ...deviceNativePatterns()] },
      ],
    },
  },
  // Each capability may import its own Expo modules and nobody else's, and
  // never another capability: importing `/camera` must not pull in location.
  ...Object.keys(DEVICE_CAPABILITIES).map((capability) => ({
    files: [
      `packages/device/src/${capability}/**/*.ts`,
      `packages/device/src/${capability}/**/*.tsx`,
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            ...DEVICE_BASE_PATTERNS,
            ...deviceNativePatterns(capability),
            {
              group: DEVICE_SUBPATHS.filter((s) => s !== capability).flatMap(
                (s) => [`**/${s}`, `**/${s}/**`],
              ),
              message:
                "A capability cannot import another one: each subpath must load on its own. Shared code belongs in src/core.",
            },
          ],
        },
      ],
    },
  })),
  {
    // The root barrel and core/ may name a capability's types (the adapter
    // contracts) but never load its code, or the root entry would require
    // every capability's Expo peer.
    files: [
      "packages/device/src/index.ts",
      "packages/device/src/core/**/*.ts",
      "packages/device/src/core/**/*.tsx",
    ],
    rules: {
      "@typescript-eslint/no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: DEVICE_SUBPATHS.flatMap((s) => [`**/${s}`, `**/${s}/**`]),
              allowTypeImports: true,
              message:
                "The root entry and core/ may only `import type` from a capability: a value import would load its native module.",
            },
          ],
        },
      ],
    },
  },
  // A vendor package implements one contract of `@its/glowup-device`
  // (`/rfid`, `/scanner`) and knows nothing else of the repo: no UI kit, no
  // other capability, no app.
  ...[
    ["rfid", "packages/rfid-*"],
    ["scanner", "packages/scanner-*"],
  ].map(([contract, folder]) => ({
    files: [`${folder}/**/*.ts`, `${folder}/**/*.tsx`],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            noPlayground("A vendor package cannot depend on an app."),
            noPackages(
              ["ui", "notifications"],
              `A vendor package is headless: it implements @its/glowup-device/${contract} only.`,
            ),
            ...publicOnly("device", [contract, "testing"]),
          ],
          paths: [
            {
              name: "@its/glowup-device",
              message: `A vendor package imports @its/glowup-device/${contract} (and /testing in tests), not the root entry.`,
            },
          ],
        },
      ],
    },
  })),
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
]);
