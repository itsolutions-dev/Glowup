import { CodedError, isCodedError } from "../core/shared";
import type { ProtectedErrorStatus } from "./types";

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

export class SecureStoreError extends CodedError<SecureStoreErrorCode> {
  constructor(code: SecureStoreErrorCode, message?: string, cause?: unknown) {
    super("SecureStoreError", code, message ?? DEFAULT_MESSAGES[code], cause);
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
  return isCodedError(error, "SecureStoreError");
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

/**
 * A prompt's outcome, thrown by an adapter's protected calls and resolved
 * by the hooks as `{ status }`. Adapters normalise the platform's errors
 * into it.
 */
export class ProtectedAccessError extends Error {
  readonly status: ProtectedErrorStatus;

  constructor(status: ProtectedErrorStatus, message?: string) {
    super(message ?? status);
    this.name = "ProtectedAccessError";
    this.status = status;
  }
}

export function isProtectedAccessError(
  error: unknown,
): error is ProtectedAccessError {
  return (
    error instanceof Error &&
    error.name === "ProtectedAccessError" &&
    typeof (error as ProtectedAccessError).status === "string"
  );
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
