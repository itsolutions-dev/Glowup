# Project status: done, left, and what not to redo

As of **2026-10-28**, `dev` at `60513a9`. Built from the handoffs of 19–28 October, `solaris-native.md`,
`library-roadmap.md`, `decisions.md` and `work-split.md`. **Update it at the end of every session, in the same
change as the handoff**, so the next session starts from here and not from re-reading seven handoffs.

## How to read the percentages

- A percentage is the share of the items **the plan itself lists** for that workstream, not hours of work. They
  are estimates rounded to 5; the basis is under each section.
- "Done" means built, tested in jest and looked at on the web. Native proof is a separate column, because almost
  everything native has been seen only on CI simulators and emulators.
- **Overall** weights each phase by its size in the plan (S = 1, M = 2, L = 3). Phase 9 is not counted (it is
  future work by decision D12).
- **Nothing has ever run on a real phone.** iOS means the iPhone 17 Pro simulator in CI; Android means the API 34
  and 35 emulators in CI plus the local Pixel 8 emulator (API 35).

## At a glance

| Workstream                                | Done | Progress     | Main thing left                                             | Web | iOS (CI) | Android |
| ----------------------------------------- | ---- | ------------ | ----------------------------------------------------------- | --- | -------- | ------- |
| Phase 0: spikes                           | 90%  | `█████████░` | 0.6: run the whole playground on simulators                 | yes | yes      | yes     |
| Phase 1: native readiness, web, stability | 25%  | `██▌░░░░░░░` | jest ×3, verification matrix, DataGrid 1.4, a11y, safe area | –   | –        | –       |
| Phase 2: theme tokens and hooks           | 90%  | `█████████░` | the brand gradient, when a pilot screen needs it            | yes | partly   | partly  |
| Phase 3: specialised props (3A/3B/3C)     | 55%  | `█████▌░░░░` | B3, B4                                                      | yes | partly   | partly  |
| Phase 4: charts (`packages/charts`)       | 90%  | `█████████░` | final colours, native timings, release                      | yes | yes      | yes     |
| Phase 5: `composite-ui`                   | 5%   | `▌░░░░░░░░░` | everything (B7)                                             | –   | –        | –       |
| Phase 6: PDF (`packages/pdf`)             | 95%  | `█████████▌` | release; native checks on a device                          | yes | yes      | yes     |
| Phase 7: pivot (`packages/pivot`)         | 85%  | `████████▌░` | use in the CRM, parity test                                 | yes | yes      | yes     |
| Phase 8: CRM pilot screens                | 0%   | `░░░░░░░░░░` | everything (A8)                                             | –   | –        | –       |
| Library hardening (`library-roadmap.md`)  | 45%  | `████▌░░░░░` | ~24 defects, 6 high (mostly accessibility)                  | –   | –        | –       |
| Releasing the new packages (A9)           | 0%   | `░░░░░░░░░░` | `pdf`, `charts`, `pivot` are still `private`                | –   | –        | –       |
| **Overall (phases 0–8, weighted)**        | 57%  | `█████▋░░░░` |                                                             |     |          |         |

Phase 7 is 85% of the scope decided on 27/10 (a table that shows data and exports it). Against the original four
layers of the plan (grid, field panel, calculated fields and drill-through, export) it is about 50%.

## Per workstream

### Phase 0: spikes, 90%

- **Done:** 0.1 pivot core on Hermes, 0.2 CRM desktop density, 0.3 PDF, 0.4 bar chart, 0.5 CRM → Glowup matrix.
- **Left:** 0.6 (run the playground on an iOS simulator and an Android emulator and list what breaks). Partly
  covered by the native CI, which runs `/native-check`, not every page.

### Phase 1: native readiness, web, stability, 25%

