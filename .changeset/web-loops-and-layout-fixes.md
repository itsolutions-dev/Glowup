---
"@its/glowup-ui": patch
---

Fixes found while syncing the design system:

- On the web, `LinearProgress`'s indeterminate bar and `CircularProgress`'s spinner (and so `Button`'s and `ProgressButton`'s loading states) played their animation once and stopped: a looped timing on the native driver runs a single iteration under react-native-web. They now loop on the JS driver on the web and keep the native driver on iOS and Android.
- `SpeedDial` no longer turns its whole button 45° when open, which drew the rounded-square trigger as a diamond: the trigger now shows a close icon while the actions are open.
- A vertical `Stepper` (`direction="column"`) keeps each label beside its circle; it sat centred on the circle and the line below it.
- `Tooltip` (and so a named `Avatar` and `CaptionValue`'s `showTooltip`) follows its parent's alignment instead of pinning itself to the start, and is never wider than its parent, so a value cut to one line stays cut.
