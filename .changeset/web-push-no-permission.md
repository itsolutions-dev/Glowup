---
"@its/glowup-notifications": patch
---

Web Push: a push that reaches a visible tab is no longer shown with `showNotification`
when the browser permission is not granted (the browser refused it and a
`web-push-error` was reported). `onReceived` still fires.