Basis: of the 13 items of the phase, none is fully closed; the native CI (in the phase's "what to add" list) is
done, and 1.10 and 1.11 are partly done.

- **Done:**
  - Native CI: `native.yml` on iPhone and Android 14 and 15, `/native-check` (measurements, charts, PDF, pivot),
    `scripts/android-interact.mjs` (16 steps), iOS screenshots on a cycle (`ios-seq-*.png`, 22/10).
  - Local Android emulator that builds and runs the playground (22/10, recipe in memory).
  - Native fixes found by that CI: `Select` height, `Input` iOS padding, focus ring `elevation` (20/10),
    `Collapse` that did not open on native (26/10, `0ede135`).
  - Web: hover and focus no longer shift the layout (23/10); the theme's scrollbars on web (26/10).
  - Screen readers: TalkBack tried for real only on the pivot grid (26/10).
- **Left:**
  - 1.1 jest on three platforms (B1). `packages/ui` still has one `jest-expo` preset.
  - 1.2 `expo export -p ios` / `-p android` in `examples/consumer` (only `-p web` today).
  - 1.3 / A7 `docs/native-verification.md`, the component × platform matrix. The file does not exist.
  - 1.4 `DataGrid` without the `FlatList` inside a horizontal `ScrollView` (B5). The pivot avoided it by writing
    its own grid.
  - 1.5 virtualised long lists in `Select`, `Menu`, `Autocomplete`. None uses `FlatList` yet.
  - 1.6 keyboard avoidance in `Dialog`, `BottomSheet`, `Drawer`, `Autocomplete`. Not done.
  - 1.7 date pickers on a real Hermes; 1.8 animations; 1.9 RTL.
  - 1.10 a VoiceOver and TalkBack pass on the 3A components.
  - 1.12 safe area: `AppBar`, `Toolbar`, `FAB`, `SpeedDial` throw without a provider.
  - 1.13 the 1.0 criteria and the adoption guide.

### Phase 2: theme tokens and hooks, 90%

- **Done:** 2A hooks (`useDebouncedValue`, `useDebouncedCallback`, breakpoints), 2B-a/b status roles (`success`,
  `warning`, `info`, `neutral`), `toneFrom` (16/10).
  - 2B-c, the chart palette (B0, B2; 28/10): `theme.charts` with `categorical` (8), `sequential` and `diverging`,
    light and dark, fixed under every brand palette; validated with the `dataviz` skill's script against the light
    and dark surfaces and containers of every built-in palette (all hard checks pass; aqua, yellow, magenta below
    3:1 on light, so labels or a table view are required, which the charts have). The charts take
    `categorical` in order; checked on the web Charts page in light and dark.
- **Left:** the brand gradient (`gradients.brand`, `brandDisabled`, CRM `#1D5A9D → #61B340`), built when a pilot
  screen draws one.

### Phase 3: specialised props, 55%

Basis: the "Fatto" column of `crm-component-matrix.md` (filled in 28/10 from the props types) and the three
rename batches. Of the matrix's 30 rows that propose something, 11 are done, 8 partly and 11 not (50%, a
partial row counting half); the rename batches are at 2 of 3. Together: 55%.

- **Done:**
  - 3A first pieces (16/10): `density` and `DensityProvider`, `ListItem` slots, `Input` `decimalSeparator`,
    `Autocomplete` `onSearch`.
  - 3B first round: `Dialog` size, `BottomSheet` actions, `Tabs`, `Snackbar`.
  - 3C: `CaptionValue`.
  - Rename batch 1 (19/10: actions, display, form fields, date pickers) and batch 2 (22/10: overlays,
    navigation, layout, `Table` driven by data).
  - 16 new components and the `Form` engine (23/10).
  - The decisions of 23/10 applied: `Typography` defaults to `body1`, `Select multiple` takes `value[]`,
    `ConfirmDialog` is merged into `AlertDialog`, a `ListItem` row is pressable as a whole.
  - `Input` / `InputArea` split (26/10).
- **Left:**
  - B3: `ToggleButtonGroup` with typed values, and `Stepper` as dots or a bar.
  - B4: `DayTimeline`, day markers (now on `DatePicker variant="static"`), `Skeleton` presets.
  - The matrix's other gaps, built only when a pilot screen asks: `DataGrid` `renderRow`, `rowGap`,
    `rowActions`, `sections`, `%` widths; `Select` string options, `reserveHelperSpace`, `renderOption`;
    `Input` `type` phone/email; `StatusBadge` `info`/`neutral`; `Stat` `valueTone`; `Dialog` `overline`,
    `leadingActions`, `dividers`; the hooks `useAbortEffect` and `useInfiniteList`.

