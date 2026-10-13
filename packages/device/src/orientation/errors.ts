/**
 * - `unsupported`: this platform cannot lock here (a desktop browser, a
 *   mobile browser outside fullscreen, Safari).
 * - `failed`: the platform refused this lock (an orientation the device
 *   does not have).
 */
export type OrientationErrorCode = "unsupported" | "failed";

export class OrientationError extends Error {
  readonly code: OrientationErrorCode;

  constructor(code: OrientationErrorCode, message?: string, cause?: unknown) {
    super(message ?? DEFAULT_MESSAGES[code]);
    this.name = "OrientationError";
    this.code = code;
    if (cause !== undefined) (this as { cause?: unknown }).cause = cause;
  }
}

const DEFAULT_MESSAGES: Record<OrientationErrorCode, string> = {
  unsupported: "The screen orientation cannot be locked here.",
  failed: "The screen orientation lock was refused.",
};

/** Works across module copies, where `instanceof` would not. */
export function isOrientationError(error: unknown): error is OrientationError {
  return (
    error instanceof Error &&
    error.name === "OrientationError" &&
    typeof (error as OrientationError).code === "string"
  );
}

export function toOrientationError(error: unknown): OrientationError {
  if (isOrientationError(error)) return error;
  return new OrientationError(
    "failed",
    error instanceof Error ? error.message : undefined,
    error,
  );
}
