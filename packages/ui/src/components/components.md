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

`fontFamily: System` for all. `variant` prop selects one.

| Variant        | Size | Line | Weight | Tracking |
| -------------- | ---- | ---- | ------ | -------- |
| displayLarge   | 57   | 64   | 400    | -0.25    |
| displayMedium  | 45   | 52   | 400    | 0        |
| displaySmall   | 36   | 44   | 400    | 0        |
| headlineLarge  | 32   | 40   | 400    | 0        |
| headlineMedium | 28   | 36   | 400    | 0        |
| headlineSmall  | 24   | 32   | 400    | 0        |
| titleLarge     | 22   | 28   | 400    | 0        |
| titleMedium    | 16   | 24   | 500    | 0.15     |
| titleSmall     | 14   | 20   | 500    | 0.1      |
| bodyLarge      | 16   | 24   | 400    | 0.5      |
| bodyMedium     | 14   | 20   | 400    | 0.25     |
| bodySmall      | 12   | 16   | 400    | 0.4      |
| labelLarge     | 14   | 20   | 500    | 0.1      |
| labelMedium    | 12   | 16   | 500    | 0.5      |
| labelSmall     | 11   | 16   | 500    | 0.5      |

### 1.4 Spacing & Shape

- **Spacing**: `xs:4  s:8  m:16  l:24  xl:32`
- **Shape (corner radius)**: `small:8  medium:12  large:16  extraLarge:28`

### 1.5 Theme utilities

- `useTheme()` → `{ theme, isDark, toggleTheme }`. Syncs with OS scheme + manual toggle.
- `getStateColor(bg, on, state)` → composites a hover/press state-layer color over a base.
- `getGlowStyles(theme, active, variant?)` → the M3 "glow" focus/hover ring (variant `"error"` for error state).

### 1.6 Shared type

`MaterialCommunityIconsGlyphs` — icon names are kebab-case strings (e.g. `"plus"`, `"bell-outline"`).
Outline variants append `-outline`. Any prop typed "icon" below takes one of these.

---

## 2. Foundations

### Typography

Renders themed text at an M3 scale.

| Prop     | Type                     | Default        | Req | Description  |
| -------- | ------------------------ | -------------- | --- | ------------ |
| children | ReactNode                | —              | ✓   | Text content |
| variant  | typography key (see 1.3) | `displayLarge` |     | Type scale   |
| style    | TextStyle                |                |     | Override     |

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
| onPress            | () => void                                       |          |     | Makes it interactive (button role) |
| accessibilityLabel | string                                           |          |     |                                    |
| style              | ViewStyle                                        |          |     |                                    |

---

## 3. Buttons & Actions

### Button

| Prop               | Type                                          | Default              | Req | Description                |
| ------------------ | --------------------------------------------- | -------------------- | --- | -------------------------- |
| children           | ReactNode                                     |                      |     | Label                      |
| onPress            | () => void                                    |                      |     |                            |
| mode               | `"filled" \| "tonal" \| "outlined" \| "text"` | `filled`             |     |                            |
| iconName           | icon                                          |                      |     | Leading/trailing icon      |
| iconPosition       | `"left" \| "right"`                           | `left`               |     |                            |
| iconStyle          | object                                        |                      |     |                            |
| size               | number                                        | `theme.shape.medium` |     | Icon size                  |
| fullWidth          | boolean                                       | `false`              |     | Stretch to parent width    |
| disabled           | boolean                                       | `false`              |     |                            |
| loading            | boolean                                       | `false`              |     | Shows inline spinner       |
| accessibilityLabel | string                                        |                      |     | Falls back to string child |
| style              | object                                        |                      |     |                            |

### IconButton

Square, icon-only action. `Button` with only an icon comes out pill-shaped and label-padded.

| Prop               | Type                                              | Default    | Req | Description                                  |
| ------------------ | ------------------------------------------------- | ---------- | --- | -------------------------------------------- |
| icon               | icon                                              | —          | ✓   |                                              |
| accessibilityLabel | string                                            | —          | ✓   | Required: an icon carries no accessible name |
| onPress            | () => void                                        |            |     |                                              |
| mode               | `"standard" \| "filled" \| "tonal" \| "outlined"` | `standard` |     |                                              |
| size               | `"small" \| "medium" \| "large"`                  | `medium`   |     | 32 / 40 / 48                                 |
| selected           | boolean                                           |            |     | M3 toggle-icon-button state                  |
| loading            | boolean                                           |            |     | Inline spinner                               |
| disabled           | boolean                                           |            |     |                                              |
| style              | ViewStyle                                         |            |     |                                              |

### Link

Inline navigational text.

| Prop             | Type                            | Default                  | Req | Description                                                  |
| ---------------- | ------------------------------- | ------------------------ | --- | ------------------------------------------------------------ |
| children         | string                          | —                        | ✓   | Label                                                        |
| href             | string                          |                          |     | Opened with `Linking.openURL`; ignored when `onPress` is set |
| onPress          | () => void                      |                          |     |                                                              |
| variant          | typography key                  | `bodyMedium`             |     |                                                              |
| underline        | `"always" \| "hover" \| "none"` | `hover`                  |     |                                                              |
| showExternalIcon | boolean                         | `true` for remote `href` |     |                                                              |
| externalIcon     | icon                            | `open-in-new`            |     |                                                              |
| color            | string                          | `colors.primary`         |     |                                                              |
| disabled         | boolean                         |                          |     |                                                              |

