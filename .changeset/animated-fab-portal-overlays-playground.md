---
"@glowup/ui": minor
---

Add `AnimatedFAB`, put the two genuinely inline overlays behind `Portal`, and finish the
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
