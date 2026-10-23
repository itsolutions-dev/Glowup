# @its/glowup-ui

A **Material You (Material Design 3)** component library for **React Native + Web** (Expo).
~80 theme-reactive components — layout primitives, buttons, inputs, a form engine with validation,
navigation, dialogs, data grids, progress indicators and a locale-aware date/time picker family —
built on a single design-token system with light/dark support.

> Status: pre-`1.0.0`. The API may still change between minor versions; see
> [`CHANGELOG.md`](CHANGELOG.md).

## Installation

```bash
npm install @its/glowup-ui
```

Then install the peer dependencies your app doesn't already have:

```bash
npx expo install react-native-safe-area-context react-native-svg @expo/vector-icons
```

That is the whole set. On web, `react-native-web` brings `react-dom`, which the web date
picker portals into.

The date and time pickers are pure React Native: the same Material 3 surface renders on iOS,
Android and web, with no OS picker underneath. The locale comes from `Intl` (the browser's
language on web, the device locale under Hermes); pass `locale` to override it.

## Usage

Wrap your app in the providers, then use components:

```tsx
import {
  ThemeProvider,
  AlertProvider,
  ToastProvider,
  Button,
  Typography,
  VStack,
} from "@its/glowup-ui";

export default function App() {
  return (
    <ThemeProvider>
      <AlertProvider>
        <ToastProvider>
          <VStack padding={16} spacing="s">
            <Typography variant="h5">Hello</Typography>
            <Button onClick={() => {}}>Tap me</Button>
          </VStack>
        </ToastProvider>
      </AlertProvider>
    </ThemeProvider>
  );
}
```

### Static web export

With Expo Router's `web.output: "static"` every page is prerendered in Node and hydrated in
the browser, and the first client render must match the HTML. Two things to do in the app:

- **Register the icon font in the root layout**, so the prerender draws the icons too (an
  icon renders empty until its font counts as loaded, and in Node only `useFonts` /
  `loadAsync` make it so — they also put the `@font-face` in the exported HTML):

  ```tsx
  import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
  import { useFonts } from "expo-font";

  export default function RootLayout() {
    useFonts(MaterialCommunityIcons.font);
    // …providers and <Stack />
  }
  ```

- **Render nothing from the window size or the current time on the first render.** Node's
  window is 0 × 0 and its "now" is the build's. Read the size through `useSyncExternalStore`
  with a server snapshot (as `Grid` does internally), and give date pickers a fixed or
  user-chosen value rather than `new Date()`.

### Layout

`Box`, `Stack`/`HStack`/`VStack`, `Spacer`, `Grid`, `AspectRatio`, `Center` and `Break` take
spacing, shape and color as **token names** where it matters (`spacing="m"`, `radius="large"`,
`background="primaryContainer"`), so screens never hardcode a magic value:

```tsx
<Grid container spacing="m">
  <Grid size={{ xs: 12, md: 6 }}>
    <Box padding={16} background="primaryContainer" radius="large">
      …
    </Box>
  </Grid>
  <Grid size={{ xs: 12, md: 6 }}>
    <Box padding={16} background="secondaryContainer" radius="large">
      …
    </Box>
  </Grid>
</Grid>
```

### Toasts

```tsx
const toast = useToast();
toast.success("Saved");
toast.error("Upload failed", { action: { label: "Retry", onClick: retry } });
```

### Interaction feedback (haptics)

`ThemeProvider` reports what the user does through the library's controls, so the app can
answer with a haptic (the library itself plays nothing and depends on no haptics module):

```tsx
import { hapticFeedback } from "@its/glowup-device/haptics";

<ThemeProvider onInteractionFeedback={hapticFeedback}>
  <App />
</ThemeProvider>;
```

The handler gets one of `"press" | "toggle" | "selection" | "longPress"`:

| Kind        | Reported by                                                                                                                              |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `press`     | `Button`, `IconButton`, `FAB`, an action `Chip` and a chip's close button                                                                |
| `toggle`    | `Switch`, `Checkbox` / `CheckboxGroup`, a `selected` `IconButton`, a `"checkbox"` `Chip`, a multi-select `ToggleButtonGroup`             |
| `selection` | `RadioButton` / `RadioGroup`, a `"radio"` `Chip`, a single-choice `ToggleButtonGroup`, each step a `Slider` crosses (with a `step` only) |
| `longPress` | nothing in the library yet: for your own components                                                                                      |

- It is called before the control's own handler, only when the press does something (never for
  a disabled, loading or handler-less control), and a handler that throws never cancels it.
- `feedback={false}` silences one control. A nested `ThemeProvider` without the prop inherits
  the outer one's handler.
- `useInteractionFeedback()` returns the same function for a component of your own (stable
  across renders; it reads the latest handler).

### Dates

Month and weekday names, week start, 12h/24h and AM/PM labels all come from `Intl`, driven by the
device locale (or a `locale` override). Chrome strings default to English — pass i18n values via
`labels`:

```tsx
<DatePicker
  label={t("DUE_DATE")}
  value={dueDate}
  onChange={setDueDate}
  onClear={() => setDueDate(null)}
  clearable
  minimumDate={new Date()}
  isDateDisabled={(d) => d.getDay() === 0 || d.getDay() === 6}
  labels={{ today: t("TODAY"), confirm: t("OK") }}
/>
```

### Theme

All colors, typography, spacing and shape tokens come from the built-in Material You theme.
Access it with the `useTheme()` hook:

```tsx
import { useTheme } from "@its/glowup-ui";

const { theme, toggleTheme } = useTheme();
```

Helpers `getStateColor()` and `getGlowStyles()` are also exported for building custom
theme-reactive components.

## Library layout

`src` is the library source — the code published as `@its/glowup-ui`.
Its public surface is the barrel `src/index.ts`. Layout:

```
src/
├── index.ts          # public API barrel — everything importable from "@its/glowup-ui"
├── components/        # the Material You components
│   ├── CardParts/     # CardTitle, CardContent, CardCover, CardActions
│   ├── List/          # ListItem, ListSection, ListSubheader
│   ├── Dialog/        # Dialog, ConfirmDialog, AlertDialog
│   ├── Progress/      # CircularProgress, LinearProgress
│   ├── Tab/           # Tabs, TabContent
│   ├── ToggleButton/  # ToggleButton, ToggleButtonGroup
│   ├── Layout/        # Box, Stack/HStack/VStack, Spacer, Grid, AspectRatio, Center, AbsoluteCenter, Break
│   ├── internal/      # helpers behind the components: scrollbar.ts, highlight.ts, upload.ts, qr.ts,
│   │                  #   treeModel.ts, formStore.ts, formRules.ts, anchorPlacement.ts, ...
│   │                  #   (public only where index.ts re-exports them: highlight, formatBytes, ...)
│   ├── types.ts       # shared component types (e.g. PressableState)
│   └── *.tsx          # Button, Card, Input, Chip, Select, DataGrid, Tree, Form, Upload, ...
├── hooks/             # useBreakpoint (and useBreakpointValue), useDebounce
└── providers/         # theme + alert infrastructure
    ├── ThemeProvider.tsx   # Material You theme, useTheme(), getStateColor(), getGlowStyles()
    ├── theme.json          # all color / typography / spacing / shape tokens (source of truth)
    ├── AlertProvider.tsx   # cross-platform Alert() (native Alert.alert / web Dialog)
    └── ToastProvider.tsx   # imperative queued toasts via useToast()
```

Styling everywhere is theme-reactive via `useMemo(() => makeStyles(theme), [theme])`, driven
by the tokens in `providers/theme.json`. Every interactive component carries the right
accessibility role/state and reacts to the light/dark theme automatically.

