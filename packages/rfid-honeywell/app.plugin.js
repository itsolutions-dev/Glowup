/**
 * The config plugin: `["@its/rfid-honeywell", { aarPath: "./honeywell/honeywell_rfid_sdk_v1.1.0.aar" }]`.
 *
 * The Honeywell RFID SDK is not on a public repository, and its licence lets
 * it travel only inside the app's build: this package cannot ship it. The
 * plugin takes the app's own copy and:
 * - copies it into a Maven repository inside `android/`, where the module's
 *   Gradle build finds it as `com.honeywell.rfid:honeywell-rfid-sdk:1.1.0`;
 * - declares that repository, for the SDK's group only;
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

const SDK = {
  group: "com.honeywell.rfid",
  artifact: "honeywell-rfid-sdk",
  version: "1.1.0",
};
const REPOSITORY_DIR = "honeywell-rfid-repository";
const MIN_SDK = 26;

const MARKER = `// ${pkg.name}: the app's copy of the Honeywell RFID SDK`;
const REPOSITORY = `${MARKER}
    maven {
      url = uri("$rootDir/${REPOSITORY_DIR}")
      content { includeGroup("${SDK.group}") }
    }`;

function pom() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0">
  <modelVersion>4.0.0</modelVersion>
  <groupId>${SDK.group}</groupId>
  <artifactId>${SDK.artifact}</artifactId>
  <version>${SDK.version}</version>
  <packaging>aar</packaging>
</project>
`;
}

/** Where the SDK goes in the repository, relative to `android/`. */
function artifactDir() {
  return path.join(
    REPOSITORY_DIR,
    ...SDK.group.split("."),
    SDK.artifact,
    SDK.version,
  );
}

/** Copies the app's SDK into the Maven repository inside `android/`. */
function copySdk(projectRoot, platformRoot, aarPath) {
  const source = path.resolve(projectRoot, aarPath);
  if (!fs.existsSync(source)) {
    throw new Error(
      `${TAG} aarPath: ${source} does not exist. Download the Honeywell RFID SDK v1.1.0 from Honeywell's support portal and point aarPath at honeywell_rfid_sdk_v1.1.0.aar.`,
    );
  }
  const dir = path.join(platformRoot, artifactDir());
  fs.mkdirSync(dir, { recursive: true });
  const base = `${SDK.artifact}-${SDK.version}`;
  fs.copyFileSync(source, path.join(dir, `${base}.aar`));
  fs.writeFileSync(path.join(dir, `${base}.pom`), pom());
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
  const { aarPath } = options;
  if (typeof aarPath !== "string" || aarPath.trim() === "") {
    throw new Error(
      `${TAG} aarPath is required: the path, from the app's root, to your copy of honeywell_rfid_sdk_v1.1.0.aar. Its licence does not let this package ship it.`,
    );
  }
  config = withDangerousMod(config, [
    "android",
    (mod) => {
      copySdk(
        mod.modRequest.projectRoot,
        mod.modRequest.platformProjectRoot,
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
};
