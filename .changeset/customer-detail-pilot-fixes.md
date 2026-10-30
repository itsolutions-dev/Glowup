---
"@its/glowup-ui": minor
---

Fixes found by building the CRM's customer detail with call outcome using the library alone (checked on the web at 1440 and 390 px and on the Android emulator):

- **Fields stay above the on-screen keyboard in a `Dialog`, `BottomSheet` or side sheet.** A `Modal` is a window of its own, which Android does not resize for the keyboard: in a full-screen dialog the notes field was half hidden and the Confirm button sat behind the keyboard, out of reach. The window now gives up the room the keyboard takes.
- **`NavBar` clears the gesture bar.** It pads the bottom safe-area inset, as `AppBar` pads the top one (on Android 15, which draws apps edge to edge, its labels sat under the gesture bar). `safeArea={false}` turns it off.
- **A date can be typed as digits only** (`05112026`, `051126`): they are read in the locale's field order. They were rejected as "Not a valid date".
- **`Select`'s error line is the other fields'**: the alert glyph and gutter, and announced by TalkBack as it appears (it was a bare red text, never read out).
- **`ToggleButtonGroup` stays inside its container**: narrower than its labels, its segments shrink and the labels end in an ellipsis; four segments ran off a phone's screen. With `fullWidth` they share the width evenly.
