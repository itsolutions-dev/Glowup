import { act, renderHook, waitFor } from "@testing-library/react-native";
import * as Notifications from "expo-notifications";
import type { ReactNode } from "react";
import { Platform } from "react-native";

import { ensureAndroidChannels } from "../channels";
import { resolveForeground } from "../foreground";
import { useNotificationPermission, usePushToken } from "../hooks";
import {
  NotificationsProvider,
  type NotificationsProviderProps,
} from "../NotificationsProvider";
import { parseNotification } from "../payload";
import { toPermissionState } from "../permissions";
import { resetSeenResponses } from "../responses";

type Listener = (payload: unknown) => void;
const listeners: Record<string, Listener[]> = {};
const subscribe = (name: string) => (listener: Listener) => {
  (listeners[name] ??= []).push(listener);
  return {
    remove: () => {
      listeners[name] = listeners[name].filter((l) => l !== listener);
    },
  };
};
const fire = (name: string, payload: unknown) =>
  listeners[name]?.forEach((listener) => listener(payload));

jest.mock("expo-notifications", () => ({
  DEFAULT_ACTION_IDENTIFIER: "expo.modules.notifications.actions.DEFAULT",
  AndroidImportance: { MIN: 3, LOW: 4, DEFAULT: 5, HIGH: 6, MAX: 7 },
  IosAuthorizationStatus: {
    NOT_DETERMINED: 0,
    DENIED: 1,
    AUTHORIZED: 2,
    PROVISIONAL: 3,
    EPHEMERAL: 4,
  },
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(() => Promise.resolve(null)),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
  getDevicePushTokenAsync: jest.fn(),
  getLastNotificationResponseAsync: jest.fn(),
  clearLastNotificationResponseAsync: jest.fn(() => Promise.resolve()),
  addNotificationReceivedListener: jest.fn((l) => subscribe("received")(l)),
  addNotificationResponseReceivedListener: jest.fn((l) =>
    subscribe("response")(l),
  ),
  addPushTokenListener: jest.fn((l) => subscribe("token")(l)),
}));

const mocked = jest.mocked(Notifications);

const UNDETERMINED = {
  status: "undetermined",
  granted: false,
  canAskAgain: true,
  expires: "never",
};
const GRANTED = {
  status: "granted",
  granted: true,
  canAskAgain: true,
  expires: "never",
};

function rawNotification(id: string, data: Record<string, unknown> = {}) {
  return {
    date: 1_700_000_000_000,
    request: {
      identifier: id,
      content: { title: "Title", body: "Body", data },
      trigger: null,
    },
  } as unknown as Notifications.Notification;
}

function rawResponse(id: string, data: Record<string, unknown> = {}) {
  return {
    notification: rawNotification(id, data),
    actionIdentifier: Notifications.DEFAULT_ACTION_IDENTIFIER,
  } as Notifications.NotificationResponse;
}

function wrapperWith(props: Omit<NotificationsProviderProps, "children"> = {}) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <NotificationsProvider {...props}>{children}</NotificationsProvider>;
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  Object.keys(listeners).forEach((key) => delete listeners[key]);
  resetSeenResponses();
  mocked.getPermissionsAsync.mockResolvedValue(UNDETERMINED as never);
  mocked.requestPermissionsAsync.mockResolvedValue(GRANTED as never);
  mocked.getExpoPushTokenAsync.mockResolvedValue({
    type: "expo",
    data: "ExponentPushToken[abc]",
  });
  mocked.getLastNotificationResponseAsync.mockResolvedValue(null);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("resolveForeground", () => {
  it("shows everything by default", () => {
    expect(resolveForeground(undefined, null)).toEqual({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    });
  });

  it("applies a per-notification policy", () => {
    const parsed = parseNotification(rawNotification("1", { silent: true }));
    if (!parsed.ok) throw new Error("expected a parsed notification");
    const behavior = resolveForeground(
      (n) => (n.data.silent ? { banner: false, sound: false } : {}),
      parsed.value,
    );
    expect(behavior.shouldShowBanner).toBe(false);
    expect(behavior.shouldPlaySound).toBe(false);
    expect(behavior.shouldShowList).toBe(true);
  });
});

