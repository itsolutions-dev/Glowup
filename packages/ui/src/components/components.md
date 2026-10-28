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
- `getGlowStyles(theme, active, variant?)` → the M3 "glow" focus ring for a control that always has a 1px border (a field): same border width idle and active, variant `"error"` for error state.
- `getFocusRing(theme, error?)` → a hover/press/focus ring that never changes layout (shadow on web and iOS, elevation on Android), for controls with no border of their own (buttons, chips, tabs).

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
- `<ThemeProvider themeScrollbars={false}>` — by default, on the web, the browser's own scrollbars are drawn from
  the theme (a thin `outline`-coloured thumb on a transparent track, `color-scheme` set to light or dark). It
  writes one `<style>` in the document head and rewrites it when the theme changes; `ScrollArea` hides its own
  native bar and is not affected. `false` leaves the browser's scrollbars alone. It does nothing on iOS and Android.

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
| variant  | alias or M3 role name (see 1.3)              | `body1`     |     | Type scale: `h1`–`h6`, `subtitle1`, `subtitle2`, `body1`, `body2`, `button`, `caption`, `overline` |
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

Hover, press and focus feedback never changes a control's layout box (border, padding, size):
the border is the same idle and hovered, and the ring is a shadow (`getFocusRing`).

`busy` is `loading` without the spinner: label, icon and full-strength colours stay on
screen. `underlay` fills the whole surface behind the content, clipped to its shape and
blind to touches — it is how `ProgressButton` draws its fill.

A `type="submit"` button follows its `Form`: it submits after `onClick`, shows `loading` while the
form submits (an async `onSubmit` or validator is running, a second press being ignored meanwhile)
and is disabled when the form is.

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

| Prop               | Type                             | Default  | Req | Description                                          |
| ------------------ | -------------------------------- | -------- | --- | ---------------------------------------------------- |
| icon               | icon                             | —        | ✓   |                                                      |
| accessibilityLabel | string                           | —        | ✓   | Required: an icon carries no accessible name         |
| onClick            | () => void                       |          |     |                                                      |
| color              | `ColorRole`                      |          |     | Same roles as `Button`; omit for the neutral M3 look |
| title              | string                           |          |     | Tooltip: hover / focus on web, long press on native  |
| size               | `"small" \| "medium" \| "large"` | `medium` |     | 32 / 40 / 48                                         |
| selected           | boolean                          |          |     | M3 toggle-icon-button state                          |
| loading            | boolean                          |          |     | Inline spinner                                       |
| disabled           | boolean                          |          |     |                                                      |
| style              | ViewStyle                        |          |     |                                                      |

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

### Clipboard

A copy trigger: an icon button that copies `value` and shows a check for a moment. The library has no
clipboard dependency, so on web it works as is (the browser's clipboard API, with
`execCommand("copy")` where that is missing) and on native the app passes a `copy` writer.

| Prop        | Type                                           | Default  | Req | Description                                                                                                                                                                                                                                   |
| ----------- | ---------------------------------------------- | -------- | --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| value       | string                                         | —        | ✓   | The text a press copies                                                                                                                                                                                                                       |
| copy        | `ClipboardWriter`                              |          |     | Writes the text. Web: defaults to `navigator.clipboard.writeText`. Native: no default; pass one, or the trigger is drawn only with an `onCopy` that does the copying, and nothing without either                                              |
| onCopy      | (value) => void                                |          |     | Called with `value` after it was copied                                                                                                                                                                                                       |
| timeout     | number (ms)                                    | `1500`   |     | How long the confirmation (the check, `copied`) shows                                                                                                                                                                                         |
| color       | `ColorRole`                                    |          |     | Colour role of the default `IconButton`; the confirmation is always `success`                                                                                                                                                                 |
| size        | `"small" \| "medium" \| "large"`               | `large`  |     | Size of the default `IconButton`: `large` is the 48 dp touch target, `small` suits a button beside a value                                                                                                                                    |
| label       | string                                         | `Copy`   |     | Accessible label of the trigger before the copy                                                                                                                                                                                               |
| copiedLabel | string                                         | `Copied` |     | Accessible label after the copy; also what a screen reader is told                                                                                                                                                                            |
| disabled    | boolean                                        |          |     |                                                                                                                                                                                                                                               |
| children    | ReactNode \| `({ copied, copy }) => ReactNode` |          |     | Your own trigger. A node is the content of a pressable (a button inside it would nest buttons: use the function form for that); a function gets `{ copied, copy }`, `copy` copying `value`, and is drawn as returned, the trigger being yours |
| style       | ViewStyle                                      |          |     | Style of the trigger                                                                                                                                                                                                                          |
| testID      | string                                         |          |     |                                                                                                                                                                                                                                               |

`ClipboardWriter` is `(text: string) => void | Promise<unknown>`: resolve once the text is written,
throw or reject when it could not be. What it resolves to is ignored, so `setStringAsync` from
`expo-clipboard`, which resolves a boolean, goes in as it is. On native, with neither a `copy` writer
nor an `onCopy`, there is nothing to copy with and the trigger draws nothing; with only an `onCopy` it
is drawn, and the app does the copying.

```tsx
<Clipboard value={apiKey} copy={setStringAsync} />

<Clipboard value={apiKey} copy={setStringAsync}>
  {({ copied, copy }) => (
    <Button variant="tonal" onClick={copy}>
      {copied ? "Copied" : "Copy key"}
    </Button>
  )}
</Clipboard>
```

#### useClipboard

The hook behind it, for a trigger of your own: `const { copy, copied } = useClipboard(options)`.

| Option       | Type              | Default  | Description                                                             |
| ------------ | ----------------- | -------- | ----------------------------------------------------------------------- |
| timeout      | number (ms)       | `1500`   | How long `copied` stays true after a copy                               |
| copy         | `ClipboardWriter` |          | As on `Clipboard`: the browser's clipboard on web, no default on native |
| onCopy       | (text) => void    |          | Called with the text after it was copied                                |
| announcement | string            | `Copied` | What a screen reader is told after a copy; `""` says nothing            |

`copy(text)` resolves `true` once the text is copied (or, with no way to write, handed to `onCopy`)
and `false` when the write was refused or there was nothing to copy with. `copied` is true for
`timeout` ms after a copy: swap an icon or a label on it.

```tsx
const { copy, copied } = useClipboard({ copy: setStringAsync });

<Button onClick={() => copy(invite)}>{copied ? "Copied" : "Copy link"}</Button>;
```

### Download

A button that saves a file: the `data` you hold (text, an object as JSON, a `Blob`) or the file at a
`url`. On web it just works (a temporary `<a download>` link). On native text and links go to the
system share sheet, and a `save` writer (`expo-file-system` with `expo-sharing`) saves real files and
`Blob`s.

| Prop       | Type                                                    | Default                             | Description                                                                                                                                                                                                                                |
| ---------- | ------------------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| data       | string \| object \| `Blob`                              |                                     | The content: a string is saved as text, an object as JSON, a `Blob` as any binary file. Wins over `url` when both are given                                                                                                                |
| url        | string                                                  |                                     | A file to fetch. Web: fetched into a `Blob` first, as browsers ignore `download` on a cross-origin link. Native: not fetched; the `save` writer gets it as `file.url`, and without a writer it is shared as a link                         |
| filename   | string                                                  | last part of `url`, else `download` | The saved file's name (`download.txt` for a string, `download.json` for an object)                                                                                                                                                         |
| mimeType   | string                                                  | from `filename`'s extension         | Else `application/json` for an object, `text/plain` for a string, the `Blob`'s or the response's own type                                                                                                                                  |
| save       | `DownloadSaver`                                         |                                     | Saves the file: `(file) => void \| Promise<void>`, throwing or rejecting when it could not. Web default: the `<a download>` link. Native default: the share sheet with the text or the link; pass one to write real files and for a `Blob` |
| onDownload | (file) => void                                          |                                     | Called with the file (`{ name, mimeType, data?, url? }`) after it was saved                                                                                                                                                                |
| onError    | (error) => void                                         |                                     | Called when fetching or saving failed                                                                                                                                                                                                      |
| children   | ReactNode \| `({ download, downloading }) => ReactNode` | `Download`                          | The button's label. A function draws your own trigger instead: `download` saves this file, and what it returns is drawn as is                                                                                                              |
| icon       | icon                                                    | `download`                          | The button's icon                                                                                                                                                                                                                          |
| variant    | `"filled" \| "tonal" \| "outlined" \| "text"`           | `filled`                            | The button's variant                                                                                                                                                                                                                       |
| color      | `ColorRole`                                             | `primary`                           | The button's colour role                                                                                                                                                                                                                   |
| disabled   | boolean                                                 |                                     |                                                                                                                                                                                                                                            |
| style      | ViewStyle                                               |                                     | Style of the button                                                                                                                                                                                                                        |
| testID     | string                                                  |                                     |                                                                                                                                                                                                                                            |

The button is a `Button`, with `loading` while the file is fetched and saved. A `Blob` on native with no
`save` writer fails (there is nothing to share), reported to `onError`.

```tsx
<Download data={rows} filename="rows.json">
  Export rows
</Download>
<Download url="https://example.com/report.pdf" variant="tonal" />
```

#### useDownload

For a trigger of your own: `const { download, downloading, error } = useDownload({ save, onDownload, onError })`.
`download({ data, url, filename, mimeType })` takes what the props above describe and resolves `true`
once the file is saved, `false` if it failed; `downloading` is true meanwhile, and `error` is why the
last one failed (cleared by the next).

```tsx
const { download, downloading } = useDownload();

<Button
  loading={downloading}
  onClick={() => download({ data: csv, filename: "rows.csv" })}
>
  Export CSV
</Button>;
```

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

Single-line text field, outlined or filled; supports affixes, icons, number mode. Multi-line text is `InputArea`.

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
| onTrailingIconPress        | () => void               |            |     | A bare, unlabelled icon: use `endAdornment` for a real control                                          |
| endAdornment               | ReactNode                |            |     | Any element at the end of the field, after `suffix` or `trailingIcon`: an `IconButton`, a spinner       |
| inputProps                 | `InputTextInputProps`    |            |     | `TextInput` hints and handlers: `autoComplete`, `autoFocus`, `onKeyPress`, `testID`… (see below)        |
| inputRef                   | `Ref<TextInput>`         |            |     | A ref to the underlying `TextInput`, to focus it or select its text                                     |
| error                      | string                   |            |     | Error message + error styling                                                                           |
| helperText                 | string                   |            |     | Hidden while error shown                                                                                |
| required                   | boolean                  |            |     | Asterisk on label                                                                                       |
| disabled                   | boolean                  |            |     |                                                                                                         |
| readonly                   | boolean                  |            |     |                                                                                                         |
| secureTextEntry            | boolean                  |            |     | Password mode: hides the text, and keeps it out of `accessibilityValue`                                 |
| maxLength                  | number                   |            |     |                                                                                                         |
| minHeight                  | number                   | `56`       |     |                                                                                                         |
| onFocus / onBlur           | () => void               |            |     |                                                                                                         |
| style                      | ViewStyle                |            |     |                                                                                                         |

`endAdornment` is not clipped by the field and takes its own touches, so it holds a real control: an
`IconButton` with its own accessible name, a spinner, a unit picker. `inputProps` hands the underlying
`TextInput` its `autoComplete`, `textContentType`, `autoCorrect`, `autoCapitalize`, `spellCheck`,
`autoFocus`, `selectTextOnFocus`, `returnKeyType`, `enterKeyHint`, `onSubmitEditing`, `onKeyPress`,
`accessibilityLabel`, `accessibilityValue` (those two replace the ones drawn from `label` and `value`)
and `testID`; the props `Input` controls itself (`value`, `editable`, `secureTextEntry`) stay with its
own.

