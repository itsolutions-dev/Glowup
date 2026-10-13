import { createContext, useContext } from "react";

import type {
  PermissionRequestOptions,
  PermissionState,
  PushToken,
  PushTokenStatus,
} from "./types";

export interface NotificationsContextValue {
  permission: PermissionState;
  requestPermission: (
    options?: PermissionRequestOptions,
  ) => Promise<PermissionState>;
  refreshPermission: () => Promise<PermissionState>;
  token: PushToken | null;
  tokenStatus: PushTokenStatus;
  tokenError: unknown;
  refreshToken: () => Promise<PushToken | null>;
}

export const NotificationsContext =
  createContext<NotificationsContextValue | null>(null);

export function useNotificationsContext(
  hook: string,
): NotificationsContextValue {
  const value = useContext(NotificationsContext);
  if (!value) {
    throw new Error(`${hook}() must be used inside <NotificationsProvider>.`);
  }
  return value;
}