### Phase 4: charts, 90%

- **Done:**
  - Steps 0–9 of `charts-package-plan.md`: `BarChart`, `LineChart`/`AreaChart`, `DonutChart`/`PieChart`,
    `StackedBar`, `Sparkline`, `ChartLegend`, the `Chart` facade.
  - Dense mode (10,000 bars: 8.2 s → 74 ms on the web), table mode for screen readers, donut labels outside the
    ring.
  - In `/native-check`, green on all three devices.
  - 27/10: bar `column`/`columnMode`, a target per category, an outcome `marker`, `dimmed`. Proven in CI
    (Android 15/15, iPhone 13/13).
- **Left:**
  - Rebuild the CRM's four bar charts with the new props, starting with Inbound.
  - Horizontal scrolling (`minTickWidth` in the CRM).
  - Final colours (waits on B0).
  - Dense-mode timings on native.
  - The minors deferred by the 27/10 review.
  - Changeset and trusted publisher when the package leaves `private`.
  - `ScatterChart`, `AreaRange`, `TimelineChart` only if the CRM asks for them.

### Phase 5: `composite-ui`, 5%

- **Done:** only the playground's example pages (Sign in, Dashboard, Inbox, Settings), which the phase reuses.
- **Left:** the whole subpath (B7): `AppShell`, `ListPage`, `FormDialog`/`FormPage`, `DetailPage`, `WizardPage`,
  `ReportPage` (charts and pivot as slots), `OptionPicker`, `ActivityTimeline`, `AgendaPage`.

### Phase 6: PDF, 95%

- **Done:**
  - Steps 0–6 and 8–14 of `pdf-package-plan.md`. There is no third-party library.
  - Web: an iframe on `blob:`, print, open in a tab.
  - iOS: PDFKit. Android: `PdfRenderer`, with search from API 35 and `PdfRendererPreV` below.
  - Render queue, two-finger zoom, search page by page, download through `.part`, save to Downloads.
  - The password error, tried on Android (23/10). Web print, tried in Chrome (23/10).
  - 300 pages: fast everywhere (23/10).
  - Each optional `import()` in `adapters.ts` has its own `.catch`, so an app without `expo-print` or
    `expo-sharing` still builds; `optionalPeers.test.ts` asks Metro (28/10).
- **Left:**
  - Changeset and trusted publisher when it leaves `private`.
  - **Not verified:** a real download on a device, the password on iPhone, pinch on iOS, saving on Android 10–14.

### Phase 7: pivot, 85% of the decided scope

- **Done:**
  - Piece 1 (23/10): the AuraPivot 2.6.0 core copied in, 180 tests.
  - Piece 2 (23/10): the read-only web grid, sticky header and label columns.
  - Piece 3 (23–26/10): the iOS and Android grid on the native driver, plus four "Important" fixes from the
    review. CI green: 14/14 on Android, 12/12 on iPhone.
  - Toolbar (27/10): our own `.xlsx` export on web, iOS and Android, fullscreen, reset. Export proven on
    Android's share sheet in CI.
  - Script fix (28/10): the toolbar had moved a text field onto the Android script's swipes; CI back to 16/16 on
    Android 14 and 15, every native check PASS (PDF search PENDING on 14, as designed), iPhone all PASS.
- **Left (decided scope):**
  1. Open `pivot-sample.xlsx` in real Excel (Google Sheets reads it right, 28/10: sheet name, styles, numbers).
  2. Use `<PivotGrid toolbar />` in the CRM's WaveActivitiesReport.
  3. A parity test against a real CRM report, plus 50k rows on the web and 5k on native (the phase's exit
     criteria).
  4. The minors deferred by the 27/10 review.
- **Out until needed (27/10):** field panel, filters, calculated fields, conditional formats, drill-through,
  saved configurations.

### Phase 8: CRM pilot screens, 0%

- **Left:** sign-in with 2FA, contacts list with filters, customer detail with outcome, report (charts and pivot),
  built only with the library. Depends on 3A, `DataGrid` 1.4 and part of `composite-ui`.

### Library hardening (`library-roadmap.md`), 45%

