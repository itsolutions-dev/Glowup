# @its/glowup-notifications

## 0.3.1

### Patch Changes

- 1f87eb7: Internal cleanup with no API change. Web Push now passes the VAPID public key to
  `pushManager.subscribe` as the base64url string, which the Push API decodes
  itself. The web push path and the `/testing` mock share one notification builder,
  and scheduled and delivered notifications share one payload parser.

## 0.3.0

### Minor Changes

- ecd582c: Web Push. Pass `webPush={{ vapidPublicKey, serviceWorkerPath?, scope? }}` to
  `NotificationsProvider` and, in browsers with service workers and the Push API, the same
  hooks and callbacks work on web: `useNotificationPermission` asks the browser,
  `usePushToken` returns the push subscription (`type: "web"`, `data` is its JSON), and
  `onReceived` / `onResponse` fire for pushes and taps, including the tap that opens a new tab.
  The service worker ships as `@its/glowup-notifications/service-worker.js`; serve it from
  the app's origin. New `isWebPushSupported()` export, `WebPushConfig` and `WebPushPayload`
  types, and a `web-push-error` event.

### Patch Changes

- 84876f3: Web Push: a push that reaches a visible tab is no longer shown with `showNotification`
  when the browser permission is not granted (the browser refused it and a
  `web-push-error` was reported). `onReceived` still fires.

## 0.2.0

### Minor Changes

- 9bc1342: Local notifications, actions, badge and delivered-notification helpers, plus a testing subpath.

  - `scheduleNotification(content, trigger?, { id? })` with `date`, `interval`, `daily` and `weekly`
    triggers, `cancelScheduledNotification`, `cancelAllScheduledNotifications` and
    `getScheduledNotifications`.
  - `categories` on `NotificationsProvider` registers action buttons (including text replies)
    before the permission prompt. The chosen action and its reply text reach `onResponse`, and
    the `response` event now carries `isDefaultAction`.
  - `getBadgeCount`, `setBadgeCount` and `clearBadge`, plus `clearBadgeOnForeground` on the
    provider.
  - `getPresentedNotifications`, `dismissNotification`, `dismissAllNotifications` and
    `dismissNotificationsWhere`.
  - `@its/glowup-notifications/testing`: an in-memory `expo-notifications` for Jest with
    controls (`deliver`, `tap`, `setPermission`, `rotatePushToken`…) and builders.

## 0.1.0

### Minor Changes

- 4e4cc24: First release of `@its/glowup-notifications`, a headless push notification layer on top of
  `expo-notifications`: `NotificationsProvider`, `useNotificationPermission`, `usePushToken`, a
  foreground presentation policy, tap handling delivered once (including the tap that launched
  the app), Android channels created before the permission prompt, and typed payloads through
  `parseData`.
