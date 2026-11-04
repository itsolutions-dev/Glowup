# Native verification: component × platform

What has been **seen working**, where, and the proof. Item 1.3 / A7 of `solaris-native.md`, Stage 4 of
`docs/status.md`. Filled on 2026-11-02 for the components the four CRM pilot screens used (report, sign-in with 2FA,
contacts list, customer detail with outcome), plus the add-ons; the components added on 3–4/11 got their rows on 4/11. Update a row when a check is done; a cell without a
source does not count.

## How to read it

| Mark | Meaning                                                                       |
| ---- | ----------------------------------------------------------------------------- |
| ✅   | Seen working there: used, typed into, pressed or heard, not only drawn        |
| ◐    | Partly: drawn or measured but not used, or one aspect only (said in the cell) |
| ✖    | Seen broken there, not fixed yet                                              |
| –    | Not checked there                                                             |

**Platforms**

- **Web**: Chrome (headless via CDP or Playwright, 1440 and 390 px) and, since 2/11, the jsdom web tests
  (`packages/ui/src/__web_tests__`), which read the real DOM react-native-web draws.
- **iPhone (CI)**: the iPhone 17 Pro simulator in `native.yml`. It opens `/native-check` and takes screenshots while
  scrolling (`ios-seq-*.png`); **nothing is tapped or typed on iOS**, and the app log carries no `console.log`, so what
  is seen is what the screenshots show.
- **Android (CI)**: the API 34 and 35 emulators in `native.yml`, `/native-check` plus `scripts/android-interact.mjs`
  (16 steps that type, tap and scroll).
- **Android (local)**: the Pixel 8 emulator (API 35) on Alice's laptop, driven by hand; the pilot screens ran there.
- **Phone**: a real device. None yet, on either platform.
- **TalkBack / VoiceOver**: a screen reader actually speaking. TalkBack on the local emulator (TalkBack 15, speech read
  from its "Display speech output"); VoiceOver never.

