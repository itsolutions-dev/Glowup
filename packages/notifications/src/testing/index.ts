/**
 * `@its/glowup-notifications/testing` — an in-memory stand-in for
 * `expo-notifications`, for apps that test code built on this package.
 *
 *   jest.mock("expo-notifications", () =>
 *     require("@its/glowup-notifications/testing").notificationsMock.module,
 *   );
 *   import { notificationsMock } from "@its/glowup-notifications/testing";
 *
 *   beforeEach(() => notificationsMock.reset());
 *   notificationsMock.setPermission("granted");
 *   notificationsMock.deliver({ title: "Hi", data: { chatId: "1" } });
 *   notificationsMock.tap("notification-id");
 *
 * Nothing here imports `expo-notifications` at runtime (it is the module being
 * replaced), and nothing needs Jest: the module's functions are `jest.fn`s when
 * a `jest` global exists, so `toHaveBeenCalledWith` works, and plain functions
 * otherwise.
 */
import type * as Notifications from "expo-notifications";

import { resetSeenResponses } from "../responses";

type AnyFunction = (...args: any[]) => any;
type Listener = (payload: any) => void;

declare const jest: { fn: <T extends AnyFunction>(impl: T) => T } | undefined;

const mockable = <T extends AnyFunction>(impl: T): T =>
  typeof jest !== "undefined" ? jest.fn(impl) : impl;

const DEFAULT_ACTION_IDENTIFIER = "expo.modules.notifications.actions.DEFAULT";

export type MockPermission =
  "granted" | "denied" | "undetermined" | "provisional";

export interface MockNotificationInput {
  id?: string;
  title?: string | null;
  body?: string | null;
  data?: Record<string, unknown>;
  categoryId?: string | null;
  date?: number;
}

let sequence = 0;
const nextId = () => `mock-notification-${++sequence}`;

/** An `expo-notifications` `Notification`, filled with sensible defaults. */
export function buildNotification(
  input: MockNotificationInput = {},
): Notifications.Notification {
  return {
    date: input.date ?? Date.now(),
    request: {
      identifier: input.id ?? nextId(),
      content: {
        title: input.title ?? null,
        subtitle: null,
        body: input.body ?? null,
        data: input.data ?? {},
        categoryIdentifier: input.categoryId ?? null,
        sound: null,
      },
      trigger: null,
    },
  } as unknown as Notifications.Notification;
}

/** An `expo-notifications` `NotificationResponse`: a tap, or an action. */
export function buildResponse(
  notification: Notifications.Notification | MockNotificationInput = {},
  options: { actionIdentifier?: string; userText?: string } = {},
): Notifications.NotificationResponse {
  const resolved =
    "request" in notification ? notification : buildNotification(notification);
  return {
    notification: resolved,
    actionIdentifier: options.actionIdentifier ?? DEFAULT_ACTION_IDENTIFIER,
    ...(options.userText !== undefined && { userText: options.userText }),
  };
}

function permissionResponse(
  permission: MockPermission,
  canAskAgain: boolean,
): Notifications.NotificationPermissionsStatus {
  const granted = permission === "granted" || permission === "provisional";
  return {
    status: granted ? "granted" : permission,
    granted,
    canAskAgain,
    expires: "never",
    ios: {
      // IosAuthorizationStatus: 0 not determined, 1 denied, 2 authorized, 3 provisional.
      status: { undetermined: 0, denied: 1, granted: 2, provisional: 3 }[
        permission
      ],
    },
  } as unknown as Notifications.NotificationPermissionsStatus;
}

