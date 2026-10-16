import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import type { ReactNode } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AlertProvider, ThemeProvider, ToastProvider } from "@its/glowup-ui";
import { DeviceAdaptersProvider } from "@its/glowup-device";
import {
  buildGeocodedAddress,
  buildPosition,
  createMockBackgroundLocationAdapter,
  createMockBatteryAdapter,
  createMockBluetoothAdapter,
  createMockGeocoderAdapter,
  createMockBiometricsAdapter,
  createMockCameraAdapter,
  createMockDeviceInfoAdapter,
  createMockHapticsAdapter,
  createMockKeepAwakeAdapter,
  createMockLocationAdapter,
  createMockNetworkAdapter,
  createMockOrientationAdapter,
  createMockSecureStoreAdapter,
  createMockSensorsAdapter,
  createMockMediaPickerAdapter,
  createMockMediaLibraryAdapter,
  createMockRfidAdapter,
  buildPickedMedia,
  OFFLINE_NETWORK,
  type MockBackgroundLocationAdapter,
  type MockBatteryAdapter,
  type MockBluetoothAdapter,
  type MockGeocoderAdapter,
  type MockBiometricsAdapter,
  type MockCameraAdapter,
  type MockHapticsAdapter,
  type MockKeepAwakeAdapter,
  type MockLocationAdapter,
  type MockNetworkAdapter,
  type MockOrientationAdapter,
  type MockSecureStoreAdapter,
  type MockSensorsAdapter,
  type MockMediaPickerAdapter,
  type MockMediaLibraryAdapter,
  type MockRfidAdapter,
} from "@its/glowup-device/testing";
import { bleManagerAdapter } from "@its/glowup-device/bluetooth";
import * as ExpoHaptics from "expo-haptics";

import DeviceOverview from "../app/device";
import BatteryPage from "../app/device/battery";
import BiometricsPage from "../app/device/biometrics";
import CameraPage from "../app/device/camera";
import HapticsPage from "../app/device/haptics";
import DeviceInfoPage from "../app/device/info";
import KeepAwakePage from "../app/device/keep-awake";
import LocationPage from "../app/device/location";
import NetworkPage from "../app/device/network";
import OrientationPage from "../app/device/orientation";
import SecureStorePage from "../app/device/secure-store";
import SensorsPage from "../app/device/sensors";
import MediaPickerPage from "../app/device/media-picker";
import MediaLibraryPage from "../app/device/media-library";
import BackgroundLocationPage from "../app/device/background-location";
import BluetoothPage from "../app/device/bluetooth";
import RfidPage from "../app/device/rfid";
import { clearTaskLog } from "../site/backgroundLog";
import { SITES_TASK, TRIP_TASK } from "../site/backgroundTasks";
import { HapticThemeProvider } from "../site/HapticsPreference";

// The pages run on the package's in-memory adapters; the Expo modules behind
// the defaults only need to load.
jest.mock("expo-location", () => ({ LocationAccuracy: {} }));
jest.mock("expo-camera", () => ({ CameraView: () => null, Camera: {} }));
jest.mock("expo-device", () => ({ DeviceType: {} }));
jest.mock("expo-application", () => ({}));
jest.mock("@react-native-community/netinfo", () => ({
  __esModule: true,
  default: {},
}));
jest.mock("expo-battery", () => ({ BatteryState: {} }));
jest.mock("expo-keep-awake", () => ({}));
jest.mock("expo-screen-orientation", () => ({
  Orientation: {},
  OrientationLock: {},
}));
// The site wires hapticFeedback, which plays on the default (Expo) adapter.
jest.mock("expo-haptics", () => ({
  ImpactFeedbackStyle: { Light: "light", Medium: "medium", Heavy: "heavy" },
  NotificationFeedbackType: {},
  AndroidHaptics: {},
  impactAsync: jest.fn(async () => {}),
  selectionAsync: jest.fn(async () => {}),
}));
jest.mock("expo-local-authentication", () => ({ SecurityLevel: { NONE: 0 } }));
jest.mock("expo-secure-store", () => ({}));
jest.mock("expo-sensors", () => ({}));
jest.mock("expo-image-picker", () => ({}));
jest.mock("expo-media-library", () => ({}));
jest.mock("expo-task-manager", () => ({
  defineTask: jest.fn(),
  getTaskOptionsAsync: jest.fn(),
}));
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(async () => null),
  setItem: jest.fn(async () => {}),
}));

// No navigator is mounted (as in the catalogue test): the focus effect runs
// once, as on a page that is focused.
const mockPush = jest.fn();
let mockFocused = true;
jest.mock("expo-router", () => ({
  ...jest.requireActual("expo-router"),
  useRouter: () => ({ push: mockPush }),
  useIsFocused: () => mockFocused,
  useFocusEffect: (effect: () => void | (() => void)) => {
    const { useEffect: useMountEffect } = jest.requireActual("react");
    useMountEffect(effect, [effect]);
  },
}));

let location: MockLocationAdapter;
let geocoder: MockGeocoderAdapter;
let camera: MockCameraAdapter;
let network: MockNetworkAdapter;
let battery: MockBatteryAdapter;
let keepAwake: MockKeepAwakeAdapter;
let orientation: MockOrientationAdapter;
let haptics: MockHapticsAdapter;
let biometrics: MockBiometricsAdapter;
let secureStore: MockSecureStoreAdapter;
let sensors: MockSensorsAdapter;
let mediaPicker: MockMediaPickerAdapter;
let mediaLibrary: MockMediaLibraryAdapter;
let backgroundLocation: MockBackgroundLocationAdapter;
let bluetooth: MockBluetoothAdapter;
// Undefined: no vendor, as on the site.
let rfid: MockRfidAdapter | undefined;

