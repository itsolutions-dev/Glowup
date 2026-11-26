/**
 * The `@its/glowup-device` half of the smoke test. What only the published
 * package can prove:
 *
 *  - every subpath in the export map resolves for a bundler and for `tsc`
 *    (`/info`, `/location`, `/camera`, `/network`, `/battery`, `/keep-awake`,
 *    `/orientation`, `/haptics`, `/biometrics`, `/secure-store`, `/sensors`,
 *    `/media-picker`, `/media-library`, `/background-location`, `/bluetooth`, `/rfid`,
 *    `/scanner`, `/testing`), with its own published
 *    `.d.ts` — the types annotated below fail `tsc --noEmit` if one stops
 *    resolving,
 *  - the root entry loads without any capability's Expo module,
 *  - the config plugin (`./app.plugin.js`, listed in app.json) resolves, which
 *    `expo export` checks when it reads the app config.
 *
 * And for `@its/rfid-honeywell`, the first vendor of `/rfid`: its adapter
 * loads where its native module is missing (here, the web) and reads
 * unsupported, its published types implement the published contract, and its
 * config plugin resolves (app.json points it at SDK copies that do not exist:
 * it reads them only at prebuild, which the smoke test does not run).
 *
 * And the same for `@its/scanner-honeywell`, the first vendor of `/scanner`:
 * its adapter reads unsupported on the web, implements the published
 * contract, and its config plugin resolves (with a `DataCollection.aar` path
 * that does not exist).
 */
import { Typography, useTheme } from "@its/glowup-ui";
import {
  DeviceAdaptersProvider,
  type PermissionState,
} from "@its/glowup-device";
import {
  defineGeofenceTask,
  defineLocationTask,
  useBackgroundLocation,
  useBackgroundLocationPermission,
  useGeofencing,
  type GeofenceRegion,
  type LocationTaskEvent,
} from "@its/glowup-device/background-location";
import { useBattery, type BatteryStatus } from "@its/glowup-device/battery";
import {
  BLUETOOTH_SERVICES,
  useBluetoothDevice,
  useBluetoothNotifications,
  useBluetoothPermission,
  useBluetoothScan,
  useBluetoothState,
  type BluetoothErrorCode,
} from "@its/glowup-device/bluetooth";
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
import {
  useRfidInventory,
  useRfidReader,
  useRfidSingleRead,
  type RfidAdapter,
  type RfidErrorCode,
} from "@its/glowup-device/rfid";
import {
  useBarcodeScanner,
  type BarcodeScannerAdapter,
  type BarcodeScannerErrorCode,
} from "@its/glowup-device/scanner";
import {
  createMockBarcodeScannerAdapter,
  createMockDeviceInfoAdapter,
  createMockRfidAdapter,
} from "@its/glowup-device/testing";
import { getHoneywellRfidAdapter } from "@its/rfid-honeywell";
import { getHoneywellBarcodeScannerAdapter } from "@its/scanner-honeywell";
import { useRef } from "react";

const FIRST_CODE: LocationErrorCode = "permission-denied";
const SITE: GeofenceRegion = {
  id: "hq",
  latitude: 45,
  longitude: 9,
  radius: 150,
};

