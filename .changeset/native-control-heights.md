---
"@its/glowup-ui": patch
---

Fix control heights on iOS and Android, found by running the playground on a simulator and an emulator. `Select` no longer sets `height: "100%"` on its field, which resolved to a tall box on native and made `density` have no effect. A single-line `Input` no longer gets the 8 px of vertical padding meant for multiline text on iOS: the field is 56 high, as `minHeight` says, instead of 66. Web is unchanged.
