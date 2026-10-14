/**
 * The `@its/glowup-device` half of the smoke test. What only the published
 * package can prove:
 *
 *  - every subpath in the export map resolves for a bundler and for `tsc`
 *    (`/info`, `/location`, `/camera`, `/network`, `/battery`, `/keep-awake`,
 *    `/orientation`, `/haptics`, `/biometrics`, `/secure-store`, `/sensors`,
 *    `/media-picker`, `/media-library`, `/testing`), with its
 *    own published
 *    `.d.ts` — the types annotated below fail `tsc --noEmit` if one stops
 *    resolving,
 *  - the root entry loads without any capability's Expo module,
 *  - the config plugin (`./app.plugin.js`, listed in app.json) resolves, which
 *    `expo export` checks when it reads the app config.
 */
import { Typography, useTheme } from "@its/glowup-ui";
import {
  DeviceAdaptersProvider,
  type PermissionState,
} from "@its/glowup-device";
import { useBattery, type BatteryStatus } from "@its/glowup-device/battery";
import {
  useAppLock,
  useBiometrics,
  type BiometricErrorCode,
} from "@its/glowup-device/biometrics";
import { CameraView, useCameraPermission } from "@its/glowup-device/camera";
import type { CameraHandle } from "@its/glowup-device/camera";
import {
  hapticFeedback,
  type InteractionKind,
} from "@its/glowup-device/haptics";
import { useDeviceInfo, type DeviceInfo } from "@its/glowup-device/info";
import { useKeepAwake } from "@its/glowup-device/keep-awake";
import {
  useGeocoder,
  useHeading,
  useLocationPermission,
  type GeocodedAddress,
  type HeadingAccuracy,
  type LocationErrorCode,
} from "@its/glowup-device/location";
import { useIsOnline, type NetworkState } from "@its/glowup-device/network";
import {
  useOrientation,
  type OrientationLock,
} from "@its/glowup-device/orientation";
import {
  useSecureStore,
  useSecureValue,
  type ProtectedReadResult,
} from "@its/glowup-device/secure-store";
import {
  useAccelerometer,
  useDeviceOrientation,
  useSensorPermission,
  type DeviceOrientation,
} from "@its/glowup-device/sensors";
import {
  useMediaLibrary,
  type SaveResult,
} from "@its/glowup-device/media-library";
import {
  useMediaPicker,
  type PickResult,
} from "@its/glowup-device/media-picker";
import { createMockDeviceInfoAdapter } from "@its/glowup-device/testing";
import { useRef } from "react";

const FIRST_CODE: LocationErrorCode = "permission-denied";
const CALIBRATE: HeadingAccuracy = "unreliable";
const NO_ADDRESS: GeocodedAddress["formattedAddress"] = null;
const LOCK: OrientationLock = "portrait";
const KIND: InteractionKind = "press";
const BUSY: BiometricErrorCode = "busy";
const INVALIDATED: ProtectedReadResult["status"] = "invalidated";
const FACE_UP: DeviceOrientation = "face-up";
const BUSY_PICK: PickResult["status"] = "busy";
const SAVED: SaveResult["status"] = "saved";

/** The bridge `App.tsx` passes to `ThemeProvider onInteractionFeedback`. */
export const interactionFeedback: (kind: InteractionKind) => void =
  hapticFeedback;

const Readout = () => {
  const { theme } = useTheme();
  const info: DeviceInfo = useDeviceInfo();
  const location: PermissionState = useLocationPermission();
  const { heading } = useHeading({ enabled: false });
  const geocoder = useGeocoder();
  const camera = useCameraPermission();
  const handle = useRef<CameraHandle>(null);
  const online: NetworkState["isConnected"] = useIsOnline();
  const battery: BatteryStatus = useBattery();
  const { orientation } = useOrientation();
  useKeepAwake({ enabled: false });
  const { level } = useBiometrics();
  const secureStore = useSecureStore();
  const token = useSecureValue("token", { service: "smoke" });
  const { isLocked } = useAppLock({
    enabled: false,
    prompt: { promptMessage: "Unlock", cancelLabel: "Cancel" },
  });
  const accelerometer = useAccelerometer({ interval: 1000 });
  const held = useDeviceOrientation();
  const motion = useSensorPermission("barometer");
  const picker = useMediaPicker();
  const library = useMediaLibrary();

  return (
    <>
      <Typography
        variant="bodyMedium"
        style={{ color: theme.colors.onSurface }}
      >
        {`Device: ${info.model ?? "unknown"} · ${info.platform}`}
      </Typography>
      <Typography
        variant="bodyMedium"
        style={{ color: theme.colors.onSurfaceVariant }}
      >
        {`Location ${location.status} · camera ${camera.status} · ${FIRST_CODE}`}
      </Typography>
      <Typography
        variant="bodyMedium"
        style={{ color: theme.colors.onSurfaceVariant }}
      >
        {`Heading ${heading?.magneticHeading ?? "off"} (${CALIBRATE}) · geocoder ${String(geocoder.isSupported)} · ${NO_ADDRESS ?? "no address"}`}
      </Typography>
      <Typography
        variant="bodyMedium"
        style={{ color: theme.colors.onSurfaceVariant }}
      >
        {`Online ${String(online)} · battery ${battery.level ?? "?"} · ${orientation} (${LOCK}) · ${KIND}`}
      </Typography>
      <Typography
        variant="bodyMedium"
        style={{ color: theme.colors.onSurfaceVariant }}
      >
        {`Biometrics ${level} · locked ${String(isLocked)} · ${BUSY}`}
      </Typography>
      <Typography
        variant="bodyMedium"
        style={{ color: theme.colors.onSurfaceVariant }}
      >
        {`Secure store ${String(secureStore.isSupported)} · ${token.value ?? token.error?.code ?? "…"} · ${INVALIDATED}`}
      </Typography>
      <Typography
        variant="bodyMedium"
        style={{ color: theme.colors.onSurfaceVariant }}
      >
        {`Sensors ${String(accelerometer.isAvailable)} · z ${accelerometer.reading?.z.toFixed(2) ?? "…"} · ${held.orientation ?? FACE_UP} · motion ${motion.status}`}
      </Typography>
      <Typography
        variant="bodyMedium"
        style={{ color: theme.colors.onSurfaceVariant }}
      >
        {`Picker ${String(picker.isSupported)} · picking ${String(picker.isPicking)} · ${BUSY_PICK} · library ${String(library.isSupported)} ${library.status} · ${SAVED}`}
      </Typography>
      {camera.status === "granted" ? (
        <CameraView ref={handle} style={{ height: theme.spacing.xl * 4 }} />
      ) : null}
    </>
  );
};

/** Device info through the in-memory adapter, everything else on Expo's. */
export const DeviceSmoke = () => (
  <DeviceAdaptersProvider
    adapters={{ info: createMockDeviceInfoAdapter({ model: "Smoke test" }) }}
  >
    <Readout />
  </DeviceAdaptersProvider>
);