### InputArea

Multi-line text field: `Input`'s box, label, helper and error, for text that wraps over several lines. `rows` gives
it a fixed height; `minRows` and `maxRows` let it grow with its text.

| Prop                       | Type                     | Default    | Req | Description                                                                                         |
| -------------------------- | ------------------------ | ---------- | --- | --------------------------------------------------------------------------------------------------- |
| value                      | string                   | —          | ✓   |                                                                                                     |
| onChange                   | (text) => void           | —          | ✓   |                                                                                                     |
| label                      | string                   |            |     |                                                                                                     |
| placeholder                | string                   |            |     |                                                                                                     |
| rows                       | number                   | 4 lines    |     | Fixed height of exactly that many lines; the text scrolls inside. Wins over `minRows` / `maxRows`   |
| minRows                    | number                   | 1          |     | Without `rows`: starts this many lines tall and grows with its text                                 |
| maxRows                    | number                   | unbounded  |     | Without `rows`: the most lines it grows to, then the text scrolls. Raised to `minRows` when smaller |
| variant                    | `"outlined" \| "filled"` | `outlined` |     | The look of the box, as `Input`                                                                     |
| labelPlacement             | `"inside" \| "outside"`  | `outside`  |     | As `Input`                                                                                          |
| fullWidth                  | boolean                  | `true`     |     | `false` shrinks the field to its content                                                            |
| density                    | `"normal" \| "dense"`    | `normal`   |     | 14 px text and less padding when dense                                                              |
| leadingIcon / trailingIcon | icon                     |            |     |                                                                                                     |
| onTrailingIconPress        | () => void               |            |     | A bare, unlabelled icon                                                                             |
| inputProps                 | `InputTextInputProps`    |            |     | `TextInput` hints and handlers, as `Input`                                                          |
| inputRef                   | `Ref<TextInput>`         |            |     | A ref to the underlying `TextInput`                                                                 |
| error                      | string                   |            |     | Error message + error styling                                                                       |
| helperText                 | string                   |            |     | Hidden while error shown                                                                            |
| reserveHelperText          | boolean                  | `false`    |     | Keeps the line under the field                                                                      |
| required                   | boolean                  |            |     | Asterisk on label                                                                                   |
| disabled / readonly        | boolean                  |            |     |                                                                                                     |
| maxLength                  | number                   |            |     |                                                                                                     |
| onFocus / onBlur           | () => void               |            |     |                                                                                                     |
| style                      | ViewStyle                |            |     |                                                                                                     |

**Rows.** `rows` given: exactly that tall, whatever the text. `minRows` and `maxRows`: it starts at `minRows` and
grows up to `maxRows`, then scrolls. `minRows` alone grows without limit; `maxRows` alone starts at one line. None
of the three: 4 lines, fixed. The height follows the text and shrinks when text is deleted; only the height
changes, never the width. It is measured with `onContentSizeChange` on a phone and from the textarea itself on the
web.

```tsx
<InputArea label="Message" rows={4} value={text} onChange={setText} />
<InputArea label="Comment" minRows={2} maxRows={8} value={text} onChange={setText} />
```

### PasswordField

An `Input` for a password: the text is hidden, a labelled eye button at the end of the field shows and
hides it, the autofill and keyboard hints a password manager needs are set, and a strength meter is
optional. It takes every `Input` prop except the ones it sets itself (`secureTextEntry`, `type`,
`precision`, `decimalSeparator`, `allUpperCase`, `trailingIcon`,
`onTrailingIconPress`, `endAdornment`).

| Prop            | Type                                   | Default                                           | Description                                                                                                                                         |
| --------------- | -------------------------------------- | ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| showToggle      | boolean                                | `true`                                            | The eye button that reveals and hides the text; turn it off for a field that must never be revealed                                                 |
| defaultVisible  | boolean                                | `false`                                           | Whether the text starts revealed (uncontrolled)                                                                                                     |
| visible         | boolean                                |                                                   | Controls whether the text is revealed; pair with `onVisibleChange`                                                                                  |
| onVisibleChange | (visible) => void                      |                                                   | Called with the new state when the eye button is pressed                                                                                            |
| toggleLabels    | `{ show?, hide? }`                     | `Show password` / `Hide password`                 | The accessible names of the eye button                                                                                                              |
| showStrength    | boolean                                | `false`                                           | A strength meter under the field once something is typed, scored by `passwordStrength`: for a field that creates a password, not one that enters it |
| strengthLabels  | `string[]`                             | `["Very weak", "Weak", "Fair", "Good", "Strong"]` | The words of the meter, from very weak (index 0) to strong (index 4)                                                                                |
| autoComplete    | `"current-password" \| "new-password"` | `current-password`                                | What the platform's password manager does: fill the saved password, or offer to generate and save a new one (it also sets `textContentType`)        |

- The value is never put in an accessibility prop, revealed or hidden. Correction, capitalisation and
  spell-check are off; `inputProps` still wins over these hints.
- The meter is one `status` live region, there before it has anything to say, so a screen reader hears
  the word change as the score does; the bar itself is decorative. Its colour follows the score: `error`
  for 0 and 1, `warning` for 2, `info` for 3, `success` for 4.
- `passwordStrength(value)` is exported: a rough score from `0` (very weak) to `4` (strong), typed
  `PasswordStrength`. A hint to show beside the field, not a security check: the server decides what it
  accepts. One point each for 8 or more characters, 12 or more, at least two character classes (lower
  case, upper case, digit, other) and at least three. The score is capped at 1 under 6 characters, for
  one repeated character, for digits only, and for a handful of the most common passwords (trailing
  digits and `!` are dropped before matching, so `Password123!` counts as `password`). An empty string
  is `0`. It knows no dictionary beyond that handful: use a real estimator (zxcvbn) where it matters.

```tsx
<PasswordField label="Password" value={pw} onChange={setPw} />
<PasswordField
  label="New password"
  value={pw}
  onChange={setPw}
  autoComplete="new-password"
  showStrength
/>
```

### Editable

Text that edits in place. It reads as text, with a pencil that shows on hover or focus (always drawn on
touch); a click, tap, Enter or Space opens the library's own field, Enter or blur keeps the change and
Escape drops it.

| Prop              | Type                                           | Default     | Description                                                                                                                                                                                |
| ----------------- | ---------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| value             | string                                         |             | The value, as text (for `type="number"` too: `"12.50"`, as `Input` has it). Controlled; pair with `onChange`                                                                               |
| defaultValue      | string                                         | `""`        | The value to start from when uncontrolled                                                                                                                                                  |
| onChange          | (value) => void                                |             | Called with the text on every edit while the field is open; on a cancel, once more with the value the edit started from                                                                    |
| onSubmit          | (value) => void                                |             | Called with the value when the edit is confirmed (Enter, blur or the check button, per `submitMode`)                                                                                       |
| onCancel          | (previous) => void                             |             | Called with the value the edit started from when it is cancelled (Escape or the close button)                                                                                              |
| type              | `"text" \| "textarea" \| "number" \| "select"` | `text`      | The field that opens: an `Input`, an `InputArea`, an `Input type="number"` or a `Select`                                                                                                   |
| options           | `Option[]`                                     |             | The choices of `type="select"`; the display shows the label of the selected one                                                                                                            |
| submitMode        | `"blur" \| "enter" \| "both" \| "none"`        | `both`      | What confirms the edit: focus leaving the field, Enter, either, or (`none`) the check and close buttons. Escape cancels in every mode                                                      |
| showControls      | boolean                                        | `false`     | The check and close buttons whatever the `submitMode`; with them shown, leaving the field no longer confirms                                                                               |
| placeholder       | string                                         | `Edit`      | Drawn in the muted tone when the value is empty                                                                                                                                            |
| validate          | (value) => string \| undefined                 |             | Returns the message to show as the field's error, or `undefined`. While there is an error the edit cannot be confirmed                                                                     |
| selectAllOnFocus  | boolean                                        | `false`     | Selects the whole text when the field opens, to type over it                                                                                                                               |
| startWithEditView | boolean                                        | `false`     | Mounts with the field already open (uncontrolled)                                                                                                                                          |
| editing           | boolean                                        |             | Controls whether the field is open; pair with `onEditingChange`                                                                                                                            |
| onEditingChange   | (editing) => void                              |             | Called with the new state when the edit starts, is confirmed or is cancelled                                                                                                               |
| disabled          | boolean                                        | `false`     | Dims the text and keeps it from opening                                                                                                                                                    |
| readOnly          | boolean                                        | `false`     | Shows the text as plain text, with no way to open it                                                                                                                                       |
| variant           | `"outlined" \| "filled"`                       | `outlined`  | The look of the open field, as `Input`                                                                                                                                                     |
| size              | `"small" \| "medium" \| "large"`               | `medium`    | The size of the text, the pencil and the open field (`small` is dense)                                                                                                                     |
| textVariant       | typography variant                             | from `size` | The type-scale role of the displayed text                                                                                                                                                  |
| renderDisplay     | (value) => ReactNode                           |             | Draws the displayed value your way (a link, a badge, a formatted amount) instead of as text                                                                                                |
| label             | string                                         |             | The accessible name of the display button and of the open field; not drawn                                                                                                                 |
| precision         | number                                         |             | For `type="number"`: the decimals the field keeps                                                                                                                                          |
| fullWidth         | boolean                                        | `false`     | Display and open field fill the container. Off, the open field takes exactly the width the text had (at least 120 px) so opening it moves nothing; a textarea keeps it and grows in height |
| testID            | string                                         |             | The open field gets `${testID}-input`, the buttons `${testID}-save` and `${testID}-cancel`                                                                                                 |

- `textarea` adds a line on Enter; Ctrl or Cmd + Enter confirms. `select` shows its dropdown already
  open and confirms on the pick; Escape cancels it too.
- An error from `validate` shows once the value is touched, or when a confirm is tried on an untouched
  invalid value.
- Accessibility: the display is a button named `"{label}: {text}"` with the hint "Edit"; after a
  keyboard confirm or cancel, focus goes back to it (web).

```tsx
<Editable label="Name" value={name} onChange={setName} onSubmit={save} />
<Editable
  type="select"
  label="Role"
  options={roles}
  value={role}
  onChange={setRole}
/>
```

### Select

Dropdown built on Popover; single or multi select, optional chip display.

| Prop                | Type                               | Default            | Req | Description                                                                                 |
| ------------------- | ---------------------------------- | ------------------ | --- | ------------------------------------------------------------------------------------------- |
| options             | `Option[]`                         | —                  | ✓   | `{ id, label, value, icon? }`                                                               |
| value               | any                                | —                  |     | Selected value, `null` for none; with `multiple`, the array of selected `value`s            |
| onChange            | (value) => void                    | —                  |     | The picked `value`, `null` when cleared; with `multiple`, the new array on every toggle     |
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
| multiple            | boolean                            | `false`            |     | `value` and `onChange` then carry arrays                                                    |
| showAsChips         | boolean                            | `false`            |     | Render selection as chips                                                                   |
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

The thumb is sized and placed from the track (inside its border), so it stays within it at both ends.

### Slider

