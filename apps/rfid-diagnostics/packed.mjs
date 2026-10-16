// Builds a copy of this app that runs on the packed packages instead of their
// source: `npm pack` makes the tarballs npm would publish for
// @its/glowup-device and @its/rfid-honeywell, and the copy, outside the
// repository, installs them as a consumer would. The same screen then checks
// on a real reader what the source checks here could not: the `exports`, the
// built `lib/`, the config plugin and the Android module as the tarball ships
// them.
//
//   npm run packed -w @its/rfid-diagnostics -- <directory outside the repo>
//
// The directory must not exist yet, or be empty. The Honeywell SDKs are copied
// from `honeywell/` when they are there; they stay on this machine (their
// licence lets them travel only inside an app's build).
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
const SOURCES = ["App.tsx", "measurements.ts", "index.ts", "app.config.ts"];
const SDKS = ["honeywell_rfid_sdk_v1.1.0.aar", "DataCollection.aar"];

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
// package before the vendor, whose types import it), then the pack, without
// `prepack`, whose build output would mix with the JSON.
npm(["run", "build", "--workspace", "@its/glowup-device"], "inherit");
npm(["run", "build", "--workspace", "@its/rfid-honeywell"], "inherit");
const packed = JSON.parse(
  npm([
    "pack",
    "--ignore-scripts",
    "--json",
    "--pack-destination",
    tarballs,
    "--workspace",
    "@its/glowup-device",
    "--workspace",
    "@its/rfid-honeywell",
  ]),
);
const tarball = (name) => {
  const entry = packed.find((p) => p.name === name);
  if (!entry) fail(`npm pack produced no tarball for ${name}.`);
  return `file:./packages/${entry.filename}`;
};

for (const file of SOURCES) copyFileSync(join(APP, file), join(target, file));

const sdks = join(target, "honeywell");
mkdirSync(sdks);
const missing = SDKS.filter((sdk) => {
  const source = join(APP, "honeywell", sdk);
  if (!existsSync(source)) return true;
  copyFileSync(source, join(sdks, sdk));
  return false;
});

const app = readJson(join(APP, "package.json"));
const root = readJson(join(REPO, "package.json"));
writeJson(join(target, "package.json"), {
  name: "rfid-diagnostics-packed",
  version: "1.0.0",
  private: true,
  description:
    "The RFID diagnostics app on the packed @its/glowup-device and @its/rfid-honeywell, made by apps/rfid-diagnostics/packed.mjs.",
  main: "./index.ts",
  scripts: {
    start: "expo start",
    android: "expo run:android",
    "type-check": "tsc --noEmit",
  },
  dependencies: {
    ...app.dependencies,
    "@its/glowup-device": tarball("@its/glowup-device"),
    "@its/rfid-honeywell": tarball("@its/rfid-honeywell"),
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
${missing.length > 0 ? `  # put ${missing.join(" and ")} in honeywell/ first (or set HONEYWELL_RFID_AAR / HONEYWELL_DATACOLLECTION_AAR)\n` : ""}  npm run android

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
