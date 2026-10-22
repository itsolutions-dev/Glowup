# Glowup Component Library — Specification

A **Material You (Material Design 3)** component library. Reference spec for rebuilding this
UI kit on a chosen frontend framework. Current implementation: **Expo React Native**
(iOS / Android / Web) using `expo-vector-icons/MaterialCommunityIcons`.

Use this file as input to a chat to decide which frontend framework to target for a new
project. It documents every component, its props, defaults, and the design-token system —
framework-agnostic.

---

## 1. Design System

### 1.1 Principles

- Material Design 3 (Material You) — dynamic color, tonal surfaces, state layers, "glow" focus.
- Theme-reactive: every component reads a `theme` object; light + dark variants.
- Cross-platform: one API renders on native and web. Hover states are web-only; press/ripple on native.
- Accessibility built in: roles, states (`selected`, `checked`, `expanded`, `disabled`), ARIA attrs on web.

### 1.2 Color tokens (per mode: light / dark)

Full M3 role set. Each `xxx` pairs with `onXxx` for content color.

| Token                                            | Light                                         | Dark                                          |
| ------------------------------------------------ | --------------------------------------------- | --------------------------------------------- |
| primary / onPrimary                              | `#6750A4` / `#FFFFFF`                         | `#D0BCFF` / `#381E72`                         |
| primaryContainer / onPrimaryContainer            | `#EADDFF` / `#21005D`                         | `#4F378B` / `#EADDFF`                         |
| secondary / onSecondary                          | `#625B71` / `#FFFFFF`                         | `#CCC2DC` / `#332D41`                         |
| secondaryContainer / onSecondaryContainer        | `#E8DEF8` / `#1D192B`                         | `#4A4458` / `#E8DEF8`                         |
| tertiary / onTertiary                            | `#7D5260` / `#FFFFFF`                         | `#EFB8C8` / `#492532`                         |
| tertiaryContainer / onTertiaryContainer          | `#FFD8E4` / `#31111D`                         | `#633B48` / `#FFD8E4`                         |
| error / onError                                  | `#B3261E` / `#FFFFFF`                         | `#F2B8B5` / `#601410`                         |
| errorContainer / onErrorContainer                | `#F9DEDC` / `#410E0B`                         | `#8C1D18` / `#F9DEDC`                         |
| background / onBackground                        | `#FEF7FF` / `#1D1B20`                         | `#141218` / `#E6E1E5`                         |
| surface / onSurface                              | `#FEF7FF` / `#1D1B20`                         | `#141218` / `#E6E1E5`                         |
| surfaceVariant / onSurfaceVariant                | `#E7E0EC` / `#49454F`                         | `#49454F` / `#CAC4D0`                         |
| outline / outlineVariant                         | `#79747E` / `#CAC4D0`                         | `#938F99` / `#444746`                         |
| surfaceContainerLow / Container / High / Highest | `#F7F2FA` / `#F3EDF7` / `#ECE6F0` / `#EDE7F0` | `#1D1B20` / `#211F26` / `#2B2930` / `#36343B` |
| surfaceDim                                       | `#DED8E1`                                     | `#0F0D13`                                     |
| shadow                                           | `#000000`                                     | `#000000`                                     |

### 1.3 Typography scale (M3)

`fontFamily: System` for all. `variant` prop selects one, by its M3 role name or by its alias.

| Variant        | Alias     | Size | Line | Weight | Tracking |
| -------------- | --------- | ---- | ---- | ------ | -------- |
| displayLarge   | h1        | 57   | 64   | 400    | -0.25    |
| displayMedium  | h2        | 45   | 52   | 400    | 0        |
| displaySmall   | h3        | 36   | 44   | 400    | 0        |
| headlineLarge  | h4        | 32   | 40   | 400    | 0        |
| headlineMedium | —         | 28   | 36   | 400    | 0        |
| headlineSmall  | h5        | 24   | 32   | 400    | 0        |
| titleLarge     | h6        | 22   | 28   | 400    | 0        |
| titleMedium    | subtitle1 | 16   | 24   | 500    | 0.15     |
| titleSmall     | subtitle2 | 14   | 20   | 500    | 0.1      |
| bodyLarge      | body1     | 16   | 24   | 400    | 0.5      |
| bodyMedium     | body2     | 14   | 20   | 400    | 0.25     |
| bodySmall      | caption   | 12   | 16   | 400    | 0.4      |
| labelLarge     | button    | 14   | 20   | 500    | 0.1      |
| labelMedium    | —         | 12   | 16   | 500    | 0.5      |
| labelSmall     | overline  | 11   | 16   | 500    | 0.5      |

### 1.4 Spacing & Shape

- **Spacing**: `xs:4  s:8  m:16  l:24  xl:32`
- **Shape (corner radius)**: `small:8  medium:12  large:16  extraLarge:28`

### 1.5 Theme utilities

- `useTheme()` → `{ theme, toggleTheme, palette, setPalette }`; the scheme is `theme.isDark`. Syncs with OS scheme + manual toggle.
- `getStateColor(bg, on, state)` → composites a hover/press state-layer color over a base.
- `getGlowStyles(theme, active, variant?)` → the M3 "glow" focus/hover ring (variant `"error"` for error state).

### 1.6 Palettes

The token set above is the **baseline** palette. `ThemeProvider` renders one `ThemePalette`
(`{ id, name, seed, light, dark }`) at a time and can switch it at runtime.

- `palettes` — the shipped sets: `baseline` (the hand-authored M3 scheme above), the
  hand-authored brand sets `databeasy` and `inxpire` (written out, not derived), plus the
  nineteen named Material hues, keyed on their 500 swatch: `red`, `pink`, `purple`,
  `deepPurple`, `indigo`, `blue`, `lightBlue`, `cyan`, `teal`, `green`, `lightGreen`, `lime`,
  `yellow`, `amber`, `orange`, `deepOrange`, `brown`, `grey`, `blueGrey`. Material 3 publishes
  no named list of its own — a scheme is generated from any source colour — so these are
  run through the M3 role mapping (TonalSpot) like any custom seed. `grey` uses the
  Monochrome variant and `brown` / `blueGrey` a muted one, since TonalSpot's fixed chroma
  would turn a near-neutral seed into full colour. `cobalt`, `forest` and `rose` remain as
  deprecated, non-enumerable aliases of `blue`, `green` and `pink`.
- A palette may also carry `typography` (per-variant `TextStyle` overrides merged over the
  default scale) and `iconSet: "eva"` (Eva Icons in place of Material wherever the library has
  an equivalent). `databeasy` is Roboto + Material, `inxpire` is Geist + Eva. The library only names
  the font files (`Roboto_500Medium`, `Geist_600SemiBold`, …): the app loads them with
  `expo-font`, e.g. from `@expo-google-fonts/roboto` and `@expo-google-fonts/geist`.
- `createPalette(seed, { id?, name?, chroma? })` — the same derivation for a brand colour.
  Error stays the fixed Material red whatever the seed.
- `<ThemeProvider initialPalette={palettes.teal}>` picks one on mount;
  `useTheme().setPalette(palette)` switches it live, `useTheme().palette` reads it.
  `Object.values(palettes)` lists each set once — build a picker from it.

### 1.7 Shared type

`MaterialCommunityIconsGlyphs` — icon names are kebab-case strings (e.g. `"plus"`, `"bell-outline"`).
Outline variants append `-outline`. Any prop typed "icon" below takes one of these.

---

## 2. Foundations

### Typography

Renders themed text at an M3 scale.

| Prop     | Type                                         | Default     | Req | Description                                                                                        |
| -------- | -------------------------------------------- | ----------- | --- | -------------------------------------------------------------------------------------------------- |
| children | ReactNode                                    | —           | ✓   | Text content                                                                                       |
| variant  | alias or M3 role name (see 1.3)              | `h1`        |     | Type scale: `h1`–`h6`, `subtitle1`, `subtitle2`, `body1`, `body2`, `button`, `caption`, `overline` |
| color    | theme colour token or any colour string      | `onSurface` |     | `"primary"`, `"onSurfaceVariant"`, `"error"`, … or `"#RRGGBB"`                                     |
| fontSize | number                                       |             |     | Overrides the variant's size; the line height scales with it                                       |
| nowrap   | boolean                                      | `false`     |     | One line, ending in an ellipsis when cut                                                           |
| align    | `"left" \| "center" \| "right" \| "justify"` |             |     | Horizontal alignment                                                                               |
| onClick  | () => void                                   |             |     | Makes the text pressable                                                                           |
| style    | TextStyle                                    |             |     | Override                                                                                           |
| …rest    | TextProps                                    |             |     | Forwarded to `Text` (`numberOfLines`, `selectable`, `testID`…)                                     |

### Divider

Horizontal or vertical rule, optionally with a centered label.

| Prop           | Type                         | Default      | Description                      |
| -------------- | ---------------------------- | ------------ | -------------------------------- |
| orientation    | `"horizontal" \| "vertical"` | `horizontal` |                                  |
| inset          | number                       | `0`          | Margin along the line            |
| thickness      | number                       | `1`          | Line thickness                   |
| contentSpacing | number                       | `16`         | Gap around label                 |
| children       | ReactNode (string → label)   |              | Centered label (horizontal only) |
| style          | ViewStyle                    |              |                                  |

### Paper

Elevated / tonal surface container.

| Prop      | Type       | Default | Req | Description                   |
| --------- | ---------- | ------- | --- | ----------------------------- |
| children  | ReactNode  | —       | ✓   |                               |
| elevation | number 0–5 | `1`     |     | Maps to surface tone + shadow |
| outline   | boolean    | `false` |     | 1px outlineVariant border     |
| glow      | boolean    | `false` |     | Use glow instead of shadow    |
| style     | ViewStyle  |         |     |                               |

### Card

Pressable content surface.

| Prop               | Type                                             | Default  | Req | Description                        |
| ------------------ | ------------------------------------------------ | -------- | --- | ---------------------------------- |
| children           | ReactNode                                        | —        | ✓   |                                    |
| variant            | `"elevated" \| "filled" \| "outlined" \| "glow"` | `filled` |     |                                    |
| onClick            | () => void                                       |          |     | Makes it interactive (button role) |
| accessibilityLabel | string                                           |          |     |                                    |
| style              | ViewStyle                                        |          |     |                                    |

---

### Icon

Source-agnostic icon primitive. Use it wherever the icon may not be a
MaterialCommunityIcons glyph — a bundled bitmap, an SVG, a custom glyph set.

| Prop       | Type                    | Default     | Description                                     |
| ---------- | ----------------------- | ----------- | ----------------------------------------------- |
| source     | `IconSource` (required) | —           | Glyph name, image source, render fn, or element |
| size       | number                  | `24`        |                                                 |
| color      | string                  | `onSurface` | Tints a glyph; omit for a colour bitmap         |
| flipForRTL | boolean                 | `false`     | Mirrors directional glyphs under RTL            |
| style      | ImageStyle              |             |                                                 |

`IconSource` is a MaterialCommunityIcons name, an `ImageSourcePropType`, a
`({ size, color }) => ReactNode` render function, or a ready-made element.

### TouchableRipple

A `Pressable` that paints the M3 state layer — 8% hover, 10% focus, 12% press — over a
surface, with the platform ripple on Android. Reach for it instead of re-deriving
hover/press colours in a component.

| Prop          | Type                 | Default     | Description                                 |
| ------------- | -------------------- | ----------- | ------------------------------------------- |
| children      | ReactNode (required) | —           |                                             |
| underlayColor | string               | `surface`   | Surface the layer sits on                   |
| rippleColor   | string               | `onSurface` | The "on" role of that surface               |
| borderless    | boolean              | `false`     | Tint only, no container background          |
| borderRadius  | number               |             | Match the parent so the layer doesn't bleed |
| activeStyle   | ViewStyle            |             | Applied while hovered or pressed            |

Plus every `Pressable` prop except `style`/`children`. The `useStateLayer(base, on)` hook
exports the same colours for a component that already owns its `Pressable`.

### CardTitle / CardContent / CardCover / CardActions

The compound parts of `Card`, reachable either as `Card.Title` … `Card.Actions` or as these
standalone exports. Compose them instead of hand-building a header row.

(The heading uses the standalone names on purpose: the docs splitter only accepts
identifier-shaped names, so a `Card.Title`-style heading would be dropped along with this
whole section.)

| Part           | Props                                                                                                         |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| `Card.Title`   | `title` (required), `subtitle`, `startIcon`, `endIcon`, `titleNumberOfLines` (1), `subtitleNumberOfLines` (2) |
| `Card.Content` | `children` (required)                                                                                         |
| `Card.Cover`   | `source` + `alt` (both required), `ratio` (`16/9`) — bleeds past the card padding                             |
| `Card.Actions` | `children` (required), `align`: `"start" \| "end" \| "space-between"` (`end`)                                 |

