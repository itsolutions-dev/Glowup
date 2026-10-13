import * as Notifications from "expo-notifications";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AppState } from "react-native";

import { clearBadge } from "./badge";
import { registerCategories } from "./categories";
import { ensureAndroidChannels } from "./channels";
import {
  NotificationsContext,
  type NotificationsContextValue,
} from "./context";
import { resolveForeground } from "./foreground";
import { parseNotification, parseResponse } from "./payload";
import {
  allowsPush,
  toPermissionState,
  UNKNOWN,
  UNSUPPORTED,
} from "./permissions";
import { markResponseSeen } from "./responses";
import { isNotificationsSupported } from "./support";
import {
  getWebPermission,
  getWebPushToken,
  isWebPushSupported,
  listenToServiceWorker,
  registerServiceWorker,
  requestWebPermission,
  showWebNotification,
  takeLaunchResponseFromUrl,
  toRawNotification,
  toRawResponse,
} from "./web/webPush";
import type {
  AndroidChannel,
  AppNotification,
  AppNotificationResponse,
  DataParser,
  ForegroundPolicy,
  NotificationCategory,
  NotificationData,
  NotificationsEvent,
  PermissionRequestOptions,
  PermissionState,
  PushToken,
  PushTokenStatus,
  PushTokenType,
  WebPushConfig,
} from "./types";

export { isNotificationsSupported };

export interface NotificationsProviderProps<TData = NotificationData> {
  children: ReactNode;
  /** Presentation of notifications that arrive while the app is open. Default: show everything. */
  foreground?: ForegroundPolicy<TData>;
  /** Created on mount, before any permission request. Android only. */
  androidChannels?: readonly AndroidChannel[];
  /** Action button sets, registered on mount. A notification picks one with `categoryId`. */
  categories?: readonly NotificationCategory[];
  /** Reset the app icon badge on mount and whenever the app returns to the foreground. */
  clearBadgeOnForeground?: boolean;
  /** `"expo"` (default) for the Expo push service, `"device"` for raw FCM / APNs tokens. */
  tokenType?: PushTokenType;
  /** EAS project id for Expo tokens. Defaults to the one in the app config. */
  projectId?: string;
  /**
   * Turns on Web Push in browsers that support it. Without it the provider
   * reports `unsupported` on web and does nothing.
   */
  webPush?: WebPushConfig;
  /** Validates `data`; a rejected payload skips `onReceived` / `onResponse`. */
  parseData?: DataParser<TData>;
  /** A new token, on first fetch and on every rotation: register it with your backend here. */
  onTokenChange?: (token: PushToken) => void;
  /** A notification arrived while the app was open. */
  onReceived?: (notification: AppNotification<TData>) => void;
  /**
   * The user tapped a notification, including the one that launched the app.
   * Delivered once. Route from here: the package knows no navigator.
   */
  onResponse?: (response: AppNotificationResponse<TData>) => void;
  /** Everything above plus errors, for logging. */
  onEvent?: (event: NotificationsEvent) => void;
}

function toPushToken(raw: Notifications.DevicePushToken): PushToken {
  return {
    type: raw.type === "ios" ? "ios" : "android",
    data: String(raw.data),
  };
}

const noop = () => {};

