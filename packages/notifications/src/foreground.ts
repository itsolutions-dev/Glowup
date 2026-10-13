import type * as Notifications from "expo-notifications";

import type {
  AppNotification,
  ForegroundPolicy,
  ForegroundPresentation,
} from "./types";

/**
 * Without a policy, expo-notifications hides everything that arrives while the
 * app is open. Showing it is what nearly every app wants, so it is the default.
 */
export const DEFAULT_FOREGROUND: ForegroundPresentation = {
  banner: true,
  list: true,
  sound: true,
  badge: true,
};

/**
 * Resolves the policy for one notification. A payload the parser rejected
 * (`notification === null`) gets the static part of the policy, or the default.
 */
export function resolveForeground<TData>(
  policy: ForegroundPolicy<TData> | undefined,
  notification: AppNotification<TData> | null,
): Notifications.NotificationBehavior {
  let presentation: Partial<ForegroundPresentation> = {};
  if (typeof policy === "function") {
    if (notification) presentation = policy(notification);
  } else if (policy) {
    presentation = policy;
  }
  const merged = { ...DEFAULT_FOREGROUND, ...presentation };
  return {
    shouldShowBanner: merged.banner,
    shouldShowList: merged.list,
    shouldPlaySound: merged.sound,
    shouldSetBadge: merged.badge,
  };
}