### FAB (Floating Action Button)

Absolutely positioned; respects safe-area insets.

| Prop     | Type                                                           | Default        | Req | Description                       |
| -------- | -------------------------------------------------------------- | -------------- | --- | --------------------------------- |
| icon     | icon                                                           | —              | ✓   |                                   |
| onPress  | () => void                                                     | —              | ✓   |                                   |
| label    | string                                                         |                |     | Shown only when `size="extended"` |
| size     | `"small" \| "regular" \| "large" \| "extended"`                | `regular`      |     |                                   |
| position | `"bottom-right" \| "bottom-left" \| "top-right" \| "top-left"` | `bottom-right` |     |                                   |
| disabled | boolean                                                        |                |     |                                   |
| style    | ViewStyle                                                      |                |     |                                   |

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

### Chip

| Prop     | Type                                | Default  | Req | Description                  |
| -------- | ----------------------------------- | -------- | --- | ---------------------------- |
| label    | string                              | —        | ✓   |                              |
| onPress  | () => void                          |          |     | Makes body pressable         |
| onClose  | () => void                          |          |     | Renders a trailing close (X) |
| icon     | icon                                |          |     | Leading icon                 |
| selected | boolean                             | `false`  |     | Shows check + tertiary tone  |
| mode     | `"filled" \| "tonal" \| "outlined"` | `filled` |     |                              |
| size     | `"small" \| "medium"`               | `medium` |     | small = 24px                 |
| disabled | boolean                             | `false`  |     |                              |
| style    | object                              |          |     |                              |

---

## 4. Inputs & Forms

### Input

Text field, outlined or filled; supports affixes, icons, multiline, number mode.

| Prop                       | Type                     | Default    | Req | Description                          |
| -------------------------- | ------------------------ | ---------- | --- | ------------------------------------ |
| value                      | string                   | —          | ✓   |                                      |
| onChangeText               | (text) => void           | —          | ✓   |                                      |
| label                      | string                   |            |     |                                      |
| placeholder                | string                   |            |     |                                      |
| type                       | `"text" \| "number"`     | `text`     |     | number = decimal keypad + sanitizing |
| variant                    | `"outlined" \| "filled"` | `outlined` |     |                                      |
| precision                  | number                   |            |     | Decimal places (number type)         |
| prefix / suffix            | string                   |            |     | Inline affix text                    |
| leadingIcon / trailingIcon | icon                     |            |     |                                      |
| onTrailingIconPress        | () => void               |            |     |                                      |
| error                      | string                   |            |     | Error message + error styling        |
| helperText                 | string                   |            |     | Hidden while error shown             |
| required                   | boolean                  |            |     | Asterisk on label                    |
| disabled                   | boolean                  |            |     |                                      |
| readonly                   | boolean                  |            |     |                                      |
| secureTextEntry            | boolean                  |            |     | Password mode                        |
| maxLength                  | number                   |            |     |                                      |
| multiline                  | boolean                  | `false`    |     |                                      |
| numberOfLines              | number                   | `4`        |     |                                      |
| minHeight                  | number                   | `56`       |     |                                      |
| onFocus / onBlur           | () => void               |            |     |                                      |
| style                      | ViewStyle                |            |     |                                      |

### NumericInput

Thin wrapper over `Input` with `type="number"`.

| Prop                                  | Type                     | Default    | Description    |
| ------------------------------------- | ------------------------ | ---------- | -------------- |
| value                                 | string                   | —          | Required       |
| onChangeText                          | (text) => void           | —          | Required       |
| label / placeholder / prefix / suffix | string                   |            |                |
| precision                             | number                   |            | Decimal places |
| variant                               | `"outlined" \| "filled"` | `outlined` |                |
| error                                 | string                   |            |                |
| disabled / readonly                   | boolean                  |            |                |
| minHeight                             | number                   | `56`       |                |
| style                                 | ViewStyle                |            |                |

### Select

Dropdown built on Popover; single or multi select, optional chip display.

| Prop                | Type                     | Default            | Req | Description                   |
| ------------------- | ------------------------ | ------------------ | --- | ----------------------------- |
| options             | `Option[]`               | —                  | ✓   | `{ id, label, value, icon? }` |
| value               | any                      | —                  | ✓   | Selected value (single)       |
| onSelect            | (value) => void          | —                  | ✓   |                               |
| label               | string                   |                    |     |                               |
| placeholder         | string                   | `Select an option` |     |                               |
| variant             | `"outlined" \| "filled"` | `outlined`         |     |                               |
| error               | string                   |                    |     |                               |
| disabled            | boolean                  |                    |     |                               |
| multiSelect         | boolean                  | `false`            |     |                               |
| showAsChips         | boolean                  | `false`            |     | Render selection as chips     |
| selectedValues      | any[]                    | `[]`               |     | Multi-select value set        |
| toggleOptions       | (value) => void          |                    |     | Multi-select handler          |
| style / optionStyle | object                   |                    |     |                               |

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

### Toggle (Switch)

