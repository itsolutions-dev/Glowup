# Glowup

A **Material You (Material Design 3)** UI component library for **React Native + Web**, built
with Expo, plus a live playground app that showcases every component.

The repo is an **npm-workspaces monorepo** with two workspaces:

| Workspace | Package | What it is |
| --- | --- | --- |
| `packages/ui` | `@glowup/ui` | The publishable component library (this is the product). |
| `apps/playground` | `@glowup/playground` | Private Expo app that demos the library on iOS, Android and Web. |

> The playground was previously called `apps/mobile`. It was renamed because it is **not
> mobile-only** — it runs on web too — and its job is to exercise the library, not to be a
> shippable mobile product.

## Quick start

```bash
npm install        # install all workspaces (run once, from the repo root)
npm start          # start the playground (Expo dev server) — no need to cd anywhere
```

`npm start` at the repo root launches the playground and opens straight on the **Component
Playground** screen. Platform shortcuts, all runnable from the root:

```bash
npm run playground   # same as npm start
npm run android      # open on Android
npm run ios          # open on iOS
npm run web          # open in the browser
```

Each of these proxies into the `@glowup/playground` workspace, so you never have to
`cd apps/playground` yourself.

## What's in `src` (`packages/ui/src`)

`packages/ui/src` is the **library source** — the code that gets published as `@glowup/ui`.
Its public surface is the barrel `src/index.ts`. Layout:

```
packages/ui/src/
├── index.ts          # public API barrel — everything importable from "@glowup/ui"
├── components/        # ~55 Material You components
│   ├── List/          # ListItem
│   ├── Modal/         # Modal, ConfirmDialog
│   ├── Navigation/    # DrawerNavigation, StackNavigation, DrawerContent, Route, User
│   ├── Progress/      # CircularProgress, LinearProgress
│   ├── Tab/           # Tabs, TabContent
│   ├── ToggleButton/  # ToggleButton, ToggleButtonGroup
│   ├── types.ts       # shared component types (e.g. PressableState)
│   └── *.tsx          # Button, Card, Input, Chip, Select, DataGrid, Snackbar, ...
└── providers/         # theme + alert infrastructure
    ├── ThemeProvider.tsx   # Material You theme, useTheme(), getStateColor(), getGlowStyles()
    ├── theme.json          # all color / typography / spacing / shape tokens (source of truth)
    └── AlertProvider.tsx   # cross-platform Alert() (native Alert.alert / web Modal)
```

Styling everywhere is theme-reactive via `useMemo(() => makeStyles(theme), [theme])`, driven
by the tokens in `providers/theme.json`. Every interactive component carries the right
accessibility role/state and reacts to the light/dark theme automatically.

> Icons: any prop typed *icon* below takes a **MaterialCommunityIcons** name — a kebab-case
> string like `"plus"` or `"bell-outline"` (outline variants append `-outline`).
> The authoritative, always-current spec (with full defaults for every prop) lives at
> [`packages/ui/src/components/components.md`](packages/ui/src/components/components.md).

## Component reference

### Theme & alert (from `src/providers`)

Exported from the library alongside the components:

- **`ThemeProvider`** — wraps the app; derives a Material You theme from `theme.json`, syncs
  with the OS color scheme, and supports manual toggle.
- **`useTheme()`** → `{ theme, isDark, toggleTheme }`.
- **`getStateColor(bg, on, state)`** — composites a hover/press state-layer color over a base.
- **`getGlowStyles(theme, active, variant?)`** — the M3 "glow" focus/hover ring (`variant="error"` for error state).
- **`AlertProvider`** + **`Alert(title, message, buttons)`** — cross-platform alert: native
  `Alert.alert` on iOS/Android, custom `Modal` on web.

Theme tokens: colors (primary/secondary/tertiary/error + container & surface tones, all with
light/dark values), a full M3 type scale (`displayLarge` → `labelSmall`), spacing
(`xs:4 s:8 m:16 l:24 xl:32`) and shape radii (`small:8 medium:12 large:16 extraLarge:28`).

### Foundations

#### `Typography`
Renders themed text at an M3 type scale.

| Prop | Type | Default | Req |
|---|---|---|---|
| children | ReactNode | — | ✓ |
| variant | type-scale key (`displayLarge`…`labelSmall`) | `displayLarge` | |
| style | TextStyle | | |

#### `Divider`
Horizontal or vertical rule, optionally with a centered label.

