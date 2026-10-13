import { useState } from "react";
import { Platform } from "react-native";
import {
  Banner,
  Button,
  HStack,
  ListItem,
  ListSection,
  Skeleton,
  StatusBadge,
  Toggle,
  ToggleButtonGroup,
  Typography,
  VStack,
  useTheme,
} from "@its/glowup-ui";
import {
  useCurrentPosition,
  useLocationPermission,
  useWatchPosition,
  type GeoPosition,
  type LocationAccuracy,
  type LocationError,
  type LocationErrorCode,
} from "@its/glowup-device/location";

import { CodeBlock } from "../../site/CodeBlock";
import { DevicePermission } from "../../site/DevicePermission";
import { Page, Section } from "../../site/Page";

const ACCURACY_OPTIONS: { value: LocationAccuracy; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "balanced", label: "Balanced" },
  { value: "high", label: "High" },
  { value: "best", label: "Best" },
];

const ERROR_COPY: Record<LocationErrorCode, string> = {
  "permission-denied": "Location is not allowed yet: use the button above.",
  "services-disabled":
    "Location is switched off for the whole device. Turn it on in the system settings.",
  unavailable: "No fix could be obtained. Try again near a window or outdoors.",
  timeout: "No fix within 15 seconds.",
  unsupported: "This platform cannot locate.",
};

const USAGE = `import {
  useCurrentPosition,
  useLocationPermission,
} from "@its/glowup-device/location";

function NearbyShops() {
  const permission = useLocationPermission();
  const granted = permission.status === "granted";
  // Never prompts: gate it on the permission.
  const { position, error, isLoading, refresh } = useCurrentPosition({
    enabled: granted,
    accuracy: "balanced",
    maxAge: 60_000, // a fix up to a minute old is fine
  });

  if (!granted) {
    return permission.canAskAgain
      ? <Button onPress={permission.request}>Use my location</Button>
      : <Button onPress={permission.openSettings}>Open settings</Button>;
  }
  if (error?.code === "services-disabled") return <TurnOnLocation />;
  return <ShopList near={position?.coords} loading={isLoading} onRetry={refresh} />;
}`;

const PLUGIN = `["@its/glowup-device", {
  location: { whenInUsePermission: "Shows the shops near you." },
}]`;

const formatTime = (timestamp: number) =>
  new Date(timestamp).toLocaleTimeString();

const PositionList = ({ position }: { position: GeoPosition }) => {
  const { coords } = position;
  return (
    <ListSection>
      <ListItem secondary={coords.latitude.toFixed(6)}>Latitude</ListItem>
      <ListItem secondary={coords.longitude.toFixed(6)}>Longitude</ListItem>
      <ListItem
        secondary={
          coords.accuracy === null ? "—" : `± ${Math.round(coords.accuracy)} m`
        }
      >
        Accuracy
      </ListItem>
      <ListItem
        secondary={
          coords.altitude === null ? "—" : `${Math.round(coords.altitude)} m`
        }
      >
        Altitude
      </ListItem>
      <ListItem secondary={formatTime(position.timestamp)}>Taken at</ListItem>
    </ListSection>
  );
};

const ErrorLine = ({ error }: { error: LocationError }) => {
  const { theme } = useTheme();
  return (
    <Typography variant="bodyMedium" style={{ color: theme.colors.error }}>
      {ERROR_COPY[error.code]}
    </Typography>
  );
};