Animated M3 switch, fully configurable dimensions.

| Prop              | Type            | Default | Req | Description         |
| ----------------- | --------------- | ------- | --- | ------------------- |
| value             | boolean         | —       | ✓   |                     |
| onValueChange     | (value) => void | —       | ✓   |                     |
| disabled          | boolean         | `false` |     |                     |
| width             | number          | `32`    |     |                     |
| height            | number          | `18`    |     |                     |
| trackBorderWidth  | number          | `2`     |     |                     |
| animationDuration | number (ms)     | `200`   |     |                     |
| thumbOffSizeRatio | number          | `0.8`   |     | Thumb size when off |
| thumbOnSizeRatio  | number          | `0.9`   |     | Thumb size when on  |
| containerStyle    | ViewStyle       |         |     |                     |

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

### Spinner (Number stepper)

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

| Prop         | Type           | Default | Req | Description                      |
| ------------ | -------------- | ------- | --- | -------------------------------- |
| value        | string         | —       | ✓   |                                  |
| onChangeText | (text) => void | —       | ✓   |                                  |
| onSubmit     | (text) => void |         |     |                                  |
| onClear      | () => void     |         |     | After clear button empties field |
| placeholder  | string         |         |     |                                  |
| leadingIcon  | icon           |         |     |                                  |
| disabled     | boolean        |         |     |                                  |
| autoFocus    | boolean        |         |     |                                  |
| style        | ViewStyle      |         |     |                                  |

### DateTimePicker

Field that opens a Material 3 date/time picker. There is no OS picker underneath: the same
in-house surface renders everywhere — a dialog on native, a popover docked to the field on web —
so the picker follows the theme on all three platforms. Every locale-dependent label — month and
weekday names, week start, 12h/24h, AM/PM, typed-entry field order, day announcements — is derived
from `Intl` and memoized per locale; nothing is hardcoded to a language. Relative day labels
(Today/Yesterday/Tomorrow) come from `Intl.RelativeTimeFormat` unless overridden.

`DatePicker`, `DateRangePicker`, `TimePicker` and `DatePickerInput` are the same component with
`mode` / `selectionMode` / `inputEnabled` locked.

| Prop                | Type                                       | Default       | Req | Description                                                         |
| ------------------- | ------------------------------------------ | ------------- | --- | ------------------------------------------------------------------- |
| value               | `Date \| null` · `DateRange` · `Date[]`    | —             | ✓   | Shape follows `selectionMode`                                       |
| onChange            | matching setter                            | —             | ✓   | Single mode is never called with `null`; clearing goes to `onClear` |
| label               | string                                     |               |     | Also labels the typed-entry field inside the dialog                 |
| mode                | `"date" \| "datetime" \| "time"`           | `date`        |     | `datetime` collects the day, then the time                          |
| selectionMode       | `"single" \| "range" \| "multiple"`        | `single`      |     | Ignored when `mode="time"`                                          |
| validRange          | `{ startDate?, endDate?, disabledDates? }` |               |     | Inclusive bounds compared at day granularity                        |
| isDateDisabled      | (date) => boolean                          |               |     | For rules `validRange` cannot express                               |
| scrollMode          | `"endless" \| "paged"`                     | `endless`     |     | `endless` virtualizes the months in one list                        |
| inputEnabled        | boolean                                    | `true`        |     | Typed entry in the field and the calendar↔keyboard toggle           |
| defaultInputType    | `"picker" \| "keyboard"`                   | `picker`      |     | Which surface the dialog opens on                                   |
| use24HourClock      | boolean                                    | locale's own  |     | `true` forces the 24-hour dial                                      |
| minuteInterval      | `1\|2\|3\|4\|5\|6\|10\|12\|15\|20\|30`     | `1`           |     | Granularity the dial snaps to                                       |
| startYear / endYear | number                                     | ±100 years    |     | Bounds of the year grid and the endless scroller                    |
| placeholder         | string                                     |               |     | Shown while the value is empty                                      |
| clearable           | boolean                                    |               |     | Adds a clear button; needs `onClear`                                |
| onClear             | () => void                                 |               |     |                                                                     |
| error               | string                                     |               |     | Error text; also recolors the field                                 |
| helperText          | string                                     |               |     | Hidden while `error` is set                                         |
| required            | boolean                                    |               |     | Appends `*` to the label                                            |
| locale              | string                                     | device locale |     | Formatting/labelling override                                       |
| firstDayOfWeek      | 0–6 (0 = Sunday)                           | locale's own  |     |                                                                     |
| labels              | `DateTimePickerLabels`                     | English       |     | Chrome strings (`selectDate`, `confirm`, `next`, …)                 |
| relativeLabels      | `{ today?, yesterday?, tomorrow? }`        | `Intl`        |     |                                                                     |
| defaultOpen         | boolean                                    | `false`       |     | Mount with the picker open                                          |
| disabled            | boolean                                    |               |     |                                                                     |
| style               | ViewStyle                                  |               |     |                                                                     |
| testID              | string                                     |               |     |                                                                     |

**Typed entry.** The field accepts a date typed in the locale's own order (`22/11/2026` in
`it-IT`, `11/22/2026` in `en-US`), validated against `validRange` on blur. Only a single calendar
date is typable in the field itself; a range types its two ends inside the dialog, reached from
the pencil toggle in its header. `multiple` has no typed form, so the toggle is hidden there.

