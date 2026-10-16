// Drives the playground's /native-check screen on a running Android emulator
// (native.yml): types and taps through `adb`, reads the screen with
// `uiautomator dump`, and prints one PASS/FAIL line per step. It never throws on
// a failed step: the CI job reports the lines instead of failing on them.
//
//   node scripts/android-interact.mjs > android-interaction.txt
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const adb = (...args) =>
  execFileSync("adb", args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
const photo = (file) =>
  writeFileSync(
    file,
    execFileSync("adb", ["exec-out", "screencap", "-p"], {
      maxBuffer: 64 * 1024 * 1024,
    }),
  );
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const [screenW, screenH] = (
  adb("shell", "wm", "size").match(/(\d+)x(\d+)/) ?? [0, 1080, 2400]
)
  .slice(1)
  .map(Number);

/** The visible UI as a flat list of { text, desc, x, y }. */
const screen = () => {
  let xml = "";
  for (let i = 0; i < 4 && !xml.includes("<node"); i += 1) {
    try {
      xml = adb("exec-out", "uiautomator", "dump", "/dev/tty");
    } catch {
      xml = "";
    }
  }
  return [...xml.matchAll(/<node\s[^>]*>/g)].map(([tag]) => {
    const attr = (name) =>
      (tag.match(new RegExp(`\\s${name}="([^"]*)"`)) ?? [])[1] ?? "";
    const [l, t, r, b] = (attr("bounds").match(/\d+/g) ?? [0, 0, 0, 0]).map(
      Number,
    );
    return {
      text: attr("text"),
      desc: attr("content-desc"),
      x: Math.round((l + r) / 2),
      y: Math.round((t + b) / 2),
    };
  });
};

const named = (nodes, label) =>
  nodes.find((n) => n.text === label || n.desc === label);
const hasText = (nodes, pattern) =>
  nodes.find((n) => pattern.test(n.text) || pattern.test(n.desc));

/** Looks for something, scrolling down a few times if it is off screen. */
const find = async (predicate, tries = 6) => {
  for (let i = 0; i < tries; i += 1) {
    const hit = predicate(screen());
    if (hit) return hit;
    adb(
      "shell",
      "input",
      "swipe",
      screenW / 2,
      screenH * 0.7,
      screenW / 2,
      screenH * 0.3,
      300,
    );
    await sleep(600);
  }
  return null;
};

const tap = async (label) => {
  const node = await find((nodes) => named(nodes, label));
  if (!node) throw new Error(`"${label}" not on screen`);
  adb("shell", "input", "tap", node.x, node.y);
  await sleep(700);
};

const expectText = async (pattern, what) => {
  for (let i = 0; i < 6; i += 1) {
    if (hasText(screen(), pattern)) return;
    await sleep(500);
  }
  throw new Error(`${what}: ${pattern} not found`);
};

const expectGone = async (label, what) => {
  await sleep(700);
  if (named(screen(), label))
    throw new Error(`${what}: "${label}" still there`);
};

const steps = [
  [
    "a decimal comma is typed and reported as a plain number",
    async () => {
      await tap("Amount");
      adb("shell", "input", "text", "12,50");
      await sleep(700);
      await expectText(/^reported=12\.50$/, "reported value");
      await expectText(/^12,50$/, "text shown in the field");
      adb("shell", "input", "keyevent", "4"); // hide the keyboard
      await sleep(500);
    },
  ],
  [
    "the badge on a button counts presses",
    async () => {
      await tap("Filters");
      await tap("Filters");
      await expectText(/^badge=2$/, "badge state");
    },
  ],
  [
    "tabs follow their key, and a disabled tab ignores presses",
    async () => {
      await tap("Billing");
      await expectText(/^tab=billing$/, "tab state");
      await tap("Audit");
      await sleep(500);
      await expectText(/^tab=billing$/, "tab state after the disabled tab");
    },
  ],
  [
    "a drawer group opens to its sub-items",
    async () => {
      await tap("Reports");
      await expectText(/^Sales$/, "sub-item");
    },
  ],
  [
    "a bottom sheet opens with its actions and closes from its button",
    async () => {
      await tap("Open sheet");
      // Its state line sits behind the sheet's own window, out of the dump.
      await expectText(/^Apply$/, "sheet actions");
      await tap("Close");
      await expectGone("Apply", "sheet");
      await expectText(/^sheet=closed$/, "sheet state after closing");
    },
  ],
];

// The screen can take a moment to open after the trigger.
let ready = false;
for (let i = 0; i < 40 && !ready; i += 1) {
  ready = !!hasText(screen(), /^Native check$/);
  if (!ready) await sleep(1500);
}
if (!ready) console.log("FAIL the native check screen did not open");

let failed = 0;
if (ready) {
  // The measurement results sit at the top: photograph them before scrolling.
  await sleep(2000);
  photo("android-check.png");
  for (const [name, run] of steps) {
    try {
      await run();
      console.log(`PASS ${name}`);
    } catch (error) {
      failed += 1;
      console.log(`FAIL ${name}: ${error.message}`);
    }
  }
}
photo("android-check-after.png");
console.log(
  `${steps.length - failed}/${steps.length} interaction steps passed`,
);
