# Pilot screens: screenshots

The CRM pilot screens (Stage 3 in `docs/status.md`) are temporary playground pages, deleted once their gaps are
fixed. These screenshots are what is left of them: one folder per day, one per screen. Web shots come from headless
Chrome (1440 px desktop, 390 px phone), Android ones from the local Pixel 8 emulator. The data is invented.

## 2026-10-29

**`report/`** — the CRM's `WaveActivitiesReport`. Taken before the fixes of that day except where noted:
`web-desktop-charts.png` still shows a hand-drawn selected border and the calls table cut off (it scrolls sideways);
`web-tooltip-and-selected-card.png` shows `Card selected` and the rich `Tooltip` after the fix;
`web-crm-palette-gradient.png` and `android-*` show `gradientStyle` in the Glowup and CRM palettes.

**`sign-in-2fa/`** — the CRM's `Login`, `FirstLogin`, `Verify2FA`, `Setup2FA`. After the `PasswordField` fix;
`web-desktop-keyboard-focus.png` shows a field with keyboard focus after the focus-ring fix (one ring, not two);
`web-phone-code.png` and `android-code-keyboard.png` show the six code cells fitting a phone after the `PinInput` fix.

**`contacts/`** — the CRM's contacts list (`AllCustomers`). `web-desktop-table.png` is after the row-height and
column-width fixes but before the alignment one (header and rows drift by the scrollbar's width);
`web-desktop-table-aligned-sort-icons.png` is after all four `DataGrid` fixes. `android-table-scrolled-sideways.png`
shows the grid scrolled horizontally on a phone, header still lined up with the rows.
