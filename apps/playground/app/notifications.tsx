import { useCallback, useState } from "react";
import {
  Banner,
  Button,
  EmptyState,
  HStack,
  Icon,
  ListItem,
  ListSection,
  Skeleton,
  StatusBadge,
  Toggle,
  Typography,
  VStack,
  useTheme,
  type MaterialCommunityIconsGlyphs,
} from "@its/glowup-ui";
import {
  DEFAULT_FOREGROUND,
  NotificationsProvider,
  clearBadge,
  dismissAllNotifications,
  getBadgeCount,
  getPresentedNotifications,
  isNotificationsSupported,
  scheduleNotification,
  setBadgeCount,
  useNotificationPermission,
  usePushToken,
  type ForegroundPresentation,
  type NotificationCategory,
  type NotificationsEvent,
  type PermissionStatus,
} from "@its/glowup-notifications";

import { CodeBlock } from "../site/CodeBlock";
import { Page, Section } from "../site/Page";

const DEMO_CHANNEL = "demo";
const DEMO_CATEGORY = "order";
const DEMO_CATEGORIES: NotificationCategory[] = [
  {
    id: DEMO_CATEGORY,
    actions: [
      { id: "track", title: "Track" },
      {
        id: "reply",
        title: "Reply",
        opensApp: false,
        textInput: { submitButtonTitle: "Send", placeholder: "Message" },
      },
    ],
  },
];
const LOG_LIMIT = 20;

const INSTALL = `npx expo install expo-notifications @its/glowup-notifications`;

const USAGE = `import {
  NotificationsProvider,
  useNotificationPermission,
  usePushToken,
} from "@its/glowup-notifications";

export default function App() {
  return (
    <NotificationsProvider
      androidChannels={[{ id: "default", name: "General", importance: "high" }]}
      foreground={{ banner: true, sound: false }}
      onTokenChange={(token) => api.registerDevice(token.data)}
      onResponse={({ notification }) => router.push(routeFor(notification.data))}
    >
      <Root />
    </NotificationsProvider>
  );
}

const EnableNotifications = () => {
  const { status, canAskAgain, request, openSettings } = useNotificationPermission();
  if (status === "granted") return null;
  return canAskAgain
    ? <Button onPress={() => request()}>Allow notifications</Button>
    : <Button onPress={openSettings}>Open settings</Button>;
};`;

interface LoggedEvent {
  key: number;
  at: string;
  event: NotificationsEvent;
}

const PRESENTATION_ROWS: {
  key: keyof ForegroundPresentation;
  label: string;
  description: string;
}[] = [
  {
    key: "banner",
    label: "Banner",
    description: "Slide the notification in at the top.",
  },
  {
    key: "list",
    label: "Notification list",
    description: "Keep it in Notification Center / the shade.",
  },
  { key: "sound", label: "Sound", description: "Play the notification sound." },
  {
    key: "badge",
    label: "Badge",
    description: "Apply the badge count the payload carries.",
  },
];

const STATUS_BADGE: Record<
  PermissionStatus,
  { label: string; type: "success" | "error" | "warning" }
> = {
  granted: { label: "Granted", type: "success" },
  provisional: { label: "Provisional", type: "success" },
  undetermined: { label: "Not asked", type: "warning" },
  denied: { label: "Denied", type: "error" },
  unsupported: { label: "Unsupported", type: "warning" },
};

const describeEvent = (
  event: NotificationsEvent,
): { icon: MaterialCommunityIconsGlyphs; title: string; detail: string } => {
  switch (event.type) {
    case "permission":
      return {
        icon: "shield-check-outline",
        title: "Permission",
        detail: event.status,
      };
    case "token":
      return { icon: "key-outline", title: "Token", detail: event.token.data };
    case "token-error":
      return {
        icon: "key-remove",
        title: "Token error",
        detail: String(event.error),
      };
    case "channels-error":
      return {
        icon: "alert-circle-outline",
        title: "Channel error",
        detail: String(event.error),
      };
    case "categories-error":
      return {
        icon: "alert-circle-outline",
        title: "Category error",
        detail: String(event.error),
      };
    case "received":
      return {
        icon: "bell-ring-outline",
        title: "Received in foreground",
        detail: event.id,
      };
    case "response":
      return event.isDefaultAction
        ? { icon: "gesture-tap", title: "Tapped", detail: event.id }
        : {
            icon: "gesture-tap-button",
            title: `Action “${event.actionIdentifier}”`,
            detail: event.id,
          };
    case "invalid-payload":
      return {
        icon: "file-alert-outline",
        title: "Rejected payload",
        detail: event.id,
      };
  }
};

