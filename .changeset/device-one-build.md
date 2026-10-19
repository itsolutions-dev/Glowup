---
"@its/glowup-device": patch
---

Every subpath now resolves to the same build as the root entry. Metro reads a subpath
through its node10 fallback folder, whose `react-native` field led to `src` on iOS and Android
and whose `module` field led to `lib/module` on the web, while the root resolved through
`exports` to `lib/commonjs`: the app bundled `core/` twice, so adapters given to
`DeviceAdaptersProvider` (imported from the root) never reached the subpaths' hooks. The
fallback folders and the root now point only at `lib/commonjs`.