**Sources** (the dates are the handoffs in `docs/handoff/`, the pilots' screenshots are in `docs/pilots/`)

| Code   | What                                                                                                     |
| ------ | -------------------------------------------------------------------------------------------------------- |
| P-rep  | Pilot "report" (CRM `WaveActivitiesReport`), 29/10: web 1440 / 390 px, local Android                     |
| P-sign | Pilot "sign-in with 2FA" (`Login`, `Verify2FA`, `Setup2FA`), 29/10: web, local Android                   |
| P-cont | Pilot "contacts list" (`AllCustomers`), 29/10: web, local Android                                        |
| P-cust | Pilot "customer detail with outcome" (`CustomerSectionPage`, `OutcomeDialog`), 30/10: web, local Android |
| NC     | `/native-check` in CI, last run 4/11 on the pushed `dev`: 13 measurements PASS on iPhone, Android 14, 15 |
| AI     | `android-interact.mjs` in CI, 4/11 on the pushed `dev`: 16/16 on Android 14 and 15                       |
| WT     | Web tests in jsdom (2/11): roles and `aria-*`, Escape, Enter, focus ring, no button in a button          |
| CH     | Chromium checks of the app-breaking fixes (28/10) and of the `aria-*` attributes in the DOM (30/10)      |
| TB30   | TalkBack on text fields, 30/10 (`docs/pilots/2026-10-30/checks/android-talkback-*`)                      |
| TB2    | TalkBack pass, 2/11: accessibility tree of 35 pages, speech heard for each finding before and after      |
| PDF    | PDF checks of 20–23/10 (native CI, pinch, password, print, 300 pages)                                    |

## Fields and forms

| Component            | Web                                          | iPhone (CI)              | Android (CI)                         | Android (local)                          | Phone | TalkBack                        | VoiceOver |
| -------------------- | -------------------------------------------- | ------------------------ | ------------------------------------ | ---------------------------------------- | ----- | ------------------------------- | --------- |
| `Input`              | ✅ P-sign, P-cust; WT focus                  | ◐ NC drawn, dense height | ✅ AI typed, decimal comma; NC dense | ✅ P-sign, P-cust (keyboard in a dialog) | –     | ✅ TB30 named by its label      | –         |
| `PasswordField`      | ✅ P-sign (strength, focus)                  | –                        | –                                    | ✅ P-sign                                | –     | ◐ TB2 tree; same tie as `Input` | –         |
| `PinInput`           | ✅ P-sign (fits 390 px)                      | –                        | –                                    | ✅ P-sign (code with keyboard)           | –     | ◐ TB2 tree                      | –         |
| `NumberField`        | ✅ CH ("2,5" then +0.5)                      | –                        | –                                    | –                                        | –     | ◐ TB2 tree                      | –         |
| `InputArea`          | ✅ 26/10 (growth, cap)                       | –                        | –                                    | ✅ P-cust (notes above the keyboard)     | –     | ◐ TB2 tree                      | –         |
| `Select`             | ✅ P-rep, P-cust; WT combobox                | ◐ NC drawn, dense height | ◐ NC dense height                    | ✅ P-rep, P-cust                         | –     | ◐ TB2 tree                      | –         |
| `Autocomplete`       | ✅ CH (Escape inside a dialog)               | –                        | –                                    | –                                        | –     | – (tree not read: a spinner)    | –         |
| `DatePicker`         | ✅ P-cust (digits typed)                     | –                        | –                                    | ✅ P-cust                                | –     | ◐ TB2 tree                      | –         |
| `SearchBar`          | ✅                                           | ◐ NC drawn               | ✅ AI typed                          | ✅ PDF search                            | –     | –                               | –         |
| `Form` / `FormField` | ✅ CH, WT (Enter submits, not when disabled) | –                        | –                                    | ✅ 30/10 (return key submits)            | –     | –                               | –         |

## Actions

| Component           | Web                       | iPhone (CI)              | Android (CI)               | Android (local)           | Phone | TalkBack                                                  | VoiceOver |
| ------------------- | ------------------------- | ------------------------ | -------------------------- | ------------------------- | ----- | --------------------------------------------------------- | --------- |
| `Button`            | ✅                        | ✅ NC dense, badge width | ✅ AI badge counts presses | ✅ all pilots             | –     | ✅ TB2 ("… Button"); icon-only needs `accessibilityLabel` | –         |
| `IconButton`        | ✅ P-rep (tonal on a bar) | –                        | –                          | ✅ P-rep                  | –     | – (tree not read: a spinner)                              | –         |
| `FAB` (extended)    | ✅ P-cont                 | –                        | –                          | ✅ P-cont                 | –     | ◐ TB2 tree                                                | –         |
| `ToggleButtonGroup` | ✅ P-cust (fits 390 px)   | –                        | –                          | ◐ P-cust                  | –     | ◐ TB2 tree                                                | –         |
| `Menu`              | ✅ P-cont (sort)          | –                        | –                          | ✅ P-cont                 | –     | ◐ TB2 tree                                                | –         |
| `Badge`             | ✅                        | ✅ NC (on a button)      | ✅ AI                      | ✅ P-cont (filters count) | –     | ◐ TB2 tree                                                | –         |

## Display

| Component      | Web                                  | iPhone (CI) | Android (CI) | Android (local)                          | Phone | TalkBack                                     | VoiceOver |
| -------------- | ------------------------------------ | ----------- | ------------ | ---------------------------------------- | ----- | -------------------------------------------- | --------- |
| `Card`         | ✅ P-rep (`selected`), WT (actions)  | –           | –            | ✅ P-rep (selected border on tap)        | –     | ✅ TB2 tree (icons silent)                   | –         |
| `CaptionValue` | ✅ P-cust                            | –           | –            | ✅ P-cust                                | –     | ◐ TB2 tree                                   | –         |
| `ListItem`     | ✅ P-cont, P-cust                    | –           | –            | ✅ P-cont (cards on a phone)             | –     | ✅ TB2 heard ("Roadmap 2027.pdf, …. Button") | –         |
| `DataGrid`     | ✅ P-cont (4 fixes)                  | –           | –            | ✅ P-cont (loads more, scrolls sideways) | –     | ◐ TB2 tree (rows named, badge once)          | –         |
| `Table`        | ✅ P-rep (scrolls sideways), CH aria | –           | –            | ✅ P-rep                                 | –     | ◐ TB2 tree                                   | –         |
| `StatusBadge`  | ✅                                   | –           | –            | ✅ P-cont                                | –     | ✅ TB2 tree (label once)                     | –         |
| `Avatar`       | ✅                                   | –           | –            | ✅ P-cont                                | –     | ✅ TB2 heard ("… Avatar. Image")             | –         |
| `Stepper`      | ✅ P-cust                            | –           | –            | ◐ P-cust                                 | –     | ◐ TB2 tree                                   | –         |
| `Tooltip`      | ✅ P-rep (a node as content)         | –           | –            | – (no hover on touch)                    | –     | ◐ TB2 tree                                   | –         |
| `Popover`      | ✅ P-cust (phone numbers)            | –           | –            | ✅ P-cust                                | –     | ◐ TB2 tree                                   | –         |
| `QrCode`       | ✅ P-sign                            | –           | –            | ✅ P-sign                                | –     | –                                            | –         |
| `Banner`       | ✅ P-sign                            | –           | –            | ✅ P-sign                                | –     | ◐ TB2 tree                                   | –         |
| `WeekStrip`    | ✅ 4/11 (arrows, by Alice)           | –           | –            | ✅ 3/11 (press, swipe both ways)         | –     | –                                            | –         |
| `DayTimeline`  | –                                    | –           | –            | –                                        | –     | –                                            | –         |
| `Skeleton`     | –                                    | –           | –            | –                                        | –     | –                                            | –         |

## Overlays and navigation

| Component             | Web                                   | iPhone (CI)      | Android (CI)            | Android (local)                         | Phone | TalkBack                    | VoiceOver |
| --------------------- | ------------------------------------- | ---------------- | ----------------------- | --------------------------------------- | ----- | --------------------------- | --------- |
| `Dialog`              | ✅ CH, WT (Escape closes the top one) | –                | –                       | ✅ P-cust (full screen, keyboard, form) | –     | ◐ TB2 tree                  | –         |
| `AlertDialog`         | ✅ CH (queued alerts, Escape)         | –                | –                       | ◐ P-cust (unsaved-changes guard)        | –     | ◐ TB2 tree                  | –         |
| `BottomSheet`         | ✅                                    | – (drawn closed) | ✅ AI opens, closes     | –                                       | –     | –                           | –         |
| `Drawer` / side sheet | ✅                                    | ◐ NC drawn       | ✅ AI group opens       | –                                       | –     | –                           | –         |
| `Snackbar` / toasts   | ✅                                    | –                | –                       | ✅ 30/10 (toast above a dialog)         | –     | ◐ TB2 tree                  | –         |
| `Tabs`                | ✅ WT (selected, disabled)            | ◐ NC drawn       | ✅ AI key, disabled tab | ✅ P-cont                               | –     | ◐ TB2 tree                  | –         |
| `NavBar`              | ✅ P-cust (390 px)                    | –                | –                       | ✅ P-cust (above the gesture bar)       | –     | ◐ TB2 tree                  | –         |
| `Pagination`          | ✅ WT (`aria-current`)                | –                | –                       | –                                       | –     | ◐ TB2 tree                  | –         |
| `Switch` / `Checkbox` | ✅ WT (`aria-checked`)                | –                | –                       | ✅                                      | –     | ✅ TB2 heard (switch named) | –         |

## Add-ons

| Component                     | Web                               | iPhone (CI)                                  | Android (CI)                             | Android (local)                  | Phone | TalkBack      | VoiceOver |
| ----------------------------- | --------------------------------- | -------------------------------------------- | ---------------------------------------- | -------------------------------- | ----- | ------------- | --------- |
| Charts (`BarChart`, outcomes) | ✅ P-rep, 27/10 (1440, 360, dark) | ✅ NC height, marks over the bars            | ✅ AI tap on a dense chart, marks        | ✅ P-rep                         | –     | –             | –         |
| `DonutChart`                  | ✅                                | ✅ NC drawn                                  | ✅ AI tap on a slice                     | ✅                               | –     | –             | –         |
| `PivotGrid`                   | ✅ P-rep                          | ✅ NC height, toolbar                        | ✅ AI open/close, scroll, `.xlsx` export | ✅ P-rep                         | –     | ✅ 26/10 grid | –         |
| `PdfViewer`                   | ✅ PDF (open, print in Chrome)    | ✅ NC open, width, search, refuse, 300 pages | ✅ NC, AI page drawn                     | ✅ PDF (pinch, password, search) | –     | –             | –         |
| `gradientStyle`               | ✅ P-rep                          | ✅ NC (the bar at the end)                   | ✅                                       | ✅ P-rep                         | –     | n/a           | n/a       |

**Added 4/11, in unit tests only (not seen on a device yet):** `Stepper` `variant="dots"` / `"progress"`,
`ToggleButtonGroup` with `null`/`true`/`false` values and a `tooltip` per segment, `Dialog` `overline`,
`leadingActions` and `dividers` (the focus skipping a leading "Delete" is in WT). Their rows above are the older
props.

## What the empty columns need

- **iPhone**: the CI only draws `/native-check`, and taps nothing. Everything above marked "–" or "◐" on iPhone needs
  the playground on a simulator by hand (the colleague's Mac) or iOS interaction steps in `native.yml` (an iOS
  counterpart of `android-interact.mjs`, through `xcrun simctl` and an XCUITest or Maestro flow).
- **Phone**: an `arm64` build from CI on one real Android phone (Stage 6). iPhone only with an Apple Developer account,
  or a free Apple ID in Xcode on the Mac (the app then expires after 7 days).
- **VoiceOver**: none yet. On the Mac's simulator (Accessibility Inspector) or a real iPhone. Safari on Alice's iPhone
  with VoiceOver covers the **web** build only.
- **TalkBack ◐**: the accessibility tree was read for 35 pages and every finding heard; a "◐" there is a tree that looked
  right without its speech being heard. `IconButton` and `Autocomplete` were not read (their pages show a spinner that
  never stops, so the tree dump never idles).

## Known limits found while filling this

- Fixed on 2/11 (see `status.md`): the endless calendar's nested-list warning; the Card page overflow (the galleries'
  fixed frames); long lists in `Select` and `Menu`; `Autocomplete` behind the keyboard.
- A required field's name on Android is its label view: TalkBack's text is "Edit box for Work email \*" (2/11), where
  iOS says "Work email" and nothing about required. Open.
- On iOS a toast above a dialog is announced but its button is out of VoiceOver's reach while the dialog is open
  (`accessibilityViewIsModal`, 30/10).