**Keyboard (web).** Arrows = day/week, PageUp/PageDown = month (Shift = year), Home/End = ends of
the week, Enter/Space = select, Escape = close.

### Calendar

The month grid used by `DateTimePicker`, exported on its own. Cross-platform, with month and year
sub-views and virtualized endless scrolling.

| Prop                | Type                                       | Default       | Req | Description                                       |
| ------------------- | ------------------------------------------ | ------------- | --- | ------------------------------------------------- |
| selectionMode       | `"single" \| "range" \| "multiple"`        | `single`      |     |                                                   |
| value               | `Date \| null`                             |               |     | Selection in `single` mode                        |
| range               | `DateRange`                                |               |     | Selection in `range` mode                         |
| dates               | `Date[]`                                   |               |     | Selection in `multiple` mode                      |
| onChange            | (date) => void                             |               |     | `single` mode; always a start-of-day `Date`       |
| onRangeChange       | (range) => void                            |               |     | `range` mode                                      |
| onDatesChange       | (dates) => void                            |               |     | `multiple` mode                                   |
| validRange          | `{ startDate?, endDate?, disabledDates? }` |               |     | Whole-day comparison                              |
| isDateDisabled      | (date) => boolean                          |               |     |                                                   |
| scrollMode          | `"endless" \| "paged"`                     | `endless`     |     | `paged` shows the month dropdown and outside days |
| startYear / endYear | number                                     | ±100 years    |     |                                                   |
| locale              | string                                     | device locale |     |                                                   |
| firstDayOfWeek      | 0–6                                        | locale's own  |     |                                                   |
| labels              | `DateTimePickerLabels`                     | English       |     |                                                   |
| showToday           | boolean                                    | `true`        |     | "Today" shortcut row                              |
| keyboardNavigation  | boolean                                    | `true`        |     | Web only                                          |
| onRequestClose      | () => void                                 |               |     | Called on Escape                                  |

### ClockPicker

The Material 3 time surface: the hour and minute readouts double as the unit selector, with the
analog dial (or two text fields) underneath.

| Prop                      | Type                     | Default       | Req | Description                           |
| ------------------------- | ------------------------ | ------------- | --- | ------------------------------------- |
| value                     | Date                     | —             | ✓   |                                       |
| onChange                  | (date) => void           | —             | ✓   |                                       |
| minimumDate / maximumDate | Date                     |               |     | Only clamp on the boundary day itself |
| minuteInterval            | `MinuteInterval`         | `1`           |     |                                       |
| locale                    | string                   | device locale |     | Decides 12h vs 24h                    |
| use24HourClock            | boolean                  | from locale   |     | `true` forces the 24-hour face        |
| inputType                 | `"picker" \| "keyboard"` | `picker`      |     | Dial or text fields                   |
| labels                    | `DateTimePickerLabels`   | English       |     |                                       |

### ClockDial

The analog face on its own: a rotating hand with a knob, a ring of labels, and drag-to-set. Drawn
with plain Views, so it adds no SVG dependency.

| Prop                            | Type                        | Default | Req | Description                                          |
| ------------------------------- | --------------------------- | ------- | --- | ---------------------------------------------------- |
| unit                            | `"hours" \| "minutes"`      | —       | ✓   | Which unit the face is editing                       |
| hours                           | number (0–23)               | —       | ✓   | Always 24-hour, whatever the face shows              |
| minutes                         | number (0–59)               | —       | ✓   |                                                      |
| use24HourClock                  | boolean                     | `false` |     | Adds the inner 13–00 ring                            |
| minuteInterval                  | number                      | `1`     |     |                                                      |
| onChangeHours / onChangeMinutes | (value) => void             | —       | ✓   |                                                      |
| onUnitComplete                  | () => void                  |         |     | Fires when a press ends, to hand over to the minutes |
| isTimeDisabled                  | (hours, minutes) => boolean |         |     | Greys out and refuses values                         |

### TimeSelect

Scrollable hour/minute columns, plus a day-period column on 12-hour locales. Superseded by
`ClockPicker` inside the pickers; still exported for compact inline use.

| Prop                      | Type           | Default       | Req | Description                           |
| ------------------------- | -------------- | ------------- | --- | ------------------------------------- |
| value                     | Date           | —             | ✓   |                                       |
| onChange                  | (date) => void | —             | ✓   |                                       |
| minimumDate / maximumDate | Date           |               |     | Only clamp on the boundary day itself |
| minuteInterval            | number         | `1`           |     |                                       |
| locale                    | string         | device locale |     | Decides 12h vs 24h                    |
| use12Hour                 | boolean        | from locale   |     | Force the clock format                |

### PinInput

One-time-code / PIN entry: single-character cells that behave as one field. Typing advances,
Backspace retreats, pasting a whole code into any cell fills the row.

