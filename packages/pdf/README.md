# @its/glowup-pdf

A PDF viewer for Expo apps, built on `@its/glowup-ui`, with **no third-party libraries**. Not published yet (`"private": true`).

Plan and decisions: `docs/pdf-package-plan.md`. A live demo is the `/pdf` page of the playground.

## State

- **Web: done and checked in Chrome.** `PdfViewer.web.tsx` shows the file in the browser's own viewer (search, print, download,
  thumbnails) and adds a bar with "open in a new tab" and "save". A file behind a login is fetched with its headers, checked to
  start like a PDF (a login page or an error body that came back as a 200 is reported as such) and shown from a `blob:` URL.
- **Shared viewer for iOS and Android: done and tested with in-memory adapters** (pages, page number and "go to", zoom, search with
  highlights, print, save, loading and error states).
- **The native module is written but has never run on a device:** iOS draws and searches with PDFKit, Android draws with
  `PdfRenderer`. Android search is off for now (`capabilities().search` is `false`; plan step 6). The playground's
  `/native-check` opens a sample PDF, draws a page, searches a known word and opens a non-PDF, and the CI run reports it
  (`NATIVECHECK pdf …` lines, a screenshot). Until a run says so, treat iOS and Android as unverified.

## Peers

`@its/glowup-ui`, `expo`, `react` and `react-native`. `expo-file-system`, `expo-print` and `expo-sharing` are **optional**: an app
that only ships a website installs none of them.

## Limits, on purpose

- On the web, phones' browsers show little of a PDF in a page (Safari: the first page; Chrome on Android: none): use "open in a
  new tab". `onLoad` reports `pages: null` there, and `onPageChange` is never called: the browser's viewer does not tell.
- The browser's viewer names the document after its `blob:` address; `fileName` names the save and the iframe's title.
- Search finds text only: a PDF that is a scan (an image) has none, and nothing here recognises characters.
- No password-protected PDFs, no text selection or links inside a page on a phone, zoom by buttons, not by pinching.
- "Save" opens the system share sheet on a phone (on iOS it offers "Save to Files").
