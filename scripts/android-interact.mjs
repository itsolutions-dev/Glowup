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

// An emulator given the CI's screen with `wm size 320x640` reports its physical size first: the
// override is the size taps and swipes are in.
const wmSize = adb("shell", "wm", "size");
const [screenW, screenH] = (
  wmSize.match(/Override size: (\d+)x(\d+)/) ??
  wmSize.match(/(\d+)x(\d+)/) ?? [0, 1080, 2400]
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
  return (
    [...xml.matchAll(/<node\s[^>]*>/g)]
      .map(([tag]) => {
        const attr = (name) =>
          (tag.match(new RegExp(`\\s${name}="([^"]*)"`)) ?? [])[1] ?? "";
        const [l, t, r, b] = (attr("bounds").match(/\d+/g) ?? [0, 0, 0, 0]).map(
          Number,
        );
        return {
          l,
          t,
          r,
          b,
          text: attr("text"),
          desc: attr("content-desc"),
          cls: attr("class"),
          focused: attr("focused") === "true",
          pkg: attr("package"),
          x: Math.round((l + r) / 2),
          y: Math.round((t + b) / 2),
        };
      })
      // React Native draws `overflow: hidden` by clipping the canvas, so Android still counts a view
      // scrolled out of its clip as visible; its accessible bounds come back clamped and upside down
      // (top below bottom), which can fall inside any box on screen. Such a node is not on screen.
      .filter((n) => n.r > n.l && n.b > n.t)
  );
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

/**
 * A swipe of `span` of the screen's height (0.4 by default); a short one nudges. At a quarter of the
 * width, not in the middle: on a 320 px screen the middle is over the pivot grid's numbers, which
 * scroll the grid instead of the page, and the steps that look for a field below it ran out of swipes.
 * A quarter is over the grid's column of labels, which does not scroll and leaves the drag to the page.
 */
const swipe = (direction, span = 0.4) => {
  const [from, to] =
    direction === "down"
      ? [0.5 + span / 2, 0.5 - span / 2]
      : [0.5 - span / 2, 0.5 + span / 2];
  const x = Math.round(screenW / 4);
  adb("shell", "input", "swipe", x, screenH * from, x, screenH * to, 300);
};

// Until the title is on screen: the page is long, and a fixed number of swipes stops short of the
// top once something is added at the end of it (the PDF page did, on Android 14).
const scrollToTop = async () => {
  for (let i = 0; i < 24; i += 1) {
    if (named(screen(), "Native check")) return;
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

/** Finds a node and scrolls until all of it is in the middle of the screen, so a tap inside it lands. */
const bring = async (predicate, what) => {
  for (let i = 0; i < 6; i += 1) {
    const node = await find(predicate);
    if (!node) {
      throw new Error(
        `${what} not on screen; on screen: ${describe(screen())}`,
      );
    }
    // The app bar covers the top 15% (a chart seen only through it was tapped on the bar, not the
    // chart). A short nudge: a whole swipe overshoots and the node flips between the two edges.
    if (node.t < screenH * 0.2) swipe("up", 0.15);
    else if (node.b > screenH * 0.85) swipe("down", 0.15);
    else return node;
    await sleep(600);
  }
  throw new Error(`${what} would not come into view`);
};

/**
 * Taps a node where it is found. With `centred`, it is brought into the middle first: found on the
 * last row of pixels, "Open sheet" was tapped at the very bottom of the screen on Android 14, where
 * the tap does not reach the page. Text fields are not brought: on the emulator the page would not
 * move while the field above still had the cursor, and the step gave up.
 */
const tapNode = async (predicate, what, centred = true) => {
  const node = centred ? await bring(predicate, what) : await find(predicate);
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
  await tapNode(field, `the ${label} field`, false);
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

/** Taps a chart where `at(box)` says and checks the state line its onSelect writes. */
const tapChart = async (summary, at, photoName, pattern, what) => {
  // The charts are near the top of the page: look for them from there, not from wherever the last step left it.
  await scrollToTop();
  const chart = await bring(
    (nodes) => nodes.find((n) => n.desc.startsWith(summary)),
    `the "${summary}" chart`,
  );
  const [x, y] = at(chart).map(Math.round);
  console.log(
    `  tap the chart at ${x},${y} (box ${chart.l},${chart.t} - ${chart.r},${chart.b})`,
  );
  adb("shell", "input", "tap", x, y);
  await sleep(700);
  photo(photoName);
  await expectText(pattern, what);
};

steps.push(
  [
    "a tap on a dense bar chart picks a category",
    // Inside the plot, a little right of the middle: any category will do, none is not one.
    () =>
      tapChart(
        "Native dense",
        (c) => [c.l + (c.r - c.l) * 0.55, c.t + (c.b - c.t) * 0.4],
        "android-chart-bars.png",
        /^chart=\d+$/,
        "chart state",
      ),
  ],
  [
    "a tap on a donut slice picks that part",
    // Nine o'clock on the ring, which is the "open" part (108 to 288 degrees clockwise from the top).
    () =>
      tapChart(
        "Native parts",
        // The ring is centred in the box and its middle is about 0.28 of the box's height from the centre.
        (c) => [(c.l + c.r) / 2 - (c.b - c.t) * 0.28, (c.t + c.b) / 2],
        "android-chart-donut.png",
        /^part=open$/,
        "part state",
      ),
  ],
);

/** The first node inside a box (the grid's) that passes the test. */
const within = (nodes, box, test) =>
  nodes.find(
    (n) =>
      n.l >= box.l - 2 &&
      n.r <= box.r + 2 &&
      n.t >= box.t - 2 &&
      n.b <= box.b + 2 &&
      test(n),
  );

const pivotGrid = () =>
  bring(
    (nodes) => nodes.find((n) => n.desc === "Pivot grid"),
    "the pivot grid",
  );

/**
 * Taps the first arrow with this label inside the pivot grid. With `move`, the finger slides that
 * many pixels before it lifts, as a real one does: `input tap` sends no move at all.
 */
const tapArrow = async (label, move = 0) => {
  const box = await pivotGrid();
  const arrow = within(screen(), box, (n) => n.desc === label);
  if (!arrow) {
    throw new Error(
      `no "${label}" arrow in the grid; on screen: ${describe(screen())}`,
    );
  }
  console.log(
    `  tap the ${label} arrow at ${arrow.x},${arrow.y}${move ? `, moving ${move} px` : ""} (grid ${box.l},${box.t} - ${box.r},${box.b})`,
  );
  if (move) {
    adb(
      "shell",
      "input",
      "swipe",
      arrow.x,
      arrow.y,
      arrow.x + move,
      arrow.y + move,
      120,
    );
  } else {
    adb("shell", "input", "tap", arrow.x, arrow.y);
  }
  await sleep(700);
};

/** A drag up the numbers of the grid (the fixed columns take up its left and do not take a drag). */
const dragGrid = (box) => {
  const x = Math.round(box.l + (box.r - box.l) * 0.75);
  adb(
    "shell",
    "input",
    "swipe",
    x,
    Math.round(box.b - 20),
    x,
    Math.round(box.t + 60),
    400,
  );
};

steps.push(
  [
    "a tap on a pivot arrow closes a group and opens it again",
    async () => {
      await scrollToTop();
      // The first arrow is the first site's: it hides its four categories (31 rows become 27).
      await tapArrow("Collapse");
      photo("android-pivot.png");
      await expectText(/^pivot=27$/, "pivot rows after closing the first site");
      await tapArrow("Expand");
      await expectText(/^pivot=31$/, "pivot rows after opening it again");
    },
  ],
  [
    "the pivot header stays put while the rows scroll, and an arrow still answers after the scroll",
    async () => {
      const box = await pivotGrid();
      const total = (nodes) => within(nodes, box, (n) => n.text === "Total");
      const before = total(screen());
      if (!before) {
        throw new Error(
          `the header is not on screen; on screen: ${describe(screen())}`,
        );
      }
      // A drag up the grid: its rows move, its header must not.
      dragGrid(box);
      await sleep(900);
      photo("android-pivot-scrolled.png");
      const after = total(screen());
      if (!after || Math.abs(after.t - before.t) > 6) {
        throw new Error(
          `the header moved: top ${before.t} -> ${after ? after.t : "gone"}`,
        );
      }
      if (within(screen(), box, (n) => n.text === "Sum Total of Count")) {
        throw new Error(
          "the rows did not scroll: the first row is still there",
        );
      }
      // An arrow of the rows now in view: the touch must reach it after the animated move.
      await tapArrow("Collapse");
      await expectText(
        /^pivot=27$/,
        "pivot rows after a tap following the scroll",
      );
    },
  ],
  [
    "after a scroll, an arrow answers a tap whose finger moves a little",
    async () => {
      // Pressability measures the arrow where the JavaScript side last saw it, before the native
      // animation moved it: a finger that moved out of that zone used to drop the press.
      const line = await find((nodes) => hasText(nodes, /^pivot=\d+$/));
      if (!line) throw new Error("the pivot=<rows> line is not on screen");
      const rows = Number(line.text.slice("pivot=".length));
      const box = await pivotGrid();
      dragGrid(box);
      await sleep(900);
      await tapArrow("Collapse", 3);
      await expectText(
        new RegExp(`^pivot=${rows - 4}$`),
        "pivot rows after a moving tap on Collapse",
      );
      await tapArrow("Expand", 3);
      await expectText(
        new RegExp(`^pivot=${rows}$`),
        "pivot rows after a moving tap on Expand",
      );
    },
  ],
);

steps.push([
  "the sample PDF page is on screen, drawn at the viewer's size",
  async () => {
    // The page is the last thing on the screen: go to the end, wherever the step before left the page.
    for (let i = 0; i < 8; i += 1) {
      swipe("down");
      await sleep(400);
    }
    photo("android-pdf.png");
    const page = named(screen(), "Sample PDF page");
    if (!page) {
      throw new Error(
        `the page is not on screen; on screen: ${describe(screen())}`,
      );
    }
    console.log(
      `  the page is ${page.r - page.l} x ${page.b - page.t} px on screen`,
    );
  },
]);

// The screen can take a moment to open after the trigger.
let ready = false;
for (let i = 0; i < 80 && !ready; i += 1) {
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
  `${ready ? steps.length - failed : 0}/${steps.length} interaction steps passed`,
);
