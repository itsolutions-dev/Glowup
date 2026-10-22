---
"@its/glowup-ui": minor
---

**Breaking:** the second batch of the component API rename. Only the components listed here change; the rest keep their current props.

Renamed components (the old names are gone, `*Props` types follow):

- `Modal` -> `Dialog` (`DialogProps`), `TopAppBar` -> `AppBar` (see below), `NavigationBar` -> `NavBar`, `NavigationDrawer` -> `Drawer`.
- `SideSheet` is removed: use `<Drawer position="right" variant="swipeable">`.
- `Center` is removed: use `<Box variant="centered-flex">`.

Renamed props:

- `Dialog`: `size` -> `width`. `dismissable` is replaced by `disableBackdropClick` and `disableEscapeKeyDown`; `onDismiss` is gone, `onClose` is the one callback.
- `NavBar`: `onItemPress` -> `onClick`. `Drawer`: `onDismiss` -> `onClose`; `DrawerItem` and `DrawerSection` `onPress` -> `onClick`.
- `BottomSheet`, `Menu`: `onDismiss` -> `onClose`. `Menu` items: `onPress` -> `onClick` (also on `SplitButton`'s items, which are menu items).
- `Snackbar`: `type` -> `severity` (`SnackbarType` -> `SnackbarSeverity`); `useToast()` actions are `{ label, onClick }`.
- `Accordion`: `startExpanded` -> `expanded`, `onPress` -> `onClick`. `Pagination`: `page` -> `activePage`, `onPageChange` -> `onChange`. `Stepper`: `onStepPress` -> `onClick`.
- `Stat`: `invertTrendColors` is replaced by `trendColor`. `CaptionValue`: `label` -> `caption`, and an empty value shows "N/A" instead of an em dash.
- `ListItem`: `children` -> `primaryText`, `secondary` -> `secondaryText`, `leading` -> `icon`, `trailing` -> `action`, `onPress` -> `onClick`, `itemTextStyle` -> `primaryTextStyle`, `itemSecondaryTextStyle` -> `secondaryTextStyle`. `TableRow` and `TableHeaderCell`: `onPress` -> `onClick`.
- `Box`: `row`, `flex`, the `p*` and `m*` shorthands and `bg` are gone: use `padding`, `margin` (px), `background` and `variant`. `Stack`, `HStack` and `VStack`: `gap` -> `spacing`.

Changed behaviour:

- `Table` is data driven: `columns` (`{ id, label, alignment, fallback, width }`) and `data` draw the whole table, with `tableTitle`, `width`, `height` (the header stays put while the body scrolls), `rowsPerPage` (a `Pagination` under it; without it, one scrolling page), `hover`, `selected`, `emptyMessage` and `onClick(row, index)`. `TableHead`, `TableRow`, `TableCell` and `TableHeaderCell` stay as building blocks, and `Table` still takes them as `children` when there are no `columns`.
- `Accordion` `expanded` is the initial state and follows the prop when it changes. `Stat`'s trend defaults are `success` for up and `error` for down, and `Pagination`'s default shape is now a rounded square (`variant="circular"` is the old circle).
- `Dialog`'s close button is an icon in the header (`closeIcon`) instead of a "Close" text button under the body, which stays only for a dialog with neither `actions` nor `closeIcon`. `Snackbar` `variant="contained"` uses the `main` colours of its severity.
- `Grid` takes a `container` and items with `size`, and the default `spacing` is `"s"`. `Drawer` positions are physical, not mirrored in right-to-left languages.
- `AppBar` is one component: the `TopAppBar` props (`variant` `"small"`, `"center"`, `"medium"`, `"large"`, `leading`, `actions`, `subtitle`, `elevated`, `safeArea`) and, as before, react-navigation's header contract (`navigation`, `options`, `route`, `back`).

Added:

- `Dialog`: `width` (`"xs"`, `"sm"`, `"md"`, `"lg"`), `height`, `form` with `onSubmit`, `closeIcon`, `disableBackdropClick`, `disableEscapeKeyDown`, `slotStyles`. `ConfirmDialog`: `slotStyles`. New `Form` (`onSubmit`; a real `<form>` on the web) and `Button` `type` (`"button"`, `"submit"`).
- `Popover` and `Menu`: `anchorPosition` (`{ vertical, horizontal }`). `Menu`: `dividers`, `selected` (the `id`s drawn as selected) and `onClick(item)`.
- `Snackbar`: `severity` `"success"` (green) and `"info"` (blue), `variant` (`"contained"`, `"outlined"`), `position`, `action`, and `onClose` for a snackbar that stays until it is closed (`onDismiss` is the timeout).
- `Drawer`: `variant` (`"static"`, `"swipeable"`), `position` (`"left"`, `"right"`, `"top"`, `"bottom"`) and `elevation`. `AppBar`: `paper`.
- `Tabs`: `variant` (`"standard"`, `"rounded"`), `showBorders`, `size`, `fullWidth`, `height`, `width`, `color`. `Stepper`: `direction` (`"row"`, `"column"`). `Pagination`: `pageSelect` (a searchable page list), `color`, `variant`, `size`, `disabled`.
- `ListItem`: `disabled` and `testID`. `Stat`: `direction` (`"column"`, `"row"`) and `trendColor`. `CaptionValue`: `width`, `height`, `flex`, `padding`, `enableCopy`, `onCopy`, `showTooltip`, and `captionColor`/`valueColor` take a colour string as well as a theme token.
- `CircularProgress`: `label`, `labelPosition`, `trackColor`. `LinearProgress`: `label`, `labelPosition` (also inside the bar), `width`.
- `Box`: `padding`, `margin`, `background` and `variant` (`"standard"`, `"flex"`, `"column-flex"`, `"centered-flex"`, `"full-page-flex"`, ...), `style`. `Stack`: `dividers`, `spacing`, `style`. `Grid`: `columns`, `autoSize`, `spacing`, `size`, `wrap`.
- New `IFrame` (an `iframe` on the web, a notice on iOS and Android) and `Blink` (pulses its children; honours reduced motion).

Fixed:

- On the web a standard `IconButton` (no background) turned into a solid disc, glyph hidden, while hovered or pressed: `getStateColor` mixed the state layer into the `transparent` keyword and got it back opaque. The state layer now keeps its own 8% / 12% opacity.
- `CircularProgress` no longer makes React warn on the web about a non-boolean `collapsable` attribute on its ring (`Animated` marks the SVG circle `collapsable={false}` and react-native-svg wrote it on the DOM `<circle>`).
