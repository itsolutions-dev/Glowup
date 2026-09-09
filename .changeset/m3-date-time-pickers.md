---
"@glowup/ui": minor
---

Rebuild the date and time pickers on the Material 3 spec, modelled on
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
