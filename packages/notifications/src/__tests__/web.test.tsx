// jest.mock factories need require(): they run before the static import graph.
/* eslint-disable @typescript-eslint/no-require-imports */
import { act, renderHook, waitFor } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { Platform } from "react-native";

import { usePushToken, useNotificationPermission } from "../hooks";
import {
  NotificationsProvider,
  type NotificationsProviderProps,
} from "../NotificationsProvider";
import { notificationsMock } from "../testing";
import {
  MESSAGE_SOURCE,
  getWebPermission,
  getWebPushToken,
  isWebPushSupported,
  listenToServiceWorker,
  requestWebPermission,
  takeLaunchResponseFromUrl,
  type WebNotification,
} from "../web/webPush";

jest.mock(
  "expo-notifications",
  () => require("../testing").notificationsMock.module,
);
// This file runs the provider as a browser would: no native module.
jest.mock("../support", () => ({
  isNotificationsSupported: false,
  assertSupported: () => {
    throw new Error("not supported on web");
  },
}));

type Listener = (event: { data: unknown }) => void;

/** The browser APIs webPush.ts touches, as small fakes on the global object. */
function installBrowser() {
  const messageListeners: Listener[] = [];
  let subscription: object | null = null;
  const showNotification = jest.fn(async () => {});
  const subscribe = jest.fn(async () => {
    subscription = fakeSubscription("https://push.example/new");
    return subscription;
  });
  const registration = {
    showNotification,
    pushManager: {
      getSubscription: jest.fn(async () => subscription),
      subscribe,
    },
  };
  const notification: {
    permission: NotificationPermission;
    requestPermission: jest.Mock<Promise<NotificationPermission>, []>;
  } = {
    permission: "default",
    requestPermission: jest.fn(async (): Promise<NotificationPermission> => {
      notification.permission = "granted";
      return notification.permission;
    }),
  };
  const replaceState = jest.fn();
  const globals: Record<string, unknown> = {
    window: globalThis,
    Notification: notification,
    PushManager: function PushManager() {},
    navigator: {
      serviceWorker: {
        register: jest.fn(async () => registration),
        ready: Promise.resolve(registration),
        addEventListener: (_: string, listener: Listener) =>
          messageListeners.push(listener),
        removeEventListener: (_: string, listener: Listener) =>
          messageListeners.splice(messageListeners.indexOf(listener), 1),
      },
    },
    location: { hash: "", pathname: "/notifications", search: "" },
    history: { state: null, replaceState },
    document: {
      visibilityState: "visible",
      addEventListener: () => {},
      removeEventListener: () => {},
    },
  };
  const previous = new Map<string, PropertyDescriptor | undefined>();
  for (const [key, value] of Object.entries(globals)) {
    previous.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, {
      value,
      configurable: true,
      writable: true,
    });
  }
  return {
    notification,
    registration,
    showNotification,
    subscribe,
    replaceState,
    setSubscription: (next: object | null) => {
      subscription = next;
    },
    post: (data: unknown) =>
      [...messageListeners].forEach((listener) => listener({ data })),
    messageListenerCount: () => messageListeners.length,
    restore: () => {
      for (const [key, descriptor] of previous) {
        if (descriptor) Object.defineProperty(globalThis, key, descriptor);
        else delete (globalThis as Record<string, unknown>)[key];
      }
    },
  };
}

function fakeSubscription(endpoint: string) {
  return {
    endpoint,
    toJSON: () => ({
      endpoint,
      keys: { p256dh: "p256dh-key", auth: "auth-secret" },
    }),
  };
}

const webNotification = (
  overrides: Partial<WebNotification> = {},
): WebNotification => ({
  id: "web-1",
  date: 1_800_000_000_000,
  title: "Order shipped",
  body: "Tap to open",
  data: { orderId: "42" },
  ...overrides,
});

// "BAQ" is URL-safe base64 for the bytes [4, 4].
const VAPID = "BAQ";

let browser: ReturnType<typeof installBrowser>;

beforeEach(() => {
  jest.clearAllMocks();
  notificationsMock.reset();
  jest.replaceProperty(Platform, "OS", "web");
  browser = installBrowser();
});

afterEach(() => {
  browser.restore();
  jest.restoreAllMocks();
});