| Prop              | Type            | Default | Req      | Description                                    |
| ----------------- | --------------- | ------- | -------- | ---------------------------------------------- |
| value             | number          | —       | ✓        |                                                |
| onValueChange     | (value) => void | —       | ✓        |                                                |
| onSlidingComplete | (value) => void |         |          |                                                |
| min               | number          | `0`     |          |                                                |
| max               | number          | `100`   |          |                                                |
| step              | number          |         |          | 0/undefined = continuous                       |
| label             | string          |         |          |                                                |
| showValueLabel    | boolean         |         |          |                                                |
| marks             | boolean         |         |          | Ticks at each step (needs step)                |
| interaction       | `"both"         | "drag"  | "click"` | `both`                                         |     | What a pointer may do: drag the thumb, jump to the pressed point, or both |
| disabled          | boolean         |         |          | Blocks pointer, keyboard and assistive actions |
| style             | ViewStyle       |         |          |                                                |

On the web the slider is focusable (`role="slider"`, `aria-valuenow/min/max`): arrows step,
Page Up / Down move ten steps, Home / End go to the ends, whatever `interaction` is. On native
it is `adjustable` with increment / decrement actions.

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

| Prop                | Type                                       | Default       | Req | Description                                                                                                                                                                                                            |
| ------------------- | ------------------------------------------ | ------------- | --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| value               | `Date \| null` · `DateRange` · `Date[]`    | —             | ✓   | Shape follows `selectionMode`                                                                                                                                                                                          |
| onChange            | matching setter                            | —             | ✓   | Single mode is never called with `null`; clearing goes to `onClear`                                                                                                                                                    |
| variant             | `"default" \| "static"`                    | `default`     |     | `static` draws the picker inline: see below                                                                                                                                                                            |
| presentation        | `"auto" \| "popover" \| "dialog"`          | `auto`        |     | Web only: docked to the field, or a centred dialog. `auto` picks the dialog on a touch device or under 600 px                                                                                                          |
| fieldVariant        | `"outlined" \| "filled"`                   | `outlined`    |     | The look of the field's box, as `variant` on `Input` (`variant` here is default or static)                                                                                                                             |
| label               | string                                     |               |     | Also labels the typed-entry field inside the dialog                                                                                                                                                                    |
| mode                | `"date" \| "datetime" \| "time"`           | `date`        |     | `datetime` collects the day, then the time                                                                                                                                                                             |
| selectionMode       | `"single" \| "range" \| "multiple"`        | `single`      |     | Ignored when `mode="time"`                                                                                                                                                                                             |
| validRange          | `{ startDate?, endDate?, disabledDates? }` |               |     | Inclusive bounds compared at day granularity                                                                                                                                                                           |
| isDateDisabled      | (date) => boolean                          |               |     | For rules `validRange` cannot express                                                                                                                                                                                  |
| scrollMode          | `"endless" \| "paged"`                     | `endless`     |     | `endless` virtualizes the months in one list                                                                                                                                                                           |
| inputEnabled        | boolean                                    | `true`        |     | Typed entry in the field (a single calendar date)                                                                                                                                                                      |
| defaultInputType    | `"picker" \| "keyboard"`                   | `picker`      |     | Which surface the dialog opens on; no toggle once it is open                                                                                                                                                           |
| showToday           | boolean                                    | `true`        |     | "Today" button in the calendar header (single dates only)                                                                                                                                                              |
| showOkButton        | boolean                                    | `true`        |     | Draws OK in the popup. `false`: a time closes and sets after its minute (date-time: day, hour, minute), a range after its second end. No effect on `multiple` (needs OK), typed entry (keeps OK) or `variant="static"` |
| use24HourClock      | boolean                                    | locale's own  |     | `true` forces the 24-hour dial                                                                                                                                                                                         |
| minuteInterval      | `1\|2\|3\|4\|5\|6\|10\|12\|15\|20\|30`     | `1`           |     | Granularity the dial snaps to                                                                                                                                                                                          |
| startYear / endYear | number                                     | ±100 years    |     | Bounds of the year grid and the endless scroller                                                                                                                                                                       |
| placeholder         | string                                     |               |     | Shown while the value is empty                                                                                                                                                                                         |
| clearable           | boolean                                    |               |     | Adds a clear button; needs `onClear`                                                                                                                                                                                   |
| onClear             | () => void                                 |               |     |                                                                                                                                                                                                                        |
| error               | string                                     |               |     | Error text; also recolors the field                                                                                                                                                                                    |
| helperText          | string                                     |               |     | Hidden while `error` is set                                                                                                                                                                                            |
| required            | boolean                                    |               |     | Appends `*` to the label                                                                                                                                                                                               |
| locale              | string                                     | device locale |     | Formatting/labelling override                                                                                                                                                                                          |
| firstDayOfWeek      | 0–6 (0 = Sunday)                           | locale's own  |     |                                                                                                                                                                                                                        |
| labels              | `DateTimePickerLabels`                     | English       |     | Chrome strings (`selectDate`, `confirm`, `back`, …)                                                                                                                                                                    |
| relativeLabels      | `{ today?, yesterday?, tomorrow? }`        | `Intl`        |     |                                                                                                                                                                                                                        |
| defaultOpen         | boolean                                    | `false`       |     | Mount with the picker open                                                                                                                                                                                             |
| disabled            | boolean                                    |               |     |                                                                                                                                                                                                                        |
| style               | ViewStyle                                  |               |     |                                                                                                                                                                                                                        |
| testID              | string                                     |               |     |                                                                                                                                                                                                                        |

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

### Upload

Selecting files and, with an `onUpload`, uploading them with a progress bar, retry and cancel per file.
On web it is a drop target and a file dialog. On native the library has no picker, so the app passes
`onPick`. The file list is kept by the component, or controlled with `value` and `onChange`.

| Prop         | Type                                              | Default     | Description                                                                                                                                                                                                                   |
| ------------ | ------------------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| value        | `UploadFile[]`                                    |             | The files in the list. Give it with `onChange` to control the list                                                                                                                                                            |
| defaultValue | `UploadFile[]`                                    |             | The files the list starts with, when it is not controlled                                                                                                                                                                     |
| onChange     | (files) => void                                   |             | Called with the whole list whenever it changes: files added or removed, a status or a progress moved                                                                                                                          |
| accept       | string                                            |             | What may be picked, written like the `accept` of an `<input type="file">` (`"image/*,.pdf"`). It filters the web file dialog and is checked on every file added, on every platform (a drop, or what `onPick` returns)         |
| multiple     | boolean                                           | `false`     | Allows several files. Without it a new file replaces the one in the list                                                                                                                                                      |
| maxSize      | number                                            |             | The largest file, in bytes: a bigger one is rejected                                                                                                                                                                          |
| maxFiles     | number                                            |             | How many files the list may hold with `multiple`: the ones past it are rejected                                                                                                                                               |
| disabled     | boolean                                           | `false`     |                                                                                                                                                                                                                               |
| variant      | `"dropzone" \| "button"`                          | `dropzone`  | A dashed area to drop files on or press, or a plain button (a drop on it still works on web)                                                                                                                                  |
| onUpload     | `(file, { onProgress, signal }) => Promise<void>` |             | Uploads each new file; see below. Without it files are only collected, as `"pending"`, for you to send with a form                                                                                                            |
| onReject     | (rejections) => void                              |             | Called with the files that were not added (too large, wrong type, past `maxFiles`). Without it the reasons are shown under the field                                                                                          |
| onPick       | `() => Promise<PickedFile[]>`                     |             | The native adapter: opens a picker and resolves the files chosen (an empty list for none). The app wires `@its/glowup-device/media-picker` or a document picker here. On web it replaces the browser's file dialog when given |
| label        | string                                            |             | A label above the field                                                                                                                                                                                                       |
| prompt       | string                                            | per variant | What the dropzone or the button says: "Drag files here or click to browse" in a web dropzone, else "Choose files" ("Choose a file" without `multiple`)                                                                        |
| helperText   | string                                            |             | Supporting text below the field; hidden while an error is shown                                                                                                                                                               |
| error        | string                                            |             | An error message under the field, in the error colour. A non-empty one replaces the rejection messages                                                                                                                        |
| style        | ViewStyle                                         |             |                                                                                                                                                                                                                               |
| testID       | string                                            |             | The trigger gets `${testID}-trigger`, the web file input `${testID}-input`                                                                                                                                                    |

- **No picker on native.** Without `onPick`, native draws no way to add files: nothing at all, or only
  the list when it holds files.
- **`onUpload`** gets the file and `{ onProgress, signal }`: report `onProgress(0..1)` as it goes and
  stop on `signal`, which is aborted when the user cancels or removes the file or the `Upload`
  unmounts. Resolve when it is done, reject when it failed. The file is listed as `"uploading"` with
  its progress, then `"done"`, or `"error"` with the rejection's message and a retry button. Every new
  file starts at once: there is no queue.
- **Validation.** Each file is checked for its type, then its size, then for room in the list. The
  rejected ones are reported to `onReject`, or shown under the field as one sentence per reason.
- **Accessibility.** The dropzone is a button named by its prompt and hinted with the limits; each
  file's status line is a polite live region (a failed upload's an alert), and the remove, cancel and
  retry buttons are named after the file.

`UploadFile` is `{ id, name, size, type, uri?, file?, status, progress?, error? }`: `size` in bytes,
`uri` where a picked file lives on native, `file` the browser's `File` (what you put in a `FormData`),
`status` one of `"pending" | "uploading" | "done" | "error"`, `progress` from 0 to 1 while uploading.
`PickedFile` is the same with `id` and `status` optional: `Upload` fills in a fresh id and `"pending"`.

Exported with it, for your own screen or a server check:

| Export                                                       | Description                                                                                                                                                                                              |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `formatBytes(bytes, decimals = 1)`                           | A size as people read it, in powers of 1024: `formatBytes(1536)` is `"1.5 KB"`. Whole bytes stay whole; a negative or non-numeric size is `"0 B"`                                                        |
| `acceptMatches(file, accept?)`                               | Whether `{ name, type }` passes an `accept` filter (a comma-separated string or an array of extensions, media types and `image/*` wildcards); case-insensitive; no filter accepts everything             |
| `validateFiles(files, { accept, maxSize, maxFiles, count })` | Splits files into `{ accepted, rejected }`; each rejection is `{ file, reason, message }` with `reason` `"wrong-type"`, `"too-large"` or `"too-many"` (`count` is how many files the list already holds) |

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

Groups fields and a submit button so that one action submits them, and keeps their values, errors and
flags in a store outside React state: typing in one `FormField` re-renders that field alone, not the
form or its siblings. On the web it is a real `<form>`: Enter in a field submits, and a
`Button type="submit"` inside it submits too. On iOS and Android it is a plain `View` and the submit
button calls `onSubmit` directly. Either way `onSubmit` runs once per submission, and the page is never
navigated. A `Dialog` with `form` wraps its body and `actions` in one.