```tsx
<Card variant="elevated" onClick={open}>
  <Card.Cover source={photo} alt="Line 4" />
  <Card.Title title="Line 4" subtitle="Scheduled maintenance" />
  <Card.Content>
    <Typography variant="body2">Next service: 12 March</Typography>
  </Card.Content>
  <Card.Actions>
    <Button variant="text" onClick={postpone}>
      Postpone
    </Button>
    <Button onClick={confirm}>Confirm</Button>
  </Card.Actions>
</Card>
```

## 3. Buttons & Actions

### Button

| Prop               | Type                                          | Default              | Req | Description                                                                       |
| ------------------ | --------------------------------------------- | -------------------- | --- | --------------------------------------------------------------------------------- |
| children           | ReactNode                                     |                      |     | Label                                                                             |
| onClick            | () => void                                    |                      |     |                                                                                   |
| variant            | `"filled" \| "tonal" \| "outlined" \| "text"` | `filled`             |     |                                                                                   |
| color              | `ButtonColor`                                 | `primary`            |     | Colour role, see below                                                            |
| iconName           | icon                                          |                      |     | Leading/trailing icon                                                             |
| iconPosition       | `"start" \| "end"`                            | `start`              |     | Icon side relative to the label                                                   |
| iconStyle          | object                                        |                      |     |                                                                                   |
| size               | number                                        | `theme.shape.medium` |     | Icon size                                                                         |
| fullWidth          | boolean                                       | `false`              |     | Stretch to parent width                                                           |
| disabled           | boolean                                       | `false`              |     |                                                                                   |
| loading            | boolean                                       | `false`              |     | Shows inline spinner                                                              |
| busy               | boolean                                       | `false`              |     | Blocks presses, aria-busy                                                         |
| underlay           | ReactNode                                     |                      |     | Drawn behind the label                                                            |
| labelStyle         | TextStyle                                     |                      |     | After the type style                                                              |
| accessibilityLabel | string                                        |                      |     | Falls back to string child                                                        |
| type               | `"button" \| "submit"`                        | `button`             |     | `"submit"` submits the enclosing `Form` after `onClick`; ignored outside a `Form` |
| accessibilityHint  | string                                        |                      |     |                                                                                   |
| testID             | string                                        |                      |     |                                                                                   |
| style              | object                                        |                      |     |                                                                                   |

`color` takes a colour role (`ColorRole`, also the `color` of `IconButton`, `Chip` and `Badge`):
`primary`, `secondary`, `tertiary`, `error` (the destructive treatment), `success`, `warning`,
`info` or `neutral`. The last four come from fixed hues kept off the seed.

`busy` is `loading` without the spinner: label, icon and full-strength colours stay on
screen. `underlay` fills the whole surface behind the content, clipped to its shape and
blind to touches — it is how `ProgressButton` draws its fill.

### ProgressButton

A `Button` that carries the progress of the task it started inside its own surface
(the Google Maps "Start" pattern): **idle → loading → success | error**. Built on `Button`
(same variants, shape, state layers) and `LinearProgress`.

| Prop               | Type                                          | Default                | Description                                         |
| ------------------ | --------------------------------------------- | ---------------------- | --------------------------------------------------- |
| status             | `"idle" \| "loading" \| "success" \| "error"` | `idle`                 | Controlled — the caller moves it                    |
| progress           | number 0–1                                    |                        | While loading. Undefined → indeterminate sweep      |
| children           | string                                        |                        | Idle label (and loading label by default)           |
| loadingLabel       | string                                        | `children`             | e.g. "Calculating route…"                           |
| successLabel       | string                                        | `"Done"`               |                                                     |
| errorLabel         | string                                        | `"Try again"`          |                                                     |
| iconName           | icon                                          |                        | Idle and loading                                    |
| successIconName    | icon                                          | `check`                |                                                     |
| errorIconName      | icon                                          | `alert-circle-outline` |                                                     |
| indicator          | `"fill" \| "bar"`                             | `fill`                 | Tone sweep across the surface, or a 4dp bottom line |
| variant            | `"filled" \| "tonal" \| "outlined" \| "text"` | `filled`               |                                                     |
| onClick            | () => void                                    |                        | Fires in every status but `loading`                 |
| disabled           | boolean                                       | `false`                |                                                     |
| fullWidth          | boolean                                       | `false`                |                                                     |
| successDuration    | number (ms)                                   | `2000`                 | Then `onSuccessEnd`; `0` holds success              |
| onSuccessEnd       | () => void                                    |                        | Typically sets `status` back to `idle`              |
| progressColor      | string                                        | derived                | Fill or bar colour                                  |
| trackColor         | string                                        | `on` at 20% / 6%       | Behind the bar; behind the fill on outlined / text  |
| duration           | number (ms)                                   | `300`                  | Each progress step's transition                     |
| style              | ViewStyle                                     |                        | Surface: radius, padding, width                     |
| labelStyle         | TextStyle                                     |                        | Label: font family, size, weight                    |
| accessibilityLabel | string                                        | label                  | Idle accessible name                                |
| testID             | string                                        |                        |                                                     |

- **Loading** is busy (`aria-busy="true"`), not disabled: full-strength colours, presses
  blocked. The fill grows with `transform: scaleX` on the native driver, never `width`.
  The accessible name carries the percentage ("Calculating route…, 40%").
- **Success / error** switch to the `success` / `error` tone with a Material reveal from the
  centre; skipped when the OS asks for reduced motion. Error stays pressable to retry.
- **Announcements**: status changes go to an `aria-live="polite"` region on web and to
  `AccessibilityInfo.announceForAccessibility` on iOS/Android — once per status, never per
  progress step.
- **Default fill**: on `filled`, a tone of the surface moving away from the label colour
  (darker in light, lighter in dark) so the label keeps its contrast; on `tonal` a step
  towards it; on `outlined` / `text` the label colour at 16%.
- No CSS classes or variables: customise through `style`, `labelStyle`, `progressColor`,
  `trackColor`, `variant`, and the theme.

### IconButton

Square, icon-only action. `Button` with only an icon comes out pill-shaped and label-padded.

| Prop               | Type                                              | Default    | Req | Description                                          |
| ------------------ | ------------------------------------------------- | ---------- | --- | ---------------------------------------------------- |
| icon               | icon                                              | —          | ✓   |                                                      |
| accessibilityLabel | string                                            | —          | ✓   | Required: an icon carries no accessible name         |
| onClick            | () => void                                        |            |     |                                                      |
| variant            | `"standard" \| "filled" \| "tonal" \| "outlined"` | `standard` |     |                                                      |
| color              | `ColorRole`                                       |            |     | Same roles as `Button`; omit for the neutral M3 look |
| title              | string                                            |            |     | Tooltip: hover / focus on web, long press on native  |
| size               | `"small" \| "medium" \| "large"`                  | `medium`   |     | 32 / 40 / 48                                         |
| selected           | boolean                                           |            |     | M3 toggle-icon-button state                          |
| loading            | boolean                                           |            |     | Inline spinner                                       |
| disabled           | boolean                                           |            |     |                                                      |
| style              | ViewStyle                                         |            |     |                                                      |

### Link

Inline navigational text.

| Prop             | Type                            | Default                    | Req | Description                                                  |
| ---------------- | ------------------------------- | -------------------------- | --- | ------------------------------------------------------------ |
| children         | string                          | —                          | ✓   | Label                                                        |
| href             | string                          |                            |     | Opened with `Linking.openURL`; ignored when `onPress` is set |
| allowedSchemes   | string[]                        | `http, https, mailto, tel` |     | An `href` with any other scheme does nothing                 |
| onPress          | () => void                      |                            |     |                                                              |
| variant          | typography key                  | `bodyMedium`               |     |                                                              |
| underline        | `"always" \| "hover" \| "none"` | `hover`                    |     |                                                              |
| showExternalIcon | boolean                         | `true` for remote `href`   |     |                                                              |
| externalIcon     | icon                            | `open-in-new`              |     |                                                              |
| color            | string                          | `colors.primary`           |     |                                                              |
| disabled         | boolean                         |                            |     |                                                              |

### FAB (Floating Action Button)

Absolutely positioned by default; respects safe-area insets. `placement="inline"` drops the
positioning, to put the FAB in a toolbar or a card action row. `variant` picks the shape:
`"icon"` (a round, icon-only button), `"extended"` (the label beside the icon) or `"animated"`
(a FAB that animates between an icon-only circle and a labelled pill). Drive `extended` from a
scroll offset for the M3 shrink-on-scroll behaviour.

| Prop        | Type                                                           | Default        | Req | Description                                                          |
| ----------- | -------------------------------------------------------------- | -------------- | --- | -------------------------------------------------------------------- |
| icon        | icon                                                           | —              | ✓   |                                                                      |
| onClick     | () => void                                                     | —              | ✓   |                                                                      |
| label       | string                                                         |                |     | The text of `extended` / `animated`; every variant's accessible name |
| variant     | `"icon" \| "extended" \| "animated"`                           | `icon`         |     |                                                                      |
| size        | `"small" \| "medium" \| "large"`                               | `medium`       |     | 40 / 56 / 96                                                         |
| placement   | `"floating" \| "inline"`                                       | `floating`     |     | `inline` drops absolute positioning                                  |
| position    | `"bottom-right" \| "bottom-left" \| "top-right" \| "top-left"` | `bottom-right` |     |                                                                      |
| disabled    | boolean                                                        |                |     |                                                                      |
| extended    | boolean                                                        | `true`         |     | `animated` only: shows the label, or collapses to the icon           |
| animateFrom | `"left" \| "right"`                                            | `right`        |     | `animated` only: edge the label grows from                           |
| iconMode    | `"static" \| "dynamic"`                                        | `static`       |     | `animated` only: icon stays put, or travels                          |
| duration    | number (ms)                                                    | `150`          |     | `animated` only                                                      |
| style       | ViewStyle                                                      |                |     |                                                                      |
| testID      | string                                                         |                |     |                                                                      |

```tsx
const [extended, setExtended] = useState(true);

<ScrollView
  onScroll={(e) => setExtended(e.nativeEvent.contentOffset.y <= 0)}
  scrollEventThrottle={16}
>
  …
</ScrollView>
<FAB variant="animated" icon="plus" label="New ticket" extended={extended} onClick={create} />
```

### SpeedDial

FAB that expands a stack of labeled actions.

| Prop     | Type                | Default        | Req | Description                    |
| -------- | ------------------- | -------------- | --- | ------------------------------ |
| actions  | `SpeedDialAction[]` | —              | ✓   | `{ id, label, icon, onPress }` |
| mainIcon | icon                | —              | ✓   | Rotates 45° when open          |
| position | same as FAB         | `bottom-right` |     |                                |

### ToggleButton

Single segment; usually used via `ToggleButtonGroup`.

| Prop             | Type       | Default | Req | Description                     |
| ---------------- | ---------- | ------- | --- | ------------------------------- |
| active           | boolean    | —       | ✓   | Selected state                  |
| onPress          | () => void | —       | ✓   |                                 |
| label            | string     |         |     |                                 |
| icon             | icon       |         |     |                                 |
| isFirst / isLast | boolean    |         |     | Rounds outer corners in a group |
| style            | ViewStyle  |         |     |                                 |

### ToggleButtonGroup

Segmented button set (single or multi select).

| Prop          | Type                         | Default | Req | Description              |
| ------------- | ---------------------------- | ------- | --- | ------------------------ |
| options       | `{ label?, icon?, value }[]` | —       | ✓   |                          |
| value         | string \| string[]           | —       | ✓   | Array when `multiSelect` |
| onValueChange | (val) => void                | —       | ✓   |                          |
| multiSelect   | boolean                      | `false` |     |                          |

### ButtonGroup

M3 Expressive button group: `type="standard"` (spaced) or `"connected"` (joined, the successor of
segmented buttons), single or `multiSelect`, sizes `xs`/`s`/`m`. Same `options`/`value` shape as
ToggleButtonGroup; selection changes shape as well as colour. Props: see the API reference on its page of the docs site (generated from the source).

### SplitButton

A primary action (`children`, `iconName`, `onPress`) joined to a trailing button that opens a
`Menu` of `items`. The items are `MenuItem`s, so each takes `onClick`. Modes `filled`/`tonal`/`outlined`. Props: see the API reference on its page of the docs site (generated from the source).

### Chip

| Prop     | Type                                   | Default   | Req | Description                                                 |
| -------- | -------------------------------------- | --------- | --- | ----------------------------------------------------------- |
| label    | string                                 | —         | ✓   |                                                             |
| onClick  | () => void                             |           |     | Makes body pressable                                        |
| onClose  | () => void                             |           |     | Renders a trailing close (X)                                |
| icon     | icon                                   |           |     | Leading icon                                                |
| selected | boolean                                | `false`   |     | Shows check + tertiary tone                                 |
| variant  | `"filled" \| "tonal" \| "outlined"`    | `filled`  |     |                                                             |
| color    | `ColorRole`                            |           |     | Same roles as `Button`; omit for the neutral secondary look |
| size     | `"small" \| "medium" \| "large"`       | `medium`  |     | 24 / 32 / 40px                                              |
| border   | `"rounded" \| "squared" \| "circular"` | `rounded` |     | Corner shape                                                |
| disabled | boolean                                | `false`   |     |                                                             |
| style    | object                                 |           |     |                                                             |

