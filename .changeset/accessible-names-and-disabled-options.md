---
"@its/glowup-ui": minor
---

Accessible names for an interface not in English: `Pagination` `labels` (`pagination`, `previous`, `next`, `first`, `last`, `page` with `{{page}}`, `selectPage`, `searchPage`), `SpeedDial` `openLabel` / `closeLabel`, `Snackbar` `closeLabel` and `ToastProvider` `closeLabel`. On the web a disabled `Select` option and a disabled `Menu` item now carry `aria-disabled` (react-native-web dropped it), and `Select` and `Menu` draw up to 100 entries at once, virtualising only longer lists, so every option can be found without scrolling.
