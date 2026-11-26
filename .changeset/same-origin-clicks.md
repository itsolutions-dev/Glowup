---
"@its/glowup-notifications": patch
---

The service worker opens a tapped notification's `url` only on the app's own origin (the root
otherwise): the notification and its data, which travel in the URL's hash, no longer go to
another site when a payload carries a foreign `url`.
