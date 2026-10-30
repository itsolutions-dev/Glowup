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

## 2026-10-30

**`customer-detail/`** — the CRM's customer detail with call outcome (`CustomerSectionPage`, the `ResultBox` flow,
`OutcomeDialog`, the mobile `MobileCustomerPage` and `OutcomeScreen`). `web-desktop-*` walk the flow: the three
columns, the outcome tiles after Risposto, the recall/appointment form (date typed as digits, slot, assignee,
reminder), the summary, the "Esito" dialog from the history, the phone-number popover, and the unsaved-changes
confirmation over the edit dialog. `web-phone-history-overflow-before.png` shows the history filter running off a
390 px screen, `web-phone-history-after.png` the same after the `ToggleButtonGroup` fix.
`android-navbar-under-gesture-bar-before.png` / `android-navbar-after.png` show `NavBar`'s bottom inset;
`android-keyboard-before.png` / `android-keyboard-after.png` show a full-screen dialog with the keyboard open, before
and after `KeyboardFrame` (before: the notes field half hidden and Confirm out of reach).

**`checks/`** — from a temporary check page, not a CRM screen: medium-weight labels cut on Android while the brand
font loaded after the first render, and after the playground loads it first (`android-labels-*`); what TalkBack says
for a filled field before and after `accessibilityLabelledBy` (`android-talkback-*`, TalkBack's "Display speech
output" at the bottom); a toast drawn above an open dialog (`android-toast-over-dialog.png`); a pressable `Card`
with actions next to a plain one (`web-card-actions.png`).
