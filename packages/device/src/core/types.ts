/**
 * Where a capability's permission stands. Every capability reports the same
 * shape, so an app can render one permission prompt for all of them.
 *
 * - `undetermined`: never asked; a request shows the OS prompt.
 * - `granted`: allowed.
 * - `denied`: refused. `canAskAgain: false` means only the system settings
 *   can change it.
 * - `unsupported`: the platform has no such hardware or API (for example a
 *   browser without `navigator.geolocation`). Nothing will ever be prompted.
 */
export type PermissionStatus =
  "undetermined" | "granted" | "denied" | "unsupported";

export interface PermissionState {
  status: PermissionStatus;
  /** Whether a request can still show the OS prompt. */
  canAskAgain: boolean;
}

/** Returned by every subscription the package opens: call it to stop listening. */
export type Unsubscribe = () => void;
