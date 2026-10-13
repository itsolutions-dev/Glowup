import {
  act,
  render,
  renderHook,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { createRef, type ReactElement, type ReactNode } from "react";
import { Text } from "react-native";

import { DeviceAdaptersProvider } from "..";
import {
  CameraError,
  CameraView,
  useCameraPermission,
  type CameraAdapter,
  type CameraHandle,
} from "../camera";
import {
  createMockCameraAdapter,
  MOCK_PICTURE,
  MOCK_VIDEO,
  type MockCameraAdapter,
} from "../testing";

// Only for the module-level default; every test injects a mock adapter.
jest.mock("expo-camera", () => ({ CameraView: () => null, Camera: {} }));

function wrapperFor(camera: CameraAdapter) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <DeviceAdaptersProvider adapters={{ camera }}>
        {children}
      </DeviceAdaptersProvider>
    );
  };
}

let adapter: MockCameraAdapter;
beforeEach(() => {
  adapter = createMockCameraAdapter({ camera: "granted" });
});

const renderCamera = (ui: ReactElement) =>
  render(ui, { wrapper: wrapperFor(adapter) });

describe("CameraView", () => {
  it("hands the preview every default and draws its children", async () => {
    const onReady = jest.fn();
    await renderCamera(
      <CameraView onReady={onReady}>
        <Text>viewfinder</Text>
      </CameraView>,
    );
    expect(screen.getByTestId("mock-camera-preview")).toBeTruthy();
    expect(screen.getByText("viewfinder")).toBeTruthy();
    expect(adapter.preview).toMatchObject({
      facing: "back",
      flash: "off",
      torch: false,
      zoom: 0,
      mode: "picture",
      mute: false,
      videoQuality: "720p",
      active: true,
      barcodeTypes: null,
    });
    expect(onReady).toHaveBeenCalledTimes(1);
  });

  it("renders no preview where the platform has no camera", async () => {
    adapter = createMockCameraAdapter({ supported: false });
    const ref = createRef<CameraHandle>();
    await renderCamera(
      <CameraView ref={ref}>
        <Text>overlay</Text>
      </CameraView>,
    );
    expect(screen.queryByTestId("mock-camera-preview")).toBeNull();
    expect(screen.getByText("overlay")).toBeTruthy();
    await expect(ref.current!.takePicture()).rejects.toMatchObject({
      code: "unsupported",
    });
  });

  it("forwards a mount failure", async () => {
    const onError = jest.fn();
    await renderCamera(<CameraView onError={onError} />);
    await act(async () => adapter.failMount("unavailable"));
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ code: "unavailable" }),
    );
  });
});

describe("scanning", () => {
  it("scans QR codes only by default", async () => {
    const onBarcodeScanned = jest.fn();
    await renderCamera(<CameraView onBarcodeScanned={onBarcodeScanned} />);
    expect(adapter.preview!.barcodeTypes).toEqual(["qr"]);
    await act(async () => {
      adapter.scan({ data: "8001234567890", type: "ean13" });
      adapter.scan({ data: "hello" });
    });
    expect(onBarcodeScanned).toHaveBeenCalledTimes(1);
    expect(onBarcodeScanned).toHaveBeenCalledWith(
      expect.objectContaining({ type: "qr", data: "hello" }),
    );
  });

  it("reports the same code once per interval", async () => {
    const now = jest.spyOn(Date, "now").mockReturnValue(1000);
    const onBarcodeScanned = jest.fn();
    await renderCamera(<CameraView onBarcodeScanned={onBarcodeScanned} />);
    await act(async () => {
      adapter.scan({ data: "A" });
      adapter.scan({ data: "A" }); // same frame burst: dropped
      adapter.scan({ data: "B" }); // another code: reported
    });
    now.mockReturnValue(2500);
    await act(async () => adapter.scan({ data: "B" })); // interval elapsed
    expect(onBarcodeScanned.mock.calls.map(([b]) => b.data)).toEqual([
      "A",
      "B",
      "B",
    ]);
    now.mockRestore();
  });

  it("reports every frame with scanInterval 0", async () => {
    const onBarcodeScanned = jest.fn();
    await renderCamera(
      <CameraView onBarcodeScanned={onBarcodeScanned} scanInterval={0} />,
    );
    await act(async () => {
      adapter.scan({ data: "A" });
      adapter.scan({ data: "A" });
    });
    expect(onBarcodeScanned).toHaveBeenCalledTimes(2);
  });

  it("keeps the scanner configuration across renders of an inline list", async () => {
    const onBarcodeScanned = jest.fn();
    const { rerender } = await renderCamera(
      <CameraView
        onBarcodeScanned={onBarcodeScanned}
        barcodeTypes={["qr", "ean13"]}
      />,
    );
    const first = adapter.preview!.barcodeTypes;
    await rerender(
      <CameraView
        onBarcodeScanned={onBarcodeScanned}
        barcodeTypes={["qr", "ean13"]}
      />,
    );
    expect(adapter.preview!.barcodeTypes).toBe(first);
  });
});

