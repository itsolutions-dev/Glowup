// jest.mock factories and isolateModules need require(): they run before, or
// outside, the static import graph.
/* eslint-disable @typescript-eslint/no-require-imports */
import { act, renderHook, waitFor } from "@testing-library/react-native";
import * as Notifications from "expo-notifications";
import type { ReactNode } from "react";
import { AppState, Platform } from "react-native";

import { clearBadge, getBadgeCount, setBadgeCount } from "../badge";
import { ensureAndroidChannels } from "../channels";
import { resolveForeground } from "../foreground";
import { useNotificationPermission, usePushToken } from "../hooks";
import {
  NotificationsProvider,
  type NotificationsProviderProps,
} from "../NotificationsProvider";
import { parseNotification } from "../payload";
import { toPermissionState } from "../permissions";
import {
  dismissAllNotifications,
  dismissNotificationsWhere,
  getPresentedNotifications,
} from "../presented";
import {
  cancelScheduledNotification,
  getScheduledNotifications,
  scheduleNotification,
} from "../scheduling";
import {
  buildNotification,
  buildResponse,
  notificationsMock,
} from "../testing";

// Dogfoods the package's own test helper: the same mock an app would use.
jest.mock(
  "expo-notifications",
  () => require("../testing").notificationsMock.module,
);

const mocked = jest.mocked(Notifications);

function wrapperWith(props: Omit<NotificationsProviderProps, "children"> = {}) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <NotificationsProvider {...props}>{children}</NotificationsProvider>;
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  notificationsMock.reset();
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
    const parsed = parseNotification(
      buildNotification({ data: { silent: true } }),
    );
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
      buildNotification({ data: { kind: "nope" } }),
      () => null,
    );
    expect(parsed.ok).toBe(false);
  });

  it("reports a parser that throws", () => {
    const error = new Error("bad");
    const parsed = parseNotification(buildNotification(), () => {
      throw error;
    });
    expect(parsed).toEqual({ ok: false, error });
  });
});

describe("toPermissionState", () => {
  it("maps iOS provisional authorization", async () => {
    notificationsMock.setPermission("provisional");
    expect(
      toPermissionState(await Notifications.getPermissionsAsync()).status,
    ).toBe("provisional");
  });

  it("keeps canAskAgain for a denial", async () => {
    notificationsMock.setPermission("denied", { canAskAgain: false });
    expect(
      toPermissionState(await Notifications.getPermissionsAsync()),
    ).toEqual({
      status: "denied",
      canAskAgain: false,
    });
  });
});

describe("ensureAndroidChannels", () => {
  it("creates every channel on Android", async () => {
    jest.replaceProperty(Platform, "OS", "android");
    await ensureAndroidChannels([
      { id: "chat", name: "Chat", importance: "high" },
    ]);
    expect(notificationsMock.channels.chat).toEqual({
      id: "chat",
      name: "Chat",
      importance: 6,
    });
  });

  it("does nothing on iOS", async () => {
    await ensureAndroidChannels([{ id: "chat", name: "Chat" }]);
    expect(mocked.setNotificationChannelAsync).not.toHaveBeenCalled();
  });
});

