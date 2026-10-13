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

| Prop              | Description                                                                                                                                   |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `androidChannels` | Channels created on mount. Android 13+ shows the permission prompt only after one exists, so `request()` waits for them.                      |
| `foreground`      | `{ banner, list, sound, badge }`, or a function of the notification. Default: all `true`.                                                     |
| `parseData`       | Validates `data`. Return `null` or throw to reject the payload: it then goes to `onEvent` as `invalid-payload` and skips the other callbacks. |
| `tokenType`       | `"expo"` (default) or `"device"` for raw FCM / APNs tokens.                                                                                   |
| `projectId`       | EAS project id for Expo tokens. Defaults to the one in the app config.                                                                        |
| `onTokenChange`   | Called on the first token and on every rotation.                                                                                              |
| `onReceived`      | A notification arrived while the app was open.                                                                                                |
| `onResponse`      | The user tapped a notification or an action. Called once per tap, including the tap that launched the app.                                    |
| `onEvent`         | Every event above plus `token-error` and `channels-error`, for logging.                                                                       |

Callbacks may be inline functions: the provider reads the latest one, so they never
re-subscribe the native listeners.

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

## Not included (yet)

Local scheduling, badge helpers, interactive categories, presented-notification
management, Web Push and test helpers are planned for v2. Background tasks stay out on
purpose, because they would add `expo-task-manager` as a required peer.