beforeEach(() => {
  location = createMockLocationAdapter();
  geocoder = createMockGeocoderAdapter();
  camera = createMockCameraAdapter();
  network = createMockNetworkAdapter();
  battery = createMockBatteryAdapter();
  keepAwake = createMockKeepAwakeAdapter();
  orientation = createMockOrientationAdapter();
  haptics = createMockHapticsAdapter();
  biometrics = createMockBiometricsAdapter();
  secureStore = createMockSecureStoreAdapter();
  sensors = createMockSensorsAdapter();
  mediaPicker = createMockMediaPickerAdapter();
  mediaLibrary = createMockMediaLibraryAdapter();
  backgroundLocation = createMockBackgroundLocationAdapter();
  bluetooth = createMockBluetoothAdapter({
    gatt: {
      "AA:01": [
        {
          uuid: "180F",
          characteristics: [{ uuid: "2A19", value: [87] }],
        },
      ],
    },
  });
  rfid = createMockRfidAdapter();
  clearTaskLog();
  mockFocused = true;
  jest.mocked(ExpoHaptics.impactAsync).mockClear();
});

const Providers = ({ children }: { children: ReactNode }) => (
  <SafeAreaProvider
    initialMetrics={{
      frame: { x: 0, y: 0, width: 1280, height: 900 },
      insets: { top: 0, left: 0, right: 0, bottom: 0 },
    }}
  >
    <ThemeProvider>
      <AlertProvider>
        <ToastProvider>
          <DeviceAdaptersProvider
            adapters={{
              info: createMockDeviceInfoAdapter({ model: "Pixel 8" }),
              location,
              geocoder,
              camera,
              network,
              battery,
              keepAwake,
              orientation,
              haptics,
              biometrics,
              secureStore,
              sensors,
              mediaPicker,
              mediaLibrary,
              backgroundLocation,
              bluetooth,
              rfid,
            }}
          >
            {children}
          </DeviceAdaptersProvider>
        </ToastProvider>
      </AlertProvider>
    </ThemeProvider>
  </SafeAreaProvider>
);

it("links the overview to every capability", async () => {
  await render(<DeviceOverview />, { wrapper: Providers });
  for (const [title, href] of [
    ["Device info", "/device/info"],
    ["Location", "/device/location"],
    ["Camera", "/device/camera"],
    ["Network", "/device/network"],
    ["Battery", "/device/battery"],
    ["Keep awake", "/device/keep-awake"],
    ["Orientation", "/device/orientation"],
    ["Haptics", "/device/haptics"],
    ["Biometrics", "/device/biometrics"],
    ["Secure store", "/device/secure-store"],
    ["Sensors", "/device/sensors"],
    ["Media picker", "/device/media-picker"],
    ["Media library", "/device/media-library"],
    ["Background location", "/device/background-location"],
    ["Bluetooth", "/device/bluetooth"],
    ["RFID", "/device/rfid"],
  ]) {
    await fireEvent.press(screen.getByText(title));
    expect(mockPush).toHaveBeenLastCalledWith(href);
  }
});

it("lists the device info", async () => {
  await render(<DeviceInfoPage />, { wrapper: Providers });
  expect(screen.getByText("Pixel 8")).toBeTruthy();
  expect(screen.getByText("Real device")).toBeTruthy();
});

