import { CodedError, isCodedError } from "../core/shared";

/**
 * - `unsupported`: this platform cannot lock here (a desktop browser, a
 *   mobile browser outside fullscreen, Safari).
 * - `failed`: the platform refused this lock (an orientation the device
 *   does not have).
 */
export type OrientationErrorCode = "unsupported" | "failed";

export class OrientationError extends CodedError<OrientationErrorCode> {
  constructor(code: OrientationErrorCode, message?: string, cause?: unknown) {
    super("OrientationError", code, message ?? DEFAULT_MESSAGES[code], cause);
  }
}

const DEFAULT_MESSAGES: Record<OrientationErrorCode, string> = {
  unsupported: "The screen orientation cannot be locked here.",
  failed: "The screen orientation lock was refused.",
};

/** Works across module copies, where `instanceof` would not. */
export function isOrientationError(error: unknown): error is OrientationError {
  return isCodedError(error, "OrientationError");
}

export function toOrientationError(error: unknown): OrientationError {
  if (isOrientationError(error)) return error;
  return new OrientationError(
    "failed",
    error instanceof Error ? error.message : undefined,
    error,
  );
}
