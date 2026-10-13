---
"@its/glowup-device": minor
---

Five new capabilities, each on its own subpath with its Expo module as an optional peer:

- `/network` (`@react-native-community/netinfo`): `useNetwork()` (connected, internet
  reachable, type, metered, cellular generation; unknown is `null`, never `false`) and
  `useIsOnline()`, kept live through one shared subscription. On web, `navigator.onLine` and the
  Network Information API instead of netinfo's web build, which probes `HEAD /` every minute.
- `/battery` (`expo-battery`): `useBattery()` (level, charging state, Low Power Mode). On web,
  the Battery Status API (Chromium) instead of expo-battery's web build, whose listeners throw.
- `/keep-awake` (`expo-keep-awake`): `useKeepAwake({ enabled })`, one tag per mounted hook, and
  `useKeepAwakeSupport()`. On web, a Screen Wake Lock that is taken again after the tab is
  hidden and never leaks when deactivated mid-request.
- `/orientation` (`expo-screen-orientation`): `useOrientation()` (the interface orientation,
  live) and `useOrientationLock(lock, { enabled })`. Locks stack, the most recent wins, and
  releasing the last one restores the app's own orientation (expo's `unlockAsync()` would let a
  portrait-only app rotate). A refused lock is reported in `error`, never thrown.
- `/haptics` (`expo-haptics`): `useHaptics()` (impact, notification, selection, interaction;
  never rejects) and `hapticFeedback`, ready for `@its/glowup-ui`'s
  `ThemeProvider onInteractionFeedback`. Android interactions honour the system's touch
  feedback setting; nothing plays on web.
- `/testing`: `createMockNetworkAdapter`, `createMockBatteryAdapter`,
  `createMockKeepAwakeAdapter`, `createMockOrientationAdapter`, `createMockHapticsAdapter`.
