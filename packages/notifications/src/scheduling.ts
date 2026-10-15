import * as Notifications from "expo-notifications";

import { parsePayload } from "./payload";
import { assertSupported } from "./support";
import type {
  DataParser,
  LocalNotificationContent,
  LocalNotificationTrigger,
  NotificationData,
  ScheduledNotification,
} from "./types";

function toTriggerInput(
  trigger: LocalNotificationTrigger | undefined,
  channelId: string | undefined,
): Notifications.NotificationTriggerInput {
  const channel = channelId ? { channelId } : {};
  const { SchedulableTriggerInputTypes: Types } = Notifications;
  if (!trigger) return channelId ? { channelId } : null;
  switch (trigger.type) {
    case "date":
      return { type: Types.DATE, date: trigger.date, ...channel };
    case "interval":
      return {
        type: Types.TIME_INTERVAL,
        seconds: trigger.seconds,
        repeats: trigger.repeats ?? false,
        ...channel,
      };
    case "daily":
      return {
        type: Types.DAILY,
        hour: trigger.hour,
        minute: trigger.minute,
        ...channel,
      };
    case "weekly":
      return {
        type: Types.WEEKLY,
        weekday: trigger.weekday,
        hour: trigger.hour,
        minute: trigger.minute,
        ...channel,
      };
  }
}

/**
 * Schedules a local notification and resolves to its id. Without a trigger it
 * is delivered immediately. Pass `options.id` to replace a pending one with the
 * same id instead of adding a second.
 */
export async function scheduleNotification<TData = NotificationData>(
  content: LocalNotificationContent<TData>,
  trigger?: LocalNotificationTrigger,
  options: { id?: string } = {},
): Promise<string> {
  assertSupported("scheduleNotification");
  const { categoryId, channelId, data, sound, ...rest } = content;
  return Notifications.scheduleNotificationAsync({
    ...(options.id !== undefined && { identifier: options.id }),
    content: {
      ...rest,
      ...(data !== undefined && { data: data as Record<string, unknown> }),
      ...(sound !== undefined && { sound }),
      ...(categoryId !== undefined && { categoryIdentifier: categoryId }),
    },
    trigger: toTriggerInput(trigger, channelId),
  });
}

export async function cancelScheduledNotification(id: string): Promise<void> {
  assertSupported("cancelScheduledNotification");
  await Notifications.cancelScheduledNotificationAsync(id);
}

export async function cancelAllScheduledNotifications(): Promise<void> {
  assertSupported("cancelAllScheduledNotifications");
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * The notifications still waiting to fire. With a parser, entries it rejects
 * are left out.
 */
export async function getScheduledNotifications<TData = NotificationData>(
  parseData?: DataParser<TData>,
): Promise<ScheduledNotification<TData>[]> {
  assertSupported("getScheduledNotifications");
  const requests = await Notifications.getAllScheduledNotificationsAsync();
  const result: ScheduledNotification<TData>[] = [];
  for (const request of requests) {
    const data = parsePayload(request.content.data, parseData);
    if (!data.ok) continue;
    result.push({
      id: request.identifier,
      title: request.content.title,
      body: request.content.body,
      data: data.value,
      trigger: request.trigger,
    });
  }
  return result;
}
