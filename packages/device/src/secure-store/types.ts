/**
 * Where an item lives and, on iOS, when it can be read. Reads need only
 * `service`; `accessible` and `thisDeviceOnly` apply when writing.
 */
export interface SecureStoreOptions {
  /**
   * A namespace: an item written under a service is read under the same
   * one. Use one per kind of secret.
   */
  service?: string;
  /**
   * iOS: when the item can be read. `when-unlocked` (default) only while the
   * device is unlocked; `after-first-unlock` also while it is locked after
   * the first unlock since boot, for background tasks and notification
   * handlers. A read the setting forbids fails with `locked`.
   */
  accessible?: "when-unlocked" | "after-first-unlock";
  /**
   * iOS: keep the item out of backups, so it never moves to another device.
   * Default true (expo's default is false); Android's store is already left
   * out of backups by the config plugin.
   */
  thisDeviceOnly?: boolean;
}

/**
 * Why a protected item could not be read or written.
 *
 * - `missing` (reads): there is no such item.
 * - `invalidated` (reads): there was one, and the platform destroyed it when
 *   the enrolled biometrics changed (a finger or a face added or removed).
 *   Ask the user to sign in again and write it anew.
 * - `cancelled`: the user or the system dismissed the prompt.
 * - `lockout`: too many failed attempts (Android; iOS reports `failed`).
 * - `unavailable`: no biometrics to protect it with (no sensor, nothing
 *   enrolled, or on iOS no Face ID purpose string). There is no passcode
 *   fallback for protected items.
 * - `locked`: iOS refused while the device is locked.
 * - `busy`: another system prompt is open; this one never started.
 * - `unsupported`: no secure storage on this platform (web).
 * - `failed`: anything else, with the platform's message in `detail`.
 */
export type ProtectedErrorStatus =
  | "cancelled"
  | "lockout"
  | "unavailable"
  | "locked"
  | "busy"
  | "unsupported"
  | "failed";

export type ProtectedReadResult =
  | { status: "ok"; value: string }
  | { status: "missing" | "invalidated" }
  | { status: ProtectedErrorStatus; detail?: string };

export type ProtectedWriteResult =
  { status: "ok" } | { status: ProtectedErrorStatus; detail?: string };

export interface ProtectedOptions {
  /**
   * The prompt's text. Required: expo-secure-store shows a blank title on
   * Android without one.
   */
  prompt: string;
  /**
   * A namespace, as for plain items. Each protected item lives under a
   * service of its own derived from this one and its key: on Android,
   * writing an item again after it was invalidated deletes every protected
   * item sharing its service.
   */
  service?: string;
}

/** What an adapter's protected calls receive: the derived service. */
export interface AdapterProtectedOptions {
  service: string;
  prompt: string;
}

/** The platform's keychain (iOS) or keystore-backed storage (Android). */
export interface SecureStoreAdapter {
  isSupported(): boolean;
  /** `null` when there is no such item. */
  getItem(key: string, options: SecureStoreOptions): Promise<string | null>;
  setItem(
    key: string,
    value: string,
    options: SecureStoreOptions,
  ): Promise<void>;
  /** Succeeds when there is no such item. Removes a protected one too. */
  deleteItem(key: string, options: SecureStoreOptions): Promise<void>;
  /**
   * Reads an item that only the enrolled biometrics open, showing the
   * prompt; `null` when there is none (or it was invalidated). A prompt's
   * outcome rejects with a `ProtectedAccessError`.
   */
  getProtectedItem(
    key: string,
    options: AdapterProtectedOptions,
  ): Promise<string | null>;
  /** Writes one; Android prompts for it, iOS does not. */
  setProtectedItem(
    key: string,
    value: string,
    options: AdapterProtectedOptions,
  ): Promise<void>;
}
