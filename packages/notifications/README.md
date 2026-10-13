# @its/glowup-notifications

Headless push notifications for Expo apps, built on `expo-notifications`. It handles the
parts every app writes again: permissions, push tokens, what to show in the foreground,
taps (including the one that launched the app), Android channels and typed payloads.

It renders nothing and knows no navigator or backend. Your app decides what a tap opens
and where a token is registered.

## Install

```bash
npx expo install expo-notifications @its/glowup-notifications
```

Add the config plugin to `app.json` / `app.config.ts`:

```json
{ "expo": { "plugins": ["expo-notifications"] } }
```

Push needs a **development build**: Expo Go cannot receive remote notifications on Android.
On iOS you also need the push capability and an APNs key, and on Android a
`google-services.json` (FCM). See the
[expo-notifications setup guide](https://docs.expo.dev/push-notifications/push-notifications-setup/).

## Usage

```tsx
import {
  NotificationsProvider,
  useNotificationPermission,
  usePushToken,
} from "@its/glowup-notifications";

type Payload =
  { screen: "order"; orderId: string } | { screen: "chat"; chatId: string };

const parsePayload = (data: unknown): Payload | null =>
  typeof data === "object" && data !== null && "screen" in data
    ? (data as Payload)
    : null;

export default function App() {
  return (
    <NotificationsProvider<Payload>
      androidChannels={[{ id: "default", name: "General", importance: "high" }]}
      parseData={parsePayload}
      foreground={(n) => (n.data.screen === "chat" ? { sound: false } : {})}
      onTokenChange={(token) => api.registerDevice(token.data)}
      onResponse={({ notification }) =>
        router.push(routeFor(notification.data))
      }
      onEvent={(event) => log("notifications", event)}
    >
      <Root />
    </NotificationsProvider>
  );
}

function EnableNotifications() {
  const { status, canAskAgain, request, openSettings } =
    useNotificationPermission();
  if (status === "granted" || status === "unsupported") return null;
  return canAskAgain ? (
    <Button onPress={() => request()}>Enable notifications</Button>
  ) : (
    <Button onPress={openSettings}>Open settings</Button>
  );
}
```

## API

### `<NotificationsProvider>`

| Prop                     | Description                                                                                                                                   |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `androidChannels`        | Channels created on mount. Android 13+ shows the permission prompt only after one exists, so `request()` waits for them.                      |
| `categories`             | Action button sets registered on mount (and before the permission prompt). A notification picks one with `categoryId`.                        |
| `clearBadgeOnForeground` | Reset the app icon badge on mount and whenever the app returns to the foreground.                                                             |
| `foreground`             | `{ banner, list, sound, badge }`, or a function of the notification. Default: all `true`.                                                     |
| `parseData`              | Validates `data`. Return `null` or throw to reject the payload: it then goes to `onEvent` as `invalid-payload` and skips the other callbacks. |
| `tokenType`              | `"expo"` (default) or `"device"` for raw FCM / APNs tokens.                                                                                   |
| `projectId`              | EAS project id for Expo tokens. Defaults to the one in the app config.                                                                        |
| `onTokenChange`          | Called on the first token and on every rotation.                                                                                              |
| `onReceived`             | A notification arrived while the app was open.                                                                                                |
| `onResponse`             | The user tapped a notification or an action. Called once per tap, including the tap that launched the app.                                    |
| `onEvent`                | Every event above plus `token-error`, `channels-error` and `categories-error`, for logging.                                                   |

Callbacks may be inline functions: the provider reads the latest one, so they never
re-subscribe the native listeners. `androidChannels` and `categories` are applied once, on
mount.

### `useNotificationPermission()`

`{ status, canAskAgain, request(options?), refresh(), openSettings() }`. `status` is
`undetermined | granted | provisional | denied | unsupported`. Pass
`request({ provisional: true })` on iOS for quiet delivery without a prompt. The status is
read again when the app returns to the foreground, so it is correct after the user changes
it in system settings.

### `usePushToken()`

`{ token, status, error, refresh() }`. The token is fetched automatically once the
permission allows push. `status` is `idle | loading | ready | error`. An iOS simulator
always ends in `error`.

### `isNotificationsSupported`

`false` on web. There the provider reports `unsupported` and calls nothing.

### Local notifications

```ts
import {
  scheduleNotification,
  cancelScheduledNotification,
} from "@its/glowup-notifications";

const id = await scheduleNotification(
  {
    title: "Stand-up",
    body: "In 5 minutes",
    data: { room: "A" },
    channelId: "default",
  },
  { type: "weekly", weekday: 2, hour: 9, minute: 25 },
);
await cancelScheduledNotification(id);
```

Triggers: `{ type: "date", date }`, `{ type: "interval", seconds, repeats? }`,
`{ type: "daily", hour, minute }`, `{ type: "weekly", weekday, hour, minute }` (`weekday` 1 =
Sunday). Without a trigger the notification is delivered immediately. `options.id` replaces a
pending notification with the same id. `getScheduledNotifications(parseData?)` lists what is
still pending, and `cancelAllScheduledNotifications()` clears it.

### Actions

```tsx
<NotificationsProvider
  categories={[
    {
      id: "message",
      actions: [
        { id: "read", title: "Mark as read", opensApp: false },
        {
          id: "reply",
          title: "Reply",
          textInput: { submitButtonTitle: "Send", placeholder: "Message" },
        },
      ],
    },
  ]}
  onResponse={({
    actionIdentifier,
    userText,
    isDefaultAction,
    notification,
  }) => {
    if (actionIdentifier === "reply")
      api.reply(notification.data.chatId, userText);
  }}
/>
```

A remote push picks the category with its `categoryId` (`categoryId` in an Expo push
message), and a local notification with `categoryId` in `scheduleNotification()`.

### Badge and delivered notifications

- `getBadgeCount()`, `setBadgeCount(n)` and `clearBadge()`. `setBadgeCount` resolves to `false`
  where the launcher has no badges.
- `getPresentedNotifications(parseData?)`, `dismissNotification(id)` and
  `dismissAllNotifications()`.
- `dismissNotificationsWhere(predicate, parseData?)` dismisses the matching ones and resolves
  to how many it dismissed. For example, when the user opens a chat:
  `dismissNotificationsWhere((n) => n.data.chatId === chatId)`.

These helpers reject on web. Check `isNotificationsSupported` before calling them.

### Web Push

In browsers with service workers and the Push API, the same provider, hooks and callbacks
work on web once you pass `webPush`:

```tsx
<NotificationsProvider
  webPush={{
    vapidPublicKey: process.env.EXPO_PUBLIC_VAPID_PUBLIC_KEY,
    serviceWorkerPath: "/glowup-push-sw.js", // default
  }}
  onTokenChange={(token) => api.registerDevice(token.data)} // web: the subscription JSON
/>
```

1. Copy the service worker into the web app's public folder so it is served from the same
   origin. It ships in the package as `@its/glowup-notifications/service-worker.js`
   (`service-worker/glowup-push-sw.js`). If the app already has a service worker, use
   `importScripts("/glowup-push-sw.js")` from it instead. If the site is served from a
   subpath, include it in `serviceWorkerPath` and `scope`.
2. Generate a VAPID pair (`npx web-push generate-vapid-keys`). The public key goes in
   `webPush.vapidPublicKey`; the private key stays on the server that sends the pushes.
   Without a public key the permission still works, but the token stays `idle`.
3. Send JSON matching `WebPushPayload`: `{ id, title, body, data, icon, badge, url, actions }`.

How a push is handled:

- **A tab is visible:** the service worker hands the push to the page, where the
  `foreground` policy decides whether to show it, and `onReceived` fires.
- **No tab is visible:** the service worker shows the notification itself.
- **Tap:** it is delivered to an open tab, or the worker opens `url` with the tap in the URL
  hash. Either way it reaches `onResponse` once; `actions` arrive as `actionIdentifier`.

Only on native: text replies, categories, scheduling, badge and the presented-notification
helpers. Browsers prompt only from a user gesture, so call `request()` from a press handler.

## Testing

`@its/glowup-notifications/testing` is an in-memory `expo-notifications`, so the provider,
the hooks and the helpers run under Jest with nothing native:

```ts
jest.mock(
  "expo-notifications",
  () => require("@its/glowup-notifications/testing").notificationsMock.module,
);
import { notificationsMock } from "@its/glowup-notifications/testing";

beforeEach(() => {
  jest.clearAllMocks();
  notificationsMock.reset();
});

it("opens the order on tap", async () => {
  notificationsMock.setPermission("granted");
  // …render your app…
  await notificationsMock.deliver({ id: "n1", data: { orderId: "42" } });
  notificationsMock.tap("n1");
  expect(router.push).toHaveBeenCalledWith("/orders/42");
});
```

Controls: `setPermission`, `answerPermissionPromptWith`, `setPushToken`, `failPushToken`,
`rotatePushToken`, `setLaunchResponse`, `deliver`, `tap` (with `actionIdentifier` /
`userText`) and `fireScheduled`. State: `scheduled`, `presented`, `badge`, `channels`,
`categories`, `lastPresentation` (what the foreground policy decided) and `listenerCount`.
Builders: `buildNotification` and `buildResponse`. The module's functions are `jest.fn`s, so
`expect(...).toHaveBeenCalledWith` works on them.

## Not included

Background tasks stay out on purpose, because they would add `expo-task-manager` as a
required peer.