| Prop           | Type                             | Default  | Req | Description                                                                                                                                                                                                                                   |
| -------------- | -------------------------------- | -------- | --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| onSubmit       | (values) => void                 |          |     | Called with the values when a `Button type="submit"` is pressed or (web) Enter is pressed in a field, and every field passes its rules. May be async; a form with no `FormField` calls it with `{}`                                           |
| onSubmitFailed | (errors, values) => void         |          |     | Called instead of `onSubmit` when a field fails its rules: the messages by field name, and the values                                                                                                                                         |
| initialValues  | `FormValues`                     |          |     | Where the fields start, nested like the names: `{ email: "", address: { city: "" } }`. Read on mount; `form.reset(values)` starts over. A field with none has the value `undefined`                                                           |
| onValuesChange | (changed, all) => void           |          |     | After a value changes (a user edit, `setValue`, `setValues`; not `reset`): just what changed, nested like the values (`{ address: { city: "Rome" } }`), and all of them                                                                       |
| validateOn     | `"change" \| "blur" \| "submit"` | `change` |     | When a field is validated: after every edit, when it is left, or only on submit. After a submit, or once a field shows an error, an edit validates it again whatever the mode, so a fixed field clears at once. A `FormField` can override it |
| disabled       | boolean                          | `false`  |     | Disables every `FormField` and the form's submit buttons                                                                                                                                                                                      |
| form           | `FormInstance`                   |          |     | The instance from `useForm()`, to read and drive the form from outside it. Without it the form keeps its own, reached by the hooks inside                                                                                                     |
| children       | ReactNode                        |          |     |                                                                                                                                                                                                                                               |
| style          | ViewStyle                        |          |     |                                                                                                                                                                                                                                               |
| testID         | string                           |          |     |                                                                                                                                                                                                                                               |

A `Form` without fields is the plain wrapper it always was, for fields whose state the parent holds:

```tsx
<Form onSubmit={save}>
  <Input label="Name" value={name} onChange={setName} />
  <Button type="submit">Save</Button>
</Form>
```

With `FormField` the form holds the state and validates it:

```tsx
<Form initialValues={{ email: "" }} onSubmit={(values) => save(values)}>
  <FormField
    name="email"
    label="Email"
    rules={[{ required: true }, { type: "email" }]}
  >
    {(field) => <Input {...field} />}
  </FormField>
  <Button type="submit">Save</Button>
</Form>
```

**Submitting.** A press (or Enter) marks every field touched, validates them all (waiting for async
validators), then calls `onSubmit(values)` or, when a field failed, `onSubmitFailed(errors, values)`.
When nothing is async, `onSubmit` runs inside the press itself, so a handler that needs the user's click
(a popup, a download) still has it. `onSubmit` may be async: the form is submitting until it settles
(as it is while an async validator runs), a second submission is ignored meanwhile, and a
`Button type="submit"` shows `loading`.

**Validation.** Each field's `rules` are checked in order and the first failure is its `error`; the
form's `validateOn` says when (a field can override it), and a field's `dependencies` revalidate it when
another changes. An async `validator` shows `validating` on its field; typing again aborts the stale run
(its `signal`) and drops its result, so only the latest text counts.

#### useForm and FormInstance

`const form = useForm(initialValues?)` creates a form instance that lives as long as the component and
never re-renders it: read values with `useWatch`, state with `useFormState`. Pass it to `<Form form={form}>`
to read and drive the form from outside it; without one, the hooks inside a `Form` reach its own.

```tsx
const form = useForm({ email: "" });

<Form form={form} onSubmit={save}>
  …
</Form>
<Button variant="text" onClick={() => form.reset()}>
  Reset
</Button>
```

| `FormInstance`                                     | Description                                                                                                                                                            |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| getValues() / getValue(name)                       | All values (the same object until one changes), or one by name: `"email"`, `"address.city"`, `"items[0].qty"`                                                          |
| setValue(name, value)                              | Sets one value; validated like a user edit                                                                                                                             |
| setValues(values)                                  | Merges over the current ones (nested objects merge, arrays and other values replace); fields update and `onValuesChange` runs once                                     |
| reset(values?)                                     | Back to the initial values, or to `values`, which then become the initial ones; no errors, nothing touched, the submit count at 0                                      |
| validate(names?)                                   | Runs the rules of the registered fields, all or those named (a name also covers the fields under it); resolves to whether every one passed. Waits for async validators |
| submit()                                           | The submit above; resolves to whether it submitted. Ignored (`false`) while a submission is still running                                                              |
| isDirty(name?) / isTouched(name?) / isSubmitting() | The form's flags, or one field's                                                                                                                                       |
| getFieldState(name)                                | `{ value, error, touched, dirty, validating }` of one field                                                                                                            |
| getError(name) / getErrors()                       | The error messages: one field's, or all by field name                                                                                                                  |
| setError(name, message)                            | Sets, or with `undefined` clears, a field's error: a server-side one, say                                                                                              |
| subscribe(listener) / subscribe(name, listener)    | Calls `listener` after any change, or after a change to `name` (and the names above and under it); returns the unsubscribe function                                    |

A field is `dirty` when its value differs from its initial one, where `""`, `null` and `undefined` count
as the same: typing into a field and clearing it is not dirty. `touched` is set when the field is left or
the form is submitted.

#### useWatch

`useWatch("address.city")` is the value of that field; `useWatch(["a", "b"])` an array of values;
`useWatch()` all of them. The component re-renders only when what it watches changes. Outside a `Form`,
pass the instance as the second argument: `useWatch("email", form)`.

#### useFormState

`useFormState(form?)` is the form's flags, for a reset button, a summary or a custom submit button:
`{ isDirty, isSubmitting, isValidating, submitCount, errors }`.

`FormField`, `useWatch`, `useFormState` and `useFormField` need a `Form` around them, or the `form` from
`useForm()`; without either they throw. The types are exported too: `FormValues`, `FormErrors`,
`FormValidateOn`, `FormRule`, `FormValidatorContext`, `FormState`, `FormFieldState`, `FormFieldApi`,
`FormFieldProps`, `FormFieldChildProps`, `UseFormFieldOptions`, `DeepPartial` and `FormInstance`.

### FormField

Connects the single control inside it to a field of the surrounding `Form`. It hands the control the
field's `value`, the callback that reports a new one, `onBlur`, `error` (the message), `required`
(when a rule is `required`) and `disabled`, plus the `label` and `helperText` it was given; the control's
own props stay, and its own handlers still run. Nothing else re-renders when the field changes.