/**
 * The page owns the provider, so the switches below feed its `foreground`
 * prop and its events land in the log. In an app it sits at the root instead:
 * mounted here, a tap only reaches `onResponse` while this page is open.
 */
export default function NotificationsPage() {
  const [presentation, setPresentation] =
    useState<ForegroundPresentation>(DEFAULT_FOREGROUND);
  const [events, setEvents] = useState<LoggedEvent[]>([]);

  const onEvent = useCallback((event: NotificationsEvent) => {
    setEvents((previous) =>
      [
        {
          key: Date.now() + Math.random(),
          at: new Date().toLocaleTimeString(),
          event,
        },
        ...previous,
      ].slice(0, LOG_LIMIT),
    );
  }, []);

  return (
    <NotificationsProvider
      androidChannels={[
        { id: DEMO_CHANNEL, name: "Playground demo", importance: "high" },
      ]}
      categories={DEMO_CATEGORIES}
      foreground={presentation}
      onEvent={onEvent}
    >
      <Page
        eyebrow="Companion package"
        title="Notifications"
        description="@its/glowup-notifications is the headless push layer that sits beside the kit: permissions, push tokens, foreground presentation and taps, with no UI of its own. Everything on this page is rendered with Glowup components and driven by it."
        banner={
          <Banner
            visible
            type="info"
            icon="information-outline"
            message={
              isNotificationsSupported
                ? "Remote push needs a development build with APNs / FCM credentials; Expo Go on Android cannot fetch a push token. The test notification below is local and works anywhere."
                : "Push notifications need iOS or Android. On the web the provider reports “unsupported” and calls nothing, so this page shows the API rather than running it."
            }
          />
        }
      >
        <PermissionSection />
        <TokenSection />
        <ForegroundSection value={presentation} onChange={setPresentation} />
        <TrySection />
        <BadgeSection />
        <EventLogSection events={events} onClear={() => setEvents([])} />

        <Section
          title="Wire it up"
          description="Mount the provider once at the root. Routing and token registration stay in your app, through the callbacks."
        >
          <CodeBlock code={INSTALL} language="bash" title="Terminal" />
          <CodeBlock code={USAGE} title="App.tsx" />
        </Section>
      </Page>
    </NotificationsProvider>
  );
}

