# @its/glowup-ui

## 0.3.0

### Minor Changes

- 97efc5b: Add `AnimatedFAB`, put the two genuinely inline overlays behind `Portal`, and finish the
  playground catalogue.

  **`AnimatedFAB`** — the last react-native-paper component the kit was missing. Animates between
  an icon-only circle and a labelled pill; drive `extended` from a scroll offset for the M3
  shrink-on-scroll behaviour. `animateFrom` picks the edge the label grows from, `iconMode` decides
  whether the icon stays put or travels with the pill, and `placement="inline"` drops the absolute
  positioning so it can sit in a toolbar. The label is measured by an off-layout probe rather than
  the visible copy: measuring the visible one inside a container whose width animates and clips
  would report a width that changes every frame and feed back into the animation.

  **Overlays through `Portal`** — `Tooltip` and `Autocomplete`'s suggestion list now render through
  a mounted `Portal.Host`, so they escape an `overflow: hidden` parent and any sibling stacking
  context; `Tooltip` is also clamped to the window and `Autocomplete`'s list flips above the field
  when there is no room below. With no host mounted both stay exactly where they were, anchored in
  place, so this is opt-in and backwards compatible.

  Only those two moved, and that is the point. `Modal`, `ConfirmDialog`, `Popover`, `Menu`, `Select`
  and `BottomSheet` already go through a native `Modal` — a separate window on native, a
  `createPortal` into `document.body` on web — which is stronger isolation than an in-tree Portal,
  so migrating them would have been a regression. Portal earns its place in exactly the two cases a
  `Modal` cannot serve: a tooltip must never take touches, and the Autocomplete list must not steal
  focus from the field being typed into.

  Also skips `AnimatedFAB`'s dead mount animation — the value is initialised from `extended`, so
  animating to it on the first pass only scheduled a wasted frame.

  **Playground** — every component the library exports is now in the catalogue (84, up from 61 — 23 added),
  with the props panel wired for each: `Icon`, `TouchableRipple`, `HelperText`, `ListSection`,
  `ListSubheader`, the four `Card` parts, `AnimatedFAB`, `RadioButton`, `ToggleButton`,
  `AspectRatio`, `Center`, `Spacer`, `TabContent`, `Portal`, `LanguageSelector`,
  `DrawerPreferenceItem`, `ClockDial`, `DatePicker`, `TimePicker` and `TimeSelect`. The `Portal`
  demo shows content escaping a real clipping parent, since that is the only thing worth seeing.

  Props that shipped in the previous release but never reached the panel are there now too: `Modal`
  `dismissable` / `scrollable` / `icon`, `FAB` `placement`, `Tooltip` `enterDelay` / `leaveDelay` /
  `hideDelay`, `ToggleButtonGroup` `multiSelect` / `fullWidth` / `showSelectedCheck` / `disabled`,
  and `Card`'s `elevated` variant, which the panel had been missing since the variant existed.

  `AppBar`, `DrawerNavigation`, `StackNavigation` and `StatusBar` stay out of the catalogue, with
  the reason recorded in the source: the first three need a navigator's `navigation` / `route` /
  `options` or a `NavigationContainer` plus a route array, and `StatusBar` paints nothing of its
  own. Faking a navigator to fill the grid would preview a stub, not the component.

