# design-sync notes — @its/glowup-ui

Repo-specific gotchas for future `/design-sync` runs. Read this before anything else.

## Shape and pipeline

- Shape is `package` (no Storybook anywhere in the repo).
- Monorepo. The DS is `packages/ui` (`@its/glowup-ui`); `apps/playground` is the demo app.
- `--node-modules` must be the **repo root** `node_modules`. `packages/ui/node_modules`
  exists but is empty (npm workspaces hoists everything).
- Build order for a re-sync:
  1. `npm run build` (bob → `packages/ui/lib/{commonjs,module,typescript}`)
  2. `node .design-sync/make-web-barrel.mjs`
  3. `node .design-sync/split-docs.mjs`
  4. `node .design-sync/prebuild-web-entry.mjs`
  5. `node .ds-sync/package-build.mjs --config .design-sync/config.json
--node-modules ./node_modules --entry ./packages/ui/.design-sync-entry.mjs --out ./ds-bundle`
  6. `node .ds-sync/package-validate.mjs ./ds-bundle`

## React Native → web is the whole problem

Claude Design renders in a browser; `@its/glowup-ui` is Expo React Native. The converter's
esbuild has no `react-native` alias, no `.web.js` extension priority, no JSX-in-`.js`
loader and no asset loaders — all four are required here. Rather than fork
`lib/bundle.mjs` (the app contract surface), the RN→web work happens in a **pre-bundle**:

- `.design-sync/prebuild-web-entry.mjs` resolves the whole DS into ONE browser-safe ESM file
  at `packages/ui/.design-sync-entry.mjs` (~2.9 MB), which is what `--entry` points at.
  The converter then has nothing left to resolve but `react`/`react-dom`.
- What it does: `react-native` → `react-native-web`; `resolveExtensions` puts `.web.*`
  first (react-native-svg / react-native-safe-area-context ship native specs that import
  Flow-typed `react-native/Libraries/*`); `.js` uses the `jsx` loader (`@expo/vector-icons`
  ships untranspiled JSX); fonts/images inline as data URIs (the MaterialCommunityIcons
  `.ttf` rides along, so icons render without any `cfg.extraFonts` wiring); `node:async_hooks`
  is stubbed (expo-font's SSR path); a `process` shim banner is prepended (expo-modules-core
  and expo-asset read `process.*` at module scope — without it EVERY preview threw
  `ReferenceError: process is not defined`).
- **`packages/ui/.design-sync-entry.mjs` is generated build output, not source.** It lives
  inside the package only because the converter walks up from `--entry` to find the
  package.json that defines `PKG_DIR`; put it anywhere else and PKG_DIR resolves to the
  monorepo root, which yields `[ZERO_MATCH]`.

## What does NOT ship, and why

- `DrawerNavigation`, `StackNavigation`, `CustomDrawerContent` — **no longer in the DS at
  all.** They were removed from the library in `0.5.0` and now live in the playground
  (`apps/playground/navigation/`), so there is nothing to exclude any more; their
  `componentSrcMap: null` entries are gone with them. They had been excluded because
  `@react-navigation/*` → `react-native-screens` has a commonjs build with unresolvable
  platform-split requires (`./TabsHost`, `./TabsScreen`) and Flow native specs, and because
  navigator wrappers needing a `NavigationContainer` + route array were poor preview material
  regardless. Nothing else in the package pulls `@react-navigation/*`.
- `Alert` — the imperative `Alert(title, message, buttons)` singleton, not a component.
  Excluded; it is documented in `conventions.md` instead.
- `SafeAreaProvider` — re-exported from the barrel purely so `cfg.provider` can mount it
  (AppBar and SpeedDial read safe-area insets and throw without it). Excluded from the
  component list.
- `DateTimePicker` is pinned to `DateTimePicker.web` in the barrel. Since the 2026-09-09
  Material 3 rebuild the native implementation no longer pulls
  `react-native-modal-datetime-picker` (it is a plain RN `Modal`, which react-native-web
  does bundle), so the pin is now belt-and-braces rather than load-bearing —
  `prebuild-web-entry.mjs` already puts `.web.*` first in `resolveExtensions`, which is
  also what makes the `DatePicker` / `DateRangePicker` / `DatePickerInput` / `TimePicker`
  wrappers resolve to the web surface through their bare `./DateTimePicker` import.

## Provider chain

`SafeAreaProvider` › `ThemeProvider` › `AlertProvider`. All three are required:
`ThemeProvider` supplies every colour/type/spacing token (nothing is styled without it),
`AlertProvider` backs `ConfirmDialog`/`Alert`, `SafeAreaProvider` backs AppBar/SpeedDial.

## Lib forks (`cfg.libOverrides`)

- `source-kit.mjs` — adds `list`, `modal`, `progress`, `tab`, `togglebutton` to
  `GENERIC_DIR`. Those are file-organisation dirs under `src/components/`, not DS groups;
  without the fork `ConfirmDialog` lands in `modal/` while `Modal` itself lands in
  `feedback-overlays/`. Real grouping comes from the `category` frontmatter, and that only
  applies when the src-derived group is generic.
