import type { ComponentType, ReactNode, Ref } from "react";
import type { StyleProp, ViewStyle } from "react-native";

import type { PermissionState } from "../core/types";
import type { CameraError } from "./errors";

export type CameraFacing = "back" | "front";
export type CameraFlash = "off" | "on" | "auto";
/** `picture` for photos and scanning; `video` to record. */
export type CameraMode = "picture" | "video";
export type VideoQuality = "480p" | "720p" | "1080p" | "2160p";
export type CameraPermissionKind = "camera" | "microphone";

export type BarcodeType =
  | "aztec"
  | "codabar"
  | "code39"
  | "code93"
  | "code128"
  | "datamatrix"
  | "ean8"
  | "ean13"
  | "itf14"
  | "pdf417"
  | "qr"
  | "upc_a"
  | "upc_e";

export interface ScannedBarcode {
  /** `"unknown"` for a symbology outside `BarcodeType`; see `rawType`. */
  type: BarcodeType | "unknown";
  /** The type as the platform reported it. */
  rawType: string;
  data: string;
  /** Where it is in the preview, in preview points. Not every platform reports it. */
  bounds: { x: number; y: number; width: number; height: number } | null;
}

export interface CapturedPicture {
  /** A file in the app's cache directory (a data URI on web). Move it to keep it. */
  uri: string;
  width: number;
  height: number;
  /** Only with `base64: true`. */
  base64: string | null;
}

export interface RecordedVideo {
  /** A file in the app's cache directory. Move it to keep it. */
  uri: string;
}

export interface PictureOptions {
  /** JPEG quality, 0 to 1. Default: the platform's (1). */
  quality?: number;
  /**
   * Also return the picture as base64. Off by default: a photo is several MB
   * of string in JS memory. Prefer the `uri`.
   */
  base64?: boolean;
}

export interface RecordOptions {
  /** Seconds. Default 60. */
  maxDuration?: number;
  /** Bytes. Default: no limit. */
  maxFileSize?: number;
}

/** What `<CameraView ref={…}>` exposes. */
export interface CameraHandle {
  takePicture(options?: PictureOptions): Promise<CapturedPicture>;
  /**
   * Starts recording; resolves with the video once `stopRecording()` is
   * called or a limit is reached. Needs `mode="video"`.
   */
  recordVideo(options?: RecordOptions): Promise<RecordedVideo>;
  stopRecording(): void;
}

/** What `CameraView` hands the adapter's preview, every default applied. */
export interface CameraPreviewProps {
  facing: CameraFacing;
  flash: CameraFlash;
  /** Keeps the flash light on. */
  torch: boolean;
  /** 0 (none) to 1 (the device's maximum). */
  zoom: number;
  mode: CameraMode;
  /** Records video without sound. */
  mute: boolean;
  videoQuality: VideoQuality;
  /** False pauses the preview (and the battery drain) without unmounting. */
  active: boolean;
  /** `null` turns scanning off. */
  barcodeTypes: readonly BarcodeType[] | null;
  onBarcodeScanned?: (barcode: ScannedBarcode) => void;
  onReady?: () => void;
  onError?: (error: CameraError) => void;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
  ref?: Ref<CameraHandle>;
}

/**
 * The contract between `CameraView` / `useCameraPermission` and whatever
 * drives the camera. The preview is a component because the camera's output
 * is a native view; the handle it exposes through `ref` must reject with
 * `CameraError`s.
 */
export interface CameraAdapter {
  /** Whether this platform has a camera API at all. */
  isSupported(): boolean;
  /** Whether `recordVideo` can work here (not on web). */
  supportsVideo(): boolean;
  getPermission(kind: CameraPermissionKind): Promise<PermissionState>;
  requestPermission(kind: CameraPermissionKind): Promise<PermissionState>;
  Preview: ComponentType<CameraPreviewProps>;
}