describe("captures", () => {
  it("takes a picture through the ref", async () => {
    const ref = createRef<CameraHandle>();
    await renderCamera(<CameraView ref={ref} />);
    await expect(ref.current!.takePicture()).resolves.toEqual(MOCK_PICTURE);
    adapter.setPicture(new CameraError("not-ready"));
    await expect(ref.current!.takePicture()).rejects.toMatchObject({
      code: "not-ready",
    });
  });

  it("records until stopped, with a 60 s limit by default", async () => {
    const ref = createRef<CameraHandle>();
    await renderCamera(<CameraView ref={ref} mode="video" />);
    let video!: Promise<unknown>;
    await act(async () => {
      video = ref.current!.recordVideo();
    });
    expect(adapter.recording).toEqual({
      maxDuration: 60,
      maxFileSize: undefined,
    });
    ref.current!.stopRecording();
    await expect(video).resolves.toEqual(MOCK_VIDEO);
    expect(adapter.recording).toBeNull();
  });

  it("refuses to record outside video mode", async () => {
    const ref = createRef<CameraHandle>();
    await renderCamera(<CameraView ref={ref} />);
    await expect(ref.current!.recordVideo()).rejects.toMatchObject({
      code: "invalid-mode",
    });
  });

  it("refuses to record where the adapter cannot", async () => {
    adapter = createMockCameraAdapter({ supportsVideo: false });
    const ref = createRef<CameraHandle>();
    await renderCamera(<CameraView ref={ref} mode="video" />);
    await expect(ref.current!.recordVideo()).rejects.toMatchObject({
      code: "unsupported",
    });
  });
});

describe("useCameraPermission", () => {
  const renderPermission = (options?: { microphone?: boolean }) =>
    renderHook(() => useCameraPermission(options), {
      wrapper: wrapperFor(adapter),
    });

  it("reports the camera alone by default", async () => {
    adapter = createMockCameraAdapter();
    const { result } = await renderPermission();
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current).toMatchObject({
      status: "undetermined",
      microphone: null,
    });
    await act(async () => {
      await result.current.request();
    });
    expect(result.current.status).toBe("granted");
    expect(adapter.requestCount("microphone")).toBe(0);
  });

  it("asks for the microphone once the camera is granted", async () => {
    adapter = createMockCameraAdapter();
    const { result } = await renderPermission({ microphone: true });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(async () => {
      await result.current.request();
    });
    expect(adapter.requestCount("camera")).toBe(1);
    expect(adapter.requestCount("microphone")).toBe(1);
    expect(result.current).toMatchObject({
      status: "granted",
      camera: { status: "granted" },
      microphone: { status: "granted" },
    });
  });

  it("does not ask for the microphone after a refused camera", async () => {
    adapter = createMockCameraAdapter({ requestResult: "denied" });
    const { result } = await renderPermission({ microphone: true });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(async () => {
      await result.current.request();
    });
    expect(adapter.requestCount("microphone")).toBe(0);
    expect(result.current.status).toBe("denied");
  });

  it("reports the weaker of the two", async () => {
    adapter = createMockCameraAdapter({
      camera: "granted",
      microphone: "denied",
    });
    const { result } = await renderPermission({ microphone: true });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.status).toBe("denied");
  });

  it("ignores the microphone where nothing can record", async () => {
    adapter = createMockCameraAdapter({ supportsVideo: false });
    const { result } = await renderPermission({ microphone: true });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.microphone).toBeNull();
  });

  it("is unsupported without a camera API", async () => {
    adapter = createMockCameraAdapter({ supported: false });
    const { result } = await renderPermission();
    await waitFor(() => expect(result.current.status).toBe("unsupported"));
  });
});