| Prop | Type | Default |
|---|---|---|
| orientation | `"horizontal" \| "vertical"` | `horizontal` |
| inset | number | `0` |
| thickness | number | `1` |
| contentSpacing | number | `16` |
| children | ReactNode (string → centered label, horizontal only) | |

#### `Paper`
Elevated / tonal surface container.

| Prop | Type | Default |
|---|---|---|
| children | ReactNode (required) | — |
| elevation | number 0–5 (maps to surface tone + shadow) | `1` |
| outline | boolean (1px outlineVariant border) | `false` |
| glow | boolean (glow instead of shadow) | `false` |

#### `Card`
Pressable content surface.

| Prop | Type | Default |
|---|---|---|
| children | ReactNode (required) | — |
| variant | `"elevated" \| "filled" \| "outlined" \| "glow"` | `filled` |
| onPress | () => void (makes it interactive, button role) | |
| accessibilityLabel | string | |

### Buttons & actions

#### `Button`
| Prop | Type | Default |
|---|---|---|
| children | ReactNode (label) | |
| onPress | () => void | |
| mode | `"filled" \| "tonal" \| "outlined" \| "text"` | `filled` |
| iconName | icon | |
| iconPosition | `"left" \| "right"` | `left` |
| size | number (icon size) | `theme.shape.medium` |
| fullWidth | boolean | `false` |
| loading | boolean (inline spinner) | `false` |
| disabled | boolean | `false` |
| accessibilityLabel | string (falls back to string child) | |

#### `FAB` — Floating Action Button
Absolutely positioned; respects safe-area insets.

| Prop | Type | Default |
|---|---|---|
| icon | icon (required) | — |
| onPress | () => void (required) | — |
| label | string (only when `size="extended"`) | |
| size | `"small" \| "regular" \| "large" \| "extended"` | `regular` |
| position | `"bottom-right" \| "bottom-left" \| "top-right" \| "top-left"` | `bottom-right` |
| disabled | boolean | |

#### `SpeedDial`
FAB that expands a stack of labeled actions.

| Prop | Type | Default |
|---|---|---|
| actions | `SpeedDialAction[]` = `{ id, label, icon, onPress }` (required) | — |
| mainIcon | icon (rotates 45° when open, required) | — |
| position | same values as FAB | `bottom-right` |

#### `ToggleButton`
Single segment; usually used via `ToggleButtonGroup`.

| Prop | Type | Default |
|---|---|---|
| active | boolean (required) | — |
| onPress | () => void (required) | — |
| label | string | |
| icon | icon | |
| isFirst / isLast | boolean (rounds outer corners in a group) | |

#### `ToggleButtonGroup`
Segmented button set (single or multi select).

| Prop | Type | Default |
|---|---|---|
| options | `{ label?, icon?, value }[]` (required) | — |
| value | string \| string[] (array when `multiSelect`, required) | — |
| onValueChange | (val) => void (required) | — |
| multiSelect | boolean | `false` |

#### `Chip`
| Prop | Type | Default |
|---|---|---|
| label | string (required) | — |
| onPress | () => void (makes body pressable) | |
| onClose | () => void (renders trailing X) | |
| icon | icon (leading) | |
| selected | boolean (check + tertiary tone) | `false` |
| mode | `"filled" \| "tonal" \| "outlined"` | `filled` |
| size | `"small" \| "medium"` (small = 24px) | `medium` |
| disabled | boolean | `false` |

### Inputs & forms

#### `Input`
Text field (outlined or filled) with affixes, icons, multiline and number mode.

| Prop | Type | Default |
|---|---|---|
| value | string (required) | — |
| onChangeText | (text) => void (required) | — |
| label / placeholder | string | |
| type | `"text" \| "number"` (number = decimal keypad + sanitizing) | `text` |
| variant | `"outlined" \| "filled"` | `outlined` |
| precision | number (decimals, number type) | |
| prefix / suffix | string (inline affix) | |
| leadingIcon / trailingIcon | icon | |
| onTrailingIconPress | () => void | |
| error | string (message + error styling) | |
| helperText | string (hidden while error shown) | |
| required | boolean (asterisk on label) | |
| disabled / readonly | boolean | |
| secureTextEntry | boolean (password) | |
| maxLength | number | |
| multiline | boolean | `false` |
| numberOfLines | number | `4` |
| minHeight | number | `56` |
| onFocus / onBlur | () => void | |

