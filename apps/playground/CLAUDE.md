# apps/playground — the presentation app

The playground is also the **published documentation site**: the same Expo app runs on
device and exports to static HTML for GitHub Pages.

The site is **English only** and carries no i18n layer: `i18n/` and the
`@react-navigation`-based `navigation/` folder were removed once nothing rendered
them. The navigator wiring survives as a snippet on /templates, because `AppBar`
takes react-navigation's header contract and a consumer still needs to see it.

## The templates

`templates/*.tsx` are whole screens (sign in, sign up, dashboard, inbox, profile, settings,
checkout, pricing), one self-contained file each: they import only `react`, `react-native`
and `@its/glowup-ui`, never `site/` or `catalogue/`, because the page shows the file as the
code to copy. `templates/index.ts` lists them with their slug, copy and design width;
`app/templates/index.tsx` is the gallery (each card renders its screen live, scaled from that
width) and `app/templates/[slug].tsx` the page: stage, "built with" chips, full source.
The source is embedded by `templates/generate.mjs` into `templates/sources.generated.ts`
(committed; never hand-edit it) — **after editing a template, run
`npm run templates -w @its/glowup-playground`**; `__tests__/templates.test.tsx` fails when
the embedded source differs from the file. A template that switches layout measures its own
container with `onLayout`, never the window: it must reflow on the stage's 360 / 720 widths,
and a first render at width 0 matches the prerendered HTML.

## The component page: one example, bound to its props

Every catalogue page has **one example**: a realistic, app-like piece of UI built around the
component, running on a stage (with a 360 / 720 / Full width switch), with its **code editable**
and a "Reset to default", and the Properties panel **bound to that code**. There is no separate
stage-plus-usage block and no list of examples.

An example is a **real file**, `catalogue/examples/<ComponentName>.tsx` (the file name is the
page name), type-checked, linted and prettier-formatted like a template: a default-exported
component importing only `react`, `react-native`, `@its/glowup-ui` and the icon font.
`catalogue/examples/generate.mjs` embeds every file's text and imports its component into
`examples.generated.ts` (committed; never hand-edit it) — **after adding or editing an example,
run `npm run examples -w @its/glowup-playground`**. `catalogue/examples/Button.tsx` is the model.

**The `props` literal.** After the imports comes `const props: Partial<XProps> = { ... };`
(the annotation keeps strings typed against the real props), spread onto the component the page
is about: `<Button {...props} onClick={...} />`. It holds the real props that are plain data;
handlers, state, nodes and the example's own data (rows, items) stay in the code. The Properties
panel reads and writes exactly this literal (`site/exampleProps.ts`): moving a control rewrites
its text, typing in the editor moves the control, and a key left out means "the component's own
default". The literal is found by shape (a line starting `const props` to the first line that is
exactly `};`) and written in Prettier's shape (2 spaces, double quotes, trailing commas, short
values inline), so a control moved and moved back is no edit.

**The registry** (`catalogue/registry/*.ts`) now only lists the controls: each one a **real prop**
of the component with the **component's own default** (`__tests__/registry-defaults.test.ts`
checks both against the generated prop tables). No stage-only toggles, no `node` controls, no
controlled-value props (the example owns that state), `type: "icon"` for glyph names (the field
opens the icon search), selects listing every value of the union, `appliesWhen` for a prop that
does nothing in the current state, `clientOnly` for a component that reads the clock or the locale.