describe("parseNotification", () => {
  it("rejects a payload the parser returns null for", () => {
    const parsed = parseNotification(
      rawNotification("1", { kind: "nope" }),
      () => null,
    );
    expect(parsed.ok).toBe(false);
  });

  it("reports a parser that throws", () => {
    const error = new Error("bad");
    const parsed = parseNotification(rawNotification("1"), () => {
      throw error;
    });
    expect(parsed).toEqual({ ok: false, error });
  });
});

describe("toPermissionState", () => {
  it("maps iOS provisional authorization", () => {
    expect(
      toPermissionState({
        ...UNDETERMINED,
        ios: { status: Notifications.IosAuthorizationStatus.PROVISIONAL },
      } as never).status,
    ).toBe("provisional");
  });

  it("keeps canAskAgain for a denial", () => {
    expect(
      toPermissionState({
        ...UNDETERMINED,
        status: "denied",
        canAskAgain: false,
      } as never),
    ).toEqual({ status: "denied", canAskAgain: false });
  });
});

describe("ensureAndroidChannels", () => {
  it("creates every channel on Android", async () => {
    jest.replaceProperty(Platform, "OS", "android");
    await ensureAndroidChannels([
      { id: "chat", name: "Chat", importance: "high" },
    ]);
    expect(mocked.setNotificationChannelAsync).toHaveBeenCalledWith("chat", {
      name: "Chat",
      importance: 6,
    });
  });

  it("does nothing on iOS", async () => {
    await ensureAndroidChannels([{ id: "chat", name: "Chat" }]);
    expect(mocked.setNotificationChannelAsync).not.toHaveBeenCalled();
  });
});

describe("NotificationsProvider", () => {
  it("throws when a hook is used outside the provider", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(renderHook(() => usePushToken())).rejects.toThrow(
      /NotificationsProvider/,
    );
  });

  it("fetches the token once permission is granted and reports it once", async () => {
    const onTokenChange = jest.fn();
    const { result } = await renderHook(
      () => ({ permission: useNotificationPermission(), push: usePushToken() }),
      { wrapper: wrapperWith({ onTokenChange }) },
    );

    await waitFor(() => expect(mocked.getPermissionsAsync).toHaveBeenCalled());
    expect(result.current.push.token).toBeNull();

    await act(() => result.current.permission.request());

    await waitFor(() => expect(result.current.push.status).toBe("ready"));
    expect(result.current.permission.status).toBe("granted");
    expect(result.current.push.token).toEqual({
      type: "expo",
      data: "ExponentPushToken[abc]",
    });

    await act(() => result.current.push.refresh());
    expect(onTokenChange).toHaveBeenCalledTimes(1);
  });

  it("delivers the launching tap once, though both sources report it", async () => {
    const onResponse = jest.fn();
    const response = rawResponse("launch", { screen: "orders" });
    mocked.getLastNotificationResponseAsync.mockResolvedValue(response);

    await renderHook(() => null, { wrapper: wrapperWith({ onResponse }) });

    await waitFor(() => expect(onResponse).toHaveBeenCalledTimes(1));
    await act(async () => fire("response", response));

    expect(onResponse).toHaveBeenCalledTimes(1);
    expect(onResponse.mock.calls[0][0]).toMatchObject({
      isDefaultAction: true,
      notification: { id: "launch", data: { screen: "orders" } },
    });
    expect(mocked.clearLastNotificationResponseAsync).toHaveBeenCalled();
  });

  it("reports a rejected payload instead of delivering it", async () => {
    const onReceived = jest.fn();
    const onEvent = jest.fn();
    await renderHook(() => null, {
      wrapper: wrapperWith({ onReceived, onEvent, parseData: () => null }),
    });
    await waitFor(() => expect(listeners.received?.length).toBe(1));

    await act(async () => fire("received", rawNotification("bad")));

    expect(onReceived).not.toHaveBeenCalled();
    expect(onEvent).toHaveBeenCalledWith({
      type: "invalid-payload",
      id: "bad",
      error: undefined,
    });
  });

  it("removes its listeners and handler on unmount", async () => {
    const { unmount } = await renderHook(() => null, {
      wrapper: wrapperWith(),
    });
    await waitFor(() => expect(listeners.response?.length).toBe(1));

    await unmount();

    expect(listeners.response).toHaveLength(0);
    expect(mocked.setNotificationHandler).toHaveBeenLastCalledWith(null);
  });
});
