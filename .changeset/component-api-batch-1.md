---
"@its/glowup-ui": minor
---

**Breaking:** the first batch of the component API rename. Only the components listed here change; the rest keep `onPress`, `mode`, `onValueChange` and `multiSelect` until their own batch.

Renames, on `Button`, `ProgressButton`, `IconButton`, `Chip`, `ChipGroup`, `FAB`, `Card`, `Avatar`, `Typography`, `Input`, `Select`, `Switch`, `SearchBar`, `PinInput`, `Autocomplete`:

- `onPress` -> `onClick` (`Button`, `ProgressButton`, `IconButton`, `Chip`, `FAB`, `Card`, `Avatar`, `Typography`)
- `mode` -> `variant` (`Button`, `ProgressButton`, `IconButton`, `Chip`, `ChipGroup`); `ButtonMode` -> `ButtonVariant`, `IconButtonMode` -> `IconButtonVariant`
- `tone` -> `color` (`Button`); `ButtonTone` -> `ButtonColor`
- `onValueChange` -> `onChange` (`ChipGroup`, `Switch`); `multiSelect` -> `multiple` (`ChipGroup`, `Select`)
- `onChangeText` -> `onChange` (`Input`, `SearchBar`, `PinInput`, `Autocomplete`)
- `onSelect` -> `onChange` (`Select`). `Autocomplete.onSelect` is gone: `onSelectedChange` fires on every pick, and with `null` when the choice is cleared. `Autocomplete.debounceMs` -> `debounce`.
- `Button.iconPosition` is `"start" | "end"` (was `"left" | "right"`); `Card.Title` `left`/`right` -> `startIcon`/`endIcon`; `SearchBar.leadingIcon` -> `icon`; `Input.numberOfLines` -> `rows`.
- `Toggle` -> `Switch` (`SwitchProps`), `Spinner` (the number stepper) -> `NumberField` (`NumberFieldProps`).
- `AnimatedFAB` is removed: use `<FAB variant="animated">`. `FAB.size` is `"small" | "medium" | "large"` (`"regular"` is `"medium"`), and `size="extended"` is `variant="extended"`.
- `DatePickerInput`, `DateRangePicker`, `Calendar`, `ClockPicker` and `ClockDial` are no longer exported. Use `DatePicker` (`inputEnabled`, `selectionMode="range"`) and `TimePicker`; `variant="static"` on `DatePicker`, `TimePicker` and `DateTimePicker` draws the calendar or the clock inline, with no field or dialog, and reports every selection through `onChange`.

Added:

- `Typography`: `variant` takes `h1`-`h6`, `subtitle1`, `subtitle2`, `body1`, `body2`, `button`, `caption`, `overline` (the M3 role names still work), plus `color`, `fontSize`, `nowrap` and `align`.
- `Button`, `IconButton`, `Chip` and `Badge` take `color` roles (`primary`, `secondary`, `tertiary`, `error`, `success`, `warning`, `info`, `neutral`). `IconButton` takes `title`, a tooltip (its wrapper is not a second accessibility element, so a screen reader still reaches the button; `Tooltip` takes `anchorAccessible` for the same). `Chip` takes `size="large"` and `border` (`rounded`, `squared`, `circular`). `Badge` takes `position`.
- `FAB`: `variant` (`icon`, `extended`, `animated`) and `size`.
- `Input`, `Select` and `Autocomplete`: `variant="filled"` is now a tinted box with its border only while focused or in error, like `PinInput`'s cells, and says nothing about the label. Where the label sits is `labelPlacement` alone, `"outside"` by default for both variants (before, `filled` put it inside); `Select` takes `labelPlacement` too.
- `Input`: `labelPlacement`, `fullWidth`, `rows`. `Select`: `fullWidth`, `nullable`, `emptyMessage`, `disabledOptions`. `Autocomplete`: `variant`, `labelPlacement`, `fullWidth`, `defaultOptions`, `multiple`. `PinInput`: `variant`. `SearchBar`: `debounceTime`, `showLoading`. `Switch`: `label`, `labelPlacement`, `size`.
- New `CheckboxGroup`: options, an array `value`, `onChange` and `direction`.
- `Avatar`: `size` also takes `"small" | "medium" | "large"`, and its `name` shows as a tooltip. `Rating`: `interval` (`0.5` or `1`), `icon`, `required`, and a hover preview.

New `ViewportProvider` (`width`): everything under it that asks for the window width (`useBreakpoint`, `Grid`'s columns, the date pickers' choice of dialog or popover) sees that width instead, so a phone frame inside a desktop page can show the phone behaviour.

Date and time pickers: on the web the default variant opens docked to the field on a mouse and as a centred dialog (as native does) on a touch device or in a window narrower than 600 px; `presentation` (`"auto"`, `"popover"`, `"dialog"`) overrides it. The docked popover is placed once, for the tallest of its steps, and no longer jumps across the page when picking a day moves a date-and-time picker on to the time. `fieldVariant` (`"outlined"`, `"filled"`) gives the picker's field the look of `Input`'s `variant`. The calendar header is one control, the visible month and the year, and in a range the days between the first day and the one under the pointer are shaded as a preview. A date-only popover no longer shows a scrollbar. No Cancel or Next button (dismiss by tapping outside, back or Escape); in `datetime` a day tap moves on to the time by itself; the pencil toggle is gone; "Today" is an outlined button between the month arrows. `labels` loses `cancel`, `next`, `switchToKeyboard`, `switchToCalendar` and `switchToClock`.