Basis: 7 + 11 fixed of about 42 defects (the 7 of 23/10 plus the 35 the review found).

- **Done (23/10 afternoon):** 7 items. Hover and focus no longer shift the box, `Tabs` hover, `Slider`, the
  `Switch` thumb, the picker popover scrollbar, `useToast` identity and `maxVisible`, `DataGrid` column order.
- **Done (28/10), the ones that broke an app:** 11, each in a failing jest test first; the web ones also driven in
  Chromium (and Escape seen failing there on the old code). Escape closing every stacked dialog, twice; the picker
  portal in a static render; `NumberField`'s hidden 0..100 range and integer-only input; `Select` tick for falsy
  values; `PinInput` completing with blanks; `ProgressButton type="submit"`; Enter submitting a disabled form;
  `Table` rows keyed by index; `Alert()` lost before the provider, overwritten by a second one, Escape skipping
  cancel. Changeset `app-blocking-fixes.md` (minor: `NumberField` no longer clamps to 0..100 by default).
- **Left:** about 24 defects, found by reading and **never run**. The 6 high ones, all but the first about
  accessibility:
  - Toasts appear under open overlays (needs Toast v2: on iOS and Android a dialog is a separate native window).
  - The current `Pagination` page is disabled.
  - ARIA state never reaches the DOM.
  - `SpeedDial`/`FAB` accessible names.
  - Buttons nested in a pressable `Card`.
  - iOS never announces `Snackbar`/`Banner`.
  - Not high, but app-facing: `Input` never submits a form on native Enter; a picker inside a `Dialog` closes
    the dialog with it on Escape.

  Then §2 (second tier) and §4 (what to build: `useConfirm`, theme mode, `AppShell`, Toast v2, motion…).

## Do not redo: already settled or already fixed

- **No rename batch 3, no "one field contract"** (Alice, 28/10). The field family keeps `onPress`, `mode`,
  `onValueChange`, `multiSelect`, `Banner.type` and the rest: they were named that way on purpose. Do not
  propose renaming them again.

Check here before starting something that feels familiar.

**CI and tooling**

- **Android 15 stopping after the first screenshot** is a runner problem: `adb logcat -d` gets cut off. It has
  happened three times. Re-run the job, don't debug the app. Since `59893fb` that dump no longer stops the script.
- **Search PENDING on Android 14** is expected: the emulator lacks SDK extension 13. Not a bug.
- **iOS screenshots** come from the `ios-seq-*.png` cycle. `ios-check/charts/pdf.png` no longer exist.
- **"Unable to resolve module ./generated"**, or a stale example or gallery, is Metro's cache: `npx expo start -c`.
  **Metro with `CI=1`** disables reloads.
- **Pinch on the emulator** works only through the emulator's gRPC, not `adb input` or `sendevent` (recipe in
  memory). `input text` does not reach the PDF search field; send `input keyevent` one key at a time.
- **Look at the screenshots, not only the `NATIVECHECK` lines.** The iOS PDF half-scale bug passed every line.
- **A drag that starts on a text field doesn't scroll the page** on the emulator, focused or not. The script's
  `swipe` starts beside any field (28/10). If steps fail "not on screen" with the page stuck, look for a field
  under the swipe's start, not at the app.
- **Never merge `master` into `dev`** (16/10).

**Library**

- **`Collapse` on native is fixed** (26/10, `0ede135`, changeset `collapse-opens-on-native.md`). The colleague
  still has to be told.
- **`Typography`** defaults to `body1` and keeps the M3 names as aliases. **`Select multiple`** is `value[]` +
  `onChange(values)`. **`Autocomplete`** keeps `onChange(text)`.
- **`ConfirmDialog` is gone** (it is `AlertDialog`). **`Center` is back** as a thin `Box`. **`SideSheet`** is
  `Drawer position="right"`.
- **`ListItem` with `onClick`** makes the whole row pressable; the action is a sibling, never nested.
- **`Calendar`, `ClockPicker`, `ClockDial`** are internal; use `variant="static"` on the pickers.
- **`InputArea`**: `rows` wins over `minRows`/`maxRows`; no uncontrolled mode; no prefix or suffix.
- **Kept on 23/10:** `Dialog` close icon, `Pagination` shape, `Stat` colours, `density` left to the app.
  **Not now:** the rename to Solaris UI.