- `dts.mjs` — allowlists `FAB` in `isComponentName`. The ALL-CAPS-means-a-constant rule
  silently dropped a real Material component.
- Both forks need `.design-sync/node_modules` → `.ds-sync/node_modules` (they import
  `ts-morph`). Recreate it per clone:
  `ln -sfn ../.ds-sync/node_modules .design-sync/node_modules` (Git Bash on Windows needs
  `MSYS=winsymlinks:nativestrict`, or use `cmd //c mklink /J`).

## Docs and groups

`packages/ui/src/components/components.md` is a 670-line spec with a `### <Component>`
section per component under `## N. <Group>` headings. `.design-sync/split-docs.mjs`
explodes it into `.design-sync/docs/<Name>.md` (with `category:` frontmatter, which drives
the card group) plus `.design-sync/guidelines/design-system.md` (the M3 token tables,
type scale and shape scale). Seven components predate the spec and have hand-written docs
in the script's `EXTRA_DOCS` map — add to that map, never to `.design-sync/docs/` directly,
because the script wipes that directory on every run.

## Known render warns (triaged, expected — not new)

- `[CSS_RUNTIME]` on `styles.css` and `_ds_bundle.css`. Correct: react-native-web injects
  all styles at runtime. There is no stylesheet to point `cfg.cssEntry` at, and
  `providers/theme.json` is JSON consumed by `ThemeProvider`, not CSS custom properties —
  so `tokens/` is legitimately empty.
- `[RENDER_THIN]` on `ConfirmDialog` — `maxHeight: 0` with DOM content present. Correct:
  the dialog is a react-native-web `Modal`, i.e. a real `createPortal` into
  `document.body`, so nothing measurable stays inside the card root. The screenshot is a
  full, correctly styled M3 dialog (verified 2026-09-09). Any portal-based card with
  `cardMode: single` can print this; `Modal`, `BottomSheet`, `Popover` and `Menu` happen
  not to because their compositions leave measurable content behind.