describe("webPush helpers", () => {
  it("detects support only on web with the browser APIs present", () => {
    expect(isWebPushSupported()).toBe(true);
    delete (globalThis as Record<string, unknown>).PushManager;
    expect(isWebPushSupported()).toBe(false);
  });

  it("maps the Notification permission", async () => {
    expect(getWebPermission()).toEqual({
      status: "undetermined",
      canAskAgain: true,
    });
    expect(await requestWebPermission()).toEqual({
      status: "granted",
      canAskAgain: false,
    });
    browser.notification.permission = "denied";
    expect(getWebPermission()).toEqual({
      status: "denied",
      canAskAgain: false,
    });
  });

  it("needs a VAPID key to subscribe", async () => {
    await expect(getWebPushToken({})).rejects.toThrow(/vapidPublicKey/);
  });

  it("subscribes with the key when there is no subscription yet", async () => {
    const token = await getWebPushToken({
      vapidPublicKey: VAPID,
      serviceWorkerPath: "/sw.js",
    });
    expect(navigator.serviceWorker.register).toHaveBeenCalledWith(
      "/sw.js",
      undefined,
    );
    expect(browser.subscribe).toHaveBeenCalledWith({
      userVisibleOnly: true,
      applicationServerKey: VAPID,
    });
    expect(token).toEqual({
      type: "web",
      endpoint: "https://push.example/new",
      keys: { p256dh: "p256dh-key", auth: "auth-secret" },
      data: JSON.stringify({
        endpoint: "https://push.example/new",
        keys: { p256dh: "p256dh-key", auth: "auth-secret" },
      }),
    });
  });

  it("reuses an existing subscription", async () => {
    browser.setSubscription(fakeSubscription("https://push.example/existing"));
    const token = await getWebPushToken({ vapidPublicKey: VAPID });
    expect(browser.subscribe).not.toHaveBeenCalled();
    expect(token.type === "web" && token.endpoint).toBe(
      "https://push.example/existing",
    );
  });

  it("only forwards messages from the service worker", () => {
    const push = jest.fn();
    const stop = listenToServiceWorker({
      push,
      click: jest.fn(),
      subscriptionChange: jest.fn(),
    });
    browser.post({
      source: "someone-else",
      type: "push",
      notification: webNotification(),
    });
    browser.post({
      source: MESSAGE_SOURCE,
      type: "push",
      notification: webNotification(),
    });
    expect(push).toHaveBeenCalledTimes(1);
    stop();
    expect(browser.messageListenerCount()).toBe(0);
  });

  it("reads the launching tap from the URL hash once, then clears it", () => {
    const tap = { notification: webNotification(), action: "track" };
    location.hash =
      "#glowup-notification=" + encodeURIComponent(JSON.stringify(tap));
    expect(takeLaunchResponseFromUrl()).toEqual(tap);
    expect(browser.replaceState).toHaveBeenCalledWith(
      null,
      "",
      "/notifications",
    );
  });

  it("ignores other hashes and broken payloads", () => {
    location.hash = "#section-2";
    expect(takeLaunchResponseFromUrl()).toBeNull();
    location.hash = "#glowup-notification=%7Bnot-json";
    expect(takeLaunchResponseFromUrl()).toBeNull();
  });
});

