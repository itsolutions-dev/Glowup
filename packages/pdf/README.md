# @its/glowup-pdf

A PDF viewer for Expo apps, built on `@its/glowup-ui`, with **no third-party libraries**. Not published yet (`"private": true`).

Plan and decisions: `docs/pdf-package-plan.md`.

## State

The shared part is done and tested with in-memory adapters: the viewer (pages, page number and "go to", zoom, search with
highlights, print, save, loading and error states), the sources (`uri` with headers, `base64`, `bytes`) and the testing
adapters. **The native module (iOS: PDFKit, Android: `PdfRenderer`) and the web viewer are not written yet**, so today the
viewer reports `native-missing` on a device.

## Peers

`@its/glowup-ui`, `expo`, `react` and `react-native`. `expo-file-system`, `expo-print` and `expo-sharing` are **optional**: an app
that only ships a website installs none of them.

## Limits, on purpose

- On the web phones' browsers show little of a PDF in a page (Safari: the first page; Chrome on Android: none): the web viewer
  will always offer an "open" button that opens it in a tab.
- Search finds text only: a PDF that is a scan (an image) has none, and nothing here recognises characters.
- No password-protected PDFs, no text selection or links inside a page, zoom by buttons, not by pinching.
- "Save" opens the system share sheet on both platforms (on iOS it offers "Save to Files").
