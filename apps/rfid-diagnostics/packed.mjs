// Builds a copy of this app that runs on the packed packages instead of their
// source: `npm pack` makes the tarballs npm would publish for
// @its/glowup-device and the vendor packages (RFID and barcode scanner), and
// the copy, outside the repository, installs them as a consumer would. The
// same screens then check on a real device what the source checks here could
// not: the `exports`, the built `lib/`, the config plugins and the Android
// modules as the tarballs ship them.
//
//   npm run packed -w @its/rfid-diagnostics -- <directory outside the repo>
//
// The directory must not exist yet, or be empty. The vendors' SDKs are copied
// from `honeywell/` and `zebra/` when they are there; they stay on this
// machine (they travel only inside an app's build). RFID_VENDOR picks the
// vendor of the copy's build, as here.
import { execFileSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const APP = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(APP, "../..");
// Not `babel.config.js`: it names babel-preset-expo, which the workspace
// hoists and a standalone install nests under expo; without one, Expo applies
// that preset itself.
const SOURCES = [
  "App.tsx",
  "ScannerScreen.tsx",
  "ui.tsx",
  "measurements.ts",
  "scannerMeasurements.ts",
  "vendors.ts",
  "index.ts",
  "app.config.ts",
];
const SDKS = {
  honeywell: ["honeywell_rfid_sdk_v1.1.0.aar", "DataCollection.aar"],
  zebra: ["rfidapi3lib-2.0.5.297.aar"],
};
const VENDOR_PACKAGES = [
  "@its/rfid-honeywell",
  "@its/rfid-zebra",
  "@its/scanner-honeywell",
  "@its/scanner-zebra",
];

const target = process.argv[2] && resolve(process.argv[2]);
if (!target) {
  fail("Usage: npm run packed -w @its/rfid-diagnostics -- <directory>");
}
// Inside the repository, Node would fall back to the root node_modules, where
// both packages are links to their source, and the check would test nothing.
const fromRepo = relative(REPO, target);
if (!fromRepo.startsWith("..") && !isAbsolute(fromRepo)) {
  fail(`${target} is inside the repository; pick a directory outside it.`);
}
if (existsSync(target) && readdirSync(target).length > 0) {
  fail(`${target} is not empty.`);
}

const tarballs = join(target, "packages");
mkdirSync(tarballs, { recursive: true });
// The tarballs hold this checkout's code: the build runs first (the device
// package before the vendors, whose types import it), then the pack, without
// `prepack`, whose build output would mix with the JSON.
npm(["run", "build", "--workspace", "@its/glowup-device"], "inherit");
for (const name of VENDOR_PACKAGES) {
  npm(["run", "build", "--workspace", name], "inherit");
}
const packed = JSON.parse(
  npm([
    "pack",
    "--ignore-scripts",
    "--json",
    "--pack-destination",
    tarballs,
    "--workspace",
    "@its/glowup-device",
    ...VENDOR_PACKAGES.flatMap((name) => ["--workspace", name]),
  ]),
);
const tarball = (name) => {
  const entry = packed.find((p) => p.name === name);
  if (!entry) fail(`npm pack produced no tarball for ${name}.`);
  return `file:./packages/${entry.filename}`;
};

for (const file of SOURCES) copyFileSync(join(APP, file), join(target, file));

const missing = Object.entries(SDKS).flatMap(([vendor, files]) => {
  mkdirSync(join(target, vendor));
  return files.flatMap((sdk) => {
    const source = join(APP, vendor, sdk);
    if (!existsSync(source)) return [`${vendor}/${sdk}`];
    copyFileSync(source, join(target, vendor, sdk));
    return [];
  });
});

const app = readJson(join(APP, "package.json"));
const root = readJson(join(REPO, "package.json"));
writeJson(join(target, "package.json"), {
  name: "rfid-diagnostics-packed",
  version: "1.0.0",
  private: true,
  description:
    "The RFID diagnostics app on the packed @its/glowup-device and vendor packages, made by apps/rfid-diagnostics/packed.mjs.",
  main: "./index.ts",
  scripts: {
    start: "expo start",
    android: "expo run:android",
    "type-check": "tsc --noEmit",
  },
  dependencies: {
    ...app.dependencies,
    "@its/glowup-device": tarball("@its/glowup-device"),
    ...Object.fromEntries(VENDOR_PACKAGES.map((name) => [name, tarball(name)])),
  },
  devDependencies: {
    "@types/react": app.devDependencies["@types/react"],
    typescript: root.devDependencies.typescript,
  },
});
// No `paths`: the packages resolve by name from node_modules, through their
// `exports`, as in any app.
writeJson(join(target, "tsconfig.json"), {
  extends: "expo/tsconfig.base",
  include: ["**/*.ts", "**/*.tsx"],
});

const versions = packed.map((p) => `${p.name}@${p.version}`).join(", ");
console.log(`
Packed ${versions} into ${tarballs}.

Next, on the machine with Android Studio:

  cd ${target}
  npm install
  npm run type-check
${missing.length > 0 ? `  # missing here: ${missing.join(", ")}; put the vendor's in place first (or set HONEYWELL_RFID_AAR / HONEYWELL_DATACOLLECTION_AAR / ZEBRA_RFID_AAR)\n` : ""}  RFID_VENDOR=honeywell npm run android   # or RFID_VENDOR=zebra

Then run the checks in apps/rfid-diagnostics/README.md.`);

// Through the npm that runs this script (`npm run` sets npm_execpath), so it
// works without a shell on Windows too.
function npm(args, stdout = "pipe") {
  const cli = process.env.npm_execpath;
  return execFileSync(
    cli ? process.execPath : "npm",
    cli ? [cli, ...args] : args,
    {
      cwd: REPO,
      encoding: "utf8",
      stdio: ["ignore", stdout, "inherit"],
    },
  );
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