describe("scheduling", () => {
  it("maps each trigger kind and keeps the channel", async () => {
    await scheduleNotification(
      { title: "A", channelId: "c" },
      { type: "interval", seconds: 5 },
    );
    await scheduleNotification(
      { title: "B" },
      { type: "daily", hour: 9, minute: 30 },
    );
    await scheduleNotification(
      { title: "C" },
      { type: "weekly", weekday: 2, hour: 8, minute: 0 },
    );
    await scheduleNotification(
      { title: "D" },
      { type: "date", date: 1_800_000_000_000 },
    );

    expect(notificationsMock.scheduled.map((entry) => entry.trigger)).toEqual([
      { type: "timeInterval", seconds: 5, repeats: false, channelId: "c" },
      { type: "daily", hour: 9, minute: 30 },
      { type: "weekly", weekday: 2, hour: 8, minute: 0 },
      { type: "date", date: 1_800_000_000_000 },
    ]);
  });

  it("delivers immediately without a trigger and passes the category", async () => {
    await scheduleNotification({
      title: "Now",
      categoryId: "reply",
      data: { a: 1 },
    });
    expect(notificationsMock.scheduled).toHaveLength(0);
    expect(notificationsMock.presented[0].request.content).toMatchObject({
      title: "Now",
      categoryIdentifier: "reply",
      data: { a: 1 },
    });
  });

  it("replaces a pending notification that has the same id", async () => {
    const trigger = { type: "interval", seconds: 60 } as const;
    await scheduleNotification({ title: "First" }, trigger, { id: "reminder" });
    await scheduleNotification({ title: "Second" }, trigger, {
      id: "reminder",
    });
    const pending = await getScheduledNotifications();
    expect(pending.map((entry) => [entry.id, entry.title])).toEqual([
      ["reminder", "Second"],
    ]);

    await cancelScheduledNotification("reminder");
    expect(await getScheduledNotifications()).toEqual([]);
  });

  it("leaves out pending entries the parser rejects", async () => {
    const trigger = { type: "interval", seconds: 60 } as const;
    await scheduleNotification({ data: { kind: "chat" } }, trigger);
    await scheduleNotification({ data: { kind: "other" } }, trigger);
    const chats = await getScheduledNotifications((data) =>
      (data as { kind?: string }).kind === "chat"
        ? (data as { kind: "chat" })
        : null,
    );
    expect(chats.map((entry) => entry.data.kind)).toEqual(["chat"]);
  });

  it("rejects on web", async () => {
    // `isNotificationsSupported` is read once, at import: load a fresh copy of
    // the module graph with the platform already switched.
    let onWeb: typeof scheduleNotification = scheduleNotification;
    jest.isolateModules(() => {
      require("react-native").Platform.OS = "web";
      onWeb = require("../scheduling").scheduleNotification;
    });
    await expect(onWeb({ title: "x" })).rejects.toThrow(
      "scheduleNotification() is not supported",
    );
  });
});

describe("badge", () => {
  it("sets, reads and clears the count, never below zero", async () => {
    await setBadgeCount(3.7);
    expect(await getBadgeCount()).toBe(3);
    await setBadgeCount(-2);
    expect(await getBadgeCount()).toBe(0);
    await setBadgeCount(5);
    await clearBadge();
    expect(notificationsMock.badge).toBe(0);
  });
});

