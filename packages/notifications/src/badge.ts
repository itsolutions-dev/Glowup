import * as Notifications from "expo-notifications";

import { assertSupported } from "./support";

export async function getBadgeCount(): Promise<number> {
  assertSupported("getBadgeCount");
  return Notifications.getBadgeCountAsync();
}

/**
 * Sets the app icon badge. Resolves to `false` where the launcher does not
 * support badges (many Android launchers).
 */
export async function setBadgeCount(count: number): Promise<boolean> {
  assertSupported("setBadgeCount");
  return Notifications.setBadgeCountAsync(Math.max(0, Math.floor(count)));
}

export async function clearBadge(): Promise<boolean> {
  return setBadgeCount(0);
}
