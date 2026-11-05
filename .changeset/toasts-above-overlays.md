---
"@its/glowup-ui": minor
---

**Toasts show above an open `Dialog`, `BottomSheet` or swipeable `Drawer`.** On iOS and Android these are separate native windows, so a toast raised while one was open was drawn under it, out of sight (and on the web it sat under the dialog's scrim). The topmost open overlay now draws the toasts in its own window; with none open they are at the app's root as before. A toast already on screen when an overlay opens moves into it and restarts its timer. With VoiceOver, a toast over a dialog is announced but its action button is reachable only once the dialog closes. `BottomSheet` also takes a `testID`.
