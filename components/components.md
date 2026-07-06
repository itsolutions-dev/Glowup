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

| Token | Light | Dark |
|---|---|---|
| primary / onPrimary | `#6750A4` / `#FFFFFF` | `#D0BCFF` / `#381E72` |
| primaryContainer / onPrimaryContainer | `#EADDFF` / `#21005D` | `#4F378B` / `#EADDFF` |
| secondary / onSecondary | `#625B71` / `#FFFFFF` | `#CCC2DC` / `#332D41` |
| secondaryContainer / onSecondaryContainer | `#E8DEF8` / `#1D192B` | `#4A4458` / `#E8DEF8` |
| tertiary / onTertiary | `#7D5260` / `#FFFFFF` | `#EFB8C8` / `#492532` |
| tertiaryContainer / onTertiaryContainer | `#FFD8E4` / `#31111D` | `#633B48` / `#FFD8E4` |
| error / onError | `#B3261E` / `#FFFFFF` | `#F2B8B5` / `#601410` |
| errorContainer / onErrorContainer | `#F9DEDC` / `#410E0B` | `#8C1D18` / `#F9DEDC` |
| background / onBackground | `#FEF7FF` / `#1D1B20` | `#141218` / `#E6E1E5` |
| surface / onSurface | `#FEF7FF` / `#1D1B20` | `#141218` / `#E6E1E5` |
| surfaceVariant / onSurfaceVariant | `#E7E0EC` / `#49454F` | `#49454F` / `#CAC4D0` |
| outline / outlineVariant | `#79747E` / `#CAC4D0` | `#938F99` / `#444746` |
| surfaceContainerLow / Container / High / Highest | `#F7F2FA` / `#F3EDF7` / `#ECE6F0` / `#EDE7F0` | `#1D1B20` / `#211F26` / `#2B2930` / `#36343B` |
| surfaceDim | `#DED8E1` | `#0F0D13` |
| shadow | `#000000` | `#000000` |

### 1.3 Typography scale (M3)
`fontFamily: System` for all. `variant` prop selects one.

| Variant | Size | Line | Weight | Tracking |
|---|---|---|---|---|
| displayLarge | 57 | 64 | 400 | -0.25 |
| displayMedium | 45 | 52 | 400 | 0 |
| displaySmall | 36 | 44 | 400 | 0 |
| headlineLarge | 32 | 40 | 400 | 0 |
| headlineMedium | 28 | 36 | 400 | 0 |
| headlineSmall | 24 | 32 | 400 | 0 |
| titleLarge | 22 | 28 | 400 | 0 |
| titleMedium | 16 | 24 | 500 | 0.15 |
| titleSmall | 14 | 20 | 500 | 0.1 |
| bodyLarge | 16 | 24 | 400 | 0.5 |
| bodyMedium | 14 | 20 | 400 | 0.25 |
| bodySmall | 12 | 16 | 400 | 0.4 |
| labelLarge | 14 | 20 | 500 | 0.1 |
| labelMedium | 12 | 16 | 500 | 0.5 |
| labelSmall | 11 | 16 | 500 | 0.5 |

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
| Prop | Type | Default | Req | Description |
|---|---|---|---|---|
| children | ReactNode | — | ✓ | Text content |
| variant | typography key (see 1.3) | `displayLarge` | | Type scale |
| style | TextStyle | | | Override |

### Divider
Horizontal or vertical rule, optionally with a centered label.
| Prop | Type | Default | Description |
|---|---|---|---|
| orientation | `"horizontal" \| "vertical"` | `horizontal` | |
| inset | number | `0` | Margin along the line |
| thickness | number | `1` | Line thickness |
| contentSpacing | number | `16` | Gap around label |
| children | ReactNode (string → label) | | Centered label (horizontal only) |
| style | ViewStyle | | |

### Paper
Elevated / tonal surface container.
| Prop | Type | Default | Req | Description |
|---|---|---|---|---|
| children | ReactNode | — | ✓ | |
| elevation | number 0–5 | `1` | | Maps to surface tone + shadow |
| outline | boolean | `false` | | 1px outlineVariant border |
| glow | boolean | `false` | | Use glow instead of shadow |
| style | ViewStyle | | | |