describe("location", () => {
  it("asks first, then locates on demand", async () => {
    await render(<LocationPage />, { wrapper: Providers });
    await waitFor(() => expect(screen.getByText("Not asked")).toBeTruthy());
    await fireEvent.press(screen.getByText("Use my location"));
    await waitFor(() => expect(screen.getByText("Granted")).toBeTruthy());
    expect(location.requestCount).toBe(1);
    await fireEvent.press(screen.getByText("Locate me"));
    await waitFor(() => expect(screen.getByText("41.902800")).toBeTruthy());
  });

  it("shows the precision and a position", async () => {
    location.setPermission("granted", { precision: "approximate" });
    location.setPosition(buildPosition({ latitude: 45.464211 }));
    await render(<LocationPage />, { wrapper: Providers });
    await waitFor(() => expect(screen.getByText("Approximate")).toBeTruthy());
    await fireEvent.press(screen.getByText("Locate me"));
    await waitFor(() => expect(screen.getByText("45.464211")).toBeTruthy());
  });

  it("follows the compass once started", async () => {
    location.setPermission("granted");
    await render(<LocationPage />, { wrapper: Providers });
    await waitFor(() => expect(screen.getByText("Granted")).toBeTruthy());
    await fireEvent.press(screen.getByText("Start the compass"));
    await waitFor(() => expect(location.headingWatches).toBe(1));
    await act(async () => {
      location.emitHeading({
        magneticHeading: 90,
        trueHeading: null,
        accuracy: "unreliable",
      });
    });
    expect(screen.getAllByText("90° E")).toHaveLength(2);
    expect(screen.getByText("Needs a location fix first")).toBeTruthy();
    expect(screen.getByText("Unreliable")).toBeTruthy();
    await fireEvent.press(screen.getByText("Stop the compass"));
    await waitFor(() => expect(location.headingWatches).toBe(0));
  });

  it("geocodes an address and the current position", async () => {
    location.setPermission("granted");
    geocoder.setReverseGeocode([
      buildGeocodedAddress({ formattedAddress: "Via Roma 1, Milano" }),
    ]);
    await render(<LocationPage />, { wrapper: Providers });
    await fireEvent.changeText(screen.getByLabelText("Address"), " Roma ");
    await fireEvent.press(screen.getByText("Find"));
    await waitFor(() =>
      expect(screen.getByText("41.895900, 12.482300")).toBeTruthy(),
    );
    expect(geocoder.geocodeCalls).toEqual(["Roma"]);
    await fireEvent.press(screen.getByText("What is here?"));
    await waitFor(() =>
      expect(screen.getByText("Via Roma 1, Milano")).toBeTruthy(),
    );
    expect(geocoder.reverseGeocodeCalls).toHaveLength(1);
  });

  it("says when nothing is found, and when there is no geocoder", async () => {
    geocoder.setGeocode([]);
    const { unmount } = await render(<LocationPage />, { wrapper: Providers });
    await fireEvent.press(screen.getByText("Find"));
    await waitFor(() =>
      expect(screen.getByText("No place matches that address.")).toBeTruthy(),
    );
    await unmount();
    geocoder = createMockGeocoderAdapter({ supported: false });
    await render(<LocationPage />, { wrapper: Providers });
    expect(
      screen.getByText(
        "No geocoder here. An app supplies its own provider through the geocoder adapter.",
      ),
    ).toBeTruthy();
  });
});

describe("camera", () => {
  it("offers the permission before the preview", async () => {
    await render(<CameraPage />, { wrapper: Providers });
    await waitFor(() => expect(screen.getByText("Camera access")).toBeTruthy());
    expect(screen.queryByTestId("mock-camera-preview")).toBeNull();
  });

  it("takes a photo through the ref", async () => {
    camera.setPermission("camera", "granted");
    await render(<CameraPage />, { wrapper: Providers });
    await fireEvent.press(screen.getByText("Photo"));
    await waitFor(() => expect(camera.preview?.mode).toBe("picture"));
    await fireEvent.press(screen.getByLabelText("Take a photo"));
    await waitFor(() => expect(screen.getByText("3024 × 4032")).toBeTruthy());
  });

  it("asks for the microphone in video mode, then records", async () => {
    camera.setPermission("camera", "granted");
    await render(<CameraPage />, { wrapper: Providers });
    await fireEvent.press(screen.getByText("Video"));
    await waitFor(() =>
      expect(screen.getByText("Allow camera and microphone")).toBeTruthy(),
    );
    await fireEvent.press(screen.getByText("Allow camera and microphone"));
    await waitFor(() => expect(camera.preview?.mode).toBe("video"));
    expect(camera.requestCount("microphone")).toBe(1);
    await fireEvent.press(screen.getByLabelText("Start recording"));
    expect(camera.recording).toEqual({
      maxDuration: 30,
      maxFileSize: undefined,
    });
    await fireEvent.press(screen.getByLabelText("Stop recording"));
    await waitFor(() =>
      expect(
        screen.getByText("Video saved to the cache directory"),
      ).toBeTruthy(),
    );
  });

  it("scans a QR code once granted", async () => {
    camera.setPermission("camera", "granted");
    await render(<CameraPage />, { wrapper: Providers });
    await waitFor(() =>
      expect(screen.getByTestId("mock-camera-preview")).toBeTruthy(),
    );
    expect(camera.preview).toMatchObject({
      barcodeTypes: ["qr"],
      active: true,
    });
    await act(async () => camera.scan({ data: "TICKET-42" }));
    expect(screen.getByText("TICKET-42")).toBeTruthy();
  });
});

it("follows the network", async () => {
  await render(<NetworkPage />, { wrapper: Providers });
  await waitFor(() => expect(screen.getByText("Online")).toBeTruthy());
  expect(screen.getByText("wifi")).toBeTruthy();
  await act(async () => network.setState(OFFLINE_NETWORK));
  expect(screen.getByText("Offline")).toBeTruthy();
  await fireEvent.press(screen.getByText("Check again"));
  await waitFor(() => expect(network.refreshCount).toBe(1));
});

it("follows the battery", async () => {
  await render(<BatteryPage />, { wrapper: Providers });
  await waitFor(() => expect(screen.getByText("80%")).toBeTruthy());
  expect(screen.getAllByText("On battery").length).toBeGreaterThan(0);
  await act(async () =>
    battery.setStatus({ level: 1, charging: "full", lowPowerMode: true }),
  );
  expect(screen.getByText("100%")).toBeTruthy();
  expect(screen.getByText("On")).toBeTruthy();
});

describe("keep awake", () => {
  it("holds the screen while switched on and focused", async () => {
    await render(<KeepAwakePage />, { wrapper: Providers });
    expect(keepAwake.isAwake).toBe(false);
    await fireEvent.press(screen.getByRole("switch"));
    await waitFor(() => expect(keepAwake.isAwake).toBe(true));
    expect(screen.getByText("Holding")).toBeTruthy();
  });

  it("lets go while another page is on screen", async () => {
    mockFocused = false;
    await render(<KeepAwakePage />, { wrapper: Providers });
    await fireEvent.press(screen.getByRole("switch"));
    expect(keepAwake.isAwake).toBe(false);
  });
});