| Prop                                             | Type                          | Default   | Req | Description                  |
| ------------------------------------------------ | ----------------------------- | --------- | --- | ---------------------------- |
| value                                            | string                        | —         | ✓   |                              |
| onChangeText                                     | (value) => void               | —         | ✓   |                              |
| length                                           | number                        | `6`       |     |                              |
| onComplete                                       | (value) => void               |           |     | Fired once, on becoming full |
| type                                             | `"numeric" \| "alphanumeric"` | `numeric` |     |                              |
| mask                                             | boolean                       | `false`   |     | Renders dots                 |
| label / error / helperText / required / disabled |                               |           |     | As `Input`                   |
| autoFocus                                        | boolean                       |           |     | First cell only              |
| cellSize                                         | number                        | `48`      |     |                              |

### Autocomplete

Text field with a suggestion list. Free text allowed — this is not a `Select`. The list renders
inside the field's own container (a modal would steal focus from the input), so the parent must
not clip overflow while it is open.

| Prop                                                           | Type                       | Default                      | Req | Description                                 |
| -------------------------------------------------------------- | -------------------------- | ---------------------------- | --- | ------------------------------------------- |
| value                                                          | string                     | —                            | ✓   |                                             |
| onChangeText                                                   | (text) => void             | —                            | ✓   |                                             |
| options                                                        | `AutocompleteOption[]`     | —                            | ✓   | `{ id, label, value, description?, icon? }` |
| onSelect                                                       | (option) => void           | —                            | ✓   |                                             |
| filter                                                         | (option, query) => boolean | accent-insensitive substring |     | `() => true` for server-side filtering      |
| minChars                                                       | number                     | `1`                          |     |                                             |
| maxSuggestions                                                 | number                     | `8`                          |     |                                             |
| loading                                                        | boolean                    |                              |     | Spinner in the field                        |
| emptyMessage                                                   | string                     |                              |     | Omit to hide the list on no match           |
| label / placeholder / error / helperText / required / disabled |                            |                              |     | As `Input`                                  |
| leadingIcon                                                    | icon                       |                              |     |                                             |
| clearable                                                      | boolean                    | `true`                       |     |                                             |

**Keyboard (web).** ArrowUp/ArrowDown move the highlight, Enter selects, Escape closes.

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

Star rating; half-stars rendered, whole values on tap.

| Prop     | Type            | Default | Req | Description               |
| -------- | --------------- | ------- | --- | ------------------------- |
| value    | number          | —       | ✓   | Supports halves (3.5)     |
| onChange | (value) => void |         |     | Interactive when provided |
| max      | number          | `5`     |     |                           |
| size     | number          | `24`    |     |                           |
| disabled | boolean         |         |     |                           |

---

## 5. Data Display

### Avatar

| Prop                        | Type                                                | Default    | Req | Description                     |
| --------------------------- | --------------------------------------------------- | ---------- | --- | ------------------------------- |
| source                      | image source                                        |            |     | Image; else initials; else icon |
| name                        | string                                              |            |     | Initials fallback               |
| icon                        | icon                                                | `account`  |     | Icon fallback                   |
| size                        | number                                              | `40`       |     |                                 |
| variant                     | `"circular" \| "rounded" \| "square"`               | `circular` |     |                                 |
| status                      | `"online" \| "offline" \| "busy" \| "away" \| null` |            |     | Status dot                      |
| backgroundColor / textColor | string                                              |            |     |                                 |
| onPress                     | () => void                                          |            |     |                                 |

### Badge

Small count/dot overlay (position it over its target).

| Prop     | Type                 | Default | Description                |
| -------- | -------------------- | ------- | -------------------------- |
| count    | number               |         | Omit → dot                 |
| size     | `"small" \| "large"` | `large` | small = dot                |
| max      | number               | `99`    | Shows `max+` when exceeded |
| showZero | boolean              | `false` | Render at count 0          |
| visible  | boolean              | `true`  |                            |
| style    | any                  |         |                            |

### IconBadge

Icon button with an attached count badge.

| Prop       | Type       | Default   | Req | Description                    |
| ---------- | ---------- | --------- | --- | ------------------------------ |
| iconName   | icon       | —         | ✓   |                                |
| badgeCount | number     | —         | ✓   | Hidden when ≤ 0; caps at `99+` |
| size       | number     | `32`      |     |                                |
| badgeColor | string     | `error`   |     |                                |
| color      | string     | `primary` |     | Icon color                     |
| onPress    | () => void |           |     |                                |

### StatusBadge

Small labeled status pill (own semantic colors, light/dark aware).

| Prop  | Type                                | Default   | Req | Description                    |
| ----- | ----------------------------------- | --------- | --- | ------------------------------ |
| label | string                              | —         | ✓   |                                |
| type  | `"success" \| "error" \| "warning"` | `success` |     |                                |
| icon  | icon                                |           |     | Override default per-type icon |

### DataGrid

Virtualized table: sortable columns, reorder, density, loading, empty state. Also exports composable primitives `Table, Thead, Tfoot, Tr, Th, Td`.