### Card
Pressable content surface.
| Prop | Type | Default | Req | Description |
|---|---|---|---|---|
| children | ReactNode | — | ✓ | |
| variant | `"elevated" \| "filled" \| "outlined" \| "glow"` | `filled` | | |
| onPress | () => void | | | Makes it interactive (button role) |
| accessibilityLabel | string | | | |
| style | ViewStyle | | | |

---

## 3. Buttons & Actions

### Button
| Prop | Type | Default | Req | Description |
|---|---|---|---|---|
| children | ReactNode | | | Label |
| onPress | () => void | | | |
| mode | `"filled" \| "tonal" \| "outlined" \| "text"` | `filled` | | |
| iconName | icon | | | Leading/trailing icon |
| iconPosition | `"left" \| "right"` | `left` | | |
| iconStyle | object | | | |
| size | number | `theme.shape.medium` | | Icon size |
| fullWidth | boolean | `false` | | Stretch to parent width |
| disabled | boolean | `false` | | |
| loading | boolean | `false` | | Shows inline spinner |
| accessibilityLabel | string | | | Falls back to string child |
| style | object | | | |

### FAB (Floating Action Button)
Absolutely positioned; respects safe-area insets.
| Prop | Type | Default | Req | Description |
|---|---|---|---|---|
| icon | icon | — | ✓ | |
| onPress | () => void | — | ✓ | |
| label | string | | | Shown only when `size="extended"` |
| size | `"small" \| "regular" \| "large" \| "extended"` | `regular` | | |
| position | `"bottom-right" \| "bottom-left" \| "top-right" \| "top-left"` | `bottom-right` | | |
| disabled | boolean | | | |
| style | ViewStyle | | | |

### SpeedDial
FAB that expands a stack of labeled actions.
| Prop | Type | Default | Req | Description |
|---|---|---|---|---|
| actions | `SpeedDialAction[]` | — | ✓ | `{ id, label, icon, onPress }` |
| mainIcon | icon | — | ✓ | Rotates 45° when open |
| position | same as FAB | `bottom-right` | | |

### ToggleButton
Single segment; usually used via `ToggleButtonGroup`.
| Prop | Type | Default | Req | Description |
|---|---|---|---|---|
| active | boolean | — | ✓ | Selected state |
| onPress | () => void | — | ✓ | |
| label | string | | | |
| icon | icon | | | |
| isFirst / isLast | boolean | | | Rounds outer corners in a group |
| style | ViewStyle | | | |

### ToggleButtonGroup
Segmented button set (single or multi select).
| Prop | Type | Default | Req | Description |
|---|---|---|---|---|
| options | `{ label?, icon?, value }[]` | — | ✓ | |
| value | string \| string[] | — | ✓ | Array when `multiSelect` |
| onValueChange | (val) => void | — | ✓ | |
| multiSelect | boolean | `false` | | |

### Chip
| Prop | Type | Default | Req | Description |
|---|---|---|---|---|
| label | string | — | ✓ | |
| onPress | () => void | | | Makes body pressable |
| onClose | () => void | | | Renders a trailing close (X) |
| icon | icon | | | Leading icon |
| selected | boolean | `false` | | Shows check + tertiary tone |
| mode | `"filled" \| "tonal" \| "outlined"` | `filled` | | |
| size | `"small" \| "medium"` | `medium` | | small = 24px |
| disabled | boolean | `false` | | |
| style | object | | | |

---

## 4. Inputs & Forms

### Input
Text field, outlined or filled; supports affixes, icons, multiline, number mode.
| Prop | Type | Default | Req | Description |
|---|---|---|---|---|
| value | string | — | ✓ | |
| onChangeText | (text) => void | — | ✓ | |
| label | string | | | |
| placeholder | string | | | |
| type | `"text" \| "number"` | `text` | | number = decimal keypad + sanitizing |
| variant | `"outlined" \| "filled"` | `outlined` | | |
| precision | number | | | Decimal places (number type) |
| prefix / suffix | string | | | Inline affix text |
| leadingIcon / trailingIcon | icon | | | |
| onTrailingIconPress | () => void | | | |
| error | string | | | Error message + error styling |
| helperText | string | | | Hidden while error shown |
| required | boolean | | | Asterisk on label |
| disabled | boolean | | | |
| readonly | boolean | | | |
| secureTextEntry | boolean | | | Password mode |
| maxLength | number | | | |
| multiline | boolean | `false` | | |
| numberOfLines | number | `4` | | |
| minHeight | number | `56` | | |
| onFocus / onBlur | () => void | | | |
| style | ViewStyle | | | |