describe("orientation", () => {
  it("shows the orientation and locks on demand", async () => {
    await render(<OrientationPage />, { wrapper: Providers });
    await waitFor(() => expect(screen.getByText("portrait-up")).toBeTruthy());
    await fireEvent.press(screen.getByText("Landscape"));
    await waitFor(() => expect(screen.getByText("Locked")).toBeTruthy());
    expect(orientation.currentLock).toBe("landscape");
    expect(screen.getByText("landscape-left")).toBeTruthy();
    await fireEvent.press(screen.getByText("App's own"));
    await waitFor(() => expect(orientation.currentLock).toBeNull());
  });

  it("reports a refused lock", async () => {
    orientation = createMockOrientationAdapter({ lockable: false });
    await render(<OrientationPage />, { wrapper: Providers });
    await fireEvent.press(screen.getByRole("radio", { name: "Portrait" }));
    await waitFor(() => expect(screen.getByText("Refused")).toBeTruthy());
  });
});

describe("haptics", () => {
  const SiteProviders = ({ children }: { children: ReactNode }) => (
    <Providers>
      <HapticThemeProvider>{children}</HapticThemeProvider>
    </Providers>
  );

  it("plays through the provided adapter, without a second press feedback", async () => {
    await render(<HapticsPage />, { wrapper: SiteProviders });
    await fireEvent.press(screen.getByText("Impact heavy"));
    await fireEvent.press(screen.getByText("Notify success"));
    expect(haptics.events).toEqual([
      { type: "impact", style: "heavy" },
      { type: "notification", feedback: "success" },
    ]);
    expect(ExpoHaptics.impactAsync).not.toHaveBeenCalled();
  });

  it("wires every control to hapticFeedback until switched off", async () => {
    await render(<HapticsPage />, { wrapper: SiteProviders });
    const control = screen.getByRole("switch");
    // Turning it off is itself a toggle, answered while still on.
    await fireEvent.press(control);
    expect(ExpoHaptics.impactAsync).toHaveBeenCalledWith("light");
    jest.mocked(ExpoHaptics.impactAsync).mockClear();
    await fireEvent.press(control);
    expect(ExpoHaptics.impactAsync).not.toHaveBeenCalled();
  });
});

describe("biometrics", () => {
  it("shows the device's status and the prompt's outcome", async () => {
    await render(<BiometricsPage />, { wrapper: Providers });
    await waitFor(() =>
      expect(screen.getByText("biometric-strong")).toBeTruthy(),
    );
    expect(screen.getByText("face")).toBeTruthy();

    await fireEvent.press(
      screen.getByRole("radio", { name: "Biometrics only" }),
    );
    await fireEvent.press(screen.getByText("Authenticate"));
    await waitFor(() => expect(screen.getByText("Success")).toBeTruthy());
    expect(biometrics.calls).toEqual([
      expect.objectContaining({ fallback: "none", strength: "weak" }),
    ]);

    biometrics.setResult({
      success: false,
      error: "lockout",
      detail: "lockout: Too many attempts",
    });
    await fireEvent.press(screen.getByText("Authenticate"));
    await waitFor(() => expect(screen.getByText("lockout")).toBeTruthy());
    expect(screen.getByText("lockout: Too many attempts")).toBeTruthy();
  });

  it("locks the card behind the app lock", async () => {
    await render(<BiometricsPage />, { wrapper: Providers });
    expect(screen.getByText("4242 4242 4242 4242")).toBeTruthy();
    await fireEvent.press(screen.getByRole("switch"));
    await waitFor(() =>
      expect(screen.getByText("•••• •••• •••• ••••")).toBeTruthy(),
    );
    await fireEvent.press(screen.getByText("Unlock"));
    await waitFor(() =>
      expect(screen.getByText("4242 4242 4242 4242")).toBeTruthy(),
    );
    expect(biometrics.calls).toEqual([
      expect.objectContaining({ promptMessage: "Unlock the protected card" }),
    ]);
    await fireEvent.press(screen.getByText("Lock now"));
    expect(screen.getByText("•••• •••• •••• ••••")).toBeTruthy();
  });

  it("does not lock while another page is on screen", async () => {
    mockFocused = false;
    await render(<BiometricsPage />, { wrapper: Providers });
    await fireEvent.press(screen.getByRole("switch"));
    expect(screen.getByText("4242 4242 4242 4242")).toBeTruthy();
  });
});

