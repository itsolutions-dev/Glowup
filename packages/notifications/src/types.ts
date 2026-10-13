import type * as Notifications from "expo-notifications";

/** The shape of `data` when no parser narrows it. */
export type NotificationData = Record<string, unknown>;

/**
 * Validates and narrows a notification's `data`. Return `null` (or throw) to
 * reject the payload: the notification is then reported through `onEvent` as
 * `invalid-payload` instead of reaching `onReceived` / `onResponse`.
 */
export type DataParser<TData> = (data: unknown) => TData | null;

/** A notification with its payload already parsed. */
export interface AppNotification<TData = NotificationData> {
  id: string;
  title: string | null;
  body: string | null;
  data: TData;
  /** Delivery time, in milliseconds since the epoch. */
  date: number;
  /** The untouched `expo-notifications` object, for anything not mapped here. */
  raw: Notifications.Notification;
}

/** The user tapped a notification, or one of its action buttons. */
export interface AppNotificationResponse<TData = NotificationData> {
  notification: AppNotification<TData>;
  actionIdentifier: string;
  /** True for a tap on the notification itself rather than on an action. */
  isDefaultAction: boolean;
  /** Text typed into a reply action, when there is one. */
  userText?: string;
}

/** What to do with a notification that arrives while the app is open. */
export interface ForegroundPresentation {
  banner: boolean;
  list: boolean;
  sound: boolean;
  badge: boolean;
}

export type ForegroundPolicy<TData = NotificationData> =
  | Partial<ForegroundPresentation>
  | ((notification: AppNotification<TData>) => Partial<ForegroundPresentation>);

export type AndroidChannelImportance =
  "min" | "low" | "default" | "high" | "max";

/** An Android notification channel, created when the provider mounts. */
export interface AndroidChannel {
  id: string;
  name: string;
  importance?: AndroidChannelImportance;
  description?: string;
  /** A bundled sound file name, `"default"`, or `null` for silence. */
  sound?: string | null;
  vibrationPattern?: number[];
  lightColor?: string;
  showBadge?: boolean;
}

export type PermissionStatus =
  | "undetermined"
  | "granted"
  /** iOS: delivered quietly to Notification Center until the user decides. */
  | "provisional"
  | "denied"
  /** The platform has no push support here (web, for now). */
  | "unsupported";

export interface PermissionState {
  status: PermissionStatus;
  /** False once the OS will no longer show the prompt: send the user to settings. */
  canAskAgain: boolean;
}

export interface PermissionRequestOptions {
  /** iOS only: ask for provisional authorization, which shows no prompt. */
  provisional?: boolean;
}

export type PushTokenType = "expo" | "device";

export type PushToken =
  | {
      type: "expo" | "ios" | "android";
      data: string;
    }
  | {
      /** A Web Push subscription. `data` is its JSON, ready to store and hand to `web-push`. */
      type: "web";
      data: string;
      endpoint: string;
      keys: { p256dh: string; auth: string };
    };

export type PushTokenStatus = "idle" | "loading" | "ready" | "error";

export type NotificationsEvent =
  | { type: "permission"; status: PermissionStatus }
  | { type: "token"; token: PushToken }
  | { type: "token-error"; error: unknown }
  | { type: "channels-error"; error: unknown }
  | { type: "categories-error"; error: unknown }
  | { type: "web-push-error"; error: unknown }
  | { type: "received"; id: string }
  | {
      type: "response";
      id: string;
      actionIdentifier: string;
      isDefaultAction: boolean;
    }
  | { type: "invalid-payload"; id: string; error?: unknown };

/** When a local notification fires. Omit it to deliver immediately. */
export type LocalNotificationTrigger =
  | { type: "date"; date: Date | number }
  | { type: "interval"; seconds: number; repeats?: boolean }
  | { type: "daily"; hour: number; minute: number }
  /** `weekday`: 1 = Sunday … 7 = Saturday, as on iOS and Android. */
  | { type: "weekly"; weekday: number; hour: number; minute: number };

export interface LocalNotificationContent<TData = NotificationData> {
  title?: string;
  subtitle?: string;
  body?: string;
  data?: TData;
  /** `true` for the default sound, a bundled file name, or `false` for silence. */
  sound?: boolean | string;
  /** The app icon badge to set when it is delivered (iOS). */
  badge?: number;
  /** A category registered through the provider's `categories` prop. */
  categoryId?: string;
  /** The Android channel to post to. Defaults to the system fallback channel. */
  channelId?: string;
}

export interface ScheduledNotification<TData = NotificationData> {
  id: string;
  title: string | null;
  body: string | null;
  data: TData;
  /** The trigger as expo-notifications reports it back, for display or debugging. */
  trigger: unknown;
}

/** A button on a notification, grouped into a category. */
export interface NotificationAction {
  id: string;
  title: string;
  /** Bring the app to the foreground when tapped. Default `true`. */
  opensApp?: boolean;
  /** iOS: draw the button in red. */
  destructive?: boolean;
  /** iOS: require the device to be unlocked. */
  authenticationRequired?: boolean;
  /** Turn the button into a text reply; the text arrives as `userText`. */
  textInput?: { submitButtonTitle: string; placeholder: string };
}

/** A named set of actions; a notification picks one with `categoryId`. */
export interface NotificationCategory {
  id: string;
  actions: readonly NotificationAction[];
}

/** Web Push setup for the provider's `webPush` prop. */
export interface WebPushConfig {
  /**
   * Where the app serves the service worker shipped as
   * `@its/glowup-notifications/service-worker.js`. Default `"/glowup-push-sw.js"`.
   */
  serviceWorkerPath?: string;
  /** Service worker scope. Default: the browser's, i.e. the worker file's folder. */
  scope?: string;
  /**
   * The VAPID public key (URL-safe base64) of the server that sends the pushes.
   * Without it the permission still works but no subscription is created.
   */
  vapidPublicKey?: string;
}

/**
 * What the server sends as the body of a Web Push message (JSON). The service
 * worker shows it, or hands it to an open tab.
 */
export interface WebPushPayload {
  /** Stable id: a second push with the same id replaces the first. */
  id?: string;
  title?: string;
  body?: string;
  data?: Record<string, unknown>;
  icon?: string;
  badge?: string;
  /** Page to open when the notification is tapped and no tab is open. Default "/". */
  url?: string;
  /** Buttons, where the browser supports them. The chosen `action` reaches onResponse. */
  actions?: { action: string; title: string; icon?: string }[];
}
