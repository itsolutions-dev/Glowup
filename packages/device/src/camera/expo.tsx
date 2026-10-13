import {
  Camera,
  CameraView as ExpoCameraView,
  type BarcodeScanningResult,
} from "expo-camera";
import { useCallback, useImperativeHandle, useMemo, useRef } from "react";

import { toPermissionState } from "../core/permissions";
import { hasDOM, isNativePlatform } from "../core/support";
import { toScannedBarcode } from "./barcodes";
import { CameraError, toCameraError } from "./errors";
import type {
  CameraAdapter,
  CameraHandle,
  CameraPermissionKind,
  CameraPreviewProps,
} from "./types";

function ExpoCameraPreview({
  ref,
  facing,
  flash,
  torch,
  zoom,
  mode,
  mute,
  videoQuality,
  active,
  barcodeTypes,
  onBarcodeScanned,
  onReady,
  onError,
  style,
  children,
}: CameraPreviewProps) {
  const camera = useRef<ExpoCameraView>(null);

  useImperativeHandle(
    ref,
    (): CameraHandle => ({
      async takePicture({ quality, base64 = false } = {}) {
        const view = camera.current;
        if (!view) throw new CameraError("not-ready");
        try {
          const picture = await view.takePictureAsync({ quality, base64 });
          return {
            uri: picture.uri,
            width: picture.width,
            height: picture.height,
            base64: picture.base64 ?? null,
          };
        } catch (error) {
          throw toCameraError(error, "capture-failed");
        }
      },
      async recordVideo({ maxDuration, maxFileSize } = {}) {
        const view = camera.current;
        if (!view) throw new CameraError("not-ready");
        let video: { uri: string } | undefined;
        try {
          video = await view.recordAsync({ maxDuration, maxFileSize });
        } catch (error) {
          throw toCameraError(error, "capture-failed");
        }
        if (!video?.uri) {
          throw new CameraError("capture-failed", "The recording has no file.");
        }
        return { uri: video.uri };
      },
      stopRecording() {
        camera.current?.stopRecording();
      },
    }),
    [],
  );

  const scannerSettings = useMemo(
    () => (barcodeTypes ? { barcodeTypes: [...barcodeTypes] } : undefined),
    [barcodeTypes],
  );
  const handleScanned = useCallback(
    (result: BarcodeScanningResult) =>
      onBarcodeScanned?.(toScannedBarcode(result)),
    [onBarcodeScanned],
  );
  const handleMountError = useCallback(
    ({ message }: { message: string }) =>
      onError?.(new CameraError("unavailable", message)),
    [onError],
  );

  return (
    <ExpoCameraView
      ref={camera}
      style={style}
      facing={facing}
      flash={flash}
      enableTorch={torch}
      zoom={zoom}
      mode={mode}
      mute={mute}
      videoQuality={videoQuality}
      active={active}
      barcodeScannerSettings={scannerSettings}
      // Passing no handler is what turns expo-camera's scanner off.
      onBarcodeScanned={
        barcodeTypes && onBarcodeScanned ? handleScanned : undefined
      }
      onCameraReady={onReady}
      onMountError={handleMountError}
    >
      {children}
    </ExpoCameraView>
  );
}

const PERMISSIONS = {
  camera: {
    get: () => Camera.getCameraPermissionsAsync(),
    request: () => Camera.requestCameraPermissionsAsync(),
  },
  microphone: {
    get: () => Camera.getMicrophonePermissionsAsync(),
    request: () => Camera.requestMicrophonePermissionsAsync(),
  },
} satisfies Record<CameraPermissionKind, unknown>;

/**
 * The default: expo-camera on iOS, Android and web. Its web build streams the
 * preview with `getUserMedia`, takes pictures and scans (`BarcodeDetector`,
 * or a bundled polyfill) but cannot record video.
 */
export const expoCameraAdapter: CameraAdapter = {
  isSupported: () =>
    isNativePlatform ||
    (hasDOM() && typeof navigator.mediaDevices?.getUserMedia === "function"),
  supportsVideo: () => isNativePlatform,
  async getPermission(kind) {
    return toPermissionState(await PERMISSIONS[kind].get());
  },
  async requestPermission(kind) {
    return toPermissionState(await PERMISSIONS[kind].request());
  },
  Preview: ExpoCameraPreview,
};