#### `NumericInput`
Thin wrapper over `Input` with `type="number"`. Same core props: `value`, `onChangeText`
(required), plus `label/placeholder/prefix/suffix`, `precision`, `variant` (`outlined`),
`error`, `disabled/readonly`, `minHeight` (`56`).

#### `Select`
Dropdown built on `Popover`; single or multi select, optional chip display.

| Prop | Type | Default |
|---|---|---|
| options | `Option[]` = `{ id, label, value, icon? }` (required) | — |
| value | any (single selection, required) | — |
| onSelect | (value) => void (required) | — |
| label | string | |
| placeholder | string | `Select an option` |
| variant | `"outlined" \| "filled"` | `outlined` |
| error | string | |
| disabled | boolean | |
| multiSelect | boolean | `false` |
| showAsChips | boolean (render selection as chips) | `false` |
| selectedValues | any[] (multi-select set) | `[]` |
| toggleOptions | (value) => void (multi-select handler) | |

#### `Checkbox`
| Prop | Type | Default |
|---|---|---|
| checked | boolean (required) | — |
| onValueChange | (value) => void (required) | — |
| label | string | |
| labelPosition | `"left" \| "right"` | `right` |
| indeterminate | boolean (mixed state) | |
| disabled / error | boolean | |

#### `RadioButton` / `RadioGroup`
`RadioButton` is a single control; `RadioGroup` (named export) manages a set.

RadioButton: `selected` (required), `onPress` (required), `label`, `labelPosition` (`right`),
`disabled`, `error`.

RadioGroup:
| Prop | Type | Default |
|---|---|---|
| options | `RadioOption[]` = `{ id, label, value, disabled? }` (required) | — |
| value | any (required) | — |
| onValueChange | (value) => void (required) | — |
| label | string | |
| direction | `"column" \| "row"` | `column` |
| error | string (group-level message) | |

#### `Toggle` — Switch
Animated M3 switch with fully configurable dimensions.

| Prop | Type | Default |
|---|---|---|
| value | boolean (required) | — |
| onValueChange | (value) => void (required) | — |
| disabled | boolean | `false` |
| width / height | number | `32` / `18` |
| trackBorderWidth | number | `2` |
| animationDuration | number (ms) | `200` |
| thumbOffSizeRatio / thumbOnSizeRatio | number | `0.8` / `0.9` |

#### `Slider`
| Prop | Type | Default |
|---|---|---|
| value | number (required) | — |
| onValueChange | (value) => void (required) | — |
| onSlidingComplete | (value) => void | |
| min / max | number | `0` / `100` |
| step | number (0/undefined = continuous) | |
| label | string | |
| showValueLabel | boolean | |
| marks | boolean (ticks at each step, needs step) | |
| disabled | boolean | |

#### `Spinner` — number stepper
Numeric field with +/- steppers. (Distinct from the progress spinners below.)

| Prop | Type | Default |
|---|---|---|
| value | number (required) | — |
| onChange | (val) => void (required) | — |
| label | string | |
| step | number | `1` |
| min / max | number | `0` / `100` |
| disabled | boolean | |

#### `SearchBar`
| Prop | Type | Default |
|---|---|---|
| value | string (required) | — |
| onChangeText | (text) => void (required) | — |
| onSubmit | (text) => void | |
| onClear | () => void (after clear empties field) | |
| placeholder | string | |
| leadingIcon | icon | |
| disabled / autoFocus | boolean | |

#### `DateTimePicker`
Field that opens a native/web modal picker. Locale-aware, with relative labels
(Today/Yesterday/Tomorrow).

| Prop | Type | Default |
|---|---|---|
| value | Date (required) | — |
| onChange | (date) => void (required) | — |
| label | string | |
| mode | `"date" \| "datetime" \| "time"` | `date` |
| disabled | boolean | |

#### `Rating`
Star rating; renders half-stars, sets whole values on tap.

| Prop | Type | Default |
|---|---|---|
| value | number (supports halves, e.g. 3.5, required) | — |
| onChange | (value) => void (interactive when provided) | |
| max | number | `5` |
| size | number | `24` |
| disabled | boolean | |

#### `LanguageSelector`
Cycles through the configured languages on press (flag/label pill).

| Prop | Type | Default |
|---|---|---|
| currentLang | string (required) | — |
| onChange | (lang) => void — next language code (required) | — |

### Data display

