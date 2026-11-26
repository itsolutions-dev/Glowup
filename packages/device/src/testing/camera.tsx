import { useEffect, useImperativeHandle } from "react";
import { View } from "react-native";

import { CameraError, type CameraErrorCode } from "../camera/errors";
import type {
  BarcodeType,
  CameraAdapter,
  CameraHandle,
  CameraPermissionKind,
  CameraPreviewProps,
  CapturedPicture,
  RecordedVideo,
  RecordOptions,
  ScannedBarcode,
} from "../camera/types";
import type { PermissionState, PermissionStatus } from "../core/types";
import { mockPermission } from "./permission";

export const MOCK_PICTURE: CapturedPicture = {
  uri: "file:///mock/picture.jpg",
  width: 3024,
  height: 4032,
  base64: null,
};

export const MOCK_VIDEO: RecordedVideo = { uri: "file:///mock/video.mov" };

export interface MockCameraOptions {
  /** Default `"undetermined"`. */
  camera?: PermissionStatus;
  /** Default `"undetermined"`. */
  microphone?: PermissionStatus;
  /** What a request turns an askable permission into. Default `"granted"`. */
  requestResult?: "granted" | "denied";
  /** Default true. */
  supported?: boolean;
  /** Default true. */
  supportsVideo?: boolean;
  /** Call `onReady` when the preview mounts. Default true. */
  autoReady?: boolean;
}

export interface MockCameraAdapter extends CameraAdapter {
  setPermission(
    kind: CameraPermissionKind,
    status: PermissionStatus,
    options?: { canAskAgain?: boolean },
  ): void;
  /** What the next `takePicture()` answers. Default `MOCK_PICTURE`. */
  setPicture(next: CapturedPicture | CameraError): void;
  /**
   * Shows a code to the mounted preview. It reaches `onBarcodeScanned` only
   * while scanning is on and its type is among `barcodeTypes`, as on a device.
   * Default type `"qr"`.
   */
  scan(
    barcode: { data: string; type?: BarcodeType } & Partial<ScannedBarcode>,
  ): void;
  /** Ends the running `recordVideo()` (as a limit or `stopRecording()` would). */
  finishRecording(result?: RecordedVideo | CameraError): void;
  /** Reports a mount failure through `onError`. */
  failMount(error?: CameraError | CameraErrorCode): void;
  /** The mounted preview's props, every `CameraView` default applied; `null` when none. */
  readonly preview: CameraPreviewProps | null;
  /** The running recording's options; `null` when not recording. */
  readonly recording: RecordOptions | null;
  requestCount(kind: CameraPermissionKind): number;
}

/**
 * An in-memory `CameraAdapter`: a preview that renders a plain `View`
 * (`testID="mock-camera-preview"`) and captures without hardware. Inject it
 * with `<DeviceAdaptersProvider adapters={{ camera: adapter }}>`; create one
 * per test (permission state is shared per adapter).
 */
export function createMockCameraAdapter(
  options: MockCameraOptions = {},
): MockCameraAdapter {
  const requestResult = options.requestResult ?? "granted";
  const permissions: Record<CameraPermissionKind, PermissionState> = {
    camera: mockPermission(options.camera ?? "undetermined"),
    microphone: mockPermission(options.microphone ?? "undetermined"),
  };
  const requests: Record<CameraPermissionKind, number> = {
    camera: 0,
    microphone: 0,
  };
  let picture: CapturedPicture | CameraError = MOCK_PICTURE;
  let mounted: CameraPreviewProps | null = null;
  let recording: {
    options: RecordOptions;
    finish: (result: RecordedVideo | CameraError) => void;
  } | null = null;

  function MockCameraPreview(props: CameraPreviewProps) {
    const { ref, onReady, style, children } = props;
    useEffect(() => {
      mounted = props;
    });
    useEffect(
      () => () => {
        mounted = null;
      },
      [],
    );
    useEffect(() => {
      if (options.autoReady ?? true) onReady?.();
      // Once per mount, as a device reports it.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useImperativeHandle(
      ref,
      (): CameraHandle => ({
        async takePicture({ base64 = false } = {}) {
          if (picture instanceof CameraError) throw picture;
          return { ...picture, base64: base64 ? "bW9jaw==" : null };
        },
        recordVideo(recordOptions = {}) {
          if (recording) {
            return Promise.reject(
              new CameraError("capture-failed", "Already recording."),
            );
          }
          return new Promise<RecordedVideo>((resolve, reject) => {
            recording = {
              options: recordOptions,
              finish: (result) => {
                recording = null;
                if (result instanceof CameraError) reject(result);
                else resolve(result);
              },
            };
          });
        },
        stopRecording() {
          recording?.finish(MOCK_VIDEO);
        },
      }),
      [],
    );

    return (
      <View testID="mock-camera-preview" style={style}>
        {children}
      </View>
    );
  }

  return {
    isSupported: () => options.supported ?? true,
    supportsVideo: () => options.supportsVideo ?? true,
    async getPermission(kind) {
      return permissions[kind];
    },
    async requestPermission(kind) {
      requests[kind]++;
      if (permissions[kind].canAskAgain) {
        permissions[kind] = { status: requestResult, canAskAgain: false };
      }
      return permissions[kind];
    },
    Preview: MockCameraPreview,

    setPermission(kind, status, extra = {}) {
      permissions[kind] = mockPermission(status, extra.canAskAgain);
    },
    setPicture(next) {
      picture = next;
    },
    scan({ data, type = "qr", rawType, bounds = null }) {
      const props = mounted;
      if (!props?.onBarcodeScanned || !props.barcodeTypes?.includes(type)) {
        return;
      }
      props.onBarcodeScanned({ type, rawType: rawType ?? type, data, bounds });
    },
    finishRecording(result = MOCK_VIDEO) {
      recording?.finish(result);
    },
    failMount(error = "unavailable") {
      mounted?.onError?.(
        typeof error === "string" ? new CameraError(error) : error,
      );
    },
    get preview() {
      return mounted;
    },
    get recording() {
      return recording?.options ?? null;
    },
    requestCount: (kind) => requests[kind],
  };
}