### ChipGroup

A set of filter chips with the selection handled: single (optionally `required`) or `multiple`,
wrapping or scrolling (`wrap`). Chips report radio/checkbox semantics. `onChange` receives the
selected value, or the array of values with `multiple`; `variant` is the chips' look (`outlined` by
default). Props: see the API reference on its page of the docs site (generated from the source).

---

## 4. Inputs & Forms

### Input

Text field, outlined or filled; supports affixes, icons, multiline, number mode.

| Prop                       | Type                     | Default    | Req | Description                                                                                             |
| -------------------------- | ------------------------ | ---------- | --- | ------------------------------------------------------------------------------------------------------- |
| value                      | string                   | —          | ✓   |                                                                                                         |
| onChange                   | (text) => void           | —          | ✓   |                                                                                                         |
| label                      | string                   |            |     |                                                                                                         |
| placeholder                | string                   |            |     |                                                                                                         |
| type                       | `"text" \| "number"`     | `text`     |     | number = decimal keypad + sanitizing                                                                    |
| variant                    | `"outlined" \| "filled"` | `outlined` |     | The look of the box: `filled` is tinted, with its border only on focus / error, like `PinInput`'s cells |
| labelPlacement             | `"inside" \| "outside"`  | `outside`  |     | `outside` draws the label above the box, `inside` small within it; independent of `variant`             |
| fullWidth                  | boolean                  | `true`     |     | `false` shrinks the field to its content                                                                |
| precision                  | number                   |            |     | Decimal places (number type)                                                                            |
| prefix / suffix            | string                   |            |     | Inline affix text                                                                                       |
| leadingIcon / trailingIcon | icon                     |            |     |                                                                                                         |
| onTrailingIconPress        | () => void               |            |     |                                                                                                         |
| error                      | string                   |            |     | Error message + error styling                                                                           |
| helperText                 | string                   |            |     | Hidden while error shown                                                                                |
| required                   | boolean                  |            |     | Asterisk on label                                                                                       |
| disabled                   | boolean                  |            |     |                                                                                                         |
| readonly                   | boolean                  |            |     |                                                                                                         |
| secureTextEntry            | boolean                  |            |     | Password mode                                                                                           |
| maxLength                  | number                   |            |     |                                                                                                         |
| multiline                  | boolean                  | `false`    |     |                                                                                                         |
| rows                       | number                   | `4`        |     | Visible lines of a `multiline` field                                                                    |
| minHeight                  | number                   | `56`       |     |                                                                                                         |
| onFocus / onBlur           | () => void               |            |     |                                                                                                         |
| style                      | ViewStyle                |            |     |                                                                                                         |

### Select

Dropdown built on Popover; single or multi select, optional chip display.

| Prop                | Type                               | Default            | Req | Description                                                                                 |
| ------------------- | ---------------------------------- | ------------------ | --- | ------------------------------------------------------------------------------------------- |
| options             | `Option[]`                         | —                  | ✓   | `{ id, label, value, icon? }`                                                               |
| value               | any                                | —                  | ✓   | Selected value (single); `null` for none                                                    |
| onChange            | (value) => void                    | —                  | ✓   | The picked `value`; `null` when a `nullable` select is cleared                              |
| label               | string                             |                    |     |                                                                                             |
| placeholder         | string                             | `Select an option` |     |                                                                                             |
| variant             | `"outlined" \| "filled"`           | `outlined`         |     | The look of the box, as `Input`                                                             |
| labelPlacement      | `"inside" \| "outside"`            | `outside`          |     | `inside` draws the label small above the value; independent of `variant`                    |
| fullWidth           | boolean                            | `true`             |     | `false` shrinks the select to its content                                                   |
| nullable            | boolean                            | `false`            |     | Clear button; picking the selected option again deselects                                   |
| emptyMessage        | string                             | `No options`       |     | Shown in the open list when `options` is empty                                              |
| disabledOptions     | `RegExp` \| `(string \| number)[]` |                    |     | Values that stay visible but cannot be picked (a pattern is tested against `String(value)`) |
| error               | string                             |                    |     |                                                                                             |
| disabled            | boolean                            |                    |     |                                                                                             |
| multiple            | boolean                            | `false`            |     |                                                                                             |
| showAsChips         | boolean                            | `false`            |     | Render selection as chips                                                                   |
| selectedValues      | any[]                              | `[]`               |     | Multi-select value set                                                                      |
| toggleOptions       | (value) => void                    |                    |     | Multi-select handler                                                                        |
| style / optionStyle | object                             |                    |     |                                                                                             |

### Checkbox

| Prop          | Type                | Default | Req | Description |
| ------------- | ------------------- | ------- | --- | ----------- |
| checked       | boolean             | —       | ✓   |             |
| onValueChange | (value) => void     | —       | ✓   |             |
| label         | string              |         |     |             |
| labelPosition | `"left" \| "right"` | `right` |     |             |
| indeterminate | boolean             |         |     | Mixed state |
| disabled      | boolean             |         |     |             |
| error         | boolean             |         |     |             |

### CheckboxGroup

Several independent choices under one label: the checkbox counterpart of `RadioGroup`. The group
owns the array of checked values.

| Prop       | Type                            | Default  | Req | Description                                             |
| ---------- | ------------------------------- | -------- | --- | ------------------------------------------------------- |
| options    | `{ label, value, disabled? }[]` | —        | ✓   | `disabled` disables only that option                    |
| value      | any[]                           | —        | ✓   | The values of the checked options                       |
| onChange   | (values) => void                | —        | ✓   | The new set of checked values after each toggle         |
| label      | string                          |          |     |                                                         |
| direction  | `"column" \| "row"`             | `column` |     | `row` lays the options in a wrapping line               |
| disabled   | boolean                         |          |     | Whole group                                             |
| required   | boolean                         |          |     | Asterisk on label                                       |
| error      | string                          |          |     | Message below the group; also turns the checkboxes red  |
| helperText | string                          |          |     | Hidden while `error` is set                             |
| feedback   | boolean                         | `true`   |     | Report each toggle to `onInteractionFeedback` (haptics) |
| style      | ViewStyle                       |          |     |                                                         |
| testID     | string                          |          |     |                                                         |

### RadioButton / RadioGroup

`RadioButton` is a single control; `RadioGroup` (named export) manages a set.

RadioButton:

| Prop             | Type                | Default | Req | Description |
| ---------------- | ------------------- | ------- | --- | ----------- |
| selected         | boolean             | —       | ✓   |             |
| onPress          | () => void          | —       | ✓   |             |
| label            | string              |         |     |             |
| labelPosition    | `"left" \| "right"` | `right` |     |             |
| disabled / error | boolean             |         |     |             |

RadioGroup:

| Prop          | Type                | Default  | Req | Description                       |
| ------------- | ------------------- | -------- | --- | --------------------------------- |
| options       | `RadioOption[]`     | —        | ✓   | `{ id, label, value, disabled? }` |
| value         | any                 | —        | ✓   |                                   |
| onValueChange | (value) => void     | —        | ✓   |                                   |
| label         | string              |          |     |                                   |
| direction     | `"column" \| "row"` | `column` |     |                                   |
| disabled      | boolean             |          |     |                                   |
| error         | string              |          |     | Group-level error message         |

### Switch

Animated M3 switch.

| Prop           | Type                                    | Default     | Req | Description                                                |
| -------------- | --------------------------------------- | ----------- | --- | ---------------------------------------------------------- |
| value          | boolean                                 | —           | ✓   |                                                            |
| onChange       | (value) => void                         | —           | ✓   | Called with the new state; pressing the label counts       |
| disabled       | boolean                                 | `false`     |     |                                                            |
| label          | string                                  |             |     | Text next to the switch; pressing it toggles too           |
| labelPlacement | `"start" \| "end" \| "top" \| "bottom"` | `end`       |     | `start` / `end` are left / right in a left-to-right layout |
| size           | `"small" \| "medium" \| "large"`        | `medium`    |     | Track 24×14 / 32×18 / 40×22                                |
| width          | number                                  | from `size` |     | Overrides the track width                                  |
| height         | number                                  | from `size` |     | Overrides the track height; the thumb scales with it       |
| containerStyle | ViewStyle                               |             |     |                                                            |

### Slider

| Prop              | Type            | Default | Req | Description                     |
| ----------------- | --------------- | ------- | --- | ------------------------------- |
| value             | number          | —       | ✓   |                                 |
| onValueChange     | (value) => void | —       | ✓   |                                 |
| onSlidingComplete | (value) => void |         |     |                                 |
| min               | number          | `0`     |     |                                 |
| max               | number          | `100`   |     |                                 |
| step              | number          |         |     | 0/undefined = continuous        |
| label             | string          |         |     |                                 |
| showValueLabel    | boolean         |         |     |                                 |
| marks             | boolean         |         |     | Ticks at each step (needs step) |
| disabled          | boolean         |         |     |                                 |
| style             | ViewStyle       |         |     |                                 |

### NumberField (Number stepper)

Numeric field with +/- steppers. (Distinct from progress spinners in §6.)

| Prop     | Type          | Default | Req | Description |
| -------- | ------------- | ------- | --- | ----------- |
| value    | number        | —       | ✓   |             |
| onChange | (val) => void | —       | ✓   |             |
| label    | string        |         |     |             |
| step     | number        | `1`     |     |             |
| min      | number        | `0`     |     |             |
| max      | number        | `100`   |     |             |
| disabled | boolean       |         |     |             |

### SearchBar

| Prop         | Type           | Default   | Req | Description                                                                                  |
| ------------ | -------------- | --------- | --- | -------------------------------------------------------------------------------------------- |
| value        | string         | —         | ✓   |                                                                                              |
| onChange     | (text) => void | —         | ✓   | Waits for `debounceTime` when set; submit and clear report at once                           |
| onSubmit     | (text) => void |           |     |                                                                                              |
| onClear      | () => void     |           |     | After clear button empties field                                                             |
| placeholder  | string         | `Search`  |     |                                                                                              |
| icon         | icon           | `magnify` |     | Glyph at the start of the bar                                                                |
| debounceTime | number (ms)    | `0`       |     | How long the user must stop typing before `onChange` fires; the field itself updates at once |
| showLoading  | boolean        | `false`   |     | A progress indicator replaces the clear button                                               |
| disabled     | boolean        |           |     |                                                                                              |
| autoFocus    | boolean        |           |     |                                                                                              |
| style        | ViewStyle      |           |     |                                                                                              |

### DateTimePicker / DatePicker / TimePicker

Field that opens a Material 3 date/time picker. There is no OS picker underneath: the same
in-house surface renders everywhere — a dialog on native, a popover docked to the field on web —
so the picker follows the theme on all three platforms. Every locale-dependent label — month and
weekday names, week start, 12h/24h, AM/PM, typed-entry field order, day announcements — is derived
from `Intl` and memoized per locale; nothing is hardcoded to a language. Relative day labels
(Today/Yesterday/Tomorrow) come from `Intl.RelativeTimeFormat` unless overridden.

`DatePicker` and `TimePicker` are the same component with `mode` locked. `DatePicker` still takes
`selectionMode`: a date range is `<DatePicker selectionMode="range" />`, a set of days
`selectionMode="multiple"`. Typed entry is `inputEnabled` / `defaultInputType`. These three are the
only public pickers; the calendar and the clock they are built from are not exported on their own,
`variant="static"` draws them inline.