#### `Avatar`
| Prop | Type | Default |
|---|---|---|
| source | image source (else initials, else icon) | |
| name | string (initials fallback) | |
| icon | icon (icon fallback) | `account` |
| size | number | `40` |
| variant | `"circular" \| "rounded" \| "square"` | `circular` |
| status | `"online" \| "offline" \| "busy" \| "away" \| null` (status dot) | |
| backgroundColor / textColor | string | |
| onPress | () => void | |

#### `Badge`
Small count/dot overlay (position it over its target).

| Prop | Type | Default |
|---|---|---|
| count | number (omit → dot) | |
| size | `"small" \| "large"` (small = dot) | `large` |
| max | number (shows `max+` when exceeded) | `99` |
| showZero | boolean | `false` |
| visible | boolean | `true` |

#### `IconBadge`
Icon button with an attached count badge.

| Prop | Type | Default |
|---|---|---|
| iconName | icon (required) | — |
| badgeCount | number (hidden ≤ 0, caps at `99+`, required) | — |
| size | number | `32` |
| badgeColor | string | `error` |
| color | string (icon color) | `primary` |
| onPress | () => void | |

#### `StatusBadge`
Small labeled status pill with its own semantic colors (light/dark aware).

| Prop | Type | Default |
|---|---|---|
| label | string (required) | — |
| type | `"success" \| "error" \| "warning"` | `success` |
| icon | icon (override default per-type icon) | |

#### `DataGrid`
Virtualized table: sortable columns, reorder, density, loading + empty state. Also exports
composable primitives `Table, Thead, Tfoot, Tr, Th, Td`.

| Prop | Type | Default |
|---|---|---|
| data | any[] (row objects, required) | — |
| columns | `ColumnDefinition[]` = `{ id, label, width?, sortable? }` (required) | — |
| loading | boolean | `false` |
| density | `"normal" \| "dense"` | `normal` |
| sortColumn | string | |
| sortDirection | `"asc" \| "desc"` | |
| onSort | (columnId, direction) => void | |
| onColumnReorder | (newColumns) => void | |
| onEndReached | () => void (infinite scroll) | |
| emptyMessage | string | |

#### `ListItem`
Single pressable list row.

| Prop | Type | Default |
|---|---|---|
| children | ReactNode (label, required) | — |
| onPress | () => void (adds hover/press states) | |
| itemContainerStyle / itemTextStyle / itemPressedStyle / itemHoveredStyle | object | |

#### `Tooltip`
Wraps a child; shows a bubble on hover (web) / long-press (native).

| Prop | Type | Default |
|---|---|---|
| content | string (required) | — |
| children | ReactNode (anchor, required) | — |
| position | `"top" \| "bottom" \| "left" \| "right"` | `top` |
| disabled | boolean | |
| hideDelay | number (ms, native auto-hide) | `1500` |

#### `Accordion`
Expandable section with animated height.

| Prop | Type | Default |
|---|---|---|
| title | string (required) | — |
| children | ReactNode (content, required) | — |
| startExpanded | boolean | `false` |
| onPress | (expanded) => void | |

#### `Carousel`
Paged horizontal slider.

| Prop | Type | Default |
|---|---|---|
| children | ReactNode (each child = a page, required) | — |
| showDots | boolean | `true` |
| showArrows | boolean (overlay prev/next) | `false` |
| autoPlayInterval | number (ms, 0 = off) | `0` |
| height | number (fixed; else tallest page) | |
| onIndexChange | (index) => void | |

### Feedback & overlays

#### `Snackbar`
Bottom transient message; animated in/out.

| Prop | Type | Default |
|---|---|---|
| visible | boolean (required) | — |
| message | string (required) | — |
| onDismiss | () => void (required) | — |
| duration | number (ms, 0 = no auto-hide) | `4000` |
| action | `{ label, onPress }` (trailing button) | |
| type | `"default" \| "success" \| "error"` | `default` |
| icon | icon | |

#### `Banner`
Inline prominent message with up to two actions.

| Prop | Type | Default |
|---|---|---|
| visible | boolean (required) | — |
| message | string (required) | — |
| type | `"default" \| "info" \| "warning" \| "error"` | `default` |
| icon | icon | |
| actions | `{ label, onPress }[]` (right-aligned, ≤ 2) | |
| dismissable | boolean (close X; needs onDismiss) | `false` |
| onDismiss | () => void | |

#### `Modal`
Centered dialog surface.