**How it runs** (`site/LiveExample.tsx`, `site/liveCode.ts`). While the text is untouched the stage
shows the real component the file exports: the page prerenders and hydrates like any other and
nothing is evaluated. The first change compiles the text in the browser (`sucrase` strips the
types and the JSX, the imports resolve against the packages the site already bundles, `new Function`
runs it) once; the compiled component reads `props` from an object kept outside it, so moving a
control redraws it **without compiling again and without losing its state** (a table's selected row
stays selected). A compile error keeps the last good render and shows the message under the editor,
a render error is caught by the stage's error boundary, an unreadable `props` literal turns the
controls off until Reset. Evaluation needs `new Function`: fine on the web and in jest; on a native
engine without it the editor reports the error and the stage keeps the real component. The editor
is a transparent text field laid over a highlighted copy on the web (Tab indents, Esc lets the next
Tab leave), a plain field on native. `__tests__/examples.test.tsx` renders every example, checks its
embedded source, checks that compiling it draws the same tree as the real component, and that its
`props` literal is one its controls can edit. No `new Date()`, `Date.now()` or `Math.random()` in
an example: the page is prerendered. A page's one-line description is in `catalogue/descriptions.ts`
(under the title, in the gallery card, in the search; the catalogue test pins one per component).

**The code starts collapsed.** The editor is still the whole text, but it opens as an 8-line window
moved to the first line that renders the page's component (`<Button`, found in the live text since a
control adds lines above it) with a fade at the bottom; "Show full code" / "Collapse code" (a button
with `aria-expanded`) opens it. The tree is the same open or closed, so the field keeps its focus.

**Quick links and "Back to top"** (`site/OnThisPage.tsx`, used by `app/components/[name].tsx`).
`useScrollSpy` reads each section's `onLayout` offset (plus the "column" and "row" wrappers') on the
ScrollView's `onScroll` and keeps only two derived values in state, the current section and "scrolled
past 400 px": the offset itself is never state, or every scroll would redraw the live example. On web
at `layout.hasThirdColumn` a sticky "On this page" column sits beside the content (inside
`contentMaxWidth`, so the content gives it room); on every width the library's `FAB` ("Back to top")
appears after 400 px. A section needs `track(id)` on its `onLayout` (`Section` takes `onLayout`).

**The gallery cards** (`app/components/index.tsx`) show the example in a 240 px well: it is laid out in
a box 1 / 0.75 as wide as the well and drawn at 0.75 from its centre (inert, `pointerEvents="none"`),
under a `ViewportProvider` of 360. 3 columns from the `large` class, 2 from `medium`, 1 below; the
description is clamped to 2 lines (and reserves them) in the card and in the list.

## The icons

`/icons` (`app/icons.tsx`) lists every glyph of the icon font (read from `glyphMap`, never copied)
with its name: search (`site/iconCatalog.ts` ranks the exact name, then names starting with the
text, then whole words, then prefixes, then substrings), press an icon to select it and copy its
name, copy the filtered list as JSON or download it. The grid (`site/IconGrid.tsx`) is virtualised:
the font has about 7,400 glyphs. A catalogue prop declared `type: "icon"` gets the same search as
its control (`site/PropControls.tsx` + `site/IconPicker.tsx`): the field still takes a typed name, and
a button beside it opens the search; `withOutline: true` narrows it to icons that have an
`-outline` twin (Rating). Every registry prop named like an icon must be `icon`, not `text`: a
test pins it. The picker gives its body an explicit width on purpose: the dialog's card is as wide
as its content and the grid picks its columns from its width, so left to itself it loops.

## Three generated artefacts, all committed

- `docgen/props.generated.json` — every exported component's prop table, read from the
  library's TypeScript with ts-morph: name, type as written, optionality, JSDoc, and the
  default taken from the destructuring pattern. A props type that builds on another of the
  library's own (`extends Omit<BoxProps, "variant">`) also lists the parent's props, which is how
  Stack, Center, AspectRatio and PasswordField get their Box and Input controls (the registry
  shares those definitions: `BOX_PROPS`, `INPUT_PROPS`); what comes from react-native is left out.
  `npm run docgen -w @its/glowup-playground` regenerates it; CI regenerates and fails on a diff. **Never hand-edit it**, and never
  hand-write a prop table beside it.