| Prop              | Type                                    | Default    | Req | Description                                                                                                                                                                                                                               |
| ----------------- | --------------------------------------- | ---------- | --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| name              | string                                  | —          | ✓   | The field's name in the form's values: `"email"`, `"address.city"`, `"items[0].qty"` (dots and brackets both nest)                                                                                                                        |
| children          | element \| `(field) => ReactNode`       | —          | ✓   | The one control to connect: an element, or a function that gets the props above and returns the control                                                                                                                                   |
| rules             | `FormRule[]`                            |            |     | What the value must satisfy, checked in order; the first failure is the field's `error`                                                                                                                                                   |
| label             | string                                  |            |     | Passed to the control as `label`. With `control`, drawn above it by `FormControl` instead                                                                                                                                                 |
| helperText        | string                                  |            |     | Passed to the control as `helperText`; hidden while there is an error                                                                                                                                                                     |
| valuePropName     | string                                  | `value`    |     | The control's prop that takes the value: `"checked"` for a `Checkbox`                                                                                                                                                                     |
| trigger           | string                                  | `onChange` |     | The control's callback that reports a new value: `"onValueChange"` for a `Checkbox` or a `Slider`                                                                                                                                         |
| getValueFromEvent | (...args) => unknown                    |            |     | Turns what the trigger is called with into the stored value. By default the first argument, or, when that is a DOM event, its `target.value` (`target.checked` for `valuePropName="checked"`)                                             |
| normalize         | (value, previous, allValues) => unknown |            |     | Turns the reported value into the stored one: trim, uppercase, format                                                                                                                                                                     |
| dependencies      | string[]                                |            |     | Names of other fields this one's rules read (`"password"` for a "confirm password"): it is validated again when one changes, once it has been touched or edited, or shows an error                                                        |
| initialValue      | any                                     |            |     | The value the field starts with when the form's `initialValues` has none for it                                                                                                                                                           |
| validateOn        | `"change" \| "blur" \| "submit"`        | the form's |     | Overrides the form's mode for this field: a `Checkbox` has no blur, so `"change"` suits it                                                                                                                                                |
| disabled          | boolean                                 | `false`    |     | Disables this field (the control's `disabled`); the form's `disabled` does it for all                                                                                                                                                     |
| control           | boolean                                 | `false`    |     | For a control that draws no label, helper or error text of its own (`Checkbox`, `Switch`, `Slider`, `RadioGroup`): wraps it in a `FormControl` that does, and passes it `error` as a boolean (and no `required`, `label` or `helperText`) |

**The child.** A control that needs `value` and `onChange` (the library `Input` requires both) is a
function child: `{(field) => <Input {...field} />}`, which hands it the props without writing them out.
A plain element (`<Input label="Email" />`) works the same at runtime, but TypeScript asks it for the
`value` and `onChange` it requires.

**Rules.** `rules` is an array of `FormRule`, each checked in this order, the first failure winning:

| `FormRule`            | Type                               | Description                                                                                                                                                                                                                                                                                                                                                   |
| --------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| required              | boolean                            | The value must not be empty: `""`, whitespace, `null`, `undefined`, `false` and `[]` are                                                                                                                                                                                                                                                                      |
| type                  | `"email" \| "url" \| "number"`     | Built-in format: an email address, an http(s) URL, a number                                                                                                                                                                                                                                                                                                   |
| min / max             | number                             | Smallest / largest number (the value is read as a number, so `"12"` is 12)                                                                                                                                                                                                                                                                                    |
| minLength / maxLength | number                             | Fewest / most characters (or array items)                                                                                                                                                                                                                                                                                                                     |
| pattern               | RegExp                             | The text must match                                                                                                                                                                                                                                                                                                                                           |
| validator             | `(value, values, { signal }) => …` | A custom check, sync or async: return the error message to fail; anything else passes, so `value !== other && "Must match"` reads as it should. A thrown error or a rejected promise fails with its message. `signal` is aborted when the field is validated again before the run settles: pass it to `fetch` to cancel the request. Runs on empty values too |
| message               | string                             | Replaces the default message of the built-in checks (not what a `validator` returns)                                                                                                                                                                                                                                                                          |

Every check but `required` and `validator` skips an empty value: nothing to check yet.

```tsx
<Form
  initialValues={{ password: "", confirm: "", terms: false }}
  onSubmit={signUp}
>
  <FormField
    name="password"
    label="Password"
    rules={[{ required: true }, { minLength: 8 }]}
  >
    {(field) => <PasswordField {...field} autoComplete="new-password" />}
  </FormField>
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
  <FormField
    name="terms"
    control
    valuePropName="checked"
    trigger="onValueChange"
    rules={[{ required: true, message: "Accept to continue" }]}
  >
    {(field) => <Checkbox {...field} label="I accept the terms" />}
  </FormField>
  <Button type="submit">Create account</Button>
</Form>
```

#### useFormField

`useFormField(name, options?)` is the hook behind `FormField`, for a control `FormField` cannot wrap. It
returns the field's `{ value, error, touched, dirty, validating }` with the functions to drive it, and
re-renders only when one of them changes.

| Returned          | Description                                                                     |
| ----------------- | ------------------------------------------------------------------------------- |
| setValue(value)   | Stores a value (after `normalize`) and validates by the form's mode             |
| onBlur()          | Call when the control loses focus: marks it touched, validates in `"blur"` mode |
| setError(message) | Sets or clears the error: a server-side one, say                                |
| validate()        | Validates this field now; resolves to whether it passed                         |

`options` are the field's `rules`, `dependencies`, `validateOn`, `initialValue` and `normalize` as on
`FormField`, plus `form` (the instance, outside a `Form`). Passing `options` registers the field: only
registered fields are validated and submitted through; without them the hook just reads.

```tsx
const StarsField = ({ name }: { name: string }) => {
  const { value, error, setValue } = useFormField(name, {
    rules: [{ required: true, message: "Pick a rating" }],
  });
  return (
    <>
      <Rating value={value ?? 0} onChange={setValue} />
      {!!error && <HelperText type="error">{error}</HelperText>}
    </>
  );
};
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

Virtualized, sortable grid: sortable columns, reorder, density, loading, empty state, and the props `Table` has. Built on the public `Table` primitives below.

**DataGrid or Table?** `Table` is for simple data tables, drawn all at once. `DataGrid` is for large sortable grids: a virtualised list with sorting, column reorder, `renderCell` and infinite scroll. They are separate components and share `tableTitle`, `width`, `height`, `rowsPerPage`, `hover`, `selected`, `onClick` and `emptyMessage`; a column may be spelled `alignment` / `fallback` in both.

| Prop                           | Type                          | Default  | Req | Description                                                                                                              |
| ------------------------------ | ----------------------------- | -------- | --- | ------------------------------------------------------------------------------------------------------------------------ |
| data                           | any[]                         | —        | ✓   | Row objects                                                                                                              |
| columns                        | `ColumnDefinition[]`          | —        | ✓   | `{ id, label, width?, sortable?, align? \| alignment?, fallback?, renderCell? }`                                         |
| tableTitle                     | string                        |          |     | Heading above the header row                                                                                             |
| width                          | DimensionValue                |          |     | Fills the container by default                                                                                           |
| height                         | DimensionValue                |          |     | The header stays in place and the rows scroll under it                                                                   |
| rowsPerPage                    | number                        |          |     | Pages the rows under a `Pagination`; back to page 1 when it or the row count changes. Do not combine with `onEndReached` |
| hover                          | boolean                       | `false`  |     | Highlights the row under the pointer, on web                                                                             |
| selected                       | number \| number[]            |          |     | Row indexes in `data` (not in the page shown); they follow the order of `data`                                           |
| onClick                        | (row, index) => void          |          |     | Makes the rows pressable, with the button role: keep controls of their own out of the cells                              |
| loading                        | boolean                       | `false`  |     |                                                                                                                          |
| density                        | `"normal" \| "dense"`         | `normal` |     |                                                                                                                          |
| sortColumn                     | string                        |          |     |                                                                                                                          |
| sortDirection                  | `"asc" \| "desc"`             |          |     |                                                                                                                          |
| onSort                         | (columnId, direction) => void |          |     |                                                                                                                          |
| onColumnReorder                | (newColumns) => void          |          |     | The order is kept by column id: an inline `columns` array does not undo it                                               |
| onEndReached                   | () => void                    |          |     | Infinite scroll                                                                                                          |
| onEndReachedThreshold          | number                        |          |     |                                                                                                                          |
| emptyMessage                   | ReactNode                     |          |     | Shown when empty & not loading                                                                                           |
| style / rowStyle / headerStyle | ViewStyle                     |          |     |                                                                                                                          |

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
them it is a centred single-line tile. Giving `onClick` makes the whole row one pressable button;
the `action` is a sibling of the row's button, not inside it. A bare icon, chip or text in the `action` presses
the row; a control in it (an `IconButton`, a `Switch`) runs its own handler and never the row's.
The row's accessible name is its texts, not the action's.

| Prop                                                     | Type              | Default | Req | Description                                                                                                 |
| -------------------------------------------------------- | ----------------- | ------- | --- | ----------------------------------------------------------------------------------------------------------- |
| primaryText                                              | ReactNode         | —       | ✓   | The first line. Text is drawn in the theme's type; any other node as given                                  |
| secondaryText                                            | ReactNode         |         |     | Second line below `primaryText`, text or any node                                                           |
| onClick                                                  | () => void        |         |     | Makes the whole row a button, with hover/press states. A control in the `action` does not press it          |
| icon                                                     | icon \| ReactNode |         |     | Leading slot: a glyph name, or any node (an `Avatar`, a `Checkbox`)                                         |
| action                                                   | ReactNode         |         |     | Trailing slot: a value, a `Switch`, an `IconButton`, a chevron. `disabled` does not disable a control in it |
| primaryTextStyle / secondaryTextStyle                    | TextStyle         |         |     | Merged after the type of the text, when it is text                                                          |
| indicatorColor                                           | string            |         |     | A coloured bar on the left edge, for a status or a priority                                                 |
| dimmed                                                   | boolean           | `false` |     | Faded, for a row that is removed or inactive; still pressable                                               |
| trailingWidth                                            | number            |         |     | Fixes the width of the `action` slot and right-aligns it, so a column of rows lines its actions up          |
| disabled                                                 | boolean           | `false` |     | Fades the row and stops it being pressed                                                                    |
| itemContainerStyle / itemPressedStyle / itemHoveredStyle | object            |         |     | Style overrides                                                                                             |
| testID                                                   | string            |         |     |                                                                                                             |

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

`ListItem` takes `variant` (`"standard" | "outlined" | "contained"`, default `"contained"`, the secondary-container fill it always had): `standard` is transparent with no border, like a sidebar's rows; `outlined` draws an outline. The border is one width in every variant and state, so hover and press never move the layout. `ListSection` also takes `gap` (`"xs" | "s" | "m" | "l" | "xl"` or a number: the space between items) and `showDividers` (a rule between consecutive items, `n - 1` for `n`; `divider` is the one rule after the last item, and both can be used together). `variant="standard"` rows with `gap` and `showDividers` make a plain list, like a sidebar's.

### Tree

A hierarchy that opens and closes: folders and files, a category tree, an org chart. Rows open with a
chevron, can be selected one at a time or with checkboxes (a parent shows the mixed state when only
some of its children are checked), and can load their children the first time they are opened. Each row
reads its own slice of the tree's state, so a press that changes one row draws that row, not the tree.

`TreeNode`:

| Field       | Type                    | Req | Description                                                                                                                 |
| ----------- | ----------------------- | --- | --------------------------------------------------------------------------------------------------------------------------- |
| id          | string                  | ✓   | The node's identity in `expanded` and `selected`: keep it unique and stable                                                 |
| label       | ReactNode               | ✓   | What the row says. Text is drawn in the theme's type; any other node as given                                               |
| icon        | glyph name \| ReactNode |     | Before the label                                                                                                            |
| children    | `TreeNode[]`            |     | The nodes under this one. Left out (or `hasChildren`), the node is a leaf, or one `loadChildren` fills in when it is opened |
| disabled    | boolean                 |     | The row cannot be selected or checked, and a parent's checkbox skips it; it can still be opened                             |
| hasChildren | boolean                 |     | The node has children that are not in `children` yet: it shows a chevron, and opening it calls `loadChildren`               |
| badge       | ReactNode               |     | After the label: text or a number is drawn as a small count, any other node as given                                        |

`Tree`:

| Prop               | Type                               | Default                     | Req | Description                                                                                                                                                                                           |
| ------------------ | ---------------------------------- | --------------------------- | --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| data               | `TreeNode[]`                       | —                           | ✓   | The roots. Keep the array and its nodes stable between renders: rows whose node did not change are not drawn again                                                                                    |
| expanded           | string[]                           |                             |     | The ids of the open nodes. Set, the tree is controlled: it opens and closes what this says and reports through `onExpandedChange`                                                                     |
| defaultExpanded    | string[]                           |                             |     | The ids that start open, when `expanded` is not set                                                                                                                                                   |
| onExpandedChange   | (expanded) => void                 |                             |     | Called with the open ids after a node is opened or closed                                                                                                                                             |
| selected           | string[]                           |                             |     | The ids of the selected nodes (at most one with `selectionMode="single"`). With checkboxes it lists every checked node, a parent whose children are all checked included. Set, the tree is controlled |
| defaultSelected    | string[]                           |                             |     | The ids that start selected, when `selected` is not set                                                                                                                                               |
| onSelectedChange   | (selected) => void                 |                             |     | Called with the selected ids after a press, a Space or an Enter on a row                                                                                                                              |
| selectionMode      | `"none" \| "single" \| "multiple"` | `none`                      |     | What pressing a row does: `none` opens and closes it, `single` selects it (and only it), `multiple` toggles it in the selection. The chevron always opens and closes                                  |
| checkboxes         | boolean                            | `false`                     |     | With `selectionMode="multiple"`, a checkbox on each row: checking a parent checks everything under it, and a parent with only some children checked shows the mixed state. Ignored in the other modes |
| loadChildren       | `(node) => Promise<TreeNode[]>`    |                             |     | Fetches the children of a node marked `hasChildren` when it is first opened; the result is kept, so the node is not asked again                                                                       |
| onLoadError        | (error, node) => void              |                             |     | Called when `loadChildren` rejects                                                                                                                                                                    |
| renderLabel        | (node, state) => ReactNode         |                             |     | Draws the label of a row instead of `node.label`. Rows are memoised: pass a function that does not change between renders (`useCallback`)                                                             |
| indent             | number                             | `24`                        |     | How far each level is pushed in, in px                                                                                                                                                                |
| size               | `"small" \| "medium" \| "large"`   | `medium`                    |     | Row height and text size: 32 / 40 / 48 px                                                                                                                                                             |
| disabled           | boolean                            | `false`                     |     | Nothing can be opened, selected or focused                                                                                                                                                            |
| showLines          | boolean                            | `false`                     |     | A vertical guide line down each open node's children                                                                                                                                                  |
| loadingText        | string                             | `Loading…`                  |     | The text of the loading row                                                                                                                                                                           |
| retryText          | string                             | `Could not load. Try again` |     | The text of the row that retries a failed load                                                                                                                                                        |
| accessibilityLabel | string                             |                             |     | Names the tree for assistive tech                                                                                                                                                                     |
| style              | ViewStyle                          |                             |     |                                                                                                                                                                                                       |
| testID             | string                             |                             |     | Each row gets `${testID}-item-${node.id}`                                                                                                                                                             |

`renderLabel` is told `TreeRowState`: `{ level, expanded, selected, indeterminate, loading, disabled }`
(`level` is 1 for the roots; `selected` is the highlight, or the checked state with checkboxes).

- **Lazy children.** A node marked `hasChildren` with no `children` shows a chevron; opening it calls
  `loadChildren(node)` behind a loading row. A rejection shows a retry row (press it to ask again) and
  calls `onLoadError`; a node whose load comes back empty becomes a leaf.
- **Checkboxes.** Checking a parent checks everything under it, and checking the last unchecked child
  checks the parent. A disabled child keeps its state when its parent is toggled. A parent's id in
  `selected` stands for its whole branch.
- **Keyboard (web).** The ARIA tree pattern: one tab stop, then Up and Down move, Right opens a row or
  steps into it, Left closes it or steps out, Home and End jump to the first and last row, Enter or
  Space acts on the row (selects it, or opens it with `selectionMode="none"`), `*` opens the closed
  siblings, and typing letters jumps to the next label that starts with them.
- **Accessibility.** On web the roles are `tree`, `treeitem` and `group`, with `aria-level`,
  `aria-posinset`, `aria-setsize`, `aria-expanded`, `aria-selected` (or `aria-checked`, `mixed`
  included, with checkboxes) and `aria-multiselectable`. On native each row is one accessible element
  (a checkbox with checkboxes, else a button when it can be selected or opened) whose open and close
  are the `expand` and `collapse` accessibility actions.

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
  selectionMode="single"
  onSelectedChange={([id]) => open(id)}
/>
```

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

On native the anchor sits in a `Pressable` that listens for the long press, so a pressable anchor (a
`Link`, a `Button`) captures the touch and the long press never reaches the bubble; plain text, an icon
or a `View` works. On web hover and focus reach it whatever the anchor is.

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
| enableCopy                      | boolean                                           | `false`                          |     | A small copy button (a `Clipboard`) after a text or number value; on native only shown with a `copy` writer or an `onCopy` |
| onCopy                          | (value: string) => void                           |                                  |     | Called with the value as text after it was copied; without a `copy` it is, on native, where the app does the copying       |
| copy                            | `ClipboardWriter`                                 |                                  |     | Writes the value: `expo-clipboard`'s `setStringAsync` on native; on web it defaults to the browser's clipboard             |
| showTooltip                     | boolean                                           | `false`                          |     | Wraps a text or number value in a `Tooltip` with the value in full, for when `numberOfLines` cuts it                       |
| captionStyle / valueStyle       | TextStyle                                         |                                  |     |                                                                                                                            |
| style                           | ViewStyle                                         |                                  |     | For anything the props above do not cover                                                                                  |
| testID                          | string                                            |                                  |     |                                                                                                                            |

The copy button is the library's `Clipboard`: it copies through `copy` (the browser's clipboard on web
by default), shows a check for a moment once the value is copied and announces "Copied". A node value
has nothing to copy, so it gets no button.

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

