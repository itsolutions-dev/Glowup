export {
  NotificationsProvider,
  type NotificationsProviderProps,
} from "./NotificationsProvider";
export { isNotificationsSupported } from "./support";
export {
  useNotificationPermission,
  usePushToken,
  type UseNotificationPermission,
  type UsePushToken,
} from "./hooks";
export { DEFAULT_FOREGROUND } from "./foreground";
export { isWebPushSupported } from "./web/webPush";
export {
  scheduleNotification,
  cancelScheduledNotification,
  cancelAllScheduledNotifications,
  getScheduledNotifications,
} from "./scheduling";
export { getBadgeCount, setBadgeCount, clearBadge } from "./badge";
export {
  getPresentedNotifications,
  dismissNotification,
  dismissAllNotifications,
  dismissNotificationsWhere,
} from "./presented";
export type {
  AndroidChannel,
  AndroidChannelImportance,
  AppNotification,
  AppNotificationResponse,
  DataParser,
  LocalNotificationContent,
  LocalNotificationTrigger,
  NotificationAction,
  NotificationCategory,
  ForegroundPolicy,
  ForegroundPresentation,
  NotificationData,
  NotificationsEvent,
  PermissionRequestOptions,
  PermissionState,
  PermissionStatus,
  PushToken,
  PushTokenStatus,
  PushTokenType,
  ScheduledNotification,
  WebPushConfig,
  WebPushPayload,
} from "./types";