- `catalogue/variants/generated/` — the variant galleries, rewritten from
  `.design-sync/previews/*.tsx` (the authored demos) into React Native primitives by
  `catalogue/variants/generate.mjs`. The previews stay in the browser dialect because the
  design-sync converter cannot resolve `react-native`; **edit the preview, then run
  `npm run variants -w @its/glowup-playground`** (it overwrites the folder in place and removes
  only stale files, so a running Metro keeps resolving `./generated`). Seven previews are excluded by name in the
  generator, each with its reason; hand-written galleries live in
  `catalogue/variants/manual/` and win over the generated entry for the same component.
  A catalogued component with no gallery at all fails the playground test.
- `assets/*.png` and `public/og-image.png` — the icon set and the share card: a neon bolt
  in a broken ring, drawn from `theme.json`'s dark-scheme colours by
  `scripts/generate-icons.mjs` (a hand-rolled PNG encoder; no image dependency).
  `npm run icons -w @its/glowup-playground` regenerates them (about 30 s). The shape lives in
  `site/brandMark.json`, which `site/BrandMark.tsx` also reads for the header's flat SVG copy,
  so edit the JSON, never the two drawings. Not checked by CI — deflate output is not
  guaranteed byte-identical across zlib versions — so regenerate them by hand when the theme's
  colours or the JSON change. `app.config.ts` hardcodes the dark `surfaceDim` as the splash
  and adaptive-icon background; keep it in step.

Adding a component to the catalogue means: an entry in the right `catalogue/registry/*.ts`
module (its controls), its name in the right group in `catalogue/categories.ts`, its one-line
description in `catalogue/descriptions.ts`, its example `catalogue/examples/<Name>.tsx` (then
`npm run examples`), a gallery of its states (an authored preview in `.design-sync/previews`, or a
hand-written one in `catalogue/variants/manual/` for an overlay that opens over the page; then
`npm run variants`), and its name in the `CATALOGUE` list in
`__tests__/playground-catalogue.test.tsx`. The test pins the `CATALOGUE` list against `FLAT_ORDER`,
the registry, the descriptions, the examples and the generated docs, so a component catalogued
without one of them fails there. It gets its page, its props table and its URL for free.

## The native check screen

`app/native-check.tsx` (/native-check) is a verification screen for the **native smoke job only**
(`.github/workflows/native.yml`); nothing links to it. A build made with
`EXPO_PUBLIC_NATIVE_CHECK_ROUTE=/native-check` opens it a minute after launch (`NativeCheckTrigger` in
`_layout.tsx`; a deep link cannot do it on iOS, which asks "Open in Glowup?" first). It has four parts:

- **Measurements**: normal and dense controls and a button with and without a badge are laid out on the
  device and their sizes compared (Δ height 24 / 12 / 20, badge width +12), so it catches what jest cannot.
  Results are drawn on screen (an iOS screenshot is the only evidence there: its log carries no
  `console.log`) and logged as `NATIVECHECK` lines.
- **Interaction**: a decimal-comma input, a badge button, keyed tabs, a drawer group and a bottom sheet, each
  with a `state=` line. `scripts/android-interact.mjs` drives them on the emulator with `adb` (types,
  taps, `uiautomator dump`) and prints PASS/FAIL per step. Typing goes through key events, and a failing step leaves
  `android-step-N.png`. iOS has no equivalent from CI. The screen and the script are kept in step by hand: add a control
  there when a component gains behaviour a phone must prove.
- **PDF rows** (`usePdfChecks`): the package's native module on the sample PDF (`site/samplePdf.ts`): opens it (3 pages),
  draws page 1 at 600 px (its real width is read from the file) and again at the width the viewer would ask on this screen
  (screen width minus 32, times the pixel ratio): that second drawing is the last thing on the screen, one image pixel to one
  screen pixel, so a screenshot shows how small print (8 and 6 points, black and red, on every page of the sample) comes out of
  the JPEG (`ios-pdf.png`, `android-pdf.png`); it is last so that nothing above it moves. It searches
  "hello" (pages 1 and 2, rectangles inside the page; PENDING where search is off) and refuses a file that is not a PDF. A last row
  opens a 300-page file (`longPdf`) and draws its last page: it is a measurement (the detail carries the milliseconds), it fails
  only if the page count is wrong. They log as `NATIVECHECK pdf …` and are drawn on screen like the measurements.