- esbuild `direct-eval` warning on `eval("require")("node:crypto")` inside the prebundled
  entry (expo-modules-core's uuid path). Harmless in a browser; the code path isn't taken.

## Install

`package-lock.json` is **not committed** (see commit a4bfae7), so `npm ci` never applies
here — use plain `npm install` from the repo root. A stale local lockfile that predates
`packages/ui`'s `@types/react-dom` devDependency makes `bob build` fail its typescript
target with `TS7016: Could not find a declaration file for module 'react-dom'` on
`DateTimePicker.web.tsx`, reported only as `Error: Failed to build definition files`.
`npm install` fixes it.

`esbuild`'s postinstall is blocked by this machine's script policy; the converter deps in
`.ds-sync/` need `npm install-scripts approve esbuild` once, or esbuild's binary is
missing.

## What is generated vs. committed under `.design-sync/`

Committed (the real sync inputs): `config.json`, `NOTES.md`, `conventions.md`,
`previews/`, `overrides/`, and the three generator scripts `make-web-barrel.mjs`,
`split-docs.mjs`, `prebuild-web-entry.mjs`.

Gitignored because a committed script regenerates them: `web-barrel.mjs`, `docs/`,
`guidelines/`, and `packages/ui/.design-sync-entry.mjs`. Run the build order above after
a fresh clone and they reappear.

## Capture-harness patch (must be re-applied after every `cp -r` of the skill scripts)

`.ds-sync/package-capture.mjs` pinned the page clock with
`page.clock.setFixedTime(...)`. Playwright's fake clock also fakes `Date.now` /
`performance.now`, which is **react-native `Animated`'s timebase** — every frame delta is
0, so mount animations never advance and the grading sheet shows a `t=0` render the
product never displays. Proven with an A/B on `Tabs` at `activeTab={2}`: frozen → the
indicator stays under tab 0; advanced → it lands on tab 2. It also hits Carousel,
Snackbar entrance, LinearProgress, CircularProgress and Skeleton shimmer.

The patch (two edits, both comment-marked `GLOWUP PATCH`):

1. replace `setFixedTime` with `page.clock.install({ time: ... })` — `setFixedTime` alone
   cannot be advanced — keeping `setFixedTime` as the fallback for older playwright;
2. add `await page.clock.runFor(2000)` at the end of `settle()`.

This keeps the wall clock deterministic (date-rendering components still show
2024-05-15) while letting animations finish. `package-validate.mjs` does NOT pin the
clock, so the _shipped_ cards were never affected — this is a grading-fidelity fix only.

## Capture environment

- The capture browser's `navigator.language` is **it-IT**, which `DateTimePicker` reads
  through `getDeviceLocale()` - date fields format as `3 giu 2024` and relative days come
  out `Ieri / Oggi / Domani`. Since the Material 3 rebuild it also drives the **typed-entry
  field order** (`DD/MM/YYYY`, and `22/11/2026` parses as 22 November) and the **12h vs 24h
  clock face** (it-IT is 24-hour, so the AM/PM switch is absent unless a story passes
  `locale="en-US"`). Deterministic, so it is fine, but don't mistake any of it for a bug.
- **Flag emoji do not render**: headless Chromium has no flag-emoji font, so
  `LanguageSelector`'s four flags fall back to their regional-indicator letter pairs
  (`US`, `ES`, `IT`, `FR`). Legible and not misleading; fixing it would mean shipping an
  emoji font with the capture page.
- Verified icon names (checked against
  `node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/MaterialCommunityIcons.json`
  - cheaper than a box glyph in a sheet): `plus`, `minus`, `close`, `check`, `download`,
    `refresh`, `magnify`, `arrow-right`, `page-first`, `page-last`, `menu-down`, `menu-up`,
    `pound`, `cog`, `home`, `domain`, `translate`, `bookshelf`, `chart-box`,
    `account-group`, `slash-forward`, `cellphone-link`, `theme-light-dark`,
    `email-outline`, `lock-outline`, `eye-off-outline`, `home-outline`, `flag-outline`,
    `tag-outline`, `clock-outline`, `message-outline`, `inbox-outline`,
    `calendar-blank-outline`, `cloud-off-outline`, `check-circle-outline`,
    `account-multiple-outline`, `folder-multiple-outline`, `file-search-outline`,
    `pencil-outline`, `chevron-left`, `chevron-right` (the last three added by the Material 3
    picker rebuild: the calendar/keyboard toggle and the month chevrons).

## Card presentation (`cfg.overrides`)

36 of the 55 components tripped `[GRID_OVERFLOW] wide` on the first full validate: the
compositions were built to ~400px wrappers, which is wider than the product's default
grid cell. All 36 carry `{"cardMode": "column"}` (one story per row at full card width) -
`DataGrid` too, at 560px. The five portal overlays carry `cardMode: single` with the
viewports listed under "Portal vs sibling", and `AlertProvider` /
`AlertProviderWrapper` carry `cardMode: single` with a `primaryStory` and deliberately
**no** `viewport` (an explicit viewport is part of the grade key; adding one would
discard their verdicts for no visual gain).

## Playwright

Cached chromium builds on this machine are `chromium-1234` and `chromium-1223`, which pin
**playwright 1.62.x** and 1.60.0 respectively. Install `playwright@1.62.1` into `.ds-sync/`
with `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` — no 200 MB download needed. A version mismatch
fails with `browserType.launch: Executable doesn't exist`.

## Component quirks that shape every preview

Learned while authoring; a future sync should not have to rediscover them.

- **Layout glue is plain `<div>` + inline `React.CSSProperties`.** `react-native` is not
  resolvable from a preview file. react-native-web renders real DOM, so divs compose fine.
- **Two `Typography` siblings in a plain `<div>` run onto one line** — RNW renders `Text`
  as `inline-flex`. Any wrapping div needs `display: flex; flexDirection: column`. Direct
  children of a DS `View` are fine.
- **`Typography` does not inherit `text-align` from a div**; set it on the Typography.
- **`Divider` always renders line + content-gap + line**, even with no children, and
  `contentSpacing` defaults to 16 — so a bare `<Divider />` shows a 32px break in the
  middle. Use `<Divider contentSpacing={0} />` for a plain rule. `inset` applies per-line
  and therefore _widens_ that gap; only combine it with a labelled Divider.
- **`Divider orientation="vertical"` sets `flex: 1`**, which in a flex row grows it
  horizontally. Wrap: `<div style={{ width: 1, alignSelf: "stretch", display: "flex" }}>`.
- **`FAB` is unconditionally `position: absolute`** and needs a positioned, sized ancestor
  (a `Paper` works). To lay FABs out inline, re-declare position through `style` — the DS
  does exactly that in `SpeedDial`'s internal `fab` style.
- **`Badge` takes no children and is `position: absolute` with no offsets** — compose it
  inside a relative anchor and pass `style={{ top, right }}`. `IconBadge` is
  self-contained by contrast.
- **`Tooltip` has no controlled `visible` prop** — it opens on real hover only. The
  Tooltip preview mounts a small wrapper that dispatches a genuine
  `PointerEvent("pointerenter", { pointerType: "mouse" })` at the anchor, which is what
  RNW's `useHover` listens for; that drives the component's own state rather than faking
  a visual. Delete the wrapper if a `visible`/`defaultVisible` prop ever lands.
- **`TabContent` has `flex: 1`** and collapses without a wrapper of explicit height.
- **`Carousel`**: don't pass `height` — the page wrapper doesn't stretch its child, so the
  slide floats at the top and the dots get pushed away. Put `minHeight` on the slide.
- **`NavigationBar` strips a trailing `-outline`** from the active item's icon, so give
  items the outline name and pick glyphs that have both variants.
- **`Stepper`'s `Step.icon` only shows for incomplete steps**; completed steps always draw
  the check glyph.
- `Chip` `filled` and `tonal` are visually very close in light mode — token question, not
  a preview bug.
- `Avatar` `rounded` vs `square` is indistinguishable below ~40px; sweep the variant axis
  at >=56px.
- **`useTheme()` is exported from the barrel and works inside a preview** against the
  already-mounted provider - `theme.colors` / `.typography` / `.spacing` / `.shape` /
  `.isDark` all read cleanly, so colour-axis cells never need raw hexes.
- **Portal vs sibling, tested not assumed.** `Modal`, `ConfirmDialog`, `BottomSheet`,
  `Popover` and `Menu` all route through react-native-web's `Modal`, which is a real
  `createPortal` into `document.body` - the card's `.ds-single` `translateZ(0)`
  containing block does NOT contain a portal, so each needs `cardMode: single` plus a
  card-sized `viewport`. `Snackbar` and `Tooltip` are absolutely-positioned _siblings_
  (a `position: relative` wrapper with explicit height keeps them in-card) and `Banner`
  is plain inline flow - none of those three need an override.
- **RNW's `Modal` focus-traps on open**, so dialog cards legitimately show a focus ring
  on the first focusable child. That is the product's real open state; don't suppress it,
  but do put the primary action first so the ring doesn't land somewhere that reads as an
  error.
- **`Alert()` is bound by `AlertProviderWrapper`, which `cfg.provider` does not mount** -
  so `Alert()` is a no-op warning inside an ordinary card. A preview that needs a live
  dialog mounts the `AlertProvider` > `AlertProviderWrapper` stack itself, and must queue
  the call through `setTimeout(..., 0)`: the wrapper's effect (which assigns the
  module-level `alertRef`) runs _after_ its children's.