describe("secure store", () => {
  it("shares a plain item between its readers", async () => {
    await render(<SecureStorePage />, { wrapper: Providers });
    await waitFor(() =>
      expect(screen.getAllByText("Nothing stored")).toHaveLength(2),
    );
    await fireEvent.changeText(screen.getByLabelText("Note"), "hello");
    await fireEvent.press(screen.getByText("Save"));
    await waitFor(() => expect(screen.getAllByText("hello")).toHaveLength(2));
    expect(secureStore.items.get("playground/note")).toBe("hello");

    await fireEvent.press(screen.getAllByText("Remove")[0]);
    await waitFor(() =>
      expect(screen.getAllByText("Nothing stored")).toHaveLength(2),
    );
  });

  it("writes and reads a protected item, and shows its invalidation", async () => {
    await render(<SecureStorePage />, { wrapper: Providers });
    await fireEvent.changeText(screen.getByLabelText("Secret"), "s3cret");
    await fireEvent.press(screen.getByText("Save protected"));
    await waitFor(() => expect(screen.getByText("ok")).toBeTruthy());

    await fireEvent.press(screen.getByText("Read"));
    await waitFor(() => expect(screen.getByText("ok: s3cret")).toBeTruthy());
    expect(secureStore.prompts).toEqual([
      "Open the playground's secret",
      "Open the playground's secret",
    ]);

    secureStore.invalidate();
    await fireEvent.press(screen.getByText("Read"));
    await waitFor(() => expect(screen.getByText("invalidated")).toBeTruthy());

    secureStore.denyNext("cancelled");
    await fireEvent.press(screen.getByText("Read"));
    // The badge, and the detail (the mock's message is the status).
    await waitFor(() =>
      expect(screen.getAllByText("cancelled")).toHaveLength(2),
    );
  });
});

describe("sensors", () => {
  const FACE_UP = { x: 0, y: 0, z: 9.81 };

  it("shows the readings, how the device is held and device motion", async () => {
    await render(<SensorsPage />, { wrapper: Providers });
    await waitFor(() => expect(sensors.isActive("accelerometer")).toBe(true));
    // The level asks for 50 ms; the rows share that subscription.
    expect(sensors.intervals.accelerometer).toBe(50);
    expect(sensors.intervals.gyroscope).toBe(200);

    await act(async () => sensors.emit("accelerometer", FACE_UP));
    expect(screen.getByText("Lying face up")).toBeTruthy();
    expect(screen.getByText("x 0.00 · y 0.00 · z 9.81 m/s²")).toBeTruthy();

    await act(async () =>
      sensors.emit("barometer", { pressure: 1013.25, relativeAltitude: null }),
    );
    expect(screen.getByText("1013.3 hPa")).toBeTruthy();

    await act(async () =>
      sensors.emit("deviceMotion", {
        acceleration: { x: 0.5, y: 0, z: 0 },
        gravity: FACE_UP,
        rotationRate: { x: 0, y: 0, z: 1 },
      }),
    );
    expect(screen.getByText("x 0.50 · y 0.00 · z 0.00 m/s²")).toBeTruthy();
    expect(screen.getByText("x 0.00 · y 0.00 · z 1.00 rad/s")).toBeTruthy();
  });

  it("changes the interval and stops on the switch", async () => {
    await render(<SensorsPage />, { wrapper: Providers });
    await waitFor(() => expect(sensors.isActive("gyroscope")).toBe(true));
    await fireEvent.press(screen.getByRole("radio", { name: "1 s" }));
    await waitFor(() => expect(sensors.intervals.gyroscope).toBe(1000));

    await fireEvent.press(screen.getByRole("switch"));
    await waitFor(() => expect(sensors.isActive("accelerometer")).toBe(false));
    expect(sensors.isActive("gyroscope")).toBe(false);
    expect(sensors.isActive("deviceMotion")).toBe(false);
  });

  it("reads nothing while another page is on screen", async () => {
    mockFocused = false;
    await render(<SensorsPage />, { wrapper: Providers });
    await waitFor(() =>
      expect(screen.getAllByText("Paused").length).toBeGreaterThan(0),
    );
    expect(sensors.isActive("accelerometer")).toBe(false);
  });

  it("says why a sensor is missing", async () => {
    sensors = createMockSensorsAdapter({ available: { light: false } });
    await render(<SensorsPage />, { wrapper: Providers });
    await waitFor(() => expect(screen.getByText("Android only.")).toBeTruthy());
    expect(sensors.isActive("light")).toBe(false);
  });

  it("opens a gated sensor once motion access is allowed", async () => {
    sensors = createMockSensorsAdapter({ gated: ["barometer"] });
    await render(<SensorsPage />, { wrapper: Providers });
    await waitFor(() =>
      expect(screen.getByText("Allow motion access")).toBeTruthy(),
    );
    expect(screen.getByText("Needs motion access")).toBeTruthy();
    expect(sensors.isActive("barometer")).toBe(false);

    await fireEvent.press(screen.getByText("Allow motion access"));
    await waitFor(() => expect(sensors.isActive("barometer")).toBe(true));
    expect(sensors.permissionRequests).toBe(1);
    expect(screen.queryByText("Allow motion access")).toBeNull();
  });
});

