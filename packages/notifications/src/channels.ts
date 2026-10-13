import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import type { AndroidChannel, AndroidChannelImportance } from "./types";

const IMPORTANCE: Record<
  AndroidChannelImportance,
  Notifications.AndroidImportance
> = {
  min: Notifications.AndroidImportance.MIN,
  low: Notifications.AndroidImportance.LOW,
  default: Notifications.AndroidImportance.DEFAULT,
  high: Notifications.AndroidImportance.HIGH,
  max: Notifications.AndroidImportance.MAX,
};

/**
 * Creates (or updates) the channels. Android 13+ shows the permission prompt
 * only once a channel exists, so the provider awaits this before any request.
 * A no-op on every other platform.
 */
export async function ensureAndroidChannels(
  channels: readonly AndroidChannel[],
): Promise<void> {
  if (Platform.OS !== "android") return;
  await Promise.all(
    channels.map(({ id, importance = "default", ...rest }) =>
      Notifications.setNotificationChannelAsync(id, {
        ...rest,
        importance: IMPORTANCE[importance],
      }),
    ),
  );
}