| Prop                           | Type                          | Default  | Req | Description                        |
| ------------------------------ | ----------------------------- | -------- | --- | ---------------------------------- |
| data                           | any[]                         | —        | ✓   | Row objects                        |
| columns                        | `ColumnDefinition[]`          | —        | ✓   | `{ id, label, width?, sortable? }` |
| loading                        | boolean                       | `false`  |     |                                    |
| density                        | `"normal" \| "dense"`         | `normal` |     |                                    |
| sortColumn                     | string                        |          |     |                                    |
| sortDirection                  | `"asc" \| "desc"`             |          |     |                                    |
| onSort                         | (columnId, direction) => void |          |     |                                    |
| onColumnReorder                | (newColumns) => void          |          |     |                                    |
| onEndReached                   | () => void                    |          |     | Infinite scroll                    |
| onEndReachedThreshold          | number                        |          |     |                                    |
| emptyMessage                   | string                        |          |     | Shown when empty & not loading     |
| style / rowStyle / headerStyle | ViewStyle                     |          |     |                                    |

### ListItem

Single pressable list row (centered title text).

| Prop                                                                     | Type       | Default | Req | Description             |
| ------------------------------------------------------------------------ | ---------- | ------- | --- | ----------------------- |
| children                                                                 | ReactNode  | —       | ✓   | Label                   |
| onPress                                                                  | () => void |         |     | Adds hover/press states |
| itemContainerStyle / itemTextStyle / itemPressedStyle / itemHoveredStyle | object     |         |     | Style overrides         |

### Tooltip

Wraps a child; shows a bubble on hover (web) / long-press (native).

| Prop      | Type                                     | Default | Req | Description      |
| --------- | ---------------------------------------- | ------- | --- | ---------------- |
| content   | string                                   | —       | ✓   |                  |
| children  | ReactNode                                | —       | ✓   | Anchor           |
| position  | `"top" \| "bottom" \| "left" \| "right"` | `top`   |     |                  |
| disabled  | boolean                                  |         |     |                  |
| hideDelay | number (ms)                              | `1500`  |     | Native auto-hide |

### Accordion

Expandable section with animated height.

| Prop               | Type               | Default | Req | Description |
| ------------------ | ------------------ | ------- | --- | ----------- |
| title              | string             | —       | ✓   |             |
| children           | ReactNode          | —       | ✓   | Content     |
| startExpanded      | boolean            | `false` |     |             |
| onPress            | (expanded) => void |         |     |             |
| style / titleStyle | style              |         |     |             |

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

| Prop              | Type                       | Default | Req | Description                    |
| ----------------- | -------------------------- | ------- | --- | ------------------------------ |
| label             | string                     | —       | ✓   | What the number measures       |
| value             | string                     | —       | ✓   | Pre-formatted by the caller    |
| delta             | string                     |         |     | e.g. `"12.5%"`                 |
| trend             | `"up" \| "down" \| "flat"` |         |     | Arrow + color for `delta`      |
| invertTrendColors | boolean                    | `false` |     | For metrics where down is good |
| helpText          | string                     |         |     |                                |
| icon              | icon                       |         |     |                                |

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

---

## 6. Feedback & Overlays

### Snackbar

Bottom transient message; animated in/out.

| Prop      | Type                                | Default   | Req | Description            |
| --------- | ----------------------------------- | --------- | --- | ---------------------- |
| visible   | boolean                             | —         | ✓   |                        |
| message   | string                              | —         | ✓   |                        |
| onDismiss | () => void                          | —         | ✓   |                        |
| duration  | number (ms)                         | `4000`    |     | 0 = no auto-hide       |
| action    | `{ label, onPress }`                |           |     | Trailing action button |
| type      | `"default" \| "success" \| "error"` | `default` |     |                        |
| icon      | icon                                |           |     | Override leading icon  |

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

### Modal

Centered dialog surface.

| Prop          | Type                          | Default | Req | Description                 |
| ------------- | ----------------------------- | ------- | --- | --------------------------- |
| visible       | boolean                       |         |     |                             |
| children      | ReactNode \| string           | —       | ✓   | Body (string → styled text) |
| title         | string                        |         |     |                             |
| animationType | `"none" \| "slide" \| "fade"` | `fade`  |     |                             |
| transparent   | boolean                       | `true`  |     |                             |
| onClose       | () => void                    |         |     | Renders a close button      |
| onDismiss     | () => void                    |         |     | Android back / ESC          |
| closeText     | string                        | `Close` |     |                             |

### ConfirmDialog

Modal preset with confirm/cancel actions.

| Prop        | Type       | Default   | Req | Description |
| ----------- | ---------- | --------- | --- | ----------- |
| visible     | boolean    | —         | ✓   |             |
| onConfirm   | () => void | —         | ✓   |             |
| onCancel    | () => void | —         | ✓   |             |
| title       | string     |           |     |             |
| message     | string     |           |     |             |
| confirmText | string     | `Confirm` |     |             |
| cancelText  | string     | `Cancel`  |     |             |

### Popover

Anchored floating panel; auto-positions within the viewport.

| Prop             | Type         | Default | Req | Description               |
| ---------------- | ------------ | ------- | --- | ------------------------- |
| anchor           | ReactElement | —       | ✓   | Trigger element           |
| children         | ReactNode    | —       | ✓   | Panel content             |
| visible          | boolean      | —       | ✓   |                           |
| onDismiss        | () => void   | —       | ✓   |                           |
| matchAnchorWidth | boolean      | `false` |     | Constrain to anchor width |

### BottomSheet

Draggable bottom sheet with scrim.

