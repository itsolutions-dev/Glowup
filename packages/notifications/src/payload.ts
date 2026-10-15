import * as Notifications from "expo-notifications";

import type {
  AppNotification,
  AppNotificationResponse,
  DataParser,
  NotificationData,
} from "./types";

type ParseResult<T> = { ok: true; value: T } | { ok: false; error?: unknown };

/**
 * Runs the parser over a notification's `data`: `null` or a throw rejects it.
 * Without a parser `data` passes through as-is.
 */
export function parsePayload<TData>(
  data: unknown,
  parseData?: DataParser<TData>,
): ParseResult<TData> {
  if (!parseData) return { ok: true, value: (data ?? {}) as TData };
  try {
    const parsed = parseData(data);
    return parsed === null ? { ok: false } : { ok: true, value: parsed };
  } catch (error) {
    return { ok: false, error };
  }
}

/** Maps an `expo-notifications` notification to an `AppNotification`. */
export function parseNotification<TData = NotificationData>(
  raw: Notifications.Notification,
  parseData?: DataParser<TData>,
): ParseResult<AppNotification<TData>> {
  const { content, identifier } = raw.request;
  const data = parsePayload(content.data, parseData);
  if (!data.ok) return data;
  return {
    ok: true,
    value: {
      id: identifier,
      title: content.title,
      body: content.body,
      data: data.value,
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