### CodeBlock / HighlightedCode

`CodeBlock` is a snippet with syntax colours and a copy button, in a bordered block: the text is
selectable, long lines scroll sideways unless `wrap`, and the colours are theme roles, so they follow
the palette and the scheme. `HighlightedCode` is just the coloured runs in one `Text`, with no chrome:
what `CodeBlock` draws, and what a live editor draws under its text field.

`CodeBlock`:

| Prop               | Type                                                           | Default                         | Req | Description                                                                                                                                                                              |
| ------------------ | -------------------------------------------------------------- | ------------------------------- | --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| code               | string                                                         | —                               | ✓   | The source to show; Windows line endings are normalised, and one trailing newline is the end of the last line, not an empty one                                                          |
| language           | `"tsx" \| "jsx" \| "ts" \| "js" \| "json" \| "bash" \| "text"` | `tsx`                           |     | What it is written in, for the colours; `text` is drawn plain                                                                                                                            |
| title              | string                                                         | the language's name             |     | Shown in the header above the snippet: a file name, or what it is for. Without one the header reads the language's name in capitals, and is left out when there is no copy button either |
| showLineNumbers    | boolean                                                        | `false`                         |     | Numbers the lines, in a gutter that is not selected with the code and is kept from screen readers                                                                                        |
| copyable           | boolean                                                        | `true`                          |     | A copy button in the header. On web it works as is; on native it is drawn only with a `copy` writer or an `onCopy`                                                                       |
| wrap               | boolean                                                        | `false`                         |     | Wraps long lines instead of scrolling the block sideways                                                                                                                                 |
| maxHeight          | DimensionValue                                                 |                                 |     | Height of the body before it scrolls vertically. Left out, it grows with the code                                                                                                        |
| highlightLines     | number[]                                                       |                                 |     | Lines to mark with a band and an accent edge, counted from 1                                                                                                                             |
| onCopy             | (code) => void                                                 |                                 |     | Called with the code after the copy button copied it                                                                                                                                     |
| copy               | `ClipboardWriter`                                              |                                 |     | Writes the copied text: `expo-clipboard`'s `setStringAsync` on native; on web it defaults to the browser's clipboard                                                                     |
| accessibilityLabel | string                                                         | title, else `"{LANGUAGE} code"` |     | Read by screen readers as the name of the block (a `group`)                                                                                                                              |
| style              | ViewStyle                                                      |                                 |     |                                                                                                                                                                                          |
| testID             | string                                                         |                                 |     | With line numbers or marked lines, each line gets `${testID}-line-${n}`                                                                                                                  |

`HighlightedCode`:

| Prop       | Type           | Default | Req | Description                                                                                                   |
| ---------- | -------------- | ------- | --- | ------------------------------------------------------------------------------------------------------------- |
| code       | string         | —       | ✓   | The source to colour                                                                                          |
| language   | `CodeLanguage` | `tsx`   |     | As on `CodeBlock`                                                                                             |
| selectable | boolean        |         |     | Lets the reader select the text                                                                               |
| decorative | boolean        |         |     | Hides the text from assistive technology, for a copy that only decorates (a field's own text is read instead) |
| style      | TextStyle      |         |     | Merged after the code type: padding, font size                                                                |
| testID     | string         |         |     |                                                                                                               |

`CODE_FONT_FAMILY` is the monospace family both draw in: set a text field laid over `HighlightedCode`
to the same one, so the two line up.

**`highlight(code, language = "tsx")`** is the tokenizer behind them, exported for your own renderer. It
returns `CodeToken[]`, runs of `{ text, kind? }`, where `kind` is a `CodeTokenKind`: `comment`,
`string`, `keyword`, `tag`, `attribute`, `type` or `number` (no `kind` is plain). It is lossless (the
runs' text joins back into `code`) and a regex tokenizer, not a parser: it knows comments, strings,
numbers and, per language, keywords, JSX tags and attributes and PascalCase names (`tsx`, `jsx`, `ts`,
`js`), keys (`json`), commands, flags and variables (`bash`), which is what makes a sample readable,
and leaves everything else plain.

```tsx
<CodeBlock
  title="App.tsx"
  code={source}
  showLineNumbers
  highlightLines={[3, 4]}
/>
<CodeBlock language="bash" code="npm install @its/glowup-ui" copy={setStringAsync} />
```

### QrCode

Draws any text (a URL, a Wi-Fi string, a vCard) as a QR code with the library's own encoder: ISO/IEC
18004, versions 1 to 40, levels L to H, and the numeric, alphanumeric and byte (UTF-8) modes, packed in
the narrowest that holds the text. There is no QR dependency and no network, and the code is the same on
iOS, Android and web; it is drawn as one `react-native-svg` path (the peer `CircularProgress` already
uses).

| Prop               | Type                                | Default                                 | Req | Description                                                                                                                                                                                |
| ------------------ | ----------------------------------- | --------------------------------------- | --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| value              | string                              | —                                       | ✓   | What the code says. The most a code holds is 2953 bytes at level `L`; past that nothing is drawn and `onError` is called                                                                   |
| size               | number                              | `160`                                   |     | Side of the whole code, quiet zone included, in px                                                                                                                                         |
| level              | `"L" \| "M" \| "Q" \| "H"`          | `M`                                     |     | How much damage the code survives, and so how big it grows: about 7%, 15%, 25% or 30% of it can be lost. A `logo` raises it to `H` whatever this says                                      |
| quietZone          | number                              | `4`                                     |     | The empty margin around the modules, in modules. Scanners need it to find the code; the standard asks for 4                                                                                |
| color              | theme colour token \| colour string | `onSurface`, `inverseOnSurface` in dark |     | The modules. Scanners read dark modules on a light background, so the default keeps them dark on light in both modes                                                                       |
| backgroundColor    | theme colour token \| colour string | `surface`, `inverseSurface` in dark     |     | The background                                                                                                                                                                             |
| logo               | glyph name \| ReactNode             |                                         |     | A mark over the middle of the code (a glyph name, or any node such as an `Image`), centred in a box a fifth of the code wide. The modules under it are lost, so the level is raised to `H` |
| accessibilityLabel | string                              | `QR code`                               |     | What a screen reader says about the code (an `image`). The value is not read out by default: it may be a secret                                                                            |
| onError            | (error) => void                     |                                         |     | Called, once per failing value, when `value` does not fit in a code; the box is then drawn empty, with a "QR code unavailable" label                                                       |
| style              | ViewStyle                           |                                         |     |                                                                                                                                                                                            |
| testID             | string                              |                                         |     | The logo box gets `${testID}-logo`                                                                                                                                                         |

```tsx
<QrCode value="https://example.com/invite/9f3a" size={200} />
<QrCode value={wifi} level="Q" logo="wifi" />
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
overlay in the kit — `Dialog`, `AlertDialog`, `Popover`, `Menu`, `Select`, `BottomSheet`,
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
| role                 | `"dialog" \| "alertdialog"`           |          |     | ARIA role of the card: `alertdialog` is for a dialog that interrupts for an answer (see `AlertDialog`)                                              |
| describedBy          | string                                |          |     | The `nativeID` of the element that describes the dialog, set as `aria-describedby`; only used with `role`                                           |
| initialFocus         | `"auto" \| "actions"`                 | `auto`   |     | Web: where focus goes once open: the modal's focus trap's pick, or the first control of `actions`                                                   |
| animationType        | `"none" \| "slide" \| "fade"`         | `fade`   |     |                                                                                                                                                     |
| transparent          | boolean                               | `true`   |     |                                                                                                                                                     |
| slotStyles           | `DialogSlotStyles`                    |          |     | Style overrides, merged after the dialog's own: `backdrop`, `container`, `header`, `title`, `content`, `actions`                                    |
| testID               | string                                | `dialog` |     | Root; the scrim gets `${testID}-scrim`, the close icon `${testID}-close`, the form `${testID}-form`                                                 |

**Role and focus.** Left out, `role` leaves the card with none of its own, and react-native-web's modal
supplies `dialog`. With `role`, the card is labelled by its `title` (`aria-labelledby`) and described by
the element `describedBy` names. `initialFocus="auto"` leaves focus to the modal's focus trap, which
takes the first focusable element (the close icon, or a field in the body); `"actions"` focuses the
first control of the `actions` row, so an alert starts on its least destructive button. `fullScreen`
ignores it.

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

### AlertDialog

A dialog that interrupts to say something and wait for an answer: one primary action, optionally a
secondary. It is a `Dialog` with the `alertdialog` role (the title names it, the message and body
describe it), no way out but its buttons by default, and, on the web, focus on its first action once it
opens (the secondary one when there is one, so the least destructive). With `cancelText` and
`destructive` it is also the plain confirmation.

| Prop                 | Type                                          | Default        | Req | Description                                                                                                                                             |
| -------------------- | --------------------------------------------- | -------------- | --- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| visible              | boolean                                       | —              | ✓   | Whether the dialog is on screen                                                                                                                         |
| title                | string                                        |                |     | The headline; the dialog's accessible name                                                                                                              |
| message              | string                                        |                |     | What the alert says; with `children`, the dialog's accessible description                                                                               |
| children             | ReactNode                                     |                |     | More body under the `message`, or in its place: a string or any node                                                                                    |
| icon                 | `IconSource`                                  |                |     | Hero glyph above the title; replaces the `severity` icon                                                                                                |
| severity             | `"info" \| "success" \| "warning" \| "error"` |                |     | A status icon above the title, in the colour of the status role. Left out, no icon                                                                      |
| actionText           | string                                        | `OK`           |     | Label of the primary action                                                                                                                             |
| onAction             | () => void                                    |                |     | Called when the primary action is pressed                                                                                                               |
| cancelText           | string                                        |                |     | Label of the secondary action, drawn before the primary one. Left out or empty, the alert has the primary action only                                   |
| onCancel             | () => void                                    |                |     | Called when the secondary action is pressed, and when the backdrop, Escape or Android back dismiss the alert (once enabled)                             |
| destructive          | boolean                                       | `false`        |     | Draws the primary action in the error tone (delete, discard)                                                                                            |
| loading              | boolean                                       | `false`        |     | The primary action shows a spinner and does nothing, the secondary one is disabled, and nothing dismisses the alert: it stays until `visible` goes down |
| disableBackdropClick | boolean                                       | `true`         |     | Keeps a click on the backdrop from calling `onCancel`: an alert needs an answer. `false` lets it dismiss                                                |
| disableEscapeKeyDown | boolean                                       | `true`         |     | Keeps Escape (web) and Android back from calling `onCancel`. `false` lets them dismiss                                                                  |
| slotStyles           | `DialogSlotStyles`                            |                |     | As `Dialog`; `actions` covers the buttons and `title` the headline                                                                                      |
| testID               | string                                        | `alert-dialog` |     | The buttons get `${testID}-cancel` and `${testID}-action`                                                                                               |

There is no close icon: the buttons are the way out, so with neither `cancelText` nor `onCancel` the user
can only press the primary action. `onCancel` is the app's answer "no" and should hide the dialog.

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

Migrating from `ConfirmDialog` (removed): `title`, `message`, `destructive`, `icon` and `slotStyles` keep their names.

| ConfirmDialog                     | AlertDialog                                                                             |
| --------------------------------- | --------------------------------------------------------------------------------------- |
| `confirmText` (default `Confirm`) | `actionText` (default `OK`)                                                             |
| `onConfirm`                       | `onAction`                                                                              |
| `cancelText` (default `Cancel`)   | `cancelText`, no default: pass it, or the alert has no cancel button                    |
| `dismissable` (default `true`)    | `disableBackdropClick={false}` and `disableEscapeKeyDown={false}` (both default `true`) |
| `dismissable={false}`             | nothing: it is the default                                                              |

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

### HoverCard

A card that shows more about its trigger: a profile on a username, a preview on a link. On web it opens
when the pointer rests on the trigger or the trigger takes focus, and stays open while the pointer is
over the card, so the card can hold links; Escape closes it. On native it opens on a long press of the
trigger and closes on a press outside or Android back. It is not modal and does not block the page on
web.

| Prop           | Type                                     | Default  | Req | Description                                                                                                                                                       |
| -------------- | ---------------------------------------- | -------- | --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| content        | ReactNode                                | —        | ✓   | What the card shows: any node. It is supplementary, never the only way to something                                                                               |
| children       | ReactNode                                | —        | ✓   | The trigger; it is not wrapped in an accessible element of its own                                                                                                |
| placement      | `"top" \| "bottom" \| "left" \| "right"` | `bottom` |     | The side of the trigger the card opens on, centred on it. When that side has no room it goes to the opposite one, and it always stays inside the window           |
| anchorPosition | `AnchorPosition`                         |          |     | Places the card as `Popover` does (below, above or over the trigger, aligned by its left edge, right edge or centre) instead of by `placement`, which it replaces |
| openDelay      | number (ms)                              | `300`    |     | Web: how long the pointer or focus rests on the trigger before the card opens                                                                                     |
| closeDelay     | number (ms)                              | `150`    |     | Web: how long after the pointer leaves the trigger and the card before it closes                                                                                  |
| open           | boolean                                  |          |     | Controls whether the card is open; pair with `onOpenChange`                                                                                                       |
| defaultOpen    | boolean                                  | `false`  |     | Whether the card starts open (uncontrolled)                                                                                                                       |
| onOpenChange   | (open) => void                           |          |     | Called with the new state when the user opens or closes the card                                                                                                  |
| disabled       | boolean                                  | `false`  |     | The card never opens, and closes if it was open                                                                                                                   |
| width          | number                                   | `280`    |     | Width of the card in px; it never grows past the window                                                                                                           |
| style          | ViewStyle                                |          |     | Style of the trigger's wrapper, which shrinks to the trigger                                                                                                      |
| testID         | string                                   |          |     | The card gets `${testID}-card`, the native outside-press layer `${testID}-backdrop`                                                                               |

- **Like a tooltip, for sighted users.** On web the card is not in the tab order when it sits in a
  `Portal.Host` (without one it is drawn inline next to the trigger), so whatever it shows has to be
  reachable some other way too. While it is open the trigger's wrapper is `aria-describedby` the card.
- **Native triggers.** A pressable trigger (a `Link`, a `Button`) captures the touch, so the long press
  never reaches the card: use plain text, or an element that is not pressable. To open it from a
  pressable trigger, control it with `open` and set it from that trigger's own long press.

```tsx
<HoverCard
  content={
    <Typography variant="bodyMedium">Ada Lovelace, mathematician</Typography>
  }
  placement="top"
>
  <Typography variant="bodyMedium" color="primary">
    @ada
  </Typography>
</HoverCard>
```

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
for another, and `maxVisible` (default `1`): up to that many toasts show together, stacked with a
gap (top positions downward, bottom ones upward, the newest nearest the edge), each on its own
timer, and the rest wait and appear in order as slots free. `useToast()` returns the same object for
the provider's whole life, so an effect depending on it runs once; `toast.queue` is read when
accessed and does not re-render. A toast shown with the `id` of one already queued replaces it in its place, and restarts its timer if it is on screen. `toast.success`, `.error`, `.warning` and `.info` are `show` with the `severity` set.

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

| Prop        | Type                      | Default   | Req | Description                                                                                                            |
| ----------- | ------------------------- | --------- | --- | ---------------------------------------------------------------------------------------------------------------------- |
| tabs        | `string[]` \| `TabItem[]` | —         | ✓   | `{ label, icon?, key?, disabled? }`; give an icon to every tab or to none                                              |
| activeTab   | number (index)            | `0`       |     | The active tab by position; ignored when `activeKey` is given                                                          |
| activeKey   | string                    |           |     | The active tab by its `key`, for tabs that come and go                                                                 |
| onChange    | (index, key?) => void     | —         | ✓   | Called with the pressed tab's position and, when it has one, its `key`                                                 |
| showBorders | boolean                   | `false`   |     | Dividers between the tabs and, in `rounded`, an outline around the track                                               |
| size        | `"sm" \| "md" \| "lg"`    | `md`      |     | The height and the type of the tabs                                                                                    |
| fullWidth   | boolean                   | `true`    |     | `true` shares the width equally between the tabs; `false` sizes each tab to its label, and the bar scrolls when needed |
| height      | number \| string          |           |     | Overrides the height of the bar (dp or a percentage)                                                                   |
| width       | number \| string          |           |     | Overrides the width of the bar (dp or a percentage)                                                                    |
| color       | `ColorRole`               | `primary` |     | Colour role of the indicator and of the selected tab                                                                   |
| testID      | string                    |           |     |                                                                                                                        |

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
`<Center>`, or `<Box variant="centered-flex">`.

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

### Center

A `Box` that centres its children on both axes: the thin wrapper over `Box`'s `centered-flex` variant
(`centered-column-flex` with `direction="column"`).

| Prop      | Type                | Default | Description                                                                     |
| --------- | ------------------- | ------- | ------------------------------------------------------------------------------- |
| direction | `"row" \| "column"` | `row`   | Whether the children flow in a row or in a column; each is centred on both axes |

Plus every `Box` prop except `variant`, `width` and `height` included.

```tsx
<Center
  direction="column"
  gap={8}
  height={200}
  background="surfaceContainerLow"
>
  <CircularProgress size={48} />
  <Typography variant="bodyMedium">Syncing your workspace</Typography>
</Center>
```

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

### GridLayout

Places its children on a grid of cells from layout data, as a dashboard or a detail page does: each
child, matched by its `key`, takes the columns (`x`, `w`) and rows (`y`, `h`) its entry in `layout`
names. Cells left empty stay empty. An item is as tall as its rows (`h × rowHeight + (h − 1) × gap`);
content taller than that scrolls inside it. Below `stackBelow` the children stack full width in
reading order (rows top to bottom, then left to right), each at its content's height.

Placement needs no measured width: each item's left and right edges are percentages of the grid's
width plus a dp margin, and its top and height are dp from the rows. The grid prerenders at width 0
and follows its container by itself. A `GridLayout` inside an item lays out on that item's width;
with as many `columns` as the item spans, its cells are about as wide as the outer grid's (exactly,
in an item with no padding; padding narrows them). A child with no
entry in `layout`, or an entry with no child, renders nothing; out-of-range entries are clamped
into the grid.

| Prop       | Type               | Default    | Description                                              |
| ---------- | ------------------ | ---------- | -------------------------------------------------------- |
| layout     | `GridLayoutItem[]` | (required) | `{ id, x, y, w, h }` per child, `id` = the child's `key` |
| columns    | number             | `12`       | Columns the width is divided into                        |
| rowHeight  | number             | `48`       | Height of one row, in dp                                 |
| gap        | number             | `16`       | Space between columns and between rows, in dp            |
| stackBelow | `SizeClass`        | `"medium"` | Below this window size class, the children stack         |
| style      | ViewStyle          |            |                                                          |

Helpers, for code that edits layouts: `clampGridItem(item, columns)` (whole cells, inside the
columns), `gridLayoutHeight(layout, rowHeight, gap)` (the bottom of the lowest item) and
`gridReadingOrder(layout)` (the stacking order).

```tsx
<GridLayout
  layout={[
    { id: "details", x: 0, y: 0, w: 6, h: 4 },
    { id: "notes", x: 0, y: 5, w: 12, h: 2 },
  ]}
>
  <Paper key="details" style={{ flexGrow: 1 }}>
    …
  </Paper>
  <Paper key="notes" style={{ flexGrow: 1 }}>
    …
  </Paper>
</GridLayout>
```

### AspectRatio

| Prop  | Type             | Default | Description                        |
| ----- | ---------------- | ------- | ---------------------------------- |
| ratio | number           | `1`     | Width ÷ height — `16 / 9`, `4 / 3` |
| width | ViewStyle values | `100%`  |                                    |

Plus every `Box` prop except `height`.

### AbsoluteCenter

Centres its child in the parent's box, out of the normal flow: it fills the parent with absolute
positioning and centres inside, so the parent's own content is not pushed around (a spinner over a
card, a badge over an image). The parent needs a size of its own. The layer itself is not pressable
(`pointerEvents: "box-none"`), only the child is, so what lies under it stays reachable.

| Prop | Type                                   | Default | Description                                                                                                                           |
| ---- | -------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| axis | `"both" \| "horizontal" \| "vertical"` | `both`  | The axis the child is centred on; on the other it keeps its normal place (the start, or the full width of a vertically centred child) |

Plus every `View` prop.

```tsx
<Box height={200} width={360} background="surfaceContainerLow">
  <Typography variant="titleSmall">Quarterly report</Typography>
  <AbsoluteCenter>
    <CircularProgress size={40} />
  </AbsoluteCenter>
</Box>
```

### Break

Lets its child out of the padding of its container: a negative margin of the same size, per edge, so an
image or a divider runs edge to edge inside a padded `Box` or `Paper`. Give each edge the padding it
should cancel.

| Prop        | Type           | Default | Description                                                    |
| ----------- | -------------- | ------- | -------------------------------------------------------------- |
| inline      | `SpacingValue` |         | Breaks out on both horizontal edges: a spacing token or px     |
| block       | `SpacingValue` |         | Breaks out on both vertical edges: a spacing token or px       |
| inlineStart | `SpacingValue` |         | Breaks out at the start edge (left in LTR); wins over `inline` |
| inlineEnd   | `SpacingValue` |         | Breaks out at the end edge (right in LTR); wins over `inline`  |
| blockStart  | `SpacingValue` |         | Breaks out at the top; wins over `block`                       |
| blockEnd    | `SpacingValue` |         | Breaks out at the bottom; wins over `block`                    |

Plus every `View` prop; `style` is merged after the margins.

```tsx
<Box padding={16} gap={8}>
  <Typography variant="bodyMedium">
    Padding keeps the text off the edge.
  </Typography>
  <Break inline="m">
    <Image source={photo} alt="Line 4" />
  </Break>
</Box>
```

### ScrollArea

A scrollable area with scrollbars drawn from the theme instead of the platform's: the native indicators
are hidden and a track and a thumb take their place, on web and native alike. The thumb is as long as
the visible share of the content, follows the scroll offset and can be dragged; a press on the track
scrolls a page. Keyboard, wheel and touch scrolling stay the platform's own, because the content sits
in a real `ScrollView`. The scrollbars are laid over the content, not beside it: pad the content
(`contentContainerStyle`) by `scrollbarSize` where they must not cover it.

| Prop                  | Type                                        | Default    | Description                                                                                                                                                                                                                                                                                                           |
| --------------------- | ------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| orientation           | `"vertical" \| "horizontal" \| "both"`      | `vertical` | The axis that scrolls. `both` nests a horizontal scroll view in a vertical one, so the content may overflow either way                                                                                                                                                                                                |
| type                  | `"auto" \| "always" \| "scroll" \| "hover"` | `auto`     | When the scrollbars show: `auto` whenever the content overflows; `always` even when it does not; `scroll` while scrolling or dragging, and `scrollHideDelay` after; `hover` while the pointer is over the area (web) and while scrolling or dragging. Without a pointer, as on a phone, `hover` behaves like `scroll` |
| scrollbarSize         | number                                      | `10`       | Thickness of the scrollbar, in dp: raise it on touch screens for a bigger grab area                                                                                                                                                                                                                                   |
| scrollHideDelay       | number (ms)                                 | `600`      | How long a `scroll` or `hover` scrollbar stays after the last scroll, drag or hover                                                                                                                                                                                                                                   |
| height                | DimensionValue                              |            | Fixed height of the area. Left out, it sizes to the content, up to `maxHeight`                                                                                                                                                                                                                                        |
| maxHeight             | DimensionValue                              |            | The height at which the content starts to scroll                                                                                                                                                                                                                                                                      |
| width                 | DimensionValue                              |            | Fixed width of the area                                                                                                                                                                                                                                                                                               |
| onScroll              | (event) => void                             |            | Called on every scroll, like `ScrollView`'s. With `orientation="both"` the event carries both axes' offset, content size and layout measurement                                                                                                                                                                       |
| style                 | ViewStyle                                   |            | Style of the outer view; the scrollbars are laid over it                                                                                                                                                                                                                                                              |
| contentContainerStyle | ViewStyle                                   |            | Style of the view wrapping the children inside the scroll view (padding, `flexGrow`)                                                                                                                                                                                                                                  |
| slotStyles            | `{ track?, thumb? }`                        |            | Style overrides for the track and the thumb, merged after their own                                                                                                                                                                                                                                                   |
| ref                   | `Ref<ScrollView>`                           |            | The scroll view (the vertical one, or the horizontal one for `orientation="horizontal"`): `scrollTo`, `scrollToEnd`, …                                                                                                                                                                                                |
| testID                | string                                      |            | The scroll view gets `${testID}-viewport` (`-viewport-x` for the horizontal one of `both`), each scrollbar `${testID}-scrollbar-vertical` or `-horizontal`, its thumb `${testID}-thumb-vertical` or `-horizontal`                                                                                                     |

Plus the other `ScrollView` props, passed on to the scroll view (not `horizontal`, the scroll
indicators, `scrollEventThrottle`, `style` and `contentContainerStyle`, which `ScrollArea` owns). With
`both`, when both scrollbars are drawn each track stops short of the corner they share. The scrollbar
is hidden from assistive technology; the content is scrolled as any `ScrollView`.

```tsx
<ScrollArea
  maxHeight={240}
  type="hover"
  contentContainerStyle={{ paddingRight: 12 }}
>
  {items}
</ScrollArea>
```

### Visible

Shows its children only while every condition holds: your own (`when`) and the window's size class
(`above`, `below`, `only`). The size classes are the M3 window size classes `Grid` also uses, mobile
first: `compact` from 0 dp, `medium` from 600, `expanded` from 840, `large` from 1200 and `extraLarge`
from 1600.

| Prop        | Type                       | Default | Description                                                                                                                                                                         |
| ----------- | -------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| when        | boolean                    | `true`  | A condition of your own; the children show only while it holds                                                                                                                      |
| above       | `SizeClass`                |         | Shows from this size class up: `"medium"` is medium, expanded, large and extraLarge                                                                                                 |
| below       | `SizeClass`                |         | Shows only on size classes smaller than this one: `"medium"` is compact only                                                                                                        |
| only        | `SizeClass \| SizeClass[]` |         | Shows only on this size class, or on any of these                                                                                                                                   |
| fallback    | ReactNode                  |         | Rendered in place of the children while they are not shown                                                                                                                          |
| keepMounted | boolean                    | `false` | Hides the children with `display: "none"` instead of unmounting them, so their state survives; they are then wrapped in a `View` (laid out as if it were not there while they show) |
| children    | ReactNode                  |         |                                                                                                                                                                                     |

The class is read through `useBreakpoint`, which is safe to prerender: while a static page hydrates the
class is `compact`, then the real one. Under a `ViewportProvider width={360}` it is worked out from that
width instead of the window's.

```tsx
<Visible
  above="expanded"
  fallback={<NavBar items={items} activeId={tab} onClick={setTab} />}
>
  <NavigationRail items={items} activeId={tab} onItemPress={setTab} />
</Visible>
```

#### useBreakpointValue

`useBreakpointValue(values, fallback)` picks a value by size class: the one set for the current class,
or else for the largest class below it that has one (mobile first, like `Grid`). `fallback` is what a
window smaller than every class set gets; without it the result may be `undefined`.

```ts
const columns = useBreakpointValue({ compact: 1, medium: 2, large: 4 }, 1);
```

`useBreakpoint(overrides?)`, which `Visible` uses, returns `{ width, sizeClass, atLeast(size) }`
(`atLeast("expanded")` is true on large windows too); `overrides` is a partial map of where the classes
start, for an app whose desktop layout begins at 1300.

---

## 8b. Drag and Drop

### DragDropProvider / Draggable / Droppable / useDragDrop

Drag and drop by touch and mouse on iOS, Android and the web, built on the responder system (no
gesture or animation dependency). The geometry is pure and tested on its own
(`internal/dragDrop.ts`: the zone under a point, the insertion index, the insertion line).

- **Lifting.** A touch lifts the item after resting 250 ms (moving more than 8 dp first is a
  swipe, left to the scroll view); a mouse lifts it after moving 4 px. A tap that did not lift calls
  `onPress`. The item is the handle, pressable content included: every press inside is watched in
  the capture phase, and a control that took it (a `Card`, a row with `onClick`) is taken over once
  the press rests or moves; the innermost draggable under the press is the one that lifts.
- **While dragging.** The item stays in place at 0.4 opacity; a preview (`preview`, else
  `children`, at the item's size) follows the pointer at the `PortalHost` with a raised shadow,
  its draggables and zones drawn inert. Zones and items are measured when the drag begins, and
  again when one of them lays out anew, unmounts, or scrolls with a `useDragScroll` view.
  The innermost zone under the pointer that `accept`s the item is the target, never a zone inside
  the dragged item; a 2 dp primary line marks the insertion point between its draggables. Escape
  cancels on the web; a touch lift emits `longPress` feedback.
- **The drop.** `onDragEnd({ active, over })`: `over` is `{ id, data, index }` or `null`;
  `index` counts the zone's draggables without the dragged one.
- **Scrolling.** On the web each item cancels its own touch moves once lifted, so the page does
  not scroll under it. `useDragScroll()`, spread on the `ScrollView`/`ScrollArea` around the zones,
  locks it while an item is held, scrolls it by itself within 48 dp of its top or bottom edge (up to
  16 dp per 16 ms, faster nearer the edge, stopping at the end of the content) and re-measures the
  zones as it scrolls. A zone or item whose layout changes during a drag is re-measured too
  (coalesced to one pass at a time); the dragged item's own preview keeps its grab point.
- **Position.** `over.rect` is the dragged item's preview relative to the zone's top-left corner
  and `over.zone` the zone's size: what a zone that places by position (a grid) snaps.
  `indicator={false}` turns the insertion line off for such a zone. `useDragState(select)` reads
  `{ active, over }` and re-renders only when `select`'s result changes.

| Component        | Props                                                                                                                                                  |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| DragDropProvider | `onDragEnd` (required), `onDragStart`, `onDragCancel`, `feedback` (`true`)                                                                             |
| Draggable        | `id` (required), `data`, `preview`, `onPress`, `disabled`, `style`, `accessibilityLabel`                                                               |
| Droppable        | `id` (required), `data`, `accept`, `orientation` (`"vertical"`), `disabled`, `indicator` (`true`), `style`, `children` (node or `({ isOver, index })`) |
| Hooks            | `useDragDrop()` → `{ active }`, `useDragState(select)`, `useDragScroll()` → props for the scroll view                                                  |

Not yet: horizontal auto-scroll, a keyboard way to move an item, a separate drag handle, an
insertion index for lists that wrap (one row or column per zone; a grid places by `over.rect`).

---

## 9. Component Index

**Foundations**: Typography, Divider, Paper, Card, Card.Title/Content/Cover/Actions, Icon, TouchableRipple
**Layout**: Box, Center, Stack/HStack/VStack, Spacer, Grid, GridLayout, AspectRatio, AbsoluteCenter, Break, ScrollArea, Visible/useBreakpointValue
**Actions**: Button, ProgressButton, IconButton, Link, Clipboard/useClipboard, Download/useDownload, FAB, SpeedDial, ToggleButton, ToggleButtonGroup, ButtonGroup, SplitButton, Chip, ChipGroup
**Inputs**: Input, InputArea, PasswordField, Editable, Select, Autocomplete, PinInput, Upload, Form (FormField, useForm, useFormField, useWatch, useFormState), FormControl, HelperText, Checkbox, CheckboxGroup, RadioButton/RadioGroup, Switch, Slider, NumberField, SearchBar, DateTimePicker/DatePicker/TimePicker, Rating
**Data display**: Avatar, Badge, StatusBadge, Blink, DataGrid, Table, ListItem, ListSection/ListSubheader, Tree, Tooltip, Accordion, Carousel, Stat, CaptionValue, Image, IFrame, CodeBlock/HighlightedCode, QrCode
**Feedback & overlays**: Snackbar, ToastProvider/useToast, Banner, Dialog, AlertDialog, Popover, HoverCard, BottomSheet, Menu, Portal/Portal.Host, Skeleton, CircularProgress, LinearProgress, EmptyState, Collapse
**Navigation**: AppBar, NavBar, NavigationRail, Drawer/DrawerItem/DrawerSection, Toolbar, Tabs, Breadcrumbs, Pagination, Stepper
**Drag and drop**: DragDropProvider/useDragDrop, Draggable, Droppable

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
