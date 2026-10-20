import { useEffect, useState, type ReactNode } from "react";
import { Platform } from "react-native";
import {
  Banner,
  Button,
  HStack,
  Icon,
  Input,
  ListItem,
  ListSection,
  Skeleton,
  StatusBadge,
  Switch,
  ToggleButtonGroup,
  Typography,
  VStack,
  useTheme,
} from "@its/glowup-ui";
import {
  isLocationError,
  LocationError,
  useCurrentPosition,
  useGeocoder,
  useHeading,
  useLocationPermission,
  useWatchPosition,
  type GeocodedAddress,
  type GeocodedLocation,
  type GeoPosition,
  type HeadingAccuracy,
  type LocationAccuracy,
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

const HEADING_ACCURACY: Record<
  HeadingAccuracy,
  { label: string; type: "success" | "warning" | "error" }
> = {
  high: { label: "High", type: "success" },
  medium: { label: "Medium", type: "success" },
  low: { label: "Low", type: "warning" },
  unreliable: { label: "Unreliable", type: "error" },
};

const HEADING_ERROR_COPY: Record<LocationErrorCode, string> = {
  ...ERROR_COPY,
  "permission-denied":
    "The compass needs the location permission: use the button above.",
  unavailable: "This device has no compass.",
  unsupported: "There is no compass in a browser.",
};

const GEOCODE_ERROR_COPY: Record<LocationErrorCode, string> = {
  ...ERROR_COPY,
  "permission-denied":
    "Android geocodes only with the location permission: use the button above.",
  unavailable:
    "No answer: offline, too many requests (Apple limits the rate), or no geocoder service on this device.",
  timeout: "No answer within 15 seconds.",
  unsupported:
    "No geocoder here. An app supplies its own provider through the geocoder adapter.",
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
      ? <Button onClick={permission.request}>Use my location</Button>
      : <Button onClick={permission.openSettings}>Open settings</Button>;
  }
  if (error?.code === "services-disabled") return <TurnOnLocation />;
  return <ShopList near={position?.coords} loading={isLoading} onRetry={refresh} />;
}`;

const GEOCODING_USAGE = `import { useGeocoder } from "@its/glowup-device/location";

function AddressOf({ coords }: { coords: GeoPoint }) {
  const { reverseGeocode } = useGeocoder();
  const [address, setAddress] = useState<GeocodedAddress | null>(null);

  useEffect(() => {
    // [] is "nothing known here", not an error.
    reverseGeocode(coords).then(([first]) => setAddress(first ?? null), () => {});
  }, [coords, reverseGeocode]);

  return <Text>{address?.city ?? "…"}</Text>;
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
      <ListItem
        secondaryText={coords.latitude.toFixed(6)}
        primaryText="Latitude"
      />
      <ListItem
        secondaryText={coords.longitude.toFixed(6)}
        primaryText="Longitude"
      />
      <ListItem
        secondaryText={
          coords.accuracy === null ? "—" : `± ${Math.round(coords.accuracy)} m`
        }
        primaryText="Accuracy"
      />
      <ListItem
        secondaryText={
          coords.altitude === null ? "—" : `${Math.round(coords.altitude)} m`
        }
        primaryText="Altitude"
      />
      <ListItem
        secondaryText={formatTime(position.timestamp)}
        primaryText="Taken at"
      />
    </ListSection>
  );
};

const ErrorLine = ({
  error,
  copy = ERROR_COPY,
}: {
  error: LocationError;
  copy?: Record<LocationErrorCode, string>;
}) => {
  const { theme } = useTheme();
  return (
    <Typography variant="bodyMedium" style={{ color: theme.colors.error }}>
      {copy[error.code]}
    </Typography>
  );
};

const CARDINALS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

const cardinal = (degrees: number) =>
  CARDINALS[Math.round(degrees / 45) % CARDINALS.length];

const formatDegrees = (degrees: number | null) =>
  degrees === null ? "—" : `${Math.round(degrees)}° ${cardinal(degrees)}`;

const formatAddress = (address: GeocodedAddress) =>
  address.formattedAddress ??
  ([
    [address.street, address.streetNumber].filter(Boolean).join(" "),
    [address.postalCode, address.city].filter(Boolean).join(" "),
    address.country,
  ]
    .filter(Boolean)
    .join(", ") ||
    address.name ||
    "Unnamed place");