describe("NotificationsProvider on web", () => {
  function wrapperWith(
    props: Omit<NotificationsProviderProps, "children"> = {},
  ) {
    return function Wrapper({ children }: { children: ReactNode }) {
      return (
        <NotificationsProvider webPush={{ vapidPublicKey: VAPID }} {...props}>
          {children}
        </NotificationsProvider>
      );
    };
  }

  it("asks the browser and reports the subscription as the token", async () => {
    const onTokenChange = jest.fn();
    const { result } = await renderHook(
      () => ({ permission: useNotificationPermission(), push: usePushToken() }),
      { wrapper: wrapperWith({ onTokenChange }) },
    );
    await waitFor(() =>
      expect(result.current.permission.status).toBe("undetermined"),
    );

    await act(() => result.current.permission.request());

    await waitFor(() => expect(result.current.push.status).toBe("ready"));
    expect(browser.notification.requestPermission).toHaveBeenCalled();
    expect(onTokenChange).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "web",
        endpoint: "https://push.example/new",
      }),
    );
  });

  it("stays idle without a VAPID key", async () => {
    browser.notification.permission = "granted";
    const { result } = await renderHook(
      () => ({ permission: useNotificationPermission(), push: usePushToken() }),
      { wrapper: wrapperWith({ webPush: {} }) },
    );
    await waitFor(() =>
      expect(result.current.permission.status).toBe("granted"),
    );
    expect(result.current.push.status).toBe("idle");
    expect(browser.subscribe).not.toHaveBeenCalled();
  });

  it("reports unsupported in a browser without the Push API", async () => {
    delete (globalThis as Record<string, unknown>).PushManager;
    const { result } = await renderHook(() => useNotificationPermission(), {
      wrapper: wrapperWith(),
    });
    await waitFor(() => expect(result.current.status).toBe("unsupported"));
  });

  it("applies the foreground policy to a push and calls onReceived", async () => {
    const onReceived = jest.fn();
    await renderHook(() => null, {
      wrapper: wrapperWith({
        onReceived,
        foreground: { banner: false, list: false },
      }),
    });
    await waitFor(() => expect(browser.messageListenerCount()).toBe(1));

    await act(async () => {
      browser.post({
        source: MESSAGE_SOURCE,
        type: "push",
        notification: webNotification(),
      });
    });

    expect(onReceived).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "web-1",
        title: "Order shipped",
        data: { orderId: "42" },
      }),
    );
    expect(browser.showNotification).not.toHaveBeenCalled();
  });

  it("does not try to show a push without the permission", async () => {
    const onReceived = jest.fn();
    await renderHook(() => null, { wrapper: wrapperWith({ onReceived }) });
    await waitFor(() => expect(browser.messageListenerCount()).toBe(1));

    await act(async () => {
      browser.post({
        source: MESSAGE_SOURCE,
        type: "push",
        notification: webNotification(),
      });
    });

    expect(onReceived).toHaveBeenCalled();
    expect(browser.showNotification).not.toHaveBeenCalled();
  });

  it("shows the push when the policy allows it", async () => {
    browser.notification.permission = "granted";
    await renderHook(() => null, { wrapper: wrapperWith() });
    await waitFor(() => expect(browser.messageListenerCount()).toBe(1));

    await act(async () => {
      browser.post({
        source: MESSAGE_SOURCE,
        type: "push",
        notification: webNotification(),
      });
    });

    await waitFor(() =>
      expect(browser.showNotification).toHaveBeenCalledWith(
        "Order shipped",
        expect.objectContaining({ body: "Tap to open", tag: "web-1" }),
      ),
    );
  });

  it("delivers a tap with its action once", async () => {
    const onResponse = jest.fn();
    await renderHook(() => null, { wrapper: wrapperWith({ onResponse }) });
    await waitFor(() => expect(browser.messageListenerCount()).toBe(1));

    const click = {
      source: MESSAGE_SOURCE,
      type: "click",
      notification: webNotification({ id: "tap-1" }),
      action: "track",
    };
    await act(async () => {
      browser.post(click);
      browser.post(click);
    });

    expect(onResponse).toHaveBeenCalledTimes(1);
    expect(onResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        actionIdentifier: "track",
        isDefaultAction: false,
      }),
    );
  });

  it("delivers the tap that opened the tab", async () => {
    const onResponse = jest.fn();
    location.hash =
      "#glowup-notification=" +
      encodeURIComponent(
        JSON.stringify({
          notification: webNotification({ id: "launch" }),
          action: "",
        }),
      );

    await renderHook(() => null, { wrapper: wrapperWith({ onResponse }) });

    await waitFor(() => expect(onResponse).toHaveBeenCalledTimes(1));
    expect(onResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        isDefaultAction: true,
        notification: expect.objectContaining({ id: "launch" }),
      }),
    );
  });

  it("subscribes again when the service worker reports a rotation", async () => {
    browser.notification.permission = "granted";
    const onTokenChange = jest.fn();
    await renderHook(() => null, { wrapper: wrapperWith({ onTokenChange }) });
    await waitFor(() => expect(onTokenChange).toHaveBeenCalledTimes(1));

    browser.setSubscription(fakeSubscription("https://push.example/rotated"));
    await act(async () => {
      browser.post({ source: MESSAGE_SOURCE, type: "subscription-change" });
    });

    await waitFor(() => expect(onTokenChange).toHaveBeenCalledTimes(2));
    expect(onTokenChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ endpoint: "https://push.example/rotated" }),
    );
  });
});