| Prop                | Type                                       | Default       | Req | Description                                                                                                   |
| ------------------- | ------------------------------------------ | ------------- | --- | ------------------------------------------------------------------------------------------------------------- |
| value               | `Date \| null` · `DateRange` · `Date[]`    | —             | ✓   | Shape follows `selectionMode`                                                                                 |
| onChange            | matching setter                            | —             | ✓   | Single mode is never called with `null`; clearing goes to `onClear`                                           |
| variant             | `"default" \| "static"`                    | `default`     |     | `static` draws the picker inline: see below                                                                   |
| presentation        | `"auto" \| "popover" \| "dialog"`          | `auto`        |     | Web only: docked to the field, or a centred dialog. `auto` picks the dialog on a touch device or under 600 px |
| fieldVariant        | `"outlined" \| "filled"`                   | `outlined`    |     | The look of the field's box, as `variant` on `Input` (`variant` here is default or static)                    |
| label               | string                                     |               |     | Also labels the typed-entry field inside the dialog                                                           |
| mode                | `"date" \| "datetime" \| "time"`           | `date`        |     | `datetime` collects the day, then the time                                                                    |
| selectionMode       | `"single" \| "range" \| "multiple"`        | `single`      |     | Ignored when `mode="time"`                                                                                    |
| validRange          | `{ startDate?, endDate?, disabledDates? }` |               |     | Inclusive bounds compared at day granularity                                                                  |
| isDateDisabled      | (date) => boolean                          |               |     | For rules `validRange` cannot express                                                                         |
| scrollMode          | `"endless" \| "paged"`                     | `endless`     |     | `endless` virtualizes the months in one list                                                                  |
| inputEnabled        | boolean                                    | `true`        |     | Typed entry in the field (a single calendar date)                                                             |
| defaultInputType    | `"picker" \| "keyboard"`                   | `picker`      |     | Which surface the dialog opens on; no toggle once it is open                                                  |
| showToday           | boolean                                    | `true`        |     | "Today" button in the calendar header (single dates only)                                                     |
| use24HourClock      | boolean                                    | locale's own  |     | `true` forces the 24-hour dial                                                                                |
| minuteInterval      | `1\|2\|3\|4\|5\|6\|10\|12\|15\|20\|30`     | `1`           |     | Granularity the dial snaps to                                                                                 |
| startYear / endYear | number                                     | ±100 years    |     | Bounds of the year grid and the endless scroller                                                              |
| placeholder         | string                                     |               |     | Shown while the value is empty                                                                                |
| clearable           | boolean                                    |               |     | Adds a clear button; needs `onClear`                                                                          |
| onClear             | () => void                                 |               |     |                                                                                                               |
| error               | string                                     |               |     | Error text; also recolors the field                                                                           |
| helperText          | string                                     |               |     | Hidden while `error` is set                                                                                   |
| required            | boolean                                    |               |     | Appends `*` to the label                                                                                      |
| locale              | string                                     | device locale |     | Formatting/labelling override                                                                                 |
| firstDayOfWeek      | 0–6 (0 = Sunday)                           | locale's own  |     |                                                                                                               |
| labels              | `DateTimePickerLabels`                     | English       |     | Chrome strings (`selectDate`, `confirm`, `back`, …)                                                           |
| relativeLabels      | `{ today?, yesterday?, tomorrow? }`        | `Intl`        |     |                                                                                                               |
| defaultOpen         | boolean                                    | `false`       |     | Mount with the picker open                                                                                    |
| disabled            | boolean                                    |               |     |                                                                                                               |
| style               | ViewStyle                                  |               |     |                                                                                                               |
| testID              | string                                     |               |     |                                                                                                               |

**Dialog.** There is no Cancel or Next button: dismiss it by tapping outside, with the back
gesture or with Escape. In single `date` mode a day tap confirms and closes; OK stays for the time
step, a range, multiple dates and typed entry. In `datetime` a day tap moves to the time step by
itself, and tapping the date readout there goes back to the calendar (its hint is `labels.back`,
"Back to date" by default). The calendar header is one control, the visible month and the year
("October 2026 ▾", which opens the year grid), with an outlined "Today" button between the month
arrows. In a range, once the first day is chosen the days from it to the one under the pointer are
shaded as a preview (pointer devices only); nothing is reported until the second tap.

**Static.** `variant="static"` draws the surface inline in the page: no field, no popup, no OK, and
every selection calls `onChange` at once with the live value. Of the field props only `disabled`
and `style` apply, and it always shows the calendar and the clock, never typed entry. A static
`DatePicker` is the inline calendar; a static `TimePicker` is the inline clock.

**Typed entry.** The field accepts a date typed in the locale's own order (`22/11/2026` in
`it-IT`, `11/22/2026` in `en-US`), validated against `validRange` on blur. Only a single calendar
date is typable in the field itself; a range types its two ends inside the dialog, which opens on
the typed fields with `defaultInputType="keyboard"` (there is no toggle between the calendar and
the keyboard). `multiple` has no typed form.

**Surfaces.** The calendar and the clock are pure React Native — no SVG, no native modules — so
they render identically on web and native. The calendar has month and year sub-views, single /
range / multiple selection and virtualized endless month scrolling; the clock is the M3
hour/minute readout with its AM/PM switch, over the analog dial (drag to set) or two text fields.

**Keyboard (web).** Arrows = day/week, PageUp/PageDown = month (Shift = year), Home/End = ends of
the week, Enter/Space = select, Escape = close.

### PinInput

One-time-code / PIN entry: single-character cells that behave as one field. Typing advances,
Backspace retreats, pasting a whole code into any cell fills the row.

| Prop                                             | Type                          | Default    | Req | Description                                                                   |
| ------------------------------------------------ | ----------------------------- | ---------- | --- | ----------------------------------------------------------------------------- |
| value                                            | string                        | —          | ✓   |                                                                               |
| onChange                                         | (value) => void               | —          | ✓   |                                                                               |
| length                                           | number                        | `6`        |     |                                                                               |
| onComplete                                       | (value) => void               |            |     | Fired once, on becoming full                                                  |
| type                                             | `"numeric" \| "alphanumeric"` | `numeric`  |     |                                                                               |
| variant                                          | `"filled" \| "outlined"`      | `outlined` |     | Cell style: bordered box, or tinted box with the border only on focus / error |
| mask                                             | boolean                       | `false`    |     | Renders dots                                                                  |
| label / error / helperText / required / disabled |                               |            |     | As `Input`                                                                    |
| autoFocus                                        | boolean                       |            |     | First cell only                                                               |
| cellSize                                         | number                        | `48`       |     |                                                                               |

### Autocomplete

Text field with a suggestion list. Free text allowed — this is not a `Select`. The list renders
inside the field's own container (a modal would steal focus from the input), so the parent must
not clip overflow while it is open.

| Prop                                                           | Type                       | Default                      | Req | Description                                                  |
| -------------------------------------------------------------- | -------------------------- | ---------------------------- | --- | ------------------------------------------------------------ |
| value                                                          | string                     | —                            | ✓   |                                                              |
| onChange                                                       | (text) => void             | —                            | ✓   | Typed, cleared, or an option's label after a pick            |
| options                                                        | `AutocompleteOption[]`     | —                            | ✓   | `{ id, label, value, description?, icon? }`                  |
| selected                                                       | option \| null             |                              |     | Chosen option; pass it to control it (array with `multiple`) |
| onSelectedChange                                               | (option \| null) => void   |                              |     | Every pick; `null` on clear (the new array with `multiple`)  |
| multiple                                                       | boolean                    | `false`                      |     | Picks show as removable chips; the text clears after a pick  |
| variant                                                        | `"outlined" \| "filled"`   | `outlined`                   |     | As `Input`                                                   |
| labelPlacement                                                 | `"inside" \| "outside"`    | `outside`                    |     | As `Input`                                                   |
| fullWidth                                                      | boolean                    | `true`                       |     | `false` shrinks the field to its content                     |
| defaultOptions                                                 | `AutocompleteOption[]`     |                              |     | Shown, unfiltered, until `minChars` characters are typed     |
| filter                                                         | (option, query) => boolean | accent-insensitive substring |     | `() => true` for server-side filtering                       |
| onSearch                                                       | (text) => void             |                              |     | After `debounce` ms without typing: fetch the options there  |
| debounce                                                       | number (ms)                | `300`                        |     | Quiet time before `onSearch`                                 |
| minChars                                                       | number                     | `1`                          |     |                                                              |
| maxSuggestions                                                 | number                     | `8`                          |     |                                                              |
| loading                                                        | boolean                    |                              |     | Spinner in the field                                         |
| emptyMessage                                                   | string                     |                              |     | Omit to hide the list on no match                            |
| label / placeholder / error / helperText / required / disabled |                            |                              |     | As `Input`                                                   |
| leadingIcon                                                    | icon                       |                              |     |                                                              |
| clearable                                                      | boolean                    | `true`                       |     |                                                              |

**Keyboard (web).** ArrowUp/ArrowDown move the highlight, Enter selects, Escape closes.

### Form

Groups fields and a submit button so that one action submits them. On the web it is a real
`<form>`: Enter in a field submits, and a `Button type="submit"` inside it submits too. On iOS and
Android it is a plain `View` and the submit button calls `onSubmit` directly. Either way `onSubmit`
runs once per submission, and the page is never navigated. A `Dialog` with `form` wraps its body
and `actions` in one.

| Prop     | Type       | Default | Req | Description                                                                        |
| -------- | ---------- | ------- | --- | ---------------------------------------------------------------------------------- |
| onSubmit | () => void |         |     | A `Button type="submit"` inside it is pressed, or (web) Enter in one of its fields |
| children | ReactNode  |         |     |                                                                                    |
| style    | ViewStyle  |         |     |                                                                                    |
| testID   | string     |         |     |                                                                                    |

```tsx
<Form onSubmit={save}>
  <Input label="Name" value={name} onChange={setName} />
  <Button type="submit">Save</Button>
</Form>
```

### FormControl

Groups a label, a control and its supporting text, and shares invalid/disabled/required state with
descendants via `useFormControl()`. For controls with no `label`/`error` props of their own —
Checkbox, RadioGroup, Slider, custom composites.

| Prop       | Type      | Default | Req | Description                      |
| ---------- | --------- | ------- | --- | -------------------------------- |
| children   | ReactNode | —       | ✓   |                                  |
| label      | string    |         |     |                                  |
| helperText | string    |         |     | Hidden while `error` is set      |
| error      | string    |         |     | Presence marks the group invalid |
| required   | boolean   | `false` |     |                                  |
| disabled   | boolean   | `false` |     | Dims the control                 |

### Rating

Star rating; half-stars rendered, whole values on tap (halves with `interval={0.5}`). The value
under the pointer is previewed on hover.

| Prop     | Type            | Default | Req | Description                                                    |
| -------- | --------------- | ------- | --- | -------------------------------------------------------------- |
| value    | number          | —       | ✓   | Supports halves (3.5)                                          |
| onChange | (value) => void |         |     | Interactive when provided                                      |
| max      | number          | `5`     |     |                                                                |
| size     | number          | `24`    |     |                                                                |
| interval | `0.5 \| 1`      | `1`     |     | Step of the input: half icons or whole ones                    |
| icon     | icon            | `star`  |     | A glyph that has an `-outline` twin, drawn for the empty state |
| required | boolean         | `false` |     | The current value cannot be tapped away to 0                   |
| disabled | boolean         |         |     |                                                                |

---

### HelperText

Supporting text under a form control. `Input`, `FormControl`, `PinInput`, `Autocomplete`
and the date/time picker field all render this internally via their own `helperText` /
`error` props — use it directly for a control that has neither.

| Prop     | Type                 | Default  | Description                     |
| -------- | -------------------- | -------- | ------------------------------- |
| children | ReactNode (required) | —        |                                 |
| type     | `"info" \| "error"`  | `info`   | `error` adds the alert glyph    |
| visible  | boolean              | `true`   | Fades out instead of unmounting |
| disabled | boolean              | `false`  | Dims to match a disabled field  |
| padding  | `"normal" \| "none"` | `normal` | The 16px field gutter           |

Hiding it keeps the text mounted so the field height does not jump, but takes it out of
the accessibility tree.

## 5. Data Display

### Avatar

| Prop                        | Type                                                | Default    | Req | Description                                                            |
| --------------------------- | --------------------------------------------------- | ---------- | --- | ---------------------------------------------------------------------- |
| source                      | image source                                        |            |     | Image; else initials; else icon                                        |
| name                        | string                                              |            |     | Initials fallback; also a tooltip on hover (web) / long press (native) |
| icon                        | icon                                                | `account`  |     | Icon fallback                                                          |
| size                        | number \| `"small" \| "medium" \| "large"`          | `medium`   |     | A pixel size, or 32 / 40 / 56                                          |
| variant                     | `"circular" \| "rounded" \| "square"`               | `circular` |     |                                                                        |
| status                      | `"online" \| "offline" \| "busy" \| "away" \| null` |            |     | Status dot                                                             |
| backgroundColor / textColor | string                                              |            |     |                                                                        |
| onClick                     | () => void                                          |            |     |                                                                        |

### Badge

Small count/dot overlay (position it over its target).

| Prop     | Type                                                           | Default | Description                                                          |
| -------- | -------------------------------------------------------------- | ------- | -------------------------------------------------------------------- |
| count    | number                                                         |         | Omit → dot                                                           |
| size     | `"small" \| "large"`                                           | `large` | small = dot                                                          |
| max      | number                                                         | `99`    | Shows `max+` when exceeded                                           |
| showZero | boolean                                                        | `false` | Render at count 0                                                    |
| color    | `ColorRole`                                                    | `error` | Same roles as `Button`                                               |
| position | `"top-right" \| "bottom-right" \| "top-left" \| "bottom-left"` |         | Pins the badge to that corner of its parent, overlapping it slightly |
| visible  | boolean                                                        | `true`  |                                                                      |
| style    | any                                                            |         |                                                                      |

### StatusBadge

Small labeled status pill (own semantic colors, light/dark aware).

| Prop  | Type                                | Default   | Req | Description                    |
| ----- | ----------------------------------- | --------- | --- | ------------------------------ |
| label | string                              | —         | ✓   |                                |
| type  | `"success" \| "error" \| "warning"` | `success` |     |                                |
| icon  | icon                                |           |     | Override default per-type icon |

### Blink

