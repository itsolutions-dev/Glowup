import type { PermissionState, PermissionStatus } from "../core/types";
import type { MediaLibraryAdapter, SaveResult } from "../media-library/types";

export interface MockMediaLibraryOptions {
  /** Default true. */
  supported?: boolean;
  /**
   * Whether saving needs the permission, as on iOS and Android before 11.
   * Default true.
   */
  gated?: boolean;
  /** The permission. Default `"undetermined"`. */
  permission?: PermissionStatus;
  /** What a request answers. Default `"granted"`. */
  requestAnswer?: "granted" | "denied";
}

export interface MockMediaLibraryAdapter extends MediaLibraryAdapter {
  /** Every URI saved, in order. */
  readonly saved: readonly string[];
  /** How many times the permission was requested. */
  readonly permissionRequests: number;
  /** Changes the permission as the system settings would (read on the next refresh). */
  setPermission(status: PermissionStatus): void;
  /** Makes the next save fail, as a missing file would. */
  failNext(detail?: string): void;
}

const toState = (status: PermissionStatus): PermissionState => ({
  status,
  canAskAgain: status === "undetermined",
});

/**
 * An in-memory `MediaLibraryAdapter`. Inject it with
 * `<DeviceAdaptersProvider adapters={{ mediaLibrary }}>`. A saved item's
 * `assetId` is `mock-asset-<n>`.
 */
export function createMockMediaLibraryAdapter({
  supported = true,
  gated = true,
  permission = "undetermined",
  requestAnswer = "granted",
}: MockMediaLibraryOptions = {}): MockMediaLibraryAdapter {
  let current = permission;
  let requests = 0;
  let failure: string | null = null;
  const saved: string[] = [];

  return {
    saved,
    get permissionRequests() {
      return requests;
    },
    setPermission(status) {
      current = status;
    },
    failNext(detail = "Failed to save the asset") {
      failure = detail;
    },
    isSupported: () => supported,
    requiresPermission: () => gated,
    getPermission: async () => toState(current),
    async requestPermission() {
      requests++;
      if (current === "undetermined") current = requestAnswer;
      return toState(current);
    },
    async save(uri): Promise<SaveResult> {
      if (failure !== null) {
        const detail = failure;
        failure = null;
        return { status: "failed", detail };
      }
      saved.push(uri);
      return { status: "saved", assetId: `mock-asset-${saved.length}` };
    },
  };
}