| Prop              | Type       | Default | Req | Description                      |
| ----------------- | ---------- | ------- | --- | -------------------------------- |
| visible           | boolean    | —       | ✓   |                                  |
| onDismiss         | () => void | —       | ✓   |                                  |
| children          | ReactNode  | —       | ✓   |                                  |
| title             | string     |         |     |                                  |
| showHandle        | boolean    | `true`  |     | Drag handle                      |
| dismissOnScrimTap | boolean    | `true`  |     |                                  |
| maxHeightRatio    | number     |         |     | Max height as fraction of window |

### Menu

Anchored action menu.

| Prop          | Type         | Default | Req | Description                                                                        |
| ------------- | ------------ | ------- | --- | ---------------------------------------------------------------------------------- |
| anchor        | ReactElement | —       | ✓   |                                                                                    |
| items         | `MenuItem[]` | —       | ✓   | `{ id, label, icon?, trailing?, disabled?, destructive?, dividerAbove?, onPress }` |
| visible       | boolean      | —       | ✓   |                                                                                    |
| onDismiss     | () => void   | —       | ✓   |                                                                                    |
| closeOnSelect | boolean      | `true`  |     |                                                                                    |

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

Indeterminate spinner (SVG).

| Prop        | Type        | Default   | Description     |
| ----------- | ----------- | --------- | --------------- |
| size        | number      | `48`      |                 |
| strokeWidth | number      | `4`       |                 |
| color       | string      | `primary` |                 |
| duration    | number (ms) | `1000`    | Rotation period |

### LinearProgress

Determinate or indeterminate bar.

| Prop                  | Type        | Default                   | Description            |
| --------------------- | ----------- | ------------------------- | ---------------------- |
| progress              | number 0–1  | `0`                       | Determinate value      |
| indeterminate         | boolean     | `false`                   |                        |
| height                | number      | `4`                       |                        |
| color                 | string      | `primary`                 |                        |
| trackColor            | string      | `surfaceContainerHighest` |                        |
| duration              | number (ms) | `500`                     | Determinate transition |
| indeterminateDuration | number (ms) | `1500`                    |                        |

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

```tsx
const toast = useToast();
toast.success("Saved");
toast.error("Upload failed", { action: { label: "Retry", onPress: retry } });
toast.show({ id: "sync", message: "Syncing…", duration: 8000 }); // same id replaces
toast.hide(); // clears the queue
```

| `ToastOptions` | Type                                | Default     | Description                                                  |
| -------------- | ----------------------------------- | ----------- | ------------------------------------------------------------ |
| message        | string                              | —           |                                                              |
| type           | `"default" \| "success" \| "error"` | `default`   | Container colors + default icon                              |
| duration       | number (ms)                         | `4000`      |                                                              |
| icon           | icon                                | from `type` |                                                              |
| action         | `{ label, onPress }`                |             |                                                              |
| id             | string                              |             | Replaces a queued toast with the same id instead of stacking |

---

## 7. Navigation

### AppBar

Top app bar; integrates with the navigator (drawer/back, title, right actions). Props are
navigator-shaped (`navigation`, `route`, `options`, `back`, `isPinned`) — framework-specific,
adapt to the chosen router.

### NavigationBar

Bottom navigation bar.

| Prop        | Type                     | Default  | Req | Description                                   |
| ----------- | ------------------------ | -------- | --- | --------------------------------------------- |
| items       | `NavigationBarItem[]`    | —        | ✓   | `{ id, label, icon, badgeCount?, disabled? }` |
| activeId    | string                   | —        | ✓   |                                               |
| onItemPress | (id) => void             | —        | ✓   |                                               |
| showLabels  | `"always" \| "selected"` | `always` |     |                                               |

### Tabs

Top tab bar with animated indicator; text-only or icon tabs.

| Prop      | Type                              | Default | Req | Description |
| --------- | --------------------------------- | ------- | --- | ----------- |
| tabs      | `string[]` \| `{ label, icon }[]` | —       | ✓   |             |
| activeTab | number (index)                    | —       | ✓   |             |
| onChange  | (index) => void                   | —       | ✓   |             |

### Breadcrumbs

| Prop      | Type               | Default         | Req | Description                      |
| --------- | ------------------ | --------------- | --- | -------------------------------- |
| items     | `BreadcrumbItem[]` | —               | ✓   | `{ id, label, icon?, onPress? }` |
| separator | icon               | `chevron-right` |     |                                  |
| maxItems  | number             |                 |     | Collapse middle behind ellipsis  |

### Pagination

| Prop          | Type             | Default | Req | Description                |
| ------------- | ---------------- | ------- | --- | -------------------------- |
| page          | number (1-based) | —       | ✓   |                            |
| totalPages    | number           | —       | ✓   |                            |
| onPageChange  | (page) => void   | —       | ✓   |                            |
| siblingCount  | number           | `1`     |     | Pages each side of current |
| showFirstLast | boolean          | `false` |     | First/last arrows          |
| disabled      | boolean          |         |     |                            |

### Stepper

Horizontal progress steps.

| Prop        | Type                               | Default | Req | Description          |
| ----------- | ---------------------------------- | ------- | --- | -------------------- |
| steps       | `string[]` \| `{ label, icon? }[]` | —       | ✓   |                      |
| activeStep  | number (index)                     | —       | ✓   |                      |
| onStepPress | (stepIndex) => void                |         |     | Makes steps tappable |
| style       | object                             |         |     |                      |

