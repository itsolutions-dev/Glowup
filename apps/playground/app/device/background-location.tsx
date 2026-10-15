import { useState, type ReactNode } from "react";
import { Platform } from "react-native";
import {
  Banner,
  Button,
  HStack,
  ListItem,
  ListSection,
  StatusBadge,
  Typography,
  VStack,
  useTheme,
  HelperText,
} from "@its/glowup-ui";
import {
  isLocationError,
  useBackgroundLocation,
  useBackgroundLocationPermission,
  useGeofencing,
  type LocationErrorCode,
} from "@its/glowup-device/background-location";
import {
  useCurrentPosition,
  useLocationPermission,
} from "@its/glowup-device/location";

import { SITES_TASK, TRIP_TASK } from "../../site/backgroundTasks";
import { clearTaskLog, useTaskLog } from "../../site/backgroundLog";
import { CodeBlock } from "../../site/CodeBlock";
import { DevicePermission } from "../../site/DevicePermission";
import { Page, Section } from "../../site/Page";

const ERROR_COPY: Record<LocationErrorCode, string> = {
  "permission-denied":
    "Not allowed yet: grant the permissions above (geofencing needs the background one too).",
  "services-disabled":
    "Location is switched off for the whole device. Turn it on in the system settings.",
  unavailable:
    "The platform refused: on Android a foreground service starts only while the app is open.",
  timeout: "No answer in time.",
  unsupported:
    "Not here: the web has no background location, and a native build needs backgroundLocation in the config plugin.",
};

const RADIUS = 150;

const TASKS = `// tasks.ts — imported by the app's entry file, before anything renders
import {
  defineGeofenceTask,
  defineLocationTask,
} from "@its/glowup-device/background-location";

defineLocationTask("trip", async (event) => {
  if (event.type === "positions") await saveTrip(event.positions);
});

defineGeofenceTask("sites", async (event) => {
  if (event.type === "enter") await clockIn(event.region.id);
});`;

const ENTRY = `// index.ts, with "main": "./index.ts" in package.json
import "./tasks";
import "expo-router/entry";`;

const USAGE = `const trip = useBackgroundLocation("trip");
const sites = useGeofencing("sites");

await trip.start({
  accuracy: "balanced",
  distanceInterval: 10,
  // Android: the notification while it runs; no background permission needed.
  foregroundService: { title: "Recording your trip", body: "Tap to open" },
});

// Needs the background permission (useBackgroundLocationPermission).
await sites.start([{ id: "hq", latitude: 45.4642, longitude: 9.19, radius: 150 }]);`;

const PLUGIN = `["@its/glowup-device", {
  location: { whenInUsePermission: "Records your trips." },
  backgroundLocation: {
    mode: "foreground-service", // "background", or "none" to geofence only
    geofencing: true,
    alwaysPermission: "Records your trip while the app is closed.",
  },
}]`;

function errorText(error: unknown): string {
  if (isLocationError(error)) return ERROR_COPY[error.code];
  return error instanceof Error ? error.message : String(error);
}

const PermissionRow = ({
  title,
  detail,
  children,
}: {
  title: string;
  detail: string;
  children: ReactNode;
}) => {
  const { theme } = useTheme();
  return (
    <VStack spacing="xs">
      <Typography variant="titleSmall">{title}</Typography>
      <Typography
        variant="bodySmall"
        style={{ color: theme.colors.onSurfaceVariant }}
      >
        {detail}
      </Typography>
      {children}
    </VStack>
  );
};

const RunningBadge = ({ running }: { running: boolean | null }) => (
  <StatusBadge
    label={running === null ? "Checking…" : running ? "Running" : "Stopped"}
    type={running ? "success" : "warning"}
  />
);

export default function BackgroundLocationPage() {
  const foreground = useLocationPermission();
  const background = useBackgroundLocationPermission();

  return (
    <Page
      eyebrow="@its/glowup-device/background-location"
      title="Background location"
      description="Positions that keep coming with the app in the background, and geofencing: both delivered to tasks defined at module scope, which run without React. Nothing here prompts by itself."
      banner={
        <Banner
          visible
          type="info"
          icon="information-outline"
          message={
            Platform.OS === "web"
              ? "A browser has no background location: this page reads unsupported here. Open it in a development build."
              : "Needs a development build with backgroundLocation in the config plugin. On Android the updates run as a foreground service, with a notification."
          }
        />
      }
    >
      <Section
        title="Permissions"
        description="The foreground permission first; then the background one (“Always”, “Allow all the time”), which geofencing needs on both platforms. Android 11 and later open the settings page for it."
      >
        <VStack spacing="m">
          <PermissionRow title="Foreground" detail="While using the app">
            <DevicePermission
              status={foreground.status}
              canAskAgain={foreground.canAskAgain}
              isLoading={foreground.isLoading}
              request={foreground.request}
              openSettings={foreground.openSettings}
              requestLabel="Allow"
            />
          </PermissionRow>
          <PermissionRow
            title="Background"
            detail={
              foreground.status === "granted"
                ? "Also with the app closed"
                : "Asked only after the foreground one"
            }
          >
            <DevicePermission
              status={background.status}
              canAskAgain={background.canAskAgain}
              isLoading={background.isLoading}
              request={background.request}
              openSettings={background.openSettings}
              requestLabel="Allow always"
            />
          </PermissionRow>
        </VStack>
      </Section>

      <TripSection />
      <SitesSection />
      <LogSection />

      <Section
        title="Wire it up"
        description="Define the tasks at module scope in a file the entry imports first: Android runs them headless and iOS relaunches the app for them, before any screen mounts."
      >
        <CodeBlock
          code="npx expo install expo-location expo-task-manager @its/glowup-device"
          language="bash"
          title="Terminal"
        />
        <CodeBlock code={TASKS} title="tasks.ts" />
        <CodeBlock code={ENTRY} title="index.ts" />
        <CodeBlock code={USAGE} title="TripScreen.tsx" />
        <CodeBlock code={PLUGIN} title="app.config.ts → plugins" />
      </Section>
    </Page>
  );
}