- **`Skeleton` on an elevated `Paper` is near-invisible** - placeholder
  `surfaceContainerHighest` (#EDE7F0) vs `Paper elevation={1}` `surfaceContainerLow`
  (#F7F2FA) is a ~4% delta and the pulse takes it below that. Put skeletons on `surface`
  (`<Paper elevation={0} outline>`).
- **`CircularProgress` has no determinate mode** - only `size`/`strokeWidth`/`color`/
  `duration`. `Spinner` is a _number stepper_, not a loading spinner.
- **`Select` renders `label` only for `variant="outlined"`**; the filled closed field is
  intentionally label-less.
- `Select`, `Spinner` and `DateTimePicker` each carry their own `marginBottom: 20` - don't
  add `gap` to a column of them. `Select`, `SearchBar`, `DateTimePicker`, `LinearProgress`
  and `EmptyState` are all `width: 100%` and need a width-constrained parent.
- **`ListItem` takes `children`, not `title`.**
- **The date/time pickers are one surface on every platform.** Since the Material 3
  rebuild there is no OS picker underneath, so what the capture shows on web is what an
  iOS or Android build shows too - the previous "native looks different" caveat is gone.
- **`DateTimePicker`'s `value`/`onChange` shape follows `selectionMode`**: a `Date | null`
  for `single`, `{ startDate, endDate }` for `range`, a `Date[]` for `multiple`. The props
  type is a union discriminated on it, so a story that passes the wrong pair fails to
  typecheck rather than rendering blank.
- **`Calendar` reports through three different callbacks** - `onChange`, `onRangeChange`,
  `onDatesChange` - matching the same `selectionMode`. Passing only `onChange` to a range
  calendar silently does nothing.
- **`Calendar` defaults to `scrollMode="endless"`**, a virtualized `FlatList` roughly 320px
  tall that titles each month and hides the neighbouring months' days. For a still
  capture `scrollMode="paged"` reads better: one month, chevrons, a month dropdown, and
  outside days greyed in. The previews use `paged` for every axis except the pair that
  exists to contrast the two.
- **`ClockPicker` is 256px of dial plus a ~76px readout row** and centres itself; give it a
  `Paper` with padding rather than letting it float on the card background.
- **The 12h/24h face is locale-derived.** `use24HourClock` only forces the 24-hour face;
  it cannot force 12-hour. A story that wants the AM/PM switch must pass a 12-hour
  `locale` (the capture browser is it-IT, which is 24-hour).

## DS gaps found while authoring (real component bugs, not preview problems)

Worth fixing in `packages/ui`, then re-adding the cells the gap forced out:

1. **`Toggle` has no `disabled` visual treatment** — `disabled` blocks the press but leaves
   track/thumb colours and opacity untouched, so a disabled Toggle is pixel-identical to
   an enabled one. Every sibling (Checkbox, RadioButton, RadioGroup, Slider, Rating) dims
   to 38%. Cost: `Toggle`, `DrawerPreferenceItem` disabled cells dropped.
2. **`FAB` has the same gap** — accepts `disabled`, paints nothing. Cost: `FAB.Disabled`
   dropped rather than teach a design agent the wrong thing.
3. **`SpeedDial`'s expanded state is unreachable from props** — `open` is internal
   `useState` and the actions animate from an `Animated.Value` starting at 0. Needs a
   controlled `open`/`defaultOpen` prop. Cost: only the resting trigger previews.
4. **`ListItem` is a text-only centred tile, not an M3 list row** — `children` go into one
   `<Text numberOfLines={1}>`; there is no leading, trailing or secondary slot. Needs
   `leading`/`trailing`/`secondary` props.
5. **`Tooltip` text shrinks to min-content on web** — the tip View sets
   `whiteSpace: nowrap` but the inner RNW `Text` re-applies `pre-wrap`, so the tip
   collapses to its longest word and `numberOfLines={2}` ellipsises anything over ~3
   words. Previews use 1-2 word content as a result.
6. **`RadioGroup.d.ts` references `RadioOption` without defining it** — the type is
   declared in `RadioButton.tsx` and re-exported; the extractor misses the cross-file
   re-export. Shape is `{ id, label, value, disabled? }`. Fixable with `cfg.dtsPropsFor`.
7. **`Checkbox` / `RadioButton` apply `marginLeft: 12` to the label regardless of
   `labelPosition`**, so a left label sits asymmetrically.
8. **`Input` (and therefore `NumericInput`) has no `disabled`/`readonly` visual
   treatment** - `Input.tsx` maps them to `editable` / `readOnly` and
   `accessibilityState` only, so a disabled field is pixel-identical to an enabled one.
   Same family as (1) and (2). Cost: those cells dropped from `Input` and `NumericInput`.
   `Input.tsx` also still carries a stray `// BISECT-TEST: glow disabled` debug comment.
9. **`Popover` is permanently 200px wide** unless `matchAnchorWidth` is set:
   `pos.width = contentSize.width || 200` is applied to the card _before_ the content is
   measured, so the content lays out inside 200px, `onLayout` reports 200 back, and the
   width never grows. Any label over ~168px wraps or truncates. Hits `Menu` too, whose
   item labels are `numberOfLines={1}`. Fix: measure the content off-screen at its
   natural width first.
10. **`Menu`'s `dividerAbove` renders as a split rule** - `Menu.tsx` emits a bare
    `<Divider />`, so `contentSpacing: 16` paints line + 32px gap + line inside the menu.
    Fix is `<Divider contentSpacing={0} />` in `Menu.tsx`; the prop is currently unused in
    the previews because it looks like a defect.
11. ~~**`Select`'s dropdown and `DateTimePicker`'s calendar cannot be previewed open**~~ -
    fixed on both. `Select` got `defaultOpen` in the 2026-09-09 in-flight batch;
    `DateTimePicker` declared the prop but the native implementation ignored it
    (`useState(false)`), and the Material 3 rebuild made both platforms honour it.
    Not taken up in the preview: the open web surface portals to `document.body` at
    `position: fixed`, so it needs `cardMode: single` plus a viewport, and the card is
    `cardMode: column` for the eight closed-field stories. Measured height of the open
    date popover is 672px, so a `single` card would want roughly
    `{"cardMode": "single", "viewport": "480x760"}` - unverified, never captured.
    The dialog body itself is previewed instead, inline and portal-free, by the
    `Calendar` and `ClockPicker` cards.
12. **`ConfirmDialog` has no destructive/error treatment** - a delete confirmation renders
    the same filled-primary action as a benign one.

## States deliberately not previewed

Hover, press, ripple and drag are pointer-driven and cannot be captured statically —
that covers the `getGlowStyles` glow on Chip/Card/FAB/ToggleButton/Checkbox/RadioButton/
Toggle, `Slider` drag, `Rating` tap-to-clear, `Accordion`/`ListItem` hover, and
`Carousel`'s `autoPlayInterval` transitions. `Avatar source` (remote image) is skipped —
no bundled asset; the initials and icon fallbacks are covered instead.

Also skipped, each for a stated reason rather than convenience: `toggleTheme()` (the
light-to-dark swap is interaction-only; the cards show the light side plus a live
`theme.isDark` readout, and `theme.json` documents the dark palette); `Skeleton`'s
`duration`/`animate` props (the pulse is opacity-only, so a still catches an arbitrary
phase and a side-by-side would read as "shorter duration = lighter", which is false - a
`borderRadius` sweep replaced that cell); `Modal`'s `animationType` (all three settle to
the same resting frame); `Popover`'s flip-above-anchor branch; `BottomSheet`'s
drag-to-dismiss; and the native `Alert.alert` branch of `AlertProvider`, which cannot
render in a browser at all and is described in copy instead of mocked up.

`Snackbar` previews pass `duration={0}`; otherwise its 4s auto-hide races the 2000ms
clock advance and the resting state becomes a coin flip.

## Upload status (imported 2026-09-09)

Uploaded. Project: **Glowup Design System**, `projectId`
`c02682fc-2db9-465f-b4c0-1d7581b437ec` (pinned in `config.json`) —
https://claude.ai/design/p/c02682fc-2db9-465f-b4c0-1d7581b437ec

The 2026-09-08 run built and graded everything but could not upload: `/design-login`
grants the design-system authorization only from an **interactive** `claude` terminal and
that run was headless. The 2026-09-09 run did exactly what that note predicted — all 55
grades came back `carried forward` with zero cleared, so it was rebuild + validate +
upload with no re-verification. 284 files uploaded (283 content + sentinel + anchor).
`package-validate.mjs` exited 0.

Two things worth knowing for the next run:

- **The staged `.ds-sync/` scripts were already byte-identical to the bundled skill**
  (skill build 2.1.265) except for the capture-clock patch below, so the `cp -r` was
  skipped deliberately — re-copying would have silently reverted that patch. Diff before
  copying; only copy what actually differs.
- **`npm run build` (bob) was skipped**: no file under `packages/ui/src` was newer than
  `packages/ui/lib/module/index.js`. The three repo generators (`make-web-barrel`,
  `split-docs`, `prebuild-web-entry`) were re-run anyway — they are cheap and
  deterministic.

## In-flight source fixes at import time (2026-09-09, 00:06+)

While the upload was running, 16 files under `packages/ui/src` were edited in parallel —
addressing most of the "DS gaps" list above: `disabled` opacity on `Toggle`/`FAB`,
`Popover` width measurement, `Menu`'s `<Divider contentSpacing={0} />`, `defaultOpen` on
`Select` and `SpeedDial`, `Tooltip` `width: max-content`, and `leading`/`trailing`/
`secondary` slots on `ListItem`.

**The uploaded bundle predates them**: it was built from `packages/ui/lib` (bob output of
2026-09-08 16:33), so it is faithful to the last build, not to current `src`. Consequences
for the next run:

- Run `npm run build` first — the mtime shortcut used this run will (correctly) no longer
  apply.
- **`conventions.md`'s "Known gaps — do not design around them" section goes stale.** Every
  claim in it is about a gap being fixed here; re-validate that section against the fresh
  build and cut what no longer reproduces.
- Gap (11) becomes previewable: with `defaultOpen`, `Select`'s dropdown and `SpeedDial`'s
  expanded stack can finally be captured — see the suggested overrides in the gaps list.
- The `ListItem` preview is written against the text-only tile ("`ListItem` takes
  `children`, not `title`"); the new slots deserve new cells.

## Material 3 picker rebuild (2026-09-09, after the upload)

`DateTimePicker` was rebuilt on the Material 3 spec, modelled on
`react-native-paper-dates`, and the OS pickers were dropped. **The uploaded bundle
predates it** - like the in-flight fixes above, it was built from `packages/ui/lib`. What
the next run has to account for:

- Two peer dependencies are gone (`react-native-modal-datetime-picker`,
  `@react-native-community/datetimepicker`), and so is the `@react-native-community/datetimepicker`
  Expo plugin in `apps/playground/app.json`. Nothing in the prebundle referenced them, so
  no script change was needed - but `packages/ui/README.md`'s peer table changed.
- Four new components ship from the barrel: `ClockPicker`, `ClockDial`, `DatePickerInput`,
  `DateRangePicker`. All four are pure React Native (the dial is plain Views, no SVG), so
  `make-web-barrel.mjs` picks them up by text transform with nothing to pin.
- New previews: `Calendar.tsx` and `ClockPicker.tsx`, both `cardMode: column`.
  `DateTimePicker.tsx` was rewritten - eight stories now, covering selection modes, typed
  entry and `validRange`. `ClockDial` is deliberately left without one: it is the face
  inside `ClockPicker`, which previews it in context. **Reversed by the coverage sweep
  below** - `ClockPicker` only ever shows the dial's default face.
- `components.md`'s picker heading is now
  `### DateTimePicker / DatePicker / DatePickerInput / DateRangePicker / TimePicker`, so
  `split-docs.mjs` writes the same doc to all five names instead of leaving the four
  wrappers on a "general" card with no prompt.
- Breaking props to expect in any carried-forward grade: `variant` is gone,
  `minimumDate`/`maximumDate` became `validRange`.

## Component coverage sweep (2026-09-09, later)

Cross-checked the four sync surfaces against each other - barrel export, preview,
generated doc, presentation override - rather than against memory. Six components were
shipping from the barrel with a doc but **no preview**, so they reached the Design System
pane as a name with no card: `ClockDial`, `TimeSelect`, and the four wrappers
`DatePicker`, `DatePickerInput`, `DateRangePicker`, `TimePicker`. All six now have one,
all `cardMode: column`. Coverage is 87 shipped components / 87 previews.

**This reverses the `ClockDial` decision above.** "It is the face inside `ClockPicker`,
which previews it in context" holds for the picker's _default_ face and nothing else:
`unit`, the inner 13-00 ring `use24HourClock` adds, the bare knob `minuteInterval` leaves
on an unlabelled minute, and `isTimeDisabled` are all `ClockDial` props that no
`ClockPicker` story reaches. A public export with its own props table earns its own card.

**The four wrappers get thin cards on purpose.** They are 15-19 line prop locks over
`DateTimePicker`, so their stories stay at two or three: what the lock is, and that the
field states still behave. A design agent should be able to see that `DateRangePicker`
exists and what it looks like without being taught the picker twice. Note that
`split-docs.mjs` writes the _same_ doc to all five names (they share the
`### DateTimePicker / DatePicker / ...` heading), so the cards are the only thing that
tells them apart.

**`CardTitle` / `CardContent` / `CardCover` / `CardActions` stay without their own
previews** - the only four shipped components that do. They are slot components with no
standalone meaning, and `Card.tsx`'s stories compose all four in place. They still get
their own doc from the shared heading. Recorded here so the next sweep does not read it
as an oversight.

### Authoring notes for the six

- `ClockDial` is fully controlled and wants `hours` **and** `minutes` whichever `unit` is
  being edited; a story that passes only the edited one gets a hand pointing at midnight.
- `isTimeDisabled` is asked about a _candidate_, not the current value:
  `(candidateHour, currentMinutes)` on the hour face, `(currentHours, candidateMinute)` on
  the minute face. A predicate written against the current value greys out all or nothing.
- On the 12-hour face that candidate hour is the 0-23 value the label maps to under the
  current AM/PM half, so an "office hours" rule only reads honestly on the 24-hour face.
  That is why `DisabledTimes` passes `use24HourClock`.
- `TimeSelect` sizes its own scroller (`ROW_HEIGHT * VISIBLE_ROWS` = 180px), so unlike most
  scrollables it needs no wrapper height. It grows a third column on 12-hour locales, so
  the format axis changes the component's width as well as its content.
- The four wrappers inherit `DateTimePicker`'s own `marginBottom: 20` - their story columns
  take no `gap`, same rule as the `DateTimePicker` preview.
- `DatePicker` keeps `selectionMode` (only `mode` is locked), so its props are still the
  discriminated union: `value` has to match the selection mode or the preview fails to
  typecheck rather than rendering blank.

### Lint was red before this sweep

`npm run lint` gates CI and was failing with 28 `prettier/prettier` errors across twelve
previews from the previous commit (`Autocomplete`, `Box`, `Card`, `Center`, `Collapse`,
`FormControl`, `IconButton`, `Image`, `Stack`, `Stat`, `ToastProvider`, `VStack`).
Formatting only; fixed with `npx eslint .design-sync/previews --fix`. Lint the previews
before committing them - the repo runs prettier _as an ESLint rule_ over the whole tree,
so a clean `prettier --check` on the file you touched does not mean CI is green.

## Re-sync 2026-09-09 (later still) — the gaps list is now spent

Ran the driver against the committed tree (`188cdfc`). `npm run build` was skipped again:
nothing under `packages/ui/src` was newer than `packages/ui/lib/module/index.js` (bob had
already run at 21:17 in the interrupted session before this one). The three repo
generators were re-run anyway.

Staged scripts were **already byte-identical to skill build 2.1.267** except the
capture-clock patch, so the `cp -r` was skipped deliberately again — same reasoning as the
2026-09-09 note above. Both `.design-sync/overrides/*.mjs` forks diff clean against
2.1.267's `lib/`. Prettier-normalise the bundled copy before diffing or the diff is 100%
formatting noise: `npx prettier --write` a temp copy, then `diff --strip-trailing-cr`.

**Every entry in the "DS gaps" list above is now fixed in source and verified against this
build** — checked in `packages/ui/src`, not from memory:

- `Toggle`, `FAB`, `Input` all have a real `styles.disabled`; `NumericInput` forwards
  `disabled` to `Input`. Confirmed visually on the DatePicker / TimePicker / PinInput /
  FormControl / IconButton sheets.
- `ListItem` has `leading` / `secondary` / `trailing` and switches to a row when any is
  set (`isRow`), falling back to the centred tile when none is.
- `Popover` measures content at its natural width before pinning (`contentSize.width ||
window.width`), so the 200px lock is gone; `Menu` inherits the fix.
- `Checkbox` / `RadioButton` mirror the label margin on `labelPosition` (`marginRight` on
  left, `marginLeft` on right).
- `ConfirmDialog` takes `destructive` and passes `tone="error"` to the confirm Button.
- `Tooltip` sets `width: "max-content"`. It still caps at `numberOfLines={2}`, which is
  the only gap left standing and is now the one caveat in `conventions.md`.
- `SpeedDial` `defaultOpen` works: the `Expanded` cell captures the open action stack.

Keep the gaps list above as history — it explains why several previews are shaped the way
they are — but do not re-derive design guidance from it.

### Upload (this run)

Re-uploaded the full bundle: **443 content files + sentinel + anchor**, atomic path, no
deletions (`upload.deletePaths` was empty — nothing was removed or regrouped, only added).
The project grew from the 55 components the previous upload anchored to **87**. New anchor
identity: `bundleSha12 936efb354a25`, `styleSha 0b4ab263dbcf`, 87 renderHashes, up from
`3e11626369c9` / `0e6df35c0a88` / 55.

`_ds_needs_recompile` is written first and re-armed before `_ds_sync.json`, as always. The
`DesignSync` tool does **not** infer `localPath` from `path` — every file entry needs both
spelled out, so the three content calls are large. `list_files` returns a _sampled_ view of
a big project, not the full list; don't try to count files with it — verify with `get_file`
on a couple of paths this run introduced instead.

### `conventions.md` drift corrected this run

Two claims no longer verified and were rewritten; the file is otherwise untouched:

1. _"The library exports no layout primitives — no View, no Text. Use plain `<div>`"_ —
   false since the layout sweep. Eight layout components ship: `Stack`, `HStack`,
   `VStack`, `Box`, `Grid`, `Center`, `Spacer`, `AspectRatio`. Left unfixed this would
   have taught the design agent to hand-roll every layout in divs while the DS's own
   primitives sat unused. Replaced with the primitive list and their real props, each
   prop grepped out of the emitted `<Name>.d.ts`.
2. The whole _"Known gaps — do not design around them"_ section — every claim in it was
   fixed by the in-flight source work. Replaced with the two things still true
   (`ListItem` slots, `Tooltip`'s two-line cap).

Validation recipe for the next run, since this drift was invisible until checked: grep
every component name in the header against `ds-bundle/components/<group>/<Name>/`, and
every prop against that component's emitted `.d.ts`. `SafeAreaProvider` is the one name
that legitimately has no component folder — it is bundle-only by design.

### Preview bug: inline SVG data URIs need `charset=utf-8`

`Card.tsx` and `Image.tsx` drew their inline SVGs with a `data:image/svg+xml;utf8,`
prefix. `;utf8` is not valid data-URL parameter syntax, so headless Chromium rejected the
source and react-native-web's `Image` swapped in its `fallbackIcon`. Symptom: every
`Image` cell and `Card.ComposedFromParts` showed the grey placeholder glyph, and
`Image.ResizeModes` had three identical cells. **The render check cannot catch this** — a
fallback icon is a perfectly healthy render, so it takes an eyeball on the sheet. Fixed to
`data:image/svg+xml;charset=utf-8,`. Any new preview that inlines an SVG must use
`charset=utf-8`; a placeholder glyph where a picture belongs is the tell.

## Re-sync risks

- **`conventions.md` goes stale silently.** It is prose in a committed file; nothing in the
  pipeline checks it, and a component sweep (the layout primitives, the picker rebuild) can
  falsify a whole paragraph without a single warn line firing. Re-run the grep validation
  described above on every sync, not only when something looks wrong.
- **A preview can render perfectly and still be wrong.** The `charset=utf-8` bug is the
  worked example: healthy render, healthy PNG size, three "identical variants" that the
  variant check did not flag because the fallback icon is legitimate output. Eyeballing the
  review sheets is not optional ceremony — it is the only gate that catches this class.

- **The prebundle script is the fragile part**, and it is repo-owned rather than
  skill-bundled: `.design-sync/prebuild-web-entry.mjs`. It imports `esbuild` by bare
  specifier, so it needs the same `.design-sync/node_modules` link the forks need.
- Upgrading `react-native-web`, `@expo/vector-icons`, `expo-*` or `react-native-svg` can
  break the prebundle (new native-only import, new node builtin). Symptom: prebuild exits
  non-zero with `Could not resolve` — extend the stub plugin or the alias.
- The two lib forks are copies of skill-bundled files. On every re-sync, diff
  `.design-sync/overrides/<name>.mjs` against `.ds-sync/lib/<name>.mjs` and merge upstream
  changes; the forked edit is a few lines in each and is comment-marked.
- `make-web-barrel.mjs` mirrors `packages/ui/src/index.ts` by text transform. A component
  added to that barrel flows through automatically; one that needs a `.web` pin or a new
  native-only dependency does not, and will surface as a prebuild resolve error.
- Font fidelity: the DS sets `fontFamily: System` throughout (M3 type scale, no brand
  face), so previews render in the browser's system stack — matching the app on web.
  Nothing to source, no `[FONT_MISSING]`.

## Palettes and ProgressButton (added 2026-09-23, not yet synced)

- `ThemeProvider.Palettes` is the design system's palette switcher: a swatch per entry of
  `palettes` (twenty) calling `setPalette`. It nests its own `ThemeProvider` on purpose, so
  a pick re-themes that card only — the shared `cfg.provider` chain has no way to take an
  `initialPalette`, and switching it would repaint every other card's capture. It uses raw
  `<button>`s, which is fine: ThemeProvider is in the variants generator's
  `NOT_CATALOGUED` list, so the preview is never rewritten to React Native.
- `ProgressButton.TryIt` runs a timer only after a press; its capture is the idle state.
  Every other story is a static status, so the review sheet shows all four.
- `ProgressButton` draws inside `Button` through `underlay` and animates with the native
  driver; react-native-web falls back to JS timing, so the captures are the resting frame.

## 2026-09-23 re-sync

- **`package-build` / `resync` wipes `ds-bundle/_screenshots`.** Run a full `package-capture` after every full build, not only for the components you touched.
- **A `cfg.overrides` change needs a full build.** `preview-rebuild` refuses with `[CONFIG_STALE]` once an override (viewport, cardMode) differs from the stamped build.
- **Capture viewport crops silently.** The default 900x700 hid the third 330px Calendar and the bottom of the vertical-scroll one; Calendar now carries `viewport: "1100x480"`. When a cell looks cut, compare against `review/raw/` before blaming the component.
- **RN-web: `flex: 1` truncates inside shrink-wrapped containers** (zero flex-basis, so the parent sizes without the child). Use `flexGrow: 1, flexShrink: 1`. Found in `Menu` labels.
- **RN-web reports `onLayout` widths via `offsetWidth`, rounded down.** Feeding that back as a `maxWidth` clips the widest row by a fraction and ellipsises it; `Popover` pads the measured width by 1px.
- **Chrome's `outline-style: auto` focus ring ignores `outlineWidth: 0`.** Use `outlineStyle: "none" as any` on web text inputs (SearchBar, Autocomplete).
- `packages/ui/scripts/strip-declaration-maps.mjs` needed `fileURLToPath` to run on Windows.
- Library fixes found only by grading sheets this run: SpeedDial corner anchor, Menu label width, Autocomplete focus ring, Spinner disabled fade, AspectRatio ignoring `width`, AlertProvider ignoring button `style` on web, Popover sub-pixel width.
