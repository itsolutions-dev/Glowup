# @its/glowup-pdf

A PDF viewer for Expo apps on iOS, Android and the web, built on [`@its/glowup-ui`](https://www.npmjs.com/package/@its/glowup-ui).
It has **no third-party PDF library**: on iOS it draws with PDFKit, on Android with the system's `PdfRenderer`, and on the web it
hands the file to the browser's own viewer.

> Version 0.x: the API may still change between minor versions. Not on npm yet.

## Install

```bash
npx expo install @its/glowup-pdf @its/glowup-ui expo-file-system expo-print expo-sharing
```

- `expo-file-system`, `expo-print` and `expo-sharing` are **optional**. On iOS and Android the viewer uses them to download a file,
  print it and save it; an app that only ships a website can leave them out. A missing one does not stop the app from
  starting: the action that needs it reports an error with `code: "native-missing"`.
- The package has native code for iOS and Android, so it runs in a [development build](https://docs.expo.dev/develop/development-builds/introduction/)
  or a release build, **not in Expo Go**. It links itself (Expo autolinking): run `npx expo prebuild` or build with EAS as usual.
- Requires Expo SDK 57 or later, React Native 0.86, React 19, iOS 16.4.

## Use

```tsx
import { PdfViewer } from "@its/glowup-pdf";

// A file behind a login: the viewer sends the headers, keeps the copy in the cache and removes it after.
<PdfViewer
  source={{
    uri: "https://example.com/files/42.pdf",
    headers: { Authorization: `Bearer ${token}` },
  }}
  fileName="contract-42.pdf"
  onError={(error) => console.warn(error.code)}
/>;

// A file already in memory
<PdfViewer source={{ base64 }} />;
<PdfViewer source={{ bytes }} />; // a Uint8Array
```

Give the viewer a height (its parent's, or `style`): it fills the box it is in.

| Prop                | Meaning                                                                                                   |
| ------------------- | --------------------------------------------------------------------------------------------------------- |
| `source`            | `{ uri, headers? }`, `{ base64 }` or `{ bytes }`.                                                         |
| `fileName`          | The name used when the file is saved or printed.                                                          |
| `initialPage`       | The page to open on, from 1.                                                                              |
| `onLoad({ pages })` | Called once the file is open. `pages` is `null` on the web, where the browser's viewer does not tell.     |
| `onPageChange`      | `(page, pages)`, on iOS and Android.                                                                      |
| `onError(error)`    | `error.code` is `"network"`, `"format"` (not a PDF), `"password"`, `"unsupported"` or `"native-missing"`. |
| `toolbar`           | The bar with the page, zoom, search, print and save controls. Defaults to `true`.                         |
| `labels`            | The bar's texts, for another language (`defaultPdfLabels` has the English ones).                          |
| `style`             | The viewer's box.                                                                                         |

`PdfProvider` with `adapters` replaces how the viewer downloads, prints and saves (for tests, or an app with its own file layer);
`@its/glowup-pdf/testing` has in-memory adapters for jest.

## Where it works

| Platform    | How                                                                                                                                                                                                                                                                         |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Web**     | The browser's own viewer (search, print, download, thumbnails), with a bar to open the file in a new tab and save it. A file behind a login is fetched with its headers and checked to be a PDF, so a login page that came back instead is reported as an error, not shown. |
| **iOS**     | Pages drawn with PDFKit, page by page as you scroll; zoom with two fingers or the buttons; search with highlights; print; save through the share sheet ("Save to Files").                                                                                                   |
| **Android** | Pages drawn with `PdfRenderer`; the same controls. Search needs Android 15, or Android 11 to 14 with the system's PDF update (SDK extension 13); on older phones the search control is hidden.                                                                              |

Checked in unit tests, in Chrome, and on the iOS simulator and the Android 14 and 15 emulators in CI (it opens a file, draws a page
at the width asked, searches a known word, refuses a file that is not a PDF, opens a 300-page file quickly). **Not yet tried on a
real phone.**

## Limits, on purpose

- Phones' browsers show little of a PDF inside a page (Safari the first page, Chrome on Android none): on a phone browser, use the
  bar's "open in a new tab".
- Search finds text only. A scanned PDF (an image of a page) has none, and nothing here recognises characters.
- No password-protected PDFs (they are reported with `error.code === "password"`), and on a phone no text selection and no links
  inside a page.
- On the web the browser names the document after its temporary address; `fileName` names the saved file.

## License

MIT
