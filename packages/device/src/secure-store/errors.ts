/**
 * - `invalid-key`: keys must be non-empty and contain only letters, digits,
 *   `.`, `-` and `_`.
 * - `invalid-value`: values must be strings (or, through the JSON helpers,
 *   serialisable).
 * - `locked`: iOS refused while the device is locked; write the item with
 *   `accessible: "after-first-unlock"` to read it then.
 * - `unsupported`: the platform has no secure storage (web).
 * - `failed`: the platform's storage failed.
 */
export type SecureStoreErrorCode =
  "invalid-key" | "invalid-value" | "locked" | "unsupported" | "failed";

export class SecureStoreError extends Error {
  readonly code: SecureStoreErrorCode;

  constructor(code: SecureStoreErrorCode, message?: string, cause?: unknown) {
    super(message ?? DEFAULT_MESSAGES[code]);
    this.name = "SecureStoreError";
    this.code = code;
    if (cause !== undefined) (this as { cause?: unknown }).cause = cause;
  }
}

const DEFAULT_MESSAGES: Record<SecureStoreErrorCode, string> = {
  "invalid-key":
    'Secure store keys must be non-empty and contain only letters, digits, ".", "-" and "_".',
  "invalid-value": "Secure store values must be strings.",
  locked: "The item cannot be read while the device is locked.",
  unsupported: "There is no secure storage on this platform.",
  failed: "The secure store failed.",
};

/** Works across module copies, where `instanceof` would not. */
export function isSecureStoreError(error: unknown): error is SecureStoreError {
  return (
    error instanceof Error &&
    error.name === "SecureStoreError" &&
    typeof (error as SecureStoreError).code === "string"
  );
}

export function toSecureStoreError(error: unknown): SecureStoreError {
  if (isSecureStoreError(error)) return error;
  const message = error instanceof Error ? error.message : String(error);
  // iOS's errSecInteractionNotAllowed (-25308), by expo's message.
  const code = /interaction is not allowed/i.test(message)
    ? "locked"
    : "failed";
  return new SecureStoreError(code, message, error);
}

const KEY = /^[\w.-]+$/;

export function assertValidKey(key: unknown): asserts key is string {
  if (typeof key !== "string" || !KEY.test(key)) {
    throw new SecureStoreError("invalid-key");
  }
}

export function assertValidValue(value: unknown): asserts value is string {
  if (typeof value !== "string") {
    throw new SecureStoreError("invalid-value");
  }
}