// At module scope, as the platform needs them.
defineLocationTask("smoke-trip", (event: LocationTaskEvent) => {
  if (event.type === "positions") console.log(event.positions.length);
});
defineGeofenceTask("smoke-sites", (event) => {
  if (event.type !== "error") console.log(event.region.id);
});
const CALIBRATE: HeadingAccuracy = "unreliable";
const NO_ADDRESS: GeocodedAddress["formattedAddress"] = null;
const LOCK: OrientationLock = "portrait";
const KIND: InteractionKind = "press";
const BUSY: BiometricErrorCode = "busy";
const INVALIDATED: ProtectedReadResult["status"] = "invalidated";
const FACE_UP: DeviceOrientation = "face-up";
const POWERED_OFF: BluetoothErrorCode = "powered-off";
const BUSY_PICK: PickResult["status"] = "busy";
const SAVED: SaveResult["status"] = "saved";
const NOT_CONNECTED: RfidErrorCode = "not-connected";
// The vendor's adapter must satisfy the published contract.
const RFID: RfidAdapter = getHoneywellRfidAdapter();
const RFID_MOCK: RfidAdapter = createMockRfidAdapter();
const TAKEN: BarcodeScannerErrorCode = "unavailable";
const SCANNER: BarcodeScannerAdapter = getHoneywellBarcodeScannerAdapter();
const SCANNER_MOCK: BarcodeScannerAdapter = createMockBarcodeScannerAdapter();

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
  const trip = useBackgroundLocation("smoke-trip");
  const sites = useGeofencing("smoke-sites");
  const always = useBackgroundLocationPermission();
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
  const radio = useBluetoothState();
  const nearby = useBluetoothPermission();
  const scan = useBluetoothScan();
  const clock = useBluetoothDevice("smoke-clock");
  useBluetoothNotifications(
    "smoke-clock",
    BLUETOOTH_SERVICES.nordicUart,
    "6E400003-B5A3-F393-E0A9-E50E24DCCA9E",
    () => {},
    { enabled: false },
  );

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
        {`Background ${String(trip.isSupported)} ${String(trip.isRunning)} · sites ${String(sites.isRunning)} of ${sites.limit} (${SITE.id}) · always ${always.status}`}
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
      <Typography
        variant="bodyMedium"
        style={{ color: theme.colors.onSurfaceVariant }}
      >
        {`Bluetooth ${radio.state} · ${nearby.status} · ${scan.devices.length} found · clock ${clock.status} · ${POWERED_OFF}`}
      </Typography>
      <RfidReadout />
      <ScannerReadout />
      {camera.status === "granted" ? (
        <CameraView ref={handle} style={{ height: theme.spacing.xl * 4 }} />
      ) : null}
    </>
  );
};

const RfidLine = () => {
  const { theme } = useTheme();
  const reader = useRfidReader();
  const { tags } = useRfidInventory();
  const { tag } = useRfidSingleRead();
  return (
    <Typography
      variant="bodyMedium"
      style={{ color: theme.colors.onSurfaceVariant }}
    >
      {`RFID ${reader.vendor} ${String(reader.isSupported)} · ${reader.state} · ${tags.length} tags · ${tag?.epc ?? "no read"} · ${NOT_CONNECTED} · mock ${RFID_MOCK.vendor}`}
    </Typography>
  );
};

/** `/rfid` on the Honeywell adapter: unsupported on the web. */
const RfidReadout = () => (
  <DeviceAdaptersProvider adapters={{ rfid: RFID }}>
    <RfidLine />
  </DeviceAdaptersProvider>
);

const ScannerLine = () => {
  const { theme } = useTheme();
  const scanner = useBarcodeScanner({
    onScan: (scan) => console.log(scan.type, scan.data),
    symbologies: ["qr", "code128", "ean13", "ean8", "datamatrix"],
  });
  return (
    <Typography
      variant="bodyMedium"
      style={{ color: theme.colors.onSurfaceVariant }}
    >
      {`Scanner ${scanner.vendor} ${String(scanner.isSupported)} · ${scanner.state} · busy ${String(scanner.isBusy)} · ${TAKEN} · mock ${SCANNER_MOCK.vendor}`}
    </Typography>
  );
};

/** `/scanner` on the Honeywell adapter: unsupported on the web. */
const ScannerReadout = () => (
  <DeviceAdaptersProvider adapters={{ barcodeScanner: SCANNER }}>
    <ScannerLine />
  </DeviceAdaptersProvider>
);

/** Device info through the in-memory adapter, everything else on Expo's. */
export const DeviceSmoke = () => (
  <DeviceAdaptersProvider
    adapters={{ info: createMockDeviceInfoAdapter({ model: "Smoke test" }) }}
  >
    <Readout />
  </DeviceAdaptersProvider>
);
