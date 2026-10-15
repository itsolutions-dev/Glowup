import {
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  type ReactNode,
  type Ref,
} from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";

import { useClientValue } from "../core/shared";
import { useCameraAdapter } from "./adapter";
import { CameraError, toCameraError } from "./errors";
import type {
  BarcodeType,
  CameraFacing,
  CameraFlash,
  CameraHandle,
  CameraMode,
  ScannedBarcode,
  VideoQuality,
} from "./types";

export interface CameraViewProps {
  /** Default `"back"`. */
  facing?: CameraFacing;
  /** Default `"off"`. */
  flash?: CameraFlash;
  /** Keeps the flash light on. Default false. */
  torch?: boolean;
  /** 0 (none) to 1 (the device's maximum). Default 0. */
  zoom?: number;
  /** `"video"` to record. Default `"picture"`. */
  mode?: CameraMode;
  /** Records without sound (no microphone needed). Default false. */
  mute?: boolean;
  /** Default `"720p"`. */
  videoQuality?: VideoQuality;
  /** False pauses the preview without unmounting it. Default true. */
  active?: boolean;
  /** Scanning is on while this is set. */
  onBarcodeScanned?: (barcode: ScannedBarcode) => void;
  /** What to scan for. Default `["qr"]`: each extra symbology costs time and false reads. */
  barcodeTypes?: readonly BarcodeType[];
  /**
   * Milliseconds during which the same code (type and data) is reported once:
   * scanners fire on every frame the code stays in view. Default 1000; 0
   * reports every frame.
   */
  scanInterval?: number;
  /** The preview is running: captures work from now on. */
  onReady?: () => void;
  onError?: (error: CameraError) => void;
  style?: StyleProp<ViewStyle>;
  /** Drawn over the preview (a viewfinder, controls). */
  children?: ReactNode;
  ref?: Ref<CameraHandle>;
}

const DEFAULT_BARCODE_TYPES: readonly BarcodeType[] = ["qr"];
const DEFAULT_MAX_DURATION = 60;

/**
 * The camera preview, with no controls of its own. Capture through its ref:
 *
 *   const camera = useRef<CameraHandle>(null);
 *   <CameraView ref={camera} onReady={() => setReady(true)} />
 *   const picture = await camera.current?.takePicture();
 *
 * It does not ask for the permission: gate it on `useCameraPermission()`,
 * whose `status` is also where an unsupported platform shows
 * (`"unsupported"`); there the view renders only its `style` and children.
 */
export function CameraView({
  facing = "back",
  flash = "off",
  torch = false,
  zoom = 0,
  mode = "picture",
  mute = false,
  videoQuality = "720p",
  active = true,
  onBarcodeScanned,
  barcodeTypes = DEFAULT_BARCODE_TYPES,
  scanInterval = 1000,
  onReady,
  onError,
  style,
  children,
  ref,
}: CameraViewProps) {
  const adapter = useCameraAdapter();
  // The static web export prerenders in Node, where there is no camera: the
  // page hydrates without one, then mounts the preview.
  const supported = useClientValue(() => adapter.isSupported(), false);
  const preview = useRef<CameraHandle>(null);
  const lastScan = useRef<{ key: string; at: number } | null>(null);

  // An inline `barcodeTypes={["qr", "ean13"]}` is a new array every render;
  // the scanner should be reconfigured only when the list changes.
  const typesKey = barcodeTypes.join(",");
  const types = useMemo(
    () => (typesKey ? (typesKey.split(",") as BarcodeType[]) : []),
    [typesKey],
  );

  const handleScanned = useCallback(
    (barcode: ScannedBarcode) => {
      const key = `${barcode.rawType}:${barcode.data}`;
      const now = Date.now();
      const last = lastScan.current;
      if (last && last.key === key && now - last.at < scanInterval) return;
      lastScan.current = { key, at: now };
      onBarcodeScanned?.(barcode);
    },
    [onBarcodeScanned, scanInterval],
  );

  useImperativeHandle(
    ref,
    (): CameraHandle => ({
      async takePicture(options) {
        const handle = preview.current;
        if (!handle) {
          throw new CameraError(supported ? "not-ready" : "unsupported");
        }
        try {
          return await handle.takePicture(options);
        } catch (error) {
          throw toCameraError(error, "capture-failed");
        }
      },
      async recordVideo({
        maxDuration = DEFAULT_MAX_DURATION,
        maxFileSize,
      } = {}) {
        if (!adapter.supportsVideo()) throw new CameraError("unsupported");
        if (mode !== "video") throw new CameraError("invalid-mode");
        const handle = preview.current;
        if (!handle) throw new CameraError("not-ready");
        try {
          return await handle.recordVideo({ maxDuration, maxFileSize });
        } catch (error) {
          throw toCameraError(error, "capture-failed");
        }
      },
      stopRecording() {
        preview.current?.stopRecording();
      },
    }),
    [adapter, mode, supported],
  );

  if (!supported) return <View style={style}>{children}</View>;

  const { Preview } = adapter;
  return (
    <Preview
      ref={preview}
      facing={facing}
      flash={flash}
      torch={torch}
      zoom={zoom}
      mode={mode}
      mute={mute}
      videoQuality={videoQuality}
      active={active}
      barcodeTypes={onBarcodeScanned && types.length > 0 ? types : null}
      onBarcodeScanned={onBarcodeScanned ? handleScanned : undefined}
      onReady={onReady}
      onError={onError}
      style={style}
    >
      {children}
    </Preview>
  );
}
