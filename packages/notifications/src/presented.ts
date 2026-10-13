import * as Notifications from "expo-notifications";

import { parseNotification } from "./payload";
import { assertSupported } from "./support";
import type { AppNotification, DataParser, NotificationData } from "./types";

/**
 * The notifications currently shown in Notification Center / the shade. With a
 * parser, the ones it rejects are left out.
 */
export async function getPresentedNotifications<TData = NotificationData>(
  parseData?: DataParser<TData>,
): Promise<AppNotification<TData>[]> {
  assertSupported("getPresentedNotifications");
  const raw = await Notifications.getPresentedNotificationsAsync();
  return raw.flatMap((notification) => {
    const parsed = parseNotification(notification, parseData);
    return parsed.ok ? [parsed.value] : [];
  });
}

export async function dismissNotification(id: string): Promise<void> {
  assertSupported("dismissNotification");
  await Notifications.dismissNotificationAsync(id);
}

export async function dismissAllNotifications(): Promise<void> {
  assertSupported("dismissAllNotifications");
  await Notifications.dismissAllNotificationsAsync();
}

/**
 * Dismisses the presented notifications that match, and resolves to how many.
 * The usual case: the user opened a chat, so its notifications are stale.
 *
 *   dismissNotificationsWhere((n) => n.data.chatId === chatId, parseChat)
 */
export async function dismissNotificationsWhere<TData = NotificationData>(
  predicate: (notification: AppNotification<TData>) => boolean,
  parseData?: DataParser<TData>,
): Promise<number> {
  const matches = (await getPresentedNotifications(parseData)).filter(
    predicate,
  );
  await Promise.all(
    matches.map((notification) => dismissNotification(notification.id)),
  );
  return matches.length;
}