const toLocationError = (error: unknown) =>
  isLocationError(error) ? error : new LocationError("unavailable");

export default function LocationPage() {
  const permission = useLocationPermission();
  const granted = permission.status === "granted";

  return (
    <Page
      eyebrow="@its/glowup-device/location"
      title="Location"
      description="Foreground location: the permission (with the precision the user chose), one position, a live watch, the compass and geocoding. The hooks never prompt — only the button below shows the OS dialog."
      banner={
        <Banner
          visible
          type="info"
          icon="information-outline"
          message={
            Platform.OS === "web"
              ? "In a browser the position comes from navigator.geolocation: it needs HTTPS, does not report precision, and cannot tell disabled location services from a missing fix. There is no compass or geocoder."
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
      <CompassSection granted={granted} />
      <GeocodingSection granted={granted} />

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
        <CodeBlock code={GEOCODING_USAGE} title="AddressOf.tsx" />
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
          secondaryText="maxAge: 60 000 — fast, but the user may have moved since."
          action={<Switch value={useCache} onChange={setUseCache} />}
          primaryText="Accept a fix up to a minute old"
        />
      </ListSection>
      <HStack>
        <Button
          iconName="crosshairs-gps"
          disabled={!granted}
          loading={isLoading}
          onClick={refresh}
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
          secondaryText={
            granted
              ? "accuracy: high · distanceInterval: 5"
              : "Needs the permission."
          }
          action={
            <Switch
              value={following && granted}
              disabled={!granted}
              onChange={setFollowing}
            />
          }
          primaryText="Follow my position"
        />
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

const CompassSection = ({ granted }: { granted: boolean }) => {
  const { theme } = useTheme();
  const [following, setFollowing] = useState(false);
  // The default web adapter has no compass: say so before any permission.
  const noCompass = Platform.OS === "web";
  const { heading, error } = useHeading({ enabled: following && granted });
  const accuracy = heading ? HEADING_ACCURACY[heading.accuracy] : null;

  return (
    <Section
      title="Compass"
      description="useHeading() follows where the top edge of the device points. Every reader shares one native watch, paused while the app is in the background. It needs the location permission, not the location services."
    >
      <HStack>
        <Button
          iconName={following ? "compass-off-outline" : "compass-outline"}
          variant={following ? "outlined" : "filled"}
          disabled={!granted || noCompass}
          onClick={() => setFollowing((value) => !value)}
        >
          {following ? "Stop the compass" : "Start the compass"}
        </Button>
      </HStack>
      {noCompass ? (
        <ErrorLine
          error={new LocationError("unsupported")}
          copy={HEADING_ERROR_COPY}
        />
      ) : null}
      {error ? <ErrorLine error={error} copy={HEADING_ERROR_COPY} /> : null}
      {heading && accuracy ? (
        <VStack spacing="m">
          <HStack spacing="m" style={{ alignItems: "center" }}>
            <Icon
              source="navigation"
              size={theme.spacing.xl * 2}
              color={theme.colors.primary}
              // The arrow points up; turning it back by the heading keeps it on north.
              style={{
                transform: [{ rotate: `${-heading.magneticHeading}deg` }],
              }}
            />
            <Typography variant="headlineMedium">
              {formatDegrees(heading.magneticHeading)}
            </Typography>
          </HStack>
          <ListSection>
            <ListItem
              secondaryText={formatDegrees(heading.magneticHeading)}
              primaryText="Magnetic north"
            />
            <ListItem
              secondaryText={
                heading.trueHeading === null
                  ? "Needs a location fix first"
                  : formatDegrees(heading.trueHeading)
              }
              primaryText="True north"
            />
            <ListItem
              secondaryText={
                heading.accuracy === "unreliable"
                  ? "Move the device in a figure eight to calibrate."
                  : undefined
              }
              action={
                <StatusBadge label={accuracy.label} type={accuracy.type} />
              }
              primaryText="Accuracy"
            />
          </ListSection>
        </VStack>
      ) : following && granted && !error ? (
        <Typography
          variant="bodySmall"
          style={{ color: theme.colors.onSurfaceVariant }}
        >
          Waiting for the first reading… On Android a device without a
          magnetometer never sends one.
        </Typography>
      ) : null}
    </Section>
  );
};

type Lookup<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; results: T[] }
  | { status: "failed"; error: LocationError };

const LookupState = <T,>({
  lookup,
  empty,
  render,
}: {
  lookup: Lookup<T>;
  empty: string;
  render: (result: T, index: number) => ReactNode;
}) => {
  const { theme } = useTheme();
  if (lookup.status === "failed") {
    return <ErrorLine error={lookup.error} copy={GEOCODE_ERROR_COPY} />;
  }
  if (lookup.status !== "done") return null;
  if (lookup.results.length === 0) {
    return (
      <Typography
        variant="bodyMedium"
        style={{ color: theme.colors.onSurfaceVariant }}
      >
        {empty}
      </Typography>
    );
  }
  return <ListSection>{lookup.results.map(render)}</ListSection>;
};

const GeocodingSection = ({ granted }: { granted: boolean }) => {
  const { isSupported, geocode, reverseGeocode } = useGeocoder();
  const [address, setAddress] = useState("Piazza Venezia, Roma");
  const [places, setPlaces] = useState<Lookup<GeocodedLocation>>({
    status: "idle",
  });
  // The answer for one fix: a newer fix reads as loading until its own lands.
  const [answer, setAnswer] = useState<{
    position: GeoPosition;
    lookup: Lookup<GeocodedAddress>;
  } | null>(null);
  const here = useCurrentPosition({
    enabled: false,
    accuracy: "balanced",
    maxAge: 60_000,
  });
  const position = here.position;
  const addresses: Lookup<GeocodedAddress> = !position
    ? { status: "idle" }
    : answer?.position === position
      ? answer.lookup
      : { status: "loading" };

  const search = () => {
    setPlaces({ status: "loading" });
    geocode(address).then(
      (results) => setPlaces({ status: "done", results }),
      (error) => setPlaces({ status: "failed", error: toLocationError(error) }),
    );
  };

  // Each fix the button asks for is looked up once it arrives.
  useEffect(() => {
    if (!position) return;
    let live = true;
    reverseGeocode(position.coords).then(
      (results) => {
        if (live) setAnswer({ position, lookup: { status: "done", results } });
      },
      (error) => {
        if (live) {
          setAnswer({
            position,
            lookup: { status: "failed", error: toLocationError(error) },
          });
        }
      },
    );
    return () => {
      live = false;
    };
  }, [position, reverseGeocode]);

  return (
    <Section
      title="Geocoding"
      description="useGeocoder() turns an address into coordinates and back, with the platform's geocoder: CLGeocoder on iOS (no permission, rate-limited by Apple), Geocoder on Android (needs the permission and Google Play services). “Nothing found” is an empty list, not an error."
    >
      {isSupported === false ? (
        <ErrorLine
          error={new LocationError("unsupported")}
          copy={GEOCODE_ERROR_COPY}
        />
      ) : null}
      <Input
        label="Address"
        value={address}
        onChange={setAddress}
        leadingIcon="map-search-outline"
        disabled={isSupported === false}
      />
      <HStack>
        <Button
          iconName="magnify"
          disabled={isSupported === false || address.trim() === ""}
          loading={places.status === "loading"}
          onClick={search}
        >
          Find
        </Button>
      </HStack>
      <LookupState
        lookup={places}
        empty="No place matches that address."
        render={(place, index) => (
          <ListItem
            key={index}
            secondaryText={
              place.accuracy === null
                ? "Accuracy unknown"
                : `± ${Math.round(place.accuracy)} m`
            }
            primaryText={`${place.latitude.toFixed(6)}, ${place.longitude.toFixed(6)}`}
          />
        )}
      />
      <HStack>
        <Button
          iconName="map-marker-question-outline"
          variant="outlined"
          disabled={isSupported === false || !granted}
          loading={here.isLoading || addresses.status === "loading"}
          onClick={here.refresh}
        >
          What is here?
        </Button>
      </HStack>
      {here.error ? <ErrorLine error={here.error} /> : null}
      <LookupState
        lookup={addresses}
        empty="No address is known at this position."
        render={(found, index) => (
          <ListItem
            key={index}
            secondaryText={[found.region, found.isoCountryCode, found.timezone]
              .filter(Boolean)
              .join(" · ")}
            primaryText={formatAddress(found)}
          />
        )}
      />
    </Section>
  );
};
