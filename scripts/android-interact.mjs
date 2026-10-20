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

// The emulator has a hardware keyboard, so Android can be told not to show the soft one. Tried
// before: closing it with Enter, Back or a button in the page; the page moves up when it opens and
// the button went out of view.
adb("shell", "settings", "put", "secure", "show_ime_with_hard_keyboard", "0");

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
      cls: attr("class"),
      focused: attr("focused") === "true",
      pkg: attr("package"),
      x: Math.round((l + r) / 2),
      y: Math.round((t + b) / 2),
    };
  });
};

const named = (nodes, label) =>
  nodes.find((n) => n.text === label || n.desc === label);
const hasText = (nodes, pattern) =>
  nodes.find((n) => pattern.test(n.text) || pattern.test(n.desc));

/** What is on screen, for a failure message: a miss is useless without it. */
const describe = (nodes) =>
  [...new Set(nodes.flatMap((n) => [n.text, n.desc]).filter(Boolean))]
    .slice(0, 30)
    .join(" | ");

const swipe = (direction) => {
  const [from, to] = direction === "down" ? [0.7, 0.3] : [0.3, 0.7];
  adb(
    "shell",
    "input",
    "swipe",
    screenW / 2,
    screenH * from,
    screenW / 2,
    screenH * to,
    300,
  );
};

const scrollToTop = async () => {
  for (let i = 0; i < 6; i += 1) {
    swipe("up");
    await sleep(300);
  }
};

/**
 * Looks for something where it is: on screen now, then further down the page,
 * then back up. A step can start anywhere, and the page only scrolls one way
 * per swipe, so looking down alone never finds what a previous step scrolled
 * past.
 */
const find = async (predicate, tries = 6) => {
  let hit = predicate(screen());
  if (hit) return hit;
  for (const direction of ["down", "up"]) {
    for (let i = 0; i < (direction === "down" ? tries : tries * 2); i += 1) {
      swipe(direction);
      await sleep(600);
      hit = predicate(screen());
      if (hit) return hit;
    }
  }
  return null;
};

const tapNode = async (predicate, what) => {
  const node = await find(predicate);
  if (!node) {
    throw new Error(`${what} not on screen; on screen: ${describe(screen())}`);
  }
  console.log(
    `  tap ${what} at ${node.x},${node.y} (screen ${screenW}x${screenH})`,
  );
  adb("shell", "input", "tap", node.x, node.y);
  await sleep(700);
};

const tap = (label) => tapNode((nodes) => named(nodes, label), `"${label}"`);

const expectText = async (pattern, what) => {
  for (let i = 0; i < 3; i += 1) {
    if (hasText(screen(), pattern)) return;
    await sleep(500);
  }
  // A state line can sit below the fold: look for it as well.
  if (await find((nodes) => hasText(nodes, pattern))) return;
  throw new Error(
    `${what}: ${pattern} not found; on screen: ${describe(screen())}`,
  );
};

const expectGone = async (label, what) => {
  await sleep(700);
  if (named(screen(), label))
    throw new Error(`${what}: "${label}" still there`);
};

// Android key codes: 0-9 are 7-16, "," is 55, "." is 56, a-z are 29-54.
const keyCode = (char) =>
  char === ","
    ? 55
    : char === "."
      ? 56
      : /[0-9]/.test(char)
        ? 7 + Number(char)
        : 29 + (char.charCodeAt(0) - 97);

/**
 * Taps the text field with this label, types with key events and checks what the screen then says.
 * No dump between the tap and the keys (a dump can take the focus off the field). The soft
 * keyboard is switched off for the whole run (see below), so nothing covers the page and there is
 * nothing to close: the keys are hardware key events and reach the focused field all the same.
 */
const typeInto = async (label, text, photoName, expectations) => {
  await scrollToTop();
  // By label, not by position: the page scrolls, and the first field in view is not always the same.
  const field = (nodes) =>
    nodes.find((n) => n.cls.endsWith("EditText") && n.desc.startsWith(label));
  await tapNode(field, `the ${label} field`);
  await sleep(1500);
  for (const char of text) {
    adb("shell", "input", "keyevent", keyCode(char));
    await sleep(150);
  }
  await sleep(700);
  photo(photoName);
  for (const [pattern, what] of expectations) await expectText(pattern, what);
};

const steps = [
  [
    "a plain text field takes keys (the control for the next two steps)",
    () =>
      typeInto("Plain field", "12", "android-plain.png", [
        [/^plain=12$/, "plain value"],
      ]),
  ],
  [
    "the library's text Input takes keys",
    () =>
      typeInto("Name", "ab", "android-name.png", [[/^name=ab$/, "name value"]]),
  ],
  [
    "the search field the PDF viewer uses takes keys",
    () =>
      typeInto("Search the PDF", "hello", "android-search.png", [
        [/^query=hello$/, "query value"],
      ]),
  ],
  [
    "a decimal comma is typed and reported as a plain number",
    () =>
      typeInto("Amount", "12,50", "android-typed.png", [
        [/^reported=12\.50$/, "reported value"],
        [/^12,50$/, "text shown in the field"],
      ]),
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
      // The group animates open: wait longer than its 200 ms, and say what is there.
      await sleep(1500);
      console.log(`  after opening: ${describe(screen())}`);
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
let index = 0;
if (ready) {
  // The measurement results sit at the top: photograph them before scrolling.
  await sleep(2000);
  photo("android-check.png");
  for (const [name, run] of steps) {
    index += 1;
    try {
      await run();
      console.log(`PASS ${name}`);
    } catch (error) {
      // A failing step is photographed where it stopped, not at the end.
      photo(`android-step-${index}.png`);
      failed += 1;
      console.log(`FAIL ${name}: ${error.message}`);
    }
  }
}
photo("android-check-after.png");
console.log(
  `${steps.length - failed}/${steps.length} interaction steps passed`,
);