- **Not built for lack of CRM evidence** (`decisions.md`): `Autocomplete` `multiple`/`uppercase`, `BottomSheet`
  snap points, `DataGrid` percentage widths, row actions, group rows.
- **Plan questions Q1–Q6 are closed** with the defaults.

**PDF**

- **JPEG at 90%** stays (21/10, checked at 4× zoom).
- **Abandoned or out of scope:** the PdfBox fallback (step 7), in-page PDF on mobile browsers (§12, only if CRM
  users open PDFs in a phone browser), the "visible region" for high zoom, asking for a password.
- **300-page PDFs are not slow** (23/10: 16–834 ms to open on emulators).
- **There is no download cache.** If one is ever added, its key must include the headers.

**Charts**

- **d3 is copied in** (`src/vendor/d3`), not a dependency. The x axis is categorical, not dates. A `Gauge` is a
  `DonutChart` with `total`.
- **`dense` is automatic** (400 bars, 200 line points); `dense={false}` above the threshold is allowed.

**Pivot**

- **The grid is written inside `packages/pivot`**, not on `ui`'s `DataGrid`. Native uses `Animated` with the
  native driver, not Reanimated.
- **The header and the label column don't start a drag**, by design. Only the numbers area scrolls.
- **Scope = show and export** (27/10). The `.xlsx` writer is ours; no `exceljs`.

## Road to done

Agreed on 2026-10-28, and reordered the same day: **publishing comes after the library is fixed** (Stage 5), since
nobody needs the packages in the CRM before then and `release.yml` cannot publish from `dev` anyway. **The CRM
pilot screens decide what gets built next**: the plan put `composite-ui`
(Phase 5) before the pilot screens (Phase 8), this order flips it, so a composite is built when a pilot screen
needs it. Tick a box when it is done **and** its verification is noted in the handoff.

**Done means:** the four pilot screens work on web, the iOS simulator, the Android emulator and one real Android
phone; `pdf`, `charts` and `pivot` are published on npm; `docs/native-verification.md` and the 1.0 criteria
exist. Work that serves none of these waits (see "Deferred" below).

### Stage 0: close what is already diagnosed (Alice, 1–2 days)

- [x] Android script regression: fixed, 16/16 in CI on Android 14 and 15 (run on `4075ab5`, 28/10).
- [x] A `.catch` on each optional `import()` in `packages/pdf/src/adapters.ts`, with a test like the pivot's
      `optionalPeers.test.ts`.
- [ ] **Alice, not blocking:** open `pivot-sample.xlsx` in Excel when a machine with it is at hand. Google Sheets
      done (28/10); Excel is stricter (the repair prompt). Export it from `/pivot` on the web.
- [x] Tell Gabriele about the `Collapse.tsx` change and its changeset (28/10).
- [x] Fill in the "Fatto" column of `crm-component-matrix.md` (28/10): Phase 3 stays at 55%, now counted.
- [ ] **Alice, not blocking:** say yes to deleting `backup/dev-before-rebase` and `backup/dev-before-ui-integration`
      (checked 28/10: everything in them is in `dev`).

### Stage 1: freeze the API

- [x] ~~Rename batch 3 and the one field contract~~: **dropped by Alice (28/10)**. The current names stay; see
      "Do not redo".
- [x] The chart palette type and values (B0, B2) and the charts' default (28/10). The brand gradient waits for a
      pilot screen that draws it.

### Stage 2: harden the library (in parallel with Stage 3)

- [x] **Alice:** the bugs that break an app (`library-roadmap.md` §1 and §2), each reproduced in a test first
      (28/10: 11 fixed). Accessibility-only items wait; toasts under dialogs wait for Toast v2.

### Stage 3: the pilot screens, cheapest first

Every gap a screen exposes becomes the next library task, with a general name (D4). `composite-ui` gets only
what these screens use.

- [ ] **Ask the CRM side now** for real report definitions and anonymised data for the screens, so this
      stage does not stall.
