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

export interface PushToken {
  type: "expo" | "ios" | "android";
  data: string;
}

export type PushTokenStatus = "idle" | "loading" | "ready" | "error";

export type NotificationsEvent =
  | { type: "permission"; status: PermissionStatus }
  | { type: "token"; token: PushToken }
  | { type: "token-error"; error: unknown }
  | { type: "channels-error"; error: unknown }
  | { type: "received"; id: string }
  | { type: "response"; id: string; actionIdentifier: string }
  | { type: "invalid-payload"; id: string; error?: unknown };
