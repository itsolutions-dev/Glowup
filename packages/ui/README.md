# @glowup/ui

A **Material You (Material Design 3)** component library for **React Native + Web** (Expo).
~60 theme-reactive components — layout primitives, buttons, inputs, navigation, dialogs, data
grids, progress indicators and a locale-aware date/time picker family — built on a single
design-token system with light/dark support.

> Status: pre-`1.0.0`. The API may still change between minor versions; see
> [`CHANGELOG.md`](CHANGELOG.md).

## Installation

```bash
npm install @glowup/ui
```

Then install the peer dependencies your app doesn't already have. The core set:

```bash
npx expo install react-native-safe-area-context react-native-svg @expo/vector-icons
```

Some components need additional peers (installed only if you use them):

| Component(s)                                                                       | Peer dependency                                                                          |
| ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `DrawerNavigation`, `StackNavigation`                                              | `@react-navigation/native`, `@react-navigation/drawer`, `@react-navigation/native-stack` |
| `DateTimePicker`, `DatePicker`, `DatePickerInput`, `DateRangePicker`, `TimePicker` | `expo-localization`                                                                      |
| `StatusBar`                                                                        | `expo-status-bar`                                                                        |

The date and time pickers are pure React Native: the same Material 3 surface renders on iOS,
Android and web, with no OS picker underneath. `expo-localization` is only used to read the device
locale — pass `locale` explicitly and it is not needed either.

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
} from "@glowup/ui";

export default function App() {
  return (
    <ThemeProvider>
      <AlertProvider>
        <ToastProvider>
          <VStack p="m" spacing="s">
            <Typography variant="headlineMedium">Hello</Typography>
            <Button onPress={() => {}}>Tap me</Button>
          </VStack>
        </ToastProvider>
      </AlertProvider>
    </ThemeProvider>
  );
}
```

### Layout

`Box`, `Stack`/`HStack`/`VStack`, `Center`, `Spacer`, `Grid` and `AspectRatio` take spacing,
shape and color as **token names** rather than numbers, so screens never hardcode a magic value:

```tsx
<Grid columns={2} spacing="m">
  <Box p="m" bg="primaryContainer" radius="large">
    …
  </Box>
  <Box p="m" bg="secondaryContainer" radius="large">
    …
  </Box>
</Grid>
```

### Toasts

```tsx
const toast = useToast();
toast.success("Saved");
toast.error("Upload failed", { action: { label: "Retry", onPress: retry } });
```

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
  labels={{ today: t("TODAY"), confirm: t("OK"), cancel: t("CANCEL") }}
/>
```

### Theme

All colors, typography, spacing and shape tokens come from the built-in Material You theme.
Access it with the `useTheme()` hook:

```tsx
import { useTheme } from "@glowup/ui";

const { theme, toggleTheme } = useTheme();
```

Helpers `getStateColor()` and `getGlowStyles()` are also exported for building custom
theme-reactive components.

## Library layout

`src` is the library source — the code published as `@glowup/ui`.
Its public surface is the barrel `src/index.ts`. Layout:

```
src/
├── index.ts          # public API barrel — everything importable from "@glowup/ui"
├── components/        # ~60 Material You components
│   ├── CardParts/     # CardTitle, CardContent, CardCover, CardActions
│   ├── List/          # ListItem, ListSection, ListSubheader
│   ├── Modal/         # Modal, ConfirmDialog
│   ├── Navigation/    # DrawerNavigation, StackNavigation, DrawerContent, Route, User
│   ├── Progress/      # CircularProgress, LinearProgress
│   ├── Tab/           # Tabs, TabContent
│   ├── ToggleButton/  # ToggleButton, ToggleButtonGroup
│   ├── Layout/        # Box, Stack/HStack/VStack, Center, Spacer, Grid, AspectRatio
│   ├── types.ts       # shared component types (e.g. PressableState)
│   └── *.tsx          # Button, Card, Input, Chip, Select, DataGrid, Snackbar, ...
└── providers/         # theme + alert infrastructure
    ├── ThemeProvider.tsx   # Material You theme, useTheme(), getStateColor(), getGlowStyles()
    ├── theme.json          # all color / typography / spacing / shape tokens (source of truth)
    ├── AlertProvider.tsx   # cross-platform Alert() (native Alert.alert / web Modal)
    └── ToastProvider.tsx   # imperative queued toasts via useToast()
```

Styling everywhere is theme-reactive via `useMemo(() => makeStyles(theme), [theme])`, driven
by the tokens in `providers/theme.json`. Every interactive component carries the right
accessibility role/state and reacts to the light/dark theme automatically.

> Icons: any prop typed _icon_ below takes a **MaterialCommunityIcons** name — a kebab-case
> string like `"plus"` or `"bell-outline"` (outline variants append `-outline`).
> The authoritative, always-current spec (with full defaults for every prop) lives at
> [`src/components/components.md`](src/components/components.md).

## Component reference

### Theme, alert & toasts (from `src/providers`)

Exported from the library alongside the components:

- **`ThemeProvider`** — wraps the app; derives a Material You theme from `theme.json`, syncs
  with the OS color scheme, and supports manual toggle.
- **`useTheme()`** → `{ theme, isDark, toggleTheme }`.
- **`getStateColor(bg, on, state)`** — composites a hover/press state-layer color over a base.
- **`getGlowStyles(theme, active, variant?)`** — the M3 "glow" focus/hover ring (`variant="error"` for error state).
- **`AlertProvider`** + **`Alert(title, message, buttons)`** — cross-platform alert: native
  `Alert.alert` on iOS/Android, custom `Modal` on web.
