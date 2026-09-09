# design-sync notes — @glowup/ui

Repo-specific gotchas for future `/design-sync` runs. Read this before anything else.

## Shape and pipeline

- Shape is `package` (no Storybook anywhere in the repo).
- Monorepo. The DS is `packages/ui` (`@glowup/ui`); `apps/playground` is the demo app.
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

Claude Design renders in a browser; `@glowup/ui` is Expo React Native. The converter's
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

- `DrawerNavigation`, `StackNavigation`, `CustomDrawerContent` — `@react-navigation/*` →
  `react-native-screens`, whose commonjs build has unresolvable platform-split requires
  (`./TabsHost`, `./TabsScreen`) and whose native specs are Flow. Excluded via
  `componentSrcMap: null`. Confirmed with the user 2026-09-08. They are navigator
  wrappers needing a `NavigationContainer` + route array, so they were poor preview
  material regardless.
- `Alert` — the imperative `Alert(title, message, buttons)` singleton, not a component.
  Excluded; it is documented in `conventions.md` instead.
- `SafeAreaProvider` — re-exported from the barrel purely so `cfg.provider` can mount it
  (AppBar and SpeedDial read safe-area insets and throw without it). Excluded from the
  component list.
- `DateTimePicker` is pinned to `DateTimePicker.web` in the barrel — esbuild has no
  platform-extension resolution, so the bare specifier would pull the native
  `react-native-modal-datetime-picker` implementation.

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
clock, so the *shipped* cards were never affected — this is a grading-fidelity fix only.

## Capture environment

- The capture browser's `navigator.language` is **it-IT**, which `DateTimePicker` reads
  through `getDeviceLocale()` - date fields format as `3 giu 2024` and relative days come
  out `Ieri / Oggi / Domani`. Deterministic, so it is fine, but don't mistake it for a bug.
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
  `account-multiple-outline`, `folder-multiple-outline`, `file-search-outline`.

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
  and therefore *widens* that gap; only combine it with a labelled Divider.
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
  card-sized `viewport`. `Snackbar` and `Tooltip` are absolutely-positioned *siblings*
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
  module-level `alertRef`) runs *after* its children's.
- **`Skeleton` on an elevated `Paper` is near-invisible** - placeholder
  `surfaceContainerHighest` (#EDE7F0) vs `Paper elevation={1}` `surfaceContainerLow`
  (#F7F2FA) is a ~4% delta and the pulse takes it below that. Put skeletons on `surface`
  (`<Paper elevation={0} outline>`).
- **`CircularProgress` has no determinate mode** - only `size`/`strokeWidth`/`color`/
  `duration`. `Spinner` is a *number stepper*, not a loading spinner.
- **`Select` renders `label` only for `variant="outlined"`**; the filled closed field is
  intentionally label-less.
- `Select`, `Spinner` and `DateTimePicker` each carry their own `marginBottom: 20` - don't
  add `gap` to a column of them. `Select`, `SearchBar`, `DateTimePicker`, `LinearProgress`
  and `EmptyState` are all `width: 100%` and need a width-constrained parent.
- **`ListItem` takes `children`, not `title`.**

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
   `pos.width = contentSize.width || 200` is applied to the card *before* the content is
   measured, so the content lays out inside 200px, `onLayout` reports 200 back, and the
   width never grows. Any label over ~168px wraps or truncates. Hits `Menu` too, whose
   item labels are `numberOfLines={1}`. Fix: measure the content off-screen at its
   natural width first.
10. **`Menu`'s `dividerAbove` renders as a split rule** - `Menu.tsx` emits a bare
    `<Divider />`, so `contentSpacing: 16` paints line + 32px gap + line inside the menu.
    Fix is `<Divider contentSpacing={0} />` in `Menu.tsx`; the prop is currently unused in
    the previews because it looks like a defect.
11. **`Select`'s dropdown and `DateTimePicker`'s calendar cannot be previewed open** -
    both are behind an internal `useState` with no `defaultOpen` escape hatch (the
    calendar additionally portals to `document.body` at `position: fixed`). Add such a
    prop and these become previewable, with
    `{"cardMode": "single", "viewport": "480x560"}`.
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

## Re-sync risks

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