- **Chart rows**: a `BarChart` in a box that a sibling squeezes (200 → 100 px) must be laid out at its height (160) and
  follow the box down to 100 px (the drawing is absolute inside, so a width taken from it would stop the box shrinking: the
  spike's pitfall). A dense `BarChart` (250 categories) and a `DonutChart` are mounted below for the screenshot; a crash there
  fails the run. Run in CI on 2026-10-21 (iPhone simulator, Android 14 and 15 emulators): both rows pass (160; 200 → 100).
  Two `Interaction`-style steps in `scripts/android-interact.mjs` tap the dense chart (any category: `chart=<n>`) and the donut's
  "open" slice (`part=open`); the charts are found by the start of their summary (`title` of the chart) and a tap reads back through
  the state lines `onSelect` writes. On iOS the screen cycles by itself over its top, the charts and the PDF page, 10 s each (`Platform.OS === "ios"` only:
  on Android it would fight the script), and `native.yml` takes `ios-seq-NN.png` every 6 s for two minutes: read the ones that show each position (fixed delays from the screen opening drifted off the workflow's clock once). Android leaves
  `android-chart-bars.png` and `android-chart-donut.png`.

## The notifications page

`app/notifications.tsx` (/notifications) demos `@its/glowup-notifications`. The page mounts its
own `NotificationsProvider` so the foreground switches and the event log can drive it; an app
mounts it at the root instead. The page imports only the package. `expo-notifications` is a
dependency of the playground because it is the package's peer, and its config plugin is
listed in `app.config.ts`. On web the page passes `webPush`: `public/glowup-push-sw.js` is a byte-for-byte copy of
the package's service worker (`__tests__/service-worker-copy.test.ts` fails when they drift,
so re-copy it after editing the package's), served under the Pages base URL, and the VAPID
public key comes from `EXPO_PUBLIC_VAPID_PUBLIC_KEY` (the `VAPID_PUBLIC_KEY` repository
variable in `pages.yml`). Browser support is read with `useSyncExternalStore` so the
prerendered HTML still hydrates. Remote push needs a development build; Expo Go on Android
cannot fetch a token.

## The device pages

`app/device/` demos `@its/glowup-device`: an overview (`index.tsx`) and one page per
capability (`info`, `location`, `camera`, `network`, `battery`, `keep-awake`, `orientation`,
`haptics`, `biometrics`, `secure-store`, `sensors`, `media-picker`, `media-library`,
`background-location`). They import only the package's public subpaths. Every capability's native module
(`expo-device`, `expo-application`, `expo-location`, `expo-camera`, netinfo, `expo-battery`,
`expo-keep-awake`, `expo-screen-orientation`, `expo-haptics`, `expo-local-authentication`, `expo-secure-store`, `expo-sensors`, `expo-image-picker`, `expo-media-library`, `expo-task-manager`) is a dependency of the
playground because it is the package's peer, and the package's config plugin is listed in
`app.config.ts` with the playground's purpose strings (`recordAudio: true`: the camera recipe
records video with sound; `sensors.highSamplingRate: true`: the sensors page's level reads every
50 ms, which Android 12+ caps at 200 without it). The camera page is the "recipe": `CameraView` with Material
controls drawn as its children from Glowup components, paused through `useFocusEffect` when
the page loses focus. Video is disabled on web, where expo-camera cannot record.
`site/DevicePermission.tsx` renders a permission's badge and its one action (no settings button
without `openSettings`: the web has none).
The keep-awake and orientation pages hold their wake lock / orientation lock only while
`useIsFocused()`: a page left in the stack stays mounted, and its lock must not follow the
reader to the next page. The biometrics page does the same with `useAppLock`, which there guards
one card rather than the site (the playground has no app lock of its own). The sensors page
reads only while `useIsFocused()` and its switch are on; its level moves an `Animated.ValueXY`
from `useSensorListener`, so a reading renders nothing. Its motion-access section appears only
where a sensor is gated (iOS's barometer, iOS Safari), and its button must stay synchronous
down to `request()`. The media picker page calls `pick()` straight from the press (the web
opens its file dialog only inside the gesture) and shows `getPendingResult()` at mount; the
media library page saves a photo chosen through the picker, and on the web shows its section
as unsupported (the package's `expo.web.ts` keeps expo-media-library out of the web bundle).
The background location page's two tasks are defined in `site/backgroundTasks.ts`, imported by
the playground's own entry file (`index.ts`, `"main"` in `package.json`) before
`expo-router/entry`: Android runs a task headless and iOS relaunches the app for one, with no
route mounted, so a task defined in a page or in `_layout` would be missing then (expo
unregisters a task it cannot find). The handlers write to `site/backgroundLog.ts`, an
in-memory log the page reads; the plugin lists `backgroundLocation` with the foreground
service and geofencing.

**Haptics across the site.** `site/HapticsPreference.tsx` is the root `ThemeProvider` (mounted by
`app/_layout.tsx`): it passes `@its/glowup-device/haptics`'s `hapticFeedback` to
`onInteractionFeedback`, so every Glowup control on every page answers with the platform's
feedback (nothing on web). The switch on /device/haptics turns it off, persisted with
`usePersistentState`. That page's explicit "play one" buttons use `feedback={false}` so a press
does not play twice.

`__tests__/device-pages.test.tsx` renders the pages with the package's in-memory
adapters (`@its/glowup-device/testing`) and drives them: permission, position, photo,
recording, scan, network and battery changes, wake lock, orientation lock, haptics, biometric prompt and app lock, secure store items (plain and protected), sensor readings,
intervals and motion access, picks (options, cancel, the pending result) and saves (permission
prompt, refusal, no library). It mocks
`useFocusEffect`, `useIsFocused` and `useRouter`, since no navigator is mounted, and
`expo-haptics` to assert what the site-wide `hapticFeedback` plays.
A camera control whose handler awaits the end of a recording must not return that promise
to `onClick` (`() => void toggleRecording()`): RTL 14 awaits it and the test deadlocks.

## Dependency pins

`apps/playground` lists `react-native-reanimated`, `react-native-worklets` and
`react-native-gesture-handler` although it imports none of them. They are **pins**: expo-router
depends on them, and without a direct dependency npm resolves releases outside the SDK
(reanimated 4.7 + worklets 0.13, which expo-modules-core rejects). Keep them.

## Keyboard

`site/useKeyboardShortcuts.ts` binds the site's shortcuts to `document` on web and is a no-op
on native. `SiteShell` owns the list — ⌘/Ctrl+K or `/` for the command palette, `[` and `]` to
step through the catalogue, `t` for the scheme, `?` for the list itself — and `ShortcutsDialog`
renders that same array, so a shortcut cannot exist without being documented.

## Responsive

`site/breakpoints.ts` holds the Material 3 window size classes (compact / medium / expanded /
large / extraLarge) and `useLayout()` is the only way to ask about width. Do not compare
`useWindowDimensions().width` to a number anywhere else: the previous screen switched layout at
960 while the drawer switched at 840, and between the two you got a permanent drawer beside a
layout that still believed it was on a phone. `useLayout()` reads the window through
`site/useWindowSize.ts`, never `useWindowDimensions()` directly (see Hydration).

The site's scroll containers (`Page`, the component page, the navigation column, the catalogue
sidebar, the command palette, the code editor) are the library's `ScrollArea`, so every scrollbar is
the themed one, not the browser's white track with arrows; use it for any new page-level scroller.
A `ScrollArea` is a `View` around the `ScrollView`: give it `style={{ flexGrow: 1, flexShrink: 1 }}`
(what a bare ScrollView does on web) where the ScrollView was a flex child, and `ref` still reaches the ScrollView.
`FlatList`s (the icon grid) keep their own scroller.

## Hydration

Every page is prerendered in Node and hydrated in the browser, and the first client render has
to match the HTML or React throws the page away and re-renders it (minified error #418, once
on every page). Six causes were found and fixed; keep them fixed:

- **The window size.** Node's window is 0 × 0 (compact layout); a desktop browser's is not.
  `useWindowSize()` reports the server's size while hydrating and the real one right after.
- **The icon font.** An icon renders empty until its font counts as loaded, and in Node that
  only happens through `useFonts` / `loadAsync`. `app/_layout.tsx` calls
  `useFonts(MaterialCommunityIcons.font)` so the prerender draws icons and the HTML carries the
  `@font-face`; without it the page content (hydrated after the shell, whose icons had loaded
  the font) drew glyphs where the HTML had none.
- **The current time.** The export freezes the build's "now". An example that shows a date or a
  time writes one into its code (`new Date(2026, 0, 15)`), never `new Date()` / `Date.now()`.
- **The library's `Grid`** (`autoSize` and the per-breakpoint `size`) picks its columns from the
  window's size class; it reads the width through a server snapshot too (`packages/ui`,
  `components/internal/useWindowWidth.ts`).