### NumericInput
Thin wrapper over `Input` with `type="number"`.
| Prop | Type | Default | Description |
|---|---|---|---|
| value | string | — | Required |
| onChangeText | (text) => void | — | Required |
| label / placeholder / prefix / suffix | string | | |
| precision | number | | Decimal places |
| variant | `"outlined" \| "filled"` | `outlined` | |
| error | string | | |
| disabled / readonly | boolean | | |
| minHeight | number | `56` | |
| style | ViewStyle | | |

### Select
Dropdown built on Popover; single or multi select, optional chip display.
| Prop | Type | Default | Req | Description |
|---|---|---|---|---|
| options | `Option[]` | — | ✓ | `{ id, label, value, icon? }` |
| value | any | — | ✓ | Selected value (single) |
| onSelect | (value) => void | — | ✓ | |
| label | string | | | |
| placeholder | string | `Select an option` | | |
| variant | `"outlined" \| "filled"` | `outlined` | | |
| error | string | | | |
| disabled | boolean | | | |
| multiSelect | boolean | `false` | | |
| showAsChips | boolean | `false` | | Render selection as chips |
| selectedValues | any[] | `[]` | | Multi-select value set |
| toggleOptions | (value) => void | | | Multi-select handler |
| style / optionStyle | object | | | |

### Checkbox
| Prop | Type | Default | Req | Description |
|---|---|---|---|---|
| checked | boolean | — | ✓ | |
| onValueChange | (value) => void | — | ✓ | |
| label | string | | | |
| labelPosition | `"left" \| "right"` | `right` | | |
| indeterminate | boolean | | | Mixed state |
| disabled | boolean | | | |
| error | boolean | | | |

### RadioButton / RadioGroup
`RadioButton` is a single control; `RadioGroup` (named export) manages a set.

RadioButton:
| Prop | Type | Default | Req | Description |
|---|---|---|---|---|
| selected | boolean | — | ✓ | |
| onPress | () => void | — | ✓ | |
| label | string | | | |
| labelPosition | `"left" \| "right"` | `right` | | |
| disabled / error | boolean | | | |

RadioGroup:
| Prop | Type | Default | Req | Description |
|---|---|---|---|---|
| options | `RadioOption[]` | — | ✓ | `{ id, label, value, disabled? }` |
| value | any | — | ✓ | |
| onValueChange | (value) => void | — | ✓ | |
| label | string | | | |
| direction | `"column" \| "row"` | `column` | | |
| disabled | boolean | | | |
| error | string | | | Group-level error message |

### Toggle (Switch)
Animated M3 switch, fully configurable dimensions.
| Prop | Type | Default | Req | Description |
|---|---|---|---|---|
| value | boolean | — | ✓ | |
| onValueChange | (value) => void | — | ✓ | |
| disabled | boolean | `false` | | |
| width | number | `32` | | |
| height | number | `18` | | |
| trackBorderWidth | number | `2` | | |
| animationDuration | number (ms) | `200` | | |
| thumbOffSizeRatio | number | `0.8` | | Thumb size when off |
| thumbOnSizeRatio | number | `0.9` | | Thumb size when on |
| containerStyle | ViewStyle | | | |

### Slider
| Prop | Type | Default | Req | Description |
|---|---|---|---|---|
| value | number | — | ✓ | |
| onValueChange | (value) => void | — | ✓ | |
| onSlidingComplete | (value) => void | | | |
| min | number | `0` | | |
| max | number | `100` | | |
| step | number | | | 0/undefined = continuous |
| label | string | | | |
| showValueLabel | boolean | | | |
| marks | boolean | | | Ticks at each step (needs step) |
| disabled | boolean | | | |
| style | ViewStyle | | | |

### Spinner (Number stepper)
Numeric field with +/- steppers. (Distinct from progress spinners in §6.)
| Prop | Type | Default | Req | Description |
|---|---|---|---|---|
| value | number | — | ✓ | |
| onChange | (val) => void | — | ✓ | |
| label | string | | | |
| step | number | `1` | | |
| min | number | `0` | | |
| max | number | `100` | | |
| disabled | boolean | | | |