Fades its children between full opacity and `minOpacity`, over and over: a live indicator, a
pending status, a field that wants attention. A plain wrapper, so it takes no space of its own
beyond its children. When the OS asks for reduced motion nothing blinks.

| Prop       | Type        | Default | Req | Description                                                    |
| ---------- | ----------- | ------- | --- | -------------------------------------------------------------- |
| children   | ReactNode   |         |     | What blinks: a dot, a badge, a line of text                    |
| interval   | number (ms) | `600`   |     | One half of a blink: the fade down to `minOpacity`, or back up |
| active     | boolean     | `true`  |     | Blinks while true; stays at full opacity while false           |
| minOpacity | number 0–1  | `0.2`   |     | Opacity at the dimmest point of a blink                        |
| style      | ViewStyle   |         |     |                                                                |
| testID     | string      |         |     |                                                                |

```tsx
<Blink>
  <StatusBadge label="Offline" type="error" />
</Blink>
```

### DataGrid

Virtualized table: sortable columns, reorder, density, loading, empty state. Built on the public `Table` primitives below.

| Prop                           | Type                          | Default  | Req | Description                                             |
| ------------------------------ | ----------------------------- | -------- | --- | ------------------------------------------------------- |
| data                           | any[]                         | —        | ✓   | Row objects                                             |
| columns                        | `ColumnDefinition[]`          | —        | ✓   | `{ id, label, width?, sortable?, align?, renderCell? }` |
| loading                        | boolean                       | `false`  |     |                                                         |
| density                        | `"normal" \| "dense"`         | `normal` |     |                                                         |
| sortColumn                     | string                        |          |     |                                                         |
| sortDirection                  | `"asc" \| "desc"`             |          |     |                                                         |
| onSort                         | (columnId, direction) => void |          |     |                                                         |
| onColumnReorder                | (newColumns) => void          |          |     |                                                         |
| onEndReached                   | () => void                    |          |     | Infinite scroll                                         |
| onEndReachedThreshold          | number                        |          |     |                                                         |
| emptyMessage                   | string                        |          |     | Shown when empty & not loading                          |
| style / rowStyle / headerStyle | ViewStyle                     |          |     |                                                         |

### Table / TableHead / TableRow / TableHeaderCell / TableCell

`Table` draws a whole table from `columns` and `data`: an optional title, a header row, the rows,
an empty state and paging. Without `columns` it is only the container of the primitives, for a
table whose rows the caller lays out. Either way it carries the table/row/columnheader/cell
roles, so a screen reader on web can navigate it; `DataGrid` is assembled from the same primitives.

| Prop         | Type                 | Default             | Req | Description                                                                                                                                                          |
| ------------ | -------------------- | ------------------- | --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| columns      | `TableColumn[]`      |                     |     | `{ id, label, alignment?, fallback?, width? }`; giving them makes the table data driven                                                                              |
| data         | `TableRowData[]`     |                     |     | Rows as `{ [column id]: cell }`. Text and numbers are drawn in the theme's type, any other node as given                                                             |
| tableTitle   | string               |                     |     | Heading above the header row; also the table's accessible name                                                                                                       |
| width        | DimensionValue       | fills the container |     | When the columns add up to more, the table scrolls sideways                                                                                                          |
| height       | DimensionValue       | as tall as its rows |     | With it the rows scroll under a header that stays in place                                                                                                           |
| rowsPerPage  | number               |                     |     | Slices `data` into pages and shows a `Pagination` under the table; the page goes back to the first when `rowsPerPage` or the number of rows changes. Unset: one page |
| hover        | boolean              | `false`             |     | Highlights the row under the pointer (web); a row with `onClick` also highlights while pressed                                                                       |
| selected     | number \| number[]   |                     |     | Indexes in `data` of the rows drawn as selected (a position in `data`, not in the page shown)                                                                        |
| emptyMessage | ReactNode            | `No data`           |     | Shown under the header when `data` is empty                                                                                                                          |
| onClick      | (row, index) => void |                     |     | Called with the row and its index in `data`; makes the rows pressable (button role)                                                                                  |
| children     | ReactNode            |                     |     | The primitives, when there are no `columns`                                                                                                                          |
| style        | ViewStyle            |                     |     |                                                                                                                                                                      |
| testID       | string               |                     |     |                                                                                                                                                                      |