describe("media picker", () => {
  it("picks with the chosen options and shows what came back", async () => {
    mediaPicker.respondWith({
      status: "picked",
      assets: [
        buildPickedMedia({ fileName: "beach.jpg" }),
        buildPickedMedia({ type: "video", uri: "file:///clip.mp4" }),
      ],
    });
    await render(<MediaPickerPage />, { wrapper: Providers });
    await fireEvent.press(screen.getByRole("radio", { name: "Both" }));
    await fireEvent.press(screen.getAllByRole("switch")[0]);
    await fireEvent.press(screen.getAllByRole("switch")[1]);
    await fireEvent.press(screen.getByText("Choose"));
    await waitFor(() => expect(screen.getByText("Picked (2)")).toBeTruthy());
    expect(mediaPicker.requests).toEqual([
      expect.objectContaining({
        mediaTypes: ["image", "video"],
        multiple: true,
        limit: 3,
        edit: false,
      }),
    ]);
    expect(screen.getByText("beach.jpg")).toBeTruthy();
    expect(
      screen.getByText("1080 × 1440 · 4.2 MB · 12.0 s · video/mp4"),
    ).toBeTruthy();
  });

  it("crops one photo, and reports a cancel", async () => {
    mediaPicker.respondWith({ status: "cancelled" });
    await render(<MediaPickerPage />, { wrapper: Providers });
    // Single item: the third switch is the crop.
    await fireEvent.press(screen.getAllByRole("switch")[1]);
    await fireEvent.press(screen.getByText("Choose"));
    await waitFor(() => expect(screen.getByText("Cancelled")).toBeTruthy());
    expect(mediaPicker.requests).toEqual([
      expect.objectContaining({ multiple: false, edit: true }),
    ]);
  });

  it("shows the result of a pick Android interrupted", async () => {
    mediaPicker.setPending({
      status: "picked",
      assets: [buildPickedMedia({ fileName: "recovered.jpg" })],
    });
    await render(<MediaPickerPage />, { wrapper: Providers });
    await waitFor(() => expect(screen.getByText("recovered.jpg")).toBeTruthy());
  });
});

describe("media library", () => {
  it("saves a chosen photo, asking for the permission the first time", async () => {
    await render(<MediaLibraryPage />, { wrapper: Providers });
    await waitFor(() => expect(screen.getByText("Not asked")).toBeTruthy());
    await fireEvent.press(screen.getByText("Choose a photo"));
    await waitFor(() =>
      expect(screen.getByText("Choose another")).toBeTruthy(),
    );
    await fireEvent.press(screen.getByText("Save to Photos"));
    await waitFor(() => expect(screen.getByText("Saved")).toBeTruthy());
    expect(screen.getByText("mock-asset-1")).toBeTruthy();
    expect(mediaLibrary.saved).toEqual([buildPickedMedia().uri]);
    expect(mediaLibrary.permissionRequests).toBe(1);
  });

  it("answers denied once refused, and points to the settings", async () => {
    mediaLibrary = createMockMediaLibraryAdapter({ permission: "denied" });
    await render(<MediaLibraryPage />, { wrapper: Providers });
    await waitFor(() => expect(screen.getByText("Open settings")).toBeTruthy());
    await fireEvent.press(screen.getByText("Choose a photo"));
    await waitFor(() =>
      expect(screen.getByText("Choose another")).toBeTruthy(),
    );
    await fireEvent.press(screen.getByText("Save to Photos"));
    await waitFor(() =>
      expect(screen.getAllByText("Denied").length).toBeGreaterThan(0),
    );
    expect(mediaLibrary.saved).toEqual([]);
    expect(mediaLibrary.permissionRequests).toBe(0);
  });

  it("says where no permission is needed, and where there is no library", async () => {
    mediaLibrary = createMockMediaLibraryAdapter({ gated: false });
    const { unmount } = await render(<MediaLibraryPage />, {
      wrapper: Providers,
    });
    expect(
      screen.getByText("Not required on this device: isRequired is false."),
    ).toBeTruthy();
    await unmount();

    mediaLibrary = createMockMediaLibraryAdapter({ supported: false });
    await render(<MediaLibraryPage />, { wrapper: Providers });
    expect(screen.getByText("No photo library here")).toBeTruthy();
  });
});

