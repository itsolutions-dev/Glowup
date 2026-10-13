import * as Notifications from "expo-notifications";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AppState, Platform } from "react-native";

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
import type {
  AndroidChannel,
  AppNotification,
  AppNotificationResponse,
  DataParser,
  ForegroundPolicy,
  NotificationData,
  NotificationsEvent,
  PermissionRequestOptions,
  PermissionState,
  PushToken,
  PushTokenStatus,
  PushTokenType,
} from "./types";

/**
 * Push needs a native module: web gets a provider that reports `unsupported`
 * and touches nothing.
 */
export const isNotificationsSupported =
  Platform.OS === "ios" || Platform.OS === "android";

export interface NotificationsProviderProps<TData = NotificationData> {
  children: ReactNode;
  /** Presentation of notifications that arrive while the app is open. Default: show everything. */
  foreground?: ForegroundPolicy<TData>;
  /** Created on mount, before any permission request. Android only. */
  androidChannels?: readonly AndroidChannel[];
  /** `"expo"` (default) for the Expo push service, `"device"` for raw FCM / APNs tokens. */
  tokenType?: PushTokenType;
  /** EAS project id for Expo tokens. Defaults to the one in the app config. */
  projectId?: string;
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

  const [permission, setPermission] = useState<PermissionState>(
    isNotificationsSupported ? UNKNOWN : UNSUPPORTED,
  );
  const [token, setToken] = useState<PushToken | null>(null);
  const [tokenStatus, setTokenStatus] = useState<PushTokenStatus>("idle");
  const [tokenError, setTokenError] = useState<unknown>(null);

  const channelsReady = useRef<Promise<void>>(Promise.resolve());
  const lastPermission = useRef<PermissionState["status"] | null>(null);
  const lastToken = useRef<string | null>(null);

  const emit = useCallback((event: NotificationsEvent) => {
    latest.current.onEvent?.(event);
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
    if (!isNotificationsSupported) return null;
    setTokenStatus("loading");
    try {
      const { tokenType = "expo", projectId } = latest.current;
      const next =
        tokenType === "device"
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
  }, [applyToken, emit]);

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
    if (!isNotificationsSupported) return UNSUPPORTED;
    return applyPermission(
      toPermissionState(await Notifications.getPermissionsAsync()),
    );
  }, [applyPermission]);

  const requestPermission = useCallback(
    async (options?: PermissionRequestOptions) => {
      if (!isNotificationsSupported) return UNSUPPORTED;
      // Android 13+ only prompts once a channel exists. A failure here was
      // already reported as `channels-error`; the request still goes ahead.
      await channelsReady.current.catch(noop);
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
    [applyPermission],
  );

  useEffect(() => {
    if (!isNotificationsSupported) return;
    let active = true;

    channelsReady.current = ensureAndroidChannels(
      latest.current.androidChannels ?? [],
    ).catch((error) => emit({ type: "channels-error", error }));

    Notifications.setNotificationHandler({
      handleNotification: async (raw) => {
        const { foreground, parseData } = latest.current;
        const parsed = parseNotification(raw, parseData);
        return resolveForeground(foreground, parsed.ok ? parsed.value : null);
      },
    });

    const deliverResponse = (raw: Notifications.NotificationResponse) => {
      if (!active || !markResponseSeen(raw)) return;
      const parsed = parseResponse(raw, latest.current.parseData);
      const id = raw.notification.request.identifier;
      if (!parsed.ok) {
        emit({ type: "invalid-payload", id, error: parsed.error });
        return;
      }
      emit({ type: "response", id, actionIdentifier: raw.actionIdentifier });
      latest.current.onResponse?.(parsed.value);
    };

    const subscriptions = [
      Notifications.addNotificationReceivedListener((raw) => {
        const parsed = parseNotification(raw, latest.current.parseData);
        const id = raw.request.identifier;
        if (!parsed.ok) {
          emit({ type: "invalid-payload", id, error: parsed.error });
          return;
        }
        emit({ type: "received", id });
        latest.current.onReceived?.(parsed.value);
      }),
      Notifications.addNotificationResponseReceivedListener(deliverResponse),
      Notifications.addPushTokenListener((raw) => {
        if (!active) return;
        // The listener reports device tokens; an Expo token is derived from
        // the device one, so it has to be fetched again.
        if (latest.current.tokenType === "device") applyToken(toPushToken(raw));
        else void refreshToken();
      }),
      // The user may have flipped the switch in system settings meanwhile.
      AppState.addEventListener("change", (state) => {
        if (state === "active") refreshPermission().catch(noop);
      }),
    ];

    // The tap that launched the app. Cleared afterwards, so a JS reload does
    // not route to it a second time.
    Notifications.getLastNotificationResponseAsync()
      .then((raw) => {
        if (!raw) return;
        deliverResponse(raw);
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
  }, [applyPermission, applyToken, emit, refreshPermission, refreshToken]);

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
