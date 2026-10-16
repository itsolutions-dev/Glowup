/**
 * The config plugin:
 * `["@its/rfid-honeywell", { aarPath: "./honeywell/honeywell_rfid_sdk_v1.1.0.aar", dataCollectionAarPath: "./honeywell/DataCollection.aar" }]`.
 *
 * The Honeywell RFID SDK is not on a public repository, and its licence lets
 * it travel only inside the app's build: this package cannot ship it. Nor
 * does it ship Honeywell's Data Collection SDK, which the RFID SDK's embedded
 * `RfidService` loads on every bind (its USB transport) and which Honeywell's
 * sample app bundles beside it. The plugin takes the app's own copies and:
 * - copies them into a Maven repository inside `android/`, where the module's
 *   Gradle build finds them as `com.honeywell.rfid:honeywell-rfid-sdk:1.1.0`
 *   and `com.honeywell.aidc:datacollection:1.97.00.0060`;
 * - declares that repository, for the SDKs' groups only;
 * - raises `minSdkVersion` to 26, the SDK's;
 * - declares the Bluetooth permissions: Android 12's nearby devices (the scan
 *   never locates), and the location a scan needs up to Android 11.
 *
 * Runs in Node at prebuild, not in the app: plain CommonJS, no build step.
 */
const {
  AndroidConfig,
  createRunOncePlugin,
  withAndroidManifest,
  withDangerousMod,
  withGradleProperties,
  withProjectBuildGradle,
} = require("expo/config-plugins");
const fs = require("node:fs");
const path = require("node:path");

const pkg = require("./package.json");

const TAG = `[${pkg.name}]`;

/** The SDKs the app supplies, each under the plugin option that points at it. */
const SDKS = [
  {
    option: "aarPath",
    file: "honeywell_rfid_sdk_v1.1.0.aar",
    source:
      "Download the Honeywell RFID SDK v1.1.0 from Honeywell's support portal",
    group: "com.honeywell.rfid",
    artifact: "honeywell-rfid-sdk",
    version: "1.1.0",
  },
  {
    option: "dataCollectionAarPath",
    file: "DataCollection.aar",
    source:
      "Take Honeywell's Data Collection SDK from the RFID SDK's sample app (app/libs), or from the Honeywell Mobility SDK for Android",
    group: "com.honeywell.aidc",
    artifact: "datacollection",
    version: "1.97.00.0060",
  },
];
const REPOSITORY_DIR = "honeywell-rfid-repository";
const MIN_SDK = 26;

const MARKER = `// ${pkg.name}: the app's copies of the Honeywell SDKs`;
const REPOSITORY = `${MARKER}
    maven {
      url = uri("$rootDir/${REPOSITORY_DIR}")
      content {
${SDKS.map((sdk) => `        includeGroup("${sdk.group}")`).join("\n")}
      }
    }`;

function pom(sdk) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0">
  <modelVersion>4.0.0</modelVersion>
  <groupId>${sdk.group}</groupId>
  <artifactId>${sdk.artifact}</artifactId>
  <version>${sdk.version}</version>
  <packaging>aar</packaging>
</project>
`;
}

/** Where an SDK goes in the repository, relative to `android/`. */
function artifactDir(sdk) {
  return path.join(
    REPOSITORY_DIR,
    ...sdk.group.split("."),
    sdk.artifact,
    sdk.version,
  );
}

/** Copies the app's copy of an SDK into the Maven repository inside `android/`. */
function copySdk(projectRoot, platformRoot, sdk, aarPath) {
  const source = path.resolve(projectRoot, aarPath);
  if (!fs.existsSync(source)) {
    throw new Error(
      `${TAG} ${sdk.option}: ${source} does not exist. ${sdk.source} and point ${sdk.option} at ${sdk.file}.`,
    );
  }
  const dir = path.join(platformRoot, artifactDir(sdk));
  fs.mkdirSync(dir, { recursive: true });
  const base = `${sdk.artifact}-${sdk.version}`;
  fs.copyFileSync(source, path.join(dir, `${base}.aar`));
  fs.writeFileSync(path.join(dir, `${base}.pom`), pom(sdk));
}

/** The root build.gradle with the repository in `allprojects`. */
function addRepository(buildGradle) {
  if (buildGradle.includes(MARKER)) return buildGradle;
  const anchor = /allprojects\s*\{\s*repositories\s*\{/;
  if (!anchor.test(buildGradle)) {
    throw new Error(
      `${TAG} android/build.gradle has no allprojects { repositories { … } } block to add the SDK's repository to.`,
    );
  }
  return buildGradle.replace(anchor, (found) => `${found}\n    ${REPOSITORY}`);
}

