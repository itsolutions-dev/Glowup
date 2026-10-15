import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { toNotification } from "../rawNotification";
import type {
  PermissionState,
  PushToken,
  WebPushConfig,
  WebPushPayload,
} from "../types";

/**
 * The browser half of Web Push, on standard APIs (service worker, PushManager,
 * Notification). expo-notifications only fetches a web token, from app.json,
 * and reports neither deliveries nor taps on web.
 *
 * The service worker (service-worker/glowup-push-sw.js) and this module talk
 * through `postMessage` with `source: MESSAGE_SOURCE`, and through the URL hash
 * when a tap has to open a new tab.
 */
export const MESSAGE_SOURCE = "glowup-notifications";
const LAUNCH_HASH_KEY = "glowup-notification=";
const DEFAULT_SERVICE_WORKER_PATH = "/glowup-push-sw.js";

/** A push as the service worker forwards it: the payload plus an id and a time. */
export interface WebNotification extends WebPushPayload {
  id: string;
  date: number;
}

/**
 * Checked at call time, never at import or during render: the static web
 * export prerenders in Node, where none of these globals exist.
 */
export function isWebPushSupported(): boolean {
  return (
    Platform.OS === "web" &&
    typeof window !== "undefined" &&
    typeof navigator !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export function getWebPermission(): PermissionState {
  switch (Notification.permission) {
    case "granted":
      return { status: "granted", canAskAgain: false };
    case "denied":
      return { status: "denied", canAskAgain: false };
    default:
      return { status: "undetermined", canAskAgain: true };
  }
}

/** Browsers only show the prompt from a user gesture: call it from a press handler. */
export async function requestWebPermission(): Promise<PermissionState> {
  await Notification.requestPermission();
  return getWebPermission();
}

export async function registerServiceWorker(
  config: WebPushConfig,
): Promise<ServiceWorkerRegistration> {
  await navigator.serviceWorker.register(
    config.serviceWorkerPath ?? DEFAULT_SERVICE_WORKER_PATH,
    config.scope ? { scope: config.scope } : undefined,
  );
  return navigator.serviceWorker.ready;
}

/** The existing subscription, or a new one. Needs the permission granted. */
export async function getWebPushToken(
  config: WebPushConfig,
): Promise<PushToken> {
  if (!config.vapidPublicKey) {
    throw new Error(
      "webPush.vapidPublicKey is required to create a Web Push subscription.",
    );
  }
  const registration = await registerServiceWorker(config);
  const subscription =
    (await registration.pushManager.getSubscription()) ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      // The Push API base64url-decodes a string key itself.
      applicationServerKey: config.vapidPublicKey,
    }));
  const json = subscription.toJSON();
  return {
    type: "web",
    data: JSON.stringify(json),
    endpoint: json.endpoint ?? subscription.endpoint,
    keys: { p256dh: json.keys?.p256dh ?? "", auth: json.keys?.auth ?? "" },
  };
}

/**
 * Shows a push that arrived while a tab was visible: the service worker leaves
 * that decision to the page, so the provider's foreground policy applies.
 */
export async function showWebNotification(
  config: WebPushConfig,
  notification: WebNotification,
): Promise<void> {
  const registration = await registerServiceWorker(config);
  await registration.showNotification(notification.title ?? "", {
    body: notification.body,
    icon: notification.icon,
    badge: notification.badge,
    tag: notification.id,
    data: { glowup: notification },
    // Not in TypeScript's DOM lib yet; Chromium shows them.
    ...(notification.actions && { actions: notification.actions }),
  } as NotificationOptions);
}

/** Shapes a web push like an expo-notifications one, so one parser serves both. */
export function toRawNotification(
  notification: WebNotification,
): Notifications.Notification {
  return toNotification({ ...notification, trigger: { type: "push" } });
}

export function toRawResponse(
  notification: WebNotification,
  action: string,
): Notifications.NotificationResponse {
  return {
    notification: toRawNotification(notification),
    // The Notifications API reports a tap on the body as an empty action.
    actionIdentifier: action || Notifications.DEFAULT_ACTION_IDENTIFIER,
  };
}

interface ServiceWorkerHandlers {
  push: (notification: WebNotification) => void;
  click: (notification: WebNotification, action: string) => void;
  subscriptionChange: () => void;
}

export function listenToServiceWorker(
  handlers: ServiceWorkerHandlers,
): () => void {
  const onMessage = (event: MessageEvent) => {
    const message = event.data;
    if (!message || message.source !== MESSAGE_SOURCE) return;
    if (message.type === "push") handlers.push(message.notification);
    else if (message.type === "click")
      handlers.click(message.notification, message.action ?? "");
    else if (message.type === "subscription-change")
      handlers.subscriptionChange();
  };
  navigator.serviceWorker.addEventListener("message", onMessage);
  return () =>
    navigator.serviceWorker.removeEventListener("message", onMessage);
}

/**
 * The tap that opened this tab: the service worker puts it in the URL hash
 * when no tab was open. Read once, then removed from the address bar.
 */
export function takeLaunchResponseFromUrl(): {
  notification: WebNotification;
  action: string;
} | null {
  const hash = window.location.hash.replace(/^#/, "");
  if (!hash.startsWith(LAUNCH_HASH_KEY)) return null;
  window.history.replaceState(
    window.history.state,
    "",
    window.location.pathname + window.location.search,
  );
  try {
    const parsed = JSON.parse(
      decodeURIComponent(hash.slice(LAUNCH_HASH_KEY.length)),
    );
    return parsed?.notification
      ? { notification: parsed.notification, action: parsed.action ?? "" }
      : null;
  } catch {
    return null;
  }
}
