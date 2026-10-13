import type * as Notifications from "expo-notifications";

/**
 * Responses already delivered in this JS session. A cold start reports the tap
 * twice (`getLastNotificationResponseAsync` and the listener), and a provider
 * remount (Fast Refresh, a parent key change) would report the cold-start tap
 * again. Module scope outlives both.
 */
const seen = new Set<string>();

function keyOf(response: Notifications.NotificationResponse): string {
  return `${response.notification.request.identifier}:${response.actionIdentifier}`;
}

/** True the first time a response is seen, false on every repeat. */
export function markResponseSeen(
  response: Notifications.NotificationResponse,
): boolean {
  const key = keyOf(response);
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
}

/** Tests only: not exported from the package. */
export function resetSeenResponses(): void {
  seen.clear();
}
