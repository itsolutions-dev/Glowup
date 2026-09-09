---
"@glowup/ui": minor
---

Close the gaps against `react-native-paper`'s component set and fix the places where its
implementation was better.

**New components**

- `Icon` — a source-agnostic icon primitive. Accepts a MaterialCommunityIcons glyph name, a
  bitmap (`require(...)` / `{ uri }`), a render function, or a ready-made element, so a consumer
  can bring their own icon set instead of being pinned to one font. `flipForRTL` mirrors
  directional glyphs.
- `TouchableRipple` — a `Pressable` that paints the Material 3 state layer (8% hover, 10% focus,
  12% press) over a given surface and falls back to `android_ripple` on Android. Every
  interactive surface in the kit re-derived this triple by hand; the exported `useStateLayer`
  hook gives the same colours to components that already own their `Pressable`.
- `HelperText` — the supporting text under a form control, with `type="info" | "error"`, an
  animated `visible`, the error glyph, and the field gutter. `Input`, `FormControl`, `PinInput`,
  `Autocomplete` and the date/time picker field now all render this instead of five near-copies
  of the same block, so error text finally looks the same on every field.
- `Portal` / `Portal.Host` — renders an overlay at the host instead of in place, so it escapes a
  clipping parent, sits above siblings regardless of elevation, and is not dragged by a
  `ScrollView`. With no host mounted the children render inline, so opting in is safe in a tree
  that has not been wrapped.
- `Card.Title` / `Card.Content` / `Card.Cover` / `Card.Actions` — the card header, body, media
  band and action row as composable parts (also exported as `CardTitle` and friends). `Card` was
  a bare container, so every card header was hand-built.
- `ListSection` / `ListSubheader` — a labelled group of `ListItem`s, with the label marked as a
  heading so assistive tech can jump between groups.

**Theme**

- Added the missing Material 3 colour roles `inverseSurface`, `inverseOnSurface`,
  `inversePrimary`, `surfaceTint` and `scrim` to both schemes. `Tooltip` used `onSurface` /
  `surface` as a stand-in for the inverse pair, and `Modal` hardcoded `rgba(0, 0, 0, 0.5)` for
  its scrim.

**Fixes**

- `Modal`: the scrim is now the `scrim` role at 32% instead of a hardcoded black; new
  `dismissable` (tap the scrim, press ESC on web — `onRequestClose` never covered the web ESC
  key), `scrollable` for content taller than the dialog, an `actions` slot, and an `icon` slot.
  Dropped the `flex: 1` on the body, which inside the centred column stretched the body to fill
  the dialog and pushed the actions off short content. Added `maxWidth`/`maxHeight` so a dialog
  stays on screen.
- `ConfirmDialog`: uses the new `actions` slot instead of a button row inside the body, and
  gained `icon` and `dismissable`.
- `FAB`: the hover state was `theme.colors.primaryContainer + "CC"` — string concatenation that
  silently produced an invalid colour for any non-6-digit-hex token and had no press state. It
  now uses the M3 state layer. New `placement="inline"` drops the absolute positioning so a FAB
  can sit in a toolbar or a card action row.
- `Tooltip`: `enterDelay` / `leaveDelay` so sweeping the pointer across a toolbar no longer
  flashes every tooltip in the row; shows on keyboard focus, not just hover; timers are cleared
  on unmount.
- `ToggleButtonGroup`: per-option `disabled`, group-wide `disabled`, `fullWidth` for equal-width
  segments, `showSelectedCheck` for the M3 segmented-button check mark, and correct roles — a
  single-select group is a `radiogroup` of `radio`s, a multi-select one a set of `checkbox`es,
  where before every segment announced as a plain button.
- `Card`: `borderRadius` and `padding` now come from the shape and spacing tokens rather than
  literal `12` / `16`.