| Prop | Type | Default |
|---|---|---|
| visible | boolean | |
| children | ReactNode \| string (string → styled text, required) | — |
| title | string | |
| animationType | `"none" \| "slide" \| "fade"` | `fade` |
| transparent | boolean | `true` |
| onClose | () => void (renders close button) | |
| onDismiss | () => void (Android back / ESC) | |
| closeText | string | `Close` |

#### `ConfirmDialog`
Modal preset with confirm/cancel actions.

| Prop | Type | Default |
|---|---|---|
| visible | boolean (required) | — |
| onConfirm | () => void (required) | — |
| onCancel | () => void (required) | — |
| title / message | string | |
| confirmText | string | `Confirm` |
| cancelText | string | `Cancel` |

#### `Popover`
Anchored floating panel; auto-positions within the viewport.

| Prop | Type | Default |
|---|---|---|
| anchor | ReactElement (trigger, required) | — |
| children | ReactNode (panel content, required) | — |
| visible | boolean (required) | — |
| onDismiss | () => void (required) | — |
| matchAnchorWidth | boolean (constrain to anchor width) | `false` |

#### `BottomSheet`
Draggable bottom sheet with scrim.

| Prop | Type | Default |
|---|---|---|
| visible | boolean (required) | — |
| onDismiss | () => void (required) | — |
| children | ReactNode (required) | — |
| title | string | |
| showHandle | boolean (drag handle) | `true` |
| dismissOnScrimTap | boolean | `true` |
| maxHeightRatio | number (fraction of window) | |

#### `Menu`
Anchored action menu.

| Prop | Type | Default |
|---|---|---|
| anchor | ReactElement (required) | — |
| items | `MenuItem[]` = `{ id, label, icon?, trailing?, disabled?, destructive?, dividerAbove?, onPress }` (required) | — |
| visible | boolean (required) | — |
| onDismiss | () => void (required) | — |
| closeOnSelect | boolean | `true` |

#### `Skeleton`
Loading placeholder with pulse.

| Prop | Type | Default |
|---|---|---|
| variant | `"rect" \| "circle" \| "text"` | `rect` |
| width / height | number \| % | |
| borderRadius | number | |
| duration | number (ms, pulse cycle) | |
| animate | boolean (false = static) | `true` |

#### `CircularProgress`
Indeterminate SVG spinner.

| Prop | Type | Default |
|---|---|---|
| size | number | `48` |
| strokeWidth | number | `4` |
| color | string | `primary` |
| duration | number (ms, rotation period) | `1000` |

#### `LinearProgress`
Determinate or indeterminate bar.

| Prop | Type | Default |
|---|---|---|
| progress | number 0–1 (determinate value) | `0` |
| indeterminate | boolean | `false` |
| height | number | `4` |
| color | string | `primary` |
| trackColor | string | `surfaceContainerHighest` |
| duration | number (ms, determinate transition) | `500` |
| indeterminateDuration | number (ms) | `1500` |

#### `EmptyState`
Placeholder for empty content.

| Prop | Type | Default |
|---|---|---|
| title | string (required) | — |
| icon | icon | `inbox-outline` |
| description | string | |
| action | `{ label, onPress, iconName? }` (CTA button) | |

### Navigation

#### `AppBar`
Top app bar; integrates with the navigator (drawer/back button, title, right actions). Props
are navigator-shaped (`navigation`, `route`, `options`, `back`, `isPinned`) — used as the
`header` renderer inside `StackNavigation`.

#### `StackNavigation`
Native stack navigator preconfigured with the themed `AppBar` header and slide animation.

| Prop | Type | Default |
|---|---|---|
| routes | `Route[]` = `{ name, component, icon, options? }` (required) | — |
| initialRouteName | string (required) | — |

#### `DrawerNavigation`
Responsive drawer: **permanent** sidebar at width ≥ 840px, slide-over below (with a pin
toggle to override). Renders the custom `DrawerContent`.

| Prop | Type | Default |
|---|---|---|
| routes | `Route[]` = `{ name, component, icon, options? }` (required) | — |
| user | `UserProps` = `{ name, email, status }` (required) | — |
| initialRouteName | string (required) | — |
| onLogout | () => void (required) | — |
| onProfilePress | () => void (required) | — |
| logoutText | string | |

#### `DrawerContent`
The drawer body (`CustomDrawerContent`): route list, profile header, theme toggle, pin
toggle, logout. Consumed internally by `DrawerNavigation`; extends React Navigation's
`DrawerContentComponentProps` with `isPinned`, `onTogglePin`, `user`, `onProfilePress`,
`logoutText`, `onLogout`.

