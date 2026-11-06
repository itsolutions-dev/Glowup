# Native verification: component × platform

What has been **seen working**, where, and the proof. Item 1.3 / A7 of `solaris-native.md`, Stage 4 of
`docs/status.md`. Filled on 2026-11-02 for the components the four CRM pilot screens used (report, sign-in with 2FA,
contacts list, customer detail with outcome), plus the add-ons; the components added on 3–4/11 got their rows on 4/11.
Since 5/11 **every one of the 123 components of `@its/glowup-ui` has a row** (the list is
`docs/component-inventory.md`); the rows added that day carry only the checks that already had a source, so most of
their cells are "–". Each component has its page in the playground at `/components/<Name>`. Update a row when a check
is done; a cell without a source does not count.

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
- **Phone**: a real device. Since 6/11 one Android phone, a ZTE Blade A51 (Android 11, 32-bit, 2 GB, a slow phone on
  purpose), with a Release build; no iPhone yet.
- **TalkBack / VoiceOver**: a screen reader actually speaking. TalkBack on the local emulator (TalkBack 15, speech read
  from its "Display speech output"); VoiceOver never.

**Sources** (the dates are the handoffs in `docs/handoff/`, the pilots' screenshots are in `docs/pilots/`)

| Code   | What                                                                                                        |
| ------ | ----------------------------------------------------------------------------------------------------------- |
| P-rep  | Pilot "report" (CRM `WaveActivitiesReport`), 29/10: web 1440 / 390 px, local Android                        |
| P-sign | Pilot "sign-in with 2FA" (`Login`, `Verify2FA`, `Setup2FA`), 29/10: web, local Android                      |
| P-cont | Pilot "contacts list" (`AllCustomers`), 29/10: web, local Android                                           |
| P-cust | Pilot "customer detail with outcome" (`CustomerSectionPage`, `OutcomeDialog`), 30/10: web, local Android    |
| NC     | `/native-check` in CI, last run 4/11 on the pushed `dev`: 13 measurements PASS on iPhone, Android 14, 15    |
| AI     | `android-interact.mjs` in CI, 4/11 on the pushed `dev`: 16/16 on Android 14 and 15                          |
| WT     | Web tests in jsdom (2/11): roles and `aria-*`, Escape, Enter, focus ring, no button in a button             |
| CH     | Chromium checks of the app-breaking fixes (28/10) and of the `aria-*` attributes in the DOM (30/10)         |
| TB30   | TalkBack on text fields, 30/10 (`docs/pilots/2026-10-30/checks/android-talkback-*`)                         |
| TB2    | TalkBack pass, 2/11: accessibility tree of 35 pages, speech heard for each finding before and after         |
| PDF    | PDF checks of 20–23/10 (native CI, pinch, password, print, 300 pages)                                       |
| ZTE    | ZTE Blade A51, 6/11: `/native-check` (13 measurements PASS, PDF search off on Android 11) and Alice by hand |

## Fields and forms

| Component                    | Web                                          | iPhone (CI)              | Android (CI)                         | Android (local)                          | Phone                 | TalkBack                        | VoiceOver |
| ---------------------------- | -------------------------------------------- | ------------------------ | ------------------------------------ | ---------------------------------------- | --------------------- | ------------------------------- | --------- |
| `Input`                      | ✅ P-sign, P-cust; WT focus                  | ◐ NC drawn, dense height | ✅ AI typed, decimal comma; NC dense | ✅ P-sign, P-cust (keyboard in a dialog) | ◐ ZTE NC dense height | ✅ TB30 named by its label      | –         |
| `PasswordField`              | ✅ P-sign (strength, focus)                  | –                        | –                                    | ✅ P-sign                                | –                     | ◐ TB2 tree; same tie as `Input` | –         |
| `PinInput`                   | ✅ P-sign (fits 390 px)                      | –                        | –                                    | ✅ P-sign (code with keyboard)           | –                     | ◐ TB2 tree                      | –         |
| `NumberField`                | ✅ CH ("2,5" then +0.5)                      | –                        | –                                    | –                                        | –                     | ◐ TB2 tree                      | –         |
| `InputArea`                  | ✅ 26/10 (growth, cap)                       | –                        | –                                    | ✅ P-cust (notes above the keyboard)     | –                     | ◐ TB2 tree                      | –         |
| `Select`                     | ✅ P-rep, P-cust; WT combobox                | ◐ NC drawn, dense height | ◐ NC dense height                    | ✅ P-rep, P-cust                         | ◐ ZTE NC dense height | ◐ TB2 tree                      | –         |
| `Autocomplete`               | ✅ CH (Escape inside a dialog)               | –                        | –                                    | –                                        | –                     | – (tree not read: a spinner)    | –         |
| `DatePicker`                 | ✅ P-cust (digits typed)                     | –                        | –                                    | ✅ P-cust                                | –                     | ◐ TB2 tree                      | –         |
| `SearchBar`                  | ✅                                           | ◐ NC drawn               | ✅ AI typed                          | ✅ PDF search                            | –                     | –                               | –         |
| `Form` / `FormField`         | ✅ CH, WT (Enter submits, not when disabled) | –                        | –                                    | ✅ 30/10 (return key submits)            | –                     | –                               | –         |
| `FormControl` / `HelperText` | –                                            | –                        | –                                    | –                                        | –                     | –                               | –         |
| `CheckboxGroup`              | –                                            | –                        | –                                    | –                                        | –                     | –                               | –         |
| `RadioButton` / `RadioGroup` | ✅ WT (radio, checked when selected)         | –                        | –                                    | –                                        | –                     | –                               | –         |
| `Slider`                     | ✅ WT (slider, range and value)              | –                        | –                                    | –                                        | –                     | –                               | –         |
| `Rating`                     | –                                            | –                        | –                                    | –                                        | –                     | –                               | –         |
| `DateTimePicker`             | –                                            | –                        | –                                    | –                                        | –                     | –                               | –         |
| `TimePicker`                 | –                                            | –                        | –                                    | –                                        | –                     | –                               | –         |
| `Editable`                   | –                                            | –                        | –                                    | –                                        | –                     | –                               | –         |
| `Upload`                     | –                                            | –                        | –                                    | –                                        | –                     | –                               | –         |

## Actions

| Component            | Web                       | iPhone (CI)              | Android (CI)               | Android (local)           | Phone                       | TalkBack                                                  | VoiceOver |
| -------------------- | ------------------------- | ------------------------ | -------------------------- | ------------------------- | --------------------------- | --------------------------------------------------------- | --------- |
| `Button`             | ✅                        | ✅ NC dense, badge width | ✅ AI badge counts presses | ✅ all pilots             | ◐ ZTE NC dense, badge width | ✅ TB2 ("… Button"); icon-only needs `accessibilityLabel` | –         |
| `IconButton`         | ✅ P-rep (tonal on a bar) | –                        | –                          | ✅ P-rep                  | –                           | – (tree not read: a spinner)                              | –         |
| `FAB` (extended)     | ✅ P-cont                 | –                        | –                          | ✅ P-cont                 | –                           | ◐ TB2 tree                                                | –         |
| `ToggleButtonGroup`  | ✅ P-cust (fits 390 px)   | –                        | –                          | ◐ P-cust                  | –                           | ◐ TB2 tree                                                | –         |
| `Menu`               | ✅ P-cont (sort)          | –                        | –                          | ✅ P-cont                 | –                           | ◐ TB2 tree                                                | –         |
| `Badge`              | ✅                        | ✅ NC (on a button)      | ✅ AI                      | ✅ P-cont (filters count) | ◐ ZTE NC (on a button)      | ◐ TB2 tree                                                | –         |
| `ToggleButton`       | –                         | –                        | –                          | –                         | –                           | –                                                         | –         |
| `ButtonGroup`        | –                         | –                        | –                          | –                         | –                           | –                                                         | –         |
| `SplitButton`        | –                         | –                        | –                          | –                         | –                           | –                                                         | –         |
| `ProgressButton`     | –                         | –                        | –                          | –                         | –                           | –                                                         | –         |
| `SpeedDial`          | –                         | –                        | –                          | –                         | –                           | –                                                         | –         |
| `Chip` / `ChipGroup` | –                         | –                        | –                          | –                         | –                           | –                                                         | –         |
| `TouchableRipple`    | –                         | –                        | –                          | –                         | –                           | –                                                         | –         |
| `Link`               | –                         | –                        | –                          | –                         | –                           | –                                                         | –         |
| `Clipboard`          | –                         | –                        | –                          | –                         | –                           | –                                                         | –         |
| `Download`           | –                         | –                        | –                          | –                         | –                           | –                                                         | –         |

## Display

| Component                                                             | Web                                  | iPhone (CI)   | Android (CI)                   | Android (local)                                      | Phone | TalkBack                                     | VoiceOver |
| --------------------------------------------------------------------- | ------------------------------------ | ------------- | ------------------------------ | ---------------------------------------------------- | ----- | -------------------------------------------- | --------- |
| `Card`                                                                | ✅ P-rep (`selected`), WT (actions)  | –             | –                              | ✅ P-rep (selected border on tap)                    | –     | ✅ TB2 tree (icons silent)                   | –         |
| `CaptionValue`                                                        | ✅ P-cust                            | –             | –                              | ✅ P-cust                                            | –     | ◐ TB2 tree                                   | –         |
| `ListItem`                                                            | ✅ P-cont, P-cust                    | –             | –                              | ✅ P-cont (cards on a phone)                         | –     | ✅ TB2 heard ("Roadmap 2027.pdf, …. Button") | –         |
| `DataGrid`                                                            | ✅ P-cont (4 fixes)                  | –             | –                              | ✅ P-cont (loads more, scrolls sideways)             | –     | ◐ TB2 tree (rows named, badge once)          | –         |
| `Table`                                                               | ✅ P-rep (scrolls sideways), CH aria | –             | –                              | ✅ P-rep                                             | –     | ◐ TB2 tree                                   | –         |
| `StatusBadge`                                                         | ✅                                   | –             | –                              | ✅ P-cont                                            | –     | ✅ TB2 tree (label once)                     | –         |
| `Avatar`                                                              | ✅                                   | –             | –                              | ✅ P-cont                                            | –     | ✅ TB2 heard ("… Avatar. Image")             | –         |
| `Stepper`                                                             | ✅ P-cust                            | –             | –                              | ◐ P-cust                                             | –     | ◐ TB2 tree                                   | –         |
| `Tooltip`                                                             | ✅ P-rep (a node as content)         | –             | –                              | – (no hover on touch)                                | –     | ◐ TB2 tree                                   | –         |
| `Popover`                                                             | ✅ P-cust (phone numbers)            | –             | –                              | ✅ P-cust                                            | –     | ◐ TB2 tree                                   | –         |
| `QrCode`                                                              | ✅ P-sign                            | –             | –                              | ✅ P-sign                                            | –     | –                                            | –         |
| `Banner`                                                              | ✅ P-sign                            | –             | –                              | ✅ P-sign                                            | –     | ◐ TB2 tree                                   | –         |
| `WeekStrip`                                                           | ✅ 4/11 (arrows, by Alice)           | –             | –                              | ✅ 3/11 (press, swipe both ways)                     | –     | –                                            | –         |
| `DayTimeline`                                                         | ✅ 5/11 (by Alice)                   | –             | –                              | –                                                    | –     | –                                            | –         |
| `Skeleton`                                                            | ✅ 5/11 (`list`, by Alice)           | –             | –                              | –                                                    | –     | –                                            | –         |
| `Collapse`                                                            | –                                    | – (jest only) | ✅ AI (the drawer group opens) | ✅ 26/10 (the drawer group, after the `0ede135` fix) | –     | –                                            | –         |
| `Accordion`                                                           | –                                    | –             | –                              | – (same fix as `Collapse`, not seen)                 | –     | –                                            | –         |
| `Tree`                                                                | –                                    | –             | –                              | – (same fix as `Collapse`, not seen)                 | –     | –                                            | –         |
| `Carousel`                                                            | –                                    | –             | –                              | –                                                    | –     | –                                            | –         |
| `ScrollArea`                                                          | –                                    | –             | –                              | –                                                    | –     | –                                            | –         |
| `HoverCard`                                                           | –                                    | –             | –                              | – (no hover on touch)                                | –     | –                                            | –         |
| `Stat`                                                                | –                                    | –             | –                              | –                                                    | –     | –                                            | –         |
| `EmptyState`                                                          | –                                    | –             | –                              | –                                                    | –     | –                                            | –         |
| `CircularProgress` / `LinearProgress`                                 | –                                    | –             | –                              | –                                                    | –     | –                                            | –         |
| Card parts (`CardTitle`, `CardContent`, `CardActions`, `CardCover`)   | –                                    | –             | –                              | –                                                    | –     | –                                            | –         |
| Table parts (`TableHead`, `TableRow`, `TableCell`, `TableHeaderCell`) | –                                    | –             | –                              | –                                                    | –     | –                                            | –         |
| `CellText`                                                            | –                                    | –             | –                              | –                                                    | –     | –                                            | –         |
| `ListSection` / `ListSubheader`                                       | –                                    | –             | –                              | –                                                    | –     | –                                            | –         |
| `CodeBlock` / `HighlightedCode`                                       | –                                    | –             | –                              | –                                                    | –     | –                                            | –         |
| `Image`                                                               | –                                    | –             | –                              | –                                                    | –     | –                                            | –         |
| `IFrame`                                                              | –                                    | –             | –                              | –                                                    | –     | –                                            | –         |
| `Blink`                                                               | –                                    | –             | –                              | –                                                    | –     | –                                            | –         |

## Overlays and navigation

| Component                      | Web                                            | iPhone (CI)                | Android (CI)               | Android (local)                         | Phone | TalkBack                    | VoiceOver |
| ------------------------------ | ---------------------------------------------- | -------------------------- | -------------------------- | --------------------------------------- | ----- | --------------------------- | --------- |
| `Dialog`                       | ✅ CH, WT (Escape closes the top one)          | –                          | –                          | ✅ P-cust (full screen, keyboard, form) | –     | ◐ TB2 tree                  | –         |
| `AlertDialog`                  | ✅ CH (queued alerts, Escape)                  | –                          | –                          | ◐ P-cust (unsaved-changes guard)        | –     | ◐ TB2 tree                  | –         |
| `BottomSheet`                  | ✅                                             | – (drawn closed)           | ✅ AI opens, closes        | –                                       | –     | –                           | –         |
| `Drawer` / side sheet          | ✅                                             | ◐ NC drawn                 | ✅ AI group opens          | –                                       | –     | –                           | –         |
| `Snackbar` / toasts            | ✅                                             | –                          | –                          | ✅ 30/10 (toast above a dialog)         | –     | ◐ TB2 tree                  | –         |
| `Tabs`                         | ✅ WT (selected, disabled)                     | ◐ NC drawn                 | ✅ AI key, disabled tab    | ✅ P-cont                               | –     | ◐ TB2 tree                  | –         |
| `NavBar`                       | ✅ P-cust (390 px)                             | –                          | –                          | ✅ P-cust (above the gesture bar)       | –     | ◐ TB2 tree                  | –         |
| `Pagination`                   | ✅ WT (`aria-current`)                         | –                          | –                          | –                                       | –     | ◐ TB2 tree                  | –         |
| `Switch` / `Checkbox`          | ✅ WT (`aria-checked`)                         | –                          | –                          | ✅                                      | –     | ✅ TB2 heard (switch named) | –         |
| `TabContent`                   | –                                              | –                          | –                          | –                                       | –     | –                           | –         |
| `DrawerItem` / `DrawerSection` | –                                              | ◐ NC drawn                 | ✅ AI group opens          | –                                       | –     | –                           | –         |
| `AppBar`                       | –                                              | –                          | –                          | –                                       | –     | –                           | –         |
| `Toolbar`                      | –                                              | –                          | –                          | –                                       | –     | –                           | –         |
| `NavigationRail`               | –                                              | –                          | –                          | –                                       | –     | –                           | –         |
| `Breadcrumbs`                  | ✅ WT (navigation landmark, last item current) | –                          | –                          | –                                       | –     | –                           | –         |
| `Portal` / `PortalHost`        | –                                              | ◐ NC (the host is mounted) | ◐ NC (the host is mounted) | –                                       | –     | –                           | –         |

## Drag and drop and grid layout

Gabriele's, added to `ui` for the layout editor (`/templates/editor`, handoffs 27/10–5/11). Seen in the browser
inside the editor (1440 × 900, by Gabriele); on phones the pass is `docs/device-testing/layout-editor-device-checklist.md` (18 steps on
an iPhone and an Android, upright and sideways), not run yet. The variant galleries leave them out: their drags are
web-only fakes.

| Component                                      | Web                             | iPhone (CI) | Android (CI) | Android (local) | Phone | TalkBack | VoiceOver |
| ---------------------------------------------- | ------------------------------- | ----------- | ------------ | --------------- | ----- | -------- | --------- |
| `DragDropProvider` / `Draggable` / `Droppable` | ✅ layout editor (move, nest)   | –           | –            | –               | –     | –        | –         |
| `GridLayout`                                   | ✅ layout editor (move, resize) | –           | –            | –               | –     | –        | –         |

## Text, layout and providers

These sit inside the components above, so they have been on screen wherever those were; a cell here is filled only for
a check of their own. On iOS a quick look is enough: the page draws, nothing overflows, dark mode and rotation.

| Component                                | Web                                | iPhone (CI)               | Android (CI)              | Android (local)                 | Phone | TalkBack                                                  | VoiceOver |
| ---------------------------------------- | ---------------------------------- | ------------------------- | ------------------------- | ------------------------------- | ----- | --------------------------------------------------------- | --------- |
| `Typography`                             | –                                  | –                         | –                         | –                               | –     | –                                                         | –         |
| `Icon`                                   | –                                  | ◐ NC drawn                | ◐ NC drawn                | –                               | –     | ✅ TB2 (silent: decoration, named by the text next to it) | –         |
| `Divider`                                | –                                  | –                         | –                         | –                               | –     | –                                                         | –         |
| `Paper`                                  | –                                  | –                         | –                         | –                               | –     | –                                                         | –         |
| `Box`                                    | –                                  | –                         | –                         | –                               | –     | –                                                         | –         |
| `Stack` / `HStack` / `VStack`            | –                                  | –                         | –                         | –                               | –     | –                                                         | –         |
| `Grid`                                   | –                                  | –                         | –                         | –                               | –     | –                                                         | –         |
| `Center` / `AbsoluteCenter`              | –                                  | –                         | –                         | –                               | –     | –                                                         | –         |
| `Spacer` / `Break`                       | –                                  | –                         | –                         | –                               | –     | –                                                         | –         |
| `AspectRatio`                            | –                                  | –                         | –                         | –                               | –     | –                                                         | –         |
| `Visible`                                | –                                  | –                         | –                         | –                               | –     | –                                                         | –         |
| `ThemeProvider`                          | ✅ P-rep (Glowup and CRM palettes) | ◐ NC (the app runs in it) | ◐ NC (the app runs in it) | ✅ P-rep (both palettes)        | –     | n/a                                                       | n/a       |
| `ToastProvider`                          | –                                  | ◐ NC (mounted)            | ◐ NC (mounted)            | ✅ 30/10 (toast above a dialog) | –     | n/a                                                       | n/a       |
| `AlertProvider` / `AlertProviderWrapper` | –                                  | ◐ NC (mounted)            | ◐ NC (mounted)            | –                               | –     | n/a                                                       | n/a       |
| `ViewportProvider`                       | –                                  | –                         | –                         | –                               | –     | n/a                                                       | n/a       |

## Add-ons

| Component                     | Web                               | iPhone (CI)                                  | Android (CI)                             | Android (local)                  | Phone                                                   | TalkBack      | VoiceOver |
| ----------------------------- | --------------------------------- | -------------------------------------------- | ---------------------------------------- | -------------------------------- | ------------------------------------------------------- | ------------- | --------- |
| Charts (`BarChart`, outcomes) | ✅ P-rep, 27/10 (1440, 360, dark) | ✅ NC height, marks over the bars            | ✅ AI tap on a dense chart, marks        | ✅ P-rep                         | ✅ ZTE NC height, marks; bars tapped (Alice)            | –             | –         |
| `DonutChart`                  | ✅                                | ✅ NC drawn                                  | ✅ AI tap on a slice                     | ✅                               | ✅ ZTE NC drawn; charts page used (Alice)               | –             | –         |
| `PivotGrid`                   | ✅ P-rep                          | ✅ NC height, toolbar                        | ✅ AI open/close, scroll, `.xlsx` export | ✅ P-rep                         | ✅ ZTE NC height; scrolled both ways (Alice)            | ✅ 26/10 grid | –         |
| `PdfViewer`                   | ✅ PDF (open, print in Chrome)    | ✅ NC open, width, search, refuse, 300 pages | ✅ NC, AI page drawn                     | ✅ PDF (pinch, password, search) | ✅ ZTE open, pinch, print, save, 300 pages (search off) | –             | –         |
| `gradientStyle`               | ✅ P-rep                          | ✅ NC (the bar at the end)                   | ✅                                       | ✅ P-rep                         | ◐ ZTE NC drawn                                          | n/a           | n/a       |

**Added 4/11, seen on the web by Alice on 5/11, not yet on a device:** `Stepper` `variant="dots"` / `"progress"`
(also with many steps), `ToggleButtonGroup` with `null`/`true`/`false` values and a `tooltip` per segment (shown on
hover), `Dialog` `overline`, `leadingActions` and `dividers` (the focus skipping a leading "Delete" is in WT). Their
rows above are the older props.

## What the empty columns need

- **iPhone**: the CI only draws `/native-check`, and taps nothing. Everything above marked "–" or "◐" on iPhone needs
  the playground on a simulator by hand (the colleague's Mac) or iOS interaction steps in `native.yml` (an iOS
  counterpart of `android-interact.mjs`, through `xcrun simctl` and an XCUITest or Maestro flow).
- **Phone**: Android: the ZTE (6/11), by hand, page by page; a faster phone would add a second point. iPhone only with an Apple Developer account,
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
