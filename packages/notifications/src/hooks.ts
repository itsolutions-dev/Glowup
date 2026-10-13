import { Linking } from "react-native";

import { useNotificationsContext } from "./context";
import type {
  PermissionRequestOptions,
  PermissionState,
  PushToken,
  PushTokenStatus,
} from "./types";

export interface UseNotificationPermission extends PermissionState {
  /**
   * Shows the OS prompt (on Android, after the provider's channels exist).
   * Once `canAskAgain` is false the OS ignores this: call `openSettings()`.
   */
  request: (options?: PermissionRequestOptions) => Promise<PermissionState>;
  /** Re-reads the status. The provider already does this when the app returns to the foreground. */
  refresh: () => Promise<PermissionState>;
  /** Opens this app's page in the system settings. */
  openSettings: () => Promise<void>;
}

export function useNotificationPermission(): UseNotificationPermission {
  const { permission, requestPermission, refreshPermission } =
    useNotificationsContext("useNotificationPermission");
  return {
    ...permission,
    request: requestPermission,
    refresh: refreshPermission,
    openSettings: () => Linking.openSettings(),
  };
}

export interface UsePushToken {
  /** Null until the permission allows push and the OS hands out a token. */
  token: PushToken | null;
  status: PushTokenStatus;
  /** Set when `status` is `"error"` (an iOS simulator, a missing projectId, no network). */
  error: unknown;
  refresh: () => Promise<PushToken | null>;
}

export function usePushToken(): UsePushToken {
  const { token, tokenStatus, tokenError, refreshToken } =
    useNotificationsContext("usePushToken");
  return {
    token,
    status: tokenStatus,
    error: tokenError,
    refresh: refreshToken,
  };
}