const TripSection = () => {
  const trip = useBackgroundLocation(TRIP_TASK);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (failure) {
      setError(errorText(failure));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Section
      title="Background updates"
      description="useBackgroundLocation() starts updates every 10 m that outlive the screen and the app, until stopped. The task receives them; the list below shows what it got."
    >
      <HStack spacing="m" align="center" wrap>
        <RunningBadge running={trip.isRunning} />
        {trip.isRunning ? (
          <Button
            iconName="stop"
            mode="outlined"
            loading={busy}
            onPress={() => run(trip.stop)}
          >
            Stop recording
          </Button>
        ) : (
          <Button
            iconName="record-circle-outline"
            disabled={trip.isSupported === false}
            loading={busy}
            onPress={() =>
              run(() =>
                trip.start({
                  accuracy: "balanced",
                  distanceInterval: 10,
                  foregroundService: {
                    title: "Glowup playground",
                    body: "Recording positions for the demo page",
                  },
                }),
              )
            }
          >
            Start recording
          </Button>
        )}
      </HStack>
      {error ? (
        <HelperText type="error" padding="none">
          {error}
        </HelperText>
      ) : null}
    </Section>
  );
};

const SitesSection = () => {
  const sites = useGeofencing(SITES_TASK);
  const here = useCurrentPosition({
    enabled: false,
    accuracy: "balanced",
    maxAge: 60_000,
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const coords = here.position?.coords;

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (failure) {
      setError(errorText(failure));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Section
      title="Geofencing"
      description="useGeofencing() watches circles and reports entering and leaving them, even with the app closed. Each one first reports where you are: an exit when you are outside. Up to 20 regions per app on iOS, 100 on Android."
    >
      <HStack spacing="m" align="center" wrap>
        <RunningBadge running={sites.isRunning} />
        <Button
          iconName="crosshairs-gps"
          mode="outlined"
          disabled={sites.isSupported === false}
          loading={here.isLoading}
          onPress={here.refresh}
        >
          Locate me
        </Button>
        <Button
          iconName="map-marker-radius-outline"
          disabled={!coords || sites.isSupported === false}
          loading={busy}
          onPress={() =>
            coords &&
            run(() =>
              sites.start([
                {
                  id: "here",
                  latitude: coords.latitude,
                  longitude: coords.longitude,
                  radius: RADIUS,
                },
              ]),
            )
          }
        >
          {`Watch ${RADIUS} m around me`}
        </Button>
        {sites.isRunning ? (
          <Button
            iconName="stop"
            mode="text"
            loading={busy}
            onPress={() => run(sites.stop)}
          >
            Stop watching
          </Button>
        ) : null}
      </HStack>
      {coords ? (
        <Typography variant="bodySmall">
          {`Centre: ${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`}
        </Typography>
      ) : null}
      {here.error ? (
        <HelperText type="error" padding="none">
          {errorText(here.error)}
        </HelperText>
      ) : null}
      {error ? (
        <HelperText type="error" padding="none">
          {error}
        </HelperText>
      ) : null}
    </Section>
  );
};

const LogSection = () => {
  const { theme } = useTheme();
  const log = useTaskLog();

  return (
    <Section
      title="What the tasks received"
      description="Written by the task handlers, in memory for this launch: a real app stores or sends it from the handler."
    >
      {log.length === 0 ? (
        <Typography
          variant="bodyMedium"
          style={{ color: theme.colors.onSurfaceVariant }}
        >
          Nothing yet. Start one of the two above, then move.
        </Typography>
      ) : (
        <VStack spacing="s">
          <ListSection>
            {log.map((entry) => (
              <ListItem
                key={entry.id}
                secondary={`${entry.task === "trip" ? "Trip" : "Geofence"} · ${new Date(entry.at).toLocaleTimeString()}`}
              >
                {entry.text}
              </ListItem>
            ))}
          </ListSection>
          <HStack>
            <Button
              iconName="delete-outline"
              mode="text"
              onPress={clearTaskLog}
            >
              Clear
            </Button>
          </HStack>
        </VStack>
      )}
    </Section>
  );
};
