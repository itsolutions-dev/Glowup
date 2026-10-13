import * as Notifications from "expo-notifications";

import type { PermissionState } from "./types";

export function toPermissionState(
  raw: Notifications.NotificationPermissionsStatus,
): PermissionState {
  const ios = raw.ios?.status;
  if (ios === Notifications.IosAuthorizationStatus.PROVISIONAL) {
    return { status: "provisional", canAskAgain: true };
  }
  if (raw.granted || ios === Notifications.IosAuthorizationStatus.EPHEMERAL) {
    return { status: "granted", canAskAgain: false };
  }
  return {
    status: raw.status === "denied" ? "denied" : "undetermined",
    canAskAgain: raw.canAskAgain,
  };
}

export const UNSUPPORTED: PermissionState = {
  status: "unsupported",
  canAskAgain: false,
};

export const UNKNOWN: PermissionState = {
  status: "undetermined",
  canAskAgain: true,
};

/** Statuses under which the OS hands out a push token. */
export function allowsPush(state: PermissionState): boolean {
  return state.status === "granted" || state.status === "provisional";
}