### SearchBar
| Prop | Type | Default | Req | Description |
|---|---|---|---|---|
| value | string | — | ✓ | |
| onChangeText | (text) => void | — | ✓ | |
| onSubmit | (text) => void | | | |
| onClear | () => void | | | After clear button empties field |
| placeholder | string | | | |
| leadingIcon | icon | | | |
| disabled | boolean | | | |
| autoFocus | boolean | | | |
| style | ViewStyle | | | |

### DateTimePicker
Field that opens a native/web modal date/time picker. Locale-aware, relative labels (Today/Yesterday/Tomorrow).
| Prop | Type | Default | Req | Description |
|---|---|---|---|---|
| value | Date | — | ✓ | |
| onChange | (date) => void | — | ✓ | |
| label | string | | | |
| mode | `"date" \| "datetime" \| "time"` | `date` | | |
| disabled | boolean | | | |

### Rating
Star rating; half-stars rendered, whole values on tap.
| Prop | Type | Default | Req | Description |
|---|---|---|---|---|
| value | number | — | ✓ | Supports halves (3.5) |
| onChange | (value) => void | | | Interactive when provided |
| max | number | `5` | | |
| size | number | `24` | | |
| disabled | boolean | | | |

---

## 5. Data Display

### Avatar
| Prop | Type | Default | Req | Description |
|---|---|---|---|---|
| source | image source | | | Image; else initials; else icon |
| name | string | | | Initials fallback |
| icon | icon | `account` | | Icon fallback |
| size | number | `40` | | |
| variant | `"circular" \| "rounded" \| "square"` | `circular` | | |
| status | `"online" \| "offline" \| "busy" \| "away" \| null` | | | Status dot |
| backgroundColor / textColor | string | | | |
| onPress | () => void | | | |

### Badge
Small count/dot overlay (position it over its target).
| Prop | Type | Default | Description |
|---|---|---|---|
| count | number | | Omit → dot |
| size | `"small" \| "large"` | `large` | small = dot |
| max | number | `99` | Shows `max+` when exceeded |
| showZero | boolean | `false` | Render at count 0 |
| visible | boolean | `true` | |
| style | any | | |

### IconBadge
Icon button with an attached count badge.
| Prop | Type | Default | Req | Description |
|---|---|---|---|---|
| iconName | icon | — | ✓ | |
| badgeCount | number | — | ✓ | Hidden when ≤ 0; caps at `99+` |
| size | number | `32` | | |
| badgeColor | string | `error` | | |
| color | string | `primary` | | Icon color |
| onPress | () => void | | | |

### StatusBadge
Small labeled status pill (own semantic colors, light/dark aware).
| Prop | Type | Default | Req | Description |
|---|---|---|---|---|
| label | string | — | ✓ | |
| type | `"success" \| "error" \| "warning"` | `success` | | |
| icon | icon | | | Override default per-type icon |

### DataGrid
Virtualized table: sortable columns, reorder, density, loading, empty state. Also exports composable primitives `Table, Thead, Tfoot, Tr, Th, Td`.
| Prop | Type | Default | Req | Description |
|---|---|---|---|---|
| data | any[] | — | ✓ | Row objects |
| columns | `ColumnDefinition[]` | — | ✓ | `{ id, label, width?, sortable? }` |
| loading | boolean | `false` | | |
| density | `"normal" \| "dense"` | `normal` | | |
| sortColumn | string | | | |
| sortDirection | `"asc" \| "desc"` | | | |
| onSort | (columnId, direction) => void | | | |
| onColumnReorder | (newColumns) => void | | | |
| onEndReached | () => void | | | Infinite scroll |
| onEndReachedThreshold | number | | | |
| emptyMessage | string | | | Shown when empty & not loading |
| style / rowStyle / headerStyle | ViewStyle | | | |

### ListItem
Single pressable list row (centered title text).
| Prop | Type | Default | Req | Description |
|---|---|---|---|---|
| children | ReactNode | — | ✓ | Label |
| onPress | () => void | | | Adds hover/press states |
| itemContainerStyle / itemTextStyle / itemPressedStyle / itemHoveredStyle | object | | | Style overrides |

### Tooltip
Wraps a child; shows a bubble on hover (web) / long-press (native).
| Prop | Type | Default | Req | Description |
|---|---|---|---|---|
| content | string | — | ✓ | |
| children | ReactNode | — | ✓ | Anchor |
| position | `"top" \| "bottom" \| "left" \| "right"` | `top` | | |
| disabled | boolean | | | |
| hideDelay | number (ms) | `1500` | | Native auto-hide |

