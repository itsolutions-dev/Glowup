# @its/glowup-pdf

A PDF viewer for Expo apps, built on `@its/glowup-ui`. Not published yet (`"private": true`).

Plan and decisions: `docs/solaris-native.md`, phase 6 and D9; spike result in `docs/spike-0.3-pdf.md`.

## Peers

`@its/glowup-ui`, `react` and `react-native`. The native modules (`react-native-pdf`,
`react-native-blob-util`) and `pdfjs-dist` will be **optional** peers: an app that only ships a website
installs none of the native ones.
