---
"@its/glowup-notifications": minor
---

Web Push. Pass `webPush={{ vapidPublicKey, serviceWorkerPath?, scope? }}` to
`NotificationsProvider` and, in browsers with service workers and the Push API, the same
hooks and callbacks work on web: `useNotificationPermission` asks the browser,
`usePushToken` returns the push subscription (`type: "web"`, `data` is its JSON), and
`onReceived` / `onResponse` fire for pushes and taps, including the tap that opens a new tab.
The service worker ships as `@its/glowup-notifications/service-worker.js`; serve it from
the app's origin. New `isWebPushSupported()` export, `WebPushConfig` and `WebPushPayload`
types, and a `web-push-error` event.