describe("presented notifications", () => {
  it("dismisses only the ones that match", async () => {
    await notificationsMock.deliver({ id: "a", data: { chatId: "1" } });
    await notificationsMock.deliver({ id: "b", data: { chatId: "2" } });
    await notificationsMock.deliver({ id: "c", data: { chatId: "1" } });

    const dismissed = await dismissNotificationsWhere(
      (notification) => notification.data.chatId === "1",
    );

    expect(dismissed).toBe(2);
    expect((await getPresentedNotifications()).map((n) => n.id)).toEqual(["b"]);
    await dismissAllNotifications();
    expect(notificationsMock.presented).toEqual([]);
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
      data: "ExponentPushToken[mock]",
    });

    await act(() => result.current.push.refresh());
    expect(onTokenChange).toHaveBeenCalledTimes(1);

    await act(async () => notificationsMock.rotatePushToken("rotated"));
    await waitFor(() => expect(onTokenChange).toHaveBeenCalledTimes(2));
    expect(onTokenChange).toHaveBeenLastCalledWith({
      type: "expo",
      data: "ExponentPushToken[rotated]",
    });
  });

  it("reports a token failure", async () => {
    const onEvent = jest.fn();
    const error = new Error("simulator");
    notificationsMock.setPermission("granted");
    notificationsMock.failPushToken(error);
    const { result } = await renderHook(() => usePushToken(), {
      wrapper: wrapperWith({ onEvent }),
    });
    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.error).toBe(error);
    expect(onEvent).toHaveBeenCalledWith({ type: "token-error", error });
  });

  it("delivers the launching tap once, though both sources report it", async () => {
    const onResponse = jest.fn();
    const response = buildResponse({
      id: "launch",
      data: { screen: "orders" },
    });
    notificationsMock.setLaunchResponse(response);

    await renderHook(() => null, { wrapper: wrapperWith({ onResponse }) });

    await waitFor(() => expect(onResponse).toHaveBeenCalledTimes(1));
    await act(async () => {
      notificationsMock.tap(response.notification);
    });

    expect(onResponse).toHaveBeenCalledTimes(1);
    expect(onResponse.mock.calls[0][0]).toMatchObject({
      isDefaultAction: true,
      notification: { id: "launch", data: { screen: "orders" } },
    });
    expect(mocked.clearLastNotificationResponseAsync).toHaveBeenCalled();
  });

  it("passes an action and its reply text to onResponse", async () => {
    const onResponse = jest.fn();
    await renderHook(() => null, { wrapper: wrapperWith({ onResponse }) });
    await waitFor(() =>
      expect(notificationsMock.listenerCount("response")).toBe(1),
    );

    await act(async () => {
      notificationsMock.tap(
        { id: "msg" },
        { actionIdentifier: "reply", userText: "On my way" },
      );
    });

    expect(onResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        actionIdentifier: "reply",
        isDefaultAction: false,
        userText: "On my way",
      }),
    );
  });

  it("applies the foreground policy to a delivered notification", async () => {
    const onReceived = jest.fn();
    await renderHook(() => null, {
      wrapper: wrapperWith({ onReceived, foreground: { sound: false } }),
    });
    await waitFor(() =>
      expect(notificationsMock.listenerCount("received")).toBe(1),
    );

    await act(async () => {
      await notificationsMock.deliver({ id: "fg", title: "Hello" });
    });

    expect(notificationsMock.lastPresentation).toMatchObject({
      shouldShowBanner: true,
      shouldPlaySound: false,
    });
    expect(onReceived).toHaveBeenCalledWith(
      expect.objectContaining({ id: "fg", title: "Hello" }),
    );
  });

  it("reports a rejected payload instead of delivering it", async () => {
    const onReceived = jest.fn();
    const onEvent = jest.fn();
    await renderHook(() => null, {
      wrapper: wrapperWith({ onReceived, onEvent, parseData: () => null }),
    });
    await waitFor(() =>
      expect(notificationsMock.listenerCount("received")).toBe(1),
    );

    await act(async () => {
      await notificationsMock.deliver({ id: "bad" });
    });

    expect(onReceived).not.toHaveBeenCalled();
    expect(onEvent).toHaveBeenCalledWith({
      type: "invalid-payload",
      id: "bad",
      error: undefined,
    });
  });

  it("registers categories before the permission prompt", async () => {
    const { result } = await renderHook(() => useNotificationPermission(), {
      wrapper: wrapperWith({
        categories: [
          {
            id: "message",
            actions: [
              { id: "read", title: "Mark as read", opensApp: false },
              {
                id: "reply",
                title: "Reply",
                textInput: {
                  submitButtonTitle: "Send",
                  placeholder: "Message",
                },
              },
            ],
          },
        ],
      }),
    });

    await act(() => result.current.request());

    expect(notificationsMock.categories.message).toEqual([
      {
        identifier: "read",
        buttonTitle: "Mark as read",
        options: {
          opensAppToForeground: false,
          isDestructive: false,
          isAuthenticationRequired: false,
        },
      },
      {
        identifier: "reply",
        buttonTitle: "Reply",
        textInput: { submitButtonTitle: "Send", placeholder: "Message" },
        options: {
          opensAppToForeground: true,
          isDestructive: false,
          isAuthenticationRequired: false,
        },
      },
    ]);
    const categoryCall =
      mocked.setNotificationCategoryAsync.mock.invocationCallOrder[0];
    const requestCall =
      mocked.requestPermissionsAsync.mock.invocationCallOrder[0];
    expect(categoryCall).toBeLessThan(requestCall);
  });

  it("clears the badge on mount and on return to the foreground", async () => {
    let onChange: (state: string) => void = () => {};
    jest
      .spyOn(AppState, "addEventListener")
      .mockImplementation((_, listener) => {
        onChange = listener as (state: string) => void;
        return { remove: () => {} } as ReturnType<
          typeof AppState.addEventListener
        >;
      });
    await setBadgeCount(4);

    await renderHook(() => null, {
      wrapper: wrapperWith({ clearBadgeOnForeground: true }),
    });
    await waitFor(() => expect(notificationsMock.badge).toBe(0));

    await setBadgeCount(2);
    await act(async () => onChange("active"));
    await waitFor(() => expect(notificationsMock.badge).toBe(0));
  });

  it("removes its listeners and handler on unmount", async () => {
    const { unmount } = await renderHook(() => null, {
      wrapper: wrapperWith(),
    });
    await waitFor(() =>
      expect(notificationsMock.listenerCount("response")).toBe(1),
    );

    await unmount();

    expect(notificationsMock.listenerCount("response")).toBe(0);
    expect(mocked.setNotificationHandler).toHaveBeenLastCalledWith(null);
  });
});