describe("background location", () => {
  it("records positions through the task and stops", async () => {
    location.setPermission("granted");
    await render(<BackgroundLocationPage />, { wrapper: Providers });
    await waitFor(() => expect(screen.getAllByText("Stopped")).toHaveLength(2));
    expect(
      screen.getByText("Nothing yet. Start one of the two above, then move."),
    ).toBeTruthy();
    await fireEvent.press(screen.getByText("Start recording"));
    await waitFor(() =>
      expect(screen.getByText("Stop recording")).toBeTruthy(),
    );
    expect(backgroundLocation.running.get(TRIP_TASK)).toMatchObject({
      distanceInterval: 10,
      foregroundService: { title: "Glowup playground" },
    });
    await act(() =>
      backgroundLocation.deliver(TRIP_TASK, [
        buildPosition({ latitude: 45.46421, longitude: 9.19, accuracy: 12 }),
      ]),
    );
    expect(screen.getByText("45.46421, 9.19000 ± 12 m")).toBeTruthy();
    await fireEvent.press(screen.getByText("Stop recording"));
    await waitFor(() => expect(backgroundLocation.running.size).toBe(0));
    await fireEvent.press(screen.getByText("Clear"));
    expect(
      screen.getByText("Nothing yet. Start one of the two above, then move."),
    ).toBeTruthy();
  });

  it("watches a circle around the current position once both permissions are granted", async () => {
    location.setPermission("granted");
    location.setPosition(buildPosition({ latitude: 41.9, longitude: 12.5 }));
    backgroundLocation.setPermission("denied");
    await render(<BackgroundLocationPage />, { wrapper: Providers });
    await fireEvent.press(screen.getByText("Locate me"));
    await waitFor(() =>
      expect(screen.getByText("Centre: 41.90000, 12.50000")).toBeTruthy(),
    );
    await fireEvent.press(screen.getByText("Watch 150 m around me"));
    await waitFor(() =>
      expect(
        screen.getByText(
          "Not allowed yet: grant the permissions above (geofencing needs the background one too).",
        ),
      ).toBeTruthy(),
    );
    backgroundLocation.setPermission("granted");
    await fireEvent.press(screen.getByText("Watch 150 m around me"));
    await waitFor(() => expect(screen.getByText("Stop watching")).toBeTruthy());
    expect(backgroundLocation.geofences.get(SITES_TASK)).toEqual([
      expect.objectContaining({ id: "here", latitude: 41.9, radius: 150 }),
    ]);
    await act(() =>
      backgroundLocation.deliverGeofence(SITES_TASK, "enter", "here"),
    );
    expect(screen.getByText('Entered "here"')).toBeTruthy();
    await fireEvent.press(screen.getByText("Stop watching"));
    await waitFor(() => expect(backgroundLocation.geofences.size).toBe(0));
  });

  it("asks for the background permission only after the foreground one", async () => {
    // The two mocks stand for one OS permission: keep them in step.
    backgroundLocation = createMockBackgroundLocationAdapter({
      foregroundPermission: "undetermined",
    });
    await render(<BackgroundLocationPage />, { wrapper: Providers });
    await waitFor(() =>
      expect(
        screen.getByText("Asked only after the foreground one"),
      ).toBeTruthy(),
    );
    await fireEvent.press(screen.getByText("Allow always"));
    expect(backgroundLocation.requestCount).toBe(0);
    await fireEvent.press(screen.getByText("Allow"));
    await waitFor(() =>
      expect(screen.getByText("Also with the app closed")).toBeTruthy(),
    );
  });

  it("says why it cannot start where unsupported", async () => {
    location.setPermission("granted");
    backgroundLocation = createMockBackgroundLocationAdapter({
      supported: false,
    });
    await render(<BackgroundLocationPage />, { wrapper: Providers });
    await waitFor(() => expect(screen.getAllByText("Stopped")).toHaveLength(2));
    expect(screen.getByText("Start recording")).toBeTruthy();
    backgroundLocation = createMockBackgroundLocationAdapter();
    backgroundLocation.failNextStart("unsupported");
    await render(<BackgroundLocationPage />, { wrapper: Providers });
    await fireEvent.press(screen.getAllByText("Start recording").at(-1)!);
    await waitFor(() =>
      expect(
        screen.getByText(
          "Not here: the web has no background location, and a native build needs backgroundLocation in the config plugin.",
        ),
      ).toBeTruthy(),
    );
  });
});

describe("bluetooth", () => {
  afterEach(() => jest.restoreAllMocks());

  it("asks, scans, connects and reads on the app's adapter in a development build", async () => {
    // Where the native module exists, the page uses the provided adapter.
    jest.spyOn(bleManagerAdapter, "isSupported").mockReturnValue(true);
    await render(<BluetoothPage />, { wrapper: Providers });
    await fireEvent.press(screen.getByText("Allow"));
    await waitFor(() => expect(screen.getByText("Granted")).toBeTruthy());
    expect(screen.getByText("Radio: On")).toBeTruthy();

    await fireEvent.press(screen.getByText("Scan all"));
    await waitFor(() => expect(bluetooth.scanning).not.toBeNull());
    await act(async () => {
      bluetooth.discover({ id: "AA:01", name: "Scale", rssi: -70 });
    });
    await waitFor(() => expect(screen.getByText("Scale")).toBeTruthy());
    expect(screen.getByText("AA:01 · -70 dBm")).toBeTruthy();

    await fireEvent.press(screen.getByText("Scale"));
    await fireEvent.press(screen.getByText("Connect"));
    await waitFor(() => expect(screen.getByText("Connected")).toBeTruthy());
    expect(screen.getByText("Services: 180f")).toBeTruthy();
    await fireEvent.press(screen.getByText("Read battery"));
    await waitFor(() => expect(screen.getByText("Battery: 87%")).toBeTruthy());
    await fireEvent.press(screen.getByText("Disconnect"));
    await waitFor(() => expect(bluetooth.connected.size).toBe(0));
  });

  it("says why it cannot scan without the permission", async () => {
    jest.spyOn(bleManagerAdapter, "isSupported").mockReturnValue(true);
    await render(<BluetoothPage />, { wrapper: Providers });
    await fireEvent.press(screen.getByText("Scan all"));
    await waitFor(() =>
      expect(
        screen.getByText("Not allowed yet: grant the permission above."),
      ).toBeTruthy(),
    );
    expect(bluetooth.scanCount).toBe(0);
  });

  it("runs on simulated devices without the native module", async () => {
    await render(<BluetoothPage />, { wrapper: Providers });
    expect(screen.getByText(/^Simulated devices/)).toBeTruthy();
    await fireEvent.press(screen.getByText("Allow"));
    await waitFor(() => expect(screen.getByText("Granted")).toBeTruthy());
    await fireEvent.press(screen.getByText("Heart rate only"));
    await waitFor(() => expect(screen.getByText("Glowup HRM")).toBeTruthy());
    expect(screen.queryByText("Scale")).toBeNull();
    await fireEvent.press(screen.getByText("Glowup HRM"));
    await fireEvent.press(screen.getByText("Connect"));
    await waitFor(() =>
      expect(screen.getByText(/^Heart rate: \d+ bpm$/)).toBeTruthy(),
    );
    await fireEvent.press(screen.getByText("Device information"));
    await waitFor(() =>
      expect(screen.getByText("Glowup Labs · HRM-1 · 1.4.2")).toBeTruthy(),
    );
    await fireEvent.press(screen.getByText("Disconnect"));
    await waitFor(() => expect(screen.getByText("Connect")).toBeTruthy());
  });
});

