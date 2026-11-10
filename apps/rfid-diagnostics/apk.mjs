// Builds a standalone APK of this app: the release variant, with the
// JavaScript bundled in, so the device needs no Metro and no USB once the APK
// is installed. `npm run android` is the development build instead (debug,
// served by Metro).
//
//   npm run apk -w @its/rfid-diagnostics          # Honeywell
//   RFID_VENDOR=zebra npm run apk -w @its/rfid-diagnostics
//
// Needs what `npm run android` needs: the Android SDK, a JDK 17 and the
// vendor's SDK at the paths app.config.ts reads. The APK is signed with the
// debug keystore of the generated project: for testing, not for a store.
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const APP = dirname(fileURLToPath(import.meta.url));
// The same variables and default paths as app.config.ts.
const SDKS = {
  honeywell: [
    ["HONEYWELL_RFID_AAR", "./honeywell/honeywell_rfid_sdk_v1.1.0.aar"],
    ["HONEYWELL_DATACOLLECTION_AAR", "./honeywell/DataCollection.aar"],
  ],
  zebra: [["ZEBRA_RFID_AAR", "./zebra/rfidapi3lib-2.0.5.297.aar"]],
};
// The hosts are ARM devices: leaving the emulators' ABIs out halves the build.
const ARCHITECTURES = "armeabi-v7a,arm64-v8a";

const vendor = process.env.RFID_VENDOR ?? "honeywell";
if (!Object.hasOwn(SDKS, vendor)) {
  fail(`RFID_VENDOR is ${vendor}: use ${Object.keys(SDKS).join(" or ")}.`);
}
const missing = SDKS[vendor]
  .map(([variable, fallback]) => [
    variable,
    resolve(APP, process.env[variable] ?? fallback),
  ])
  .filter(([, path]) => !existsSync(path));
if (missing.length > 0) {
  fail(
    [
      `The ${vendor} SDK is not in place (it is not in the repository):`,
      ...missing.map(([variable, path]) => `  ${path} (or set ${variable})`),
    ].join("\n"),
  );
}

const windows = process.platform === "win32";
// A fresh android/: the config plugins run again, for this vendor.
run(windows ? "npx.cmd" : "npx", [
  "expo",
  "prebuild",
  "--clean",
  "--no-install",
  "--platform",
  "android",
]);
run(
  windows ? "gradlew.bat" : "./gradlew",
  ["assembleRelease", `-PreactNativeArchitectures=${ARCHITECTURES}`],
  join(APP, "android"),
);

const built = join(
  APP,
  "android/app/build/outputs/apk/release/app-release.apk",
);
if (!existsSync(built)) fail(`Gradle finished without ${built}.`);
const output = join(APP, "build", `rfid-diagnostics-${vendor}.apk`);
mkdirSync(dirname(output), { recursive: true });
copyFileSync(built, output);
console.log(`\nAPK: ${output}\nInstall it with: adb install -r "${output}"`);

function run(command, args, cwd = APP) {
  // `.cmd` and `.bat` files only start through a shell on Windows.
  execFileSync(command, args, { cwd, stdio: "inherit", shell: windows });
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
