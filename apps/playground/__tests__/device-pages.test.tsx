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
  buildPosition,
  createMockBatteryAdapter,
  createMockBiometricsAdapter,
  createMockCameraAdapter,
  createMockDeviceInfoAdapter,
  createMockHapticsAdapter,
  createMockKeepAwakeAdapter,
  createMockLocationAdapter,
  createMockNetworkAdapter,
  createMockOrientationAdapter,
  createMockSecureStoreAdapter,
  OFFLINE_NETWORK,
  type MockBatteryAdapter,
  type MockBiometricsAdapter,
  type MockCameraAdapter,
  type MockHapticsAdapter,
  type MockKeepAwakeAdapter,
  type MockLocationAdapter,
  type MockNetworkAdapter,
  type MockOrientationAdapter,
  type MockSecureStoreAdapter,
} from "@its/glowup-device/testing";
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
let camera: MockCameraAdapter;
let network: MockNetworkAdapter;
let battery: MockBatteryAdapter;
let keepAwake: MockKeepAwakeAdapter;
let orientation: MockOrientationAdapter;
let haptics: MockHapticsAdapter;
let biometrics: MockBiometricsAdapter;
let secureStore: MockSecureStoreAdapter;

beforeEach(() => {
  location = createMockLocationAdapter();
  camera = createMockCameraAdapter();
  network = createMockNetworkAdapter();
  battery = createMockBatteryAdapter();
  keepAwake = createMockKeepAwakeAdapter();
  orientation = createMockOrientationAdapter();
  haptics = createMockHapticsAdapter();
  biometrics = createMockBiometricsAdapter();
  secureStore = createMockSecureStoreAdapter();
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
              camera,
              network,
              battery,
              keepAwake,
              orientation,
              haptics,
              biometrics,
              secureStore,
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