const PermissionSection = () => {
  const { status, canAskAgain, request, openSettings } =
    useNotificationPermission();
  const [busy, setBusy] = useState(false);
  const badge = STATUS_BADGE[status];
  const allowed = status === "granted" || status === "provisional";

  const ask = async () => {
    setBusy(true);
    try {
      await request();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Section
      title="Permission"
      description="Read on mount and again whenever the app returns to the foreground, so it is right after a trip to system settings. On Android the demo channel exists before the prompt is shown."
    >
      <HStack spacing="m" align="center" wrap>
        <StatusBadge label={badge.label} type={badge.type} />
        {status === "unsupported" || allowed ? null : canAskAgain ? (
          <Button iconName="bell-outline" loading={busy} onPress={ask}>
            Allow notifications
          </Button>
        ) : (
          <Button mode="outlined" iconName="cog-outline" onPress={openSettings}>
            Open settings
          </Button>
        )}
      </HStack>
    </Section>
  );
};

const TokenSection = () => {
  const { theme } = useTheme();
  const { token, status, error, refresh } = usePushToken();

  let body: React.ReactNode;
  if (status === "loading") {
    body = <Skeleton variant="rect" height={theme.spacing.xl * 2} />;
  } else if (token) {
    body = (
      <CodeBlock
        code={token.data}
        language="json"
        title={`${token.type} token`}
      />
    );
  } else if (status === "error") {
    body = (
      <VStack spacing="s" align="flex-start">
        <Typography variant="bodyMedium" style={{ color: theme.colors.error }}>
          {String(error)}
        </Typography>
        <Button mode="text" iconName="refresh" onPress={() => void refresh()}>
          Try again
        </Button>
      </VStack>
    );
  } else {
    body = (
      <Typography
        variant="bodyMedium"
        style={{ color: theme.colors.onSurfaceVariant }}
      >
        No token yet. It is fetched by itself as soon as the permission allows
        push.
      </Typography>
    );
  }

  return (
    <Section
      title="Push token"
      description="An Expo push token by default (tokenType=“device” for raw FCM / APNs). onTokenChange fires on the first one and on every rotation — that is where you register it with your backend."
    >
      {body}
    </Section>
  );
};

const ForegroundSection = ({
  value,
  onChange,
}: {
  value: ForegroundPresentation;
  onChange: (next: ForegroundPresentation) => void;
}) => {
  return (
    <Section
      title="Foreground presentation"
      description="What happens when a notification arrives while the app is open. These switches feed the provider's foreground prop; it can also be a function of the notification."
    >
      <ListSection>
        {PRESENTATION_ROWS.map((row) => (
          <ListItem
            key={row.key}
            secondary={row.description}
            trailing={
              <Toggle
                value={value[row.key]}
                onValueChange={(next) =>
                  onChange({ ...value, [row.key]: next })
                }
              />
            }
          >
            {row.label}
          </ListItem>
        ))}
      </ListSection>
    </Section>
  );
};

const TrySection = () => {
  const { status } = useNotificationPermission();
  const [scheduled, setScheduled] = useState(false);
  const allowed = status === "granted" || status === "provisional";

  const send = async () => {
    setScheduled(true);
    try {
      await scheduleNotification(
        {
          title: "Order #42 shipped",
          body: "Tap to open it, or expand it for Track and Reply.",
          data: { screen: "order", orderId: "42" },
          categoryId: DEMO_CATEGORY,
          channelId: DEMO_CHANNEL,
          badge: 1,
        },
        { type: "interval", seconds: 3 },
      );
    } finally {
      setScheduled(false);
    }
  };

  return (
    <Section
      title="Try it"
      description="Schedules a local notification in 3 seconds with scheduleNotification(). It carries the “order” category, so expanding it shows Track and Reply; the action and any reply text reach onResponse. Stay here to see the foreground switches at work, or leave the app first."
    >
      <HStack>
        <Button
          mode="tonal"
          iconName="send-outline"
          disabled={!allowed}
          loading={scheduled}
          onPress={send}
        >
          Send a test notification
        </Button>
      </HStack>
    </Section>
  );
};

const BadgeSection = () => {
  const { theme } = useTheme();
  const [badge, setBadge] = useState<number | null>(null);
  const [delivered, setDelivered] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    if (!isNotificationsSupported) return;
    const [count, presented] = await Promise.all([
      getBadgeCount(),
      getPresentedNotifications(),
    ]);
    setBadge(count);
    setDelivered(presented.length);
  }, []);

  const run = (action: () => Promise<unknown>) => async () => {
    await action();
    await refresh();
  };

  const summary =
    badge === null || delivered === null
      ? "Read the current badge and the notifications in Notification Center / the shade."
      : `Badge ${badge} · ${delivered} delivered notification${delivered === 1 ? "" : "s"}`;

  return (
    <Section
      title="Badge and delivered notifications"
      description="setBadgeCount() / clearBadge() drive the app icon badge; getPresentedNotifications() and dismissNotificationsWhere() clean up what is already in the tray, for example when the user opens the chat a notification was about."
    >
      <Typography
        variant="bodyMedium"
        style={{ color: theme.colors.onSurfaceVariant }}
      >
        {summary}
      </Typography>
      <HStack spacing="s" wrap>
        <Button
          mode="outlined"
          iconName="refresh"
          disabled={!isNotificationsSupported}
          onPress={() => void refresh()}
        >
          Read
        </Button>
        <Button
          mode="outlined"
          iconName="numeric-3-circle-outline"
          disabled={!isNotificationsSupported}
          onPress={run(() => setBadgeCount(3))}
        >
          Set badge to 3
        </Button>
        <Button
          mode="outlined"
          iconName="close-circle-outline"
          disabled={!isNotificationsSupported}
          onPress={run(clearBadge)}
        >
          Clear badge
        </Button>
        <Button
          mode="outlined"
          iconName="notification-clear-all"
          disabled={!isNotificationsSupported}
          onPress={run(dismissAllNotifications)}
        >
          Dismiss delivered
        </Button>
      </HStack>
    </Section>
  );
};

const EventLogSection = ({
  events,
  onClear,
}: {
  events: LoggedEvent[];
  onClear: () => void;
}) => {
  const { theme } = useTheme();

  return (
    <Section
      title="Event log"
      description="Everything the provider reports through onEvent, newest first."
    >
      {events.length === 0 ? (
        <EmptyState
          icon="bell-sleep-outline"
          title="No events yet"
          description="Allow notifications or send a test to see permission, token and delivery events here."
        />
      ) : (
        <VStack spacing="s" align="flex-start">
          <ListSection style={{ width: "100%" }}>
            {events.map(({ key, at, event }) => {
              const { icon, title, detail } = describeEvent(event);
              return (
                <ListItem
                  key={key}
                  leading={
                    <Icon
                      source={icon}
                      size={24}
                      color={theme.colors.onSurfaceVariant}
                    />
                  }
                  secondary={`${at} · ${detail}`}
                >
                  {title}
                </ListItem>
              );
            })}
          </ListSection>
          <Button mode="text" iconName="delete-outline" onPress={onClear}>
            Clear
          </Button>
        </VStack>
      )}
    </Section>
  );
};
