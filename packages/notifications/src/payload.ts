import * as Notifications from "expo-notifications";

import type {
  AppNotification,
  AppNotificationResponse,
  DataParser,
  NotificationData,
} from "./types";

export type ParseResult<T> =
  { ok: true; value: T } | { ok: false; error?: unknown };

/**
 * Maps an `expo-notifications` notification to an `AppNotification`, running
 * the parser over its `data`. Without a parser `data` passes through as-is.
 */
export function parseNotification<TData = NotificationData>(
  raw: Notifications.Notification,
  parseData?: DataParser<TData>,
): ParseResult<AppNotification<TData>> {
  const { content, identifier } = raw.request;
  let data: TData;
  if (parseData) {
    try {
      const parsed = parseData(content.data);
      if (parsed === null) return { ok: false };
      data = parsed;
    } catch (error) {
      return { ok: false, error };
    }
  } else {
    data = (content.data ?? {}) as TData;
  }
  return {
    ok: true,
    value: {
      id: identifier,
      title: content.title,
      body: content.body,
      data,
      date: raw.date,
      raw,
    },
  };
}

export function parseResponse<TData = NotificationData>(
  raw: Notifications.NotificationResponse,
  parseData?: DataParser<TData>,
): ParseResult<AppNotificationResponse<TData>> {
  const notification = parseNotification(raw.notification, parseData);
  if (!notification.ok) return notification;
  return {
    ok: true,
    value: {
      notification: notification.value,
      actionIdentifier: raw.actionIdentifier,
      isDefaultAction:
        raw.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER,
      ...(raw.userText !== undefined && { userText: raw.userText }),
    },
  };
}
