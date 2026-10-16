---
"@its/glowup-notifications": patch
---

`/testing` now resolves to the same build as the root entry. Its node10 fallback folder led
Metro to `src` on iOS and Android and to `lib/module` on the web, while the root resolved to
`lib/commonjs`, so the app bundled the package twice. The fallback folder and the root now
point only at `lib/commonjs`.