### Accordion
Expandable section with animated height.
| Prop | Type | Default | Req | Description |
|---|---|---|---|---|
| title | string | — | ✓ | |
| children | ReactNode | — | ✓ | Content |
| startExpanded | boolean | `false` | | |
| onPress | (expanded) => void | | | |
| style / titleStyle | style | | | |

### Carousel
Paged horizontal slider.
| Prop | Type | Default | Req | Description |
|---|---|---|---|---|
| children | ReactNode | — | ✓ | Each child = a page |
| showDots | boolean | `true` | | |
| showArrows | boolean | `false` | | Overlay prev/next |
| autoPlayInterval | number (ms) | `0` | | 0 = off |
| height | number | | | Fixed height (else tallest page) |
| onIndexChange | (index) => void | | | |

---

## 6. Feedback & Overlays

### Snackbar
Bottom transient message; animated in/out.
| Prop | Type | Default | Req | Description |
|---|---|---|---|---|
| visible | boolean | — | ✓ | |
| message | string | — | ✓ | |
| onDismiss | () => void | — | ✓ | |
| duration | number (ms) | `4000` | | 0 = no auto-hide |
| action | `{ label, onPress }` | | | Trailing action button |
| type | `"default" \| "success" \| "error"` | `default` | | |
| icon | icon | | | Override leading icon |

### Banner
Inline prominent message with up to two actions.
| Prop | Type | Default | Req | Description |
|---|---|---|---|---|
| visible | boolean | — | ✓ | |
| message | string | — | ✓ | |
| type | `"default" \| "info" \| "warning" \| "error"` | `default` | | |
| icon | icon | | | Overrides per-type default |
| actions | `{ label, onPress }[]` | | | Right-aligned, ≤ 2 |
| dismissable | boolean | `false` | | Close (X); needs onDismiss |
| onDismiss | () => void | | | |

### Modal
Centered dialog surface.
| Prop | Type | Default | Req | Description |
|---|---|---|---|---|
| visible | boolean | | | |
| children | ReactNode \| string | — | ✓ | Body (string → styled text) |
| title | string | | | |
| animationType | `"none" \| "slide" \| "fade"` | `fade` | | |
| transparent | boolean | `true` | | |
| onClose | () => void | | | Renders a close button |
| onDismiss | () => void | | | Android back / ESC |
| closeText | string | `Close` | | |

### ConfirmDialog
Modal preset with confirm/cancel actions.
| Prop | Type | Default | Req | Description |
|---|---|---|---|---|
| visible | boolean | — | ✓ | |
| onConfirm | () => void | — | ✓ | |
| onCancel | () => void | — | ✓ | |
| title | string | | | |
| message | string | | | |
| confirmText | string | `Confirm` | | |
| cancelText | string | `Cancel` | | |

### Popover
Anchored floating panel; auto-positions within the viewport.
| Prop | Type | Default | Req | Description |
|---|---|---|---|---|
| anchor | ReactElement | — | ✓ | Trigger element |
| children | ReactNode | — | ✓ | Panel content |
| visible | boolean | — | ✓ | |
| onDismiss | () => void | — | ✓ | |
| matchAnchorWidth | boolean | `false` | | Constrain to anchor width |

### BottomSheet
Draggable bottom sheet with scrim.
| Prop | Type | Default | Req | Description |
|---|---|---|---|---|
| visible | boolean | — | ✓ | |
| onDismiss | () => void | — | ✓ | |
| children | ReactNode | — | ✓ | |
| title | string | | | |
| showHandle | boolean | `true` | | Drag handle |
| dismissOnScrimTap | boolean | `true` | | |
| maxHeightRatio | number | | | Max height as fraction of window |

### Menu
Anchored action menu.
| Prop | Type | Default | Req | Description |
|---|---|---|---|---|
| anchor | ReactElement | — | ✓ | |
| items | `MenuItem[]` | — | ✓ | `{ id, label, icon?, trailing?, disabled?, destructive?, dividerAbove?, onPress }` |
| visible | boolean | — | ✓ | |
| onDismiss | () => void | — | ✓ | |
| closeOnSelect | boolean | `true` | | |