- **The OS colour scheme.** Node has none, a browser may be dark. The library's `ThemeProvider`
  reads `Appearance` through a server snapshot ("no preference") rather than `useColorScheme`.
- **The reader's locale.** The date and time components format weekday names, 12- or 24-hour
  and placeholders with the runtime's locale: Node's in the HTML, the reader's in the browser.
  Their catalogue entries set `clientOnly`, so the stage and the variants render after
  hydration (`site/useHydrated.ts`). A fixed date alone does not cover this.

To check: `EXPO_WEB_DEV_HYDRATE=1 npx expo start --web` hydrates in development, where React
prints the actual diff instead of the minified code. Load pages at a desktop and a phone width,
once with the browser clock moved forward (Playwright's `page.clock`), and once with a dark
scheme and a browser locale other than the build machine's.

## Publishing the documentation site

`apps/playground` is exported to static HTML (`expo-router` with `output: "static"`) and
deployed to GitHub Pages by `.github/workflows/pages.yml` on every push to `master`. Each
route — including every component page — is prerendered to its own file with its own title
and meta description, so a component URL is shareable and crawlable.

Pages serves a project site from a subpath (`/<repo>/`), so the workflow sets
`GLOWUP_BASE_URL` and `app.config.ts` feeds it to `experiments.baseUrl`. Locally the variable
is unset and the site serves from the root. The workflow also writes `.nojekyll` (Jekyll would
drop `_expo/`, where the bundle lives) and copies `+not-found.html` to `404.html`.

The repository must have Pages enabled with **GitHub Actions** as the source; Pages on a
private repository requires GitHub Enterprise Cloud.

## The drag and drop page

`app/drag-and-drop.tsx` (/drag-and-drop) demos the library's `DragDropProvider` / `Draggable` / `Droppable`
as a section of its own, not as catalogue pages: four live boards (columns of pressable cards, a list with a
locked row, a toolbar whose `accept` caps it at three, sections with nested zones), the usage snippet, and the
three generated prop tables (`PropsTable` with `docFor`). The page relies on the root `PortalHost` for the
copy that follows the pointer.

## The pivot page

`app/pivot.tsx` (/pivot) demos `@its/glowup-pivot`: a `PivotGrid` on invented data with the shape of a CRM report (`site/samplePivot.ts`:
sites, four categories under each, a true/false column, a count), and a switch of the engine's locale. Nothing in it comes from a real report.
Jest runs as a phone, so the page test sees the grid's "not available" message; the web grid is tested in the package.
