import { render } from "@testing-library/react-native";
import { Camera } from "expo-camera";
import { createRef } from "react";

import { CameraView, expoCameraAdapter, type CameraHandle } from "../camera";
import { toBarcodeType } from "../camera/barcodes";
import { toCameraError } from "../camera/errors";

// A stand-in for expo-camera's CameraView: records its props, and exposes
// the methods the adapter calls through its ref.
const mockCamera = {
  props: null as Record<string, any> | null,
  methods: {
    takePictureAsync: jest.fn(),
    recordAsync: jest.fn(),
    stopRecording: jest.fn(),
  },
};

jest.mock("expo-camera", () => {
  const { createElement, useImperativeHandle } =
    jest.requireActual<typeof import("react")>("react");
  const { View } =
    jest.requireActual<typeof import("react-native")>("react-native");
  function CameraView(props: Record<string, any>) {
    mockCamera.props = props;
    useImperativeHandle(props.ref, () => mockCamera.methods);
    return createElement(View, { testID: "expo-camera" }, props.children);
  }
  return {
    CameraView,
    Camera: {
      getCameraPermissionsAsync: jest.fn(),
      requestCameraPermissionsAsync: jest.fn(),
      getMicrophonePermissionsAsync: jest.fn(),
      requestMicrophonePermissionsAsync: jest.fn(),
    },
  };
});

const coded = (code: string) => Object.assign(new Error(code), { code });

beforeEach(() => {
  mockCamera.props = null;
  Object.values(mockCamera.methods).forEach((fn) => fn.mockReset());
});

describe("props", () => {
  it("maps CameraView's props and leaves the scanner off", async () => {
    await render(<CameraView facing="front" torch zoom={0.5} />);
    expect(mockCamera.props).toMatchObject({
      facing: "front",
      flash: "off",
      enableTorch: true,
      zoom: 0.5,
      mode: "picture",
      mute: false,
      videoQuality: "720p",
      active: true,
      barcodeScannerSettings: undefined,
      onBarcodeScanned: undefined,
    });
  });

  it("scans QR codes by default and normalises the result", async () => {
    const onBarcodeScanned = jest.fn();
    await render(<CameraView onBarcodeScanned={onBarcodeScanned} />);
    expect(mockCamera.props!.barcodeScannerSettings).toEqual({
      barcodeTypes: ["qr"],
    });
    mockCamera.props!.onBarcodeScanned({
      type: "org.iso.QRCode",
      data: "https://example.com",
      bounds: { origin: { x: 1, y: 2 }, size: { width: 3, height: 4 } },
      cornerPoints: [],
    });
    expect(onBarcodeScanned).toHaveBeenCalledWith({
      type: "qr",
      rawType: "org.iso.QRCode",
      data: "https://example.com",
      bounds: { x: 1, y: 2, width: 3, height: 4 },
    });
  });

  it("reports a mount failure as unavailable", async () => {
    const onError = jest.fn();
    await render(<CameraView onError={onError} />);
    mockCamera.props!.onMountError({ message: "No camera" });
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ code: "unavailable", message: "No camera" }),
    );
  });
});

describe("captures", () => {
  it("takes a picture without base64 unless asked", async () => {
    const ref = createRef<CameraHandle>();
    mockCamera.methods.takePictureAsync.mockResolvedValue({
      uri: "file:///p.jpg",
      width: 10,
      height: 20,
      format: "jpg",
    });
    await render(<CameraView ref={ref} />);
    await expect(ref.current!.takePicture({ quality: 0.7 })).resolves.toEqual({
      uri: "file:///p.jpg",
      width: 10,
      height: 20,
      base64: null,
    });
    expect(mockCamera.methods.takePictureAsync).toHaveBeenCalledWith({
      quality: 0.7,
      base64: false,
    });
  });

  it("maps a capture before the preview is ready", async () => {
    const ref = createRef<CameraHandle>();
    mockCamera.methods.takePictureAsync.mockRejectedValue(
      coded("ERR_CAMERA_NOT_READY"),
    );
    await render(<CameraView ref={ref} />);
    await expect(ref.current!.takePicture()).rejects.toMatchObject({
      code: "not-ready",
    });
  });

  it("records with a 60 s limit by default", async () => {
    const ref = createRef<CameraHandle>();
    mockCamera.methods.recordAsync.mockResolvedValue({ uri: "file:///v.mov" });
    await render(<CameraView ref={ref} mode="video" />);
    await expect(ref.current!.recordVideo()).resolves.toEqual({
      uri: "file:///v.mov",
    });
    expect(mockCamera.methods.recordAsync).toHaveBeenCalledWith({
      maxDuration: 60,
      maxFileSize: undefined,
    });
    ref.current!.stopRecording();
    expect(mockCamera.methods.stopRecording).toHaveBeenCalled();
  });

  it("fails a recording that produced no file", async () => {
    const ref = createRef<CameraHandle>();
    mockCamera.methods.recordAsync.mockResolvedValue(undefined);
    await render(<CameraView ref={ref} mode="video" />);
    await expect(ref.current!.recordVideo()).rejects.toMatchObject({
      code: "capture-failed",
    });
  });
});

describe("permissions", () => {
  it("reads and requests the camera and the microphone separately", async () => {
    const granted = { status: "granted", granted: true, canAskAgain: true };
    const denied = { status: "denied", granted: false, canAskAgain: false };
    jest
      .mocked(Camera.getCameraPermissionsAsync)
      .mockResolvedValue(granted as never);
    jest
      .mocked(Camera.requestMicrophonePermissionsAsync)
      .mockResolvedValue(denied as never);
    expect(await expoCameraAdapter.getPermission("camera")).toEqual({
      status: "granted",
      canAskAgain: false,
    });
    expect(await expoCameraAdapter.requestPermission("microphone")).toEqual({
      status: "denied",
      canAskAgain: false,
    });
  });

  it("records only on native", () => {
    expect(expoCameraAdapter.supportsVideo()).toBe(true);
  });
});

describe("toBarcodeType", () => {
  it.each([
    ["qr", "qr"],
    ["org.iso.QRCode", "qr"],
    ["org.gs1.EAN-13", "ean13"],
    ["ean8", "ean8"],
    ["org.iso.Code128", "code128"],
    ["upc_a", "upc_a"],
    ["org.gs1.UPC-E", "upc_e"],
    ["org.ansi.Interleaved2of5", "unknown"],
    ["32", "unknown"],
  ])("maps %s to %s", (raw, expected) => {
    expect(toBarcodeType(raw)).toBe(expected);
  });
});

describe("toCameraError", () => {
  it("keeps the fallback for unknown codes", () => {
    expect(toCameraError(coded("ERR_WHATEVER"), "capture-failed").code).toBe(
      "capture-failed",
    );
    expect(
      toCameraError(coded("ERR_CAMERA_UNAVAILABLE"), "capture-failed").code,
    ).toBe("unavailable");
  });
});
