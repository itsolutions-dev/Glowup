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

## Three generated artefacts, all committed

- `docgen/props.generated.json` — every exported component's prop table, read from the
  library's TypeScript with ts-morph: name, type as written, optionality, JSDoc, and the
  default taken from the destructuring pattern. `npm run docgen -w @its/glowup-playground`
  regenerates it; CI regenerates and fails on a diff. **Never hand-edit it**, and never
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
module, its name in the right group in `catalogue/categories.ts`, and its name in the
`CATALOGUE` list in `__tests__/playground-catalogue.test.tsx`. When the stage needs more than
`<Component {...props} />` (sample data, controlled state, an overlay behind a trigger), give the
entry a `Demo` component (`catalogue/demos.tsx`) instead of adding a branch to
`ComponentPreview.tsx`; a component with no authored preview can reuse that demo as its
gallery (`catalogue/variants/manual/fromDemos.tsx`). The test pins the `CATALOGUE` list
against `FLAT_ORDER`, the registry and the generated docs, so a component catalogued without a
working demo fails there.
It gets its page, its props table and its URL for free.

## The native check screen

`app/native-check.tsx` (/native-check) is a verification screen for the **native smoke job only**
(`.github/workflows/native.yml`); nothing links to it. A build made with
`EXPO_PUBLIC_NATIVE_CHECK_ROUTE=/native-check` opens it a minute after launch (`NativeCheckTrigger` in
`_layout.tsx`; a deep link cannot do it on iOS, which asks "Open in Glowup?" first). It has two parts:

- **Measurements**: normal and dense controls and a button with and without a badge are laid out on the
  device and their sizes compared (Δ height 24 / 12 / 20, badge width +12), so it catches what jest cannot.
  Results are drawn on screen (an iOS screenshot is the only evidence there: its log carries no
  `console.log`) and logged as `NATIVECHECK` lines.
- **Interaction**: a decimal-comma input, a badge button, keyed tabs, a drawer group and a bottom sheet, each
  with a `state=` line. `scripts/android-interact.mjs` drives them on the emulator with `adb` (types,
  taps, `uiautomator dump`) and prints PASS/FAIL per step. iOS has no equivalent from CI. The screen and
  the script are kept in step by hand: add a control there when a component gains behaviour a phone must prove.

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
to `onPress` (`() => void toggleRecording()`): RTL 14 awaits it and the test deadlocks.

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
- **The current time.** The export freezes the build's "now". Date and time stages start from
  `DEMO_DATE` (`catalogue/ComponentPreview.tsx`), never `new Date()`.
- **The library's `Grid`** (`minChildWidth`) falls back to the window width before its first
  layout pass; it reads it through a server snapshot too (`packages/ui`,
  `components/internal/useWindowWidth.ts`).
- **The OS colour scheme.** Node has none, a browser may be dark. The library's `ThemeProvider`
  reads `Appearance` through a server snapshot ("no preference") rather than `useColorScheme`.
- **The reader's locale.** The date and time components format weekday names, 12- or 24-hour
  and placeholders with the runtime's locale: Node's in the HTML, the reader's in the browser.
  Their catalogue entries set `clientOnly`, so the stage and the variants render after
  hydration (`site/useHydrated.ts`). `DEMO_DATE` alone does not cover this.

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