describe("rfid", () => {
  it("connects, scans, reads one tag and searches for it on the app's adapter", async () => {
    const reader = rfid!;
    await render(<RfidPage />, { wrapper: Providers });
    expect(
      screen.getByText("A real reader, through the app's adapter."),
    ).toBeTruthy();
    await fireEvent.press(screen.getByText("Allow"));
    await waitFor(() => expect(screen.getByText("Granted")).toBeTruthy());

    await fireEvent.press(screen.getByText("Search readers"));
    await waitFor(() => expect(reader.isDiscovering).toBe(true));
    await act(async () => reader.discover());
    await waitFor(() =>
      expect(screen.getByText("Mock RFID reader")).toBeTruthy(),
    );
    await fireEvent.press(screen.getByText("Mock RFID reader"));
    await waitFor(() =>
      expect(
        screen.getByText(
          "Mock RFID reader · Mock · firmware 1.0.0 · battery 80%",
        ),
      ).toBeTruthy(),
    );

    await fireEvent.press(screen.getByText("Scan"));
    await waitFor(() => expect(reader.inventory).toEqual({ tid: false }));
    await act(async () =>
      reader.emitTags([{ epc: "3034257bf7194e4000001a85", rssi: -40 }]),
    );
    await waitFor(() =>
      expect(screen.getByText("3034257BF7194E4000001A85")).toBeTruthy(),
    );
    expect(screen.getByText("1 tags")).toBeTruthy();
    await fireEvent.press(screen.getByText("Stop"));
    await waitFor(() => expect(reader.inventory).toBeNull());

    // A read reported before the single read is what it hears.
    reader.emitTags([
      {
        epc: "E28011700000020A4C7B12F0",
        rssi: -30,
        tid: "e2801170200030ecc48408f9",
      },
    ]);
    await fireEvent.press(screen.getByText("Read"));
    await waitFor(() =>
      expect(screen.getByText("E28011700000020A4C7B12F0")).toBeTruthy(),
    );
    expect(screen.getByText(/TID E2801170200030ECC48408F9/)).toBeTruthy();
    expect(reader.readOnceCount).toBe(1);

    await fireEvent.press(screen.getByText("E28011700000020A4C7B12F0"));
    expect(screen.getByText("Tag E28011700000020A4C7B12F0")).toBeTruthy();
    await fireEvent.press(screen.getByText("Start the search"));
    await waitFor(() =>
      expect(reader.locating).toBe("E28011700000020A4C7B12F0"),
    );
    await act(async () => {
      reader.emitLocate(-30);
    });
    await waitFor(() => expect(screen.getByText("In range")).toBeTruthy());
    expect(screen.getByText("100% · -30 dBm")).toBeTruthy();
    await fireEvent.press(screen.getByText("Stop"));
    await waitFor(() => expect(reader.locating).toBeNull());

    await fireEvent.press(screen.getByText("Disconnect"));
    await waitFor(() => expect(reader.connection.state).toBe("disconnected"));
  });

  it("scans on the trigger", async () => {
    const reader = rfid!;
    reader.setPermission("granted");
    await reader.connect("00:11:22:33:44:55");
    await render(<RfidPage />, { wrapper: Providers });
    await waitFor(() => expect(reader.triggerSubscriberCount).toBe(1));
    await act(async () => reader.pressTrigger(true));
    await waitFor(() => expect(reader.inventory).not.toBeNull());
    expect(screen.getByText("Trigger held")).toBeTruthy();
    await act(async () => reader.pressTrigger(false));
    await waitFor(() => expect(reader.inventory).toBeNull());
  });

  it("says why it cannot scan before a reader is connected", async () => {
    rfid!.setPermission("granted");
    await render(<RfidPage />, { wrapper: Providers });
    await fireEvent.press(screen.getByText("Scan"));
    await waitFor(() =>
      expect(screen.getByText("Connect to a reader first.")).toBeTruthy(),
    );
  });

  it("runs on a simulated reader without a vendor", async () => {
    rfid = undefined;
    await render(<RfidPage />, { wrapper: Providers });
    expect(screen.getByText(/^Simulated reader/)).toBeTruthy();
    await fireEvent.press(screen.getByText("Allow"));
    await waitFor(() => expect(screen.getByText("Granted")).toBeTruthy());
    await fireEvent.press(screen.getByText("Search readers"));
    await waitFor(() =>
      expect(screen.getByText("IH40 · aisle 3")).toBeTruthy(),
    );
    await fireEvent.press(screen.getByText("IH40 · aisle 3"));
    await waitFor(() => expect(screen.getByText("Connected")).toBeTruthy());
    await fireEvent.press(screen.getByText("Stop searching"));

    await fireEvent.press(screen.getByText("Scan"));
    await waitFor(() => expect(screen.getByText(/^\d+ tags$/)).toBeTruthy());
    await fireEvent.press(screen.getByText("Stop"));
    await fireEvent.press(screen.getByText("Disconnect"));
    await waitFor(() => expect(screen.getByText("Disconnected")).toBeTruthy());
  });
});
