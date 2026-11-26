import type * as Notifications from "expo-notifications";

/**
 * An `expo-notifications` `Notification` built by hand, for web pushes and the
 * `/testing` mock. Type-only import: `/testing` replaces expo-notifications.
 */
export function toNotification(fields: {
  id: string;
  date: number;
  title?: string | null;
  body?: string | null;
  data?: Record<string, unknown>;
  categoryId?: string | null;
  trigger: unknown;
}): Notifications.Notification {
  return {
    date: fields.date,
    request: {
      identifier: fields.id,
      content: {
        title: fields.title ?? null,
        subtitle: null,
        body: fields.body ?? null,
        data: fields.data ?? {},
        categoryIdentifier: fields.categoryId ?? null,
        sound: null,
      },
      trigger: fields.trigger,
    },
  } as unknown as Notifications.Notification;
}