#### `DrawerPreferenceItem`
A labeled row (icon + label + trailing control) used for the drawer's preference toggles.

| Prop | Type | Default |
|---|---|---|
| icon | icon (required) | — |
| label | string (required) | — |
| children | ReactNode (trailing control) | |

#### `NavigationBar`
Bottom navigation bar.

| Prop | Type | Default |
|---|---|---|
| items | `NavigationBarItem[]` = `{ id, label, icon, badgeCount?, disabled? }` (required) | — |
| activeId | string (required) | — |
| onItemPress | (id) => void (required) | — |
| showLabels | `"always" \| "selected"` | `always` |

#### `Tabs` / `TabContent`
`Tabs` is a top tab bar with an animated indicator (text-only or icon tabs). `TabContent`
renders the child at the active index.

Tabs:
| Prop | Type | Default |
|---|---|---|
| tabs | `string[]` \| `{ label, icon }[]` (required) | — |
| activeTab | number (index, required) | — |
| onChange | (index) => void (required) | — |

TabContent: `activeTab` (index, required), `children` (required), `style`.

#### `Breadcrumbs`
| Prop | Type | Default |
|---|---|---|
| items | `BreadcrumbItem[]` = `{ id, label, icon?, onPress? }` (required) | — |
| separator | icon | `chevron-right` |
| maxItems | number (collapse middle behind ellipsis) | |

#### `Pagination`
| Prop | Type | Default |
|---|---|---|
| page | number (1-based, required) | — |
| totalPages | number (required) | — |
| onPageChange | (page) => void (required) | — |
| siblingCount | number (pages each side of current) | `1` |
| showFirstLast | boolean (first/last arrows) | `false` |
| disabled | boolean | |

#### `Stepper`
Horizontal progress steps.

| Prop | Type | Default |
|---|---|---|
| steps | `string[]` \| `{ label, icon? }[]` (required) | — |
| activeStep | number (index, required) | — |
| onStepPress | (stepIndex) => void (makes steps tappable) | |

### System

#### `StatusBar`
Themes the platform status bar / browser chrome. On web it drives the `theme-color` meta tag
and body background; on native it sets the status-bar style. Renders nothing.

| Prop | Type | Default |
|---|---|---|
| backgroundColor | string | `theme.colors.surface` |

## What's in `apps/playground`

The Expo app that consumes `@glowup/ui` and demonstrates it. Its own source:

```
apps/playground/
├── App.tsx            # root: ThemeProvider / SafeAreaProvider / AlertProvider + Stack nav
├── index.ts           # Expo entry (registerRootComponent)
├── screens/           # Playground (component gallery), Start, Login, ChangePassword, ...
├── providers/         # AuthProvider (app-specific auth, token storage)
├── services/          # WebAuthnService (Web Credentials API wrapper)
├── hooks/             # useWebAuthn (passkey register/authenticate)
├── api/               # firestore data access
├── store/             # React context stores (workorder-context)
├── models/            # domain models (work-order)
├── i18n/              # i18next setup + locale JSON
├── assets/            # icons, splash
├── app.json           # Expo config
└── metro.config.js    # monorepo-aware Metro (watches repo root, resolves @glowup/ui from source)
```

## Root scripts

```bash
npm start / npm run playground   # run the playground app
npm run android | ios | web      # run the playground on a platform
npm run lint                     # ESLint across the repo
npm run type-check               # tsc --noEmit across all workspaces
npm test                         # tests across all workspaces
npm run build                    # build the @glowup/ui library (react-native-builder-bob)
npm run release                  # publish @glowup/ui (changeset publish)
```

## Releasing the library

Versioning and publishing use [Changesets](https://github.com/changesets/changesets). Only
`@glowup/ui` is published; `@glowup/playground` is private and ignored. On push to `master`,
`.github/workflows/release.yml` opens a "Version Packages" PR; merging it publishes to npm.
See `.changeset/README.md` for details.

## Conventions

- **Imports** are relative to each workspace root (`baseUrl: "."`), e.g. `import Button from "components/Button"`.
- **Line endings are CRLF** — Prettier `endOfLine: "crlf"`, ESLint `linebreak-style: windows`.
- Prettier `trailingComma: "all"`.
- Icons: `@expo/vector-icons/MaterialCommunityIcons`, kebab-case names, `-outline` suffix for outline variants.
- i18n keys are `UPPER_SNAKE_CASE` (e.g. `t("LOGOUT")`).