> Icons: any prop typed _icon_ below takes a **MaterialCommunityIcons** name — a kebab-case
> string like `"plus"` or `"bell-outline"` (outline variants append `-outline`).
> The authoritative spec (with full defaults for every prop) is
> [`components.md`](https://github.com/itsolutions-dev/Glowup/blob/master/packages/ui/src/components/components.md)
> in the repository; the documentation site's per-component pages carry the prop tables
> generated from the source.

## Component reference

### Theme, alert & toasts (from `src/providers`)

Exported from the library alongside the components:

- **`ThemeProvider`** — wraps the app; derives a Material You theme from `theme.json`, syncs
  with the OS color scheme, and supports manual toggle.
- **`useTheme()`** → `{ theme, toggleTheme, palette, setPalette }`; the scheme is `theme.isDark`.
- **`onInteractionFeedback`** (a `ThemeProvider` prop) + **`useInteractionFeedback()`** — see
  [Interaction feedback](#interaction-feedback-haptics).
- **`getStateColor(bg, on, state)`** — composites a hover/press state-layer color over a base.
- **`getGlowStyles(theme, active, variant?)`** — the M3 "glow" focus/hover ring (`variant="error"` for error state).
- **`AlertProvider`** + **`Alert(title, message, buttons)`** — cross-platform alert: native
  `Alert.alert` on iOS/Android, custom `Dialog` on web. Mounting `AlertProvider` is enough.
- **`ToastProvider`** (`position`) + **`useToast()`** — imperative, queued toasts (see
  [`ToastProvider` / `useToast()`](#toastprovider--usetoast) below).
- **`ViewportProvider`** (`width`) — makes `useBreakpoint`, `Grid` and the date pickers' dialog-or-popover
  choice see `width` instead of the window's, to preview a phone layout inside a desktop page (the
  playground's 360 / 720 frames use it). It resizes nothing; with no `width` the real window is reported.

Theme tokens: colors (primary/secondary/tertiary/error + container & surface tones, the inverse
pair `inverseSurface` / `inverseOnSurface` / `inversePrimary`, plus `surfaceTint` and `scrim`, all
with light/dark values), a full M3 type scale (`displayLarge` → `labelSmall`), spacing
(`xs:4 s:8 m:16 l:24 xl:32`) and shape radii (`small:8 medium:12 large:16 extraLarge:28`).

### Foundations

#### `Typography`

Renders themed text at an M3 type scale.

| Prop     | Type                                                                                                     | Default     | Req |
| -------- | -------------------------------------------------------------------------------------------------------- | ----------- | --- |
| children | ReactNode                                                                                                | —           | ✓   |
| variant  | `"h1"`…`"h6"`, `"subtitle1"`, `"subtitle2"`, `"body1"`, `"body2"`, `"button"`, `"caption"`, `"overline"` | `h1`        |     |
| color    | theme colour token (`primary`, `onSurfaceVariant`, `error`…) or any colour string                        | `onSurface` |     |
| fontSize | number (the line height scales with it)                                                                  |             |     |
| nowrap   | boolean (one line, ending in an ellipsis)                                                                | `false`     |     |
| align    | `"left" \| "center" \| "right" \| "justify"`                                                             |             |     |
| onClick  | () => void (makes the text pressable)                                                                    |             |     |
| style    | TextStyle                                                                                                |             |     |

The names are drawn with the theme's type-scale roles: `h1`–`h3` are `displayLarge`–`displaySmall`,
`h4` / `h5` are `headlineLarge` / `headlineSmall`, `h6` is `titleLarge`, `subtitle1` / `subtitle2` are
`titleMedium` / `titleSmall`, `body1` / `body2` are `bodyLarge` / `bodyMedium`, `button` is
`labelLarge`, `caption` is `bodySmall` and `overline` is `labelSmall`. The role names themselves
(`displayLarge`…`labelSmall`) are accepted too and give the same styles. Every other `Text` prop is
forwarded.

#### `Divider`

Horizontal or vertical rule, optionally with a centered label.

| Prop           | Type                                                 | Default      |
| -------------- | ---------------------------------------------------- | ------------ |
| orientation    | `"horizontal" \| "vertical"`                         | `horizontal` |
| inset          | number                                               | `0`          |
| thickness      | number                                               | `1`          |
| contentSpacing | number                                               | `16`         |
| children       | ReactNode (string → centered label, horizontal only) |              |

#### `Paper`

Elevated / tonal surface container.

| Prop      | Type                                       | Default |
| --------- | ------------------------------------------ | ------- |
| children  | ReactNode (required)                       | —       |
| elevation | number 0–5 (maps to surface tone + shadow) | `1`     |
| outline   | boolean (1px outlineVariant border)        | `false` |
| glow      | boolean (glow instead of shadow)           | `false` |

#### `Card`

Pressable content surface.

| Prop               | Type                                             | Default  |
| ------------------ | ------------------------------------------------ | -------- |
| children           | ReactNode (required)                             | —        |
| variant            | `"elevated" \| "filled" \| "outlined" \| "glow"` | `filled` |
| onClick            | () => void (makes it interactive, button role)   |          |
| accessibilityLabel | string                                           |          |

Compound parts, also exported standalone as `CardTitle` / `CardContent` / `CardCover` /
`CardActions`. Compose these instead of hand-building a header row:

```tsx
<Card variant="elevated" onClick={open}>
  <Card.Cover source={photo} alt="Impianto 4" />
  <Card.Title title="Impianto 4" subtitle="Manutenzione programmata" />
  <Card.Content>
    <Typography variant="body2">Prossimo intervento: 12 marzo</Typography>
  </Card.Content>
  <Card.Actions>
    <Button variant="text" onClick={postpone}>
      Rinvia
    </Button>
    <Button onClick={confirm}>Conferma</Button>
  </Card.Actions>
</Card>
```

| Part           | Props                                                                                                         |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| `Card.Title`   | `title` (required), `subtitle`, `startIcon`, `endIcon`, `titleNumberOfLines` (1), `subtitleNumberOfLines` (2) |
| `Card.Content` | `children` (required)                                                                                         |
| `Card.Cover`   | `source` + `alt` (both required), `ratio` (`16/9`) — bleeds past the card padding                             |
| `Card.Actions` | `children` (required), `align`: `"start" \| "end" \| "space-between"` (`end`)                                 |

#### `Icon`

Source-agnostic icon primitive. Use it when the icon may not be a MaterialCommunityIcons glyph —
a bundled bitmap, an SVG, a custom glyph set.

| Prop       | Type                                                         | Default     |
| ---------- | ------------------------------------------------------------ | ----------- |
| source     | `IconSource` (required)                                      | —           |
| size       | number                                                       | `24`        |
| color      | string (tints a glyph; leave unset for a full-colour bitmap) | `onSurface` |
| flipForRTL | boolean (mirrors directional glyphs under RTL)               | `false`     |

`IconSource` is a MaterialCommunityIcons name, an `ImageSourcePropType`, a
`({ size, color }) => ReactNode` render function, or a ready-made element.

#### `TouchableRipple`

A `Pressable` that paints the M3 state layer — 8% hover, 10% focus, 12% press — over a surface,
with the platform ripple on Android. Reach for it instead of re-deriving hover/press colours.

| Prop          | Type                                                     | Default     |
| ------------- | -------------------------------------------------------- | ----------- |
| children      | ReactNode (required)                                     | —           |
| underlayColor | string (the surface the layer sits on)                   | `surface`   |
| rippleColor   | string (the "on" role of that surface)                   | `onSurface` |
| borderless    | boolean (tint only, no container background)             | `false`     |
| borderRadius  | number (match the parent so the layer doesn't bleed out) |             |
| activeStyle   | ViewStyle (applied while hovered or pressed)             |             |

Plus every `Pressable` prop except `style`/`children`. The `useStateLayer(base, on)` hook exports
the same colours for a component that already owns its `Pressable`.

#### `Portal` / `Portal.Host`

Renders an overlay at the host instead of in place, so it escapes a clipping parent, sits above
siblings regardless of elevation, and is not dragged around by a `ScrollView`. Mount the host
once near the app root. With no host above it, `Portal` renders its children inline, so opting in
is safe in a tree that has not been wrapped.

```tsx
<ThemeProvider>
  <Portal.Host>
    <App />
  </Portal.Host>
</ThemeProvider>
```

`usePortalHost()` reports whether a host is mounted above the caller.

**Which overlays use it.** `Tooltip`, `HoverCard` (on the web; on native it opens in a `Modal`) and
`Autocomplete`'s suggestion list render through the Portal when a host is mounted, and stay
anchored in place when one is not. Those are the only overlays in the kit that lay out inline:
`Dialog`, `ConfirmDialog`, `AlertDialog`, `Popover`, `Menu`,
`Select`, `BottomSheet` and a swipeable `Drawer` all go through a native `Modal`, which is a
separate window on native and a `createPortal` into `document.body` on web — already stronger
isolation than an in-tree Portal, so they are deliberately left alone. Portal exists for the cases a `Modal`
cannot serve: a tooltip must never take touches, and the Autocomplete list must not steal
focus from the field being typed into.

### Layout

Token-driven layout primitives, so screens stop hardcoding spacing. `SpacingValue` is a
`theme.spacing` key (`"xs" | "s" | "m" | "l" | "xl"`) or a raw number (`SpacingInput` also takes a
numeric string such as `"12"`); `RadiusValue` is a `theme.shape` key or a raw number; `ColorValue`
is a theme color token or any raw color.

#### `Box`

A `View` that reads shape and color off the theme, with a `variant` for the usual layouts. Extends
`ViewProps`, so anything not covered by a prop still goes through `style`, merged last.

| Prop                     | Type                                                                                                                                                                                                                                           | Default    |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| variant                  | `"standard" \| "flex" \| "column-flex" \| "centered-flex" \| "centered-column-flex" \| "full-page-flex" \| "full-page-column-flex" \| "full-size-flex" \| "full-size-column" \| "full-size-centered-flex" \| "full-size-centered-column-flex"` | `standard` |
| padding / margin         | number (px, every edge; one edge or axis goes through `style`)                                                                                                                                                                                 |            |
| background / borderColor | ColorValue                                                                                                                                                                                                                                     |            |
| radius                   | RadiusValue                                                                                                                                                                                                                                    |            |
| borderWidth              | number                                                                                                                                                                                                                                         |            |
| gap                      | number (px between children)                                                                                                                                                                                                                   |            |
| align / justify          | `alignItems` / `justifyContent` values                                                                                                                                                                                                         |            |
| width / height           | ViewStyle dimensions                                                                                                                                                                                                                           |            |
| wrap                     | boolean (children flow onto the next line)                                                                                                                                                                                                     |            |
| style                    | ViewStyle (merged last, over the variant and every other prop)                                                                                                                                                                                 |            |

`standard` is a plain column, `flex` a row and `column-flex` a column; `centered-flex` and
`centered-column-flex` centre on both axes (`Center` below is a `Box` with one of them); `full-page-*` fill the screen (`flex: 1`, minimum height 100%) and `full-size-*` are 100%
wide and high.

#### `Stack` / `HStack` / `VStack`

Evenly spaced children via `gap`, so spacing stays right when children are conditionally
rendered. `HStack` and `VStack` lock the axis. Takes every `Box` prop except `variant` and `gap`.

| Prop      | Type                                                                                    | Default    |
| --------- | --------------------------------------------------------------------------------------- | ---------- |
| direction | `"vertical" \| "horizontal"`                                                            | `vertical` |
| spacing   | SpacingInput (a token, a number of px or a numeric string)                              | `"s"`      |
| dividers  | ReactNode (`true` draws a hairline between the children; a node is used as the divider) |            |
| reverse   | boolean                                                                                 |            |

#### `Spacer` / `AspectRatio` / `Grid`

- **`Spacer`** — `size` (SpacingValue) for a fixed gap on `axis`, or no props to absorb the
  leftover space and push siblings apart.
- **`AspectRatio`** — `ratio` (default `1`), e.g. `16 / 9`; takes the `Box` props except `height`.
- **`Grid`** — a 12-column responsive grid. A `container` lays its items out in a wrapping row, and
  an item's `size` is how many columns it spans: a number, `"grow"` (share the rest of the row),
  `"auto"` (size to content) or one per breakpoint (`{ xs: 12, md: 6 }`, mobile-first; `xs` from
  0 dp, `sm` 600, `md` 840, `lg` 1200, `xl` 1600). Also `columns` (`12`), `spacing` (a token, px or
  `{ row, column }`, `"s"`), `wrap` (`true`) and `autoSize` (sizes the children that have no `size`
  of their own). The widths come from the container's measured width, so it needs one from its
  parent; a `Grid` that is neither a container nor inside one is a plain `View`.

```tsx
<Grid container spacing="m">
  <Grid size={{ xs: 12, md: 6 }}>…</Grid>
  <Grid size={{ xs: 12, md: 6 }}>…</Grid>
</Grid>
```

#### `Center`

A `Box` that centres its children on both axes. Takes every `Box` prop except `variant` (`width`,
`height`, `gap`, `background`…).

| Prop      | Type                                                                             | Default |
| --------- | -------------------------------------------------------------------------------- | ------- |
| direction | `"row" \| "column"` (how the children flow; each is centred on both axes anyway) | `row`   |

```tsx
<Center direction="column" height={200} gap={8}>
  <CircularProgress />
  <Typography variant="body2">Syncing</Typography>
</Center>
```

#### `AbsoluteCenter`

Centres its child in the parent's box, out of the flow: it fills the parent with absolute
positioning, so the parent's own content is not pushed around. The parent needs a size of its own.
The layer lets touches through to what lies under it; only the child takes them. Extends `ViewProps`.

| Prop | Type                                   | Default |
| ---- | -------------------------------------- | ------- |
| axis | `"both" \| "horizontal" \| "vertical"` | `both`  |

On the other axis the child keeps its normal place.

```tsx
<Box height={160} width={360}>
  <AbsoluteCenter>
    <CircularProgress />
  </AbsoluteCenter>
</Box>
```

#### `Break`

Lets a child out of its container's padding: a negative margin of the same size, so an image or a
divider runs edge to edge inside a padded `Box`, `Paper` or `Card`. Give each edge the padding it
should cancel. Extends `ViewProps`.

| Prop                    | Type                                                                            | Default |
| ----------------------- | ------------------------------------------------------------------------------- | ------- |
| inline / block          | SpacingValue (both horizontal edges / both vertical edges)                      |         |
| inlineStart / inlineEnd | SpacingValue (the start and end edge: left and right in LTR; win over `inline`) |         |
| blockStart / blockEnd   | SpacingValue (the top and bottom edge; win over `block`)                        |         |

```tsx
<Box padding={16} background="surfaceContainerLow" radius="medium" gap={8}>
  <Typography variant="body2">Text stays inside the padding.</Typography>
  <Break inline="m">
    <Image source={photo} alt="Impianto 4" />
  </Break>
</Box>
```

#### `Visible`

Shows its children only while every condition holds: your own (`when`) and the window's Material 3
size class — `compact` (from 0 dp), `medium` (600), `expanded` (840), `large` (1200), `extraLarge`
(1600), the thresholds of `Grid`'s `xs`…`xl` — read through `useBreakpoint()`, so a
`ViewportProvider` is followed. While a prerendered page hydrates the class is `compact`, then the
real one.

| Prop        | Type                                                                                                                     | Default |
| ----------- | ------------------------------------------------------------------------------------------------------------------------ | ------- |
| when        | boolean (a condition of your own)                                                                                        | `true`  |
| above       | size class (from this one up: `"medium"` is medium, expanded, large…)                                                    |         |
| below       | size class (only the classes smaller than this one: `"medium"` is compact only)                                          |         |
| only        | size class \| size class[]                                                                                               |         |
| fallback    | ReactNode (drawn in place of the children while they are not shown)                                                      |         |
| keepMounted | boolean (hides with `display: "none"` instead of unmounting, so their state survives; they are then wrapped in a `View`) | `false` |

```tsx
<Visible
  above="expanded"
  fallback={<NavBar items={items} activeId={tab} onClick={setTab} />}
>
  <NavigationRail items={items} activeId={tab} onItemPress={setTab} />
</Visible>
```

`useBreakpointValue(values, fallback)` picks a value by size class: the one set for the current
class, or else for the largest class below it (mobile first, like `Grid`); `fallback` is what a window
smaller than every class set gets.

```tsx
const columns = useBreakpointValue({ compact: 1, medium: 2, large: 4 }, 1);
```

`useBreakpoint(overrides?)` returns `{ width, sizeClass, atLeast(size) }` for your own checks; pass a
partial set of thresholds (`{ large: 1300 }`) to change where a class starts.

#### `ScrollArea`

A scrollable area whose scrollbars are drawn from the theme instead of the platform's, on web and
native alike: the native indicators are hidden and a thumb and track take their place (a draggable
thumb, a track that pages by a press). Keyboard, wheel and touch scrolling stay the platform's own,
because the content sits in a real `ScrollView`. The scrollbars are laid over the content, not
beside it: pad the content (`contentContainerStyle`) by `scrollbarSize` where they must not cover
it. Every `ScrollView` prop not listed is forwarded.

| Prop                  | Type                                                                                                                                                                                                         | Default    |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- |
| orientation           | `"vertical" \| "horizontal" \| "both"`                                                                                                                                                                       | `vertical` |
| type                  | `"auto" \| "always" \| "scroll" \| "hover"` (when the bars show: while the content overflows, always, while scrolling, or while the pointer is over the area — `hover` acts like `scroll` without a pointer) | `auto`     |
| scrollbarSize         | number (dp; raise it on touch screens for a bigger grab area)                                                                                                                                                | `10`       |
| scrollHideDelay       | number (ms a `scroll` or `hover` bar stays after the last scroll, drag or hover)                                                                                                                             | `600`      |
| height / maxHeight    | DimensionValue (fixed height / the height at which the content starts to scroll; left out, it sizes to the content)                                                                                          |            |
| width                 | DimensionValue                                                                                                                                                                                               |            |
| contentContainerStyle | ViewStyle (the view wrapping the children: padding, `flexGrow`)                                                                                                                                              |            |
| onScroll              | like `ScrollView`'s; with `orientation="both"` the event carries both axes                                                                                                                                   |            |
| slotStyles            | `{ track?, thumb? }` style overrides                                                                                                                                                                         |            |
| ref                   | a ref to the `ScrollView` (the horizontal one for `orientation="horizontal"`): `scrollTo`, `scrollToEnd`…                                                                                                    |            |

```tsx
<ScrollArea maxHeight={240} type="hover">
  {items}
</ScrollArea>
```

### Buttons & actions

#### `Button`

| Prop               | Type                                                                             | Default              |
| ------------------ | -------------------------------------------------------------------------------- | -------------------- |
| children           | ReactNode (label)                                                                |                      |
| onClick            | () => void                                                                       |                      |
| variant            | `"filled" \| "tonal" \| "outlined" \| "text"`                                    | `filled`             |
| color              | `ButtonColor` (a colour role, see below)                                         | `primary`            |
| iconName           | icon                                                                             |                      |
| iconPosition       | `"start" \| "end"`                                                               | `start`              |
| size               | number (icon size)                                                               | `theme.shape.medium` |
| fullWidth          | boolean                                                                          | `false`              |
| loading            | boolean (inline spinner)                                                         | `false`              |
| disabled           | boolean                                                                          | `false`              |
| type               | `"button" \| "submit"` (`"submit"` submits the enclosing `Form` after `onClick`) | `button`             |
| accessibilityLabel | string (falls back to string child)                                              |                      |

`color` takes a colour role: `primary`, `secondary`, `tertiary`, `error` (the destructive
treatment), `success`, `warning`, `info` or `neutral`. `IconButton`, `Chip` and `Badge` take the
same roles.

#### `IconButton`

Square, icon-only action — `Button` with only an icon comes out pill-shaped and label-padded.

| Prop               | Type                                                              | Default    |
| ------------------ | ----------------------------------------------------------------- | ---------- |
| icon               | icon (required)                                                   | —          |
| accessibilityLabel | string (required — an icon carries no accessible name)            | —          |
| onClick            | () => void                                                        |            |
| variant            | `"standard" \| "filled" \| "tonal" \| "outlined"`                 | `standard` |
| color              | same roles as `Button` (omit for the neutral M3 look)             |            |
| title              | string (tooltip text: hover / focus on web, long press on native) |            |
| size               | `"small" \| "medium" \| "large"` (32 / 40 / 48)                   | `medium`   |
| selected           | boolean — M3 toggle-icon-button state                             |            |
| loading / disabled | boolean                                                           |            |

#### `Link`

Inline navigational text.

| Prop             | Type                                                                  | Default                    |
| ---------------- | --------------------------------------------------------------------- | -------------------------- |
| children         | string (label, required)                                              | —                          |
| href             | string — opened with `Linking.openURL`; ignored when `onPress` is set |                            |
| onPress          | () => void                                                            |                            |
| variant          | typography key                                                        | `bodyMedium`               |
| underline        | `"always" \| "hover" \| "none"`                                       | `hover`                    |
| showExternalIcon | boolean                                                               | `true` for a remote `href` |
| externalIcon     | icon                                                                  | `open-in-new`              |
| color            | string                                                                | `colors.primary`           |
| disabled         | boolean                                                               |                            |

#### `Clipboard`

A copy trigger: an icon button that copies `value`, then shows a check (and announces "Copied") for a
moment. The library depends on no clipboard module. On web it works as is (the browser clipboard
API, with the old `execCommand("copy")` where that is missing). On native pass `copy`, a
`ClipboardWriter` — `expo-clipboard`'s `setStringAsync` fits — or only `onCopy`, which then does the
copying; with neither, nothing is drawn.

A `ClipboardWriter` is `(text: string) => void | Promise<unknown>`: throw or reject when the text
could not be written; what it resolves to is ignored, so a writer that resolves a boolean
(`setStringAsync`) is fine.

| Prop        | Type                                                                                                                               | Default    |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| value       | string (the text a press copies, required)                                                                                         | —          |
| copy        | `ClipboardWriter` (web default: the clipboard API)                                                                                 |            |
| onCopy      | (value) => void (after it was copied)                                                                                              |            |
| timeout     | number (ms the check shows)                                                                                                        | `1500`     |
| variant     | `IconButton`'s variants                                                                                                            | `standard` |
| color       | `ColorRole` (the check is always `success`)                                                                                        |            |
| size        | `"small" \| "medium" \| "large"` (`small` suits a button beside a value)                                                           | `large`    |
| label       | string (accessible name before the copy)                                                                                           | `Copy`     |
| copiedLabel | string (accessible name after it, also announced)                                                                                  | `Copied`   |
| disabled    | boolean                                                                                                                            |            |
| children    | ReactNode (the content of the trigger, drawn as a pressable) \| `({ copied, copy }) => ReactNode` (draws the whole trigger itself) |            |

```tsx
import { setStringAsync } from "expo-clipboard";

<Clipboard value={apiKey} copy={setStringAsync} />

<Clipboard value={apiKey} copy={setStringAsync}>
  {({ copied, copy }) => (
    <Button onClick={copy}>{copied ? "Copied" : "Copy key"}</Button>
  )}
</Clipboard>
```

`useClipboard({ timeout, copy, onCopy, announcement })` is the same without the trigger. It returns
`{ copy(text), copied }`; `copy` resolves `true` once the text is copied and `false` when the write
was refused or there was nothing to write with. `CaptionValue` (`enableCopy`) and `CodeBlock`
(`copyable`) copy through it and take the same `copy` and `onCopy`.

#### `Download`

A button that saves a file: the content you hold (a string as text, an object as JSON, a `Blob`) or
the file at a `url`. On web it works as is: a temporary `<a download>` link, a `url` fetched into a
`Blob` first (browsers ignore `download` on a cross-origin link). On native, text and links go to
the system share sheet; pass `save` (`expo-file-system` and `expo-sharing`) to write real files and
for a `Blob`, which has no default there. A `url` is not fetched on native: `save` receives it as
`file.url` and downloads it its own way.

A `DownloadSaver` is `(file: DownloadFile) => void | Promise<void>`, with `file` =
`{ name, mimeType, data?, url? }`: throw or reject when the file could not be saved.

| Prop       | Type                                                                                                 | Default    |
| ---------- | ---------------------------------------------------------------------------------------------------- | ---------- |
| data       | string \| object \| `Blob` (text, JSON, binary; wins over `url`)                                     |            |
| url        | string                                                                                               |            |
| filename   | string (default: the end of `url`, else `download`, `download.txt` or `download.json`)               |            |
| mimeType   | string (default: from the extension of `filename`, else by the kind of `data`)                       |            |
| save       | `DownloadSaver` (web default: the link; native default: the share sheet)                             |            |
| onDownload | (file) => void (after it was saved)                                                                  |            |
| onError    | (error) => void (fetching or saving failed)                                                          |            |
| children   | ReactNode (the label) \| `({ download, downloading }) => ReactNode` (draws the whole trigger itself) | `Download` |
| icon       | icon                                                                                                 | `download` |
| variant    | `Button`'s variants                                                                                  | `filled`   |
| color      | `ColorRole`                                                                                          | `primary`  |
| disabled   | boolean                                                                                              |            |

```tsx
<Download data={rows} filename="rows.json">
  Export rows
</Download>
<Download url="https://example.com/report.pdf" />
```

`useDownload({ save, onDownload, onError })` saves from an event handler and returns
`{ download({ data, url, filename, mimeType }), downloading, error }`; `download` resolves `true`
once the file is saved and `false` if it failed.

```tsx
const { download, downloading } = useDownload();

<Button
  loading={downloading}
  onClick={() => download({ data: csv, filename: "rows.csv" })}
>
  Export
</Button>;
```

#### `FAB` — Floating Action Button

Floating by default: absolutely positioned, respecting safe-area insets. Set
`placement="inline"` to drop the positioning and put the FAB in a toolbar or a card action row.
`variant` picks the shape: `"icon"` (a round, icon-only button), `"extended"` (the label beside the
icon) or `"animated"` (the label folds into the icon and back).

| Prop        | Type                                                                               | Default        |
| ----------- | ---------------------------------------------------------------------------------- | -------------- |
| icon        | icon (required)                                                                    | —              |
| onClick     | () => void (required)                                                              | —              |
| label       | string (the text of `extended` / `animated`; the accessible name of every variant) |                |
| variant     | `"icon" \| "extended" \| "animated"`                                               | `icon`         |
| size        | `"small" \| "medium" \| "large"` (40 / 56 / 96)                                    | `medium`       |
| placement   | `"floating" \| "inline"`                                                           | `floating`     |
| position    | `"bottom-right" \| "bottom-left" \| "top-right" \| "top-left"`                     | `bottom-right` |
| disabled    | boolean                                                                            |                |
| extended    | boolean (`animated` only: shows the label or collapses to the icon)                | `true`         |
| animateFrom | `"left" \| "right"` (`animated` only: edge the label grows from)                   | `right`        |
| iconMode    | `"static" \| "dynamic"` (`animated` only: icon stays put, or travels)              | `static`       |
| duration    | number (ms, `animated` only)                                                       | `150`          |
| testID      | string                                                                             |                |

Drive `extended` from a scroll offset to get the M3 shrink-on-scroll behaviour:

```tsx
const [extended, setExtended] = useState(true);

<ScrollView
  onScroll={(e) => setExtended(e.nativeEvent.contentOffset.y <= 0)}
  scrollEventThrottle={16}
>
  …
</ScrollView>
<FAB variant="animated" icon="plus" label="Nuovo intervento" extended={extended} onClick={create} />
```

#### `SpeedDial`

FAB that expands a stack of labeled actions.

| Prop     | Type                                                            | Default        |
| -------- | --------------------------------------------------------------- | -------------- |
| actions  | `SpeedDialAction[]` = `{ id, label, icon, onPress }` (required) | —              |
| mainIcon | icon (rotates 45° when open, required)                          | —              |
| position | same values as FAB                                              | `bottom-right` |

#### `ToggleButton`

Single segment; usually used via `ToggleButtonGroup`.

| Prop              | Type                                                | Default  |
| ----------------- | --------------------------------------------------- | -------- |
| active            | boolean (required)                                  | —        |
| onPress           | () => void (required)                               | —        |
| label             | string                                              |          |
| icon              | icon                                                |          |
| isFirst / isLast  | boolean (rounds outer corners in a group)           |          |
| disabled          | boolean                                             | `false`  |
| grow              | boolean (equal share of the group width)            | `false`  |
| showSelectedCheck | boolean (check mark replaces the glyph when active) | `false`  |
| accessibilityRole | `"radio" \| "checkbox" \| "button"`                 | `button` |

#### `ToggleButtonGroup`

Segmented button set (single or multi select).

Announces itself correctly: a single-select group is a `radiogroup` of `radio`s, a multi-select
one a set of `checkbox`es.

| Prop               | Type                                                         | Default |
| ------------------ | ------------------------------------------------------------ | ------- |
| options            | `{ label?, icon?, value, disabled? }[]` (required)           | —       |
| value              | string \| string[] (array when `multiSelect`, required)      | —       |
| onValueChange      | (val) => void (required)                                     | —       |
| multiSelect        | boolean                                                      | `false` |
| disabled           | boolean (whole group)                                        | `false` |
| fullWidth          | boolean (segments share the row equally)                     | `false` |
| showSelectedCheck  | boolean (M3 segmented-button check mark)                     | `false` |
| accessibilityLabel | string (names the group — a set of choices needs a question) |         |

#### `Chip`

| Prop     | Type                                                         | Default   |
| -------- | ------------------------------------------------------------ | --------- |
| label    | string (required)                                            | —         |
| onClick  | () => void (makes body pressable)                            |           |
| onClose  | () => void (renders trailing X)                              |           |
| icon     | icon (leading)                                               |           |
| selected | boolean (check + tertiary tone)                              | `false`   |
| variant  | `"filled" \| "tonal" \| "outlined"`                          | `filled`  |
| color    | same roles as `Button` (omit for the neutral secondary look) |           |
| size     | `"small" \| "medium" \| "large"` (24 / 32 / 40px)            | `medium`  |
| border   | `"rounded" \| "squared" \| "circular"` (corner shape)        | `rounded` |
| disabled | boolean                                                      | `false`   |

#### `ButtonGroup`

M3 Expressive button group — `type="standard"` or `"connected"` (the successor of segmented
buttons), single or `multiSelect`, sizes `xs` / `s` / `m`. Same `options` / `value` /
`onValueChange` shape as `ToggleButtonGroup`.

#### `SplitButton`

A primary action (`children`, `iconName`, `onPress`) joined to a trailing button that opens a
`Menu` of `items` (`MenuItem`s, so each takes `onClick`).

#### `ChipGroup`

Filter chips with the selection handled: single (optionally `required`) or `multiple`,
wrapping or horizontally scrolling. `onChange` receives the selected value (or the array of values
with `multiple`); `variant` is the look of the chips, `outlined` by default.

### Inputs & forms

#### `Input`

Text field (outlined or filled) with affixes, icons, multiline and number mode.

| Prop                       | Type                                                                                                                                        | Default    |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| value                      | string (required)                                                                                                                           | —          |
| onChange                   | (text) => void (required)                                                                                                                   | —          |
| label / placeholder        | string                                                                                                                                      |            |
| type                       | `"text" \| "number"` (number = decimal keypad + sanitizing)                                                                                 | `text`     |
| variant                    | `"outlined" \| "filled"` (the look of the box: `filled` is tinted, with its border only while focused or in error, like `PinInput`'s cells) | `outlined` |
| labelPlacement             | `"inside" \| "outside"` (outside = above the box; independent of `variant`)                                                                 | `outside`  |
| fullWidth                  | boolean (`false` shrinks the field to its content)                                                                                          | `true`     |
| precision                  | number (decimals, number type)                                                                                                              |            |
| prefix / suffix            | string (inline affix)                                                                                                                       |            |
| leadingIcon / trailingIcon | icon                                                                                                                                        |            |
| onTrailingIconPress        | () => void                                                                                                                                  |            |
| endAdornment               | ReactNode (an element after `suffix` / `trailingIcon`: an `IconButton`, a spinner; takes its own touches)                                   |            |
| inputProps                 | `InputTextInputProps` (`TextInput` hints and handlers: `autoComplete`, `textContentType`, `returnKeyType`…)                                 |            |
| inputRef                   | `Ref<TextInput>` (focus it, select its text)                                                                                                |            |
| error                      | string (message + error styling)                                                                                                            |            |
| helperText                 | string (hidden while error shown)                                                                                                           |            |
| required                   | boolean (asterisk on label)                                                                                                                 |            |
| disabled / readonly        | boolean                                                                                                                                     |            |
| secureTextEntry            | boolean (hides the text; `PasswordField` adds the reveal button)                                                                            |            |
| maxLength                  | number                                                                                                                                      |            |
| multiline                  | boolean                                                                                                                                     | `false`    |
| rows                       | number (visible lines of a `multiline` field)                                                                                               | `4`        |
| minHeight                  | number                                                                                                                                      | `56`       |
| onFocus / onBlur           | () => void                                                                                                                                  |            |

#### `PasswordField`

An `Input` for passwords: the text is hidden, with a labelled eye button to reveal it, the autofill
and keyboard hints a password manager needs, and an optional strength meter. The typed text is
never put into an accessibility prop, hidden or revealed. Takes every `Input` prop except
`secureTextEntry`, `type`, `precision`, `decimalSeparator`, `allUpperCase`, `multiline`, `rows`,
`trailingIcon`, `onTrailingIconPress` and `endAdornment` (the eye button sits there).

| Prop                      | Type                                                                                                                         | Default                           |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| showToggle                | boolean (the eye button; turn it off for a field that must never be revealed)                                                | `true`                            |
| defaultVisible            | boolean (starts revealed, uncontrolled)                                                                                      | `false`                           |
| visible / onVisibleChange | boolean / (visible) => void (controls whether the text is revealed)                                                          |                                   |
| toggleLabels              | `{ show?, hide? }` (accessible names of the eye button)                                                                      | `Show password` / `Hide password` |
| showStrength              | boolean (a meter under the field once something is typed, scored by `passwordStrength`; for a field that creates a password) | `false`                           |
| strengthLabels            | string[5] (the words of the meter, very weak to strong)                                                                      | `Very weak` … `Strong`            |
| autoComplete              | `"current-password" \| "new-password"` (fill the saved password, or offer to generate and save a new one)                    | `current-password`                |

```tsx
<PasswordField label="Password" value={password} onChange={setPassword} />
<PasswordField
  label="New password"
  value={password}
  onChange={setPassword}
  autoComplete="new-password"
  showStrength
/>
```

`passwordStrength(value)` is the score behind the meter, `0` (very weak) to `4` (strong): one point
each for 8 or more characters, 12 or more, at least two character classes and at least three,
capped at 1 for a password under 6 characters, one repeated character, digits only or one of a
handful of the most common passwords. It is a hint to show next to the field, not a security check —
it knows no dictionary beyond that handful, so use a real estimator where that matters.

#### `Select`

Dropdown built on `Popover`; single or multi select, optional chip display.

| Prop            | Type                                                                                                                                        | Default            |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| options         | `Option[]` = `{ id, label, value, icon? }` (required)                                                                                       | —                  |
| value           | any (single selection, `null` for none, required)                                                                                           | —                  |
| onChange        | (value) => void (required; `null` when a `nullable` select is cleared)                                                                      | —                  |
| label           | string                                                                                                                                      |                    |
| placeholder     | string                                                                                                                                      | `Select an option` |
| variant         | `"outlined" \| "filled"` (the look of the box: `filled` is tinted, with its border only while focused or in error, like `PinInput`'s cells) | `outlined`         |
| labelPlacement  | `"inside" \| "outside"` (inside = small, above the value; independent of `variant`)                                                         | `outside`          |
| fullWidth       | boolean (`false` shrinks the select to its content)                                                                                         | `true`             |
| nullable        | boolean (clear button; picking the selected option again deselects)                                                                         | `false`            |
| emptyMessage    | string (shown in the open list when `options` is empty)                                                                                     | `No options`       |
| disabledOptions | `RegExp` \| `(string \| number)[]` (values that stay visible but cannot be picked)                                                          |                    |
| error           | string                                                                                                                                      |                    |
| disabled        | boolean                                                                                                                                     |                    |
| multiple        | boolean                                                                                                                                     | `false`            |
| showAsChips     | boolean (render selection as chips)                                                                                                         | `false`            |
| selectedValues  | any[] (multi-select set)                                                                                                                    | `[]`               |
| toggleOptions   | (value) => void (multi-select handler)                                                                                                      |                    |

#### `Checkbox`

| Prop             | Type                       | Default |
| ---------------- | -------------------------- | ------- |
| checked          | boolean (required)         | —       |
| onValueChange    | (value) => void (required) | —       |
| label            | string                     |         |
| labelPosition    | `"left" \| "right"`        | `right` |
| indeterminate    | boolean (mixed state)      |         |
| disabled / error | boolean                    |         |

#### `CheckboxGroup`

Several independent choices under one label — the checkbox counterpart of `RadioGroup`. The group
owns the array of checked values.

| Prop       | Type                                                            | Default  |
| ---------- | --------------------------------------------------------------- | -------- |
| options    | `{ label, value, disabled? }[]` (required)                      | —        |
| value      | any[] (the checked values, required)                            | —        |
| onChange   | (values) => void (the new set after each toggle, required)      | —        |
| label      | string                                                          |          |
| direction  | `"column" \| "row"`                                             | `column` |
| disabled   | boolean                                                         |          |
| required   | boolean (asterisk on label)                                     |          |
| error      | string (message below the group; also turns the checkboxes red) |          |
| helperText | string (hidden while error shown)                               |          |
| feedback   | boolean (report each toggle to `onInteractionFeedback`)         | `true`   |

```tsx
<CheckboxGroup
  label="Notifiche"
  options={[
    { label: "Email", value: "email" },
    { label: "Push", value: "push" },
    { label: "SMS", value: "sms", disabled: true },
  ]}
  value={channels}
  onChange={setChannels}
/>
```

#### `RadioButton` / `RadioGroup`

`RadioButton` is a single control; `RadioGroup` (named export) manages a set.

RadioButton: `selected` (required), `onPress` (required), `label`, `labelPosition` (`right`),
`disabled`, `error`.

RadioGroup:

| Prop          | Type                                                           | Default  |
| ------------- | -------------------------------------------------------------- | -------- |
| options       | `RadioOption[]` = `{ id, label, value, disabled? }` (required) | —        |
| value         | any (required)                                                 | —        |
| onValueChange | (value) => void (required)                                     | —        |
| label         | string                                                         |          |
| direction     | `"column" \| "row"`                                            | `column` |
| error         | string (group-level message)                                   |          |

#### `Switch`

Animated M3 switch, in three sizes or with fully configurable dimensions.

| Prop           | Type                                                     | Default     |
| -------------- | -------------------------------------------------------- | ----------- |
| value          | boolean (required)                                       | —           |
| onChange       | (value) => void (required)                               | —           |
| disabled       | boolean                                                  | `false`     |
| label          | string (pressing it toggles the switch too)              |             |
| labelPlacement | `"start" \| "end" \| "top" \| "bottom"`                  | `end`       |
| size           | `"small" \| "medium" \| "large"` (24×14 / 32×18 / 40×22) | `medium`    |
| width / height | number (override the `size`)                             | from `size` |
| containerStyle | ViewStyle                                                |             |

#### `Slider`

| Prop              | Type                                     | Default     |
| ----------------- | ---------------------------------------- | ----------- |
| value             | number (required)                        | —           |
| onValueChange     | (value) => void (required)               | —           |
| onSlidingComplete | (value) => void                          |             |
| min / max         | number                                   | `0` / `100` |
| step              | number (0/undefined = continuous)        |             |
| label             | string                                   |             |
| showValueLabel    | boolean                                  |             |
| marks             | boolean (ticks at each step, needs step) |             |
| disabled          | boolean                                  |             |

#### `NumberField` — number stepper

Numeric field with +/- steppers. (Distinct from the progress spinners below.)

| Prop      | Type                     | Default     |
| --------- | ------------------------ | ----------- |
| value     | number (required)        | —           |
| onChange  | (val) => void (required) | —           |
| label     | string                   |             |
| step      | number                   | `1`         |
| min / max | number                   | `0` / `100` |
| disabled  | boolean                  |             |

#### `SearchBar`

| Prop                 | Type                                                          | Default   |
| -------------------- | ------------------------------------------------------------- | --------- |
| value                | string (required)                                             | —         |
| onChange             | (text) => void (required; waits for `debounceTime` when set)  | —         |
| onSubmit             | (text) => void                                                |           |
| onClear              | () => void (after clear empties field)                        |           |
| placeholder          | string                                                        | `Search`  |
| icon                 | icon (start of the bar)                                       | `magnify` |
| debounceTime         | number (ms the user must stop typing before `onChange` fires) | `0`       |
| showLoading          | boolean (a progress indicator replaces the clear button)      | `false`   |
| disabled / autoFocus | boolean                                                       |           |

#### `DateTimePicker` / `DatePicker` / `TimePicker`

Field that opens a Material 3 date/time picker. There is no OS picker underneath: the same
in-house surface renders on iOS, Android and web — as a dialog on native, as a popover docked to
the field on web — so the picker follows `theme.json` everywhere instead of whatever the platform
ships. Everything locale-dependent — month and weekday names, week start, 12h/24h, AM/PM, the
typed-entry field order, the per-day screen-reader announcement — is derived from `Intl` and
memoized per locale. Relative labels (Today/Yesterday/Tomorrow) come from `Intl.RelativeTimeFormat`.

`DatePicker` and `TimePicker` are the same component with `mode` locked. `DatePicker` still takes
`selectionMode`, so a date range is `<DatePicker selectionMode="range" />` and a set of days
`selectionMode="multiple"`; typed entry is `inputEnabled` / `defaultInputType`. These three are the
only public pickers: the calendar and the clock they are built from are not exported on their own,
use `variant="static"` for an inline one.

| Prop                          | Type                                                                                                                                                                           | Default       |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------- |
| value                         | `Date \| null` · `DateRange` · `Date[]`, following `selectionMode` (required)                                                                                                  | —             |
| onChange                      | matching setter (required)                                                                                                                                                     | —             |
| variant                       | `"default" \| "static"` — a field with a dialog, or the picker inline                                                                                                          | `default`     |
| presentation                  | `"auto" \| "popover" \| "dialog"` — web only: docked to the field, or a centred dialog (`auto`: the dialog on a touch device or under 600 px, as Material UI's mobile pickers) | `auto`        |
| fieldVariant                  | `"outlined" \| "filled"` — the look of the field's box, as `variant` on `Input` (`variant` here is default or static)                                                          | `outlined`    |
| label                         | string                                                                                                                                                                         |               |
| mode                          | `"date" \| "datetime" \| "time"`                                                                                                                                               | `date`        |
| selectionMode                 | `"single" \| "range" \| "multiple"` (ignored when `mode="time"`)                                                                                                               | `single`      |
| validRange                    | `{ startDate?, endDate?, disabledDates? }`                                                                                                                                     |               |
| isDateDisabled                | (date) => boolean — for rules `validRange` can't express                                                                                                                       |               |
| scrollMode                    | `"endless" \| "paged"` month navigation                                                                                                                                        | `endless`     |
| inputEnabled                  | boolean — lets the user type a single date into the field                                                                                                                      | `true`        |
| defaultInputType              | `"picker" \| "keyboard"` — which surface the dialog opens on                                                                                                                   | `picker`      |
| showToday                     | boolean — the "Today" button in the calendar header (single dates)                                                                                                             | `true`        |
| use24HourClock                | boolean — forces the 24-hour dial                                                                                                                                              | locale's own  |
| minuteInterval                | `1\|2\|3\|4\|5\|6\|10\|12\|15\|20\|30`                                                                                                                                         | `1`           |
| startYear / endYear           | number — bounds of the year grid and the endless scroller                                                                                                                      | ±100 years    |
| placeholder                   | string (shown while the value is empty)                                                                                                                                        |               |
| clearable / onClear           | boolean / () => void                                                                                                                                                           |               |
| error / helperText / required | string / string / boolean                                                                                                                                                      |               |
| locale                        | string                                                                                                                                                                         | device locale |
| firstDayOfWeek                | 0–6 (0 = Sunday)                                                                                                                                                               | locale's own  |
| labels                        | `DateTimePickerLabels` — chrome strings, pass i18n values                                                                                                                      | English       |
| relativeLabels                | `{ today?, yesterday?, tomorrow? }`                                                                                                                                            | `Intl`        |
| disabled                      | boolean                                                                                                                                                                        |               |

Typed entry follows the locale's own field order — `22/11/2026` in `it-IT`, `11/22/2026` in
`en-US` — and is validated against `validRange` on blur. The field itself only accepts typing for
a single calendar date; a range types its two ends inside the dialog, which opens on the typed
fields with `defaultInputType="keyboard"` (there is no toggle between the calendar and the keyboard
once it is open; `multiple` has no typed form).

The dialog has no Cancel or Next button: dismiss it by tapping outside, with the back gesture or
with Escape. In single `date` mode a day tap confirms and closes; **OK** stays for the time step, a
range, multiple dates and typed entry. The calendar header is one control, the visible month and the
year ("October 2026 ▾", which opens the year grid), with an outlined "Today" button between the
month arrows. In a range, once the first day is chosen the days from it to the one under the
pointer are shaded as a preview (pointer devices only); nothing is reported until the second tap.

`mode="datetime"` collects the day first and the time second: tapping a day moves to the time step
by itself, and tapping the date readout there goes back to the calendar (its hint is `labels.back`,
"Back to date" by default).

`variant="static"` draws the surface inline in the page instead of behind a field: no field, no
popup and no OK, and every selection calls `onChange` at once with the live value. Of the field
props only `disabled` and `style` apply, and it always shows the calendar and the clock, never typed
entry. A static `DatePicker` is the inline calendar; a static `TimePicker` is the inline clock.

The calendar and the clock are pure React Native — no SVG, no native modules — so they render
identically on web and native. The calendar has month and year sub-views, single / range / multiple
selection and virtualized endless month scrolling; the clock is the M3 hour/minute readout with
its AM/PM switch, over an analog dial you drag to set.

Keyboard (web): arrows = day/week, PageUp/PageDown = month (Shift = year), Home/End = ends of the
week, Enter/Space = select, Escape = close.

#### `Autocomplete`

Text field with a suggestion list — free text allowed, unlike `Select`. Accent-insensitive
matching by default, `description` lines, `loading` for server-side filtering, and
ArrowUp/ArrowDown/Enter/Escape on web. The list renders inside the field's own container (a modal
would steal focus from the input), so the parent must not clip overflow while it is open.

| Prop                                                           | Type                                                                                                                                        | Default                      |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| value / onChange                                               | string / (text) => void (required)                                                                                                          | —                            |
| options                                                        | `AutocompleteOption[]` — `{ id, label, value, description?, icon? }` (required)                                                             | —                            |
| selected / onSelectedChange                                    | option / (option \| null) => void — every pick; `null` on clear                                                                             |                              |
| multiple                                                       | boolean (several options as chips; `selected` / `onSelectedChange` take arrays)                                                             | `false`                      |
| variant                                                        | `"outlined" \| "filled"` (the look of the box: `filled` is tinted, with its border only while focused or in error, like `PinInput`'s cells) | `outlined`                   |
| labelPlacement                                                 | `"inside" \| "outside"` (outside = above the box; independent of `variant`)                                                                 | `outside`                    |
| fullWidth                                                      | boolean (`false` shrinks the field to its content)                                                                                          | `true`                       |
| defaultOptions                                                 | `AutocompleteOption[]` — offered until `minChars` characters are typed                                                                      |                              |
| onSearch / debounce                                            | (text) => void, once the user stops typing / number (ms)                                                                                    | — / `300`                    |
| filter                                                         | (option, query) => boolean                                                                                                                  | accent-insensitive substring |
| minChars / maxSuggestions                                      | number                                                                                                                                      | `1` / `8`                    |
| loading                                                        | boolean                                                                                                                                     |                              |
| emptyMessage                                                   | string (omit to hide the list on no match)                                                                                                  |                              |
| label / placeholder / error / helperText / required / disabled | as `Input`                                                                                                                                  |                              |
| leadingIcon                                                    | icon                                                                                                                                        |                              |
| clearable                                                      | boolean                                                                                                                                     | `true`                       |

With a `Portal.Host` mounted the suggestion list renders through it, so it escapes a
clipping or scrolling parent and flips above the field when there is no room below;
with no host it stays anchored under the field as before. It deliberately does not use a
native `Modal` like `Select` does — that would take focus off the field being typed into.

#### `PinInput`

One-time-code / PIN entry: single-character cells that behave as one field. Typing advances,
Backspace retreats, and pasting a whole code into any cell fills the row.

| Prop                                             | Type                                           | Default    |
| ------------------------------------------------ | ---------------------------------------------- | ---------- |
| value / onChange                                 | string / (value) => void (required)            | —          |
| length                                           | number                                         | `6`        |
| onComplete                                       | (value) => void — fired once, on becoming full |            |
| type                                             | `"numeric" \| "alphanumeric"`                  | `numeric`  |
| variant                                          | `"filled" \| "outlined"` (cell style)          | `outlined` |
| mask                                             | boolean                                        | `false`    |
| label / error / helperText / required / disabled | as `Input`                                     |            |
| autoFocus                                        | boolean (first cell only)                      |            |
| cellSize                                         | number                                         | `48`       |

#### `Editable`

Text that edits in place: it reads as text, and a click, tap, Enter or Space opens the library's own
field in its place. Enter or leaving the field keeps the change, Escape drops it. The display
carries a pencil (always drawn on native, on hover or focus on web) and is a button for screen
readers.

| Prop                      | Type                                                                                                                                                           | Default    |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| value / onChange          | string (controlled; `onChange` runs on every edit, and once more with the starting value when the edit is cancelled)                                           |            |
| defaultValue              | string (uncontrolled start)                                                                                                                                    | `""`       |
| onSubmit / onCancel       | (value) => void (confirmed) / (previous) => void (cancelled)                                                                                                   |            |
| type                      | `"text" \| "textarea" \| "number" \| "select"` (`textarea`: Enter adds a line, Ctrl or Cmd + Enter confirms; `select`: opens a `Select`, confirms on the pick) | `text`     |
| options                   | `Option[]` (the choices of a `select`; the display shows the selected label)                                                                                   |            |
| submitMode                | `"blur" \| "enter" \| "both" \| "none"` (what confirms; `none` shows check and close buttons instead; Escape cancels in every mode)                            | `both`     |
| showControls              | boolean (the check and close buttons whatever the mode; leaving the field then no longer confirms)                                                             | `false`    |
| placeholder               | string (muted, drawn while the value is empty)                                                                                                                 | `Edit`     |
| validate                  | (value) => string \| undefined (the message is the field's error, and the edit cannot be confirmed while there is one)                                         |            |
| selectAllOnFocus          | boolean (selects the text when the field opens)                                                                                                                | `false`    |
| startWithEditView         | boolean (mounts with the field open)                                                                                                                           | `false`    |
| editing / onEditingChange | boolean / (editing) => void (controls whether the field is open)                                                                                               |            |
| disabled / readOnly       | boolean (dimmed, cannot open / plain text, no way to open)                                                                                                     | `false`    |
| variant                   | `"outlined" \| "filled"` (the open field, as `Input`)                                                                                                          | `outlined` |
| size                      | `"small" \| "medium" \| "large"` (text, pencil and field; `small` is dense)                                                                                    | `medium`   |
| textVariant               | typography variant (over what `size` picks)                                                                                                                    |            |
| renderDisplay             | (value) => ReactNode (draws the shown value your way: a link, a badge, a formatted amount)                                                                     |            |
| label                     | string (accessible name of the display and of the open field; not drawn)                                                                                       |            |
| precision                 | number (decimals kept by `type="number"`; the value stays text)                                                                                                |            |

```tsx
<Editable value={name} onChange={setName} onSubmit={save} label="Name" />
<Editable type="select" options={roles} value={role} onChange={setRole} />
```

#### `Upload`

Pick or drop files, validate them and, with an `onUpload`, upload each one with a progress bar,
retry and cancel. On web it is a drop target (or a plain button, `variant="button"`) and the
browser's file dialog. On native the library has no picker, so **the field is not drawn without an
`onPick`** — the adapter that opens one (a document picker, or
`@its/glowup-device/media-picker`) and resolves the files chosen; on web `onPick` replaces the
browser's dialog when given. The list is kept by the component, or controlled with `value` and
`onChange`.

| Prop               | Type                                                                                                                                                                                                      | Default    |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| value / onChange   | `UploadFile[]` / (files) => void (the whole list, on every change: files added or removed, a status or progress moved)                                                                                    |            |
| defaultValue       | `UploadFile[]` (the list it starts with, uncontrolled)                                                                                                                                                    |            |
| accept             | string (as the `accept` of an `<input type="file">`: `"image/*,.pdf"`; filters the web dialog and checks every file added, on every platform)                                                             |            |
| multiple           | boolean (without it a new file replaces the one in the list)                                                                                                                                              | `false`    |
| maxSize            | number (bytes; a bigger file is rejected)                                                                                                                                                                 |            |
| maxFiles           | number (with `multiple`: the files past it are rejected)                                                                                                                                                  |            |
| onUpload           | `(file, { onProgress, signal }) => Promise<void>` (resolve when done, reject on failure; report `onProgress` 0–1, stop on `signal`; without it files are only collected, `"pending"`, for a form to send) |            |
| onReject           | (rejections) => void (the files not added, each with a `reason` and a `message`; without it the messages show under the field)                                                                            |            |
| onPick             | `() => Promise<PickedFile[]>` (the native adapter; an empty list for none)                                                                                                                                |            |
| variant            | `"dropzone" \| "button"`                                                                                                                                                                                  | `dropzone` |
| label / prompt     | string (above the field / what the dropzone or button says)                                                                                                                                               |            |
| helperText / error | string (under the field; a non-empty `error` replaces the rejection messages; `helperText` is hidden while either shows)                                                                                  |            |
| disabled           | boolean                                                                                                                                                                                                   | `false`    |

A file in the list is an `UploadFile`: `{ id, name, size, type, uri?, file?, status, progress?, error? }`,
with `status` one of `"pending"`, `"uploading"`, `"done"` and `"error"`; `file` is the browser's
`File` (put it in a `FormData`) and `uri` where a native pick lives. Every new file starts at once;
a failed one offers a retry, and removing or cancelling aborts its `signal`.

```tsx
<Upload
  label="Attachments"
  accept="image/*,.pdf"
  multiple
  maxSize={5 * 1024 * 1024}
  onUpload={async (file, { onProgress, signal }) => {
    await send(file.file!, onProgress, signal);
  }}
/>
```

On native, wire the picker:

```tsx
import { useMediaPicker } from "@its/glowup-device/media-picker";

const { pick } = useMediaPicker();

<Upload
  multiple
  accept="image/*"
  onPick={async () => {
    const result = await pick({ mediaTypes: ["image"], multiple: true });
    if (result.status !== "picked") return [];
    return result.assets.map((asset) => ({
      name: asset.fileName ?? "photo",
      size: asset.fileSize ?? 0,
      type: asset.mimeType ?? "",
      uri: asset.uri,
    }));
  }}
/>;
```

The checks behind it are exported for your own: `formatBytes(1536)` is `"1.5 KB"`,
`acceptMatches(file, "image/*,.pdf")` says whether a file passes an `accept` filter, and
`validateFiles(files, { accept, maxSize, maxFiles, count })` splits files into `accepted` and
`rejected` (each with its reason: `"wrong-type"`, `"too-large"` or `"too-many"`, in that order of
checking).

#### `Form`

Groups fields and a submit button so that one action submits them. On the web it is a real
`<form>`: Enter in a field submits, and a `Button type="submit"` inside it submits too. On iOS and
Android it is a plain `View` and the submit button calls `onSubmit` directly. Either way `onSubmit`
runs once per submission, and the page is never navigated. A `Dialog` with `form` wraps its body
and `actions` in one.

With `FormField`s the form also keeps the fields' values, errors and flags (dirty, touched,
submitting) in a store **outside React state**, and each field subscribes to its own slice: typing in
one field re-renders that field alone, not the form or its siblings. A `Form` without fields is the
plain wrapper it always was, for fields whose state the parent holds (`onSubmit` then gets `{}`).

| Prop           | Type                                                                                                                                                                                                                                                              | Default  |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| onSubmit       | (values) => void (every field passed its rules and a `Button type="submit"` was pressed, or Enter in a field on web; may be async: the form is submitting, and a submit `Button` shows `loading`, until it settles, and a second submission is ignored meanwhile) |          |
| onSubmitFailed | (errors, values) => void (called instead of `onSubmit` when a field fails its rules; `errors` by field name)                                                                                                                                                      |          |
| initialValues  | object, as `{ email: "", address: { city: "" } }` (read when the form mounts; give every field one, or its own `initialValue`)                                                                                                                                    |          |
| onValuesChange | (changed, all) => void (after a user edit, `setValue` or `setValues`, not `reset`; `changed` is nested like the values)                                                                                                                                           |          |
| validateOn     | `"change" \| "blur" \| "submit"` (when a field is validated; after a submit, or once a field shows an error, every edit validates it again)                                                                                                                       | `change` |
| disabled       | boolean (every `FormField` and the form's submit buttons)                                                                                                                                                                                                         | `false`  |
| form           | `FormInstance` (from `useForm()`, to drive the form from outside it; without it the form keeps its own)                                                                                                                                                           |          |
| children       | ReactNode                                                                                                                                                                                                                                                         |          |
| style          | ViewStyle                                                                                                                                                                                                                                                         |          |
| testID         | string                                                                                                                                                                                                                                                            |          |

```tsx
<Form
  initialValues={{ email: "", terms: false }}
  onSubmit={(values) => save(values)}
>
  <FormField
    name="email"
    label="Email"
    rules={[{ required: true }, { type: "email" }]}
  >
    {(field) => <Input {...field} />}
  </FormField>
  <FormField
    name="terms"
    control
    valuePropName="checked"
    trigger="onValueChange"
    rules={[{ required: true, message: "Accept the terms to continue" }]}
  >
    {(field) => <Checkbox {...field} label="I accept the terms" />}
  </FormField>
  <Button type="submit">Save</Button>
</Form>
```

#### `FormField`

Connects the one control inside it to a field of the surrounding `Form`: it hands the control the
field's `value`, the callback that reports a new one, `onBlur`, `error`, `required` and `disabled`
(and `label` / `helperText`), and nothing else re-renders when it changes. The control's own props
stay and its own handlers still run.

A control whose props are required — the library's `Input` needs `value` and `onChange` — takes a
**function child**: `{(field) => <Input {...field} />}`, where `field` carries what is listed above.
A plain element child (`<Input label="Email" />`) works the same at runtime, but TypeScript then
asks for the `value` and `onChange` the control requires.

| Prop               | Type                                                                                                                                                                                    | Default    |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| name               | string (the field's name in the values: `"email"`, `"address.city"`, `"items[0].qty"`, required)                                                                                        | —          |
| rules              | `FormRule[]` (checked in order; the first failure is the field's `error`)                                                                                                               |            |
| label / helperText | string (passed to the child; with `control`, drawn by `FormControl` instead; `helperText` is hidden while there is an error)                                                            |            |
| valuePropName      | string (the child's prop that takes the value: `"checked"` for a `Checkbox`)                                                                                                            | `value`    |
| trigger            | string (the child's callback that reports a value: `"onValueChange"` for a `Checkbox` or a `Slider`)                                                                                    | `onChange` |
| getValueFromEvent  | (...args) => unknown (what to store; by default the first argument, or `target.value` / `target.checked` of a DOM event)                                                                |            |
| normalize          | (value, previous, allValues) => unknown (what is stored in place of what was reported: trim, uppercase, format)                                                                         |            |
| dependencies       | string[] (other fields this one's rules read — `["password"]` for a confirmation; it is validated again when one changes, once touched or edited, or showing an error)                  |            |
| initialValue       | unknown (when `initialValues` has none for it)                                                                                                                                          |            |
| validateOn         | as `Form` (for this field: a `Checkbox` has no blur, so `"change"` suits it)                                                                                                            |            |
| disabled           | boolean (this field; `Form`'s `disabled` does all)                                                                                                                                      | `false`    |
| control            | boolean (for `Checkbox`, `Switch`, `Slider`, `RadioGroup`, which draw no label, helper or error text: wraps the child in a `FormControl` that does, and passes it `error` as a boolean) | `false`    |

A `FormRule` is checked in the order `required`, `type`, `min`, `max`, `minLength`, `maxLength`,
`pattern`, `validator`; all but `validator` skip an empty value unless `required` is set.

| Rule                      | Meaning                                                                                                                                                                                                                                            |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `required`                | not empty: `""`, whitespace, `null`, `undefined`, `false` and `[]` are                                                                                                                                                                             |
| `type`                    | `"email"`, `"url"` (http or https) or `"number"`                                                                                                                                                                                                   |
| `min` / `max`             | a number range (the value is read as a number: `"12"` is 12)                                                                                                                                                                                       |
| `minLength` / `maxLength` | characters, or items of an array                                                                                                                                                                                                                   |
| `pattern`                 | a `RegExp` the text must match                                                                                                                                                                                                                     |
| `validator`               | `(value, values, { signal }) => …`, sync or async: return the message to fail, anything else passes; a throw or a rejection fails with its message; `signal` aborts when the field is validated again before this run settles (pass it to `fetch`) |
| `message`                 | replaces the default message of the built-in checks (not what a `validator` returns)                                                                                                                                                               |

```tsx
<FormField
  name="confirm"
  label="Confirm password"
  dependencies={["password"]}
  rules={[
    {
      validator: (value, all) =>
        value !== all.password && "The passwords do not match",
    },
  ]}
>
  {(field) => <PasswordField {...field} />}
</FormField>
```

#### `useForm`, `useFormField`, `useWatch`, `useFormState`

The same engine without the components. `useForm(initialValues?)` creates a `FormInstance` that
lives as long as the component and **never re-renders it**: read values with `useWatch`, flags with
`useFormState`, and pass the instance to `<Form form={form}>` to drive the form from outside. Inside
a `Form` the hooks find it by themselves; outside one they take it as `form`, and throw without
either.

```tsx
const form = useForm({ email: "" });
const email = useWatch<string>("email", form);
const { isDirty } = useFormState(form);

<Form form={form} onSubmit={save}>
  …
</Form>;
<Button variant="text" disabled={!isDirty} onClick={() => form.reset()}>
  Reset
</Button>;
```

| Hook                                        | Returns                                                                                                                                                                                                                                                                                                                                                                                                      |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `useForm(initialValues?)`                   | a `FormInstance`                                                                                                                                                                                                                                                                                                                                                                                             |
| `useWatch(name \| names \| nothing, form?)` | one value, an array of values, or all of them; the component re-renders only when what it watches changes                                                                                                                                                                                                                                                                                                    |
| `useFormState(form?)`                       | `{ isDirty, isSubmitting, isValidating, submitCount, errors }`                                                                                                                                                                                                                                                                                                                                               |
| `useFormField(name, options?)`              | `{ value, error, touched, dirty, validating, setValue, onBlur, setError, validate }` for one field, re-rendering only when one changes. Pass `options` (`rules`, `dependencies`, `initialValue`, `normalize`, `validateOn`, `form`) to register the field: only registered fields are validated and submitted through; without them it just reads. The hook behind `FormField`, for a control it cannot wrap |

A `FormInstance` has `getValues()`, `getValue(name)`, `setValues(values)` (merges, nested objects
included), `setValue(name, value)`, `reset(values?)` (back to the initial values, or to `values`, which
then become the initial ones: no errors, nothing touched), `validate(names?)` (resolves whether every
registered field passed), `submit()` (marks every field touched, validates and calls `onSubmit` or
`onSubmitFailed`; resolves whether it submitted), `isDirty(name?)`, `isTouched(name?)`,
`isSubmitting()`, `getFieldState(name)`, `getError(name)`, `getErrors()`, `setError(name, message)`
(a server-side error, say; `undefined` clears it) and `subscribe(listener)` / `subscribe(name, listener)`.

#### `FormControl`

Groups a label, a control and its supporting text, and shares invalid/disabled/required state with
descendants via `useFormControl()`. For controls with no `label`/`error` props of their own —
`Checkbox`, `RadioGroup`, `Slider`, custom composites.

| Prop                       | Type                 | Default |
| -------------------------- | -------------------- | ------- |
| children                   | ReactNode (required) | —       |
| label / helperText / error | string               |         |
| required / disabled        | boolean              | `false` |

#### `HelperText`

The supporting text under a form control. `Input`, `FormControl`, `PinInput`, `Autocomplete` and
the date/time picker field render this internally via their own `helperText` / `error` props —
use it directly for a control that has neither.

| Prop     | Type                                             | Default  |
| -------- | ------------------------------------------------ | -------- |
| children | ReactNode (required)                             | —        |
| type     | `"info" \| "error"` (error adds the alert glyph) | `info`   |
| visible  | boolean (fades out instead of unmounting)        | `true`   |
| disabled | boolean (dims to match a disabled field)         | `false`  |
| padding  | `"normal" \| "none"` (the 16px field gutter)     | `normal` |

Hiding it keeps the text mounted so the field height doesn't jump, but takes it out of the
accessibility tree.

#### `Rating`

Star rating; renders half-stars, sets whole values on tap (halves with `interval={0.5}`), and
previews the value under the pointer on hover.

| Prop     | Type                                                                  | Default |
| -------- | --------------------------------------------------------------------- | ------- |
| value    | number (supports halves, e.g. 3.5, required)                          | —       |
| onChange | (value) => void (interactive when provided)                           |         |
| max      | number                                                                | `5`     |
| size     | number                                                                | `24`    |
| interval | `0.5 \| 1` (step of the input: half icons or whole ones)              | `1`     |
| icon     | icon (a glyph that has an `-outline` twin, drawn for the empty state) | `star`  |
| required | boolean (the current value cannot be tapped away to 0)                | `false` |
| disabled | boolean                                                               |         |

### Data display

#### `Avatar`

| Prop                        | Type                                                             | Default    |
| --------------------------- | ---------------------------------------------------------------- | ---------- |
| source                      | image source (else initials, else icon)                          |            |
| name                        | string (initials fallback; also a tooltip on hover / long press) |            |
| icon                        | icon (icon fallback)                                             | `account`  |
| size                        | number \| `"small" \| "medium" \| "large"` (32 / 40 / 56)        | `medium`   |
| variant                     | `"circular" \| "rounded" \| "square"`                            | `circular` |
| status                      | `"online" \| "offline" \| "busy" \| "away" \| null` (status dot) |            |
| backgroundColor / textColor | string                                                           |            |
| onClick                     | () => void                                                       |            |

#### `Badge`

Small count/dot overlay (position it over its target).

| Prop     | Type                                                                                                  | Default |
| -------- | ----------------------------------------------------------------------------------------------------- | ------- |
| count    | number (omit → dot)                                                                                   |         |
| size     | `"small" \| "large"` (small = dot)                                                                    | `large` |
| max      | number (shows `max+` when exceeded)                                                                   | `99`    |
| showZero | boolean                                                                                               | `false` |
| color    | same roles as `Button`                                                                                | `error` |
| position | `"top-right" \| "bottom-right" \| "top-left" \| "bottom-left"` (pins it to that corner of the parent) |         |
| visible  | boolean                                                                                               | `true`  |

#### `StatusBadge`

Small labeled status pill with its own semantic colors (light/dark aware).

| Prop  | Type                                  | Default   |
| ----- | ------------------------------------- | --------- |
| label | string (required)                     | —         |
| type  | `"success" \| "error" \| "warning"`   | `success` |
| icon  | icon (override default per-type icon) |           |

#### `Blink`

Fades its children between full opacity and `minOpacity`, over and over: a live indicator, a
pending status, a field that wants attention. A plain wrapper that takes no space of its own beyond
its children; with reduced motion on, nothing blinks.

| Prop       | Type                                                    | Default |
| ---------- | ------------------------------------------------------- | ------- |
| children   | ReactNode (what blinks: a dot, a badge, a line of text) |         |
| interval   | number (ms one half of a blink takes)                   | `600`   |
| active     | boolean (stays at full opacity while `false`)           | `true`  |
| minOpacity | number 0–1 (the dimmest point of a blink)               | `0.2`   |

```tsx
<Blink>
  <StatusBadge label="Offline" type="error" />
</Blink>
```

#### `DataGrid`

Virtualized table: sortable columns, reorder, density, loading + empty state. Built on the `Table`
primitives below.

| Prop            | Type                                                                                      | Default  |
| --------------- | ----------------------------------------------------------------------------------------- | -------- |
| data            | any[] (row objects, required)                                                             | —        |
| columns         | `ColumnDefinition[]` = `{ id, label, width?, sortable?, align?, renderCell? }` (required) | —        |
| loading         | boolean                                                                                   | `false`  |
| density         | `"normal" \| "dense"`                                                                     | `normal` |
| sortColumn      | string                                                                                    |          |
| sortDirection   | `"asc" \| "desc"`                                                                         |          |
| onSort          | (columnId, direction) => void                                                             |          |
| onColumnReorder | (newColumns) => void                                                                      |          |
| onEndReached    | () => void (infinite scroll)                                                              |          |
| emptyMessage    | string                                                                                    |          |

#### `ListItem`

A list row: text, with an optional leading icon, a second line and a trailing slot; with none of
them a centred single-line tile. Giving `onClick` makes it a button.

| Prop                                                     | Type                                                                                              | Default |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------- |
| primaryText                                              | ReactNode (the first line; text is drawn in the theme's type, a node as given, required)          | —       |
| secondaryText                                            | ReactNode (second line)                                                                           |         |
| onClick                                                  | () => void (makes the row a button; with an `action` too, only the icon and texts are the button) |         |
| icon                                                     | icon \| ReactNode (leading slot: a glyph name, or any node such as an `Avatar`)                   |         |
| action                                                   | ReactNode (trailing slot: a value, a `Switch`, an `IconButton`; a control of its own)             |         |
| primaryTextStyle / secondaryTextStyle                    | TextStyle (merged after the type of the text)                                                     |         |
| indicatorColor                                           | string (a bar on the left edge)                                                                   |         |
| dimmed                                                   | boolean (faded, still pressable)                                                                  | `false` |
| trailingWidth                                            | number (fixes and right-aligns the `action` slot, so a column of rows lines up)                   |         |
| disabled                                                 | boolean (fades the row and stops presses; not the `action`)                                       | `false` |
| itemContainerStyle / itemPressedStyle / itemHoveredStyle | object                                                                                            |         |
| testID                                                   | string                                                                                            |         |

#### `ListSection` / `ListSubheader`

Groups related `ListItem`s under a heading. Use this for a settings screen rather than wrapping
each group in a `Card` — a sequence of labelled groups, not a pile of equal surfaces.

| Component       | Props                                                                        |
| --------------- | ---------------------------------------------------------------------------- |
| `ListSection`   | `children` (required), `title` (heading above the rows), `divider` (`false`) |
| `ListSubheader` | `children` (required) — a standalone group label, marked as a heading        |

#### `Tooltip`

Wraps a child; shows a bubble on hover (web) / long-press (native).

| Prop             | Type                                                                                                                   | Default |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------- | ------- |
| content          | string (required)                                                                                                      | —       |
| children         | ReactNode (anchor, required)                                                                                           | —       |
| position         | `"top" \| "bottom" \| "left" \| "right"`                                                                               | `top`   |
| disabled         | boolean                                                                                                                |         |
| hideDelay        | number (ms, native auto-hide)                                                                                          | `1500`  |
| anchorAccessible | boolean — native: the anchor is one accessibility element named by `content`; turn off for a control with its own name | `true`  |
| enterDelay       | number (ms hover dwell before showing, web)                                                                            | `500`   |
| leaveDelay       | number (ms grace before hiding, web)                                                                                   | `100`   |

Also shows on keyboard focus, not only on hover. With a `Portal.Host` mounted the bubble
renders through it, so it escapes an `overflow: hidden` parent and is clamped to the window
instead of being clipped; with no host it stays anchored in place as before.

#### `Accordion`

Expandable section with animated height.

| Prop     | Type                                                                                                | Default    |
| -------- | --------------------------------------------------------------------------------------------------- | ---------- |
| title    | string (required)                                                                                   | —          |
| children | ReactNode (content, required)                                                                       | —          |
| expanded | boolean (starts open; follows the prop again whenever it changes)                                   | `false`    |
| onClick  | (expanded) => void (every press of the header, with the new state)                                  |            |
| icon     | icon \| ReactNode (end of the header; the default chevron turns while open, a custom icon does not) | chevron    |
| variant  | `"outlined" \| "contained"` (a bordered panel, or a filled tonal one)                               | `outlined` |

#### `Tree`

A hierarchy that opens and closes: folders and files, a category tree, an org chart. Rows open with
a chevron and can be selected one at a time, or with checkboxes (a parent shows the mixed state when
only some of its children are checked), and can load their children the first time they are opened.
A node's `id` is its identity in `expanded` and `selected`: keep it unique and stable, and keep
`data` (and the nodes in it) stable between renders, since a row whose node did not change is not
drawn again. On the web it follows the ARIA tree pattern (one tab stop, then Up / Down, Right opens
or steps in, Left closes or steps out, Home / End, Enter or Space acts on the row, `*` opens the
siblings, typing a letter jumps to the next label that starts with it). On native each row is one
accessible element, with expand and collapse as accessibility actions.

| Prop                        | Type                                                                                                                                                                                       | Default                                  |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------- |
| data                        | `TreeNode[]` = `{ id, label, icon?, children?, disabled?, hasChildren?, badge? }` (the roots, required)                                                                                    | —                                        |
| expanded / onExpandedChange | string[] / (expanded) => void (the ids of the open nodes; set `expanded` to control it)                                                                                                    |                                          |
| defaultExpanded             | string[] (uncontrolled start)                                                                                                                                                              | `[]`                                     |
| selected / onSelectedChange | string[] / (selected) => void (with `checkboxes` every checked node, a fully checked parent included; set `selected` to control it)                                                        |                                          |
| defaultSelected             | string[] (uncontrolled start)                                                                                                                                                              | `[]`                                     |
| selectionMode               | `"none" \| "single" \| "multiple"` (what pressing a row does: opens and closes it, selects only it, toggles it; the chevron always opens)                                                  | `none`                                   |
| checkboxes                  | boolean (`multiple` only: a checkbox per row; checking a parent checks everything under it, a disabled row keeps its state)                                                                | `false`                                  |
| loadChildren / onLoadError  | (node) => Promise<TreeNode[]> / (error, node) => void (for a node marked `hasChildren`, on first open; a loading row shows, then a retry row if it rejects; the result is kept)            |                                          |
| renderLabel                 | (node, state) => ReactNode (replaces the label; `state` is `{ level, expanded, selected, indeterminate, loading, disabled }`; pass a stable function, `useCallback`, or every row redraws) |                                          |
| indent                      | number (px per level)                                                                                                                                                                      | `24`                                     |
| size                        | `"small" \| "medium" \| "large"` (row height 32 / 40 / 48)                                                                                                                                 | `medium`                                 |
| disabled                    | boolean (nothing can be opened, selected or focused)                                                                                                                                       | `false`                                  |
| showLines                   | boolean (a vertical guide line down each open node's children)                                                                                                                             | `false`                                  |
| loadingText / retryText     | string                                                                                                                                                                                     | `Loading…` / `Could not load. Try again` |
| accessibilityLabel          | string (names the tree)                                                                                                                                                                    |                                          |

On a `TreeNode`, `icon` is a glyph name or any node, `badge` a count (text or a number) or any node,
and `disabled` a row that cannot be selected or checked (it can still be opened).

```tsx
<Tree
  data={[
    {
      id: "src",
      label: "src",
      icon: "folder-outline",
      children: [{ id: "app", label: "App.tsx", icon: "file-outline" }],
    },
  ]}
  defaultExpanded={["src"]}
  selectionMode="single"
  onSelectedChange={([id]) => open(id)}
/>
```

#### `Carousel`

Paged horizontal slider.

| Prop             | Type                                      | Default |
| ---------------- | ----------------------------------------- | ------- |
| children         | ReactNode (each child = a page, required) | —       |
| showDots         | boolean                                   | `true`  |
| showArrows       | boolean (overlay prev/next)               | `false` |
| autoPlayInterval | number (ms, 0 = off)                      | `0`     |
| height           | number (fixed; else tallest page)         |         |
| onIndexChange    | (index) => void                           |         |

#### `Stat`

A single labelled metric with an optional trend delta.

| Prop          | Type                                                                                           | Default                                             |
| ------------- | ---------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| label / value | string (both required)                                                                         | —                                                   |
| delta         | string, e.g. `"12.5%"`                                                                         |                                                     |
| trend         | `"up" \| "down" \| "flat"` — arrow (+ colour unless `trendColor`) for `delta`                  |                                                     |
| trendColor    | theme color token or colour string — for a metric where down is good, pass the colour yourself | up `success`, down `error`, flat `onSurfaceVariant` |
| direction     | `"column" \| "row"` (`row`: label and value on one line)                                       | `column`                                            |
| helpText      | string                                                                                         |                                                     |
| icon          | icon                                                                                           |                                                     |

#### `CaptionValue`

A caption and its value, stacked or in a row: the read-only pair a detail screen is made of. An
empty value shows `fallback` instead of leaving a hole.

| Prop                                          | Type                                                                                                             | Default                          |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| caption / value                               | ReactNode (text and numbers are drawn in the theme's type, a node as given)                                      |                                  |
| direction                                     | `"column" \| "row"`                                                                                              | `column`                         |
| reverse / omitCaption                         | boolean (value before the caption / no caption at all)                                                           | `false`                          |
| fallback                                      | ReactNode (drawn when `value` is `null`, `undefined`, `""` or `false`; `0` is a value)                           | `N/A`                            |
| captionColor / valueColor                     | theme color token or colour string                                                                               | `onSurfaceVariant` / `onSurface` |
| gap / numberOfLines                           | number (px between caption and value) / number (lines before an ellipsis, `0` = no limit)                        | `4` / `1`                        |
| width / height / flex / padding               | size of the pair, its flex in the parent, the padding around it                                                  |                                  |
| enableCopy / onCopy / copy                    | boolean (a copy button; native: only with `copy` or `onCopy`) / (value) => void (after copy) / `ClipboardWriter` | `false`                          |
| showTooltip                                   | boolean (a `Tooltip` with the value in full, for when `numberOfLines` cuts it)                                   | `false`                          |
| textAlign / captionStyle / valueStyle / style | text and container styles                                                                                        |                                  |

#### `Image`

`react-native`'s Image plus a skeleton placeholder, a fallback for broken sources, and
token-driven corner radius.

| Prop             | Type                                                                | Default                |
| ---------------- | ------------------------------------------------------------------- | ---------------------- |
| source           | ImageSourcePropType (required)                                      | —                      |
| alt              | string (required — a nameless image is invisible to screen readers) | —                      |
| fallbackSource   | ImageSourcePropType                                                 |                        |
| fallbackIcon     | icon (used when there is no `fallbackSource`)                       | `image-broken-variant` |
| width / height   | DimensionValue                                                      | `100%` / —             |
| ratio            | number — width ÷ height; use instead of `height` for fluid layouts  |                        |
| radius           | RadiusValue                                                         | `0`                    |
| resizeMode       | ImageResizeMode                                                     | `cover`                |
| showLoader       | boolean                                                             | `true`                 |
| onLoad / onError | () => void                                                          |                        |

#### `IFrame`

A page embedded in the screen: a real `<iframe>` on the web. iOS and Android have no equivalent in
React Native itself (that is `react-native-webview`, which this library does not depend on), so
there it draws `fallback`, a notice that embedded pages are not available.

| Prop             | Type                                                                                         | Default           |
| ---------------- | -------------------------------------------------------------------------------------------- | ----------------- |
| src              | string (required)                                                                            | —                 |
| title            | string (the frame's accessible name, required)                                               | —                 |
| width / height   | DimensionValue                                                                               | `100%` / `300`    |
| style            | ViewStyle (the box the frame fills: radius, border, margin)                                  |                   |
| allow            | string (the `allow` attribute, e.g. `"fullscreen; clipboard-write"`)                         |                   |
| sandbox          | string (`""` applies every restriction; tokens lift the ones named; left out, not sandboxed) |                   |
| referrerPolicy   | the `referrerpolicy` attribute                                                               |                   |
| loading          | `"lazy" \| "eager"`                                                                          | `lazy`            |
| onLoad / onError | () => void (browsers rarely report a page that fails to load)                                |                   |
| fallback         | ReactNode (drawn on iOS and Android instead of the page)                                     | icon and a notice |
| testID           | string                                                                                       |                   |

```tsx
<IFrame
  src="https://example.com/report"
  title="Quarterly report"
  height={480}
/>
```

#### `QrCode`

Any text as a QR code, drawn with react-native-svg (already a required peer) from the library's own
encoder: ISO/IEC 18004, versions 1 to 40, error-correction levels L to H, numeric, alphanumeric and
byte modes (UTF-8, in the narrowest that fits). No native module and no dependency, and the same
code on iOS, Android and web.

| Prop               | Type                                                                                                                                                  | Default                      |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| value              | string (a URL, a Wi-Fi string, a vCard, any text, required; at most 2953 bytes at level `L`: past what fits nothing is drawn and `onError` is called) | —                            |
| size               | number (px, the whole code, quiet zone included)                                                                                                      | `160`                        |
| level              | `"L" \| "M" \| "Q" \| "H"` (damage it survives: about 7 / 15 / 25 / 30%; a higher level grows the code; a `logo` raises it to `H`)                    | `M`                          |
| quietZone          | number (empty margin around the modules, in modules; scanners need it, the standard asks for 4)                                                       | `4`                          |
| color              | theme color token or colour string (the modules)                                                                                                      | dark on light, in both modes |
| backgroundColor    | theme color token or colour string                                                                                                                    | dark on light, in both modes |
| logo               | icon \| ReactNode (a mark centred over the code in a box a fifth of its width; the modules under it are lost)                                         |                              |
| accessibilityLabel | string (the value is not read out: it may be a secret)                                                                                                | `QR code`                    |
| onError            | (error) => void (`value` does not fit; the code is then drawn empty)                                                                                  |                              |

Scanners read dark modules on a light background, so the default colours do not follow the theme's
mode: `onSurface` on `surface` in a light theme, `inverseOnSurface` on `inverseSurface` (still dark
on light) in a dark one.

```tsx
<QrCode value="https://example.com/invite/9f3a" size={200} />
<QrCode value={wifi} level="Q" logo="wifi" />
```

#### `CodeBlock`

A snippet with syntax colours and a copy button, in a bordered block. The text is selectable, long
lines scroll sideways unless `wrap`, and the colours are theme roles, so they follow the palette and
the scheme. Highlighting is the library's own small tokenizer for `tsx`, `jsx`, `ts`, `js`, `json`
and `bash` (`"text"` is drawn plain): comments, strings, numbers, keywords, JSX tags and attributes,
names, keys, commands and flags — not a full parser.

| Prop               | Type                                                                                      | Default                         |
| ------------------ | ----------------------------------------------------------------------------------------- | ------------------------------- |
| code               | string (required)                                                                         | —                               |
| language           | `"tsx" \| "jsx" \| "ts" \| "js" \| "json" \| "bash" \| "text"`                            | `tsx`                           |
| title              | string (a file name, or what it is for; shown in the header)                              | the language's name             |
| showLineNumbers    | boolean (a gutter that is not selected with the code)                                     | `false`                         |
| highlightLines     | number[] (lines marked with a band and an accent edge, counted from 1)                    |                                 |
| copyable           | boolean (a copy button in the header; on native drawn only with `copy` or `onCopy`)       | `true`                          |
| copy / onCopy      | `ClipboardWriter` (web default: the clipboard API) / (code) => void (after it was copied) |                                 |
| wrap               | boolean (wraps long lines instead of scrolling sideways)                                  | `false`                         |
| maxHeight          | DimensionValue (the body scrolls past it; left out, it grows with the code)               |                                 |
| accessibilityLabel | string (names the block for screen readers)                                               | the title, or `{LANGUAGE} code` |

```tsx
<CodeBlock
  title="App.tsx"
  code={source}
  showLineNumbers
  highlightLines={[3, 4]}
/>
```

`HighlightedCode` is just the coloured text, in one `Text` with no chrome (`code`, `language`,
`selectable`, `decorative`, `style`): what `CodeBlock` draws, and what a live editor draws under its
text field. Give the field `CODE_FONT_FAMILY` too, so the two line up. `highlight(code, language?)`
returns the runs as `{ text, kind? }[]` (`kind` is `"comment"`, `"string"`, `"keyword"`, `"tag"`,
`"attribute"`, `"type"` or `"number"`; plain text has none), for a renderer of your own. The runs
join back into `code`.

#### `Table`, `TableHead`, `TableRow`, `TableHeaderCell`, `TableCell`

`Table` draws a whole table from `columns` and `data`: an optional title, a header row, the rows, an
empty state and paging. Without `columns` it is only the container of the primitives, for a table
whose rows you lay out yourself. Either way it carries the table / row / columnheader / cell roles;
`DataGrid` is built from the same primitives.

| Prop           | Type                                                                                                             | Default             |
| -------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------- |
| columns        | `TableColumn[]` = `{ id, label, alignment?, fallback?, width? }` (makes the table data driven)                   |                     |
| data           | `TableRowData[]` — rows as `{ [column id]: cell }`                                                               |                     |
| tableTitle     | string (heading above the header row, also the accessible name)                                                  |                     |
| width          | DimensionValue (the table scrolls sideways when the columns add up to more)                                      | fills the container |
| height         | DimensionValue (the rows scroll under a header that stays in place)                                              | as tall as its rows |
| rowsPerPage    | number (pages `data` and shows a `Pagination` under the table; the page resets when it or the row count changes) | one page            |
| hover          | boolean (highlights the row under the pointer, web)                                                              | `false`             |
| selected       | number \| number[] (indexes in `data` of the rows drawn as selected)                                             |                     |
| emptyMessage   | ReactNode                                                                                                        | `No data`           |
| onClick        | (row, index) => void (makes the rows pressable, with the button role)                                            |                     |
| children       | ReactNode (the primitives, when there are no `columns`)                                                          |                     |
| style / testID | ViewStyle / string                                                                                               |                     |

A column's `fallback` is drawn in a cell whose value is `null`, `undefined`, `""` or `false`; its
`width` is in px, and without it the column shares the free width of the table, never narrower than
120 px.

```tsx
<Table
  tableTitle="Invoices"
  columns={[
    { id: "number", label: "Invoice", width: 120 },
    { id: "customer", label: "Customer" },
    { id: "total", label: "Total", alignment: "right" },
  ]}
  data={[
    { number: "INV-001", customer: "Acme", total: "€ 1,200.00" },
    { number: "INV-002", customer: "Globex", total: "€ 480.00" },
  ]}
  rowsPerPage={10}
  hover
  onClick={(row, index) => open(index)}
/>
```

The primitives: `TableRow` takes `onClick`, `hover`, `selected` and `testID`; `TableHeaderCell` takes
`sortable`, `sortDirection` and `onClick`; the cells take `align`, `width` (150) and `flex`.

### Feedback & overlays

#### `Snackbar`

Transient message, animated in/out; bottom centre by default.

| Prop      | Type                                                                                              | Default         |
| --------- | ------------------------------------------------------------------------------------------------- | --------------- |
| visible   | boolean (required)                                                                                | —               |
| message   | string (required)                                                                                 | —               |
| onDismiss | () => void (the timeout elapsed or the `action` was clicked; not called when `onClose` is set)    |                 |
| duration  | number (ms, 0 = no auto-hide; not used with `onClose`)                                            | `4000`          |
| action    | `{ label, onClick }` (trailing button; runs `onClick`, then dismisses)                            |                 |
| onClose   | () => void (shows a close button and keeps the snackbar up until it is pressed)                   |                 |
| severity  | `"success" \| "info" \| "warning" \| "error"` (colours + icon; left out: neutral, no icon)        |                 |
| variant   | `"contained" \| "outlined"`                                                                       | `contained`     |
| position  | `"top-left" \| "top-center" \| "top-right" \| "bottom-left" \| "bottom-center" \| "bottom-right"` | `bottom-center` |
| icon      | icon (overrides the one `severity` implies)                                                       |                 |

#### `Banner`

Inline prominent message with up to two actions.

| Prop        | Type                                          | Default   |
| ----------- | --------------------------------------------- | --------- |
| visible     | boolean (required)                            | —         |
| message     | string (required)                             | —         |
| type        | `"default" \| "info" \| "warning" \| "error"` | `default` |
| icon        | icon                                          |           |
| actions     | `{ label, onPress }[]` (right-aligned, ≤ 2)   |           |
| dismissable | boolean (close X; needs onDismiss)            | `false`   |
| onDismiss   | () => void                                    |           |

#### `Dialog`

Centered dialog surface. `onClose` turns on the close icon in the header; Escape, the backdrop and
Android back call it too.

| Prop                 | Type                                                                                                          | Default  |
| -------------------- | ------------------------------------------------------------------------------------------------------------- | -------- |
| visible              | boolean (required)                                                                                            | —        |
| children             | ReactNode \| string (string → styled text, required)                                                          | —        |
| title                | string                                                                                                        |          |
| icon                 | `IconSource` (hero glyph above the title)                                                                     |          |
| onClose              | () => void (the close icon, a backdrop click, Escape on web, Android back)                                    |          |
| closeIcon            | glyph name \| ReactElement \| `false` (hidden, a dialog without `actions` falls back to a `closeText` button) | `close`  |
| closeText            | string (accessible name of the close icon, label of the fallback button)                                      | `Close`  |
| disableEscapeKeyDown | boolean (Escape and Android back no longer call `onClose`)                                                    | `false`  |
| disableBackdropClick | boolean (a backdrop click no longer calls `onClose`)                                                          | `false`  |
| width                | `"xs" \| "sm" \| "md" \| "lg"` (largest width: 360 / 480 / 560 / 800 px)                                      | `md`     |
| height               | number \| `"60%"` (fixed card height, the body scrolls; at most 90% of the window)                            |          |
| scrollable           | boolean (scrolls a body taller than the dialog)                                                               | `false`  |
| form / onSubmit      | boolean / () => void (body and `actions` inside a `Form`: `Button type="submit"` or Enter calls `onSubmit`)   | `false`  |
| actions              | ReactNode (trailing action row; replaces the fallback close button)                                           |          |
| fullScreen           | boolean (M3 full-screen dialog: close, title and `actions` in a header row; ignores `width` and `height`)     | `false`  |
| role                 | `"dialog" \| "alertdialog"` (the card's ARIA role; the title names it)                                        |          |
| describedBy          | string (`nativeID` of the element that describes it, as `aria-describedby`; needs `role`)                     |          |
| initialFocus         | `"auto" \| "actions"` (web: the first control of the modal, or of `actions`)                                  | `auto`   |
| animationType        | `"none" \| "slide" \| "fade"`                                                                                 | `fade`   |
| transparent          | boolean                                                                                                       | `true`   |
| slotStyles           | `DialogSlotStyles` — `backdrop`, `container`, `header`, `title`, `content`, `actions` style overrides         |          |
| testID               | string (the scrim gets `${testID}-scrim`, the close icon `${testID}-close`, the form `${testID}-form`)        | `dialog` |

```tsx
<Dialog
  visible={open}
  title="New contact"
  width="sm"
  onClose={close}
  form
  onSubmit={save}
  actions={
    <>
      <Button variant="text" onClick={close}>
        Cancel
      </Button>
      <Button type="submit">Save</Button>
    </>
  }
>
  <Input label="Name" value={name} onChange={setName} />
</Dialog>
```

#### `ConfirmDialog`

`Dialog` preset with confirm/cancel actions.

| Prop            | Type                                               | Default   |
| --------------- | -------------------------------------------------- | --------- |
| visible         | boolean (required)                                 | —         |
| onConfirm       | () => void (required)                              | —         |
| onCancel        | () => void (required)                              | —         |
| title / message | string                                             |           |
| confirmText     | string                                             | `Confirm` |
| cancelText      | string                                             | `Cancel`  |
| destructive     | boolean (confirm in the error tone)                | `false`   |
| icon            | `IconSource` (hero glyph)                          |           |
| dismissable     | boolean (backdrop and Escape cancel)               | `true`    |
| slotStyles      | `DialogSlotStyles` (`actions` covers both buttons) |           |

#### `AlertDialog`

A `Dialog` for something that needs an answer: `role="alertdialog"` (the title names it, the
message describes it), one primary action and an optional cancel, and **no way out but its
buttons** — a backdrop click, Escape and Android back do nothing unless you turn that on. On web
focus starts on the first button of the row: the cancel, when there is one, so Enter does not
confirm a destructive action by reflex. For a plain two-way question use `ConfirmDialog`.

| Prop                  | Type                                                                                                                                                                                                 | Default        |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| visible               | boolean (required)                                                                                                                                                                                   | —              |
| title                 | string (the headline, and the dialog's accessible name)                                                                                                                                              |                |
| message               | string (what the alert says; with `children`, the dialog's accessible description)                                                                                                                   |                |
| children              | ReactNode \| string (more body, under the message or in its place)                                                                                                                                   |                |
| severity              | `"info" \| "success" \| "warning" \| "error"` (a status icon above the title, in the status colour; left out: no icon)                                                                               |                |
| actionText / onAction | string / () => void (the primary action)                                                                                                                                                             | `OK`           |
| cancelText / onCancel | string / () => void (the secondary action, before the primary; an empty or missing `cancelText` draws none. `onCancel` also runs on a backdrop click, Escape or Android back once those are enabled) |                |
| destructive           | boolean (the primary action in the error tone)                                                                                                                                                       | `false`        |
| loading               | boolean (the primary action shows a spinner and does nothing, the cancel is disabled, nothing dismisses the alert; it stays until `visible` goes down)                                               | `false`        |
| disableBackdropClick  | boolean (set `false` to let a backdrop click call `onCancel`)                                                                                                                                        | `true`         |
| disableEscapeKeyDown  | boolean (set `false` to let Escape and Android back call `onCancel`)                                                                                                                                 | `true`         |
| slotStyles            | `DialogSlotStyles` (`actions` covers the buttons)                                                                                                                                                    |                |
| testID                | string (the buttons get `${testID}-cancel` and `${testID}-action`)                                                                                                                                   | `alert-dialog` |

```tsx
<AlertDialog
  visible={open}
  severity="error"
  title="Delete the project?"
  message="Its 12 files are removed for good."
  actionText="Delete"
  destructive
  cancelText="Keep it"
  onAction={remove}
  onCancel={() => setOpen(false)}
/>
```

#### `Popover`

Anchored floating panel; auto-positions within the viewport.

| Prop             | Type                                                                                                                           | Default                                      |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------- |
| anchor           | ReactElement (trigger, required)                                                                                               | —                                            |
| children         | ReactNode (panel content, required)                                                                                            | —                                            |
| visible          | boolean (required)                                                                                                             | —                                            |
| onDismiss        | () => void (a press outside, Android back; required)                                                                           | —                                            |
| matchAnchorWidth | boolean (constrain to anchor width)                                                                                            | `false`                                      |
| anchorPosition   | `{ vertical: "bottom" \| "top" \| "center", horizontal: "left" \| "right" \| "center" }`; it flips or slides to stay on screen | `{ vertical: "bottom", horizontal: "left" }` |

#### `HoverCard`

A card that shows more about its trigger — a profile on a username, a preview on a link. On web it
opens when the pointer rests on the trigger or it takes focus, and stays open while the pointer is
over the card, so the card can hold links; Escape closes it. On native it opens on a **long press**
of the trigger and closes on a press outside or Android back. It is not modal. Like a tooltip it is
for sighted users: whatever it shows has to be reachable some other way too. With a `Portal.Host`
mounted the card renders through it on web, so it escapes a clipping parent; with none it stays
anchored in place.

On native a trigger that is itself pressable (`Link`, `Button`) captures the touch, so the long
press never reaches the card: use text, `Typography` or a plain view as the trigger there.

| Prop                   | Type                                                                                                                                       | Default       |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------- |
| content                | ReactNode (what the card shows, required)                                                                                                  | —             |
| children               | ReactNode (the trigger, required; it is not wrapped in an accessible element)                                                              | —             |
| placement              | `"top" \| "bottom" \| "left" \| "right"` (the side of the trigger, centred; flips when that side has no room, and stays inside the window) | `bottom`      |
| anchorPosition         | as `Popover` (places the card as `Popover` does, and replaces `placement`)                                                                 |               |
| openDelay / closeDelay | number (web, ms the pointer or focus rests before it opens / after it leaves before it closes)                                             | `300` / `150` |
| open / onOpenChange    | boolean / (open) => void (controls whether it is open)                                                                                     |               |
| defaultOpen            | boolean (uncontrolled start)                                                                                                               | `false`       |
| disabled               | boolean (never opens, and closes if it was open)                                                                                           | `false`       |
| width                  | number (px; never wider than the window)                                                                                                   | `280`         |
| style                  | ViewStyle (the trigger's wrapper, which shrinks to the trigger)                                                                            |               |
| testID                 | string (the card gets `${testID}-card`)                                                                                                    |               |

```tsx
<HoverCard content={<Profile user={user} />} placement="top">
  <Typography variant="body2">@{user.handle}</Typography>
</HoverCard>
```

#### `BottomSheet`

Draggable bottom sheet with scrim.

| Prop              | Type                                                                       | Default |
| ----------------- | -------------------------------------------------------------------------- | ------- |
| visible           | boolean (required)                                                         | —       |
| onClose           | () => void (close button, scrim tap, drag down, Android back; required)    | —       |
| children          | ReactNode (required)                                                       | —       |
| title             | string                                                                     |         |
| showCloseButton   | boolean (a close button at the end of the title row)                       | `false` |
| actions           | ReactNode (a row of buttons fixed at the bottom while the content scrolls) |         |
| showHandle        | boolean (drag handle)                                                      | `true`  |
| dismissOnScrimTap | boolean                                                                    | `true`  |
| maxHeightRatio    | number (fraction of window)                                                | `0.85`  |

#### `Menu`

Anchored action menu.

| Prop           | Type                                                                                                          | Default                                      |
| -------------- | ------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| anchor         | ReactElement (required)                                                                                       | —                                            |
| items          | `MenuItem[]` = `{ id, label, icon?, trailing?, disabled?, destructive?, dividerAbove?, onClick? }` (required) | —                                            |
| visible        | boolean (required)                                                                                            | —                                            |
| onClose        | () => void (a press outside, Android back, and after an item when `closeOnSelect`; required)                  | —                                            |
| closeOnSelect  | boolean                                                                                                       | `true`                                       |
| anchorPosition | as `Popover`                                                                                                  | `{ vertical: "bottom", horizontal: "left" }` |
| dividers       | boolean (a divider between every pair of items)                                                               | `false`                                      |
| selected       | string[] (the `id`s drawn as selected, with a check mark; none marked until you pass it, even as `[]`)        |                                              |
| onClick        | (item) => void (after the item's own `onClick`)                                                               |                                              |

#### `Skeleton`

Loading placeholder with pulse.

| Prop           | Type                           | Default |
| -------------- | ------------------------------ | ------- |
| variant        | `"rect" \| "circle" \| "text"` | `rect`  |
| width / height | number \| %                    |         |
| borderRadius   | number                         |         |
| duration       | number (ms, pulse cycle)       |         |
| animate        | boolean (false = static)       | `true`  |

#### `CircularProgress`

Indeterminate SVG spinner, or a determinate ring when `progress` is set.

| Prop          | Type                                                                                                                        | Default                                           |
| ------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| progress      | number 0–1 (a ring over a track; unset, the indicator spins)                                                                |                                                   |
| size          | number                                                                                                                      | `48`                                              |
| strokeWidth   | number                                                                                                                      | `4`                                               |
| color         | string                                                                                                                      | `primary`                                         |
| trackColor    | boolean \| string (`true`: the indicator colour at a low opacity; `false`: none; unset: a ring has a track, a spinner none) |                                                   |
| label         | ReactNode (text, a number or a node drawn with the ring)                                                                    |                                                   |
| labelPosition | `"top" \| "bottom" \| "left" \| "right" \| "center"`                                                                        | `center` with a `progress`, `right` for a spinner |
| duration      | number (ms, rotation period of the spinner)                                                                                 | `1000`                                            |

#### `LinearProgress`

Determinate or indeterminate bar.

| Prop                  | Type                                                                                                                               | Default                   |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| progress              | number 0–1 (determinate value)                                                                                                     | `0`                       |
| indeterminate         | boolean                                                                                                                            | `false`                   |
| height                | number (`20` when the label is `inside`)                                                                                           | `4`                       |
| width                 | DimensionValue (the whole component, label included)                                                                               | full width of the parent  |
| color                 | string                                                                                                                             | `primary`                 |
| trackColor            | string                                                                                                                             | `surfaceContainerHighest` |
| label                 | ReactNode (text, a number or a node drawn with the bar)                                                                            |                           |
| labelPosition         | `"top-left" \| "top-center" \| "top-right" \| "left" \| "right" \| "bottom-left" \| "bottom-center" \| "bottom-right" \| "inside"` | `right`                   |
| duration              | number (ms, determinate transition)                                                                                                | `500`                     |
| indeterminateDuration | number (ms)                                                                                                                        | `1500`                    |

#### `EmptyState`

Placeholder for empty content.

| Prop        | Type                                         | Default         |
| ----------- | -------------------------------------------- | --------------- |
| title       | string (required)                            | —               |
| icon        | icon                                         | `inbox-outline` |
| description | string                                       |                 |
| action      | `{ label, onPress, iconName? }` (CTA button) |                 |

#### `Collapse`

Animates its children between `collapsedHeight` and their _measured_ natural height, so it
survives text reflow without a hardcoded height.

| Prop            | Type                                            | Default |
| --------------- | ----------------------------------------------- | ------- |
| children        | ReactNode (required)                            | —       |
| open            | boolean (required)                              | —       |
| duration        | number (ms)                                     | `200`   |
| collapsedHeight | number — a peek/teaser height                   | `0`     |
| animateOpacity  | boolean                                         | `true`  |
| keepMounted     | boolean — keep children mounted while collapsed | `false` |

#### `ToastProvider` / `useToast()`

Imperative toasts from anywhere in the tree — no `visible` state to thread through the screen.
Mount `ToastProvider` once above the app (its `position` is where toasts appear unless one asks for
another, `"bottom-center"` by default); the queue is FIFO and renders one `Snackbar` at a time.

```tsx
const toast = useToast();
toast.success("Saved");
toast.error("Upload failed", { action: { label: "Retry", onClick: retry } });
toast.show({ id: "sync", message: "Syncing…", duration: 8000 }); // same id replaces
toast.hide(); // clears the queue
```

| `ToastOptions` | Type                                                                       | Default         |
| -------------- | -------------------------------------------------------------------------- | --------------- |
| message        | string (required)                                                          | —               |
| severity       | `"success" \| "info" \| "warning" \| "error"` (left out: neutral, no icon) |                 |
| variant        | `"contained" \| "outlined"`                                                | `contained`     |
| position       | `Snackbar`'s `position` values                                             | the provider's  |
| duration       | number (ms; not used with `onClose`)                                       | `4000`          |
| icon           | icon                                                                       | from `severity` |
| action         | `{ label, onClick }`                                                       |                 |
| onClose        | () => void (keeps the toast up until its close button is pressed)          |                 |
| id             | string — replaces a queued toast with the same id instead of stacking      |                 |

### Navigation

> The library is **navigation-agnostic**: it ships navigation _widgets_ (app bar, bottom bar,
> tabs, breadcrumbs, pagination, stepper) but no navigator. `DrawerNavigation` and
> `StackNavigation` were removed in `0.5.0`; the changelog entry for that release shows the
> app-side wiring that replaces them.

#### `AppBar`

The M3 top app bar, drawn on a `Paper`. On its own the screen passes `title`, `leading` and
`actions`; as a navigator's `header` it adapts to react-navigation's contract (`navigation`,
`route`, `options`, `back`, `isPinned`, structurally typed, so it drops into a `header` renderer
without the library depending on the navigator): it reads the title from `options` / `route`,
shows a back button or a drawer menu button, and renders `options.headerRight`.

| Prop     | Type                                                                                                       | Default |
| -------- | ---------------------------------------------------------------------------------------------------------- | ------- |
| title    | ReactNode (a string uses the variant's type; left out, read from `options` / `route`)                      |         |
| subtitle | string                                                                                                     |         |
| variant  | `"small" \| "center" \| "medium" \| "large"` (`medium` and `large` put the title on a second, larger line) | `small` |
| leading  | ReactNode (a back or menu `IconButton`; under a navigator a back or menu button by default)                |         |
| actions  | ReactNode (up to three action `IconButton`s; under a navigator `options.headerRight()`)                    |         |
| elevated | boolean (the on-scroll state: `surfaceContainer` instead of `surface`)                                     | `false` |
| safeArea | boolean (pads the top safe-area inset)                                                                     | `true`  |
| divider  | boolean (a hairline under the bar; left out, drawn on the web under a navigator)                           |         |
| paper    | `Omit<PaperProps, "children">` (`elevation`, `outline`, `glow`, `style` of the `Paper` it is drawn on)     |         |

#### `NavBar`

Bottom navigation bar: the destinations of a compact window, three to five per M3.

| Prop       | Type                                                                      | Default  |
| ---------- | ------------------------------------------------------------------------- | -------- |
| items      | `NavBarItem[]` = `{ id, label, icon, badgeCount?, disabled? }` (required) | —        |
| activeId   | string (required)                                                         | —        |
| onClick    | (id) => void (the pressed destination; required)                          | —        |
| showLabels | `"always" \| "selected"`                                                  | `always` |

#### `Tabs` / `TabContent`

`Tabs` is a top tab bar with an animated indicator (text-only or icon tabs). `TabContent`
renders the child at the active index.

Tabs:

| Prop           | Type                                                                                            | Default    |
| -------------- | ----------------------------------------------------------------------------------------------- | ---------- |
| tabs           | `string[]` \| `{ label, icon?, key?, disabled? }[]` (required; an icon on every tab or on none) | —          |
| activeTab      | number (index; ignored when `activeKey` is given)                                               | `0`        |
| activeKey      | string (the active tab by its `key`, for tabs that come and go)                                 |            |
| onChange       | (index, key?) => void (required)                                                                | —          |
| variant        | `"standard" \| "rounded"` (an underline, or a pill on a rounded track)                          | `standard` |
| showBorders    | boolean (dividers between the tabs; in `rounded`, an outline around the track)                  | `false`    |
| size           | `"sm" \| "md" \| "lg"`                                                                          | `md`       |
| fullWidth      | boolean (`false` sizes each tab to its label and scrolls the bar when they do not fit)          | `true`     |
| height / width | number \| string (override the bar's size, dp or a percentage)                                  |            |
| color          | `ColorRole` (the indicator and the selected tab)                                                | `primary`  |

TabContent: `activeTab` (index, required), `children` (required), `style`.

#### `Breadcrumbs`

| Prop      | Type                                                             | Default         |
| --------- | ---------------------------------------------------------------- | --------------- |
| items     | `BreadcrumbItem[]` = `{ id, label, icon?, onPress? }` (required) | —               |
| separator | icon                                                             | `chevron-right` |
| maxItems  | number (collapse middle behind ellipsis)                         |                 |

#### `Pagination`

| Prop          | Type                                                                                      | Default   |
| ------------- | ----------------------------------------------------------------------------------------- | --------- |
| activePage    | number (1-based, required)                                                                | —         |
| totalPages    | number (required)                                                                         | —         |
| onChange      | (page) => void (a page button, an arrow or `pageSelect`; required)                        | —         |
| siblingCount  | number (pages each side of current)                                                       | `1`       |
| showFirstLast | boolean (first/last arrows)                                                               | `false`   |
| pageSelect    | boolean (a select after the pager that opens a searchable list of pages and jumps to one) | `false`   |
| color         | `ColorRole` (the selected page)                                                           | `primary` |
| variant       | `"rounded" \| "circular"` (rounded squares, or circles)                                   | `rounded` |
| size          | `"sm" \| "md" \| "lg"` (32 / 40 / 48 px)                                                  | `md`      |
| disabled      | boolean                                                                                   |           |

#### `Stepper`

Progress steps, in a row or a column.

| Prop       | Type                                                                            | Default |
| ---------- | ------------------------------------------------------------------------------- | ------- |
| steps      | `string[]` \| `{ label, icon? }[]` (required)                                   | —       |
| activeStep | number (index, required)                                                        | —       |
| direction  | `"row" \| "column"` (`row`: label under each circle; `column`: label beside it) | `row`   |
| onClick    | (stepIndex) => void (makes steps tappable)                                      |         |

#### `NavigationRail`

The side-mounted counterpart of `NavBar` for medium and expanded windows — same item shape (its
press callback is still `onItemPress`), `header` / `footer` slots for a menu button or a FAB.

#### `Drawer`, `DrawerItem`, `DrawerSection`

The M3 navigation drawer, which doubles as a side sheet: with `position`, any content as `children`
and a close button it holds filters, details or a form on any edge of the window
(`<Drawer variant="swipeable" position="right">` is a right-hand side sheet).

| Prop            | Type                                                                                                                              | Default                   |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| variant         | `"static" \| "swipeable"` (a panel beside the content, or one over a scrim that a drag, the scrim, Android back and Escape close) | `static`                  |
| position        | `"left" \| "right" \| "top" \| "bottom"` (physical edges, not mirrored in right-to-left layouts)                                  | `left`                    |
| visible         | boolean (swipeable only)                                                                                                          | `false`                   |
| onClose         | () => void (the close button; for a swipeable drawer also the scrim, a closing drag, Android back and Escape)                     |                           |
| elevation       | number 0–5 (surface tone and, on native, shadow)                                                                                  | `0` static, `1` swipeable |
| title           | string (headline; with a close or back button or `actions`, the title of a header row)                                            |                           |
| children        | ReactNode (`DrawerSection`s and / or `DrawerItem`s, or any content; required)                                                     | —                         |
| header / footer | ReactNode (pinned above / below the scrolling items)                                                                              |                           |
| actions         | ReactNode (a row of buttons at the bottom, below a divider)                                                                       |                           |
| showCloseButton | boolean (a close button in the header row)                                                                                        | `false`                   |
| onBack          | () => void (a back button before the title)                                                                                       |                           |
| collapsed       | boolean (icons only, 72 wide)                                                                                                     | `false`                   |
| width / height  | number (left and right / top and bottom: the largest height)                                                                      | `360` / `360`             |

`DrawerItem`: `label` (required), `icon`, `selected`, `badge`, `onClick`, `disabled`, and `children`
(sub-items, which make it a group the press opens and closes: `defaultExpanded`, `onToggle`).
`DrawerSection`: `title`, `children` (required), `showDivider`, and `collapsible` with
`defaultExpanded` (`true`) and `onToggle`.

#### `Toolbar`

M3 Expressive toolbar: `docked` along the bottom edge or `floating` (standard or vibrant,
horizontal or vertical, with an optional FAB).

### System

## Live demo

The `apps/playground` app in this monorepo is a presentation app for the library: a
searchable, per-component gallery with a live props panel. Run `npm start` from the repo
root to browse it on iOS, Android or web.

## License

MIT
