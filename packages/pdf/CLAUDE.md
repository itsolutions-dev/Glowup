# packages/pdf — the PDF viewer package

Plan: `docs/solaris-native.md`, phase 6 and D9. Spike result: `docs/spike-0.3-pdf.md`.

- **Sits on top of the library.** It may import `@its/glowup-ui`, **by package name only**. It imports
  neither `@its/glowup-device` nor `@its/glowup-notifications` nor another high-level package (`charts`,
  `pivot`), and nothing below it imports it. ESLint enforces all of it (`ADDON_PACKAGES` in the root
  `eslint.config.js`): the app composes the packages.
- **Private until ready.** `changeset publish` publishes any non-private package whose version is not on npm
  yet, so this one stays `"private": true` until its first release (it also needs its own trusted publisher on
  npmjs.com, see `release.yml`).
- **Native modules are optional peers.** Metro resolves every static import reachable from the barrel, so a
  native import belongs in a file only the native build reaches (`.native.tsx` / `.web.tsx` split), and its
  module goes in `peerDependenciesMeta` as optional.
- **Native + authentication = download, then open the file** (D9, spike 0.3). Never `source.headers` of
  `react-native-pdf`: it fails on iOS and Android.
- **Type-check and tests read the library's source** (`paths` in `tsconfig.json`): CI runs both before the
  build, and `packages/ui/lib` is build output. `tsconfig.build.json` clears the mapping so the declarations name
  the package.
- **Documentation.** The prop tables of `apps/playground` are generated from `packages/ui` only; this
  package's props are documented by hand in its README until the generator covers it.
