# @its/glowup-notifications

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