export function NotificationsProvider<TData = NotificationData>(
  props: NotificationsProviderProps<TData>,
) {
  // Callbacks and config are read through a ref, so the native listeners are
  // registered once and an inline arrow function never re-subscribes them.
  const latest = useRef(props);
  useEffect(() => {
    latest.current = props;
  });

  // On web the real status is only known in the browser, after mount; the
  // first render must match the prerendered HTML, so it starts as "unknown".
  const [permission, setPermission] = useState<PermissionState>(
    isNotificationsSupported || props.webPush ? UNKNOWN : UNSUPPORTED,
  );
  const [token, setToken] = useState<PushToken | null>(null);
  const [tokenStatus, setTokenStatus] = useState<PushTokenStatus>("idle");
  const [tokenError, setTokenError] = useState<unknown>(null);

  const setupReady = useRef<Promise<void>>(Promise.resolve());
  const lastPermission = useRef<PermissionState["status"] | null>(null);
  const lastToken = useRef<string | null>(null);

  const emit = useCallback((event: NotificationsEvent) => {
    latest.current.onEvent?.(event);
  }, []);

  /** The Web Push config, when this is a browser that can use it. Call-time only. */
  const webConfig = useCallback((): WebPushConfig | null => {
    const { webPush } = latest.current;
    return !isNotificationsSupported && webPush && isWebPushSupported()
      ? webPush
      : null;
  }, []);

  const applyToken = useCallback(
    (next: PushToken) => {
      setToken(next);
      setTokenError(null);
      setTokenStatus("ready");
      if (lastToken.current !== next.data) {
        lastToken.current = next.data;
        emit({ type: "token", token: next });
        latest.current.onTokenChange?.(next);
      }
    },
    [emit],
  );

  const refreshToken = useCallback(async (): Promise<PushToken | null> => {
    const web = webConfig();
    // Without a VAPID key a browser can still be asked for permission, but has
    // nothing to subscribe to: the token stays idle rather than erroring.
    if (!isNotificationsSupported && !web?.vapidPublicKey) return null;
    setTokenStatus("loading");
    try {
      const { tokenType = "expo", projectId } = latest.current;
      const next = web
        ? await getWebPushToken(web)
        : tokenType === "device"
          ? toPushToken(await Notifications.getDevicePushTokenAsync())
          : await Notifications.getExpoPushTokenAsync(
              projectId ? { projectId } : undefined,
            );
      applyToken(next);
      return next;
    } catch (error) {
      setTokenError(error);
      setTokenStatus("error");
      emit({ type: "token-error", error });
      return null;
    }
  }, [applyToken, emit, webConfig]);

  // Fetching the token here, on the transition into an allowed status, rather
  // than in an effect watching `permission`, keeps the state updates inside
  // async callbacks and runs the fetch once per grant.
  const applyPermission = useCallback(
    (next: PermissionState) => {
      setPermission((prev) =>
        prev.status === next.status && prev.canAskAgain === next.canAskAgain
          ? prev
          : next,
      );
      const previous = lastPermission.current;
      if (previous !== next.status) {
        lastPermission.current = next.status;
        emit({ type: "permission", status: next.status });
        const wasAllowed =
          previous !== null &&
          allowsPush({ status: previous, canAskAgain: false });
        if (allowsPush(next) && !wasAllowed) void refreshToken();
      }
      return next;
    },
    [emit, refreshToken],
  );

  const refreshPermission = useCallback(async () => {
    if (!isNotificationsSupported) {
      return webConfig() ? applyPermission(getWebPermission()) : UNSUPPORTED;
    }
    return applyPermission(
      toPermissionState(await Notifications.getPermissionsAsync()),
    );
  }, [applyPermission, webConfig]);

  const requestPermission = useCallback(
    async (options?: PermissionRequestOptions) => {
      if (!isNotificationsSupported) {
        return webConfig()
          ? applyPermission(await requestWebPermission())
          : UNSUPPORTED;
      }
      // Android 13+ only prompts once a channel exists. A setup failure was
      // already reported through onEvent; the request still goes ahead.
      await setupReady.current;
      return applyPermission(
        toPermissionState(
          await Notifications.requestPermissionsAsync({
            ios: {
              allowAlert: true,
              allowBadge: true,
              allowSound: true,
              allowProvisional: options?.provisional ?? false,
            },
          }),
        ),
      );
    },
    [applyPermission, webConfig],
  );

  // Shared by the native listeners and the service worker messages.
  const handleReceived = useCallback(
    (raw: Notifications.Notification) => {
      const parsed = parseNotification(raw, latest.current.parseData);
      const id = raw.request.identifier;
      if (!parsed.ok) {
        emit({ type: "invalid-payload", id, error: parsed.error });
        return;
      }
      emit({ type: "received", id });
      latest.current.onReceived?.(parsed.value);
    },
    [emit],
  );

  const deliverResponse = useCallback(
    (raw: Notifications.NotificationResponse) => {
      if (!markResponseSeen(raw)) return;
      const parsed = parseResponse(raw, latest.current.parseData);
      const id = raw.notification.request.identifier;
      if (!parsed.ok) {
        emit({ type: "invalid-payload", id, error: parsed.error });
        return;
      }
      emit({
        type: "response",
        id,
        actionIdentifier: raw.actionIdentifier,
        isDefaultAction: parsed.value.isDefaultAction,
      });
      latest.current.onResponse?.(parsed.value);
    },
    [emit],
  );

  useEffect(() => {
    if (!isNotificationsSupported) return;
    let active = true;

    const { androidChannels = [], categories = [] } = latest.current;
    setupReady.current = Promise.all([
      ensureAndroidChannels(androidChannels).catch((error) =>
        emit({ type: "channels-error", error }),
      ),
      registerCategories(categories).catch((error) =>
        emit({ type: "categories-error", error }),
      ),
    ]).then(noop);

    const resetBadge = () => {
      if (latest.current.clearBadgeOnForeground) clearBadge().catch(noop);
    };
    resetBadge();

    Notifications.setNotificationHandler({
      handleNotification: async (raw) => {
        const { foreground, parseData } = latest.current;
        const parsed = parseNotification(raw, parseData);
        return resolveForeground(foreground, parsed.ok ? parsed.value : null);
      },
    });

    const onResponse = (raw: Notifications.NotificationResponse) => {
      if (active) deliverResponse(raw);
    };

    const subscriptions = [
      Notifications.addNotificationReceivedListener(handleReceived),
      Notifications.addNotificationResponseReceivedListener(onResponse),
      Notifications.addPushTokenListener((raw) => {
        if (!active) return;
        // The listener reports device tokens; an Expo token is derived from
        // the device one, so it has to be fetched again.
        if (latest.current.tokenType === "device") applyToken(toPushToken(raw));
        else void refreshToken();
      }),
      // The user may have flipped the switch in system settings meanwhile.
      AppState.addEventListener("change", (state) => {
        if (state !== "active") return;
        refreshPermission().catch(noop);
        resetBadge();
      }),
    ];

    // The tap that launched the app. Cleared afterwards, so a JS reload does
    // not route to it a second time.
    Notifications.getLastNotificationResponseAsync()
      .then((raw) => {
        if (!raw) return;
        onResponse(raw);
        return Notifications.clearLastNotificationResponseAsync();
      })
      .catch(noop);

    Notifications.getPermissionsAsync()
      .then((raw) => applyPermission(toPermissionState(raw)))
      .catch(noop);

    return () => {
      active = false;
      subscriptions.forEach((subscription) => subscription.remove());
      Notifications.setNotificationHandler(null);
    };
  }, [
    applyPermission,
    applyToken,
    deliverResponse,
    emit,
    handleReceived,
    refreshPermission,
    refreshToken,
  ]);

  useEffect(() => {
    if (isNotificationsSupported || !latest.current.webPush) return;
    let active = true;
    const later = (run: () => void) =>
      Promise.resolve().then(() => {
        if (active) run();
      });

    const config = webConfig();
    if (!config) {
      // A browser without service workers or the Push API.
      later(() => applyPermission(UNSUPPORTED));
      return () => {
        active = false;
      };
    }

    registerServiceWorker(config).catch((error) =>
      emit({ type: "web-push-error", error }),
    );

    const stop = listenToServiceWorker({
      push: (notification) => {
        if (!active) return;
        const raw = toRawNotification(notification);
        const { foreground, parseData } = latest.current;
        const parsed = parseNotification(raw, parseData);
        const behavior = resolveForeground(
          foreground,
          parsed.ok ? parsed.value : null,
        );
        if (behavior.shouldShowBanner || behavior.shouldShowList) {
          showWebNotification(config, notification).catch((error) =>
            emit({ type: "web-push-error", error }),
          );
        }
        handleReceived(raw);
      },
      click: (notification, action) => {
        if (active) deliverResponse(toRawResponse(notification, action));
      },
      subscriptionChange: () => {
        if (active) void refreshToken();
      },
    });

    const launch = takeLaunchResponseFromUrl();
    if (launch) {
      deliverResponse(toRawResponse(launch.notification, launch.action));
    }

    later(() => applyPermission(getWebPermission()));
    // The user may have changed the site's permission in the browser meanwhile.
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        applyPermission(getWebPermission());
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      active = false;
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [
    applyPermission,
    deliverResponse,
    emit,
    handleReceived,
    refreshToken,
    webConfig,
  ]);

  const value = useMemo<NotificationsContextValue>(
    () => ({
      permission,
      requestPermission,
      refreshPermission,
      token,
      tokenStatus,
      tokenError,
      refreshToken,
    }),
    [
      permission,
      requestPermission,
      refreshPermission,
      token,
      tokenStatus,
      tokenError,
      refreshToken,
    ],
  );

  return (
    <NotificationsContext.Provider value={value}>
      {props.children}
    </NotificationsContext.Provider>
  );
}