A column: `id` is the field of each row it shows; `label` the header (text or any node);
`alignment` `"left"` (default), `"center"` or `"right"`; `fallback` is drawn in a cell whose value is
`null`, `undefined`, `""` or `false` (`0` is a value); `width` is in px, and without it the column
shares the free width of the table with the others, never narrower than 120 px.

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
`sortable` / `sortDirection` / `onClick`; both kinds of cell take `align`, `width` (default 150) and
`flex` (share the row's free width, `width` then being the narrowest the cell gets). Props: see the
API reference on its page of the docs site (generated from the source).

### ListItem

A list row: text, with an optional leading icon, a second line and a trailing slot. With none of
them it is a centred single-line tile. Giving `onClick` makes the row a button.

| Prop                                                     | Type              | Default | Req | Description                                                                                                             |
| -------------------------------------------------------- | ----------------- | ------- | --- | ----------------------------------------------------------------------------------------------------------------------- |
| primaryText                                              | ReactNode         | —       | ✓   | The first line. Text is drawn in the theme's type; any other node as given                                              |
| secondaryText                                            | ReactNode         |         |     | Second line below `primaryText`, text or any node                                                                       |
| onClick                                                  | () => void        |         |     | Makes the row a button, with hover/press states. With an `action` as well, only the icon and the texts are the button   |
| icon                                                     | icon \| ReactNode |         |     | Leading slot: a glyph name, or any node (an `Avatar`, a `Checkbox`)                                                     |
| action                                                   | ReactNode         |         |     | Trailing slot: a value, a `Switch`, an `IconButton`, a chevron. A control of its own, so `disabled` does not disable it |
| primaryTextStyle / secondaryTextStyle                    | TextStyle         |         |     | Merged after the type of the text, when it is text                                                                      |
| indicatorColor                                           | string            |         |     | A coloured bar on the left edge, for a status or a priority                                                             |
| dimmed                                                   | boolean           | `false` |     | Faded, for a row that is removed or inactive; still pressable                                                           |
| trailingWidth                                            | number            |         |     | Fixes the width of the `action` slot and right-aligns it, so a column of rows lines its actions up                      |
| disabled                                                 | boolean           | `false` |     | Fades the row and stops it being pressed                                                                                |
| itemContainerStyle / itemPressedStyle / itemHoveredStyle | object            |         |     | Style overrides                                                                                                         |
| testID                                                   | string            |         |     |                                                                                                                         |

```tsx
<ListItem
  icon="bell-outline"
  primaryText="Notifications"
  secondaryText="Push and email"
  action={<Switch value={enabled} onChange={setEnabled} />}
/>
```

### ListSection / ListSubheader

Groups related `ListItem`s under a heading. Use this for a settings screen rather than
wrapping each group in a `Card` — a sequence of labelled groups, not a pile of surfaces.

| Component       | Props                                                                        |
| --------------- | ---------------------------------------------------------------------------- |
| `ListSection`   | `children` (required), `title` (heading above the rows), `divider` (`false`) |
| `ListSubheader` | `children` (required) — a standalone group label, marked as a heading        |

### Tooltip

Wraps a child; shows a bubble on hover (web) / long-press (native).

| Prop             | Type                                     | Default | Req | Description                                                                                                                                 |
| ---------------- | ---------------------------------------- | ------- | --- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| content          | string                                   | —       | ✓   |                                                                                                                                             |
| children         | ReactNode                                | —       | ✓   | Anchor                                                                                                                                      |
| position         | `"top" \| "bottom" \| "left" \| "right"` | `top`   |     |                                                                                                                                             |
| disabled         | boolean                                  |         |     |                                                                                                                                             |
| hideDelay        | number (ms)                              | `1500`  |     | Native auto-hide                                                                                                                            |
| anchorAccessible | boolean                                  | `true`  |     | Native: the anchor is one accessibility element named by `content`; turn off for a control with its own name (`IconButton` and `Avatar` do) |
| variant          | `"plain" \| "rich"`                      | `plain` |     | Rich: `title`, body, optional `action`; persistent with an action                                                                           |

### Accordion

Expandable section with animated height.

| Prop               | Type                        | Default    | Req | Description                                                                                                                                |
| ------------------ | --------------------------- | ---------- | --- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| title              | string                      | —          | ✓   |                                                                                                                                            |
| children           | ReactNode                   | —          | ✓   | Content                                                                                                                                    |
| expanded           | boolean                     | `false`    |     | Starts the panel open. The accordion keeps its own state, toggled by a press on the header, and follows the prop again whenever it changes |
| onClick            | (expanded) => void          |            |     | Called on every press of the header with the new state                                                                                     |
| icon               | icon \| ReactNode           | chevron    |     | The icon at the end of the header, drawn as given; the default chevron turns upside down while open, a custom icon does not                |
| variant            | `"outlined" \| "contained"` | `outlined` |     | A bordered panel on the surface, or a filled tonal one without a border                                                                    |
| style / titleStyle | style                       |            |     |                                                                                                                                            |

### Carousel

Paged horizontal slider.

| Prop             | Type            | Default | Req | Description                      |
| ---------------- | --------------- | ------- | --- | -------------------------------- |
| children         | ReactNode       | —       | ✓   | Each child = a page              |
| showDots         | boolean         | `true`  |     |                                  |
| showArrows       | boolean         | `false` |     | Overlay prev/next                |
| autoPlayInterval | number (ms)     | `0`     |     | 0 = off                          |
| height           | number          |         |     | Fixed height (else tallest page) |
| onIndexChange    | (index) => void |         |     |                                  |

### Stat

A single labelled metric with an optional trend delta.

| Prop       | Type                                | Default                                             | Req | Description                                                                                |
| ---------- | ----------------------------------- | --------------------------------------------------- | --- | ------------------------------------------------------------------------------------------ |
| label      | string                              | —                                                   | ✓   | What the number measures                                                                   |
| value      | string                              | —                                                   | ✓   | Pre-formatted by the caller                                                                |
| delta      | string                              |                                                     |     | e.g. `"12.5%"`                                                                             |
| trend      | `"up" \| "down" \| "flat"`          |                                                     |     | Direction of `delta`: the arrow, and the colour unless `trendColor` is set                 |
| trendColor | theme colour token \| colour string | up `success`, down `error`, flat `onSurfaceVariant` |     | Colour of the arrow and `delta`. For a metric where down is good, pass the colour yourself |
| direction  | `"column" \| "row"`                 | `column`                                            |     | `row` puts the label and the value on one line, the delta right behind the value           |
| helpText   | string                              |                                                     |     |                                                                                            |
| icon       | icon                                |                                                     |     |                                                                                            |

### CaptionValue

A caption and its value, stacked or in a row: the read-only pair a detail screen is made of
("Phone +39 06 1234"). An empty value shows `fallback` instead of leaving a hole.

| Prop                            | Type                                              | Default                          | Req | Description                                                                                                                |
| ------------------------------- | ------------------------------------------------- | -------------------------------- | --- | -------------------------------------------------------------------------------------------------------------------------- |
| caption                         | ReactNode                                         |                                  |     | The label: text, or any node                                                                                               |
| value                           | ReactNode                                         |                                  |     | Text and numbers are drawn in the theme's type; any other node as given                                                    |
| direction                       | `"column" \| "row"`                               | `column`                         |     | Caption over the value, or side by side                                                                                    |
| reverse                         | boolean                                           | `false`                          |     | Puts the value before the caption                                                                                          |
| fallback                        | ReactNode                                         | `N/A`                            |     | Drawn when `value` is empty (`null`, `undefined`, `""` or `false`; `0` is a value)                                         |
| omitCaption                     | boolean                                           | `false`                          |     | Draws no caption at all                                                                                                    |
| captionColor / valueColor       | theme colour token \| colour string               | `onSurfaceVariant` / `onSurface` |     |                                                                                                                            |
| textAlign                       | TextStyle["textAlign"]                            |                                  |     |                                                                                                                            |
| gap                             | number                                            | `4`                              |     | Space between the caption and the value, in px                                                                             |
| numberOfLines                   | number                                            | `1`                              |     | Lines the value may use before it is cut with an ellipsis; `0` is no limit                                                 |
| width / height / flex / padding | DimensionValue / DimensionValue / number / number |                                  |     | Size of the pair, its flex in the parent and the padding around it                                                         |
| enableCopy                      | boolean                                           | `false`                          |     | A small copy button after a text or number value. On web it writes to the clipboard; on native only shown with an `onCopy` |
| onCopy                          | (value: string) => void                           |                                  |     | Called with the value as text when copied; on native it is where the app does the copying                                  |
| showTooltip                     | boolean                                           | `false`                          |     | Wraps a text or number value in a `Tooltip` with the value in full, for when `numberOfLines` cuts it                       |
| captionStyle / valueStyle       | TextStyle                                         |                                  |     |                                                                                                                            |
| style                           | ViewStyle                                         |                                  |     | For anything the props above do not cover                                                                                  |
| testID                          | string                                            |                                  |     |                                                                                                                            |

### Image

`react-native`'s Image plus a loading placeholder, a fallback for broken sources, and
token-driven corner radius.

| Prop             | Type                | Default                | Req | Description                                                |
| ---------------- | ------------------- | ---------------------- | --- | ---------------------------------------------------------- |
| source           | ImageSourcePropType | —                      | ✓   |                                                            |
| alt              | string              | —                      | ✓   | Required — a nameless image is invisible to screen readers |
| fallbackSource   | ImageSourcePropType |                        |     | Swapped in on load failure                                 |
| fallbackIcon     | icon                | `image-broken-variant` |     | Used when there is no `fallbackSource`                     |
| width / height   | DimensionValue      | `100%` / —             |     |                                                            |
| ratio            | number              |                        |     | Width ÷ height; use instead of `height` for fluid layouts  |
| radius           | shape key \| number | `0`                    |     |                                                            |
| resizeMode       | ImageResizeMode     | `cover`                |     |                                                            |
| showLoader       | boolean             | `true`                 |     | Skeleton until resolved                                    |
| onLoad / onError | () => void          |                        |     |                                                            |

### IFrame

A page embedded in the screen. On the web it is a real `<iframe>`. iOS and Android have no
equivalent in React Native itself (that is `react-native-webview`, which this library does not
depend on), so there it draws `fallback`: a notice that embedded pages are not available.

| Prop           | Type                    | Default           | Req | Description                                                                                                  |
| -------------- | ----------------------- | ----------------- | --- | ------------------------------------------------------------------------------------------------------------ |
| src            | string                  | —                 | ✓   | The address of the page to embed                                                                             |
| title          | string                  | —                 | ✓   | The frame's accessible name: what the embedded page is                                                       |
| width          | DimensionValue          | `100%`            |     |                                                                                                              |
| height         | DimensionValue          | `300`             |     |                                                                                                              |
| style          | ViewStyle               |                   |     | The box the frame fills: radius, border, margin, flex                                                        |
| allow          | string                  |                   |     | The `allow` attribute: features the page may use (`"fullscreen; clipboard-write"`)                           |
| sandbox        | string                  |                   |     | The `sandbox` attribute. `""` applies every restriction; tokens lift the ones named. Left out: not sandboxed |
| referrerPolicy | `referrerpolicy` values |                   |     | The `referrerpolicy` attribute                                                                               |
| loading        | `"lazy" \| "eager"`     | `lazy`            |     | `lazy` loads the page when the frame comes near the viewport                                                 |
| onLoad         | () => void              |                   |     | The page has loaded                                                                                          |
| onError        | () => void              |                   |     | The frame reports an error loading; browsers rarely do for a page that fails to load                         |
| fallback       | ReactNode               | icon and a notice |     | Drawn on iOS and Android instead of the page                                                                 |
| testID         | string                  |                   |     |                                                                                                              |

```tsx
<IFrame
  src="https://example.com/report"
  title="Quarterly report"
  height={480}
/>
```

---

## 6. Feedback & Overlays

### Snackbar

A transient message, animated in and out; bottom centre by default.

| Prop      | Type                                                                                              | Default         | Req | Description                                                                                                  |
| --------- | ------------------------------------------------------------------------------------------------- | --------------- | --- | ------------------------------------------------------------------------------------------------------------ |
| visible   | boolean                                                                                           | —               | ✓   |                                                                                                              |
| message   | string                                                                                            | —               | ✓   |                                                                                                              |
| onDismiss | () => void                                                                                        |                 |     | The snackbar timed out (after `duration`) or its `action` was clicked. Not called when `onClose` is set      |
| duration  | number (ms)                                                                                       | `4000`          |     | 0 = no auto-hide. Not used when `onClose` is set                                                             |
| action    | `{ label, onClick }`                                                                              |                 |     | Trailing text button; clicking it runs `onClick`, then dismisses the snackbar                                |
| onClose   | () => void                                                                                        |                 |     | Shows a close icon button and keeps the snackbar up until the user closes it                                 |
| severity  | `"success" \| "info" \| "warning" \| "error"`                                                     |                 |     | Colours and default icon. Left out, the snackbar is the neutral inverse surface, with no icon                |
| variant   | `"contained" \| "outlined"`                                                                       | `contained`     |     | Filled with the severity's colours, or drawn on the surface with a severity-coloured outline, label and icon |
| position  | `"top-left" \| "top-center" \| "top-right" \| "bottom-left" \| "bottom-center" \| "bottom-right"` | `bottom-center` |     | Which edge and corner it sits in, clear of the safe-area insets                                              |
| icon      | icon                                                                                              |                 |     | Overrides the icon implied by `severity`                                                                     |

### Banner

Inline prominent message with up to two actions.

| Prop        | Type                                          | Default   | Req | Description                |
| ----------- | --------------------------------------------- | --------- | --- | -------------------------- |
| visible     | boolean                                       | —         | ✓   |                            |
| message     | string                                        | —         | ✓   |                            |
| type        | `"default" \| "info" \| "warning" \| "error"` | `default` |     |                            |
| icon        | icon                                          |           |     | Overrides per-type default |
| actions     | `{ label, onPress }[]`                        |           |     | Right-aligned, ≤ 2         |
| dismissable | boolean                                       | `false`   |     | Close (X); needs onDismiss |
| onDismiss   | () => void                                    |           |     |                            |

### Portal / Portal.Host

Renders an overlay at the host instead of in place, so it escapes a clipping parent, sits
above siblings regardless of elevation, and is not dragged by a `ScrollView`. Mount the
host once near the app root; with no host above it, `Portal` renders inline, so opting in
is safe in a tree that has not been wrapped.

```tsx
<ThemeProvider>
  <Portal.Host>
    <App />
  </Portal.Host>
</ThemeProvider>
```

`usePortalHost()` reports whether a host is mounted above the caller.

`Tooltip` and `Autocomplete`'s suggestion list are the overlays that use this. Every other
overlay in the kit — `Dialog`, `ConfirmDialog`, `Popover`, `Menu`, `Select`, `BottomSheet`,
a swipeable `Drawer` — goes through a native `Modal`, which is a separate window on native and
a `createPortal` into `document.body` on web: already stronger isolation. Portal exists for the
two cases a `Modal` cannot serve — a tooltip must never take touches, and the Autocomplete list
must not steal focus from the field being typed into.

### Dialog

Centred dialog surface. The close control is an icon in the header (`closeIcon`), which `onClose`
turns on; a dialog with `actions` has its own way out and can hide it.

| Prop                 | Type                                  | Default  | Req | Description                                                                                                                                         |
| -------------------- | ------------------------------------- | -------- | --- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| visible              | boolean                               | —        | ✓   | Whether the dialog is on screen                                                                                                                     |
| children             | ReactNode \| string                   | —        | ✓   | Body (string → styled text)                                                                                                                         |
| title                | string                                |          |     |                                                                                                                                                     |
| icon                 | `IconSource`                          |          |     | Hero glyph above the title; centres the header                                                                                                      |
| onClose              | () => void                            |          |     | Asks the dialog to close: the close icon, a click on the backdrop, Escape (web) and Android back. Without it `visible` stays up to the app          |
| closeIcon            | glyph name \| ReactElement \| `false` | `close`  |     | The close icon in the header, shown while `onClose` is set; `false` hides it. Hidden, a dialog without `actions` falls back to a `closeText` button |
| closeText            | string                                | `Close`  |     | Accessible name of the close icon, and the label of the fallback close button                                                                       |
| disableEscapeKeyDown | boolean                               | `false`  |     | Keeps Escape (web) and Android back from calling `onClose`; for a decision the user must not skip                                                   |
| disableBackdropClick | boolean                               | `false`  |     | Keeps a click on the backdrop from calling `onClose`                                                                                                |
| width                | `"xs" \| "sm" \| "md" \| "lg"`        | `md`     |     | How wide the dialog may grow on a wide window: 360 / 480 / 560 / 800 px (it is 85% of the window up to that). Ignored by `fullScreen`               |
| height               | number \| `"60%"`                     |          |     | A fixed height for the card, in px or as a percentage of the window; the body scrolls. Never past 90% of the window. Ignored by `fullScreen`        |
| scrollable           | boolean                               | `false`  |     | Scrolls the body when the content is taller than the dialog                                                                                         |
| form                 | boolean                               | `false`  |     | Wraps the body and `actions` in a `Form`, so a `Button type="submit"` in `actions` (or Enter in a field, on web) calls `onSubmit`                   |
| onSubmit             | () => void                            |          |     | Called when the `form` is submitted; only used with `form`                                                                                          |
| actions              | ReactNode                             |          |     | Trailing action row; replaces the fallback close button. In a full-screen dialog it moves into the header                                           |
| fullScreen           | boolean                               | `false`  |     | M3 full-screen dialog: close, title and `actions` in a header row, scrolling body                                                                   |
| animationType        | `"none" \| "slide" \| "fade"`         | `fade`   |     |                                                                                                                                                     |
| transparent          | boolean                               | `true`   |     |                                                                                                                                                     |
| slotStyles           | `DialogSlotStyles`                    |          |     | Style overrides, merged after the dialog's own: `backdrop`, `container`, `header`, `title`, `content`, `actions`                                    |
| testID               | string                                | `dialog` |     | Root; the scrim gets `${testID}-scrim`, the close icon `${testID}-close`, the form `${testID}-form`                                                 |

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

### ConfirmDialog

`Dialog` preset with confirm/cancel actions.

| Prop        | Type               | Default   | Req | Description                                                                             |
| ----------- | ------------------ | --------- | --- | --------------------------------------------------------------------------------------- |
| visible     | boolean            | —         | ✓   |                                                                                         |
| onConfirm   | () => void         | —         | ✓   |                                                                                         |
| onCancel    | () => void         | —         | ✓   |                                                                                         |
| title       | string             |           |     |                                                                                         |
| message     | string             |           |     |                                                                                         |
| confirmText | string             | `Confirm` |     |                                                                                         |
| cancelText  | string             | `Cancel`  |     |                                                                                         |
| destructive | boolean            | `false`   |     | Renders the confirm action in the error tone (delete, discard)                          |
| icon        | `IconSource`       |           |     | Hero glyph above the title                                                              |
| dismissable | boolean            | `true`    |     | Whether the backdrop and Escape cancel; turn it off for a decision to answer explicitly |
| slotStyles  | `DialogSlotStyles` |           |     | As `Dialog`; `actions` covers the cancel and confirm buttons                            |

### Popover

Anchored floating panel; auto-positions within the viewport.

| Prop             | Type             | Default                                      | Req | Description                                                                                                                                                                                            |
| ---------------- | ---------------- | -------------------------------------------- | --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| anchor           | ReactElement     | —                                            | ✓   | Trigger element                                                                                                                                                                                        |
| children         | ReactNode        | —                                            | ✓   | Panel content                                                                                                                                                                                          |
| visible          | boolean          | —                                            | ✓   |                                                                                                                                                                                                        |
| onDismiss        | () => void       | —                                            | ✓   | A press outside the popover, Android back                                                                                                                                                              |
| matchAnchorWidth | boolean          | `false`                                      |     | Constrain to anchor width                                                                                                                                                                              |
| anchorPosition   | `AnchorPosition` | `{ vertical: "bottom", horizontal: "left" }` |     | Where it sits against its anchor: `vertical` `"bottom"`, `"top"` or `"center"`; `horizontal` lines up the `"left"` edges, the `"right"` edges or the `"center"`s. It flips or slides to stay on screen |

### BottomSheet

Draggable bottom sheet with scrim.

| Prop              | Type       | Default | Req | Description                                                                               |
| ----------------- | ---------- | ------- | --- | ----------------------------------------------------------------------------------------- |
| visible           | boolean    | —       | ✓   |                                                                                           |
| onClose           | () => void | —       | ✓   | The close button, a tap on the scrim, a drag down past the threshold and Android back     |
| children          | ReactNode  | —       | ✓   |                                                                                           |
| title             | string     |         |     |                                                                                           |
| showCloseButton   | boolean    | `false` |     | Adds a close button at the end of the title row                                           |
| actions           | ReactNode  |         |     | A row of buttons fixed at the bottom, below a divider, while the content above it scrolls |
| showHandle        | boolean    | `true`  |     | Drag handle                                                                               |
| dismissOnScrimTap | boolean    | `true`  |     |                                                                                           |
| maxHeightRatio    | number     | `0.85`  |     | Max height as fraction of window                                                          |

### Menu

Anchored action menu.

| Prop           | Type                     | Default                                      | Req | Description                                                                                                                          |
| -------------- | ------------------------ | -------------------------------------------- | --- | ------------------------------------------------------------------------------------------------------------------------------------ |
| anchor         | ReactElement             | —                                            | ✓   |                                                                                                                                      |
| items          | `MenuItem[]`             | —                                            | ✓   | `{ id, label, icon?, trailing?, disabled?, destructive?, dividerAbove?, onClick? }`; the item's `onClick` runs before the menu's own |
| visible        | boolean                  | —                                            | ✓   |                                                                                                                                      |
| onClose        | () => void               | —                                            | ✓   | A press outside the menu, Android back, and after an item is clicked when `closeOnSelect` is on                                      |
| closeOnSelect  | boolean                  | `true`                                       |     |                                                                                                                                      |
| anchorPosition | `AnchorPosition`         | `{ vertical: "bottom", horizontal: "left" }` |     | As `Popover`                                                                                                                         |
| dividers       | boolean                  | `false`                                      |     | A divider between every pair of items, on top of any `dividerAbove`                                                                  |
| selected       | string[]                 |                                              |     | The `id`s of the items drawn as selected: a tinted row with a check mark. Items are not marked until you pass it, even as `[]`       |
| onClick        | (item: MenuItem) => void |                                              |     | Called with the clicked item, after the item's own `onClick`                                                                         |

### Skeleton

Loading placeholder with pulse.

| Prop         | Type                           | Default | Description    |
| ------------ | ------------------------------ | ------- | -------------- |
| variant      | `"rect" \| "circle" \| "text"` | `rect`  |                |
| width        | number \| %                    |         |                |
| height       | number \| %                    |         |                |
| borderRadius | number                         |         |                |
| duration     | number (ms)                    |         | Pulse cycle    |
| animate      | boolean                        | `true`  | false = static |
| style        | ViewStyle                      |         |                |

### CircularProgress

Indeterminate spinner (SVG), or a determinate ring when `progress` is set.

| Prop               | Type                                                 | Default                                           | Description                                                                                                                                                                        |
| ------------------ | ---------------------------------------------------- | ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| progress           | number 0–1                                           |                                                   | Determinate ring over a track; unset, the indicator spins                                                                                                                          |
| size               | number                                               | `48`                                              |                                                                                                                                                                                    |
| strokeWidth        | number                                               | `4`                                               |                                                                                                                                                                                    |
| color              | string                                               | `primary`                                         | Indicator colour                                                                                                                                                                   |
| trackColor         | boolean \| string                                    |                                                   | The ring under the indicator: `true` draws it in the indicator's colour at a low opacity, a string in that colour, `false` none. Unset: a ring has its usual track, a spinner none |
| label              | ReactNode                                            |                                                   | Text, a number or any node drawn with the ring at `labelPosition`; text is scaled to the ring when inside                                                                          |
| labelPosition      | `"top" \| "bottom" \| "left" \| "right" \| "center"` | `center` with a `progress`, `right` for a spinner | Where `label` goes                                                                                                                                                                 |
| duration           | number (ms)                                          | `1000`                                            | Rotation period (indeterminate)                                                                                                                                                    |
| decorative         | boolean                                              | `false`                                           | Hidden from assistive tech                                                                                                                                                         |
| accessibilityLabel | string                                               |                                                   |                                                                                                                                                                                    |
| testID             | string                                               |                                                   |                                                                                                                                                                                    |

### LinearProgress

Determinate or indeterminate bar.

| Prop                  | Type                                                                                                                               | Default                   | Description                                                                                         |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------- | --------------------------------------------------------------------------------------------------- |
| progress              | number 0–1                                                                                                                         | `0`                       | Determinate value                                                                                   |
| indeterminate         | boolean                                                                                                                            | `false`                   |                                                                                                     |
| height                | number \| %                                                                                                                        | `4`                       | `"100%"` fills parent; `20` when the label is `inside`, which has to fit on the bar                 |
| width                 | DimensionValue                                                                                                                     | full width of the parent  | Width of the whole component, label included                                                        |
| color                 | string                                                                                                                             | `primary`                 |                                                                                                     |
| trackColor            | string                                                                                                                             | `surfaceContainerHighest` |                                                                                                     |
| label                 | ReactNode                                                                                                                          |                           | Text, a number or any node drawn with the bar at `labelPosition`                                    |
| labelPosition         | `"top-left" \| "top-center" \| "top-right" \| "left" \| "right" \| "bottom-left" \| "bottom-center" \| "bottom-right" \| "inside"` | `right`                   | `inside` centres the label on the bar, drawn in two colours so it reads over the fill and the track |
| duration              | number (ms)                                                                                                                        | `500`                     | Determinate transition                                                                              |
| indeterminateDuration | number (ms)                                                                                                                        | `1500`                    |                                                                                                     |
| decorative            | boolean                                                                                                                            | `false`                   | Hidden from a11y tree                                                                               |

The determinate bar grows with `transform: scaleX` from its leading edge (native driver).

### EmptyState

Placeholder for empty content.

| Prop        | Type                            | Default         | Req | Description |
| ----------- | ------------------------------- | --------------- | --- | ----------- |
| title       | string                          | —               | ✓   |             |
| icon        | icon                            | `inbox-outline` |     |             |
| description | string                          |                 |     |             |
| action      | `{ label, onPress, iconName? }` |                 |     | CTA button  |

### Collapse

Animates its children between `collapsedHeight` and their _measured_ natural height, so it
survives text reflow without a hardcoded height.

| Prop            | Type        | Default | Req | Description                           |
| --------------- | ----------- | ------- | --- | ------------------------------------- |
| children        | ReactNode   | —       | ✓   |                                       |
| open            | boolean     | —       | ✓   |                                       |
| duration        | number (ms) | `200`   |     |                                       |
| collapsedHeight | number      | `0`     |     | A peek/teaser height                  |
| animateOpacity  | boolean     | `true`  |     |                                       |
| keepMounted     | boolean     | `false` |     | Keep children mounted while collapsed |

### ToastProvider / useToast

Imperative toasts from anywhere in the tree — no `visible` state to thread through the screen.
Mount `ToastProvider` once above the app; the queue is FIFO and renders one `Snackbar` at a time.
`ToastProvider` takes `position` (default `"bottom-center"`), where toasts appear unless one asks
for another. `toast.success`, `.error`, `.warning` and `.info` are `show` with the `severity` set.

```tsx
const toast = useToast();
toast.success("Saved");
toast.error("Upload failed", { action: { label: "Retry", onClick: retry } });
toast.show({ id: "sync", message: "Syncing…", duration: 8000 }); // same id replaces
toast.hide(); // clears the queue
```

| `ToastOptions` | Type                                          | Default         | Description                                                                              |
| -------------- | --------------------------------------------- | --------------- | ---------------------------------------------------------------------------------------- |
| message        | string                                        | —               |                                                                                          |
| severity       | `"success" \| "info" \| "warning" \| "error"` |                 | Colours and default icon. Left out, the neutral inverse surface                          |
| variant        | `"contained" \| "outlined"`                   | `contained`     |                                                                                          |
| position       | `Snackbar`'s `position` values                | the provider's  | Where it appears                                                                         |
| duration       | number (ms)                                   | `4000`          | Not used when `onClose` is set                                                           |
| icon           | icon                                          | from `severity` |                                                                                          |
| action         | `{ label, onClick }`                          |                 | Clicking it runs `onClick` and dismisses the toast                                       |
| onClose        | () => void                                    |                 | Keeps the toast up until the user closes it, with a close button; called once it is gone |
| id             | string                                        |                 | Replaces a queued toast with the same id instead of stacking                             |

---

## 7. Navigation

### AppBar

The M3 top app bar, drawn on a `Paper`: a 64dp row, with `medium` and `large` adding a line below
it for a bigger title. On its own the screen passes `title`, `leading` and `actions`; as a
navigator's `header` it adapts to react-navigation's contract (`navigation`, `route`, `options`,
`back`, `isPinned`): it reads the title from `options`/`route`, shows a back button when there is
somewhere to go back to and a menu button for a drawer navigator, and renders `options.headerRight`.
The library itself never imports react-navigation. Pads the top safe-area inset.

| Prop                                           | Type                                         | Default | Req | Description                                                                                                                            |
| ---------------------------------------------- | -------------------------------------------- | ------- | --- | -------------------------------------------------------------------------------------------------------------------------------------- |
| title                                          | ReactNode                                    |         |     | The headline: a string is drawn in the variant's type style, any other node as is. Left out, read from `options` and `route`           |
| subtitle                                       | string                                       |         |     | A second line under the title                                                                                                          |
| variant                                        | `"small" \| "center" \| "medium" \| "large"` | `small` |     | `small` and `center` keep the title in the row; `medium` and `large` move it to a second, larger line                                  |
| leading                                        | ReactNode                                    |         |     | Before the title: typically a back or menu `IconButton`. Under a navigator it defaults to a back button, or a menu button for a drawer |
| actions                                        | ReactNode                                    |         |     | After the title: up to three action `IconButton`s per M3. Under a navigator it defaults to `options.headerRight()`                     |
| elevated                                       | boolean                                      | `false` |     | The on-scroll state: `surfaceContainer` instead of `surface`                                                                           |
| safeArea                                       | boolean                                      | `true`  |     | Pads the top safe-area inset                                                                                                           |
| divider                                        | boolean                                      |         |     | A hairline under the bar. Left out, drawn on the web when the bar sits under a navigator                                               |
| paper                                          | `Omit<PaperProps, "children">`               |         |     | Props of the `Paper` the bar is drawn on, merged over its own: `<AppBar paper={{ elevation: 3 }} />` lifts the bar to level 3          |
| navigation / route / options / back / isPinned |                                              |         |     | The navigator's header contract, structural so any navigator's object fits                                                             |
| style / testID                                 |                                              |         |     |                                                                                                                                        |

```tsx
<AppBar
  variant="center"
  title="Invoices"
  leading={
    <IconButton icon="menu" accessibilityLabel="Open menu" onClick={openMenu} />
  }
  actions={
    <IconButton icon="magnify" accessibilityLabel="Search" onClick={search} />
  }
/>
```

### NavBar

Bottom navigation bar: the destinations of a compact window, three to five per M3. It reports
presses; the app's router decides what they mean.

| Prop       | Type                     | Default  | Req | Description                                     |
| ---------- | ------------------------ | -------- | --- | ----------------------------------------------- |
| items      | `NavBarItem[]`           | —        | ✓   | `{ id, label, icon, badgeCount?, disabled? }`   |
| activeId   | string                   | —        | ✓   | `id` of the current destination                 |
| onClick    | (id) => void             | —        | ✓   | Called with the `id` of the pressed destination |
| showLabels | `"always" \| "selected"` | `always` |     |                                                 |

### NavigationRail

The side-mounted counterpart of NavBar for medium and expanded windows: same item shape (its press
callback is still `onItemPress`), labels `always`/`selected`/`none`, `header` (menu, FAB) and
`footer` slots. Props: see the API reference on its page of the docs site (generated from the source).

### Drawer / DrawerItem / DrawerSection

The M3 navigation drawer, which doubles as a side sheet: with `position`, any content as `children`
and a close button, it holds filters, details or a form on any edge of the window. `variant="static"`
is a permanent panel beside the content; `"swipeable"` slides over it on a scrim, and a drag toward
its edge, the scrim, Android back and Escape close it. A right-hand side sheet is
`<Drawer variant="swipeable" position="right">`. Presentational and navigator-agnostic.

| Prop            | Type                                     | Default                   | Req | Description                                                                                                                                                                                        |
| --------------- | ---------------------------------------- | ------------------------- | --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| variant         | `"static" \| "swipeable"`                | `static`                  |     | A permanent panel in the layout, or one that slides over the content on a scrim                                                                                                                    |
| position        | `"left" \| "right" \| "top" \| "bottom"` | `left`                    |     | The window edge. `left` and `right` are columns of `width`; `top` and `bottom` span the full width, as tall as their content up to `height`. Physical edges, not mirrored in right-to-left layouts |
| visible         | boolean                                  | `false`                   |     | Swipeable only: whether the drawer is open                                                                                                                                                         |
| onClose         | () => void                               |                           |     | The close button; for a swipeable drawer also the scrim, a closing drag, Android back and Escape (web)                                                                                             |
| elevation       | number 0–5                               | `0` static, `1` swipeable |     | The tone of the surface and, on iOS and Android, its shadow                                                                                                                                        |
| title           | string                                   |                           |     | Headline; with a close button, a back button or `actions` it is the title of a header row                                                                                                          |
| children        | ReactNode                                | —                         | ✓   | `DrawerSection`s and/or `DrawerItem`s, or any content (a form, filters, details)                                                                                                                   |
| header / footer | ReactNode                                |                           |     | Pinned above / below the scrolling items                                                                                                                                                           |
| actions         | ReactNode                                |                           |     | A row of buttons at the bottom, below a divider                                                                                                                                                    |
| showCloseButton | boolean                                  | `false`                   |     | Adds a close button to the header row, which calls `onClose`                                                                                                                                       |
| onBack          | () => void                               |                           |     | A back button before the title, for a drawer with sub-pages                                                                                                                                        |
| collapsed       | boolean                                  | `false`                   |     | Icons only, 72 wide: labels, badges, titles and sub-items are hidden                                                                                                                               |
| width           | number                                   | `360`                     |     | Left and right; capped at the window width when swipeable                                                                                                                                          |
| height          | number                                   | `360`                     |     | Top and bottom: the largest height                                                                                                                                                                 |
| style / testID  |                                          |                           |     |                                                                                                                                                                                                    |

`DrawerItem`: `label` (required), `icon`, `selected`, trailing `badge`, `onClick`, `disabled`, and
`children` (sub-items, which make it a group that the press opens and closes; `defaultExpanded`,
`onToggle`). `DrawerSection`: `title`, `children` (required), `showDivider`, and `collapsible` with
`defaultExpanded` (`true`) and `onToggle`.

```tsx
<Drawer
  variant="swipeable"
  position="right"
  visible={open}
  onClose={close}
  title="Filters"
  showCloseButton
  actions={<Button onClick={apply}>Apply</Button>}
>
  <Input label="Customer" value={customer} onChange={setCustomer} />
</Drawer>
```

### Toolbar

M3 Expressive toolbar: `docked` (full-width, bottom inset) or `floating` (pill, elevation 3,
`standard`/`vibrant`, horizontal/vertical, optional `fab`). Lays out actions; does not position
itself. Props: see the API reference on its page of the docs site (generated from the source).

### Tabs

Top tab bar with an animated indicator; text-only or icon tabs.

| Prop        | Type                      | Default    | Req | Description                                                                                                            |
| ----------- | ------------------------- | ---------- | --- | ---------------------------------------------------------------------------------------------------------------------- |
| tabs        | `string[]` \| `TabItem[]` | —          | ✓   | `{ label, icon?, key?, disabled? }`; give an icon to every tab or to none                                              |
| activeTab   | number (index)            | `0`        |     | The active tab by position; ignored when `activeKey` is given                                                          |
| activeKey   | string                    |            |     | The active tab by its `key`, for tabs that come and go                                                                 |
| onChange    | (index, key?) => void     | —          | ✓   | Called with the pressed tab's position and, when it has one, its `key`                                                 |
| variant     | `"standard" \| "rounded"` | `standard` |     | An underline under the active tab, or a pill-shaped active tab on a rounded track                                      |
| showBorders | boolean                   | `false`    |     | Dividers between the tabs and, in `rounded`, an outline around the track                                               |
| size        | `"sm" \| "md" \| "lg"`    | `md`       |     | The height and the type of the tabs                                                                                    |
| fullWidth   | boolean                   | `true`     |     | `true` shares the width equally between the tabs; `false` sizes each tab to its label, and the bar scrolls when needed |
| height      | number \| string          |            |     | Overrides the height of the bar (dp or a percentage)                                                                   |
| width       | number \| string          |            |     | Overrides the width of the bar (dp or a percentage)                                                                    |
| color       | `ColorRole`               | `primary`  |     | Colour role of the indicator and of the selected tab                                                                   |
| testID      | string                    |            |     |                                                                                                                        |

### Breadcrumbs

| Prop      | Type               | Default         | Req | Description                      |
| --------- | ------------------ | --------------- | --- | -------------------------------- |
| items     | `BreadcrumbItem[]` | —               | ✓   | `{ id, label, icon?, onPress? }` |
| separator | icon               | `chevron-right` |     |                                  |
| maxItems  | number             |                 |     | Collapse middle behind ellipsis  |

### Pagination

| Prop          | Type                      | Default   | Req | Description                                                                                                                                                                           |
| ------------- | ------------------------- | --------- | --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| activePage    | number (1-based)          | —         | ✓   | The current page                                                                                                                                                                      |
| totalPages    | number                    | —         | ✓   |                                                                                                                                                                                       |
| onChange      | (page) => void            | —         | ✓   | Called with the page the user picked: a page button, an arrow or `pageSelect`                                                                                                         |
| siblingCount  | number                    | `1`       |     | Pages each side of current                                                                                                                                                            |
| showFirstLast | boolean                   | `false`   |     | First/last arrows                                                                                                                                                                     |
| pageSelect    | boolean                   | `false`   |     | A small select after the pager that jumps to any page: it shows the active page and opens a list of pages under a search field; typing digits narrows it, Enter picks the first match |
| color         | `ColorRole`               | `primary` |     | Colour role of the selected page                                                                                                                                                      |
| variant       | `"rounded" \| "circular"` | `rounded` |     | Buttons as rounded squares, or as circles                                                                                                                                             |
| size          | `"sm" \| "md" \| "lg"`    | `md`      |     | 32 / 40 / 48 px                                                                                                                                                                       |
| disabled      | boolean                   |           |     |                                                                                                                                                                                       |

### Stepper

Progress steps, in a row or a column.

| Prop       | Type                               | Default | Req | Description                                                                                                        |
| ---------- | ---------------------------------- | ------- | --- | ------------------------------------------------------------------------------------------------------------------ |
| steps      | `string[]` \| `{ label, icon? }[]` | —       | ✓   |                                                                                                                    |
| activeStep | number (index)                     | —       | ✓   | Steps before it are completed                                                                                      |
| direction  | `"row" \| "column"`                | `row`   |     | `row` lays the steps side by side, the label under each circle; `column` stacks them, the label beside each circle |
| onClick    | (stepIndex) => void                |         |     | Called with the pressed step's position; makes the steps tappable                                                  |
| style      | object                             |         |     |                                                                                                                    |

---

## 8. Layout Primitives

Token-driven layout, so screens stop hardcoding spacing. `SpacingValue` is a `theme.spacing` key
(`"xs" | "s" | "m" | "l" | "xl"`) or a raw number, and `SpacingInput` also takes a numeric string
(`"12"`, `"12px"`); `RadiusValue` is a `theme.shape` key or a raw number; `ColorValue` is a theme
colour token or any raw colour string. `padding`, `margin` and `gap` on `Box` are numbers of px.

### Box

A `View` that reads shape and colour off the theme, with a `variant` for the usual layouts.
Anything not covered by a prop still goes through `style`. To centre children on both axes:
`<Box variant="centered-flex">`.

| Prop        | Type             | Default    | Description                                                                                         |
| ----------- | ---------------- | ---------- | --------------------------------------------------------------------------------------------------- |
| variant     | see below        | `standard` | Layout preset: direction, centring and filling the parent; the other props and `style` apply on top |
| padding     | number           |            | Padding on every edge, in px; one edge or axis goes through `style`                                 |
| margin      | number           |            | Margin on every edge, in px                                                                         |
| background  | ColorValue       |            | A theme colour token or any colour string                                                           |
| radius      | RadiusValue      |            | Corner radius                                                                                       |
| borderWidth | number           |            |                                                                                                     |
| borderColor | ColorValue       |            |                                                                                                     |
| gap         | number           |            | Space between children, in px                                                                       |
| align       | ViewStyle values |            | `alignItems`                                                                                        |
| justify     | ViewStyle values |            | `justifyContent`                                                                                    |
| width       | ViewStyle values |            |                                                                                                     |
| height      | ViewStyle values |            |                                                                                                     |
| wrap        | boolean          |            | Lets children flow onto the next line instead of overflowing                                        |
| style       | ViewStyle        |            | Merged last, over the variant and every other prop                                                  |

`variant`: `standard` (a plain column), `flex` (a row), `column-flex`, `centered-flex` (a row,
centred on both axes), `centered-column-flex`, `full-page-flex` and `full-page-column-flex` (fill
the screen: `flex: 1`, minimum height 100%), `full-size-flex` and `full-size-column` (100% wide and
high), `full-size-centered-flex` and `full-size-centered-column-flex` (the same, centred).

Extends `ViewProps`.

### Stack / HStack / VStack

Evenly spaced children via `gap`, so spacing stays correct when children are conditionally
rendered. `HStack` and `VStack` lock the axis.

| Prop      | Type                         | Default    | Description                                                                                                                          |
| --------- | ---------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| direction | `"vertical" \| "horizontal"` | `vertical` |                                                                                                                                      |
| spacing   | SpacingInput                 | `"s"`      | Space between children: a token, a number of px or a numeric string                                                                  |
| dividers  | ReactNode                    |            | `true` puts a hairline between the children (vertical in a horizontal stack); a node is used as the divider. Empty children get none |
| reverse   | boolean                      |            | Reverses visual order                                                                                                                |

Plus every `Box` prop except `variant` and `gap`, `style` included.

### Spacer

| Prop | Type                         | Default    | Description                              |
| ---- | ---------------------------- | ---------- | ---------------------------------------- |
| size | SpacingValue                 |            | Fixed gap; omit to absorb leftover space |
| axis | `"vertical" \| "horizontal"` | `vertical` | Which axis `size` applies to             |

### Grid

A 12-column responsive grid, for the container and for its items. A container lays its items out in
a wrapping row; an item's `size` is how many of the container's columns it spans, per breakpoint,
or `"grow"` / `"auto"`. The breakpoints are the M3 window size classes, mobile-first: `xs` from
0 dp, `sm` from 600, `md` from 840, `lg` from 1200, `xl` from 1600. The widths come from the
container's measured width, so it needs one from its parent. A `Grid` that is neither a container
nor inside one is a plain `View`.

| Prop      | Type                                                  | Default | Description                                                                                                                                                                                                      |
| --------- | ----------------------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| container | boolean                                               | `false` | Lays its children out in rows of `columns` columns; the items go inside it                                                                                                                                       |
| columns   | number                                                | `12`    | Columns in a row of a container                                                                                                                                                                                  |
| size      | `GridSize`                                            |         | An item's width: a number of columns, `"grow"` (share the rest of the row), `"auto"` (size to content) or one of those per breakpoint (`{ xs: 12, md: 6 }`); a missing breakpoint takes the next smaller one set |
| spacing   | `SpacingInput` \| `{ row?, column? }`                 | `"s"`   | Gap between the items of a container                                                                                                                                                                             |
| wrap      | boolean                                               | `true`  | Whether a container moves items that do not fit onto the next row                                                                                                                                                |
| autoSize  | boolean \| `GridSize` \| `(index, child) => GridSize` | `false` | Sizes the children of a container that have no `size`: `true` is `{ xs: 12, sm: 6, md: 4 }`, a size gives every child that size, a function sizes each child                                                     |
| style     | ViewStyle                                             |         |                                                                                                                                                                                                                  |

```tsx
<Grid container spacing="m">
  <Grid size={{ xs: 12, md: 6 }}>…</Grid>
  <Grid size={{ xs: 12, md: 6 }}>…</Grid>
</Grid>
```

### AspectRatio

| Prop  | Type             | Default | Description                        |
| ----- | ---------------- | ------- | ---------------------------------- |
| ratio | number           | `1`     | Width ÷ height — `16 / 9`, `4 / 3` |
| width | ViewStyle values | `100%`  |                                    |

Plus every `Box` prop except `height`.

---

## 9. Component Index

**Foundations**: Typography, Divider, Paper, Card, Card.Title/Content/Cover/Actions, Icon, TouchableRipple
**Layout**: Box, Stack/HStack/VStack, Spacer, Grid, AspectRatio
**Actions**: Button, ProgressButton, IconButton, Link, FAB, SpeedDial, ToggleButton, ToggleButtonGroup, ButtonGroup, SplitButton, Chip, ChipGroup
**Inputs**: Input, Select, Autocomplete, PinInput, Form, FormControl, HelperText, Checkbox, CheckboxGroup, RadioButton/RadioGroup, Switch, Slider, NumberField, SearchBar, DateTimePicker/DatePicker/TimePicker, Rating
**Data display**: Avatar, Badge, StatusBadge, Blink, DataGrid, Table, ListItem, ListSection/ListSubheader, Tooltip, Accordion, Carousel, Stat, CaptionValue, Image, IFrame
**Feedback & overlays**: Snackbar, ToastProvider/useToast, Banner, Dialog, ConfirmDialog, Popover, BottomSheet, Menu, Portal/Portal.Host, Skeleton, CircularProgress, LinearProgress, EmptyState, Collapse
**Navigation**: AppBar, NavBar, NavigationRail, Drawer/DrawerItem/DrawerSection, Toolbar, Tabs, Breadcrumbs, Pagination, Stepper

---

## 10. Framework Selection Notes

Requirements this kit implies for a target framework:

- **Theming**: runtime light/dark token switch, component-level theme access (context/hook or CSS vars).
- **Cross-platform** (if keeping native + web): React Native / Expo, or split web (React/Vue/Svelte) + native.
- **Animation**: springs/timing for Switch, Tabs indicator, SpeedDial, Snackbar, BottomSheet, Carousel.
- **Overlays/portals**: Dialog, Popover, Menu, BottomSheet, Drawer, Tooltip need portal/z-index layering + outside-viewport positioning.
- **Icons**: a Material Community icon set (kebab-case names, outline variants).
- **SVG**: CircularProgress uses SVG stroke animation.
- **Accessibility**: roles + states across all interactive components.

If web-only: React + a headless primitive lib (Radix/Ark) + CSS-vars theming maps cleanly.
If keeping mobile: stay on Expo React Native, or React Native Web for shared code.