### Skeleton
Loading placeholder with pulse.
| Prop | Type | Default | Description |
|---|---|---|---|
| variant | `"rect" \| "circle" \| "text"` | `rect` | |
| width | number \| % | | |
| height | number \| % | | |
| borderRadius | number | | |
| duration | number (ms) | | Pulse cycle |
| animate | boolean | `true` | false = static |
| style | ViewStyle | | |

### CircularProgress
Indeterminate spinner (SVG).
| Prop | Type | Default | Description |
|---|---|---|---|
| size | number | `48` | |
| strokeWidth | number | `4` | |
| color | string | `primary` | |
| duration | number (ms) | `1000` | Rotation period |

### LinearProgress
Determinate or indeterminate bar.
| Prop | Type | Default | Description |
|---|---|---|---|
| progress | number 0–1 | `0` | Determinate value |
| indeterminate | boolean | `false` | |
| height | number | `4` | |
| color | string | `primary` | |
| trackColor | string | `surfaceContainerHighest` | |
| duration | number (ms) | `500` | Determinate transition |
| indeterminateDuration | number (ms) | `1500` | |

### EmptyState
Placeholder for empty content.
| Prop | Type | Default | Req | Description |
|---|---|---|---|---|
| title | string | — | ✓ | |
| icon | icon | `inbox-outline` | | |
| description | string | | | |
| action | `{ label, onPress, iconName? }` | | | CTA button |

---

## 7. Navigation

### AppBar
Top app bar; integrates with the navigator (drawer/back, title, right actions). Props are
navigator-shaped (`navigation`, `route`, `options`, `back`, `isPinned`) — framework-specific,
adapt to the chosen router.

### NavigationBar
Bottom navigation bar.
| Prop | Type | Default | Req | Description |
|---|---|---|---|---|
| items | `NavigationBarItem[]` | — | ✓ | `{ id, label, icon, badgeCount?, disabled? }` |
| activeId | string | — | ✓ | |
| onItemPress | (id) => void | — | ✓ | |
| showLabels | `"always" \| "selected"` | `always` | | |

### Tabs
Top tab bar with animated indicator; text-only or icon tabs.
| Prop | Type | Default | Req | Description |
|---|---|---|---|---|
| tabs | `string[]` \| `{ label, icon }[]` | — | ✓ | |
| activeTab | number (index) | — | ✓ | |
| onChange | (index) => void | — | ✓ | |

### Breadcrumbs
| Prop | Type | Default | Req | Description |
|---|---|---|---|---|
| items | `BreadcrumbItem[]` | — | ✓ | `{ id, label, icon?, onPress? }` |
| separator | icon | `chevron-right` | | |
| maxItems | number | | | Collapse middle behind ellipsis |

### Pagination
| Prop | Type | Default | Req | Description |
|---|---|---|---|---|
| page | number (1-based) | — | ✓ | |
| totalPages | number | — | ✓ | |
| onPageChange | (page) => void | — | ✓ | |
| siblingCount | number | `1` | | Pages each side of current |
| showFirstLast | boolean | `false` | | First/last arrows |
| disabled | boolean | | | |

### Stepper
Horizontal progress steps.
| Prop | Type | Default | Req | Description |
|---|---|---|---|---|
| steps | `string[]` \| `{ label, icon? }[]` | — | ✓ | |
| activeStep | number (index) | — | ✓ | |
| onStepPress | (stepIndex) => void | | | Makes steps tappable |
| style | object | | | |

---

## 8. Component Index (42)

**Foundations**: Typography, Divider, Paper, Card
**Actions**: Button, FAB, SpeedDial, ToggleButton, ToggleButtonGroup, Chip
**Inputs**: Input, NumericInput, Select, Checkbox, RadioButton/RadioGroup, Toggle, Slider, Spinner, SearchBar, DateTimePicker, Rating
**Data display**: Avatar, Badge, IconBadge, StatusBadge, DataGrid, ListItem, Tooltip, Accordion, Carousel
**Feedback & overlays**: Snackbar, Banner, Modal, ConfirmDialog, Popover, BottomSheet, Menu, Skeleton, CircularProgress, LinearProgress, EmptyState
**Navigation**: AppBar, NavigationBar, Tabs, Breadcrumbs, Pagination, Stepper

---

## 9. Framework Selection Notes

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