export default function LocationPage() {
  const permission = useLocationPermission();
  const granted = permission.status === "granted";

  return (
    <Page
      eyebrow="@its/glowup-device/location"
      title="Location"
      description="Foreground location: the permission (with the precision the user chose), one position, and a live watch. The hooks never prompt — only the button below shows the OS dialog."
      banner={
        <Banner
          visible
          type="info"
          icon="information-outline"
          message={
            Platform.OS === "web"
              ? "In a browser the position comes from navigator.geolocation: it needs HTTPS, does not report precision, and cannot tell disabled location services from a missing fix."
              : "Works in Expo Go. Try “Approximate” in the iOS prompt (or Android 12+) to see the precision change."
          }
        />
      }
    >
      <Section
        title="Permission"
        description="Shared by every component that asks, and read again whenever the app returns to the foreground — so it is right after a trip to the system settings."
      >
        <DevicePermission
          status={permission.status}
          canAskAgain={permission.canAskAgain}
          isLoading={permission.isLoading}
          request={permission.request}
          openSettings={permission.openSettings}
          requestLabel="Use my location"
        >
          {permission.precision ? (
            <StatusBadge
              label={
                permission.precision === "precise" ? "Precise" : "Approximate"
              }
              type={permission.precision === "precise" ? "success" : "warning"}
            />
          ) : null}
        </DevicePermission>
      </Section>

      <CurrentPositionSection granted={granted} />
      <WatchSection granted={granted} />

      <Section
        title="Wire it up"
        description="useCurrentPosition() times out after 15 s by default (expo-location has no timeout of its own on native) and, with maxAge, first accepts a recent cached fix without waking the GPS."
      >
        <CodeBlock
          code="npx expo install expo-location @its/glowup-device"
          language="bash"
          title="Terminal"
        />
        <CodeBlock code={PLUGIN} title="app.config.ts → plugins" />
        <CodeBlock code={USAGE} title="NearbyShops.tsx" />
      </Section>
    </Page>
  );
}

const CurrentPositionSection = ({ granted }: { granted: boolean }) => {
  const { theme } = useTheme();
  const [accuracy, setAccuracy] = useState<LocationAccuracy>("balanced");
  const [useCache, setUseCache] = useState(false);
  // Manual: the page reads only when asked, so each press shows a fresh read.
  const { position, error, isLoading, refresh } = useCurrentPosition({
    enabled: false,
    accuracy,
    maxAge: useCache ? 60_000 : undefined,
  });

  return (
    <Section
      title="Current position"
      description="One read with useCurrentPosition(). Higher accuracy wakes the GPS: slower and costlier than cell towers and Wi-Fi."
    >
      <ToggleButtonGroup
        options={ACCURACY_OPTIONS}
        value={accuracy}
        onValueChange={(next: LocationAccuracy) => setAccuracy(next)}
      />
      <ListSection>
        <ListItem
          secondary="maxAge: 60 000 — fast, but the user may have moved since."
          trailing={<Toggle value={useCache} onValueChange={setUseCache} />}
        >
          Accept a fix up to a minute old
        </ListItem>
      </ListSection>
      <HStack>
        <Button
          iconName="crosshairs-gps"
          disabled={!granted}
          loading={isLoading}
          onPress={refresh}
        >
          Locate me
        </Button>
      </HStack>
      {isLoading && !position ? (
        <Skeleton variant="rect" height={theme.spacing.xl * 4} />
      ) : null}
      {error ? <ErrorLine error={error} /> : null}
      {position ? <PositionList position={position} /> : null}
    </Section>
  );
};

const WatchSection = ({ granted }: { granted: boolean }) => {
  const { theme } = useTheme();
  const [following, setFollowing] = useState(false);
  const { position, error } = useWatchPosition({
    enabled: following && granted,
    accuracy: "high",
    distanceInterval: 5,
  });

  return (
    <Section
      title="Follow the position"
      description="useWatchPosition() delivers a fix every 5 m of movement while enabled, and stops when the switch is off or the page unmounts."
    >
      <ListSection>
        <ListItem
          secondary={
            granted
              ? "accuracy: high · distanceInterval: 5"
              : "Needs the permission."
          }
          trailing={
            <Toggle
              value={following && granted}
              disabled={!granted}
              onValueChange={setFollowing}
            />
          }
        >
          Follow my position
        </ListItem>
      </ListSection>
      {error ? <ErrorLine error={error} /> : null}
      {position ? (
        <PositionList position={position} />
      ) : following && granted ? (
        <VStack spacing="s">
          <Skeleton variant="rect" height={theme.spacing.xl * 4} />
          <Typography
            variant="bodySmall"
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            Waiting for the first fix…
          </Typography>
        </VStack>
      ) : null}
    </Section>
  );
};