function createNotificationsMock() {
  let listeners: Record<string, Listener[]> = {};
  let handler: Notifications.NotificationHandler | null = null;
  let permission: MockPermission = "undetermined";
  let canAskAgain = true;
  let permissionOnRequest: MockPermission = "granted";
  let pushToken = "ExponentPushToken[mock]";
  let deviceToken = "mock-device-token";
  let tokenError: unknown = null;
  let launchResponse: Notifications.NotificationResponse | null = null;
  let badge = 0;
  let scheduled: Notifications.NotificationRequest[] = [];
  let presented: Notifications.Notification[] = [];
  let channels: Record<string, unknown> = {};
  let categories: Record<string, Notifications.NotificationAction[]> = {};
  let lastBehavior: Notifications.NotificationBehavior | null = null;

  const subscribe = (name: string) => (listener: Listener) => {
    (listeners[name] ??= []).push(listener);
    return {
      remove: () => {
        listeners[name] = (listeners[name] ?? []).filter((l) => l !== listener);
      },
    };
  };
  const emit = (name: string, payload: unknown) =>
    [...(listeners[name] ?? [])].forEach((listener) => listener(payload));

  const present = async (notification: Notifications.Notification) => {
    presented.push(notification);
    if (handler) lastBehavior = await handler.handleNotification(notification);
    emit("received", notification);
    return notification;
  };

  const toNotification = (
    request: Notifications.NotificationRequestInput,
    identifier: string,
  ) =>
    buildNotification({
      id: identifier,
      title: request.content.title ?? null,
      body: request.content.body ?? null,
      data: request.content.data,
      categoryId: request.content.categoryIdentifier ?? null,
    });

  const module = {
    DEFAULT_ACTION_IDENTIFIER,
    AndroidImportance: {
      UNKNOWN: 0,
      UNSPECIFIED: 1,
      NONE: 2,
      MIN: 3,
      LOW: 4,
      DEFAULT: 5,
      HIGH: 6,
      MAX: 7,
    },
    IosAuthorizationStatus: {
      NOT_DETERMINED: 0,
      DENIED: 1,
      AUTHORIZED: 2,
      PROVISIONAL: 3,
      EPHEMERAL: 4,
    },
    SchedulableTriggerInputTypes: {
      CALENDAR: "calendar",
      DAILY: "daily",
      WEEKLY: "weekly",
      MONTHLY: "monthly",
      YEARLY: "yearly",
      DATE: "date",
      TIME_INTERVAL: "timeInterval",
    },

    setNotificationHandler: mockable(
      (next: Notifications.NotificationHandler | null) => {
        handler = next;
      },
    ),
    getPermissionsAsync: mockable(async () =>
      permissionResponse(permission, canAskAgain),
    ),
    requestPermissionsAsync: mockable(async () => {
      if (
        permission === "undetermined" ||
        (permission === "denied" && canAskAgain)
      ) {
        permission = permissionOnRequest;
        if (permission === "denied") canAskAgain = false;
      }
      return permissionResponse(permission, canAskAgain);
    }),
    getExpoPushTokenAsync: mockable(async () => {
      if (tokenError) throw tokenError;
      return { type: "expo", data: pushToken };
    }),
    getDevicePushTokenAsync: mockable(async () => {
      if (tokenError) throw tokenError;
      return { type: "ios", data: deviceToken };
    }),
    getLastNotificationResponseAsync: mockable(async () => launchResponse),
    clearLastNotificationResponseAsync: mockable(async () => {
      launchResponse = null;
    }),
    addNotificationReceivedListener: mockable(subscribe("received")),
    addNotificationResponseReceivedListener: mockable(subscribe("response")),
    addPushTokenListener: mockable(subscribe("token")),

    setNotificationChannelAsync: mockable(
      async (id: string, channel: object) => {
        channels[id] = { id, ...channel };
        return channels[id];
      },
    ),
    setNotificationCategoryAsync: mockable(
      async (id: string, actions: Notifications.NotificationAction[]) => {
        categories[id] = actions;
        return { identifier: id, actions };
      },
    ),

    scheduleNotificationAsync: mockable(
      async (request: Notifications.NotificationRequestInput) => {
        const identifier = request.identifier ?? nextId();
        scheduled = scheduled.filter(
          (entry) => entry.identifier !== identifier,
        );
        const immediate =
          request.trigger === null ||
          (typeof request.trigger === "object" && !("type" in request.trigger));
        if (immediate) {
          await present(toNotification(request, identifier));
        } else {
          scheduled.push({
            identifier,
            content: toNotification(request, identifier).request.content,
            trigger: request.trigger,
          } as Notifications.NotificationRequest);
        }
        return identifier;
      },
    ),
    cancelScheduledNotificationAsync: mockable(async (id: string) => {
      scheduled = scheduled.filter((entry) => entry.identifier !== id);
    }),
    cancelAllScheduledNotificationsAsync: mockable(async () => {
      scheduled = [];
    }),
    getAllScheduledNotificationsAsync: mockable(async () => [...scheduled]),

    getBadgeCountAsync: mockable(async () => badge),
    setBadgeCountAsync: mockable(async (count: number) => {
      badge = count;
      return true;
    }),

    getPresentedNotificationsAsync: mockable(async () => [...presented]),
    dismissNotificationAsync: mockable(async (id: string) => {
      presented = presented.filter((entry) => entry.request.identifier !== id);
    }),
    dismissAllNotificationsAsync: mockable(async () => {
      presented = [];
    }),
  };

  return {
    /** The replacement for `expo-notifications`: return it from `jest.mock`. */
    module,

    /** What `getPermissionsAsync` reports. */
    setPermission(
      next: MockPermission,
      options: { canAskAgain?: boolean } = {},
    ) {
      permission = next;
      canAskAgain = options.canAskAgain ?? next !== "denied";
    },
    /** What the user answers when `requestPermissionsAsync` shows the prompt. Default `"granted"`. */
    answerPermissionPromptWith(next: MockPermission) {
      permissionOnRequest = next;
    },
    setPushToken(data: string) {
      pushToken = data;
      deviceToken = data;
    },
    /** Make the token calls reject (an iOS simulator, no network). `null` to stop. */
    failPushToken(error: unknown) {
      tokenError = error;
    },
    /** Rotate the device token: fires the push token listeners. */
    rotatePushToken(data: string) {
      deviceToken = data;
      pushToken = `ExponentPushToken[${data}]`;
      emit("token", { type: "ios", data });
    },
    /** The tap that "launched the app", returned by `getLastNotificationResponseAsync`. */
    setLaunchResponse(response: Notifications.NotificationResponse | null) {
      launchResponse = response;
    },

    /** Delivers a notification while the app is open: runs the handler, then the received listeners. */
    deliver(input: MockNotificationInput = {}) {
      return present(buildNotification(input));
    },
    /** Fires a delivered (or a new) notification's tap, or one of its actions. */
    tap(
      target: string | Notifications.Notification | MockNotificationInput,
      options: { actionIdentifier?: string; userText?: string } = {},
    ) {
      const notification =
        typeof target === "string"
          ? (presented.find((entry) => entry.request.identifier === target) ??
            buildNotification({ id: target }))
          : target;
      const response = buildResponse(notification, options);
      emit("response", response);
      return response;
    },
    /** Delivers a pending scheduled notification now, as if its trigger fired. */
    fireScheduled(id: string) {
      const request = scheduled.find((entry) => entry.identifier === id);
      if (!request)
        throw new Error(`No scheduled notification with id "${id}".`);
      scheduled = scheduled.filter((entry) => entry.identifier !== id);
      return present({
        date: Date.now(),
        request,
      } as Notifications.Notification);
    },

    get scheduled() {
      return [...scheduled];
    },
    get presented() {
      return [...presented];
    },
    get badge() {
      return badge;
    },
    get channels() {
      return { ...channels };
    },
    get categories() {
      return { ...categories };
    },
    /** What the foreground handler decided for the last delivered notification. */
    get lastPresentation() {
      return lastBehavior;
    },
    /** How many listeners of a kind are subscribed: `received`, `response` or `token`. */
    listenerCount(kind: "received" | "response" | "token") {
      return listeners[kind]?.length ?? 0;
    },

    /**
     * Back to a fresh device: no permission, no notifications, no listeners.
     * Call history on the `jest.fn`s is Jest's to clear (`jest.clearAllMocks()`).
     */
    reset() {
      listeners = {};
      handler = null;
      permission = "undetermined";
      canAskAgain = true;
      permissionOnRequest = "granted";
      pushToken = "ExponentPushToken[mock]";
      deviceToken = "mock-device-token";
      tokenError = null;
      launchResponse = null;
      badge = 0;
      scheduled = [];
      presented = [];
      channels = {};
      categories = {};
      lastBehavior = null;
      // The provider delivers each tap once per JS session; a new test is a new session.
      // Ids keep counting up for the same reason: a reused id would look like a repeat.
      resetSeenResponses();
    },
  };
}

export type NotificationsMock = ReturnType<typeof createNotificationsMock>;

/** One shared instance, so the `jest.mock` factory and the test see the same state. */
export const notificationsMock: NotificationsMock = createNotificationsMock();
