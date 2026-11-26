import { CodedError, isCodedError } from "../core/shared";

/**
 * - `permission-denied`: the camera (or, for video with sound, the microphone)
 *   is not granted.
 * - `unavailable`: the camera could not start (no camera, a simulator, in use
 *   by another app).
 * - `not-ready`: captured before the preview was ready (wait for `onReady`).
 * - `invalid-mode`: `recordVideo()` on a view not in `mode="video"`.
 * - `capture-failed`: the picture or video could not be produced.
 * - `unsupported`: this platform cannot do it (video recording on web).
 */
export type CameraErrorCode =
  | "permission-denied"
  | "unavailable"
  | "not-ready"
  | "invalid-mode"
  | "capture-failed"
  | "unsupported";

export class CameraError extends CodedError<CameraErrorCode> {
  constructor(code: CameraErrorCode, message?: string, cause?: unknown) {
    super("CameraError", code, message ?? DEFAULT_MESSAGES[code], cause);
  }
}

const DEFAULT_MESSAGES: Record<CameraErrorCode, string> = {
  "permission-denied": "Camera permission is not granted.",
  unavailable: "The camera is unavailable.",
  "not-ready": "The camera is not ready yet.",
  "invalid-mode": 'Recording needs the camera in mode="video".',
  "capture-failed": "The capture failed.",
  unsupported: "This is not supported on this platform.",
};

/** Works across module copies, where `instanceof` would not. */
export function isCameraError(error: unknown): error is CameraError {
  return isCodedError(error, "CameraError");
}

/**
 * Expo's coded errors (`ERR_CAMERA_NOT_READY`, …) by their words; anything
 * else becomes `fallback`.
 */
export function toCameraError(
  error: unknown,
  fallback: CameraErrorCode,
): CameraError {
  if (isCameraError(error)) return error;
  const code = String((error as { code?: unknown })?.code ?? "");
  const message = error instanceof Error ? error.message : undefined;
  if (/NOT_READY/.test(code))
    return new CameraError("not-ready", message, error);
  if (/PERMISSION|UNAUTHORIZED|DENIED/.test(code)) {
    return new CameraError("permission-denied", message, error);
  }
  if (/UNAVAILABLE/.test(code)) {
    return new CameraError("unavailable", message, error);
  }
  return new CameraError(fallback, message, error);
}
