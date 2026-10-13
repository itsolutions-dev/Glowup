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
  /** Succeeds when there is no such item. */
  deleteItem(key: string, options: SecureStoreOptions): Promise<void>;
}