---

## 8. Layout Primitives

Token-driven layout, so screens stop hardcoding spacing. `SpacingValue` is a `theme.spacing` key
(`"xs" | "s" | "m" | "l" | "xl"`) or a raw number; `RadiusValue` is a `theme.shape` key or a raw
number; `ColorValue` is an M3 color role name or any raw color string.

### Box

A `View` that reads spacing, shape and color off the theme. Anything not covered by a prop still
goes through `style`.

| Prop                      | Type             | Description                         |
| ------------------------- | ---------------- | ----------------------------------- |
| p, px, py, pt, pr, pb, pl | SpacingValue     | Padding — narrowest wins, as in CSS |
| m, mx, my, mt, mr, mb, ml | SpacingValue     | Margin                              |
| bg                        | ColorValue       | Background                          |
| radius                    | RadiusValue      | Corner radius                       |
| borderWidth               | number           |                                     |
| borderColor               | ColorValue       |                                     |
| flex                      | number           |                                     |
| gap                       | SpacingValue     |                                     |
| align / justify           | ViewStyle values | `alignItems` / `justifyContent`     |
| width / height            | ViewStyle values |                                     |
| row                       | boolean          | Horizontal instead of vertical      |
| wrap                      | boolean          |                                     |

Extends `ViewProps`.

### Stack / HStack / VStack

Evenly spaced children via `gap`, so spacing stays correct when children are conditionally
rendered. `HStack` and `VStack` lock the axis.

| Prop      | Type                         | Default    | Description           |
| --------- | ---------------------------- | ---------- | --------------------- |
| direction | `"vertical" \| "horizontal"` | `vertical` |                       |
| spacing   | SpacingValue                 | `"s"`      | Gap between children  |
| reverse   | boolean                      |            | Reverses visual order |

Plus every `Box` prop except `row` and `gap`.

### Center

Centres its children on both axes. Every `Box` prop except `align` and `justify`.

### Spacer

| Prop | Type                         | Default    | Description                              |
| ---- | ---------------------------- | ---------- | ---------------------------------------- |
| size | SpacingValue                 |            | Fixed gap; omit to absorb leftover space |
| axis | `"vertical" \| "horizontal"` | `vertical` | Which axis `size` applies to             |

### Grid

Equal-width grid. Children are chunked into explicit rows rather than left to wrap, so the gap
never pushes a cell onto the next line and a short last row keeps its cells at column width.

| Prop          | Type         | Default | Description                                        |
| ------------- | ------------ | ------- | -------------------------------------------------- |
| columns       | number       | `2`     | Ignored when `minChildWidth` is set                |
| minChildWidth | number       |         | Fits as many columns of at least this width as fit |
| spacing       | SpacingValue | `"s"`   |                                                    |

### AspectRatio

| Prop  | Type   | Default | Description                        |
| ----- | ------ | ------- | ---------------------------------- |
| ratio | number | `1`     | Width ÷ height — `16 / 9`, `4 / 3` |

---

## 9. Component Index (58)

**Foundations**: Typography, Divider, Paper, Card
**Layout**: Box, Stack/HStack/VStack, Center, Spacer, Grid, AspectRatio
**Actions**: Button, IconButton, Link, FAB, SpeedDial, ToggleButton, ToggleButtonGroup, Chip
**Inputs**: Input, NumericInput, Select, Autocomplete, PinInput, FormControl, Checkbox, RadioButton/RadioGroup, Toggle, Slider, Spinner, SearchBar, DateTimePicker/DatePicker/DatePickerInput/DateRangePicker/TimePicker, Calendar, ClockPicker, ClockDial, TimeSelect, Rating
**Data display**: Avatar, Badge, IconBadge, StatusBadge, DataGrid, ListItem, Tooltip, Accordion, Carousel, Stat, Image
**Feedback & overlays**: Snackbar, ToastProvider/useToast, Banner, Modal, ConfirmDialog, Popover, BottomSheet, Menu, Skeleton, CircularProgress, LinearProgress, EmptyState, Collapse
**Navigation**: AppBar, NavigationBar, Tabs, Breadcrumbs, Pagination, Stepper

---

## 10. Framework Selection Notes

Requirements this kit implies for a target framework:

- **Theming**: runtime light/dark token switch, component-level theme access (context/hook or CSS vars).
- **Cross-platform** (if keeping native + web): React Native / Expo, or split web (React/Vue/Svelte) + native.
- **Animation**: springs/timing for Toggle, Tabs indicator, SpeedDial, Snackbar, BottomSheet, Carousel.
- **Overlays/portals**: Modal, Popover, Menu, BottomSheet, Tooltip need portal/z-index layering + outside-viewport positioning.
- **Icons**: a Material Community icon set (kebab-case names, outline variants).
- **SVG**: CircularProgress uses SVG stroke animation.
- **Accessibility**: roles + states across all interactive components.

If web-only: React + a headless primitive lib (Radix/Ark) + CSS-vars theming maps cleanly.
If keeping mobile: stay on Expo React Native, or React Native Web for shared code.