- [ ] Report (charts and pivot): almost ready today.
- [ ] Sign-in with 2FA: the `SignIn` template exists; needs `OtpVerify`.
- [ ] Contacts list with filters: forces `DataGrid` 1.4, virtualised lists (1.5), `ListPage` and `AppShell`.
- [ ] Customer detail with outcome: forces `DetailPage`, `FormDialog`, keyboard avoidance (1.6).

### Stage 4: the minimum of Phase 1 for a 1.0

- [ ] `docs/native-verification.md`, the component × platform matrix (A7), filled for the pilot screens'
      components.
- [ ] jest on three platforms in `packages/ui` (B1).
- [ ] `expo export -p ios` and `-p android` in `examples/consumer` (1.2).
- [ ] Readable errors without a `SafeAreaProvider` (1.12).
- [ ] A VoiceOver and TalkBack pass on the pilot screens' components (1.10).

### Stage 5: publish, then the CRM uses the packages

The branch decision can be taken any time before this; the rest waits until the pilot screens have settled the API.

- [ ] **Alice:** the release pipeline for `pdf`, `charts`, `pivot` (A9): trusted publishers, `release.yml`,
      `ci.yml`, changesets, `examples/consumer` installing them from the registry. 0.x while the API settles.
- [ ] **Alice + Adriano + Gabriele: which branch publishes** (28/10). `release.yml` publishes from `master` only, and
      `dev` and `master` have split (140 and 105 commits). `@its/glowup-ui@0.12.0` on npm is `master`'s, without
      `dev`'s library work, and `pdf`, `charts`, `pivot` are built against `dev`'s `ui`. Options: `dev` into
      `master` through a PR (the one published line 1.0 needs); a `next` pre-release from `dev`; or postpone.
      Nothing can be published until this is decided.
- Before the first publish of `pdf`, `charts`, `pivot` (checked 28/10; `publint` and `attw` are clean on all three):
  - [x] `pdf` no longer packs `android/build/` (213 files of local Gradle output); `pivot` no longer packs the
        test helper `export/__fixtures__`.
  - [x] A `LICENSE` in each of the three (MIT, IT Solutions S.r.l., the text of AuraPivot's, whose engine `pivot`
        copies). `ui`, `notifications` and `device` still have none: tell their owners.
  - [ ] The `@its/glowup-ui` peer range (now `>=0.11`): set it to the `ui` version they are built against, once the
        branch question is settled.
  - [ ] READMEs as npm pages: drop "Not published yet", add install (with the optional peers) and a usage example
        (`pdf` and `pivot` have none); links into `docs/` do not work on npmjs.com.
  - [ ] `private: false`, a first changeset for each, `release.yml`'s comment, and `examples/consumer` plus
        `consumer-smoke.yml` installing the three.

- [ ] **Alice:** `<PivotGrid toolbar />` in the CRM's WaveActivitiesReport. It doubles as the parity test
      against a real report.
- [ ] **Alice:** the CRM's four bar charts with `column`, `target`, `marker`, `dimmed` (Inbound first).

### Stage 6: one real phone, then 1.0

- [ ] An `arm64` build from CI on one real Android phone, through the pilot screens. iPhone only if an Apple
      Developer account becomes available.
- [ ] The 1.0 criteria, deprecation and Expo support policy, adoption guide (1.13); release.

### Deferred until a pilot screen or a CRM user asks

Phase 9; the pivot's field panel, filters, calculated fields, conditional formats, drill-through and saved
configurations; `ScatterChart`, `AreaRange`, `TimelineChart`; chart horizontal scrolling; RTL (1.9); animation
work without a seen defect (1.8); rounded icon glyphs; the PDF inside a phone browser and its "visible region";
the rename to Solaris UI; the `library-roadmap.md` §4 items no screen needs.

## Open questions

- From `decisions.md`, each with a default:
  - Rounded icon glyphs.
  - `QrCode` fixed colours.
  - `Autocomplete` aligned to `Select`.
- Which Android versions do the CRM's users have? Do they open PDFs in the app or in a phone browser?
- Charts (27/10, to confirm): the "Status" header in the table, and `BarMarker.icon` as an `IconSource`.
- Testing on a real phone. Android needs an `arm64` build in CI; iPhone needs an Apple Developer account and an EAS
  build. Alice said "not for now".
