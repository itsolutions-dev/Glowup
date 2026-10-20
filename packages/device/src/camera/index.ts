/**
 * `@its/glowup-device/camera` — a headless camera: the preview, photos,
 * video (native only) and barcode / QR scanning. Needs `expo-camera`.
 */
export { CameraView, type CameraViewProps } from "./CameraView";
export {
  useCameraPermission,
  type UseCameraPermission,
  type UseCameraPermissionOptions,
} from "./permissions";
export { CameraError, isCameraError, type CameraErrorCode } from "./errors";
export { expoCameraAdapter } from "./expo";
export type { BarcodeScan } from "../core/barcodes";
export type {
  BarcodeType,
  CameraAdapter,
  CameraFacing,
  CameraFlash,
  CameraHandle,
  CameraMode,
  CameraPermissionKind,
  CameraPreviewProps,
  CapturedPicture,
  PictureOptions,
  RecordedVideo,
  RecordOptions,
  ScannedBarcode,
  VideoQuality,
} from "./types";