- 61853f8: Rebuild the date and time pickers on the Material 3 spec, modelled on
  `react-native-paper-dates`, and drop the OS pickers.

  `DateTimePicker` no longer renders `react-native-modal-datetime-picker` on iOS/Android: the same
  in-house surface now renders on every platform — a dialog on native, a popover docked to the field
  on web — so the picker follows `theme.json` instead of whatever the OS ships, and behaves the same
  on all three. Both native peer dependencies (`react-native-modal-datetime-picker`,
  `@react-native-community/datetimepicker`) are gone.

  New:

  - **M3 dialog chrome** — supporting text, a headline of the current draft, and a
    calendar↔keyboard toggle.
  - **Analog clock** — `ClockPicker` (hour/minute readouts + AM/PM switch) over `ClockDial`, the M3
    face with drag-to-set and an inner 13–00 ring in 24-hour mode. Drawn with plain Views, so it
    adds no SVG dependency. Replaces the scrolling columns inside the pickers; `TimeSelect` stays
    exported for compact inline use.
  - **Range and multiple selection** — `selectionMode="range" | "multiple"`, with a continuous band
    across the grid for a range. `DateRangePicker` locks the former.
  - **Typed entry** — the field and the dialog accept a date typed in the locale's own field order
    (`22/11/2026` in it-IT, `11/22/2026` in en-US), validated against `validRange` on blur.
    `DatePickerInput` locks it on.
  - **Endless month scrolling** — the calendar virtualizes months in one `FlatList`; `scrollMode="paged"`
    keeps the previous month-at-a-time chevrons.
  - `mode="datetime"` is now a two-step flow (day, then time) with Back/Next.

  Breaking:

  - `variant` (`"auto" | "native" | "inline"`) is removed — there is only one surface now.
  - `minimumDate` / `maximumDate` are replaced by `validRange={{ startDate, endDate, disabledDates }}`
    on `DateTimePicker` and `Calendar`. `isDateDisabled` still takes rules `validRange` cannot express,
    and no longer changes which surface is used.
  - `Calendar` reports through `onChange` / `onRangeChange` / `onDatesChange` depending on
    `selectionMode`.
  - `DateTimePickerProps` is a union discriminated on `selectionMode`; the value and `onChange`
    shapes follow it.

- e3dcb1c: Close the gaps against `react-native-paper`'s component set and fix the places where its
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

### Patch Changes

- 9afff72: Hold each component's `Animated.Value` in lazy state (`useState(() => new Animated.Value(…))`)
  instead of `useRef(new Animated.Value(…)).current`, in `Toggle`, `Snackbar`, `Tabs`, `SpeedDial`,
  `CircularProgress` and `LinearProgress`.

  Behaviour is unchanged — the instance is still created once and stays stable — but the value is
  read during render to build the interpolations, which is not what refs are for; the ref form also
  re-ran `new Animated.Value(…)` on every render and threw the result away. This clears
  `react-hooks/refs`, letting `npm run lint` gate CI.

## 0.2.0

### Minor Changes

- 1121ad8: Close the coverage gaps found by auditing the kit against NativeBase, and rewrite the date/time
  picker family.

  **New components.** Layout primitives `Box`, `Stack`/`HStack`/`VStack`, `Center`, `Spacer`, `Grid`
  and `AspectRatio`, all taking spacing/shape/color as theme token names. `FormControl` (with
  `useFormControl`), `PinInput`, `Autocomplete`, `IconButton`, `Link`, `Image`, `Stat`, `Collapse`,
  and `ToastProvider` + `useToast` for imperative, queued toasts.

  **Date/time pickers.** `Calendar`, `TimeSelect`, `DatePicker` and `TimePicker` are now exported,
  and `DateTimePicker` was rebuilt on top of them. Month and weekday names, week start, 12h/24h and
  AM/PM labels are derived from `Intl` instead of the hardcoded Italian arrays the web picker
  shipped; `mode="time"` and `mode="datetime"` get a real styled surface instead of an invisible
  native input; the web popover flips and clamps to the viewport and follows scroll/resize. New
  props: `minimumDate`, `maximumDate`, `isDateDisabled`, `error`, `helperText`, `required`,
  `clearable`/`onClear`, `placeholder`, `minuteInterval`, `locale`, `firstDayOfWeek`, `variant`,
  `labels`, `style`, `testID`. Full keyboard navigation on web (arrows, PageUp/PageDown, Home/End,
  Enter, Escape).

  `value` widens to `Date | null` so a picker can render empty; `onChange` keeps its
  `(date: Date) => void` signature, and clearing goes through `onClear`.

  **Fixes.** `Input`'s focus ring and error border were dead code — a leftover `BISECT-TEST` stub
  replaced the glow styles with a plain grey border, so a field with an `error` message looked
  normal. `Snackbar`'s `icon` is now typed as an icon name instead of `string` cast to `any`.
  `PressableState` gained the `focused` flag react-native-web provides.
