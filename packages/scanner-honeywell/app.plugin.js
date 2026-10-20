/**
 * The config plugin:
 * `["@its/scanner-honeywell", { dataCollectionAarPath: "./honeywell/DataCollection.aar" }]`.
 *
 * Honeywell's Data Collection SDK is not on a public repository, and its
 * licence lets it travel only inside the app's build: this package cannot
 * ship it. The plugin takes the app's own copy and:
 * - copies it into a Maven repository inside `android/`, where the module's
 *   Gradle build finds it as `com.honeywell.aidc:datacollection:1.97.00.0060`;
 * - declares that repository, for the SDK's group only.
 *
 * `@its/rfid-honeywell` depends on the same coordinate (its SDK loads this
 * one): an app with both points the two plugins at the same file, and Gradle
 * resolves it once. The SDK's manifest declares the scanner service's
 * permission (`com.honeywell.decode.permission.DECODE`) and its minimum
 * (Android 4.1), so the plugin adds neither.
 *
 * Runs in Node at prebuild, not in the app: plain CommonJS, no build step.
 */
const {
  createRunOncePlugin,
  withDangerousMod,
  withProjectBuildGradle,
} = require("expo/config-plugins");
const fs = require("node:fs");
const path = require("node:path");

const pkg = require("./package.json");

const TAG = `[${pkg.name}]`;

/** The SDK the app supplies, under the plugin option that points at it. */
const SDK = {
  option: "dataCollectionAarPath",
  file: "DataCollection.aar",
  source:
    "Take Honeywell's Data Collection SDK from the Honeywell Mobility SDK for Android (or the RFID SDK's sample app, app/libs)",
  group: "com.honeywell.aidc",
  artifact: "datacollection",
  version: "1.97.00.0060",
};
const REPOSITORY_DIR = "honeywell-scanner-repository";

const MARKER = `// ${pkg.name}: the app's copy of the Honeywell Data Collection SDK`;
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

function withHoneywellScanner(config, options = {}) {
  const aarPath = options[SDK.option];
  if (typeof aarPath !== "string" || aarPath.trim() === "") {
    throw new Error(
      `${TAG} ${SDK.option} is required: the path, from the app's root, to your copy of ${SDK.file}. Its licence does not let this package ship it.`,
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
  return config;
}

module.exports = createRunOncePlugin(
  withHoneywellScanner,
  pkg.name,
  pkg.version,
);
// For the plugin's tests: the file edits, without a prebuild.
module.exports.internal = { addRepository, copySdk, artifactDir, SDK };