- **`ToastProvider`** + **`useToast()`** — imperative, queued toasts (see
  [`ToastProvider` / `useToast()`](#toastprovider--usetoast) below).

Theme tokens: colors (primary/secondary/tertiary/error + container & surface tones, the inverse
pair `inverseSurface` / `inverseOnSurface` / `inversePrimary`, plus `surfaceTint` and `scrim`, all
with light/dark values), a full M3 type scale (`displayLarge` → `labelSmall`), spacing
(`xs:4 s:8 m:16 l:24 xl:32`) and shape radii (`small:8 medium:12 large:16 extraLarge:28`).

### Foundations

#### `Typography`

Renders themed text at an M3 type scale.

| Prop     | Type                                         | Default        | Req |
| -------- | -------------------------------------------- | -------------- | --- |
| children | ReactNode                                    | —              | ✓   |
| variant  | type-scale key (`displayLarge`…`labelSmall`) | `displayLarge` |     |
| style    | TextStyle                                    |                |     |

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
| onPress            | () => void (makes it interactive, button role)   |          |
| accessibilityLabel | string                                           |          |

Compound parts, also exported standalone as `CardTitle` / `CardContent` / `CardCover` /
`CardActions`. Compose these instead of hand-building a header row:

```tsx
<Card variant="elevated" onPress={open}>
  <Card.Cover source={photo} alt="Impianto 4" />
  <Card.Title title="Impianto 4" subtitle="Manutenzione programmata" />
  <Card.Content>
    <Typography variant="bodyMedium">Prossimo intervento: 12 marzo</Typography>
  </Card.Content>
  <Card.Actions>
    <Button mode="text" onPress={postpone}>Rinvia</Button>
    <Button onPress={confirm}>Conferma</Button>
  </Card.Actions>
</Card>
```

| Part            | Props                                                                                                   |
| --------------- | ------------------------------------------------------------------------------------------------------- |
| `Card.Title`    | `title` (required), `subtitle`, `left`, `right`, `titleNumberOfLines` (1), `subtitleNumberOfLines` (2)   |
| `Card.Content`  | `children` (required)                                                                                    |
| `Card.Cover`    | `source` + `alt` (both required), `ratio` (`16/9`) — bleeds past the card padding                        |
| `Card.Actions`  | `children` (required), `align`: `"start" \| "end" \| "space-between"` (`end`)                            |

#### `Icon`

Source-agnostic icon primitive. Use it when the icon may not be a MaterialCommunityIcons glyph —
a bundled bitmap, an SVG, a custom glyph set.

| Prop       | Type                                                                                  | Default     |
| ---------- | ------------------------------------------------------------------------------------- | ----------- |
| source     | `IconSource` (required)                                                               | —           |
| size       | number                                                                                | `24`        |
| color      | string (tints a glyph; leave unset for a full-colour bitmap)                          | `onSurface` |
| flipForRTL | boolean (mirrors directional glyphs under RTL)                                        | `false`     |

`IconSource` is a MaterialCommunityIcons name, an `ImageSourcePropType`, a
`({ size, color }) => ReactNode` render function, or a ready-made element.

#### `TouchableRipple`

A `Pressable` that paints the M3 state layer — 8% hover, 10% focus, 12% press — over a surface,
with the platform ripple on Android. Reach for it instead of re-deriving hover/press colours.

| Prop          | Type                                                       | Default     |
| ------------- | ---------------------------------------------------------- | ----------- |
| children      | ReactNode (required)                                       | —           |
| underlayColor | string (the surface the layer sits on)                     | `surface`   |
| rippleColor   | string (the "on" role of that surface)                     | `onSurface` |
| borderless    | boolean (tint only, no container background)               | `false`     |
| borderRadius  | number (match the parent so the layer doesn't bleed out)   |             |
| activeStyle   | ViewStyle (applied while hovered or pressed)               |             |

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

**Which overlays use it.** `Tooltip` and `Autocomplete`'s suggestion list render through the
Portal when a host is mounted, and stay anchored in place when one is not. Those two are the
only overlays in the kit that lay out inline: `Modal`, `ConfirmDialog`, `Popover`, `Menu`,
`Select` and `BottomSheet` all go through a native `Modal`, which is a separate window on
native and a `createPortal` into `document.body` on web — already stronger isolation than an
in-tree Portal, so they are deliberately left alone. Portal exists for the cases a `Modal`
cannot serve: a tooltip must never take touches, and the Autocomplete list must not steal
focus from the field being typed into.

### Layout

Token-driven layout primitives, so screens stop hardcoding spacing. `SpacingValue` is a
`theme.spacing` key (`"xs" | "s" | "m" | "l" | "xl"`) or a raw number; `RadiusValue` is a
`theme.shape` key or a raw number; `ColorValue` is an M3 color role name or any raw color.

#### `Box`

A `View` that reads spacing, shape and color off the theme. Extends `ViewProps`, so anything not
covered by a prop still goes through `style`.

| Prop                      | Type                                   | Default |
| ------------------------- | -------------------------------------- | ------- |
| p, px, py, pt, pr, pb, pl | SpacingValue — padding, narrowest wins |         |
| m, mx, my, mt, mr, mb, ml | SpacingValue — margin                  |         |
| bg / borderColor          | ColorValue                             |         |
| radius                    | RadiusValue                            |         |
| borderWidth               | number                                 |         |
| flex / gap                | number / SpacingValue                  |         |
| align / justify           | `alignItems` / `justifyContent` values |         |
| width / height            | ViewStyle dimensions                   |         |
| row / wrap                | boolean                                | `false` |

#### `Stack` / `HStack` / `VStack`

Evenly spaced children via `gap`, so spacing stays right when children are conditionally
rendered. `HStack` and `VStack` lock the axis. Takes every `Box` prop except `row` and `gap`.

| Prop      | Type                         | Default    |
| --------- | ---------------------------- | ---------- |
| direction | `"vertical" \| "horizontal"` | `vertical` |
| spacing   | SpacingValue                 | `"s"`      |
| reverse   | boolean                      |            |

#### `Center` / `Spacer` / `AspectRatio` / `Grid`

- **`Center`** — centres children on both axes; every `Box` prop except `align`/`justify`.
- **`Spacer`** — `size` (SpacingValue) for a fixed gap on `axis`, or no props to absorb the
  leftover space and push siblings apart.
- **`AspectRatio`** — `ratio` (default `1`), e.g. `16 / 9`.
- **`Grid`** — equal-width grid: `columns` (default `2`) or a responsive `minChildWidth`, plus
  `spacing`. Children are chunked into explicit rows rather than left to wrap, so the gap never
  pushes a cell onto the next line and a short last row keeps its cells at column width.

```tsx
<Grid columns={2} spacing="m">
  <Box p="m" bg="primaryContainer" radius="large">
    …
  </Box>
  <Box p="m" bg="secondaryContainer" radius="large">
    …
  </Box>
</Grid>
```

### Buttons & actions

#### `Button`

| Prop               | Type                                          | Default              |
| ------------------ | --------------------------------------------- | -------------------- |
| children           | ReactNode (label)                             |                      |
| onPress            | () => void                                    |                      |
| mode               | `"filled" \| "tonal" \| "outlined" \| "text"` | `filled`             |
| iconName           | icon                                          |                      |
| iconPosition       | `"left" \| "right"`                           | `left`               |
| size               | number (icon size)                            | `theme.shape.medium` |
| fullWidth          | boolean                                       | `false`              |
| loading            | boolean (inline spinner)                      | `false`              |
| disabled           | boolean                                       | `false`              |
| accessibilityLabel | string (falls back to string child)           |                      |

#### `IconButton`

Square, icon-only action — `Button` with only an icon comes out pill-shaped and label-padded.

| Prop               | Type                                                   | Default    |
| ------------------ | ------------------------------------------------------ | ---------- |
| icon               | icon (required)                                        | —          |
| accessibilityLabel | string (required — an icon carries no accessible name) | —          |
| onPress            | () => void                                             |            |
| mode               | `"standard" \| "filled" \| "tonal" \| "outlined"`      | `standard` |
| size               | `"small" \| "medium" \| "large"` (32 / 40 / 48)        | `medium`   |
| selected           | boolean — M3 toggle-icon-button state                  |            |
| loading / disabled | boolean                                                |            |

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

#### `FAB` — Floating Action Button

Floating by default: absolutely positioned, respecting safe-area insets. Set
`placement="inline"` to drop the positioning and put the FAB in a toolbar or a card action row.

| Prop      | Type                                                           | Default        |
| --------- | -------------------------------------------------------------- | -------------- |
| icon      | icon (required)                                                | —              |
| onPress   | () => void (required)                                          | —              |
| label     | string (only when `size="extended"`)                           |                |
| size      | `"small" \| "regular" \| "large" \| "extended"`                | `regular`      |
| placement | `"floating" \| "inline"`                                       | `floating`     |
| position  | `"bottom-right" \| "bottom-left" \| "top-right" \| "top-left"` | `bottom-right` |
| disabled  | boolean                                                        |                |

#### `AnimatedFAB`

A FAB that animates between an icon-only circle and a labelled pill. Drive `extended` from a
scroll offset to get the M3 shrink-on-scroll behaviour.

| Prop        | Type                                                           | Default        |
| ----------- | -------------------------------------------------------------- | -------------- |
| icon        | icon (required)                                                | —              |
| label       | string (required — it is the label that animates)              | —              |
| onPress     | () => void (required)                                          | —              |
| extended    | boolean                                                        | `true`         |
| animateFrom | `"left" \| "right"` (edge the label grows from)                | `right`        |
| iconMode    | `"static" \| "dynamic"` (icon stays put, or travels)           | `static`       |
| placement   | `"floating" \| "inline"`                                       | `floating`     |
| position    | `"bottom-right" \| "bottom-left" \| "top-right" \| "top-left"` | `bottom-right` |
| duration    | number (ms)                                                    | `150`          |
| disabled    | boolean                                                        | `false`        |

```tsx
const [extended, setExtended] = useState(true);

<ScrollView
  onScroll={(e) => setExtended(e.nativeEvent.contentOffset.y <= 0)}
  scrollEventThrottle={16}
>
  …
</ScrollView>
<AnimatedFAB icon="plus" label="Nuovo intervento" extended={extended} onPress={create} />
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

| Prop               | Type                                                            | Default |
| ------------------ | --------------------------------------------------------------- | ------- |
| options            | `{ label?, icon?, value, disabled? }[]` (required)              | —       |
| value              | string \| string[] (array when `multiSelect`, required)         | —       |
| onValueChange      | (val) => void (required)                                        | —       |
| multiSelect        | boolean                                                         | `false` |
| disabled           | boolean (whole group)                                           | `false` |
| fullWidth          | boolean (segments share the row equally)                        | `false` |
| showSelectedCheck  | boolean (M3 segmented-button check mark)                        | `false` |
| accessibilityLabel | string (names the group — a set of choices needs a question)     |         |

#### `Chip`

| Prop     | Type                                 | Default  |
| -------- | ------------------------------------ | -------- |
| label    | string (required)                    | —        |
| onPress  | () => void (makes body pressable)    |          |
| onClose  | () => void (renders trailing X)      |          |
| icon     | icon (leading)                       |          |
| selected | boolean (check + tertiary tone)      | `false`  |
| mode     | `"filled" \| "tonal" \| "outlined"`  | `filled` |
| size     | `"small" \| "medium"` (small = 24px) | `medium` |
| disabled | boolean                              | `false`  |

### Inputs & forms

#### `Input`

Text field (outlined or filled) with affixes, icons, multiline and number mode.

| Prop                       | Type                                                        | Default    |
| -------------------------- | ----------------------------------------------------------- | ---------- |
| value                      | string (required)                                           | —          |
| onChangeText               | (text) => void (required)                                   | —          |
| label / placeholder        | string                                                      |            |
| type                       | `"text" \| "number"` (number = decimal keypad + sanitizing) | `text`     |
| variant                    | `"outlined" \| "filled"`                                    | `outlined` |
| precision                  | number (decimals, number type)                              |            |
| prefix / suffix            | string (inline affix)                                       |            |
| leadingIcon / trailingIcon | icon                                                        |            |
| onTrailingIconPress        | () => void                                                  |            |
| error                      | string (message + error styling)                            |            |
| helperText                 | string (hidden while error shown)                           |            |
| required                   | boolean (asterisk on label)                                 |            |
| disabled / readonly        | boolean                                                     |            |
| secureTextEntry            | boolean (password)                                          |            |
| maxLength                  | number                                                      |            |
| multiline                  | boolean                                                     | `false`    |
| numberOfLines              | number                                                      | `4`        |
| minHeight                  | number                                                      | `56`       |
| onFocus / onBlur           | () => void                                                  |            |

#### `NumericInput`

Thin wrapper over `Input` with `type="number"`. Same core props: `value`, `onChangeText`
(required), plus `label/placeholder/prefix/suffix`, `precision`, `variant` (`outlined`),
`error`, `disabled/readonly`, `minHeight` (`56`).

#### `Select`

Dropdown built on `Popover`; single or multi select, optional chip display.

| Prop           | Type                                                  | Default            |
| -------------- | ----------------------------------------------------- | ------------------ |
| options        | `Option[]` = `{ id, label, value, icon? }` (required) | —                  |
| value          | any (single selection, required)                      | —                  |
| onSelect       | (value) => void (required)                            | —                  |
| label          | string                                                |                    |
| placeholder    | string                                                | `Select an option` |
| variant        | `"outlined" \| "filled"`                              | `outlined`         |
| error          | string                                                |                    |
| disabled       | boolean                                               |                    |
| multiSelect    | boolean                                               | `false`            |
| showAsChips    | boolean (render selection as chips)                   | `false`            |
| selectedValues | any[] (multi-select set)                              | `[]`               |
| toggleOptions  | (value) => void (multi-select handler)                |                    |

#### `Checkbox`

| Prop             | Type                       | Default |
| ---------------- | -------------------------- | ------- |
| checked          | boolean (required)         | —       |
| onValueChange    | (value) => void (required) | —       |
| label            | string                     |         |
| labelPosition    | `"left" \| "right"`        | `right` |
| indeterminate    | boolean (mixed state)      |         |
| disabled / error | boolean                    |         |

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

#### `Toggle` — Switch

Animated M3 switch with fully configurable dimensions.

| Prop                                 | Type                       | Default       |
| ------------------------------------ | -------------------------- | ------------- |
| value                                | boolean (required)         | —             |
| onValueChange                        | (value) => void (required) | —             |
| disabled                             | boolean                    | `false`       |
| width / height                       | number                     | `32` / `18`   |
| trackBorderWidth                     | number                     | `2`           |
| animationDuration                    | number (ms)                | `200`         |
| thumbOffSizeRatio / thumbOnSizeRatio | number                     | `0.8` / `0.9` |

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

#### `Spinner` — number stepper

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

| Prop                 | Type                                   | Default |
| -------------------- | -------------------------------------- | ------- |
| value                | string (required)                      | —       |
| onChangeText         | (text) => void (required)              | —       |
| onSubmit             | (text) => void                         |         |
| onClear              | () => void (after clear empties field) |         |
| placeholder          | string                                 |         |
| leadingIcon          | icon                                   |         |
| disabled / autoFocus | boolean                                |         |

#### `DateTimePicker` / `DatePicker` / `DatePickerInput` / `DateRangePicker` / `TimePicker`

Field that opens a Material 3 date/time picker. There is no OS picker underneath: the same
in-house surface renders on iOS, Android and web — as a dialog on native, as a popover docked to
the field on web — so the picker follows `theme.json` everywhere instead of whatever the platform
ships. Everything locale-dependent — month and weekday names, week start, 12h/24h, AM/PM, the
typed-entry field order, the per-day screen-reader announcement — is derived from `Intl` and
memoized per locale. Relative labels (Today/Yesterday/Tomorrow) come from `Intl.RelativeTimeFormat`.

`DatePicker`, `DateRangePicker` and `TimePicker` are the same component with `mode`/`selectionMode`
locked; `DatePickerInput` is `DatePicker` with typed entry always on.

| Prop                          | Type                                                                          | Default       |
| ----------------------------- | ----------------------------------------------------------------------------- | ------------- |
| value                         | `Date \| null` · `DateRange` · `Date[]`, following `selectionMode` (required) | —             |
| onChange                      | matching setter (required)                                                    | —             |
| label                         | string                                                                        |               |
| mode                          | `"date" \| "datetime" \| "time"`                                              | `date`        |
| selectionMode                 | `"single" \| "range" \| "multiple"` (ignored when `mode="time"`)              | `single`      |
| validRange                    | `{ startDate?, endDate?, disabledDates? }`                                    |               |
| isDateDisabled                | (date) => boolean — for rules `validRange` can't express                      |               |
| scrollMode                    | `"endless" \| "paged"` month navigation                                       | `endless`     |
| inputEnabled                  | boolean — typed entry in the field and in the dialog                          | `true`        |
| defaultInputType              | `"picker" \| "keyboard"` — which surface the dialog opens on                  | `picker`      |
| use24HourClock                | boolean — forces the 24-hour dial                                             | locale's own  |
| minuteInterval                | `1\|2\|3\|4\|5\|6\|10\|12\|15\|20\|30`                                        | `1`           |
| startYear / endYear           | number — bounds of the year grid and the endless scroller                     | ±100 years    |
| placeholder                   | string (shown while the value is empty)                                       |               |
| clearable / onClear           | boolean / () => void                                                          |               |
| error / helperText / required | string / string / boolean                                                     |               |
| locale                        | string                                                                        | device locale |
| firstDayOfWeek                | 0–6 (0 = Sunday)                                                              | locale's own  |
| labels                        | `DateTimePickerLabels` — chrome strings, pass i18n values                     | English       |
| relativeLabels                | `{ today?, yesterday?, tomorrow? }`                                           | `Intl`        |
| disabled                      | boolean                                                                       |               |

Typed entry follows the locale's own field order — `22/11/2026` in `it-IT`, `11/22/2026` in
`en-US` — and is validated against `validRange` on blur. The field itself only accepts typing for
a single calendar date; a range types its two ends inside the dialog, reached from the pencil
toggle in its header.

`mode="datetime"` collects the day first and the time second, with **Back / Next** in the footer.

Keyboard (web): arrows = day/week, PageUp/PageDown = month (Shift = year), Home/End = ends of the
week, Enter/Space = select, Escape = close.

#### `Calendar` / `ClockPicker` / `ClockDial`

The surfaces `DateTimePicker` composes, exported on their own for inline use. All three are pure
React Native — no SVG, no native modules — so they render identically on web and native.
`Calendar` adds month and year sub-views, single/range/multiple selection, virtualized endless
month scrolling and the keyboard navigation above; `ClockPicker` is the M3 hour/minute readout
with its AM/PM switch, over `ClockDial` (the analog face, drag to set) or two text fields.
`TimeSelect` — the older scrolling hour/minute columns — is still exported but no longer used by
the pickers. Full prop tables in
[`components.md`](src/components/components.md).

#### `Autocomplete`

Text field with a suggestion list — free text allowed, unlike `Select`. Accent-insensitive
matching by default, `description` lines, `loading` for server-side filtering, and
ArrowUp/ArrowDown/Enter/Escape on web. The list renders inside the field's own container (a modal
would steal focus from the input), so the parent must not clip overflow while it is open.

| Prop                                                           | Type                                                                            | Default                      |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------- | ---------------------------- |
| value / onChangeText                                           | string / (text) => void (required)                                              | —                            |
| options                                                        | `AutocompleteOption[]` — `{ id, label, value, description?, icon? }` (required) | —                            |
| onSelect                                                       | (option) => void (required)                                                     | —                            |
| filter                                                         | (option, query) => boolean                                                      | accent-insensitive substring |
| minChars / maxSuggestions                                      | number                                                                          | `1` / `8`                    |
| loading                                                        | boolean                                                                         |                              |
| emptyMessage                                                   | string (omit to hide the list on no match)                                      |                              |
| label / placeholder / error / helperText / required / disabled | as `Input`                                                                      |                              |
| leadingIcon                                                    | icon                                                                            |                              |
| clearable                                                      | boolean                                                                         | `true`                       |


With a `Portal.Host` mounted the suggestion list renders through it, so it escapes a
clipping or scrolling parent and flips above the field when there is no room below;
with no host it stays anchored under the field as before. It deliberately does not use a
native `Modal` like `Select` does — that would take focus off the field being typed into.

#### `PinInput`

One-time-code / PIN entry: single-character cells that behave as one field. Typing advances,
Backspace retreats, and pasting a whole code into any cell fills the row.

| Prop                                             | Type                                           | Default   |
| ------------------------------------------------ | ---------------------------------------------- | --------- |
| value / onChangeText                             | string / (value) => void (required)            | —         |
| length                                           | number                                         | `6`       |
| onComplete                                       | (value) => void — fired once, on becoming full |           |
| type                                             | `"numeric" \| "alphanumeric"`                  | `numeric` |
| mask                                             | boolean                                        | `false`   |
| label / error / helperText / required / disabled | as `Input`                                     |           |
| autoFocus                                        | boolean (first cell only)                      |           |
| cellSize                                         | number                                         | `48`      |

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

| Prop           | Type                                                   | Default  |
| -------------- | ------------------------------------------------------ | -------- |
| children       | ReactNode (required)                                   | —        |
| type           | `"info" \| "error"` (error adds the alert glyph)        | `info`   |
| visible        | boolean (fades out instead of unmounting)              | `true`   |
| disabled       | boolean (dims to match a disabled field)               | `false`  |
| padding        | `"normal" \| "none"` (the 16px field gutter)           | `normal` |

Hiding it keeps the text mounted so the field height doesn't jump, but takes it out of the
accessibility tree.

#### `Rating`

Star rating; renders half-stars, sets whole values on tap.

| Prop     | Type                                         | Default |
| -------- | -------------------------------------------- | ------- |
| value    | number (supports halves, e.g. 3.5, required) | —       |
| onChange | (value) => void (interactive when provided)  |         |
| max      | number                                       | `5`     |
| size     | number                                       | `24`    |
| disabled | boolean                                      |         |

#### `LanguageSelector`

Cycles through the configured languages on press (flag/label pill).

| Prop        | Type                                           | Default |
| ----------- | ---------------------------------------------- | ------- |
| currentLang | string (required)                              | —       |
| onChange    | (lang) => void — next language code (required) | —       |

### Data display

#### `Avatar`

| Prop                        | Type                                                             | Default    |
| --------------------------- | ---------------------------------------------------------------- | ---------- |
| source                      | image source (else initials, else icon)                          |            |
| name                        | string (initials fallback)                                       |            |
| icon                        | icon (icon fallback)                                             | `account`  |
| size                        | number                                                           | `40`       |
| variant                     | `"circular" \| "rounded" \| "square"`                            | `circular` |
| status                      | `"online" \| "offline" \| "busy" \| "away" \| null` (status dot) |            |
| backgroundColor / textColor | string                                                           |            |
| onPress                     | () => void                                                       |            |

#### `Badge`

Small count/dot overlay (position it over its target).

| Prop     | Type                                | Default |
| -------- | ----------------------------------- | ------- |
| count    | number (omit → dot)                 |         |
| size     | `"small" \| "large"` (small = dot)  | `large` |
| max      | number (shows `max+` when exceeded) | `99`    |
| showZero | boolean                             | `false` |
| visible  | boolean                             | `true`  |

#### `IconBadge`

Icon button with an attached count badge.

| Prop       | Type                                         | Default   |
| ---------- | -------------------------------------------- | --------- |
| iconName   | icon (required)                              | —         |
| badgeCount | number (hidden ≤ 0, caps at `99+`, required) | —         |
| size       | number                                       | `32`      |
| badgeColor | string                                       | `error`   |
| color      | string (icon color)                          | `primary` |
| onPress    | () => void                                   |           |

#### `StatusBadge`

Small labeled status pill with its own semantic colors (light/dark aware).

| Prop  | Type                                  | Default   |
| ----- | ------------------------------------- | --------- |
| label | string (required)                     | —         |
| type  | `"success" \| "error" \| "warning"`   | `success` |
| icon  | icon (override default per-type icon) |           |

#### `DataGrid`

Virtualized table: sortable columns, reorder, density, loading + empty state. Also exports
composable primitives `Table, Thead, Tfoot, Tr, Th, Td`.

| Prop            | Type                                                                 | Default  |
| --------------- | -------------------------------------------------------------------- | -------- |
| data            | any[] (row objects, required)                                        | —        |
| columns         | `ColumnDefinition[]` = `{ id, label, width?, sortable? }` (required) | —        |
| loading         | boolean                                                              | `false`  |
| density         | `"normal" \| "dense"`                                                | `normal` |
| sortColumn      | string                                                               |          |
| sortDirection   | `"asc" \| "desc"`                                                    |          |
| onSort          | (columnId, direction) => void                                        |          |
| onColumnReorder | (newColumns) => void                                                 |          |
| onEndReached    | () => void (infinite scroll)                                         |          |
| emptyMessage    | string                                                               |          |

#### `ListItem`

Single pressable list row.

| Prop                                                                     | Type                                 | Default |
| ------------------------------------------------------------------------ | ------------------------------------ | ------- |
| children                                                                 | ReactNode (label, required)          | —       |
| onPress                                                                  | () => void (adds hover/press states) |         |
| itemContainerStyle / itemTextStyle / itemPressedStyle / itemHoveredStyle | object                               |         |

#### `ListSection` / `ListSubheader`

Groups related `ListItem`s under a heading. Use this for a settings screen rather than wrapping
each group in a `Card` — a sequence of labelled groups, not a pile of equal surfaces.

| Component        | Props                                                                    |
| ---------------- | ------------------------------------------------------------------------ |
| `ListSection`    | `children` (required), `title` (heading above the rows), `divider` (`false`) |
| `ListSubheader`  | `children` (required) — a standalone group label, marked as a heading    |

#### `Tooltip`

Wraps a child; shows a bubble on hover (web) / long-press (native).

| Prop       | Type                                       | Default |
| ---------- | ------------------------------------------ | ------- |
| content    | string (required)                          | —       |
| children   | ReactNode (anchor, required)                | —       |
| position   | `"top" \| "bottom" \| "left" \| "right"`   | `top`   |
| disabled   | boolean                                    |         |
| hideDelay  | number (ms, native auto-hide)               | `1500`  |
| enterDelay | number (ms hover dwell before showing, web) | `500`   |
| leaveDelay | number (ms grace before hiding, web)        | `100`   |

Also shows on keyboard focus, not only on hover. With a `Portal.Host` mounted the bubble
renders through it, so it escapes an `overflow: hidden` parent and is clamped to the window
instead of being clipped; with no host it stays anchored in place as before.

#### `Accordion`

Expandable section with animated height.

| Prop          | Type                          | Default |
| ------------- | ----------------------------- | ------- |
| title         | string (required)             | —       |
| children      | ReactNode (content, required) | —       |
| startExpanded | boolean                       | `false` |
| onPress       | (expanded) => void            |         |

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

| Prop              | Type                                                   | Default |
| ----------------- | ------------------------------------------------------ | ------- |
| label / value     | string (both required)                                 | —       |
| delta             | string, e.g. `"12.5%"`                                 |         |
| trend             | `"up" \| "down" \| "flat"` — arrow + color for `delta` |         |
| invertTrendColors | boolean — for metrics where down is good               | `false` |
| helpText          | string                                                 |         |
| icon              | icon                                                   |         |

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

### Feedback & overlays

#### `Snackbar`

Bottom transient message; animated in/out.

| Prop      | Type                                   | Default   |
| --------- | -------------------------------------- | --------- |
| visible   | boolean (required)                     | —         |
| message   | string (required)                      | —         |
| onDismiss | () => void (required)                  | —         |
| duration  | number (ms, 0 = no auto-hide)          | `4000`    |
| action    | `{ label, onPress }` (trailing button) |           |
| type      | `"default" \| "success" \| "error"`    | `default` |
| icon      | icon                                   |           |

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

#### `Modal`

Centered dialog surface.

| Prop          | Type                                                     | Default |
| ------------- | -------------------------------------------------------- | ------- |
| visible       | boolean                                                  |         |
| children      | ReactNode \| string (string → styled text, required)     | —       |
| title         | string                                                   |         |
| icon          | `IconSource` (hero glyph above the title)                |         |
| animationType | `"none" \| "slide" \| "fade"`                            | `fade`  |
| transparent   | boolean                                                  | `true`  |
| onClose       | () => void (renders close button)                        |         |
| onDismiss     | () => void (Android back / ESC / scrim tap)              |         |
| closeText     | string                                                   | `Close` |
| dismissable   | boolean (scrim tap and ESC dismiss)                      | `true`  |
| scrollable    | boolean (scrolls a body taller than the dialog)          | `false` |
| actions       | ReactNode (trailing action row; replaces `closeText`)    |         |
| testID        | string (the scrim gets `${testID}-scrim`)                | `modal` |

#### `ConfirmDialog`

Modal preset with confirm/cancel actions.

| Prop            | Type                                  | Default   |
| --------------- | ------------------------------------- | --------- |
| visible         | boolean (required)                    | —         |
| onConfirm       | () => void (required)                 | —         |
| onCancel        | () => void (required)                 | —         |
| title / message | string                                |           |
| confirmText     | string                                | `Confirm` |
| cancelText      | string                                | `Cancel`  |
| destructive     | boolean (confirm in the error tone)   | `false`   |
| icon            | `IconSource` (hero glyph)             |           |
| dismissable     | boolean (scrim tap and ESC cancel)    | `true`    |

#### `Popover`

Anchored floating panel; auto-positions within the viewport.

| Prop             | Type                                | Default |
| ---------------- | ----------------------------------- | ------- |
| anchor           | ReactElement (trigger, required)    | —       |
| children         | ReactNode (panel content, required) | —       |
| visible          | boolean (required)                  | —       |
| onDismiss        | () => void (required)               | —       |
| matchAnchorWidth | boolean (constrain to anchor width) | `false` |

#### `BottomSheet`

Draggable bottom sheet with scrim.

| Prop              | Type                        | Default |
| ----------------- | --------------------------- | ------- |
| visible           | boolean (required)          | —       |
| onDismiss         | () => void (required)       | —       |
| children          | ReactNode (required)        | —       |
| title             | string                      |         |
| showHandle        | boolean (drag handle)       | `true`  |
| dismissOnScrimTap | boolean                     | `true`  |
| maxHeightRatio    | number (fraction of window) |         |

#### `Menu`

Anchored action menu.

| Prop          | Type                                                                                                         | Default |
| ------------- | ------------------------------------------------------------------------------------------------------------ | ------- |
| anchor        | ReactElement (required)                                                                                      | —       |
| items         | `MenuItem[]` = `{ id, label, icon?, trailing?, disabled?, destructive?, dividerAbove?, onPress }` (required) | —       |
| visible       | boolean (required)                                                                                           | —       |
| onDismiss     | () => void (required)                                                                                        | —       |
| closeOnSelect | boolean                                                                                                      | `true`  |

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

Indeterminate SVG spinner.

| Prop        | Type                         | Default   |
| ----------- | ---------------------------- | --------- |
| size        | number                       | `48`      |
| strokeWidth | number                       | `4`       |
| color       | string                       | `primary` |
| duration    | number (ms, rotation period) | `1000`    |

#### `LinearProgress`

Determinate or indeterminate bar.

| Prop                  | Type                                | Default                   |
| --------------------- | ----------------------------------- | ------------------------- |
| progress              | number 0–1 (determinate value)      | `0`                       |
| indeterminate         | boolean                             | `false`                   |
| height                | number                              | `4`                       |
| color                 | string                              | `primary`                 |
| trackColor            | string                              | `surfaceContainerHighest` |
| duration              | number (ms, determinate transition) | `500`                     |
| indeterminateDuration | number (ms)                         | `1500`                    |

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
Mount `ToastProvider` once above the app; the queue is FIFO and renders one `Snackbar` at a time.

```tsx
const toast = useToast();
toast.success("Saved");
toast.error("Upload failed", { action: { label: "Retry", onPress: retry } });
toast.show({ id: "sync", message: "Syncing…", duration: 8000 }); // same id replaces
toast.hide(); // clears the queue
```

| `ToastOptions` | Type                                                                  | Default     |
| -------------- | --------------------------------------------------------------------- | ----------- |
| message        | string (required)                                                     | —           |
| type           | `"default" \| "success" \| "error"`                                   | `default`   |
| duration       | number (ms)                                                           | `4000`      |
| icon           | icon                                                                  | from `type` |
| action         | `{ label, onPress }`                                                  |             |
| id             | string — replaces a queued toast with the same id instead of stacking |             |

### Navigation

#### `AppBar`

Top app bar; integrates with the navigator (drawer/back button, title, right actions). Props
are navigator-shaped (`navigation`, `route`, `options`, `back`, `isPinned`) — used as the
`header` renderer inside `StackNavigation`.

#### `StackNavigation`

Native stack navigator preconfigured with the themed `AppBar` header and slide animation.

| Prop             | Type                                                         | Default |
| ---------------- | ------------------------------------------------------------ | ------- |
| routes           | `Route[]` = `{ name, component, icon, options? }` (required) | —       |
| initialRouteName | string (required)                                            | —       |

#### `DrawerNavigation`

Responsive drawer: **permanent** sidebar at width ≥ 840px, slide-over below (with a pin
toggle to override). Renders the custom `DrawerContent`.

| Prop             | Type                                                         | Default |
| ---------------- | ------------------------------------------------------------ | ------- |
| routes           | `Route[]` = `{ name, component, icon, options? }` (required) | —       |
| user             | `UserProps` = `{ name, email, status }` (required)           | —       |
| initialRouteName | string (required)                                            | —       |
| onLogout         | () => void (required)                                        | —       |
| onProfilePress   | () => void (required)                                        | —       |
| logoutText       | string                                                       |         |

#### `DrawerContent`

The drawer body (`CustomDrawerContent`): route list, profile header, theme toggle, pin
toggle, logout. Consumed internally by `DrawerNavigation`; extends React Navigation's
`DrawerContentComponentProps` with `isPinned`, `onTogglePin`, `user`, `onProfilePress`,
`logoutText`, `onLogout`.

#### `DrawerPreferenceItem`

A labeled row (icon + label + trailing control) used for the drawer's preference toggles.

| Prop     | Type                         | Default |
| -------- | ---------------------------- | ------- |
| icon     | icon (required)              | —       |
| label    | string (required)            | —       |
| children | ReactNode (trailing control) |         |

#### `NavigationBar`

Bottom navigation bar.

| Prop        | Type                                                                             | Default  |
| ----------- | -------------------------------------------------------------------------------- | -------- |
| items       | `NavigationBarItem[]` = `{ id, label, icon, badgeCount?, disabled? }` (required) | —        |
| activeId    | string (required)                                                                | —        |
| onItemPress | (id) => void (required)                                                          | —        |
| showLabels  | `"always" \| "selected"`                                                         | `always` |

#### `Tabs` / `TabContent`

`Tabs` is a top tab bar with an animated indicator (text-only or icon tabs). `TabContent`
renders the child at the active index.

Tabs:

| Prop      | Type                                         | Default |
| --------- | -------------------------------------------- | ------- |
| tabs      | `string[]` \| `{ label, icon }[]` (required) | —       |
| activeTab | number (index, required)                     | —       |
| onChange  | (index) => void (required)                   | —       |

TabContent: `activeTab` (index, required), `children` (required), `style`.

#### `Breadcrumbs`

| Prop      | Type                                                             | Default         |
| --------- | ---------------------------------------------------------------- | --------------- |
| items     | `BreadcrumbItem[]` = `{ id, label, icon?, onPress? }` (required) | —               |
| separator | icon                                                             | `chevron-right` |
| maxItems  | number (collapse middle behind ellipsis)                         |                 |

#### `Pagination`

| Prop          | Type                                | Default |
| ------------- | ----------------------------------- | ------- |
| page          | number (1-based, required)          | —       |
| totalPages    | number (required)                   | —       |
| onPageChange  | (page) => void (required)           | —       |
| siblingCount  | number (pages each side of current) | `1`     |
| showFirstLast | boolean (first/last arrows)         | `false` |
| disabled      | boolean                             |         |

#### `Stepper`

Horizontal progress steps.

| Prop        | Type                                          | Default |
| ----------- | --------------------------------------------- | ------- |
| steps       | `string[]` \| `{ label, icon? }[]` (required) | —       |
| activeStep  | number (index, required)                      | —       |
| onStepPress | (stepIndex) => void (makes steps tappable)    |         |

### System

#### `StatusBar`

Themes the platform status bar / browser chrome. On web it drives the `theme-color` meta tag
and body background; on native it sets the status-bar style. Renders nothing.

| Prop            | Type   | Default                |
| --------------- | ------ | ---------------------- |
| backgroundColor | string | `theme.colors.surface` |

## Live demo

The `apps/playground` app in this monorepo is a presentation app for the library: a
searchable, per-component gallery with a live props panel. Run `npm start` from the repo
root to browse it on iOS, Android or web.

## License

MIT
