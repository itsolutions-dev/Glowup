# packages/pdf — the PDF viewer package

Plan and decisions: `docs/pdf-package-plan.md` (it replaces D9 of `docs/solaris-native.md`). Read it before adding anything.

- **No third-party libraries.** The viewer is ours: React Native, Expo and the operating systems' own PDF engines
  (PDFKit, `PdfRenderer`, the browser's viewer) are the only things it stands on. Do not add `pdfjs-dist`,
  `react-native-pdf`, `react-native-blob-util`, `react-native-webview` or a copy of their compiled files. Open source code
  with a permissive licence may be copied in and made ours (licence and author kept, noted in `docs/pdf-upstream.md`).
- **Sits on top of the library.** It may import `@its/glowup-ui`, **by package name only**. It imports neither
  `@its/glowup-device` nor `@its/glowup-notifications` nor another high-level package (`charts`, `pivot`), and nothing
  below it imports it. ESLint enforces all of it (`ADDON_PACKAGES` in the root `eslint.config.js`).
- **Private until ready.** `changeset publish` publishes any non-private package whose version is not on npm yet, so this
  one stays `"private": true` until its first release (it also needs its own trusted publisher on npmjs.com, see
  `release.yml`).
- **The viewer talks to adapters, never to Expo directly** (`src/types.ts`: `PdfNative`, `PdfFiles`, `PdfActions`), as
  `packages/device` does. `src/adapters.ts` is the Expo implementation; `@its/glowup-pdf/testing` has an in-memory one
  (`createMemoryPdf`) and every viewer test uses it: no `jest.mock` of Expo modules.
- **Expo modules are optional peers and are loaded when first used**, inside a `try` (`load()` in `adapters.ts`): an app that
  ships only a website installs none, and one that forgot the package in its dependencies gets a `native-missing` error
  with a readable text, not a crash at start-up.
- **The page drawing is native, everything else is JavaScript.** The native module has five functions (`capabilities`,
  `open`, `renderPage`, `search`, `close`); the toolbar, zoom, page list, search highlights and states are shared by iOS and
  Android. Search rectangles are fractions (0..1) of the page with the origin at the top left, whatever the platform.
- **The native module lives in this package**: `ios/` (Swift, PDFKit; podspec `GlowupPdf`), `android/` (Kotlin, `PdfRenderer`;
  built from source, `canBePublished false`) and `expo-module.config.json`; Expo autolinking picks it up from the app's
  dependency. Both sides keep documents open by file URI until `close`, run every call on one queue or thread (PDFKit and
  `PdfRenderer` are not thread safe), draw on white, write a JPEG into the cache and return its `file://` URI. Errors carry
  the words "password" or "format" in the message because `fromNativeError` (`src/adapters.ts`) reads them. A change to the
  module is verified only by `/native-check` in `native.yml`: read its `NATIVECHECK pdf` lines **and look at the screenshot**
  (`ios-pdf.png`, `android-pdf.png`): the "drawn at the width asked" row reads only the size of the image file, and it passed
  while PDFKit's `getDrawingTransform` was drawing the page at half size in the middle of it (it never scales a page up;
  the iOS module scales by hand).
- **Source identity is its content** (`sourceKey`): a new source, or a retry, remounts the viewer, so the document, the search
  and the zoom always belong to one source. A parent can pass the same content as a new object on every render.
- **Type-check and tests read the library's source** (`paths` in `tsconfig.json`): CI runs both before the build, and
  `packages/ui/lib` is build output. `tsconfig.build.json` clears the mapping so the declarations name the package.
- **Documentation.** The prop tables of `apps/playground` are generated from `packages/ui` only; this package's props are
  documented by hand (`docs/pdf-package-plan.md` §4, README) until the generator covers it.
- **Tests use `await` on every `fireEvent`**: this version of Testing Library is asynchronous, and an unawaited event overlaps
  `act()` and poisons the tests after it.
- **The web viewer is a separate file, not a branch of the native one.** `PdfViewer.web.tsx` has no adapters: it fetches and
  shows a `blob:` URL in an iframe (`webSource.ts`), because the browser already has the viewer. Its pure part,
  `loadPdfBlob`, is tested under `@jest-environment node` (real `Blob` and `Response`); the component is tested with that
  mocked. Read browser globals only inside effects and handlers: the static export prerenders in Node.
- **The playground page `/pdf`** (`apps/playground/app/pdf.tsx`) runs on `site/samplePdf.ts`, a three-page PDF built in code
  with known words ("hello" on pages 1 and 2, "1,250.00" on page 2), which `/native-check` can reuse for the native checks.