/** The gradle.properties entries with `android.minSdkVersion` at least 26. */
function raiseMinSdk(properties) {
  const entry = properties.find(
    (item) => item.type === "property" && item.key === "android.minSdkVersion",
  );
  if (!entry) {
    return [
      ...properties,
      {
        type: "property",
        key: "android.minSdkVersion",
        value: String(MIN_SDK),
      },
    ];
  }
  if (Number(entry.value) < MIN_SDK) entry.value = String(MIN_SDK);
  return properties;
}

/** Adds a `<uses-permission>` unless one with that name is there already. */
function ensurePermission(manifest, name, attributes = {}) {
  const permissions = (manifest.manifest["uses-permission"] ??= []);
  if (permissions.some((p) => p.$["android:name"] === name)) return;
  permissions.push({ $: { "android:name": name, ...attributes } });
}

function addPermissions(manifest) {
  AndroidConfig.Manifest.ensureToolsAvailable(manifest);
  // Android 12 and later: nearby devices. The scan only finds readers.
  ensurePermission(manifest, "android.permission.BLUETOOTH_SCAN", {
    "android:usesPermissionFlags": "neverForLocation",
    "tools:targetApi": "s",
  });
  ensurePermission(manifest, "android.permission.BLUETOOTH_CONNECT");
  // Android 11 and earlier: a Bluetooth scan needs the precise location. An
  // app that uses location itself declares it without the cap: list this
  // plugin before expo-location, whose manifest mod then runs first.
  ensurePermission(manifest, "android.permission.ACCESS_FINE_LOCATION", {
    "android:maxSdkVersion": "30",
  });
  return manifest;
}

function withHoneywellRfid(config, options = {}) {
  for (const sdk of SDKS) {
    const aarPath = options[sdk.option];
    if (typeof aarPath !== "string" || aarPath.trim() === "") {
      throw new Error(
        `${TAG} ${sdk.option} is required: the path, from the app's root, to your copy of ${sdk.file}. Its licence does not let this package ship it.`,
      );
    }
  }
  config = withDangerousMod(config, [
    "android",
    (mod) => {
      for (const sdk of SDKS) {
        copySdk(
          mod.modRequest.projectRoot,
          mod.modRequest.platformProjectRoot,
          sdk,
          options[sdk.option],
        );
      }
      return mod;
    },
  ]);
  config = withProjectBuildGradle(config, (mod) => {
    if (mod.modResults.language !== "groovy") {
      throw new Error(
        `${TAG} android/build.gradle.kts is not supported: add the repository ${REPOSITORY_DIR} by hand.`,
      );
    }
    mod.modResults.contents = addRepository(mod.modResults.contents);
    return mod;
  });
  config = withGradleProperties(config, (mod) => {
    mod.modResults = raiseMinSdk(mod.modResults);
    return mod;
  });
  config = withAndroidManifest(config, (mod) => {
    mod.modResults = addPermissions(mod.modResults);
    return mod;
  });
  return config;
}

module.exports = createRunOncePlugin(withHoneywellRfid, pkg.name, pkg.version);
// For the plugin's tests: the file edits, without a prebuild.
module.exports.internal = {
  addRepository,
  raiseMinSdk,
  addPermissions,
  copySdk,
  artifactDir,
  SDKS,
};
