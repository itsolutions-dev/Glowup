/**
 * The config plugin:
 * `["@its/rfid-zebra", { aarPath: "./zebra/rfidapi3lib-2.0.5.297.aar" }]`.
 *
 * Zebra's RFID SDK for Android is not on a public repository (it comes from
 * Zebra's support portal), so this package does not ship it. The plugin takes
 * the app's own copy and:
 * - copies it into a Maven repository inside `android/`, where the module's
 *   Gradle build finds it as `com.zebra.rfid:rfidapi3lib:2.0.5.297`;
 * - declares that repository, for the SDK's group only;
 * - raises `minSdkVersion` to 29, the SDK's;
 * - declares Android 12's nearby devices permissions (the scan never
 *   locates), and caps at Android 11 the location the SDK's manifest declares
 *   for every version;
 * - declares Qualcomm's `com.qti.qrs.qc_sdk` library optional, as Zebra's
 *   sample does: the SDK refers to it for the readers built into some hosts.
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

/** The SDK the app supplies. */
const SDK = {
  option: "aarPath",
  file: "rfidapi3lib-2.0.5.297.aar",
  source:
    "Download Zebra's RFID SDK for Android 2.0.5.297 (Zebra_RFIDAPI3_SDK_2.0.5.297.zip) from Zebra's support portal",
  group: "com.zebra.rfid",
  artifact: "rfidapi3lib",
  version: "2.0.5.297",
};
const REPOSITORY_DIR = "zebra-rfid-repository";
const MIN_SDK = 29;

const MARKER = `// ${pkg.name}: the app's copy of Zebra's RFID SDK`;
const REPOSITORY = `${MARKER}
    maven {
      url = uri("$rootDir/${REPOSITORY_DIR}")
      content {
        includeGroup("${SDK.group}")
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

/** Where the SDK goes in the repository, relative to `android/`. */
function artifactDir(sdk) {
  return path.join(
    REPOSITORY_DIR,
    ...sdk.group.split("."),
    sdk.artifact,
    sdk.version,
  );
}

/** Copies the app's copy of the SDK into the Maven repository inside `android/`. */
function copySdk(projectRoot, platformRoot, sdk, aarPath) {
  const source = path.resolve(projectRoot, aarPath);
  if (!fs.existsSync(source)) {
    throw new Error(
      `${TAG} ${sdk.option}: ${source} does not exist. ${sdk.source} and point ${sdk.option} at the ${sdk.file} it holds.`,
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

/** The gradle.properties entries with `android.minSdkVersion` at least 29. */
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
  // Android 12 and later: nearby devices.
  ensurePermission(manifest, "android.permission.BLUETOOTH_SCAN", {
    "android:usesPermissionFlags": "neverForLocation",
    "tools:targetApi": "s",
  });
  ensurePermission(manifest, "android.permission.BLUETOOTH_CONNECT");
  // The SDK's manifest declares the location for every Android version; the
  // module reaches paired readers only. `replace` keeps the SDK's uncapped
  // declaration out of the merge. An app that uses location itself declares
  // it without the cap: list this plugin before expo-location, whose manifest
  // mod then runs first.
  for (const name of [
    "android.permission.ACCESS_FINE_LOCATION",
    "android.permission.ACCESS_COARSE_LOCATION",
  ]) {
    ensurePermission(manifest, name, {
      "android:maxSdkVersion": "30",
      "tools:node": "replace",
    });
  }
  return manifest;
}

/** Declares the Qualcomm library the SDK refers to as optional. */
function addOptionalLibrary(manifest) {
  const application =
    AndroidConfig.Manifest.getMainApplicationOrThrow(manifest);
  const libraries = (application["uses-library"] ??= []);
  const name = "com.qti.qrs.qc_sdk";
  if (!libraries.some((library) => library.$["android:name"] === name)) {
    libraries.push({
      $: { "android:name": name, "android:required": "false" },
    });
  }
  return manifest;
}

function withZebraRfid(config, options = {}) {
  const aarPath = options[SDK.option];
  if (typeof aarPath !== "string" || aarPath.trim() === "") {
    throw new Error(
      `${TAG} ${SDK.option} is required: the path, from the app's root, to your copy of ${SDK.file}. It is not on a public repository, and this package does not ship it.`,
    );
  }
  config = withDangerousMod(config, [
    "android",
    (mod) => {
      copySdk(
        mod.modRequest.projectRoot,
        mod.modRequest.platformProjectRoot,
        SDK,
        aarPath,
      );
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
    mod.modResults = addOptionalLibrary(addPermissions(mod.modResults));
    return mod;
  });
  return config;
}

module.exports = createRunOncePlugin(withZebraRfid, pkg.name, pkg.version);
// For the plugin's tests: the file edits, without a prebuild.
module.exports.internal = {
  addRepository,
  raiseMinSdk,
  addPermissions,
  addOptionalLibrary,
  copySdk,
  artifactDir,
  SDK,
};
