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
  createMockCameraAdapter,
  createMockDeviceInfoAdapter,
  createMockLocationAdapter,
  type MockCameraAdapter,
  type MockLocationAdapter,
} from "@its/glowup-device/testing";

import DeviceOverview from "../app/device";
import CameraPage from "../app/device/camera";
import DeviceInfoPage from "../app/device/info";
import LocationPage from "../app/device/location";

// The pages run on the package's in-memory adapters; the Expo modules behind
// the defaults only need to load.
jest.mock("expo-location", () => ({ LocationAccuracy: {} }));
jest.mock("expo-camera", () => ({ CameraView: () => null, Camera: {} }));
jest.mock("expo-device", () => ({ DeviceType: {} }));
jest.mock("expo-application", () => ({}));

// No navigator is mounted (as in the catalogue test): the focus effect runs
// once, as on a page that is focused.
const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  ...jest.requireActual("expo-router"),
  useRouter: () => ({ push: mockPush }),
  useFocusEffect: (effect: () => void | (() => void)) => {
    const { useEffect: useMountEffect } = jest.requireActual("react");
    useMountEffect(effect, [effect]);
  },
}));

let location: MockLocationAdapter;
let camera: MockCameraAdapter;

beforeEach(() => {
  location = createMockLocationAdapter();
  camera = createMockCameraAdapter();
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
